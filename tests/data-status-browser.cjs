const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin=process.env.TEST_ORIGIN||'http://localhost:3100';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/data-status.html');
  await page.waitForFunction(()=>!document.querySelector('#refreshStatus').disabled);
  const manifest=await (await page.request.get(origin+'/data/dementia/manifest.json')).json();
  assert.match(await page.locator('#metrics').innerText(),new RegExp(String(manifest.count)));
  assert.equal(await page.locator('#sourceRows tr').count(),2);
  assert.match(await page.locator('#sourceRows').innerText(),new RegExp(manifest.sources.nmc.sourceDate));
  const live={collection:await page.locator('#collectionRuns').innerText(),deployment:await page.locator('#deploymentRuns').innerText()};
  fs.mkdirSync('test-results',{recursive:true});
  await page.screenshot({path:'test-results/data-status-desktop.png',fullPage:true});
  for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.screenshot({path:'test-results/data-status-mobile.png',fullPage:true});
  await page.route('https://api.github.com/**',r=>r.fulfill({status:403,contentType:'application/json',body:'{}'}));
  await page.locator('#refreshStatus').click();await page.waitForFunction(()=>!document.querySelector('#refreshStatus').disabled);
  assert.match(await page.locator('#collectionRuns').innerText(),/실행 상태 미확인/);
  assert.match(await page.locator('#metrics').innerText(),new RegExp(String(manifest.count)));
  await page.route('**/data/dementia/manifest.json',r=>r.fulfill({status:503,body:'unavailable'}));
  await page.locator('#refreshStatus').click();await page.waitForFunction(()=>!document.querySelector('#refreshStatus').disabled);
  assert.match(await page.locator('#publishedNote').innerText(),/자료 확인 실패/);assert.equal(await page.locator('.status-metric').count(),0);
  await page.unroute('**/data/dementia/manifest.json');await page.locator('#refreshStatus').click();await page.waitForFunction(()=>!document.querySelector('#refreshStatus').disabled);
  assert.equal(await page.locator('.status-metric').count(),3);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({checks:['실제 매니페스트와 화면 수치 일치','데스크톱·390px·320px 가로 넘침 없음','GitHub 실패 시 자료 유지','자료 실패 시 이전 수치 제거·재시도 복구','런타임 오류 없음'],live},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
