const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const url=process.env.SITE_URL||'http://localhost:3100/';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();const errors=[],details=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/dementia/details/'))details.push(r.url());});
const shot=async name=>page.screenshot({path:`test-results/review-${name}.png`});
const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'가로 넘침 없음');
const clickTarget=async selector=>assert.ok(await page.locator(selector).evaluate(el=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));}),selector+' 가림 없음');
try{
 await page.goto(url+'?mode=list');await page.locator('.center-card').first().waitFor();assert.equal(details.length,0,'선택 전 상세 요청 없음');await page.locator('.bottom-ad-toggle').click();await shot('home-390');
 await page.locator('#q').fill('광명');await page.locator('#searchForm').evaluate(el=>el.requestSubmit());await page.locator('.card-open').first().scrollIntoViewIfNeeded();await shot('results-390');assert.ok((await page.locator('.card-heading').first().innerText()).includes('광명'));
 await page.locator('.save-center').first().click();assert.equal(await page.locator('.save-center').first().getAttribute('aria-pressed'),'true');await page.reload();await page.locator('.center-card').first().waitFor();assert.equal(await page.locator('.save-center').first().getAttribute('aria-pressed'),'true');assert.equal(details.length,0);
 await page.locator('#navSaved').click();assert.equal(await page.locator('.center-card').count(),1);await page.locator('#navSaved').click();
 for(const width of [390,320,768,1440]){
  await page.setViewportSize({width,height:900});await noOverflow();
  if(width<=760)await page.locator('#navMap').click();else await page.locator('[data-mode=map]').click();
  await page.waitForFunction(()=>!!document.querySelector('#map img'));await page.waitForTimeout(400);await noOverflow();
  if(width<=760){assert.equal(await page.locator('.header').isVisible(),false);for(const id of ['locate','zoomIn','zoomOut','mapLayer','fit'])await clickTarget('#'+id);await page.locator('#mapLayer').click();assert.equal(await page.locator('#mapLayer').getAttribute('aria-pressed'),'true');await page.locator('#mapLayer').click();await page.locator('#filterToggle').click();assert.equal(await page.locator('#province').isVisible(),true);await page.locator('#filterToggle').click();await page.locator('#mobileToggle').focus();await page.keyboard.press('Home');assert.equal(await page.locator('body').getAttribute('data-mobile-sheet'),'list');await page.keyboard.press('ArrowDown');assert.equal(await page.locator('body').getAttribute('data-mobile-sheet'),'split');}
  await shot('map-'+width);
  await page.locator('.card-open').first().click();await page.locator('#shareCenter').waitFor();assert.match(await page.locator('.detail-actions .call').getAttribute('href'),/^tel:/);assert.ok(await page.locator('#detailDialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await shot('detail-'+width);assert.equal(await page.locator('.visit-checks').count(),1);await page.locator('#closeDetail').click();
  if(width<=760){await page.locator('#navHome').click();await page.locator('#largeText').click();}else{await page.locator('[data-mode=list]').click();if(await page.locator('#largeText').getAttribute('aria-pressed')!=='true')await page.locator('#largeText').click();}
  await noOverflow();await shot('large-'+width);await page.locator('#largeText').click();
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#guideOpen').click();await page.locator('.guide-feedback').scrollIntoViewIfNeeded();await shot('guide-feedback');await page.locator('#guideLargeText').click();await page.locator('#guideDialog').evaluate(el=>el.scrollTop=0);await shot('guide-large');assert.ok(await page.locator('#guideDialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await page.locator('#closeGuide').click();await page.reload();await page.locator('.center-card').first().waitFor();assert.equal(await page.locator('#largeText').getAttribute('aria-pressed'),'true');await page.locator('#largeText').click();
 await page.locator('#navMap').click();await page.locator('.bottom-ad-toggle').click();await page.waitForTimeout(300);await noOverflow();await clickTarget('#navHome');await clickTarget('.center-card:first-child [data-card-call]');await clickTarget('.center-card:first-child .card-actions a');for(const id of ['locate','zoomIn','zoomOut','mapLayer','fit'])await clickTarget('#'+id);await shot('map-ad-expanded');await page.locator('.bottom-ad-toggle').click();
 assert.deepEqual(errors,[]);console.log('홈·실제 검색·상세 지연 로딩·즐겨찾기 세션·실제 네이버 지도·필터·4단계 시트·길찾기·큰글씨·오류안내·광고·320/390/768/1440px 검증 통과');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
