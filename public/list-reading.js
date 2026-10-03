import {setMobileSheet} from './mobile-sheet.js';
// 목록 읽기 상태는 화면 안에서만 유지한다. 검색·지도 복귀는 사용자가 선택한다.
export function initializeListReading(){
 const body=document.body,results=document.getElementById('results'),form=document.getElementById('searchForm');
 const button=document.createElement('button');button.id='readingToggle';button.type='button';button.setAttribute('aria-controls','searchForm');document.querySelector('.results-header').append(button);
 let reading=false,touchY=null;
 const mobile=()=>matchMedia('(max-width:760px)').matches;
 function apply(next){
  if(body.dataset.careMode!=='map')next=false;
  const bounds=results.getBoundingClientRect();
  const anchor=next&&mobile()&&body.dataset.mobileSheet==='split'?[...results.querySelectorAll('.center-card')].find(card=>{const rect=card.getBoundingClientRect();return rect.left<bounds.left+bounds.width/2&&rect.right>bounds.left+bounds.width/2;}):null;
  reading=next;body.classList.toggle('reading-list',reading);button.textContent=reading?'검색·지도 보기':'목록 넓게 보기';button.setAttribute('aria-expanded',String(!reading));
  if(reading&&mobile()){setMobileSheet('list');if(anchor)requestAnimationFrame(()=>{if(reading)results.scrollTop=anchor.offsetTop-results.offsetTop;});}
  window.dispatchEvent(new CustomEvent('care-reading-change',{detail:{active:reading}}));
 }
 const enter=()=>{if(!reading&&body.dataset.careMode==='map'&&!form.contains(document.activeElement))apply(true);};
 button.onclick=()=>{const previous=reading;apply(!reading);if(previous&&mobile())setMobileSheet('split');};
 results.addEventListener('scroll',()=>{if(results.scrollTop>48)enter();},{passive:true});
 results.addEventListener('wheel',event=>{if(event.deltaY>12){if(form.contains(document.activeElement))document.activeElement.blur();enter();}},{passive:true});
 results.addEventListener('touchstart',event=>{touchY=event.touches[0]?.clientY??null;},{passive:true});
 results.addEventListener('touchmove',event=>{if(touchY!==null&&touchY-(event.touches[0]?.clientY??touchY)>36){if(form.contains(document.activeElement))document.activeElement.blur();enter();touchY=null;}},{passive:true});
 form.addEventListener('focusin',()=>{if(reading)apply(false);});
 new MutationObserver(records=>{if(records.some(r=>r.attributeName==='data-care-mode'))apply(false);else if(reading&&mobile()&&body.dataset.mobileSheet!=='list')apply(false);}).observe(body,{attributes:true,attributeFilter:['data-care-mode','data-mobile-sheet']});
 window.addEventListener('resize',()=>{if(reading&&mobile())setMobileSheet('list');},{passive:true});
 apply(false);
}
