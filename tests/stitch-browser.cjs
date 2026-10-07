const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:3100/?mode=list');await page.locator('.center-card').first().waitFor();assert.equal(await page.locator('.brand img').getAttribute('src'),'stitch-logo.svg?v=20261007-copper');
 await page.locator('.bottom-ad-toggle').click();await page.screenshot({path:'test-results/stitch-desktop.png'});
 await page.locator('#q').fill('광명');await page.locator('#searchForm').evaluate(n=>n.requestSubmit());await page.locator('.center-card').first().scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/stitch-results-desktop.png'});
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await page.locator('#largeText').click();assert.equal(await page.locator('#largeText').getAttribute('aria-pressed'),'true');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.reload();await page.locator('.center-card').first().waitFor();assert.equal(await page.locator('#largeText').getAttribute('aria-pressed'),'true');
  await page.locator('.card-open').first().click();await page.locator('.detail-actions .call').waitFor();assert.match(await page.locator('.detail-actions .call').getAttribute('href'),/^tel:/);assert.match(await page.locator('.detail-actions a[href*="map.naver.com"]').getAttribute('href'),/^https:\/\/map.naver.com/);
  assert.ok(await page.locator('#detailDialog').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.screenshot({path:`test-results/stitch-detail-large-${width}.png`});await page.locator('#closeDetail').click();await page.locator('#largeText').click();
  await page.locator('#navMap').click();await page.waitForFunction(()=>!!document.querySelector('#map img'));await page.locator('#filterToggle').click();assert.equal(await page.locator('#typeFilters').isVisible(),true);await page.locator('#filterToggle').click();assert.equal(await page.locator('#province').isVisible(),false);await page.locator('#map').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/stitch-map-${width}.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#navHome').click();
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#reset').click();await page.locator('.workspace').evaluate(n=>n.scrollTop=0);await page.screenshot({path:'test-results/stitch-home-mobile.png'});
 await page.locator('#guideOpen').click();await page.locator('#guideDialog').waitFor();await page.screenshot({path:'test-results/stitch-guide-mobile.png'});assert.deepEqual(errors,[]);console.log('Stitch 로고·PC/모바일·큰글씨 유지·실제 센터 전화/길찾기·네이버 지도·안내 검증 통과');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
