// SOFTM-DEMENTIA-UI 날짜:20261001 : 돌봄한눈처럼 동작별 선형 SVG 아이콘과 텍스트를 함께 제공.
const paths={
 map:'m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15',
 list:'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
 search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 locate:'M12 2v3M12 19v3M2 12h3M19 12h3M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
 pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 info:'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 share:'M12 16V3M7 8l5-5 5 5M5 13v7h14v-7',
 reset:'M3 10a9 9 0 1 1 2 8M3 4v6h6',
 close:'m6 6 12 12M18 6 6 18',
 phone:'M6 3H3v4c0 8 6 14 14 14h4v-5l-5-2-3 3-6-6 3-3-2-5H6Z',
 external:'M14 3h7v7M21 3l-11 11M10 3H3v18h18v-7',
 copy:'M8 8h13v13H8V8ZM16 8V3H3v13h5',
 building:'M4 21V3h12v18M16 9h4v12M8 7h4M8 11h4M8 15h4M9 21v-3h2v3',
 heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
 chevron:'m9 5 7 7-7 7', grid:'M3 3h7v7H3V3ZM14 3h7v7h-7V3ZM3 14h7v7H3v-7ZM14 14h7v7h-7v-7'
};
export const icon=name=>`<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name]||paths.info}"/></svg>`;
export function labelButton(id,name,label){const el=document.getElementById(id);if(el)el.innerHTML=icon(name)+`<span>${label}</span>`;}
export function enhanceDetail(){
 const host=document.getElementById('detailBody');
 const hero=document.createElement('div');hero.className='detail-hero';
 hero.append(host.querySelector('.badge'),host.querySelector('h2'));
 const actions=host.querySelector('.detail-actions');
 actions.querySelectorAll('a,button').forEach(el=>{const text=el.textContent.replace(' ↗','');const name=el.matches('.call')?'phone':el.id==='shareCenter'?'share':el.id==='copyAddress'?'copy':text.includes('길찾기')?'map':'external';el.innerHTML=icon(name)+`<span>${text}</span>`;});
 const tabs=document.createElement('div');tabs.className='detail-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','센터 상세 항목');
 const panels=document.createElement('div');panels.className='detail-panels';
 const definitions=[['basic','기본정보','building'],['programs','프로그램','heart'],['care','주변 돌봄','map'],['sources','자료 출처','info']];
 definitions.forEach(([key,label,name],i)=>{
  const button=document.createElement('button');button.type='button';button.id=`detailTab-${key}`;button.setAttribute('role','tab');button.setAttribute('aria-controls',`detailPanel-${key}`);button.innerHTML=icon(name)+label;
  const panel=document.createElement('section');panel.id=`detailPanel-${key}`;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;panel.hidden=i!==0;
  button.onclick=()=>selectTab(i);tabs.append(button);panels.append(panel);
 });
 function selectTab(index){[...tabs.children].forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;panels.children[i].hidden=i!==index;});}
 tabs.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const current=[...tabs.children].indexOf(document.activeElement);const next=event.key==='Home'?0:event.key==='End'?3:(current+(event.key==='ArrowRight'?1:3))%4;selectTab(next);tabs.children[next].focus();};
 [...host.children].forEach(el=>{if(el===actions)return;let key=0;if(el.classList.contains('detail-section')){const heading=el.querySelector('h3')?.textContent||'';key=heading.includes('자료 출처')?3:heading.includes('주변 돌봄')?2:1;}panels.children[key].append(el);});
 host.replaceChildren(hero,actions,tabs,panels);selectTab(0);
}
