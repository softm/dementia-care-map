import test from 'node:test';
import assert from 'node:assert/strict';
import {AD_CONFIG} from '../public/ad-config.js';
test('치매안심 매체에 발급된 광고 6개를 위치별로 분리한다',()=>{
 assert.equal(AD_CONFIG.domain,'dementia.designboard.net');assert.equal(AD_CONFIG.media,'NyJ');
 const units=Object.values(AD_CONFIG.placements).flatMap(p=>Object.values(p));
 assert.equal(units.length,6);assert.equal(new Set(units.map(p=>p.unit)).size,6);
 for(const slot of units){assert.match(slot.unit,/^DAN-[A-Za-z0-9]+$/);assert.ok((slot.width===728&&slot.height===90)||(slot.width===320&&slot.height===100));}
});
