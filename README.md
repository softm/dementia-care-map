# 치매안심

`dementia.designboard.net`에서 제공할 독립적인 치매센터 검색 서비스입니다. 돌봄한눈과 저장소·프론트엔드는 분리하며 새 서버와 DB를 사용하지 않습니다.

## 실행

Node.js 20 이상, Python 3.11 이상을 사용합니다. 추가 npm 설치는 필요 없습니다.

```sh
npm run sync:data
npm run check
npm run build
npm run serve
```

`http://localhost:3100`을 엽니다. 기본 MASTER는 형제 디렉터리 `homecare-nationwide-care-services-map`입니다. 다른 경로는 `python3 scripts/sync_data.py --master /absolute/master/path`로 지정합니다.

## 데이터의 유일한 원본

- 돌봄한눈 `source-data/dementia/`: 두 공식 원본·출처·영구 ID 대응표·비교 보고서.
- 돌봄한눈 `scripts/collect_dementia.py`, `scripts/build_dementia.py`: 다운로드·정규화의 유일한 구현.
- 돌봄한눈 `data/dementia/`: 검색 인덱스, 센터별 상세, 출처·개수 매니페스트.
- 이 프로젝트 `scripts/sync_data.py`: MASTER의 `data/` 아래 공개 JSON·gzip JSON 전체를 동일한 경로로 복사하고 파일별 SHA-256을 검증.
- 이 프로젝트의 `data/`, `dist/`는 생성물이며 Git에 넣지 않습니다. 데이터 편집은 MASTER에서만 합니다.

`data/care`, `data/care-photos`, `data/hira`, `data/nhis`, `data/dementia`를 전부 동기화합니다. MASTER에 새 최상위 데이터 디렉터리가 생기면 동기화를 실패시켜 공개 범위를 확인한 뒤 허용 목록을 확장하도록 합니다. 기존 디렉터리의 새 파일과 삭제는 자동 반영됩니다. 원본·비밀키·서버 코드는 복사하지 않습니다. 센터 데이터 JSON 요청은 치매안심 자신의 Origin으로 제한됩니다. 데이터 현황 페이지의 실행 기록만 GitHub 공개 API에서 조회합니다.

초기 화면은 치매 매니페스트와 압축 검색 인덱스 두 개만 가져옵니다. 센터 상세는 선택한 센터 JSON 한 개만 요청합니다. 장기요양기관·사진 데이터는 배포 산출물에 있지만 초기 브라우저에서 로딩하지 않습니다. 첫 버전의 주변 기관 탐색은 센터 좌표를 전달해 돌봄한눈으로 연결합니다.

## 구현과 재사용

정적 HTML/CSS/ES modules를 사용합니다. 돌봄한눈의 gzip 자동 판별·요청 캐시·실패 재시도와 목록-마커 선택, 화면영역 검색, 공유 파라미터 설계를 재사용했습니다. 원래 사이트는 리팩터링하지 않습니다. 돌봄한눈과 같은 네이버 Maps SDK와 공개 Application 키를 사용합니다. 배포 도메인 `https://dementia.designboard.net/`이 해당 네이버 Maps Application의 Web 서비스 URL에 등록되어 있어야 합니다. 지도 로딩 실패 시에도 목록 검색과 상세 조회는 유지됩니다. 길찾기는 네이버 지도 검색으로 연결합니다.

`public/care-location.js`와 `public/care-location-state.js`는 돌봄한눈 공통 모듈을 복사하고 화면 선택자·서비스 주소만 조정했습니다. 초기 일반 진입과 내 위치 버튼에서 같은 위치 요청을 사용하며, 허용 시 현재 위치(확대 14)로 이동합니다. 공유 위치·센터·지역 검색 진입은 보존합니다. 위치 오류는 권한 차단, 신호 불가, 시간 초과, 보안 연결·정책 제한을 구분하고 재시도와 설정 안내를 제공합니다.

기관 유형은 `center`, `regional`, `branch`, `other`입니다. 검색 URL은 `q`, `type`, `p`, `c`, `program`, `lat`, `lng`, `z`, `scope`; 센터 전용 공유 URL은 `center=dc-…`만 사용합니다. 위치 권한은 일반 첫 진입과 내 위치 버튼에서 요청합니다. 위치를 별도 서버에 저장하지 않으며, 현재 지도 중심 좌표는 검색 URL과 지도 공유 링크에 포함됩니다.

## 갱신·배포

MASTER에서 주 1회 및 수동으로 두 공식 데이터가 갱신됩니다. 치매안심의 GitHub Actions는 매일 07:17 KST, 코드 push, 수동 실행에 MASTER의 한 커밋을 체크아웃하고 전체 데이터를 검증해 GitHub Pages artifact로 배포합니다. 저장소 간 쓰기 토큰이나 공용 DB는 필요 없습니다. 실패한 동기화·검증은 배포하지 않아 기존 사이트를 유지합니다.

배포 전에 MASTER의 새 치매 데이터와 두 저장소의 코드가 원격에 반영되어 있어야 합니다. 원격 반영은 MASTER를 먼저 푸시한 뒤 이 저장소를 푸시하는 순서로 진행합니다. GitHub 저장소 Pages의 Source를 GitHub Actions로 설정하고 custom domain에 `dementia.designboard.net`을 지정합니다. DNS의 `dementia` CNAME은 `softm.github.io`로 연결하고 HTTPS를 확인합니다. `public/CNAME`과 canonical·OG·사이트맵은 새 도메인을 사용합니다.

