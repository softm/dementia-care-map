import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function locationModule(getCurrentPosition){const context=vm.createContext({navigator:{geolocation:{getCurrentPosition}},setTimeout,clearTimeout,CustomEvent:class {}});vm.runInContext(readFileSync(new URL('../public/care-location.js',import.meta.url),'utf8'),context);return context.CareLocation;}
test('위치 조회는 8초 안에 한 번만 시도하고 고정밀 자동 재시도를 하지 않는다',async()=>{
  const calls=[];const api=locationModule((_ok,fail,options)=>{calls.push(options);fail({code:3});});
  await assert.rejects(api.request(),{reason:'timeout'});assert.equal(calls.length,1);assert.equal(calls[0].enableHighAccuracy,false);assert.equal(calls[0].timeout,8000);
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

test('브라우저가 응답하지 않아도 대기를 종료하고 늦은 응답을 무시하며 재요청한다',async()=>{
  let expire,accept,calls=0;
  const context=vm.createContext({setTimeout:fn=>{expire=fn;return 1;},clearTimeout:()=>{},navigator:{geolocation:{getCurrentPosition:ok=>{calls++;accept=ok;}}},CustomEvent:class {}});
  vm.runInContext(readFileSync(new URL('../public/care-location.js',import.meta.url),'utf8'),context);
  const first=context.CareLocation.request();expire();await assert.rejects(first,{reason:'timeout'});
  accept({coords:{latitude:37.5,longitude:127}});
  const second=context.CareLocation.request();accept({coords:{latitude:35.1,longitude:129}});
  assert.equal((await second).lat,35.1);assert.equal(calls,2);
});
