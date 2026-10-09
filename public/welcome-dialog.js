import {AD_CONFIG} from './ad-config.js?v=20261010-admob';

// SOFTM-WELCOME START 날짜:20261007 : 돌봄한눈과 동일하게 탭 첫 방문과 진입 모드에 맞춰 안내한다.
const storageKey='dementiaWelcomeAdShown';
export function initializeWelcomeDialog(){
 try{if(sessionStorage.getItem(storageKey))return;}catch{}
 const list=new URLSearchParams(location.search).get('mode')==='list';
 const dialog=document.createElement('dialog');
 dialog.className='welcome-ad-dialog';
 dialog.setAttribute('aria-labelledby','welcomeAdTitle');
 dialog.innerHTML=`<div class="welcome-ad-content"><h2 id="welcomeAdTitle">치매안심에 오신 것을 환영합니다</h2><p>${list?'지역과 조건으로 치매센터를 찾아보세요.':'우리 동네 치매센터를 지도에서 찾아보세요.'}</p><div class="welcome-ad-host" aria-label="광고" hidden></div><button type="button" class="welcome-ad-close" autofocus>${list?'목록':'지도'}에서 시작하기</button></div>`;
 document.body.append(dialog);
 const remember=()=>{try{sessionStorage.setItem(storageKey,'1');}catch{}};
 dialog.querySelector('button').onclick=()=>{remember();dialog.close();};
 dialog.addEventListener('cancel',remember);
 dialog.addEventListener('close',()=>{remember();dialog.remove();},{once:true});
 dialog.showModal();
 // 별도 광고 단위를 만들어내지 않고 치매안심에 발급된 지도용 모바일 단위를 사용한다.
 const slot=AD_CONFIG.placements.map.mobile,host=dialog.querySelector('.welcome-ad-host');
 if(list||!AD_CONFIG.enabled||location.hostname!==AD_CONFIG.domain||host.parentElement.clientWidth-44<slot.width)return;
 host.hidden=false;
 const ins=document.createElement('ins');ins.className='kakao_ad_area';ins.style.display='none';
 Object.assign(ins.dataset,{adUnit:slot.unit,adWidth:String(slot.width),adHeight:String(slot.height),adOnfail:'dementiaWelcomeAdFailed'});
 window.dementiaWelcomeAdFailed=()=>{host.hidden=true;};
 host.append(ins);
 const script=document.createElement('script');script.async=true;script.src=AD_CONFIG.script;script.onerror=window.dementiaWelcomeAdFailed;document.head.append(script);
}
// SOFTM-WELCOME END
