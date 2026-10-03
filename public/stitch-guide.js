// Stitch c067e783ea7d4bba90c2e17287bfd603: 큰글씨 이용 안내. 비용·대상·준비물은 센터별 확인으로 안내한다.
import {icon} from './ui-icons.js';
export function initializeGuide(){
 document.querySelector('#guideDialog .guide-body').innerHTML=`
 <div class="guide-intro"><span class="guide-mode-label">쉽게 읽는 이용 안내</span><button id="guideLargeText" type="button" aria-pressed="false">큰글씨로 보기</button></div>
 <h2 id="guideTitle">처음 오셨나요?<br>차근차근 함께 찾아보세요.</h2>
 <section class="guide-call"><span>치매에 대해 궁금한 점이 있다면</span><h3>치매상담콜센터</h3><strong>1899-9988</strong><a href="tel:18999988">${icon('phone')} 전화로 상담 문의하기</a><a class="guide-call-source" href="https://www.korea.kr/news/policyNewsView.do?newsId=148930507" target="_blank" rel="noopener">상담 안내 출처 · 정책브리핑 ↗</a></section>
 <section class="guide-section"><h3>${icon('list')} 센터 이용, 쉬운 3단계</h3>
 <div class="guide-step"><b>1</b><div><span class="guide-step-label">1단계 · 찾기</span><h4>우리 동네 센터 찾기</h4><p>지역이나 센터 이름으로 검색하세요. 위치를 허용하면 현재 위치 주변을 살펴볼 수 있습니다.</p><button id="guideFind" type="button">${icon('locate')} 내 주변 센터 찾기</button></div></div>
 <div class="guide-step"><b>2</b><div><span class="guide-step-label">2단계 · 문의</span><h4>방문 전 전화로 확인하기</h4><p>센터 상세의 전화번호로 연락해 예약 여부, 이용 대상, 비용과 방문 시간을 확인하세요.</p><p class="guide-tip">헛걸음하지 않도록 출발 전에 확인하세요.</p></div></div>
 <div class="guide-step"><b>3</b><div><span class="guide-step-label">3단계 · 방문</span><h4>안내받은 준비물 챙기기</h4><p>센터가 안내한 서류와 준비물을 챙기고, 상세 화면의 길찾기로 방문 경로를 확인하세요.</p></div></div></section>
 <section class="guide-section guide-checklist"><h3>${icon('copy')} 방문 전에 물어보세요</h3><ul><li><strong>본인 확인에 필요한 서류</strong><span>신분증 등 어떤 서류를 가져가야 하는지 확인하세요.</span></li><li><strong>복용 중인 약 관련 자료</strong><span>처방전이나 약봉투가 필요한지 문의하세요.</span></li><li><strong>가족이 함께 방문하거나 대신 문의할 때</strong><span>관계 확인 서류와 대리 신청 가능 여부를 확인하세요.</span></li></ul></section>
 <section class="guide-section"><h3>${icon('heart')} 센터에 문의할 수 있는 서비스</h3><p>제공 여부와 대상·비용은 센터 및 사업에 따라 다릅니다.</p><div class="guide-services"><article>${icon('info')}<h4>검사·상담</h4><p>기억력과 인지 건강이 걱정될 때 검사·상담 절차를 문의하세요.</p></article><article>${icon('heart')}<h4>예방·쉼터 프로그램</h4><p>진행 중인 프로그램과 참여 대상·신청 방법을 확인하세요.</p></article><article>${icon('building')}<h4>가족·돌봄 지원</h4><p>가족지원 프로그램과 돌봄 관련 지원 사업을 문의하세요.</p></article><article>${icon('pin')}<h4>실종 예방 지원</h4><p>센터에서 안내하는 실종 예방 서비스와 신청 절차를 확인하세요.</p></article></div></section>
 <section class="guide-section guide-faq"><h3>${icon('info')} 자주 묻는 질문</h3><details><summary>검사 비용은 얼마인가요?</summary><p>검사 종류와 지원 조건에 따라 달라질 수 있습니다. 방문할 센터에 비용과 지원 대상을 먼저 확인하세요.</p></details><details><summary>검사에 얼마나 걸리나요?</summary><p>검사·상담 종류와 센터 일정에 따라 다릅니다. 예약할 때 예상 소요시간을 물어보세요.</p></details><details><summary>가족이 대신 문의할 수 있나요?</summary><p>센터에 전화해 가족의 문의·예약 가능 여부와 필요한 서류를 확인하세요.</p></details></section>
 <button id="guideBrowse" class="primary-link" type="button">${icon('search')} 센터 검색으로 돌아가기</button><p class="muted">치매안심은 공공데이터 기반 독립 정보 서비스입니다. 진단·의료 상담이나 예약 접수를 제공하지 않습니다.</p>`;
 const feedback=document.createElement('section');feedback.className='guide-section';feedback.innerHTML=`<h3>${icon('info')} 이용 중 어려움이 있나요?</h3><div class="guide-feedback"><article><h4>검색 결과가 없을 때</h4><p>검색어를 짧게 바꾸거나 시·군·구 범위를 넓혀 보세요.</p><button id="guideReset">전체 센터 다시 찾기</button></article><article><h4>지도를 불러오지 못할 때</h4><p>목록에서 센터 주소와 상세정보를 계속 확인할 수 있습니다.</p><button id="guideList">목록으로 계속 보기</button></article><article><h4>미확인 정보 안내</h4><p>공개 자료에 없는 운영시간·프로그램·연락처는 추측하지 않고 미확인으로 표시합니다. 방문 전 센터에 문의하세요.</p><a href="about.html#sources">공공데이터 출처 확인</a></article></div>`;
 document.getElementById('guideBrowse').before(feedback);
 document.getElementById('guideReset').onclick=()=>{document.getElementById('reset').click();document.getElementById('guideDialog').close();document.getElementById('navHome').click();};
 document.getElementById('guideList').onclick=()=>{document.getElementById('guideDialog').close();document.getElementById('navHome').click();};
 document.getElementById('guideFind').onclick=()=>{document.getElementById('guideDialog').close();document.getElementById('listLocate').click();};
 document.getElementById('guideBrowse').onclick=()=>{document.getElementById('guideDialog').close();document.getElementById('q').focus();};
}
