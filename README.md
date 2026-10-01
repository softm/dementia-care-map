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

`data/care`, `data/care-photos`, `data/hira`, `data/nhis`, `data/dementia`를 전부 동기화합니다. MASTER에 새 최상위 데이터 디렉터리가 생기면 동기화를 실패시켜 공개 범위를 확인한 뒤 허용 목록을 확장하도록 합니다. 기존 디렉터리의 새 파일과 삭제는 자동 반영됩니다. 원본·비밀키·서버 코드는 복사하지 않습니다. 모든 JSON 요청은 치매안심 자신의 Origin으로 제한됩니다.

초기 화면은 치매 매니페스트와 압축 검색 인덱스 두 개만 가져옵니다. 센터 상세는 선택한 센터 JSON 한 개만 요청합니다. 장기요양기관·사진 데이터는 배포 산출물에 있지만 초기 브라우저에서 로딩하지 않습니다. 첫 버전의 주변 기관 탐색은 센터 좌표를 전달해 돌봄한눈으로 연결합니다.

## 구현과 재사용

정적 HTML/CSS/ES modules를 사용합니다. 돌봄한눈의 gzip 자동 판별·요청 캐시·실패 재시도와 목록-마커 선택, 화면영역 검색, 공유 파라미터 설계를 재사용했습니다. 원래 사이트는 리팩터링하지 않습니다. 기존 네이버 지도 Application에 새 도메인이 등록되기 전에도 지도 검색이 가능하도록 Leaflet 1.9.4와 OpenStreetMap을 사용합니다. 라이브러리는 로컬에 고정하고 저작권 파일을 포함합니다. 타일은 표준 URL과 브라우저 캐시·Referer·출처 표시를 유지하며 대량 선다운로드하지 않습니다. 길찾기는 카카오맵으로 연결하며 좌표가 없으면 네이버 지도 주소 검색으로 연결합니다.

기관 유형은 `center`, `regional`, `branch`, `other`입니다. 검색 URL은 `q`, `type`, `p`, `c`, `program`, `lat`, `lng`, `z`, `scope`; 센터 전용 공유 URL은 `center=dc-…`만 사용합니다. 위치 권한은 내 위치 버튼을 눌렀을 때 요청하며 위치를 저장하지 않습니다.

## 갱신·배포

MASTER에서 주 1회 및 수동으로 두 공식 데이터가 갱신됩니다. 치매안심의 GitHub Actions는 매일 07:17 KST, 코드 push, 수동 실행에 MASTER의 한 커밋을 체크아웃하고 전체 데이터를 검증해 GitHub Pages artifact로 배포합니다. 저장소 간 쓰기 토큰이나 공용 DB는 필요 없습니다. 실패한 동기화·검증은 배포하지 않아 기존 사이트를 유지합니다.

배포 전에 MASTER의 새 치매 데이터와 두 저장소의 코드가 원격에 반영되어 있어야 합니다. 원격 반영은 MASTER를 먼저 푸시한 뒤 이 저장소를 푸시하는 순서로 진행합니다. GitHub 저장소 Pages의 Source를 GitHub Actions로 설정하고 custom domain에 `dementia.designboard.net`을 지정합니다. DNS의 `dementia` CNAME은 `softm.github.io`로 연결하고 HTTPS를 확인합니다. `public/CNAME`과 canonical·OG·사이트맵은 새 도메인을 사용합니다.

`sync-manifest.json`은 MASTER 커밋·데이터 해시·공개 파일 목록과 로컬 미커밋 자료 포함 여부를 기록합니다. CI에서는 체크아웃 시점이 고정됩니다. 로컬 MASTER의 수집이 실행 중이면 수집 완료 후 동기화하세요. 이전 스냅샷 복원을 원하면 MASTER의 원하는 커밋을 별도 체크아웃하여 `--master`로 동기화·재빌드합니다.

## 검증

`npm run check`는 검색/좌표/공유/안전한 링크 테스트, 데이터 동기화 실패 시 보존 테스트, MASTER와 모든 파일의 해시 일치·센터 상세 참조를 확인합니다. MASTER의 `tests/test_dementia.py`는 두 필수 출처·중복 병합·분소 구분·좌표 결측·최신 주소와 옛 좌표의 혼합 방지를 검사합니다. 실제 브라우저의 검색·필터·마커·상세·현재위치·모바일·공유 검증은 `tests/browser-check.cjs`를 사용합니다.

브라우저 검사는 Chrome과 Playwright가 있는 환경에서 `node tests/browser-check.cjs`로 실행합니다. Playwright가 없다면 테스트용으로 `npm install --no-save --package-lock=false playwright`를 사용하거나 `PLAYWRIGHT_MODULE`에 설치 경로를 지정하세요. 실행 중인 돌봄한눈 주소를 `MASTER_ORIGIN=http://127.0.0.1:3101`로 지정하면 실제 메뉴의 반대 방향 지역 전달도 검사합니다. 캡처와 결과는 Git에서 제외되는 `test-results/`에 저장됩니다.
