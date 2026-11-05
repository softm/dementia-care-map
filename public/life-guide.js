import {initializeTextSize} from './text-size.js?v=20261105';

const textButton = document.getElementById('guideTextSize');
textButton.onclick = initializeTextSize(large => {
  textButton.setAttribute('aria-pressed', String(large));
  textButton.textContent = large ? '일반 글씨' : '큰글씨';
});
textButton.hidden = false;

// 각 주제는 정적 본문과 일반 링크다. 스크립트가 없으면 모든 장을 이어 읽는다.
const chapters = [...document.querySelectorAll('.chapter')];
const topics = [...document.querySelectorAll('.topics a')];
let current = chapters[0];

function showTopic() {
  const target = chapters.find(chapter => '#' + chapter.id === location.hash);
  if (target) current = target;
  else if (!location.hash) current = chapters[0];
  for (const chapter of chapters) chapter.hidden = chapter !== current;
  for (const link of topics) {
    if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  if (target) {
    target.querySelector('h2').focus({preventScroll: true});
    target.scrollIntoView({block: 'start'});
  }
}
window.addEventListener('hashchange', showTopic);
showTopic();
