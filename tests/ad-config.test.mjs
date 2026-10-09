import test from 'node:test';
import assert from 'node:assert/strict';
import {AD_CONFIG} from '../public/ad-config.js';
test('치매안심 매체에 발급된 광고 8개를 위치별로 분리한다',()=>{
 assert.equal(AD_CONFIG.domain,'dementia.designboard.net');assert.equal(AD_CONFIG.media,'NyJ');
 const units=Object.values(AD_CONFIG.placements).flatMap(p=>Object.values(p));
 assert.equal(units.length,8);assert.equal(new Set(units.map(p=>p.unit)).size,8);
 for(const slot of units){assert.match(slot.unit,/^DAN-[A-Za-z0-9]+$/);assert.ok((slot.width===728&&slot.height===90)||(slot.width===320&&slot.height===100));}
});

test('네이티브 AdMob 앱에서만 웹 광고를 비활성화한다',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 try{
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:'Mozilla/5.0 Android DementiaAndroid/1 AdMobNative/1'}});
  const native=await import('../public/ad-config.js?native-test');
  assert.equal(native.NATIVE_ADS,true);assert.equal(native.AD_CONFIG.enabled,false);
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:'Mozilla/5.0 Android Chrome/130'}});
  const browser=await import('../public/ad-config.js?browser-test');
  assert.equal(browser.NATIVE_ADS,false);assert.equal(browser.AD_CONFIG.enabled,true);
 }finally{
  if(original)Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator;
 }
});
