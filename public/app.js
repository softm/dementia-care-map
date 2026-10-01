import {icon as uiIcon,labelButton,enhanceDetail} from './ui-icons.js';
import {mountAd,syncAds} from './care-ads.js?v=20261001-bottom';
import './map-marker-placement.js';
import './map-marker-labels.js';
import {TYPES,CARE_TYPES,escapeHTML as esc,validLocation,distance,filterCenters,readState,stateURL,centerURL,careURL,safeWebsite,loadJSON} from './core.js?v=20261001-modes-ads';

// SOFTM-DEMENTIA-APP START 날짜:20261001 : 데이터·현재 검색·선택 센터 상태를 분리해 늦은 응답이 화면을 덮지 않도록 한다.
const $=id=>document.getElementById(id);
let state=readState(location.search),rows=[],visible=[],manifest,map,selected='',pageSize=40,viewBounds=false,internalMove=false,userMapMove=false,userPosition=null,userMarker,detailRequest=0,locationRequest=0,toastTimer;
const markers=new Map();
let mapDataReady=false,pendingLocation=null,mapSetupPromise,modeRevision=0,mapView=null;
const isList=()=>state.mode==='list';
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function controls(){ $('q').value=state.q;$('province').value=state.province;cities();$('city').value=state.city;$('program').value=state.program;document.querySelectorAll('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===state.type))); }
function cities(){const choices=[...new Set(rows.filter(r=>!state.province||r.province===state.province).map(r=>r.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));$('city').innerHTML='<option value="">전체 시군구</option>'+choices.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');}
function viewport(){if(!map)return null;const b=map.getBounds();return {south:b.getSW().lat(),north:b.getNE().lat(),west:b.getSW().lng(),east:b.getNE().lng()};}
function currentPoint(){if(!map)return null;const p=map.getCenter();return {lat:p.lat(),lng:p.lng()};}
function saveURL(){const next=stateURL({...state,scope:viewBounds?'map':'all',location:currentPoint()||state.location,zoom:map?.getZoom()||state.zoom},location.origin);if(selected)next.searchParams.set('center',selected);history.replaceState(null,'',next);}
function internal(fn){internalMove=true;userMapMove=false;try{fn();}finally{internalMove=false;}}
// 돌봄한눈과 같은 네이버 Maps SDK·HTML 마커 API를 사용한다.
const latLng=point=>new naver.maps.LatLng(point.lat,point.lng);
function setView(point,zoom){map.setCenter(latLng(point));map.setZoom(zoom,false);}
function fitRows(list){const points=list.filter(r=>validLocation(r.location));if(!map||isList()||!points.length)return;const bounds=new naver.maps.LatLngBounds();points.forEach(r=>bounds.extend(latLng(r.location)));internal(()=>{map.fitBounds(bounds,{top:70,right:55,bottom:60,left:55});if(map.getZoom()>13)map.setZoom(13,false);});}
function icon(row){
  const active=row.id===selected;
  const markerLabel=({center:'안심',regional:'광역',branch:'분소',other:'기타'})[row.type]||'미확인';
  const overview=[TYPES[row.type],row.province,row.city].filter(Boolean).join(' · ');
  const detail=row.programTags.length?row.programTags.join(' · '):'프로그램 미확인';
  return {content:`<div class="named-marker ${active?'active':''}" data-marker-id="${esc(row.id)}"><div class="marker-name"><span class="care-marker-title">${esc(row.name)}</span><span class="care-marker-fact care-marker-overview">${esc(overview)}</span><span class="care-marker-fact care-marker-detail">${esc(detail)}</span></div><button type="button" aria-label="${esc(row.name)}" class="map-pin ${row.type} ${active?'active':''}"><b>${markerLabel}</b></button></div>`,size:new naver.maps.Size(active?43:30,active?43:30),anchor:new naver.maps.Point(active?21:15,active?43:30)};
}
function updateMarkers(list){if(!map||isList())return;
  const host=$('map'),bounds=viewport();
  const count=list.filter(row=>validLocation(row.location)&&row.location.lat>=bounds.south&&row.location.lat<=bounds.north&&row.location.lng>=bounds.west&&row.location.lng<=bounds.east).length;
  const limit=Math.max(12,Math.min(80,Math.floor(host.clientWidth*host.clientHeight/9000)));
  host.classList.toggle('care-compact-markers',count>limit);
  const ids=new Set(list.map(r=>r.id));for(const [id,marker] of markers){if(!ids.has(id)){marker.setMap(null);naver.maps.Event.clearInstanceListeners(marker);markers.delete(id);}}list.forEach((row,i)=>{if(!validLocation(row.location))return;let marker=markers.get(row.id);if(!marker){marker=new naver.maps.Marker({map,position:latLng(row.location),icon:icon(row),title:row.name});naver.maps.Event.addListener(marker,'click',()=>openDetail(row.id,true));markers.set(row.id,marker);}else marker.setIcon(icon(row));marker.setZIndex(row.id===selected?1000:1);});}
function renderResults(markup){
  const host=$('results'),ad=host.querySelector('[data-placement="inline"]');
  for(const child of [...host.children])if(child!==ad)child.remove();
  const template=document.createElement('template');template.innerHTML=markup;let count=0;
  for(const child of [...template.content.children]){if(child.matches('.center-card'))count++;if(ad&&count<=6)host.insertBefore(child,ad);else host.append(child);}
}
function render(){
  const base=userPosition||(viewBounds?currentPoint():null);
  visible=filterCenters(rows,state,!isList()&&viewBounds?viewport():null);
  visible.sort((a,b)=>base?distance(base,a.location)-distance(base,b.location)||a.name.localeCompare(b.name,'ko'):[a.province,a.city,a.name].join('').localeCompare([b.province,b.city,b.name].join(''),'ko'));
  $('count').textContent=visible.length.toLocaleString();$('sortLabel').textContent=base?'직선거리순':'지역·이름순';
  const missing=visible.filter(r=>!validLocation(r.location)).length;
  $('scopeNote').textContent=(!isList()&&viewBounds?'현재 지도 영역의 결과입니다.':'선택한 조건의 전체 결과입니다.')+(missing?` 위치 미확인 ${missing}곳은 목록에서 확인하세요.`:'')+(state.program?' 원자료에 명시된 프로그램 기준입니다.':'');
  $('mapLabel').textContent=[state.province||'전국',state.city,TYPES[state.type]||'치매센터'].filter(Boolean).join(' ');
  if(!visible.length){renderResults('<div class="empty"><strong>찾은 센터가 없습니다.</strong><br>검색어나 지역·지도 범위를 넓혀 보세요.<br><button id="emptyReset">전체 센터 보기</button></div>');$('emptyReset').onclick=reset;}
  else{
    renderResults(visible.slice(0,pageSize).map((r,index)=>{const d=base?distance(base,r.location):Infinity;return `<article class="center-card ${r.id===selected?'selected':''}" data-id="${esc(r.id)}"><button type="button" class="card-open" aria-label="${esc(r.name)} 상세정보"><div class="card-heading"><span class="card-rank">${index+1}</span><h3>${esc(r.name)}</h3>${uiIcon('chevron')}</div><div class="card-top"><span class="badge ${r.type}">${TYPES[r.type]}</span><span class="distance">${Number.isFinite(d)?`직선 ${d.toFixed(1)}km`:!r.location?'위치 미확인':''}</span></div><p class="card-address">${uiIcon('pin')}<span>${esc(r.address)}</span></p><div class="tags">${r.programTags.length?r.programTags.map(t=>`<span>${esc(t)}</span>`).join(''):'<span>프로그램 미확인 · 상세에서 연락처 확인</span>'}</div></button><div class="card-actions"><button type="button" data-card-map="${esc(r.id)}">${uiIcon('map')}지도에서 보기</button><button type="button" data-card-detail="${esc(r.id)}">${uiIcon('info')}상세정보</button></div></article>`;}).join('')+(visible.length>pageSize?`<button class="more" id="more">센터 더 보기 (${Math.min(pageSize,visible.length)} / ${visible.length})</button>`:''));
    $('results').querySelectorAll('.center-card').forEach(card=>card.onclick=async event=>{if(event.target.closest('[data-card-map]'))await setMode('map');openDetail(card.dataset.id,true);});
    if($('more'))$('more').onclick=()=>{const top=$('results').scrollTop;pageSize+=40;render();$('results').scrollTop=top;};
  }
  updateMarkers(visible);saveURL();syncAds(isList()?'list':'map');renderSummary();
}
function search(){locationRequest++;state={...state,q:$('q').value.trim(),province:$('province').value,city:$('city').value,program:$('program').value};viewBounds=false;pageSize=40;controls();fitRows(filterCenters(rows,state));render();$('results').scrollTop=0;}
function reset(){locationRequest++;if(userMarker){userMarker.setMap(null);userMarker=null;}state={...state,q:'',type:'',province:'',city:'',program:''};controls();viewBounds=false;userPosition=null;pageSize=40;fitRows(rows);render();}
async function share(url,title){try{if(navigator.share){await navigator.share({title,url:String(url)});return;}await navigator.clipboard.writeText(String(url));toast('링크를 복사했습니다.');}catch(e){if(e.name==='AbortError')return;try{await navigator.clipboard.writeText(String(url));toast('링크를 복사했습니다.');}catch{toast('공유 링크를 복사해 주세요.');const input=document.createElement('input');input.value=String(url);input.setAttribute('aria-label','복사할 공유 링크');input.style.cssText='width:100%;padding:12px';($('detailDialog').open?$('detailBody'):$('searchForm')).append(input);input.focus();input.select();}}}
function closeDetail(){detailRequest++;selected='';state.center='';if($('detailDialog').open)$('detailDialog').close();updateMarkers(visible);document.querySelectorAll('.center-card.selected').forEach(b=>b.classList.remove('selected'));saveURL();}
async function openDetail(id,push=false){
  if(!rows.some(r=>r.id===id)){toast('현재 자료에 없는 센터입니다. 검색에서 다시 찾아주세요.');return;}
  locationRequest++;const request=++detailRequest;selected=id;const row=rows.find(r=>r.id===id);
  if(validLocation(row.location)&&map&&!isList())internal(()=>setView(row.location,Math.max(13,map.getZoom())));
  if(push){const u=stateURL({...state,scope:viewBounds?'map':'all',location:currentPoint(),zoom:map?.getZoom()},location.origin);u.searchParams.set('center',id);history.pushState(null,'',u);}
  updateMarkers(visible);document.querySelectorAll('.center-card').forEach(b=>b.classList.toggle('selected',b.dataset.id===id));
  $('detailBody').innerHTML=`<h2 id="detailTitle">${esc(row.name)}</h2><p class="muted">상세정보를 불러오고 있습니다…</p>`;if(!$('detailDialog').open)$('detailDialog').showModal();
  try{
    const center=await loadJSON(`data/dementia/details/${id}.json?v=${manifest.revision}`);if(request!==detailRequest)return;
    const website=safeWebsite(center.website);const phone=center.phone.replace(/[^\d+]/g,'');const programs=center.programs?center.programs.split(/[+\n]/).filter(Boolean):[];
    const directions=`https://map.naver.com/p/search/${encodeURIComponent(center.name+' '+center.address)}`;
    $('detailBody').innerHTML=`<span class="badge ${center.type}">${TYPES[center.type]}</span><h2 id="detailTitle">${esc(center.name)}</h2><div class="detail-meta"><small>주소</small>${esc(center.address)}${!center.location?'<p class="muted">좌표가 확인되지 않아 지도에는 표시하지 않습니다.</p>':''}</div><div class="detail-meta"><small>전화</small>${esc(center.phone)||'공개 자료에 연락처가 없습니다.'}</div><div class="detail-actions">${phone?`<a class="call" href="tel:${phone}">전화 문의</a>`:''}<a href="${directions}" target="_blank" rel="noopener">길찾기 ↗</a>${website?`<a href="${esc(website)}" target="_blank" rel="noopener">공식 홈페이지 ↗</a>`:''}<button id="shareCenter">공유</button><button id="copyAddress">주소 복사</button></div>${center.conflicts.length?'<p class="notice">출처마다 주소·연락처·유형 또는 위치 정보에 차이가 있습니다. 출처와 기준일을 함께 확인하고 방문 전 센터에 문의해 주세요.</p>':''}<section class="detail-section"><h3>검사·상담 · 가족지원 프로그램</h3>${programs.length?`<ul class="program-list">${programs.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:'<p class="muted">공개 자료에 프로그램 정보가 없습니다. 센터 전화 또는 공식 홈페이지에서 확인해 주세요.</p>'}<p class="muted">${center.fieldSources?.programs?.date?`프로그램 자료 기준일 ${esc(center.fieldSources.programs.date)}. `:""}원자료에 기재된 안내입니다. 현재 운영 여부·예약·이용 대상은 센터에 문의하세요.</p></section>${center.facilities?`<section class="detail-section"><h3>시설 안내</h3><p class="muted">${esc(center.facilities.replaceAll('+',' · '))}</p></section>`:''}<section class="detail-section"><h3>주변 돌봄도 함께 찾아보세요</h3><p class="muted">센터 위치를 기준으로 돌봄한눈의 지도를 엽니다.</p><div class="care-links">${Object.entries(CARE_TYPES).map(([type,label])=>`<a href="${esc(careURL(center,type))}" target="_blank" rel="noopener">${label} ↗</a>`).join('')}</div></section><section class="detail-section"><h3>자료 출처</h3><ul class="source-list">${center.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a><span>기준일 ${esc(s.date||'미제공')} · 원문 명칭 ${esc(s.nameInSource)}</span></li>`).join('')}</ul>${center.operator?`<p class="muted">운영기관 ${esc(center.operator)}</p>`:''}<p class="muted">치매안심은 공공데이터 기반 독립 정보 서비스입니다.</p></section>`;
    enhanceDetail();const detailAd=document.createElement('div');detailAd.className='detail-ad';$('detailPanel-basic').append(detailAd);mountAd(detailAd,'detail');
    $('shareCenter').onclick=()=>share(centerURL(id,location.origin),center.name);
    $('copyAddress').onclick=async()=>{try{await navigator.clipboard.writeText(center.address);toast('주소를 복사했습니다.');}catch{toast('위 주소를 선택해 복사해 주세요.');}};
  }catch(error){if(request!==detailRequest)return;$('detailBody').innerHTML=`<h2 id="detailTitle">${esc(row.name)}</h2><p class="muted">${esc(error.message)}</p><button class="primary-link" id="retryDetail">다시 불러오기</button>`;$('retryDetail').onclick=()=>openDetail(id);}
}
function loadNaver(){
  if(globalThis.naver?.maps?.Map)return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');let poll;const started=Date.now();
    const fail=()=>{$('mapError').hidden=false;clearTimeout(poll);script.remove();reject(new Error('네이버 지도를 불러오지 못했습니다.'));};
    window.navermap_authFailure=fail;
    const ready=()=>{if(globalThis.naver?.maps?.Map){resolve();return;}if(Date.now()-started>=12000){fail();return;}poll=setTimeout(ready,100);};
    script.src='https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=etfcybk8vf&submodules=geocoder';script.async=true;script.onerror=fail;document.head.append(script);ready();
  });
}
function setupMap(){if(map)return Promise.resolve();if(mapSetupPromise)return mapSetupPromise;mapSetupPromise=initializeMap().finally(()=>{mapSetupPromise=null;});return mapSetupPromise;}
async function initializeMap(){
  try{await loadNaver();}catch{$('mapError').hidden=false;return;}
  if(isList())return;
  map=new naver.maps.Map('map',{center:latLng(state.location||{lat:36.35,lng:127.8}),zoom:state.location?state.zoom:7,minZoom:7,maxZoom:19,zoomControl:true,zoomControlOptions:{position:naver.maps.Position.RIGHT_CENTER},scrollWheel:true,pinchZoom:true,draggable:true});
  globalThis.CareMarkerLabels.mount($('map'),map);
  naver.maps.Event.addListener(map,'dragstart',()=>{locationRequest++;userMapMove=true;});
  naver.maps.Event.addListener(map,'zoom_changed',()=>{if(!internalMove){locationRequest++;userMapMove=true;}});
  naver.maps.Event.addListener(map,'idle',()=>{if(internalMove||!userMapMove||!rows.length||isList())return;userMapMove=false;viewBounds=true;pageSize=40;render();});
  new ResizeObserver(()=>{naver.maps.Event.trigger(map,'resize');if(rows.length&&viewBounds)render();}).observe($('map'));
}
function applyPendingLocation(){
  if(!mapDataReady||!pendingLocation||isList())return;
  const {point,request}=pendingLocation;pendingLocation=null;
  if(request!==locationRequest)return;
  userPosition=point;state.province='';state.city='';controls();
  if(map){internal(()=>setView(point,14));if(userMarker)userMarker.setMap(null);userMarker=new naver.maps.Marker({map,position:latLng(point),title:'현재 위치',zIndex:5000,icon:{content:'<div class="current-position-pin" aria-label="현재 위치"></div>',anchor:new naver.maps.Point(11,11)}});viewBounds=true;}
  render();toast('현재 위치를 기준으로 센터를 찾았습니다.');
}
async function locate(initial=false){
  const request=++locationRequest;$('locate').disabled=true;$('locate').textContent='위치 확인 중…';CareLocation.hideNotice();
  try{
    // 초기 권한 요청과 조회를 공유한다. 이미 허용된 경우에도 즉시 위치를 읽는다.
    const initialResult=initial?await window.CareInitialLocation:null;
    if(request!==locationRequest)return;
    if(initialResult?.error)throw initialResult.error;
    const point=initialResult?.point||await CareLocation.request({isCurrent:()=>request===locationRequest});
    if(request!==locationRequest)return;
    if(!validLocation(point)){toast('국내 지역을 선택해 센터를 찾아주세요.');return;}
    pendingLocation={point,request};applyPendingLocation();
  }catch(error){if(request===locationRequest)CareLocation.showNotice(error,()=>locate());}
  finally{$('locate').disabled=false;labelButton('locate','locate','내 위치');}
}
async function start(){
  const useInitialLocation=!isList()&&!state.location&&!state.center&&!state.q&&!state.province&&!state.city&&!state.program;
  if(useInitialLocation)void locate(true);
  try{manifest=await loadJSON('data/dementia/manifest.json');rows=await loadJSON(`data/dementia/${manifest.file}?v=${manifest.revision}`);if(rows.length!==manifest.count||new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error('자료가 갱신 중입니다. 잠시 후 다시 시도해 주세요.');
    $('province').innerHTML='<option value="">전국 시도</option>'+[...new Set(rows.map(r=>r.province))].sort((a,b)=>a.localeCompare(b,'ko')).map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
    controls();if(!isList())await setupMap();viewBounds=!isList()&&!!state.location&&state.scope!=='all';if(!state.location)fitRows(filterCenters(rows,state));selected=state.center;render();mapDataReady=true;if(state.center)openDetail(state.center);else applyPendingLocation();
  }catch(error){$('scopeNote').textContent='자료를 불러오지 못했습니다.';$('results').innerHTML=`<div class="empty">${esc(error.message)}<br><button id="retry">다시 시도</button></div>`;$('retry').onclick=()=>location.reload();}
}
$('searchForm').onsubmit=e=>{e.preventDefault();search();};
$('province').onchange=()=>{state.province=$('province').value;state.city='';cities();search();};$('city').onchange=search;$('program').onchange=search;
// 유형 전환은 현재 검색 범위만 필터링하며 진행 중인 위치 요청과 지도 배율을 유지한다.
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{state.type=b.dataset.type;pageSize=40;controls();render();$('results').scrollTop=0;});
$('reset').onclick=reset;$('fit').onclick=()=>{locationRequest++;viewBounds=false;fitRows(filterCenters(rows,state));render();};$('searchArea').onclick=()=>{locationRequest++;viewBounds=true;render();};
$('locate').onclick=()=>locate();$('shareMap').onclick=()=>share(stateURL({...state,scope:viewBounds?'map':'all',location:currentPoint(),zoom:map?.getZoom()},location.origin),'치매안심 지도');
$('closeDetail').onclick=closeDetail;$('detailDialog').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
$('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
for(const id of ['guideOpen','helpOpen'])$(id).onclick=()=>$('guideDialog').showModal();$('closeGuide').onclick=()=>$('guideDialog').close();
$('mobileToggle').onclick=()=>{const expanded=document.body.classList.toggle('list-expanded');$('mobileToggle').textContent=expanded?'지도 크게 보기 ↓':'목록 크게 보기 ↑';if(map)internal(()=>naver.maps.Event.trigger(map,'resize'));};
window.addEventListener('popstate',async()=>{locationRequest++;detailRequest++;state=readState(location.search);selected=state.center;syncModeUI();if(!isList())await setupMap();controls();if(state.location&&map&&!isList())internal(()=>setView(state.location,state.zoom));viewBounds=!isList()&&!!state.location&&state.scope!=='all';render();if(state.center)openDetail(state.center);else if($('detailDialog').open)$('detailDialog').close();});
initializeUI();start();
// SOFTM-DEMENTIA-APP END

// SOFTM-DEMENTIA-MODES START 날짜:20261001 : 돌봄한눈의 전체 목록·지도 탐색 전환을 센터 데이터에 연결.
function syncModeUI(){
 document.body.dataset.careMode=isList()?'list':'map';
 document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode)));
 $('listSummary').hidden=!isList();
}
function renderSummary(){
 if(!isList())return;
 const regions=new Set(visible.map(row=>row.province+' '+row.city)).size;
 const located=visible.filter(row=>validLocation(row.location)).length;
 $('listSummaryBody').innerHTML=`<span><strong>${visible.length.toLocaleString()}곳</strong> 검색 결과</span><span><strong>${regions}개</strong> 시·군·구</span><span><strong>${located}곳</strong> 위치 확인</span><a href="data-status.html">자료 기준일·출처 ${uiIcon('external')}</a>`;
}
async function setMode(next){
 next=next==='list'?'list':'map';if(next===state.mode)return;
 if(next==='list'&&map)mapView={point:currentPoint(),zoom:map.getZoom(),scope:viewBounds,query:[state.q,state.province,state.city].join('|')};
 const revision=++modeRevision;locationRequest++;pendingLocation=null;CareLocation.hideNotice();
 state.mode=next;viewBounds=false;pageSize=40;syncModeUI();
 if(!isList()){
  await setupMap();if(revision!==modeRevision||isList())return;
  if(map){internal(()=>naver.maps.Event.trigger(map,'resize'));if(mapView&&mapView.query===[state.q,state.province,state.city].join('|')){internal(()=>setView(mapView.point,mapView.zoom));viewBounds=mapView.scope;}else if(state.location&&!state.q&&!state.province&&!state.city){internal(()=>setView(state.location,state.zoom));viewBounds=state.scope!=='all';}else if(!state.q&&!state.province&&!state.city&&userPosition){internal(()=>setView(userPosition,14));viewBounds=true;}else fitRows(filterCenters(rows,state));}
 }
 render();$('results').scrollTop=0;
 // 목록에서 처음 지도를 열 때만 권한을 요청하며, 직접 검색한 지역은 유지한다.
 if(!isList()&&!userPosition&&!state.location&&!state.q&&!state.province&&!state.city&&!state.center)void locate();
}
function initializeUI(){
 for(const [id,name,label] of [['locate','locate','내 위치'],['fit','grid','전체 결과'],['shareMap','share','지도 공유'],['reset','reset','초기화'],['listLocate','locate','내 주변 지도'],['shareList','share','검색 공유'],['closeDetail','close',''],['closeGuide','close',''],['guideOpen','info','이용 안내'],['helpOpen','chevron','']])labelButton(id,name,label);
 document.querySelector('.searchbox > span').innerHTML=uiIcon('search');document.querySelector('.searchbox > button').innerHTML=uiIcon('search');
 document.querySelectorAll('[data-mode]').forEach(button=>{button.innerHTML=uiIcon(button.dataset.mode)+`<span>${button.dataset.mode==='list'?'목록':'지도'}</span>`;button.onclick=()=>setMode(button.dataset.mode);});
 $('listLocate').onclick=async()=>{await setMode('map');if(userPosition||state.location||state.q||state.province||state.city)void locate();};
 $('shareList').onclick=()=>share(stateURL({...state,scope:'all',location:null},location.origin),'치매안심 검색 결과');
 syncModeUI();
}
// SOFTM-DEMENTIA-MODES END
