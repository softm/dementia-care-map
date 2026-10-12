const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3100';

const details=fs.readdirSync('data/dementia/details').map(name=>JSON.parse(fs.readFileSync(path.join('data/dementia/details',name),'utf8')));
const center=details.find(item=>item.phone);

(async()=>{
 assert.ok(center);assert.ok(details.every(item=>!('supportTags' in item)&&!('supportEvidence' in item)));
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();const requests=[];page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/data/'))requests.push(request.url());});
 try{
  await page.goto(origin+'/?mode=list');await page.locator('.center-card').first().waitFor();
  try{
   await page.locator('.welcome-ad-close').waitFor({state:'visible',timeout:5000});
   await page.locator('.welcome-ad-close').click();
  }catch{}
  assert.equal(requests.length,2);assert.equal(await page.locator('.home-support-list,.support-status-card,.support-evidence-trigger').count(),0);
  assert.match(await page.locator('.home-support').innerText(),/센터별 지원 제공 여부를 표시하지 않습니다.*센터별 공개 데이터가 없으므로/s);
  assert.equal((await page.locator('.home-support a').first().getAttribute('href')).startsWith('tel:18999988'),true);assert.equal(new URL(await page.locator('.home-support .support-guide-link, .home-support a[target="_blank"]').getAttribute('href')).hostname,'www.nid.or.kr');
  await page.locator('#q').fill('광명');await page.locator('#searchForm').evaluate(form=>form.requestSubmit());assert.match(await page.locator('.center-card').first().innerText(),/광명/);
  await page.locator('[data-mode="map"]').click();await page.waitForFunction(()=>document.querySelector('#map img'));assert.ok(await page.locator('.map-pin').count()>0);await page.locator('[data-mode="list"]').click();await page.locator('#reset').click();
  await page.locator('#guideOpen').click();await page.locator('#guideSupport').waitFor();assert.match(await page.locator('#guideSupport').innerText(),/판정할 수 있는 공개 데이터가 없어.*제공·미제공 상태를 표시하지 않습니다/s);assert.equal(await page.locator('#guideSupport .support-actions a').count(),2);await page.locator('#closeGuide').click();
  await page.goto(`${origin}/?mode=list&center=${center.id}`);await page.locator('#detailBody .support-inquiry').waitFor();
  assert.match(await page.locator('#detailBody .support-inquiry').innerText(),/센터별 지원 제공 여부를 표시하지 않습니다.*센터별 공개 데이터가 없으며/s);
  assert.equal(await page.locator('.support-status-card,.support-evidence-trigger').count(),0);
  assert.equal(new URL(await page.locator('#detailBody .support-inquiry .support-guide-link').getAttribute('href')).hostname,'www.nid.or.kr');assert.equal((await page.locator('#detailBody .support-inquiry .support-call').getAttribute('href')).startsWith('tel:'),true);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.setViewportSize({width:320,height:900});await page.evaluate(()=>document.body.classList.add('large-text'));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>document.body.classList.remove('large-text'));await page.setViewportSize({width:1440,height:1000});
  await page.setViewportSize({width:390,height:844});await page.locator('#detailDialog').evaluate(dialog=>dialog.scrollTop=0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#closeDetail').click();await page.locator('#largeText').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log(JSON.stringify({center:center.id,checks:['초기 요청 2개','센터별 판정 제거','공개 데이터 한계 명시','검색·실제 지도·상세','공식 링크·전화','모바일·큰글씨']},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
