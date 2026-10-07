const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});fs.mkdirSync('test-results',{recursive:true});
 try{
  for(const [width,height] of [[390,844],[320,844],[390,650],[740,390],[1440,1000]]){
   const page=await browser.newPage({viewport:{width,height},permissions:['geolocation'],geolocation:{latitude:37.48,longitude:126.86}}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const reachable=async selector=>assert.ok(await page.locator(selector).first().evaluate(node=>{
    const b=node.getBoundingClientRect();return b.width>0&&b.height>0&&node.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));
   }),selector+' must be reachable');
   await page.goto((process.env.SITE_URL||'http://localhost:3100/')+'?mode=map&q=광명');
   await page.waitForFunction(()=>document.querySelectorAll('.center-card').length>0);
   await page.waitForFunction(()=>!!document.querySelector('#map img')&&document.querySelector('#mapError').hidden);
   if(width<=760){
    assert.equal(await page.locator('#mobileResultsSheet').isVisible(),false,'map opens without a list');
    assert.equal(await page.locator('#bottomAdPanel').isVisible(),false,'map ad temporarily collapsed');
    assert.ok(await page.evaluate(()=>{
     const search=document.querySelector('#searchForm').getBoundingClientRect(),dock=document.querySelector('.mobile-nav').getBoundingClientRect();
     return dock.top-search.bottom>=innerHeight*(innerHeight<550?.45:.6);
    }),'map has sufficient unobstructed vertical space');
    for(const id of ['mapHome','mapTypeToggle','filterToggle','navMap','navSaved','navMore','mapLayer','locate','zoomIn','zoomOut','fit'])await reachable('#'+id);
    await page.screenshot({path:`test-results/map-focus-${width}-${height}.png`});
    await page.locator('#mapTypeToggle').click();assert.equal(await page.locator('#mapTypesDialog').isVisible(),true);
    await page.locator('#mapTypesDialog [data-type=regional]').click();assert.equal(await page.locator('#mapTypesDialog').isVisible(),false);
    assert.match(await page.locator('#mapTypeToggle').innerText(),/광역센터/);
    await page.locator('#mapTypeToggle').click();await page.locator('#mapTypesDialog [data-type=""]').click();
    await page.locator('#filterToggle').click();await reachable('#province');await page.keyboard.press('Escape');
    assert.equal(await page.locator('#filterToggle').getAttribute('aria-expanded'),'false');
    await page.locator('#mapLayer').click();assert.equal(await page.locator('#mapLayer').getAttribute('aria-pressed'),'true');await page.locator('#mapLayer').click();
    await page.locator('#navMap').click();await page.waitForTimeout(250);await reachable('#readingToggle');
    await page.locator('#readingToggle').click();await page.waitForTimeout(250);await reachable('.card-open');
    await page.locator('.card-open').first().click();await page.locator('#closeDetail').click();
    await page.keyboard.press('Escape');assert.equal(await page.locator('#mobileResultsSheet').isVisible(),false);
   }
   await page.locator('#q').fill('zz-no-center-zz');await page.locator('#q').press('Enter');
   await page.waitForFunction(()=>!!document.querySelector('#emptyReset'));
   if(width<=760){
    await reachable('#mapEmptyNotice');assert.equal(await page.locator('#mobileResultsSheet').isVisible(),false);
    await page.locator('#mapEmptyNotice').click();
    await page.waitForFunction(()=>document.querySelectorAll('.center-card').length>0);
    await page.locator('#q').fill('광명');await page.locator('#q').press('Enter');
    await page.locator('.bottom-ad-toggle').click();await page.waitForTimeout(250);await reachable('#navMap');
    await page.locator('#navMap').click();await page.waitForTimeout(250);await reachable('#readingToggle');
    assert.ok(await page.evaluate(()=>document.querySelector('.mobile-nav').getBoundingClientRect().bottom<=document.querySelector('#bottomAd').getBoundingClientRect().top));
    await page.locator('#navMap').click();await page.locator('.bottom-ad-toggle').click();
    await page.locator('#navMore').click();assert.ok(await page.locator('#moreDialog a[href="tel:18999988"]').isVisible());await page.locator('#closeMore').click();
    await page.locator('#navSaved').click();assert.equal(await page.locator('body').getAttribute('data-care-mode'),'list');
    await page.locator('#navMap').click();await page.waitForTimeout(250);assert.equal(await page.locator('#mobileResultsSheet').isVisible(),false);
   }else{await reachable('#emptyReset');await page.locator('#emptyReset').click();await page.locator('.center-card').first().waitFor();}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
   assert.deepEqual(errors,[]);await page.close();console.log(`${width}×${height}: 지도 우선·아이콘·유형·검색·목록·광고·복귀 통과`);
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
