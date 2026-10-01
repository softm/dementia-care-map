/* 실제 HTTP 서버와 Chrome을 사용하는 전체 사용자 흐름 검사. PLAYWRIGHT_MODULE로 도구 경로를 지정할 수 있다. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3100';
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1000},geolocation:{latitude:37.4785,longitude:126.8644},permissions:['geolocation']});
  const page=await context.newPage();const errors=[],dataRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/data/'))dataRequests.push(r.url());});
  const checks=[];
  try{
    await page.goto(origin);await page.locator('.center-card').first().waitFor();
    const total=Number(await page.locator('#count').innerText());assert.ok(total>250);
    const expected=await (await context.request.get(origin+'/data/dementia/manifest.json')).json();assert.equal(total,expected.count);
    assert.equal(dataRequests.length,2);assert.ok(dataRequests.every(u=>new URL(u).origin===origin));checks.push('초기 데이터 요청 2개, 자체 Origin');
    await page.waitForFunction(()=>[...document.querySelectorAll('.leaflet-tile')].some(i=>i.complete&&i.naturalWidth>0));checks.push('실제 배경 지도 로딩');
    assert.ok(await page.locator('.cluster').count()>0);checks.push('전국 마커 묶음');
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
    await page.locator('.leaflet-marker-icon').first().click();await page.locator('#shareCenter').waitFor();await page.locator('#closeDetail').click();checks.push('마커 상세 열기·Esc 닫기');
    await page.goto(origin+'/?center='+id);await page.locator('#shareCenter').waitFor();assert.equal(new URL(page.url()).searchParams.get('center'),id);checks.push('센터 직접 공유 복원');
    await page.locator('#closeDetail').click();await page.locator('#reset').click();
    await page.locator('#locate').click();await page.waitForFunction(()=>document.querySelector('#locate').disabled===false);assert.match(await page.locator('#sortLabel').innerText(),/직선거리/);checks.push('허용된 현재위치 검색');
    await page.locator('#reset').click();await page.locator('#q').fill('검색결과가없는기관xyz');await page.locator('#searchForm').evaluate(f=>f.requestSubmit());await page.locator('#emptyReset').waitFor();await page.locator('#emptyReset').click();assert.equal(Number(await page.locator('#count').innerText()),total);checks.push('빈 결과·초기화 복구');
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert.equal(Number(await page.locator('#count').innerText()),total);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('#mobileToggle').click();assert.ok(await page.locator('body.list-expanded').count());
    await page.locator('.center-card').first().click();await page.locator('#shareCenter').waitFor();
    const box=await page.locator('#detailDialog').boundingBox();assert.ok(box.x>=0&&box.width<=390&&box.y>=0&&box.y+box.height<=845);await page.screenshot({path:'test-results/mobile-detail.png'});await page.locator('#closeDetail').click();await page.locator('#mobileToggle').click();assert.equal(Number(await page.locator('#count').innerText()),total);await page.screenshot({path:'test-results/mobile.png'});checks.push('모바일 390px 가로 넘침 없음·상세·목록 전환');
    const failure=await context.newPage();await failure.route('**/data/dementia/manifest.json',route=>route.fulfill({status:503,body:'unavailable'}));await failure.goto(origin);await failure.locator('#retry').waitFor();assert.match(await failure.locator('#results').innerText(),/503/);await failure.unroute('**/data/dementia/manifest.json');await failure.locator('#retry').click();await failure.locator('.center-card').first().waitFor();await failure.close();checks.push('데이터 실패를 빈 결과와 구분·재시도');
    const denied=await browser.newContext({viewport:{width:390,height:844}});await denied.addInitScript(()=>{navigator.geolocation.getCurrentPosition=(_ok,fail)=>fail({code:1});});const deniedPage=await denied.newPage();await deniedPage.goto(origin);await deniedPage.locator('.center-card').first().waitFor();await deniedPage.locator('#locate').click();assert.match(await deniedPage.locator('#toast').innerText(),/차단/);await denied.close();checks.push('위치 권한 거부 안내');
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
