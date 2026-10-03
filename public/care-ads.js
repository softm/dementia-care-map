import {syncBottomAd} from './care-bottom-ad.js?v=20261003-reading';
import {AD_CONFIG as config} from './ad-config.js?v=20261001-bottom';
// SOFTM-DEMENTIA-ADS START 날짜:20261001 : 실제 보이는 슬롯만 요청하고 목록 재조회는 광고를 재발급하지 않는다.
const cache=new Map(),mounts=new Map();let serial=0;
const production=location.hostname===config.domain;
function slotNode(placement,slot){
 const key=placement+':'+slot.unit;if(cache.has(key))return cache.get(key);
 const node=document.createElement('aside');node.className='care-ad';node.dataset.placement=placement;node.setAttribute('aria-label','광고');
 const label=document.createElement('div');label.className='care-ad-label';label.textContent='광고';
 const body=document.createElement('div');body.className='care-ad-body';
 const fallback=document.createElement('a');fallback.className='care-ad-fallback';fallback.href='mailto:softm@nate.com?subject='+encodeURIComponent('치매안심 광고·제휴 문의');fallback.innerHTML='<strong>지역의 돌봄을 연결하는 광고·제휴</strong><span>치매안심 이용자에게 서비스를 소개하세요 <b>문의하기 ↗</b></span>';
 body.append(fallback);node.append(label,body);cache.set(key,node);
 let attempted=false,timeout;
 const fail=()=>{clearTimeout(timeout);body.querySelector('ins')?.remove();fallback.hidden=false;node.dataset.state='fallback';};
 const observer=new IntersectionObserver(entries=>{
  if(!entries.some(e=>e.isIntersecting)||attempted||!production||!config.enabled||document.hidden||body.clientWidth<slot.width)return;
  attempted=true;observer.disconnect();fallback.hidden=true;node.dataset.state='requested';
  const ins=document.createElement('ins');ins.className='kakao_ad_area';ins.style.display='none';ins.dataset.adUnit=slot.unit;ins.dataset.adWidth=String(slot.width);ins.dataset.adHeight=String(slot.height);
  const callback='dementiaAdFail'+(++serial);window[callback]=fail;ins.dataset.adOnfail=callback;
  body.style.minHeight=slot.height+'px';body.append(ins);
  const script=document.createElement('script');script.async=true;script.charset='utf-8';script.src=config.script;script.onerror=fail;document.body.append(script);
  timeout=setTimeout(()=>{if(!body.querySelector('iframe'))fail();},10000);
 });observer.observe(node);
 return node;
}
export function mountAd(host,placement){
 if(!host||!config.placements[placement])return;
 for(const node of mounts.keys())if(!node.isConnected)mounts.delete(node);
 mounts.set(host,placement);
 const specs=config.placements[placement];const slot=host.clientWidth>=752&&specs.desktop?specs.desktop:specs.mobile;
 const node=slotNode(placement,slot);if(host.firstElementChild!==node)host.replaceChildren(node);
}
export function syncAds(mode){
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
