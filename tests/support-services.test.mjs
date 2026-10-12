import test from 'node:test';
import assert from 'node:assert/strict';
import * as support from '../public/support-services.js';

test('센터별 지원 판정값 없이 공식 안내서만 제공한다',()=>{
 assert.deepEqual(Object.keys(support).sort(),['SUPPORT_GUIDE_URL','SUPPORT_GUIDE_YEAR']);
 assert.equal(support.SUPPORT_GUIDE_YEAR,2024);
 assert.equal(new URL(support.SUPPORT_GUIDE_URL).hostname,'www.nid.or.kr');
});
