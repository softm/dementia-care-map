const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
const origin=process.env.TEST_ORIGIN||'http://localhost:3100';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/ad-config.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("domain:'dementia.designboard.net'","domain:'localhost'")});});
  await page.route('https://t1.kakaocdn.net/kas/static/ba.min.js',route=>route.fulfill({contentType:'application/javascript',body:`window.adRequests ||= [];document.querySelectorAll('ins.kakao_ad_area:not([data-tested])').forEach(ins=>{ins.dataset.tested='1';window.adRequests.push(ins.dataset.adUnit);if(!ins.dataset.adOnfail)throw Error('NO-AD callback missing');window[ins.dataset.adOnfail](ins);});`}));
  await page.goto(origin+'/?mode=list');await page.waitForFunction(()=>window.adRequests?.includes('DAN-isDQDeChPru8i1K6'));
  assert.equal(await page.locator('#listTopAd .care-ad').getAttribute('data-state'),'fallback');await page.locator('#results [data-placement=inline]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>window.adRequests.includes('DAN-ziZ3GlYni7QBIMny'));
  await page.evaluate(()=>window.originalInlineAd=document.querySelector('#results [data-placement=inline]'));
  await page.locator('#more').click();assert.equal(await page.evaluate(()=>window.originalInlineAd===document.querySelector('#results [data-placement=inline]')),true);assert.equal(await page.evaluate(()=>window.adRequests.filter(id=>id==='DAN-ziZ3GlYni7QBIMny').length),1);
  await page.locator('#q').fill('광명');await page.locator('#searchForm').evaluate(f=>f.requestSubmit());await page.locator('.card-open').first().click();await page.locator('#shareCenter').waitFor();await page.waitForFunction(()=>window.adRequests.includes('DAN-VKlZHUB69XgUrO4e'));await page.locator('#closeDetail').click();
  await page.locator('[data-mode=map]').click();await page.waitForFunction(()=>window.adRequests.includes('DAN-qM3KYPOwePM7kwpl'));
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>window.adRequests.includes('DAN-V1vn22LSCYpNlOq1'));await page.locator('[data-mode=list]').click();await page.waitForFunction(()=>window.adRequests.includes('DAN-iLTrwoG83KVVUYQV'));
  assert.equal(await page.evaluate(()=>new Set(window.adRequests).size),8);assert.deepEqual(errors,[]);console.log('8개 광고 단위·화면별 규격·NO-AD 대체·목록 광고 DOM 유지 검증 통과');
 }catch(error){console.error(await page.evaluate(()=>({requests:window.adRequests,mode:document.body.dataset.careMode,ads:[...document.querySelectorAll('.care-ad')].map(n=>({placement:n.dataset.placement,state:n.dataset.state,width:n.clientWidth,body:n.querySelector('.care-ad-body').clientWidth,rect:n.getBoundingClientRect().toJSON()}))})));throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
