// 돌봄한눈과 동일하게 데이터·지도 로딩을 기다리지 않고 네이티브 위치 권한을 요청한다.
// 결과를 보관해 지도보다 위치 응답이 먼저 도착해도 중복 요청 없이 이어서 사용한다.
window.CareInitialLocation = window.CareLocation.requestInitialPermission().then(
    point => point ? { point } : null,
    error => ({ error })
);
