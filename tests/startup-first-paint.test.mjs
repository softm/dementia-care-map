import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');

test('시작 화면은 외부 CSS보다 먼저 표시되고 본 화면 스타일 준비까지 유지된다',()=>{
  const startupStyle=html.indexOf('id="hannunStartupStyle"');
  assert.notEqual(startupStyle,-1);
  assert.ok(startupStyle<html.indexOf('<link'));
  assert.doesNotMatch(html,/<link[^>]+rel="stylesheet"/s);
  assert.match(html,/link\[data-hannun-style\]/);
  assert.match(html,/setTimeout\(\(\)=>f\(true\),8000\)/);
});
