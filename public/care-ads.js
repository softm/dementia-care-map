import {syncBottomAd} from './care-bottom-ad.js?v=20261007-map';
import {AD_CONFIG as config, NATIVE_ADS} from './ad-config.js?v=20261022-bottom-adfit';
// SOFTM-DEMENTIA-ADS START 날짜:20261001 : 실제 보이는 슬롯만 요청하고 목록 재조회는 광고를 재발급하지 않는다.
const cache=new Map(),mounts=new Map();let serial=0;
const production=location.hostname===config.domain;
let sdkReady;
function bootstrapSdk(startFirst){
 let resolve,reject;
 sdkReady=new Promise((yes,no)=>{resolve=yes;reject=no;});
 const ready=()=>typeof window.adfit?.render==='function'?resolve():reject(new Error('AdFit 개별 광고 초기화 기능을 사용할 수 없습니다.'));
 startFirst(ready,reject);
 const script=document.createElement('script');script.async=true;script.charset='utf-8';script.src=config.script;
 script.onerror=()=>reject(new Error('AdFit SDK를 불러오지 못했습니다.'));
 script.onload=()=>{if(typeof window.adfit?.render!=='function')reject(new Error('AdFit SDK 초기화에 실패했습니다.'));};
 document.body.append(script);
}
function slotNode(placement,slot){
 const key=placement+':'+slot.unit;if(cache.has(key))return cache.get(key);
 const node=document.createElement('aside');node.className='care-ad';node.dataset.placement=placement;node.setAttribute('aria-label','광고');
 const label=document.createElement('div');label.className='care-ad-label';label.textContent='광고';
 const body=document.createElement('div');body.className='care-ad-body';
 const fallback=document.createElement('a');fallback.className='care-ad-fallback';fallback.href='mailto:softm@nate.com?subject='+encodeURIComponent('치매안심 광고·제휴 문의');fallback.innerHTML='<strong>지역의 돌봄을 연결하는 광고·제휴</strong><span>치매안심 이용자에게 서비스를 소개하세요 <b>문의하기 ↗</b></span>';
 body.append(fallback);node.append(label,body);cache.set(key,node);
 let attempted=false,queued=false,intersecting=false,timeout;
 const fail=()=>{
  clearTimeout(timeout);
  body.querySelector('ins')?.remove();fallback.hidden=false;node.dataset.state='fallback';
 };
 const eligible=()=>{
  if(!production||!config.enabled||!intersecting||document.hidden||!node.isConnected||body.clientWidth<slot.width)return false;
  const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
 };
 function start(ready,abort){
  attempted=true;queued=false;observer.disconnect();document.removeEventListener('visibilitychange',request);fallback.hidden=true;node.dataset.state='requested';
  const ins=document.createElement('ins');ins.className='kakao_ad_area';ins.style.display='none';ins.dataset.adUnit=slot.unit;ins.dataset.adWidth=String(slot.width);ins.dataset.adHeight=String(slot.height);
  const id=++serial,callback='dementiaAdFail'+id,loaded='dementiaAdLoaded'+id;
  window[callback]=()=>{ready?.();fail();};ins.dataset.adOnfail=callback;
  window[loaded]=()=>{clearTimeout(timeout);node.dataset.state='filled';ready?.();};ins.dataset.adOnload=loaded;
  body.style.minHeight=slot.height+'px';body.append(ins);
  timeout=setTimeout(()=>{
   if(abort){abort(new Error('AdFit 첫 광고 응답 시간이 초과되었습니다.'));fail();}
   else if(!body.querySelector('iframe'))fail();
  },10000);
  return ins;
 }
 function request(){
  if(attempted||queued||!eligible())return;queued=true;
  if(!sdkReady){
   if(typeof window.adfit?.render==='function')sdkReady=Promise.resolve();
   else{
    // 첫 슬롯만 SDK의 자동 스캔에 맡긴다. 첫 응답 후 새 슬롯만 개별 렌더해 기존 광고의 재요청을 막는다.
    bootstrapSdk(start);sdkReady.catch(fail);return;
   }
  }
  sdkReady.then(()=>{
   queued=false;if(!eligible())return;
   const ins=start();try{window.adfit.render(ins);}catch{fail();}
  }).catch(()=>{queued=false;attempted=true;observer.disconnect();document.removeEventListener('visibilitychange',request);fail();});
 }
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)intersecting=entry.isIntersecting;if(intersecting)request();});observer.observe(node);
 document.addEventListener('visibilitychange',request);
 return node;
}
export function mountAd(host,placement){
 if(NATIVE_ADS){if(host)host.hidden=true;return;}
 if(!host||!config.placements[placement])return;
 for(const node of mounts.keys())if(!node.isConnected)mounts.delete(node);
 mounts.set(host,placement);
 const specs=config.placements[placement];const slot=host.clientWidth>=752&&specs.desktop?specs.desktop:specs.mobile;
 const node=slotNode(placement,slot);
 if(placement==='bottom'){
  // 규격을 왕복해도 iframe을 문서에서 분리하지 않는다. 비활성 배너는 숨기고 첫 노출에서만 요청한다.
  for(const child of host.children)child.hidden=child!==node;
  node.hidden=false;if(node.parentNode!==host)host.append(node);
 }else if(host.firstElementChild!==node)host.replaceChildren(node);
}
export function syncAds(mode){
 if(NATIVE_ADS){
  for(const id of ['listTopAd','mapTopAd','bottomAd']){const host=document.getElementById(id);if(host)host.hidden=true;}
  return;
 }
 syncBottomAd(mode,mountAd);
 const results=document.getElementById('results');const cards=results.querySelectorAll('.center-card');
 const listAd=document.getElementById('listTopAd'),mapAd=document.getElementById('mapTopAd');
 listAd.hidden=mode!=='list'||!cards.length;
 const host=mode==='list'?listAd:mapAd;
 // 첫 세 센터 뒤에서 함께 스크롤한다. 결과가 적으면 마지막 센터 뒤에 둔다.
 if(mode==='list'||matchMedia('(max-width:760px)').matches){
  host.hidden=!cards.length;
  if(cards.length)cards[Math.min(2,cards.length-1)].after(host);
 }else{host.hidden=false;document.querySelector('.map-section').prepend(host);}
 mountAd(host,mode);
 const existing=results.querySelector('[data-placement=inline]');if(existing)existing.hidden=cards.length<6;
 if(cards.length>=6){const ad=slotNode('inline',config.placements.inline.mobile);ad.hidden=false;if(cards[5].nextElementSibling!==ad)cards[5].after(ad);}
}
let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>{for(const [host,placement] of mounts){if(host.isConnected&&host.getClientRects().length)mountAd(host,placement);else if(!host.isConnected)mounts.delete(host);}},200);});
// SOFTM-DEMENTIA-ADS END

