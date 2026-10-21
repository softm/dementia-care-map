const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000},permissions:['geolocation'],geolocation:{latitude:37.5,longitude:127}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.route('**/ad-config.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace("domain:'dementia.designboard.net'","domain:'localhost'")});});
 await page.route('https://t1.kakaocdn.net/kas/static/ba.min.js',r=>r.fulfill({contentType:'application/javascript',body:`window.adRequests ||= [];document.querySelectorAll('ins.kakao_ad_area:not([data-tested])').forEach(ins=>{ins.dataset.tested='1';window.adRequests.push(ins.dataset.adUnit);window[ins.dataset.adOnfail](ins);});`}));
 await page.goto('http://localhost:3100/?mode=list');await page.waitForFunction(()=>window.adRequests?.includes('DAN-uP9h4q9UzSfgTSIC'));
 const toggle=page.locator('.bottom-ad-toggle');assert.equal(await toggle.getAttribute('aria-expanded'),'true');
 await page.evaluate(()=>window.bottomOriginal=document.querySelector('#bottomAdHost .care-ad'));
 await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');await page.reload();await page.locator('.center-card').first().waitFor();assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>window.adRequests?.includes('DAN-uP9h4q9UzSfgTSIC')||false),false);
 await toggle.click();await page.waitForFunction(()=>window.adRequests?.includes('DAN-uP9h4q9UzSfgTSIC'));await page.evaluate(()=>window.bottomOriginal=document.querySelector('#bottomAdHost .care-ad'));
 await page.locator('[data-mode=map]').click();await page.waitForFunction(()=>window.naver?.maps&&document.querySelector('#map').children.length>0);await page.locator('[data-mode=list]').click();assert.equal(await page.evaluate(()=>window.bottomOriginal===document.querySelector('#bottomAdHost .care-ad')),true);
 await page.locator('.workspace').evaluate(n=>n.scrollTop=500);await page.waitForFunction(()=>document.querySelector('.bottom-ad-toggle').getAttribute('aria-expanded')==='false');await toggle.click();await page.locator('.workspace').evaluate(n=>n.scrollTop=600);assert.equal(await toggle.getAttribute('aria-expanded'),'true');await page.locator('.workspace').evaluate(n=>n.scrollTop=0);
 await page.waitForFunction(()=>document.querySelector('.workspace').getBoundingClientRect().bottom<=document.querySelector('#bottomAd').getBoundingClientRect().top+1);
 await page.screenshot({path:'test-results/bottom-ad-desktop.png'});
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  await page.waitForFunction(()=>{
   const active=document.querySelector('#bottomAdHost .care-ad:not([hidden])');
   const body=active?.querySelector('.care-ad-body');
   return active!==window.bottomOriginal&&body?.clientWidth>=320&&body.clientWidth<=innerWidth;
  });
  await page.waitForFunction(()=>window.adRequests.includes('DAN-gTztk29syTBi635f'));
  assert.equal(await page.evaluate(()=>window.bottomOriginal.isConnected&&window.bottomOriginal.hidden),true,'모바일 규격에서도 PC 광고 노드를 문서에 유지한다');
  assert.equal(await page.locator('#bottomAdHost>.care-ad:not([hidden])').count(),1,'현재 규격의 광고 한 개만 표시한다');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`test-results/bottom-ad-${width}.png`});
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.waitForFunction(()=>window.bottomOriginal.isConnected&&!window.bottomOriginal.hidden&&window.bottomOriginal===document.querySelector('#bottomAdHost>.care-ad:not([hidden])'));
 assert.equal(await page.locator('#bottomAdHost>.care-ad:not([hidden])').count(),1,'PC 복귀 후에도 광고 한 개만 표시한다');
 for(const unit of ['DAN-uP9h4q9UzSfgTSIC','DAN-gTztk29syTBi635f'])assert.equal(await page.evaluate(unit=>window.adRequests.filter(x=>x===unit).length,unit),1,'규격 왕복 중 같은 광고단위를 다시 요청하지 않는다');
 assert.deepEqual(errors,[]);console.log('하단 광고 접기·펼치기·세션 유지·지연 요청·모드 간 DOM 유지·읽기 중 접힘·320px·PC↔모바일 노드 연결 유지 검증 통과');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});

