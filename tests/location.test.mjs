import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function locationModule(getCurrentPosition){const context=vm.createContext({navigator:{geolocation:{getCurrentPosition}},CustomEvent:class {}});vm.runInContext(readFileSync(new URL('../public/care-location.js',import.meta.url),'utf8'),context);return context.CareLocation;}
test('위치 신호 실패는 고정밀 재시도하고 권한 차단은 재요청하지 않는다',async()=>{
  const calls=[];const api=locationModule((ok,fail,options)=>{calls.push(options);if(calls.length===1)fail({code:3});else ok({coords:{latitude:37.5,longitude:127}});});
  const point=await api.request();assert.equal(point.lat,37.5);assert.deepEqual(calls.map(o=>o.enableHighAccuracy),[false,true]);assert.deepEqual(calls.map(o=>o.timeout),[15000,20000]);
  let denied=0;const blocked=locationModule((_ok,fail)=>{denied++;fail({code:1});});await assert.rejects(blocked.request(),{reason:'denied'});assert.equal(denied,1);
});
test('동시 위치 요청 공유와 취소된 검색의 재시도 중지',async()=>{
  let accept,count=0;const api=locationModule(ok=>{count++;accept=ok;});const first=api.request(),second=api.request();assert.equal(first,second);accept({coords:{latitude:37.5,longitude:127}});await first;assert.equal(count,1);
  let attempts=0;const cancelled=locationModule((_ok,fail)=>{attempts++;fail({code:2});});await assert.rejects(cancelled.request({isCurrent:()=>false}),{reason:'unavailable'});assert.equal(attempts,1);
});
test('유효하지 않은 좌표와 보안·정책 제한을 구분한다',async()=>{
  const api=locationModule(ok=>ok({coords:{latitude:NaN,longitude:127}}));await assert.rejects(api.request(),{reason:'unavailable'});
  await assert.rejects(api.requestPosition({isSecureContext:false}),{reason:'insecure'});
  await assert.rejects(api.requestPosition({document:{permissionsPolicy:{allowsFeature:()=>false}}}),{reason:'policy'});
  await assert.rejects(api.requestPosition({navigator:{}}),{reason:'unsupported'});
});
