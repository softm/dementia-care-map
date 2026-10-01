const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
const origin=process.env.TEST_ORIGIN||'http://localhost:3100';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const rows=JSON.parse(zlib.gunzipSync(fs.readFileSync('data/dementia/centers.json.gz')));
  const row=rows.find(r=>r.name.includes('광명')&&r.location);
  const report=[];fs.mkdirSync('test-results',{recursive:true});
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:width===390?844:1000});
   for(const zoom of [14,16,18]){
    await page.goto(`${origin}/?lat=${row.location.lat}&lng=${row.location.lng}&z=${zoom}`);
    const label=page.locator(`[data-marker-id="${row.id}"] .marker-name`);
    await label.waitFor({state:'visible'});
    await page.waitForTimeout(350);
    assert.match(await label.innerText(),new RegExp(row.name));
    if(width===1440)assert.equal(await label.evaluate(n=>n.classList.contains('care-label-context')),zoom>=16);
    if(width===1440)assert.equal(await label.evaluate(n=>n.classList.contains('care-label-insight')),zoom>=18);
    const geometry=await page.evaluate(()=>{
      const map=document.querySelector('#map').getBoundingClientRect();
      const rects=[...document.querySelectorAll('.care-label-visible')].map(n=>n.getBoundingClientRect());
      const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      const pins=[...document.querySelectorAll('.map-pin,.map-top button,.care-location-state:not([hidden]),.map-legend,.mobile-toggle,.help-card')].map(n=>n.getBoundingClientRect());
      return {count:rects.length,inside:rects.every(r=>r.left>=map.left&&r.right<=map.right&&r.top>=map.top&&r.bottom<=map.bottom),collision:rects.some((r,i)=>rects.slice(i+1).some(other=>overlap(r,other))||pins.some(p=>overlap(r,p)))};
    });
    assert.ok(geometry.inside);assert.equal(geometry.collision,false);
    await page.screenshot({path:`test-results/markers-${width}-${zoom}.png`});report.push({width,zoom,...geometry});
    if(zoom===18){await label.click();await page.locator('#shareCenter').waitFor();assert.equal(await page.locator('#detailTitle').innerText(),row.name);await page.locator('#closeDetail').click();}
   }
  }
  await page.goto(origin+'/?lat=36.35&lng=127.8&z=7');
  await page.waitForFunction(()=>document.querySelector('#map').classList.contains('care-compact-markers'));
  assert.equal(await page.locator('.care-label-visible').count(),0);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({report,compact:true,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
