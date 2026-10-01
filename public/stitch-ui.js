// Stitch project 9278473149944686283 — 큰글씨 선택은 해당 탭에만 보관한다.
export function initializeStitchUI(){
 const button=document.getElementById('largeText');
 const filters=document.getElementById('filterToggle');filters.onclick=()=>{const open=filters.getAttribute('aria-expanded')!=='true';filters.setAttribute('aria-expanded',String(open));document.getElementById('searchForm').classList.toggle('filters-open',open);filters.textContent=open?'필터 접기':'유형·관심 정보 필터';};
 let large=false;try{large=sessionStorage.getItem('dementiaLargeText')==='1';}catch{}
 function apply(){document.body.classList.toggle('large-text',large);button.setAttribute('aria-pressed',String(large));button.innerHTML='<span aria-hidden="true">가</span> '+(large?'일반 글씨':'큰글씨');}
 button.onclick=()=>{large=!large;try{sessionStorage.setItem('dementiaLargeText',large?'1':'0');}catch{}apply();};apply();
}