`sync-manifest.json`은 MASTER 커밋·데이터 해시·공개 파일 목록과 로컬 미커밋 자료 포함 여부를 기록합니다. CI에서는 체크아웃 시점이 고정됩니다. 로컬 MASTER의 수집이 실행 중이면 수집 완료 후 동기화하세요. 이전 스냅샷 복원을 원하면 MASTER의 원하는 커밋을 별도 체크아웃하여 `--master`로 동기화·재빌드합니다.

## 검증

`npm run check`는 검색/좌표/공유/안전한 링크 테스트, 데이터 동기화 실패 시 보존 테스트, MASTER와 모든 파일의 해시 일치·센터 상세 참조를 확인합니다. MASTER의 `tests/test_dementia.py`는 두 필수 출처·중복 병합·분소 구분·좌표 결측·최신 주소와 옛 좌표의 혼합 방지를 검사합니다. 실제 브라우저의 검색·필터·마커·상세·현재위치·모바일·공유 검증은 `tests/browser-check.cjs`를 사용합니다.

브라우저 검사는 Chrome과 Playwright가 있는 환경에서 `node tests/browser-check.cjs`로 실행합니다. Playwright가 없다면 테스트용으로 `npm install --no-save --package-lock=false playwright`를 사용하거나 `PLAYWRIGHT_MODULE`에 설치 경로를 지정하세요. 실행 중인 돌봄한눈 주소를 `MASTER_ORIGIN=http://127.0.0.1:3101`로 지정하면 실제 메뉴의 반대 방향 지역 전달도 검사합니다. 캡처와 결과는 Git에서 제외되는 `test-results/`에 저장됩니다.

## 데이터 현황

`data-status.html`은 치매 매니페스트의 출처별 건수·기준일·통합 결과와 동기화 원본 버전을 표시합니다. 이 페이지에서만 GitHub 공개 Actions API로 수집 및 배포 최근 실행 5건을 조회하며, 보이는 동안 90초마다 갱신합니다. API 조회 실패는 자료 현황과 별도로 표시합니다. 자료 기준일은 수집 실행 시각과 구분합니다.

현황 페이지의 실제 브라우저 검증은 `node tests/data-status-browser.cjs`로 실행합니다. 기존 브라우저 검사와 동일하게 `PLAYWRIGHT_MODULE`과 `TEST_ORIGIN`을 지정할 수 있습니다.

## 화면 모드와 광고

돌봄한눈과 같은 청록색 카드·선형 아이콘·탭형 상세 구성을 사용합니다. `?mode=list`는 지도 SDK와 위치 권한 요청 없이 전체 검색 결과를 표시하고, 지도모드로 전환할 때 지도를 불러옵니다. 모드와 검색조건은 공유 URL에 보존합니다. 상세는 기본정보·프로그램·주변 돌봄·자료 출처 탭으로 구분하며 자료가 없는 항목은 미확인으로 표시합니다.

카카오 AdFit의 치매안심 전용 Web 매체는 `NyJ` / `dementia.designboard.net`입니다. 지도 상단 PC·모바일, 목록 상단 PC·모바일, 목록 6번째 카드 뒤, 센터 상세, 하단 펼침 PC·모바일의 총 8개 전용 광고단위를 `public/ad-config.js`에서 관리합니다. 실제 보이고 규격이 맞는 영역만 호출하며, 미노출·차단·개발 환경에서는 광고·제휴 안내를 표시합니다. 돌봄한눈의 광고단위를 재사용하지 않습니다. 2026-10-01 등록 당시 매체 상태는 심사 대기이며, 광고 노출 승인은 AdFit 심사 결과에 따릅니다.

`tests/ui-modes-browser.cjs`는 지도 지연 로딩·모드 전환·팝업 탭·모바일 화면을 검증합니다. 광고 연동은 [AdFit Web SDK 공식 가이드](https://github.com/adfit/adfit-web-sdk)의 광고단위 규격과 NO-AD 콜백을 사용합니다.

하단 고정 광고는 지도·목록에서 공유하며 기본 펼침, 탭 세션의 접힘 선택 유지, 목록 스크롤 중 임시 접힘을 제공합니다. 펼친 뒤 보이는 광고만 요청하고 접었다 펴거나 모드를 바꿔도 같은 규격의 광고 DOM을 유지합니다. 2026-10-01 매체 승인 확인 후 하단 전용 PC·모바일 광고단위를 추가했습니다.

## Stitch 디자인 반영

Stitch MCP 프로젝트 `9278473149944686283`의 Serene Care Clarity 테마와 홈·지도·센터 상세·이용 안내·큰글씨 화면을 `public/stitch-theme.css`에 반영했습니다. `stitch-logo.svg`는 프로젝트의 제공 SVG입니다. 큰글씨 버튼은 해당 탭의 세션에 선택을 유지합니다. 한국어는 기기의 한국어 시스템 글꼴로 표시하며 텍스트 확대를 제한하지 않습니다. 시안의 가상 센터·운영중 상태·사진·예시 연락처는 가져오지 않고 기존 공공데이터를 사용합니다. 전화번호는 센터 선택 후 실제 상세 자료를 불러온 뒤 제공합니다. 네이버 지도, 위치 권한 흐름과 기존 광고 지면은 유지합니다.

검증: `tests/stitch-browser.cjs`에서 PC/320px/390px 검색·지도·센터 연락처·큰글씨 세션 복원·안내 화면을 확인합니다.
