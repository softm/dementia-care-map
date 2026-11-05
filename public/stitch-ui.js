import {initializeListReading} from './list-reading.js?v=20261007-map';
import {initializeGuide} from './stitch-guide.js?v=20261105-life-guide';
import {initializeTextSize} from './text-size.js?v=20261105';
// Stitch project 9278473149944686283 — 큰글씨 선택은 해당 탭에만 보관한다.
export function initializeStitchUI(){
 initializeGuide();
 initializeListReading();
 window.addEventListener('resize',syncStitchLayout,{passive:true});
 const guideButton=document.getElementById('guideLargeText');
 const button=document.getElementById('largeText');
 const filters=document.getElementById('filterToggle');filters.onclick=()=>{const open=filters.getAttribute('aria-expanded')!=='true';filters.setAttribute('aria-expanded',String(open));document.getElementById('searchForm').classList.toggle('filters-open',open);filters.textContent=open?'필터 접기':'유형·관심 정보 필터';};
 button.onclick=initializeTextSize(large=>{
   guideButton.setAttribute('aria-pressed',String(large));guideButton.textContent=large?'일반 글씨로 보기':'큰글씨로 보기';
   button.setAttribute('aria-pressed',String(large));button.innerHTML='<span aria-hidden="true">가</span> '+(large?'일반 글씨':'큰글씨');
 });guideButton.onclick=()=>button.click();
}

export function syncStitchLayout(){
 const ad=document.getElementById('mapTopAd');const mobile=matchMedia('(max-width:760px)').matches&&document.body.dataset.careMode==='map';
 if(mobile){const cards=document.querySelectorAll('#results>.center-card');ad.hidden=!cards.length;if(cards.length)cards[Math.min(2,cards.length-1)].after(ad);}
 else if(ad.parentElement!==document.querySelector('.map-section'))document.querySelector('.map-section').prepend(ad);
}
