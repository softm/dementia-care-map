const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 for(const [width,height] of [[1920,815],[1440,900],[1024,768],[390,844],[320,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.SITE_URL||'http://localhost:3100/')+'?mode=map&q=부천');
  await page.waitForFunction(()=>document.querySelectorAll('.center-card').length>0);
  await page.waitForFunction(()=>!!document.querySelector('#map img')&&document.querySelector('#mapError').hidden);
  if(width<=760)await page.locator('#navMap').click();
  let normal;
  for(const large of [false,true]){
   if(large){if(width>760)await page.locator('#largeText').click();else{await page.locator('#navMore').click();await page.locator('#moreLarge').click();await page.locator('#closeMore').click();}}
   await page.waitForTimeout(300);
   const layout=await page.evaluate(()=>{
    const size=s=>parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
    const card=document.querySelector('.center-card'),b=card.getBoundingClientRect();
    return {heading:size('.card-heading h3'),body:size('.card-address'),meta:size('.status-unknown'),badge:size('.badge'),action:size('[data-card-detail]'),count:size('.results-header h2'),
     overflow:document.documentElement.scrollWidth>innerWidth,cardOverflow:card.scrollWidth>card.clientWidth,formHeight:document.querySelector('#searchForm').clientHeight,
     minAction:Math.min(...[...card.querySelectorAll('.card-actions>*')].map(e=>e.getBoundingClientRect().height)),cardWidth:b.width};
   });
   assert.ok(layout.heading>layout.body&&layout.body>layout.meta,'clear three-level text hierarchy');
   assert.equal(layout.badge,layout.meta);assert.equal(layout.action,layout.meta);assert.equal(layout.count,layout.body);
   assert.ok(layout.meta>=14&&layout.minAction>=44,'readable supporting text and usable actions');
   assert.equal(layout.overflow,false);assert.equal(layout.cardOverflow,false);
   if(!large)normal=layout;else assert.ok(layout.heading>normal.heading&&layout.body>normal.body&&layout.meta>normal.meta,'large text remains meaningfully larger');
   if(width>760){
    assert.ok(layout.formHeight<250,'search leaves space for results');
    await page.locator('#filterToggle').click();assert.equal(await page.locator('#program').isVisible(),true);await page.locator('#filterToggle').click();
    await page.locator('.sidebar-footer summary').click();assert.equal(await page.locator('.sidebar-footer a[href="privacy.html"]').isVisible(),true);await page.locator('.sidebar-footer summary').click();
   }
   await page.screenshot({path:`test-results/typography-${width}-${large?'large':'normal'}.png`});
  }
  await page.locator('.center-card [data-card-detail]').first().click();await page.locator('#detailDialog').waitFor();await page.locator('#closeDetail').click();
  assert.deepEqual(errors,[]);console.log(`${width}px: 일반·큰글씨 위계/터치영역/필터/안내/상세 검증 통과`);await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
