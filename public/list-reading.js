import {setMobileSheet} from './mobile-sheet.js?v=20261007-map';
// 목록 읽기 상태는 화면 안에서만 유지한다. 검색·지도 복귀는 사용자가 선택한다.
export function initializeListReading(){
 const body=document.body,results=document.getElementById('results'),form=document.getElementById('searchForm');
 const button=document.createElement('button');button.id='readingToggle';button.type='button';button.setAttribute('aria-controls','searchForm');document.querySelector('.results-header').append(button);
 let reading=false,touchStart=null;
 const workspace=document.querySelector('.workspace');
 const mobile=()=>matchMedia('(max-width:760px)').matches;
 function apply(next){
  const listAnchor=next&&body.dataset.careMode==='list'?[...results.querySelectorAll('.center-card')].find(card=>card.getBoundingClientRect().bottom>workspace.getBoundingClientRect().top+60):null;
  const anchorTop=listAnchor?.getBoundingClientRect().top;
  const bounds=results.getBoundingClientRect();
  const anchor=next&&mobile()&&body.dataset.mobileSheet==='split'?[...results.querySelectorAll('.center-card')].find(card=>{const rect=card.getBoundingClientRect();return rect.left<bounds.left+bounds.width/2&&rect.right>bounds.left+bounds.width/2;}):null;
  reading=next;body.classList.toggle('reading-list',reading);button.textContent=reading?(body.dataset.careMode==='map'?'검색·지도 보기':'검색 조건 보기'):'목록 넓게 보기';button.setAttribute('aria-expanded',String(!reading));
  if(reading&&mobile()&&body.dataset.careMode==='map'){setMobileSheet('list');if(anchor)requestAnimationFrame(()=>{if(reading)results.scrollTop=anchor.offsetTop-results.offsetTop;});}
  if(listAnchor)workspace.scrollTop+=listAnchor.getBoundingClientRect().top-anchorTop;
  window.dispatchEvent(new CustomEvent('care-reading-change',{detail:{active:reading}}));
 }
 const enter=()=>{if(!reading&&!form.contains(document.activeElement))apply(true);};
 button.onclick=()=>{const previous=reading;apply(!reading);if(previous&&mobile()&&body.dataset.careMode==='map')setMobileSheet('split');if(previous&&body.dataset.careMode==='list')form.scrollIntoView({block:'start'});};
 results.addEventListener('scroll',()=>{if(results.scrollTop>48)enter();},{passive:true});
 results.addEventListener('wheel',event=>{if(event.deltaY>12){if(form.contains(document.activeElement))document.activeElement.blur();enter();}},{passive:true});
 results.addEventListener('touchstart',event=>{touchStart=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
 results.addEventListener('touchmove',event=>{if(!touchStart||event.touches.length!==1){touchStart=null;return;}const dx=event.touches[0].clientX-touchStart.x,dy=touchStart.y-event.touches[0].clientY;if(Math.abs(dx)>24&&Math.abs(dx)>Math.abs(dy)){touchStart=null;return;}if(dy>36&&dy>Math.abs(dx)*1.5){if(form.contains(document.activeElement))document.activeElement.blur();enter();touchStart=null;}},{passive:true});
 results.addEventListener('touchend',()=>{touchStart=null;},{passive:true});
 results.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
 workspace.addEventListener('scroll',()=>{if(body.dataset.careMode==='list'&&results.getBoundingClientRect().top<workspace.getBoundingClientRect().top+100)enter();},{passive:true});
 form.addEventListener('focusin',()=>{if(reading)apply(false);});
 new MutationObserver(records=>{if(records.some(r=>r.attributeName==='data-care-mode'))apply(false);else if(reading&&mobile()&&body.dataset.careMode==='map'&&body.dataset.mobileSheet!=='list')apply(false);}).observe(body,{attributes:true,attributeFilter:['data-care-mode','data-mobile-sheet']});
 window.addEventListener('resize',()=>{if(reading&&mobile()&&body.dataset.careMode==='map')setMobileSheet('list');},{passive:true});
 apply(false);
}
