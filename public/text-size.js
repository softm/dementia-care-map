// 지도와 생활정보에서 같은 탭의 큰글씨 선택을 공유한다.
export function initializeTextSize(render) {
  const key = 'dementiaLargeText';
  let large = false;
  function apply() {
    document.body.classList.toggle('large-text', large);
    render(large);
  }
  function restore() {
    try { large = sessionStorage.getItem(key) === '1'; } catch {}
    apply();
  }
  restore();
  window.addEventListener('pageshow', event => { if (event.persisted) restore(); });
  return () => {
    large = !large;
    try { sessionStorage.setItem(key, large ? '1' : '0'); } catch {}
    apply();
  };
}
