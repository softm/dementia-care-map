const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 for(const width of [1440,390,320]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.goto((process.env.SITE_URL||'http://localhost:3100/')+'?mode=list&q=치매');
  await page.locator('.center-card').first().waitFor();
  await page.locator('.center-card').first().scrollIntoViewIfNeeded();
  const box=await page.locator('.center-card').first().boundingBox();
  await page.mouse.move(box.x+40,box.y+50);await page.mouse.wheel(0,360);
  await page.waitForFunction(()=>document.body.classList.contains('reading-list'));
  assert.equal(await page.locator('#searchForm').isVisible(),false);
  await page.locator('#readingToggle').click();
  assert.equal(await page.locator('#searchForm').isVisible(),true);
  assert.equal(await page.locator('#q').inputValue(),'치매');
  await page.locator('#q').fill('광명');await page.locator('#q').press('Enter');
  await page.waitForFunction(()=>document.querySelector('.center-card h3')?.textContent.includes('광명'));
  await page.screenshot({path:`test-results/list-space-${width}.png`});
  console.log(`${width}px 일반 목록 스크롤·조건 접기·복귀·검색 통과`);await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
