const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3100';

const details=fs.readdirSync('data/dementia/details').map(name=>JSON.parse(fs.readFileSync(path.join('data/dementia/details',name),'utf8')));
const confirmed=details.find(center=>center.phone&&center.supportTags.length>=3);
const unknown=details.find(center=>center.phone&&!center.supportTags.length);

(async()=>{
 assert.ok(confirmed&&unknown);
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();const requests=[];page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/data/'))requests.push(request.url());});
 try{
  await page.goto(origin+'/?mode=list');await page.locator('.center-card').first().waitFor();
  try{
   await page.locator('.welcome-ad-close').waitFor({state:'visible',timeout:5000});
   await page.locator('.welcome-ad-close').click();
  }catch{}
  assert.equal(requests.length,2);assert.equal(await page.locator('.home-support-list span').count(),5);
  await page.locator('#homeSupportGuide').click();await page.locator('#guideSupport').waitFor();assert.equal(await page.locator('#guideSupport .guide-support-cards article').count(),5);await page.locator('#closeGuide').click();
  await page.goto(`${origin}/?mode=list&center=${confirmed.id}`);await page.locator('.support-status-list').waitFor();
  assert.equal(await page.locator('.support-status-card').count(),5);assert.equal(await page.locator('.support-status-card.confirmed').count(),confirmed.supportTags.length);
  assert.match(await page.locator('.support-status-card.confirmed').first().innerText(),/원문 확인.*기준일/s);
  assert.equal(new URL(await page.locator('.support-guide-link').getAttribute('href')).hostname,'www.nid.or.kr');assert.equal((await page.locator('.support-call').getAttribute('href')).startsWith('tel:'),true);
  await page.goto(`${origin}/?mode=list&center=${unknown.id}`);await page.locator('.support-status-list').waitFor();assert.equal(await page.locator('.support-status-card.confirmed').count(),0);assert.equal(await page.locator('.support-status-card.unknown').count(),5);assert.match(await page.locator('.support-status-list').innerText(),/미제공을 뜻하지 않습니다/);
  await page.setViewportSize({width:390,height:844});await page.locator('#detailDialog').evaluate(dialog=>dialog.scrollTop=0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#closeDetail').click();await page.locator('#largeText').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log(JSON.stringify({confirmed:confirmed.id,unknown:unknown.id,checks:['초기 요청 2개','홈 5종','확인·미확인 상태','공식 링크·전화','모바일·큰글씨']},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
