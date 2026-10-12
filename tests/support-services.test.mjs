import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORT_GUIDE_URL,SUPPORT_SERVICES} from '../public/support-services.js';

test('국가지원 핵심 5종의 공개 인터페이스가 고정되어 있다',()=>{
 assert.deepEqual(SUPPORT_SERVICES.map(service=>service.id),['screening-cost','treatment-cost','care-supplies','missing-prevention','public-guardianship']);
 assert.equal(new Set(SUPPORT_SERVICES.map(service=>service.id)).size,5);
 assert.ok(SUPPORT_SERVICES.every(service=>service.label&&service.description));
 assert.equal(new URL(SUPPORT_GUIDE_URL).hostname,'www.nid.or.kr');
});
