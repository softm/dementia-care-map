const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 fs.mkdirSync('test-results',{recursive:true});
 try{
  for(const [width,height] of [[390,844],[320,844],[390,650],[1440,1000]]){
   const page=await browser.newPage({viewport:{width,height}}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const reachable=async selector=>assert.ok(await page.locator(selector).first().evaluate(node=>{
    const b=node.getBoundingClientRect();return b.width>0&&b.height>0&&node.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));
   }),selector+' must be reachable');
   await page.goto((process.env.SITE_URL||'http://localhost:3100/')+'?mode=map&q=광명');
   await page.locator('.center-card').first().waitFor();
   await page.waitForFunction(()=>!!document.querySelector('#map img')&&document.querySelector('#mapError').hidden);
   if(width<=760){
    for(const expanded of [true,false]){
     const toggle=page.locator('.bottom-ad-toggle');
     if(await toggle.getAttribute('aria-expanded')!==String(expanded))await toggle.click();
     await page.waitForTimeout(300);
     for(const id of ['mapLayer','locate','zoomIn','zoomOut','fit'])await reachable('#'+id);
     const search=await page.locator('#searchForm').boundingBox(),controls=await page.locator('.map-top').boundingBox();
     assert.ok(search.y+search.height<=controls.y,'search and map controls must not overlap');
    }
    await page.locator('#filterToggle').click();await reachable('#province');
    await page.locator('#filterToggle').click();
   }
   await page.locator('#q').fill('zz-no-center-zz');await page.locator('#q').press('Enter');
   await page.locator('#emptyReset').waitFor();await page.waitForTimeout(300);
   await reachable('#emptyReset');
   if(width<=760){
    assert.ok((await page.locator('#mobileResultsSheet').boundingBox()).height<300,'empty result must be compact');
    await page.screenshot({path:`test-results/readability-empty-${width}-${height}.png`});
    await page.locator('.bottom-ad-toggle').click();await page.waitForTimeout(300);await reachable('#emptyReset');
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
   await page.locator('#emptyReset').click();await page.locator('.center-card').first().waitFor();
   await page.locator('#q').fill('광명');await page.locator('#q').press('Enter');
   await page.waitForFunction(()=>document.querySelector('.center-card h3')?.textContent.includes('광명'));
   if(width<=760){
    await page.locator('#readingToggle').click();await reachable('.card-open');
    await page.locator('#readingToggle').click();
   }
   await page.waitForTimeout(300);
   await page.screenshot({path:`test-results/readability-results-${width}-${height}.png`});
   assert.deepEqual(errors,[]);await page.close();console.log(`${width}×${height}: 지도·검색·빈 결과·복구·광고·버튼 가림 검사 통과`);
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
