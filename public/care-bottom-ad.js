// SOFTM-BOTTOM-AD 날짜:20261001 : 돌봄한눈의 공용 하단 광고·세션 접힘·목록 읽기 중 임시 접힘 동작.
const storageKey='dementiaBottomAd:collapsed:v1';
let zone,button,panel,host,mount,mode,expanded=true,reading=false,readingExpanded=false,mapFocused=false,focusExpanded=false;
window.addEventListener('care-reading-change',event=>{reading=event.detail.active;readingExpanded=false;if(zone)sync();});
const visibleExpanded=()=>reading?readingExpanded:mapFocused?focusExpanded:expanded;
function syncSpace(){document.body.style.setProperty('--bottom-ad-space',`${Math.ceil(zone.getBoundingClientRect().height)}px`);}
function sync(){
 // 모바일 지도 진입에서는 광고를 임시로 접고, 홈으로 돌아가면 기존 선택을 복원한다.
 const nextFocus=mode==='map'&&matchMedia('(max-width:760px)').matches;
 if(nextFocus!==mapFocused){mapFocused=nextFocus;focusExpanded=false;}
 const open=visibleExpanded();panel.hidden=!open;zone.dataset.expanded=String(open);
 zone.setAttribute('aria-label',mode==='list'?'목록 하단 광고':'지도 하단 광고');
 button.setAttribute('aria-expanded',String(open));button.textContent=open?'광고 접기':'광고 펼치기';
 if(open&&!document.hidden)mount(host,'bottom');
 syncSpace();
}
export function syncBottomAd(nextMode,mountAd){
 mode=nextMode;mount=mountAd;
 if(!zone){
  try{expanded=sessionStorage.getItem(storageKey)!=='1';}catch{}
  zone=document.createElement('aside');zone.id='bottomAd';zone.className='bottom-ad';
  button=document.createElement('button');button.type='button';button.className='bottom-ad-toggle';button.setAttribute('aria-controls','bottomAdPanel');
  panel=document.createElement('div');panel.id='bottomAdPanel';
  host=document.createElement('div');host.id='bottomAdHost';panel.append(host);zone.append(button,panel);document.body.append(zone);
  button.onclick=()=>{
   if(reading)readingExpanded=!visibleExpanded();
   else if(mapFocused)focusExpanded=!focusExpanded;
   else{expanded=!expanded;try{sessionStorage.setItem(storageKey,expanded?'0':'1');}catch{}}
   sync();
  };
  const workspace=document.querySelector('.workspace');
  workspace.addEventListener('scroll',()=>{
   if(mode!=='list')return;
   const next=workspace.scrollTop>200;if(next===reading)return;
   reading=next;readingExpanded=false;sync();
  },{passive:true});
  new ResizeObserver(syncSpace).observe(zone);
  window.addEventListener('resize',sync,{passive:true});document.addEventListener('visibilitychange',sync);
 }
 if(mode!=='list')reading=document.body.classList.contains('reading-list');
 sync();
}
