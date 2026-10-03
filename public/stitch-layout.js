import {icon} from './ui-icons.js?v=20261003-review';
// Stitch 화면의 탐색 구조. 개인 프로필·날씨·예시 교통정보는 생성하지 않는다.
export function initializeLayout({setMode,locate,route,favorites,toggleLayer}){
 const $=id=>document.getElementById(id);
 const call=`<a class="consultation-banner" href="tel:18999988">${icon('phone')}<span><small>치매에 대해 궁금할 때</small><strong>치매상담 1899-9988</strong></span>${icon('chevron')}</a>`;
 document.querySelector('.stitch-welcome').insertAdjacentHTML('afterend',`<section class="large-intro"><strong>편하게 읽는 큰글씨 화면</strong><p>지역을 선택하거나 내 주변 센터를 찾아보세요.</p><button id="largeLocate">${icon('locate')} 내 집 근처 센터 바로 찾기 ${icon('chevron')}</button></section><div class="home-consultation">${call}</div>`);
 $('largeLocate').onclick=locate;
 document.querySelector('.sidebar-footer').insertAdjacentHTML('beforebegin',`<section class="home-guidance"><span class="eyebrow">처음 오셨나요?</span><h2>센터 이용, 이렇게 시작하세요</h2><ol><li><strong>가까운 센터 찾기</strong><p>지역이나 현재 위치로 센터를 찾아보세요.</p></li><li><strong>제공 서비스 확인하기</strong><p>검사·상담·가족지원의 공개 정보를 확인하세요.</p></li><li><strong>방문 전 전화하기</strong><p>운영시간·예약·비용·준비물을 센터에 문의하세요.</p></li></ol><button id="homeGuide">이용 안내 자세히 보기 ${icon('chevron')}</button><div class="data-assurance"><h3>공공데이터 기반 안심 정보</h3><p>자료에 없는 운영시간과 프로그램은 미확인으로 안내합니다. 실제 제공 여부는 방문 전 센터에 확인하세요.</p><a href="data-status.html">자료 갱신 현황과 기준일 ${icon('external')}</a><a href="about.html#sources">공공데이터 출처 ${icon('external')}</a></div></section>`);
 $('homeGuide').onclick=()=>$('guideDialog').showModal();
 $('mobileResultsSheet').insertAdjacentHTML('beforeend',`<a class="map-consultation" href="tel:18999988">${icon('phone')}<span><strong>치매상담콜센터 1899-9988</strong><small>궁금한 점은 전화로 문의하세요</small></span><b>통화연결</b></a>`);
 document.body.insertAdjacentHTML('beforeend',`<nav class="mobile-nav" aria-label="하단 탐색"><button id="navHome">${icon('building')}<span>홈</span></button><button id="navMap">${icon('pin')}<span>센터지도</span></button><button id="navRoute">${icon('map')}<span>길찾기</span></button><button id="navSaved">${icon('heart')}<span>즐겨찾기</span></button><button id="navMore">${icon('info')}<span>더보기</span></button></nav><dialog id="moreDialog" aria-labelledby="moreTitle"><div class="dialog-head"><h2 id="moreTitle">더보기</h2><button id="closeMore" aria-label="더보기 닫기">${icon('close')}</button></div><div class="more-menu"><button id="moreLarge">${icon('grid')} 큰글씨 전환</button><button id="moreGuide">${icon('info')} 이용 안내</button><a href="https://homecare.designboard.net/" target="_blank" rel="noopener">${icon('heart')} 돌봄·지원</a><a href="about.html#sources">${icon('building')} 공공데이터 출처</a><a href="data-status.html">${icon('reset')} 갱신 현황</a><a href="privacy.html">개인정보처리방침</a></div></dialog>`);
 $('navHome').onclick=()=>{setMode('list');document.querySelector('.workspace').scrollTop=0;};
 $('navMap').onclick=()=>setMode('map');$('navRoute').onclick=route;$('navSaved').onclick=favorites;
 $('navMore').onclick=()=>$('moreDialog').showModal();$('closeMore').onclick=()=>$('moreDialog').close();
 $('moreLarge').onclick=()=>{$('largeText').click();$('moreLarge').setAttribute('aria-pressed',$('largeText').getAttribute('aria-pressed'));};
 $('moreGuide').onclick=()=>{$('moreDialog').close();$('guideDialog').showModal();};
 document.querySelector('.map-actions').insertAdjacentHTML('afterbegin',`<button id="mapLayer" aria-label="위성지도 전환" aria-pressed="false">${icon('map')}<span>위성지도</span></button>`);$('mapLayer').onclick=toggleLayer;
 $('mapError').insertAdjacentHTML('beforeend','<button id="mapFallback">목록으로 계속 보기</button>');$('mapFallback').onclick=()=>setMode('list');
}
