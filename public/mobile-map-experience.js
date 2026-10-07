import {icon} from './ui-icons.js?v=20261007';
import {setMobileSheet} from './mobile-sheet.js?v=20261007-map';

// 돌봄한눈처럼 지도는 먼저 넓게 보여주고, 기존 검색·목록 DOM을 필요할 때 연다.
export function initializeMapExperience(){
 const $=id=>document.getElementById(id),body=document.body;
 const media=matchMedia('(max-width:760px)'),form=$('searchForm'),chips=$('typeFilters');
 const active=()=>media.matches&&body.dataset.careMode==='map';
 const expanded=()=>['split','list'].includes(body.dataset.mobileSheet);
 const typeIcons={'':'layers',center:'building',regional:'region',branch:'branch',other:'heart'};
 const anchor=document.createComment('센터 유형 원래 위치');chips.before(anchor);
 for(const choice of chips.querySelectorAll('button')){
  const label=choice.textContent;choice.innerHTML=icon(typeIcons[choice.dataset.type])+`<span>${label}</span>`;
 }
 const types=document.createElement('dialog');types.id='mapTypesDialog';types.setAttribute('aria-labelledby','mapTypesTitle');
 types.innerHTML=`<div class="dialog-head"><h2 id="mapTypesTitle">센터 유형 선택</h2><button type="button" aria-label="센터 유형 닫기">${icon('close')}</button></div>`;
 document.body.append(types);types.querySelector('button').onclick=()=>types.close();
 chips.addEventListener('click',event=>{if(event.target.closest('button')&&types.open)types.close();});
 const typeButton=document.createElement('button');typeButton.type='button';typeButton.id='mapTypeToggle';typeButton.setAttribute('aria-haspopup','dialog');typeButton.setAttribute('aria-controls',types.id);
 typeButton.onclick=()=>{closeFilters();types.showModal();};form.append(typeButton);
 const back=document.createElement('button');back.type='button';back.id='mapHome';back.setAttribute('aria-label','홈으로 돌아가기');back.title='홈으로 돌아가기';back.innerHTML=icon('back');back.onclick=()=>$('navHome').click();document.querySelector('.searchbox').prepend(back);
 const filter=$('filterToggle');filter.setAttribute('aria-controls','province city program');
 function decorateFilter(){
  const open=form.classList.contains('filters-open');
  filter.setAttribute('aria-expanded',String(open));filter.setAttribute('aria-label',open?'상세필터 닫기':'지역·관심 정보 상세필터');
  filter.innerHTML=icon('filter')+`<span>${open?'필터 닫기':'상세필터'}</span>`;
 }
 function closeFilters(){form.classList.remove('filters-open');decorateFilter();}
 filter.onclick=()=>{form.classList.toggle('filters-open');decorateFilter();};decorateFilter();
 form.addEventListener('submit',()=>{if(active()){closeFilters();$('q').blur();}});
 const originalMap=$('navMap').onclick;
 $('navMap').onclick=()=>{if(active()){closeFilters();setMobileSheet(expanded()?'focus':'split');}else originalMap();};
 $('navMap').setAttribute('aria-controls','mobileResultsSheet');
 $('navMore').innerHTML=icon('more')+'<span>더보기</span>';
 const more=document.querySelector('#moreDialog .more-menu');
 const home=document.createElement('button');home.type='button';home.innerHTML=icon('building')+'홈으로 돌아가기';home.onclick=()=>{$('moreDialog').close();$('navHome').click();};more.prepend(home);
 const route=document.createElement('button');route.type='button';route.innerHTML=icon('map')+'센터 길찾기';route.onclick=()=>{$('moreDialog').close();$('navRoute').click();};more.append(route);
 const phone=document.createElement('a');phone.href='tel:18999988';phone.innerHTML=icon('phone')+'치매상담 1899-9988';more.append(phone);
 for(const [id,name,label] of [['mapLayer','layers','지도 종류'],['fit','fit','전체 결과 보기'],['zoomIn','plus','지도 확대'],['zoomOut','minus','지도 축소']]){
  $(id).innerHTML=icon(name)+`<span>${label}</span>`;$(id).title=label;
  if(id!=='mapLayer')$(id).setAttribute('aria-label',label);
 }
 const empty=document.createElement('button');empty.id='mapEmptyNotice';empty.type='button';empty.innerHTML=icon('search')+'<span>검색 결과 없음 · 전체 보기</span>';empty.onclick=()=>$('emptyReset')?.click();document.querySelector('.map-canvas').append(empty);
 let wasActive=false;
 function sync(){
  const enabled=active();
  body.classList.toggle('mobile-map-experience',enabled);
  if(enabled!==wasActive){
   wasActive=enabled;closeFilters();types.close();
   if(enabled){types.append(chips);setMobileSheet('focus');}else anchor.after(chips);
  }
  const choice=chips.querySelector('[aria-pressed=true]');
  typeButton.innerHTML=icon(typeIcons[choice?.dataset.type||''])+`<span>${choice?.textContent||'전체'} ▾</span>`;
  typeButton.setAttribute('aria-label',`센터 유형 선택: ${choice?.textContent||'전체'}`);
  $('navMap').innerHTML=enabled?icon(expanded()?'map':'list')+`<span>${expanded()?'지도':'목록'} <b>${$('count').textContent}</b></span>`:icon('pin')+'<span>센터지도</span>';
  if(enabled){$('navMap').removeAttribute('aria-current');$('navMap').setAttribute('aria-expanded',String(expanded()));}
  else $('navMap').removeAttribute('aria-expanded');
  empty.hidden=!enabled||expanded()||!$('emptyReset');
 }
 types.addEventListener('close',()=>{if(active())typeButton.focus({preventScroll:true});});
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||!active()||document.querySelector('dialog[open]'))return;
  if(form.classList.contains('filters-open')){event.preventDefault();closeFilters();filter.focus();}
  else if(expanded()){event.preventDefault();setMobileSheet('focus');$('navMap').focus();}
 });
 new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['data-care-mode','data-mobile-sheet']});
 new MutationObserver(sync).observe($('count'),{childList:true,characterData:true,subtree:true});
 new MutationObserver(sync).observe(chips,{attributes:true,attributeFilter:['aria-pressed'],subtree:true});
 media.addEventListener('change',sync);sync();
}
