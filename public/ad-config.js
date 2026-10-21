// Android WebView uses a native AdMob banner instead of web ad placements.
export const NATIVE_ADS = /\bAdMobNative\/1\b/.test(globalThis.navigator?.userAgent || '');
// SOFTM-DEMENTIA-ADS 날짜:20261022 : 하단 접이식 PC·모바일 전용 단위를 AdFit에서 새로 발급. 자동 새로고침 없음.
export const AD_CONFIG=Object.freeze({
 media:'NyJ',domain:'dementia.designboard.net',enabled:!NATIVE_ADS,
 script:'https://t1.kakaocdn.net/kas/static/ba.min.js',
 placements:{
  bottom:{desktop:{unit:'DAN-uP9h4q9UzSfgTSIC',width:728,height:90},mobile:{unit:'DAN-gTztk29syTBi635f',width:320,height:100}},
  map:{desktop:{unit:'DAN-qM3KYPOwePM7kwpl',width:728,height:90},mobile:{unit:'DAN-V1vn22LSCYpNlOq1',width:320,height:100}},
  list:{desktop:{unit:'DAN-isDQDeChPru8i1K6',width:728,height:90},mobile:{unit:'DAN-iLTrwoG83KVVUYQV',width:320,height:100}},
  inline:{mobile:{unit:'DAN-ziZ3GlYni7QBIMny',width:320,height:100}},
  detail:{mobile:{unit:'DAN-VKlZHUB69XgUrO4e',width:320,height:100}}
 }
});
