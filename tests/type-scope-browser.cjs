const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const origin=process.env.TEST_ORIGIN||'http://localhost:3100';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext({geolocation:{latitude:37.4785,longitude:126.8644},permissions:['geolocation']});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const view=()=>page.evaluate(()=>{const p=new URL(location.href).searchParams;return ['lat','lng','z','scope'].map(k=>p.get(k));});
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:844});
   await page.goto(origin);await page.waitForFunction(()=>document.querySelector('#sortLabel').textContent==='직선거리순');
   await page.waitForTimeout(300);
   const before=await view();assert.equal(before[3],'map');
   for(const type of ['regional','branch','center','']){
    await page.locator(`[data-type="${type}"]`).click();await page.waitForTimeout(150);
    assert.deepEqual(await view(),before);
    assert.match(await page.locator('#scopeNote').innerText(),/현재 지도 영역/);
    assert.equal(await page.locator(`[data-type="${type}"]`).getAttribute('aria-pressed'),'true');
    if(type)assert.equal(await page.locator(`.center-card .badge:not(.${type})`).count(),0);
   }
   await page.goto(origin+'/?lat=37.5&lng=127&z=15');await page.locator('#count').filter({hasText:/\d/}).waitFor();await page.waitForTimeout(300);
   const shared=await view();await page.locator('[data-type="branch"]').click();assert.deepEqual(await view(),shared);
  }
  const late=await context.newPage();
  await late.addInitScript(()=>{navigator.geolocation.getCurrentPosition=ok=>{window.deliverLocation=()=>ok({coords:{latitude:37.4785,longitude:126.8644}});};});
  await late.goto(origin);await late.locator('.center-card').first().waitFor();await late.locator('[data-type="branch"]').click();
  await late.evaluate(()=>window.deliverLocation());await late.waitForFunction(()=>document.querySelector('#sortLabel').textContent==='직선거리순');
  assert.equal(new URL(late.url()).searchParams.get('type'),'branch');
  assert.equal(new URL(late.url()).searchParams.get('scope'),'map');assert.deepEqual(errors,[]);
  console.log('유형 전환: 데스크톱·모바일 현재 위치/배율/지도 범위 유지, 공유 위치 보존, 대기 중 위치 수신 유지 통과');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
