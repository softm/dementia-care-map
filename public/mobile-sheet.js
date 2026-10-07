// 돌봄한눈 map-experience.js의 4단계 시트·45px 드래그·포인터 캡처 방식을 적용.
const states=['focus','map','split','list'];
let state='focus',drag=null,ignoreClick=false;
const active=()=>matchMedia('(max-width:760px)').matches&&document.body.dataset.careMode==='map';
export function setMobileSheet(next){
 if(!states.includes(next))return;
 state=next;document.body.dataset.mobileSheet=state;
 document.body.classList.toggle('list-expanded',state==='split'||state==='list');
 const handle=document.getElementById('mobileToggle'),expanded=state==='split'||state==='list';
 handle.setAttribute('aria-expanded',String(expanded));
 handle.textContent=expanded?'지도 크게 보기 ↓':'목록 크게 보기 ↑';
 handle.setAttribute('aria-label',`${handle.textContent}. 위아래로 끌어 지도와 목록 높이 조절`);
}
export function revealMobileSheet(){if(active()&&!['split','list'].includes(state))setMobileSheet('split');}
export function initializeMobileSheet(){
 const handle=document.getElementById('mobileToggle'),sheet=document.getElementById('mobileResultsSheet'),layout=document.querySelector('.workspace');
 const step=delta=>{if(Math.abs(delta)>=45)setMobileSheet(states[Math.max(0,Math.min(3,states.indexOf(state)+(delta<0?1:-1)))]);};
 handle.setAttribute('aria-keyshortcuts','ArrowUp ArrowDown Home End');
 handle.onclick=()=>{if(ignoreClick){ignoreClick=false;return;}setMobileSheet(['split','list'].includes(state)?'map':'split');};
 handle.addEventListener('keydown',event=>{if(!active()||!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();if(event.key==='Home')setMobileSheet('list');else if(event.key==='End')setMobileSheet('focus');else step(event.key==='ArrowUp'?-100:100);});
 handle.addEventListener('pointerdown',event=>{if(!active()||event.button!==0||drag)return;ignoreClick=false;drag={id:event.pointerId,y:event.clientY,delta:0,height:sheet.clientHeight,scroll:document.getElementById('results').scrollTop};handle.setPointerCapture(event.pointerId);});
 handle.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;drag.delta=event.clientY-drag.y;if(Math.abs(drag.delta)<5)return;document.body.classList.add('sheet-dragging');sheet.style.setProperty('--sheet-drag-height',`${Math.max(44,Math.min(layout.clientHeight*.85,drag.height-drag.delta))}px`);});
 const finish=(event,cancelled=false)=>{if(!drag||event.pointerId!==drag.id)return;const current=drag;drag=null;ignoreClick=Math.abs(current.delta)>=5;document.body.classList.remove('sheet-dragging');sheet.style.removeProperty('--sheet-drag-height');if(!cancelled)step(current.delta);document.getElementById('results').scrollTop=current.scroll;};
 handle.addEventListener('pointerup',event=>finish(event));handle.addEventListener('pointercancel',event=>finish(event,true));handle.addEventListener('lostpointercapture',event=>finish(event,true));
 window.addEventListener('resize',()=>{if(drag)finish({pointerId:drag.id},true);});
 new MutationObserver(()=>{if(drag&&!active())finish({pointerId:drag.id},true);}).observe(document.body,{attributes:true,attributeFilter:['data-care-mode']});
 setMobileSheet(state);
}
