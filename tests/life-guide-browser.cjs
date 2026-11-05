const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const origin = process.env.TEST_ORIGIN || 'http://localhost:3100';
const guide = origin + '/life-guide.html';
const topics = ['prevention', 'screening', 'family', 'safety', 'support'];

(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 960}});
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(new URL(request.url())));
    fs.mkdirSync('test-results', {recursive: true});
    const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const active = async id => {
      await page.locator('#' + id).waitFor({state: 'visible'});
      assert.equal(await page.locator('.chapter:visible').count(), 1);
      assert.equal(await page.locator('#topics [aria-current="location"]').getAttribute('href'), '#' + id);
    };

    await page.goto(guide);
    await active('prevention');
    assert.equal(await page.locator('.rules li').count(), 9);
    await page.screenshot({path: 'test-results/life-guide-desktop.png'});
    for (const id of topics.slice(1)) {
      const link = page.locator('#topics a[href="#' + id + '"]');
      await link.focus();
      await page.keyboard.press('Enter');
      await active(id);
      assert.ok(await page.locator('#' + id + ' h2').evaluate(el => el === document.activeElement));
    }
    await page.goBack(); await active('safety');
    assert.equal(await page.locator('#safety .urgent a').getAttribute('href'), 'tel:112');
    await page.goForward(); await active('support');
    await page.reload(); await active('support');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({width, height: 844});
      for (const large of [true, false]) {
        await page.locator('#guideTextSize').click();
        assert.equal(await page.locator('#guideTextSize').getAttribute('aria-pressed'), String(large));
        for (const id of topics) {
          await page.locator('#topics a[href="#' + id + '"]').click();
          await active(id); await noOverflow();
        }
      }
    }
    await page.setViewportSize({width: 390, height: 844});
    await page.goto(guide);
    await active('prevention');
    await page.screenshot({path: 'test-results/life-guide-mobile.png'});
    assert.ok(requests.every(url => url.origin === origin && !url.pathname.startsWith('/data/')),
      '생활정보를 읽을 때 센터 데이터, 지도, 외부 스크립트를 요청하지 않는다');

    // 생활정보에서 선택한 주제와 글자 크기가 실제 센터 검색으로 전달되는지 확인한다.
    await page.locator('#guideTextSize').click();
    await page.locator('#topics a[href="#screening"]').click();
    await page.locator('#screening .action').click();
    await page.locator('.center-card').first().waitFor();
    await page.locator('.welcome-ad-close').click();
    assert.equal(await page.locator('#program').inputValue(), '검사·상담');
    assert.equal(await page.locator('#largeText').getAttribute('aria-pressed'), 'true');
    await page.locator('#largeText').click();
    await page.goBack(); await active('screening');
    assert.equal(await page.locator('#guideTextSize').getAttribute('aria-pressed'), 'false');
    await page.locator('#topics a[href="#family"]').click();
    await page.locator('#family .action').click();
    await page.locator('.center-card').first().waitFor();
    assert.equal(await page.locator('#program').inputValue(), '가족지원');
    await page.locator('.header a.life-guide-link').click(); await active('prevention');
    await page.goBack();
    await page.locator('#navMore').click();
    await page.locator('#moreDialog a[href="life-guide.html"]').click(); await active('prevention');
    await page.goBack();
    if (await page.locator('#moreDialog').isVisible()) await page.locator('#closeMore').click();
    await page.locator('#guideOpen').click();
    await page.locator('#guideDialog a[href="life-guide.html"]').click(); await active('prevention');
    await page.goto(origin + '/?q=' + encodeURIComponent('광명'));
    await page.locator('.map-pin').first().waitFor();
    await page.locator('#navMore').click();
    await page.locator('#moreDialog a[href="life-guide.html"]').click(); await active('prevention');
    await page.goBack();
    assert.equal(await page.locator('#q').inputValue(), '광명');
    assert.deepEqual(errors, []);

    const plain = await browser.newContext({javaScriptEnabled: false, viewport: {width: 320, height: 720}});
    const plainPage = await plain.newPage();
    await plainPage.goto(guide + '#safety');
    assert.equal(await plainPage.locator('.chapter:visible').count(), topics.length);
    assert.equal(await plainPage.locator('#safety a[href="tel:112"]').isVisible(), true);
    assert.equal(await plainPage.locator('#guideTextSize').isVisible(), false);
    console.log('생활정보 5개 주제 · 키보드/공유 주소/뒤로·앞으로 · 큰글씨 · 320~1440px · 주제별 센터 검색 · 모바일 더보기 · JavaScript 없는 본문 확인');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
