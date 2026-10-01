import {TYPES,CARE_TYPES,escapeHTML as esc,validLocation,distance,filterCenters,readState,stateURL,centerURL,careURL,safeWebsite,loadJSON} from './core.js';

// SOFTM-DEMENTIA-APP START 날짜:20261001 : 데이터·현재 검색·선택 센터 상태를 분리해 늦은 응답이 화면을 덮지 않도록 한다.
const $=id=>document.getElementById(id);
let state=readState(location.search),rows=[],visible=[],manifest,map,markerLayer,selected='',pageSize=40,viewBounds=false,internalMove=false,userMapMove=false,userPosition=null,userMarker,detailRequest=0,locationRequest=0,toastTimer;
const markers=new Map();
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function controls(){ $('q').value=state.q;$('province').value=state.province;cities();$('city').value=state.city;$('program').value=state.program;document.querySelectorAll('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===state.type))); }
function cities(){const choices=[...new Set(rows.filter(r=>!state.province||r.province===state.province).map(r=>r.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));$('city').innerHTML='<option value="">전체 시군구</option>'+choices.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');}
function viewport(){if(!map)return null;const b=map.getBounds();return {south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()};}
function currentPoint(){if(!map)return null;const p=map.getCenter();return {lat:p.lat,lng:p.lng};}
function saveURL(){const next=stateURL({...state,scope:viewBounds?'map':'all',location:currentPoint()||state.location,zoom:map?.getZoom()||state.zoom},location.origin);if(selected)next.searchParams.set('center',selected);history.replaceState(null,'',next);}
function internal(fn){internalMove=true;userMapMove=false;try{fn();}finally{internalMove=false;}}
function fitRows(list){const points=list.filter(r=>validLocation(r.location)).map(r=>[r.location.lat,r.location.lng]);if(!map||!points.length)return;internal(()=>map.fitBounds(points,{padding:[55,60],maxZoom:13,animate:false}));}
function icon(row,rank){const active=row.id===selected;return L.divIcon({className:'pin-wrap',html:`<span class="map-pin ${row.type} ${active?'active':''}"><b>${rank}</b></span>`,iconSize:active?[43,43]:[30,30],iconAnchor:active?[21,43]:[15,30]});}
function updateMarkers(list){if(!map)return;const ids=new Set(list.map(r=>r.id));for(const [id,marker] of markers){if(!ids.has(id)){markerLayer.removeLayer(marker);markers.delete(id);}}list.forEach((row,i)=>{if(!validLocation(row.location))return;let marker=markers.get(row.id);if(!marker){marker=L.marker([row.location.lat,row.location.lng],{icon:icon(row,i+1),title:row.name,keyboard:true}).addTo(markerLayer);marker.on('click',()=>openDetail(row.id,true));marker.on('add',()=>marker.getElement()?.setAttribute('aria-label',row.name));marker.bindTooltip(esc(row.name),{className:'map-tooltip',direction:'top',offset:[0,-24]});markers.set(row.id,marker);}else marker.setIcon(icon(row,i+1));marker.setZIndexOffset(row.id===selected?1000:0);marker.getElement()?.setAttribute('aria-label',row.name);});}
function render(){
  const base=userPosition||(viewBounds?currentPoint():null);
  visible=filterCenters(rows,state,viewBounds?viewport():null);
  visible.sort((a,b)=>base?distance(base,a.location)-distance(base,b.location)||a.name.localeCompare(b.name,'ko'):[a.province,a.city,a.name].join('').localeCompare([b.province,b.city,b.name].join(''),'ko'));
  $('count').textContent=visible.length.toLocaleString();$('sortLabel').textContent=base?'직선거리순':'지역·이름순';
  const missing=visible.filter(r=>!validLocation(r.location)).length;
  $('scopeNote').textContent=(viewBounds?'현재 지도 영역의 결과입니다.':'선택한 조건의 전체 결과입니다.')+(missing?` 위치 미확인 ${missing}곳은 목록에서 확인하세요.`:'')+(state.program?' 원자료에 명시된 프로그램 기준입니다.':'');
  $('mapLabel').textContent=[state.province||'전국',state.city,TYPES[state.type]||'치매센터'].filter(Boolean).join(' ');
  if(!visible.length){$('results').innerHTML='<div class="empty"><strong>찾은 센터가 없습니다.</strong><br>검색어나 지역·지도 범위를 넓혀 보세요.<br><button id="emptyReset">전체 센터 보기</button></div>';$('emptyReset').onclick=reset;}
  else{
    $('results').innerHTML=visible.slice(0,pageSize).map(r=>{const d=base?distance(base,r.location):Infinity;return `<button class="center-card ${r.id===selected?'selected':''}" data-id="${r.id}" aria-label="${esc(r.name)} 상세정보"><div class="card-top"><span class="badge ${r.type}">${TYPES[r.type]}</span><span class="distance">${Number.isFinite(d)?`직선 ${d.toFixed(1)}km`:!r.location?'위치 미확인':''}</span></div><h3>${esc(r.name)}</h3><span class="card-arrow" aria-hidden="true">↗</span><p>${esc(r.address)}</p><div class="tags">${r.programTags.length?r.programTags.map(t=>`<span>${t}</span>`).join(''):'<span>상세정보에서 연락처 확인</span>'}</div></button>`;}).join('')+(visible.length>pageSize?`<button class="more" id="more">센터 더 보기 (${Math.min(pageSize,visible.length)} / ${visible.length})</button>`:'');
    $('results').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>openDetail(b.dataset.id,true));if($('more'))$('more').onclick=()=>{const top=$('results').scrollTop;pageSize+=40;render();$('results').scrollTop=top;};
  }
  updateMarkers(visible);saveURL();
}
function search(){locationRequest++;state={...state,q:$('q').value.trim(),province:$('province').value,city:$('city').value,program:$('program').value};viewBounds=false;pageSize=40;controls();fitRows(filterCenters(rows,state));render();$('results').scrollTop=0;}
function reset(){state={...state,q:'',type:'',province:'',city:'',program:''};controls();viewBounds=false;userPosition=null;pageSize=40;fitRows(rows);render();}
async function share(url,title){try{if(navigator.share){await navigator.share({title,url:String(url)});return;}await navigator.clipboard.writeText(String(url));toast('링크를 복사했습니다.');}catch(e){if(e.name==='AbortError')return;try{await navigator.clipboard.writeText(String(url));toast('링크를 복사했습니다.');}catch{toast('공유 링크를 복사해 주세요.');const input=document.createElement('input');input.value=String(url);input.setAttribute('aria-label','복사할 공유 링크');input.style.cssText='width:100%;padding:12px';($('detailDialog').open?$('detailBody'):$('searchForm')).append(input);input.focus();input.select();}}}
function closeDetail(){detailRequest++;selected='';state.center='';if($('detailDialog').open)$('detailDialog').close();updateMarkers(visible);document.querySelectorAll('.center-card.selected').forEach(b=>b.classList.remove('selected'));saveURL();}
async function openDetail(id,push=false){
  if(!rows.some(r=>r.id===id)){toast('현재 자료에 없는 센터입니다. 검색에서 다시 찾아주세요.');return;}
  const request=++detailRequest;selected=id;const row=rows.find(r=>r.id===id);
  if(validLocation(row.location)&&map)internal(()=>map.setView([row.location.lat,row.location.lng],Math.max(13,map.getZoom()),{animate:false}));
  if(push){const u=stateURL({...state,scope:viewBounds?'map':'all',location:currentPoint(),zoom:map?.getZoom()},location.origin);u.searchParams.set('center',id);history.pushState(null,'',u);}
  updateMarkers(visible);document.querySelectorAll('.center-card').forEach(b=>b.classList.toggle('selected',b.dataset.id===id));
  $('detailBody').innerHTML=`<h2 id="detailTitle">${esc(row.name)}</h2><p class="muted">상세정보를 불러오고 있습니다…</p>`;if(!$('detailDialog').open)$('detailDialog').showModal();
  try{
    const center=await loadJSON(`data/dementia/details/${id}.json?v=${manifest.revision}`);if(request!==detailRequest)return;
    const website=safeWebsite(center.website);const phone=center.phone.replace(/[^\d+]/g,'');const programs=center.programs?center.programs.split(/[+\n]/).filter(Boolean):[];
    const directions=validLocation(center.location)?`https://map.kakao.com/link/to/${encodeURIComponent(center.name)},${center.location.lat},${center.location.lng}`:`https://map.naver.com/p/search/${encodeURIComponent(center.address)}`;
    $('detailBody').innerHTML=`<span class="badge ${center.type}">${TYPES[center.type]}</span><h2 id="detailTitle">${esc(center.name)}</h2><div class="detail-meta"><small>주소</small>${esc(center.address)}${!center.location?'<p class="muted">좌표가 확인되지 않아 지도에는 표시하지 않습니다.</p>':''}</div><div class="detail-meta"><small>전화</small>${esc(center.phone)||'공개 자료에 연락처가 없습니다.'}</div><div class="detail-actions">${phone?`<a class="call" href="tel:${phone}">전화 문의</a>`:''}<a href="${directions}" target="_blank" rel="noopener">길찾기 ↗</a>${website?`<a href="${esc(website)}" target="_blank" rel="noopener">공식 홈페이지 ↗</a>`:''}<button id="shareCenter">공유</button><button id="copyAddress">주소 복사</button></div>${center.conflicts.length?'<p class="notice">출처마다 주소·연락처·유형 또는 위치 정보에 차이가 있습니다. 출처와 기준일을 함께 확인하고 방문 전 센터에 문의해 주세요.</p>':''}<section class="detail-section"><h3>검사·상담 · 가족지원 프로그램</h3>${programs.length?`<ul class="program-list">${programs.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:'<p class="muted">공개 자료에 프로그램 정보가 없습니다. 센터 전화 또는 공식 홈페이지에서 확인해 주세요.</p>'}<p class="muted">${center.fieldSources?.programs?.date?`프로그램 자료 기준일 ${esc(center.fieldSources.programs.date)}. `:""}원자료에 기재된 안내입니다. 현재 운영 여부·예약·이용 대상은 센터에 문의하세요.</p></section>${center.facilities?`<section class="detail-section"><h3>시설 안내</h3><p class="muted">${esc(center.facilities.replaceAll('+',' · '))}</p></section>`:''}<section class="detail-section"><h3>주변 돌봄도 함께 찾아보세요</h3><p class="muted">센터 위치를 기준으로 돌봄한눈의 지도를 엽니다.</p><div class="care-links">${Object.entries(CARE_TYPES).map(([type,label])=>`<a href="${esc(careURL(center,type))}" target="_blank" rel="noopener">${label} ↗</a>`).join('')}</div></section><section class="detail-section"><h3>자료 출처</h3><ul class="source-list">${center.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a><span>기준일 ${esc(s.date||'미제공')} · 원문 명칭 ${esc(s.nameInSource)}</span></li>`).join('')}</ul>${center.operator?`<p class="muted">운영기관 ${esc(center.operator)}</p>`:''}<p class="muted">치매안심은 공공데이터 기반 독립 정보 서비스입니다.</p></section>`;
    $('shareCenter').onclick=()=>share(centerURL(id,location.origin),center.name);
    $('copyAddress').onclick=async()=>{try{await navigator.clipboard.writeText(center.address);toast('주소를 복사했습니다.');}catch{toast('위 주소를 선택해 복사해 주세요.');}};
  }catch(error){if(request!==detailRequest)return;$('detailBody').innerHTML=`<h2 id="detailTitle">${esc(row.name)}</h2><p class="muted">${esc(error.message)}</p><button class="primary-link" id="retryDetail">다시 불러오기</button>`;$('retryDetail').onclick=()=>openDetail(id);}
}
function setupMap(){
  if(!globalThis.L){$('mapError').hidden=false;return;}
  map=L.map('map',{zoomControl:false,minZoom:6,maxZoom:19}).setView([36.2,127.8],7);
  markerLayer=L.markerClusterGroup({showCoverageOnHover:false,disableClusteringAtZoom:13,maxClusterRadius:48,animate:false,iconCreateFunction:cluster=>L.divIcon({className:'cluster-wrap',html:`<span class="cluster">${cluster.getChildCount()}</span>`,iconSize:[44,44]})}).addTo(map);
  L.control.zoom({position:'topright',zoomInTitle:'지도 확대',zoomOutTitle:'지도 축소'}).addTo(map);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
  let tileFailures=0;tiles.on('tileerror',()=>{if(++tileFailures>=3)$('mapError').hidden=false;});tiles.on('tileload',()=>{tileFailures=0;$('mapError').hidden=true;});
  map.on('dragstart',()=>locationRequest++);
  map.on('movestart',()=>{if(!internalMove)userMapMove=true;});
  map.on('moveend',()=>{if(internalMove||!userMapMove||!rows.length)return;userMapMove=false;viewBounds=true;pageSize=40;render();});
  map.on('resize',()=>{if(rows.length&&viewBounds)render();});
  if(state.location)internal(()=>map.setView([state.location.lat,state.location.lng],state.zoom,{animate:false}));
}
async function locate(){
  if(!navigator.geolocation){toast('이 브라우저에서는 현재 위치를 확인할 수 없습니다. 지역을 선택해 주세요.');return;}
  const request=++locationRequest;$('locate').disabled=true;$('locate').textContent='위치 확인 중…';
  navigator.geolocation.getCurrentPosition(pos=>{if(request===locationRequest){const point={lat:pos.coords.latitude,lng:pos.coords.longitude};if(!validLocation(point)){toast('국내 지역을 선택해 센터를 찾아주세요.');}else{userPosition=point;state.province='';state.city='';controls();if(map){internal(()=>map.setView([point.lat,point.lng],12,{animate:false}));if(userMarker)map.removeLayer(userMarker);userMarker=L.circleMarker([point.lat,point.lng],{radius:8,color:'white',weight:3,fillColor:'#297bd7',fillOpacity:1}).addTo(map).bindTooltip('현재 위치');viewBounds=true;}render();toast('현재 위치를 기준으로 센터를 찾았습니다.');}}finish();},error=>{if(request===locationRequest)toast(error.code===1?'위치 사용이 차단되었습니다. 지역을 직접 선택해 주세요.':'현재 위치를 확인하지 못했습니다. 다시 시도하거나 지역을 선택해 주세요.');finish();},{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
  function finish(){$('locate').disabled=false;$('locate').innerHTML='◎ <span>내 위치</span>';}
}
async function start(){
  try{manifest=await loadJSON('data/dementia/manifest.json');rows=await loadJSON(`data/dementia/${manifest.file}?v=${manifest.revision}`);if(rows.length!==manifest.count||new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error('자료가 갱신 중입니다. 잠시 후 다시 시도해 주세요.');
    $('province').innerHTML='<option value="">전국 시도</option>'+[...new Set(rows.map(r=>r.province))].sort((a,b)=>a.localeCompare(b,'ko')).map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
    controls();setupMap();viewBounds=!!state.location&&state.scope!=='all';if(!state.location)fitRows(filterCenters(rows,state));selected=state.center;render();if(state.center)openDetail(state.center);
  }catch(error){$('scopeNote').textContent='자료를 불러오지 못했습니다.';$('results').innerHTML=`<div class="empty">${esc(error.message)}<br><button id="retry">다시 시도</button></div>`;$('retry').onclick=()=>location.reload();}
}
$('searchForm').onsubmit=e=>{e.preventDefault();search();};
$('province').onchange=()=>{state.province=$('province').value;state.city='';cities();search();};$('city').onchange=search;$('program').onchange=search;
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{state.type=b.dataset.type;search();});
$('reset').onclick=reset;$('fit').onclick=()=>{locationRequest++;viewBounds=false;fitRows(filterCenters(rows,state));render();};$('searchArea').onclick=()=>{viewBounds=true;render();};
$('locate').onclick=locate;$('shareMap').onclick=()=>share(stateURL({...state,scope:viewBounds?'map':'all',location:currentPoint(),zoom:map?.getZoom()},location.origin),'치매안심 지도');
$('closeDetail').onclick=closeDetail;$('detailDialog').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
$('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
for(const id of ['guideOpen','helpOpen'])$(id).onclick=()=>$('guideDialog').showModal();$('closeGuide').onclick=()=>$('guideDialog').close();
$('mobileToggle').onclick=()=>{const expanded=document.body.classList.toggle('list-expanded');$('mobileToggle').textContent=expanded?'지도 크게 보기 ↓':'목록 크게 보기 ↑';if(map)internal(()=>map.invalidateSize({pan:false}));};
window.addEventListener('popstate',()=>{detailRequest++;state=readState(location.search);selected=state.center;controls();if(state.location&&map)internal(()=>map.setView([state.location.lat,state.location.lng],state.zoom,{animate:false}));viewBounds=!!state.location&&state.scope!=='all';render();if(state.center)openDetail(state.center);else if($('detailDialog').open)$('detailDialog').close();});
start();
// SOFTM-DEMENTIA-APP END
