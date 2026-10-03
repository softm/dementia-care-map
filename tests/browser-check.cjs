/* 실제 HTTP 서버와 Chrome을 사용하는 전체 사용자 흐름 검사. PLAYWRIGHT_MODULE로 도구 경로를 지정할 수 있다. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin=process.env.TEST_ORIGIN||'http://localhost:3100';
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1000},geolocation:{latitude:37.4785,longitude:126.8644},permissions:['geolocation']});
  const page=await context.newPage();const errors=[],dataRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/data/'))dataRequests.push(r.url());});
  const checks=[];
  try{
    await page.goto(origin);await page.waitForFunction(()=>document.querySelector('#sortLabel').textContent==='직선거리순');assert.ok(Math.abs(Number(new URL(page.url()).searchParams.get('lat'))-37.4785)<0.001);await page.locator('#reset').click();await page.locator('.center-card').first().waitFor();
    const total=Number(await page.locator('#count').innerText());assert.ok(total>250);
    const expected=await (await context.request.get(origin+'/data/dementia/manifest.json')).json();assert.equal(total,expected.count);
    assert.equal(dataRequests.length,2);assert.ok(dataRequests.every(u=>new URL(u).origin===origin));checks.push('초기 데이터 요청 2개, 자체 Origin');
    await page.waitForFunction(()=>[...document.querySelectorAll('#map img')].some(i=>/map.naver.net/.test(i.src)&&i.complete&&i.naturalWidth>0));checks.push('실제 배경 지도 로딩');
    assert.ok(await page.locator('.map-pin').count()>0);checks.push('네이버 지도·자동 현재 위치·전국 마커');
    fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/desktop.png'});
    await page.locator('[data-type="regional"]').click();assert.equal(Number(await page.locator('#count').innerText()),expected.types.regional);
    await page.locator('[data-type="branch"]').click();assert.equal(Number(await page.locator('#count').innerText()),expected.types.branch);checks.push('광역센터·분소 필터');
    await page.locator('#reset').click();await page.locator('#q').fill('광명');await page.locator('#searchForm').evaluate(f=>f.requestSubmit());
    assert.ok(Number(await page.locator('#count').innerText())>=1);assert.match(await page.locator('.center-card').first().innerText(),/광명/);
    const id=await page.locator('.center-card').first().getAttribute('data-id');
    await page.locator('.center-card').first().click();await page.locator('#shareCenter').waitFor();
    assert.equal(await page.locator('.map-pin.active').count(),1);assert.ok(await page.locator('.source-list li').count()>=1);
    assert.equal(dataRequests.filter(u=>u.includes('/details/')).length,1);checks.push('목록·마커 연동, 상세만 지연 로딩');
    const link=await page.locator('.care-links a').first().getAttribute('href');assert.equal(new URL(link).hostname,'homecare.designboard.net');assert.ok(new URL(link).searchParams.has('lat'));checks.push('주변 돌봄기관 좌표 연결');
    await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
    await page.locator('.map-pin').first().click();await page.locator('#shareCenter').waitFor();await page.locator('#closeDetail').click();checks.push('마커 상세 열기·Esc 닫기');
    await page.goto(origin+'/?center='+id);await page.locator('#shareCenter').waitFor();assert.equal(new URL(page.url()).searchParams.get('center'),id);checks.push('센터 직접 공유 복원');
    await page.locator('#closeDetail').click();await page.locator('#reset').click();
    await page.locator('#locate').click();await page.waitForFunction(()=>document.querySelector('#locate').disabled===false);assert.match(await page.locator('#sortLabel').innerText(),/직선거리/);checks.push('허용된 현재위치 검색');
    await page.locator('#reset').click();await page.locator('#q').fill('검색결과가없는기관xyz');await page.locator('#searchForm').evaluate(f=>f.requestSubmit());await page.locator('#emptyReset').waitFor();await page.locator('#emptyReset').click();assert.equal(Number(await page.locator('#count').innerText()),total);checks.push('빈 결과·초기화 복구');
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert.equal(Number(await page.locator('#count').innerText()),total);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(await page.locator('#mobileToggle').getAttribute('aria-expanded')==='false')await page.locator('#mobileToggle').click();assert.ok(await page.locator('body.list-expanded').count());
    await page.locator('.center-card').first().click();await page.locator('#shareCenter').waitFor();
    const box=await page.locator('#detailDialog').boundingBox();assert.ok(box.x>=0&&box.width<=390&&box.y>=0&&box.y+box.height<=845);await page.screenshot({path:'test-results/mobile-detail.png'});await page.locator('#closeDetail').click();await page.locator('#mobileToggle').click();assert.equal(Number(await page.locator('#count').innerText()),total);await page.screenshot({path:'test-results/mobile.png'});checks.push('모바일 390px 가로 넘침 없음·상세·목록 전환');
    const failure=await context.newPage();await failure.route('**/data/dementia/manifest.json',route=>route.fulfill({status:503,body:'unavailable'}));await failure.goto(origin);await failure.locator('#retry').waitFor();assert.match(await failure.locator('#results').innerText(),/503/);await failure.unroute('**/data/dementia/manifest.json');await failure.locator('#retry').click();await failure.locator('.center-card').first().waitFor();await failure.close();checks.push('데이터 실패를 빈 결과와 구분·재시도');
    const denied=await browser.newContext({viewport:{width:390,height:844}});await denied.addInitScript(()=>{navigator.geolocation.getCurrentPosition=(_ok,fail)=>fail({code:1});});const deniedPage=await denied.newPage();await deniedPage.goto(origin);await deniedPage.locator('.center-card').first().waitFor({state:'attached'});await deniedPage.locator('.care-location-notice[open]').waitFor();assert.match(await deniedPage.locator('.care-location-notice strong').innerText(),/차단/);await deniedPage.locator('[data-location-search]').click();assert.equal(await deniedPage.locator('.care-location-notice[open]').count(),0);await denied.close();checks.push('위치 권한 거부 안내');
    const delayed=await browser.newContext({viewport:{width:390,height:844}});
    await delayed.addInitScript(()=>{window.geoCalls=0;navigator.geolocation.getCurrentPosition=ok=>{window.geoCalls++;window.deliverLocation=()=>ok({coords:{latitude:37.4785,longitude:126.8644}});};});
    const late=await delayed.newPage();await late.goto(origin);await late.waitForFunction(()=>!!window.deliverLocation&&document.querySelector('#count').textContent!=='—'&&document.querySelector('#map img'));
    await late.locator('#q').fill('광명');await late.locator('#searchForm').evaluate(f=>f.requestSubmit());const searchURL=late.url();await late.evaluate(()=>window.deliverLocation());await late.waitForFunction(()=>!document.querySelector('#locate').disabled);assert.equal(late.url(),searchURL);assert.equal(await late.locator('#q').inputValue(),'광명');checks.push('늦은 위치 응답이 검색을 덮지 않음');
    await late.goto(origin+'/?lat=37.5&lng=127&z=13');await late.waitForFunction(()=>document.querySelector('#count').textContent!=='—'&&document.querySelector('#map img'));await late.evaluate(()=>window.deliverLocation?.());assert.equal(Number(new URL(late.url()).searchParams.get('lat')),37.5);checks.push('초기 권한 허용 뒤에도 공유 지도 위치 보존');
    await late.locator('#mobileToggle').focus();await late.keyboard.press('End');await late.waitForFunction(()=>document.getElementById('mobileResultsSheet').getBoundingClientRect().height<=45);const mapBox=await late.locator('#map').boundingBox();await late.mouse.move(mapBox.x+mapBox.width/2,mapBox.y+mapBox.height/2);await late.mouse.down();await late.mouse.move(mapBox.x+mapBox.width/2+70,mapBox.y+mapBox.height/2+20,{steps:8});await late.mouse.up();await late.waitForFunction(()=>Number(new URL(location.href).searchParams.get('lat'))!==37.5);assert.match(await late.locator('#scopeNote').innerText(),/현재 지도 영역/);checks.push('모바일 지도 이동 후 영역 재검색');await delayed.close();
    for(const permission of ['prompt','granted','denied']){
      const startup=await browser.newContext({viewport:{width:390,height:844}});
      await startup.addInitScript(permission=>{
        navigator.permissions.query=async()=>({state:permission,addEventListener(){}});
        window.geoCalls=0;
        navigator.geolocation.getCurrentPosition=(ok,fail)=>{window.geoCalls++;if(permission==='denied')fail({code:1});else window.deliverLocation=()=>ok({coords:{latitude:37.4785,longitude:126.8644}});};
      },permission);
      const early=await startup.newPage();early.on('pageerror',e=>errors.push(e.message));let release;
      const gate=new Promise(resolve=>release=resolve);
      await early.route('**/data/dementia/manifest.json',async route=>{await gate;await route.continue();});
      await early.goto(origin);await early.waitForFunction(()=>window.geoCalls===1);
      assert.equal(await early.locator('#count').innerText(),'—');assert.equal(await early.locator('#map img').count(),0);
      if(permission==='denied'){
        await early.locator('.care-location-notice[open]').waitFor();assert.match(await early.locator('.care-location-notice strong').innerText(),/차단/);
        await early.screenshot({path:'test-results/mobile-location-denied.png'});
        await early.locator('[data-location-search]').click();
      }else await early.evaluate(()=>window.deliverLocation());
      release();await early.waitForFunction(()=>document.querySelector('#count').textContent!=='—');
      if(permission!=='denied'){
        await early.waitForFunction(()=>document.querySelector('.current-position-pin')&&new URL(location.href).searchParams.get('lat')==='37.478500');
        assert.equal(new URL(early.url()).searchParams.get('scope'),'map');assert.match(await early.locator('#sortLabel').innerText(),/직선거리/);
        await early.waitForFunction(()=>[...document.querySelectorAll('#map img')].some(i=>/map.naver.net/.test(i.src)&&i.naturalWidth>0));
        await early.screenshot({path:`test-results/mobile-location-${permission}.png`});
      }
      assert.equal(await early.evaluate(()=>window.geoCalls),1);await startup.close();
    }
    checks.push('권한 미결정·허용·차단 모두 데이터 로딩 전 요청, 중복 없음, 먼저 받은 위치로 지도 조회');
    if(process.env.MASTER_ORIGIN){
      const master=await context.newPage();const target='https://dementia.designboard.net/';
      await context.route(target+'**',route=>route.fulfill({status:200,contentType:'text/html',body:'연결 검증'}));
      await master.goto(process.env.MASTER_ORIGIN+'/?type=dementia&mode=list&p='+encodeURIComponent('경기도')+'&c='+encodeURIComponent('광명시'));
      await master.locator('#dementiaServiceLink').waitFor({state:'attached'});
      await master.locator('#welcomeAdClose').click();
      await master.locator('.care-menu-trigger').click();
      const popupPromise=context.waitForEvent('page');await master.locator('#dementiaServiceLink').click();const popup=await popupPromise;await popup.waitForLoadState();
      const targetURL=new URL(popup.url());assert.equal(targetURL.hostname,'dementia.designboard.net');assert.equal(targetURL.searchParams.get('p'),'경기도');assert.equal(targetURL.searchParams.get('c'),'광명시');
      await popup.close();await master.close();await context.unroute(target+'**');checks.push('기존 돌봄한눈 메뉴에서 선택 지역을 치매안심으로 전달');
    }
    assert.deepEqual(errors,[]);checks.push('JavaScript 런타임 오류 없음');
    const report={total,checks,dataRequests:dataRequests.length,errors};fs.writeFileSync('test-results/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
