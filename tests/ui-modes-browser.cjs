const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const origin=process.env.TEST_ORIGIN||'http://localhost:3100';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});const errors=[],checks=[];
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{window.geoCalls=0;navigator.geolocation.getCurrentPosition=(_ok,fail)=>{window.geoCalls++;fail({code:1});};});
 const page=await context.newPage();const requests=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(origin+'/?mode=list');await page.locator('.center-card').first().waitFor();
  assert.equal(await page.evaluate(()=>window.geoCalls),0);assert.ok(!requests.some(url=>url.includes('maps.js')));assert.ok(!requests.some(url=>url.includes('ba.min.js')));assert.equal(await page.locator('[data-mode=list]').getAttribute('aria-pressed'),'true');
  assert.equal(Number(await page.locator('#count').innerText()),318);assert.equal(await page.locator('.center-card').count(),40);checks.push('목록 직접 진입은 지도 SDK·위치·개발 광고 요청 없음');
  fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/list-desktop.png'});
  await page.locator('#q').fill('광명');await page.locator('#searchForm').evaluate(el=>el.requestSubmit());assert.match(await page.locator('.center-card').first().innerText(),/광명/);
  await page.locator('.card-open').first().click();await page.locator('#shareCenter').waitFor();
  for(const key of ['programs','care','sources','basic'])assert.equal(await page.locator('#detailPanel-'+key).isVisible(),true);
  await page.screenshot({path:'test-results/detail-desktop.png'});await page.locator('#closeDetail').click();checks.push('상세 연속 읽기·전체 항목·닫기');
  await page.locator('[data-mode=map]').click();await page.waitForFunction(()=>!!document.querySelector('#map img'));assert.equal(await page.locator('#q').inputValue(),'광명');assert.equal(await page.evaluate(()=>window.geoCalls),0);assert.ok(requests.some(url=>url.includes('maps.js')));await page.screenshot({path:'test-results/map-desktop-ui.png'});
  await page.locator('[data-mode=list]').click();assert.equal(await page.locator('#q').inputValue(),'광명');assert.equal(new URL(page.url()).searchParams.get('mode'),'list');checks.push('지도 최초 진입 시 지연 로딩·모드 간 검색 유지');
  await page.locator('#reset').click();await page.locator('#more').click();assert.equal(await page.locator('.center-card').count(),80);assert.equal(await page.locator('#results [data-placement=inline]').count(),1);checks.push('더 보기·목록 광고 1개 유지');
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`test-results/list-mobile-${width}.png`});
   await page.locator('.card-open').first().click();await page.locator('#shareCenter').waitFor();await page.locator('#detailPanel-sources').scrollIntoViewIfNeeded();const box=await page.locator('#detailDialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);await page.screenshot({path:`test-results/detail-mobile-${width}.png`});await page.locator('#closeDetail').click();
  }checks.push('390px·320px 목록·팝업 가로 넘침 없음');
  await page.setViewportSize({width:390,height:844});await page.locator('#q').fill('광명');await page.locator('#searchForm').evaluate(el=>el.requestSubmit());await page.locator('#navMap').click();await page.waitForFunction(()=>document.body.dataset.careMode==='map');await page.screenshot({path:'test-results/map-mobile-ui.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,errors},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
