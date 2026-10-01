const MASTER='softm/homecare-nationwide-care-services-map';
const SITE='softm/dementia-care-map';
export function number(value){return typeof value==='number'&&Number.isFinite(value)?value.toLocaleString('ko-KR'):'미확인';}
export function koreanTime(value){if(!value)return '미확인';const date=new Date(value);return Number.isNaN(date.getTime())?'미확인':new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'short',timeStyle:'short',hour12:false}).format(date);}
export function runStatus(run){
  if(['queued','waiting','requested','pending'].includes(run.status))return ['대기 중','running'];
  if(run.status==='in_progress')return ['실행 중','running'];
  if(run.status!=='completed')return ['미확인',''];
  return ({success:['성공','good'],failure:['실패','error'],timed_out:['시간 초과','error'],cancelled:['취소','warn'],skipped:['건너뜀','warn'],neutral:['중립',''],action_required:['확인 필요','warn'],startup_failure:['시작 실패','error'],stale:['만료','warn']})[run.conclusion]||['미확인',''];
}
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const byId=id=>document.getElementById(id);
function link(label,url){const a=el('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
async function fetchJSON(url){const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000),referrerPolicy:'no-referrer',headers:{Accept:'application/json'}});if(!response.ok)throw new Error(String(response.status));return response.json();}
async function published(){
  try{
    const m=await fetchJSON('data/dementia/manifest.json');
    byId('metrics').replaceChildren(...[['통합 센터',m.count],['출처 간 차이',m.conflictCount],['좌표 미확인',m.withoutCoordinates]].map(([label,value])=>{const card=el('div',label,'status-metric');card.append(el('strong',number(value)+(typeof value==='number'?'곳':'')));return card;}));
    byId('sourceRows').replaceChildren(...['standard','nmc'].map(key=>{const row=el('tr');const cell=el('td');const source=m.sources?.[key];const urls={standard:'https://www.data.go.kr/data/15021138/standard.do',nmc:'https://www.data.go.kr/data/15138421/fileData.do'};cell.append(link(source?.name||key,urls[key]));row.append(cell,el('td',number(m.sourceCounts?.[key])),el('td',source?.sourceDate||'미확인'));return row;}));
    byId('typeSummary').textContent=Object.entries({center:'안심센터',regional:'광역센터',branch:'분소·분관',other:'기타'}).map(([key,label])=>`${label} ${number(m.types?.[key])}곳`).join(' · ');
    byId('publishedNote').textContent='현재 사이트에 반영된 공개 자료 기준입니다.';
  }catch{byId('publishedNote').textContent='자료 확인 실패 · 최신 상태 확인을 눌러 다시 시도해 주세요.';byId('metrics').replaceChildren();byId('sourceRows').replaceChildren();byId('typeSummary').textContent='';}
}
async function syncStatus(){
  const target=byId('syncSummary');
  try{const m=await fetchJSON('data/sync-manifest.json');target.replaceChildren();if(/^[a-f0-9]{40}$/.test(m.masterCommit)){target.append('원본 버전 ',link(m.masterCommit.slice(0,10),`https://github.com/${MASTER}/commit/${m.masterCommit}`));}else target.append('원본 버전 미확인');target.append(m.includesLocalChanges?' · 로컬 미커밋 자료 포함':' · 저장된 원본 기준');}
  catch{target.textContent='반영된 원본 버전 미확인 · 다시 시도해 주세요.';}
}
async function workflow(repo,file,id){
  const target=byId(id);
  try{
    const data=await fetchJSON(`https://api.github.com/repos/${repo}/actions/workflows/${file}/runs?branch=main&per_page=5`);
    if(!Array.isArray(data.workflow_runs))throw new Error('invalid');
    if(!data.workflow_runs.length){target.textContent='최근 실행 기록이 없습니다.';return;}
    const shell=el('div',undefined,'table-shell');shell.tabIndex=0;shell.setAttribute('role','region');shell.setAttribute('aria-label',id==='collectionRuns'?'수집 실행 기록 표':'배포 실행 기록 표');
    const table=el('table'),head=el('thead'),header=el('tr'),body=el('tbody');
    for(const label of ['실행','계기','상태','시작 시각','최근 변경']){const th=el('th',label);th.scope='col';header.append(th);}head.append(header);
    for(const run of data.workflow_runs){const row=el('tr'),cell=el('td');if(Number.isSafeInteger(run.id)&&run.id>0)cell.append(link(`#${run.run_number||run.id}`,`https://github.com/${repo}/actions/runs/${run.id}`));else cell.textContent='미확인';const [label,tone]=runStatus(run),state=el('td');state.append(el('span',label,`status-badge ${tone}`));row.append(cell,el('td',({schedule:'예약',workflow_dispatch:'수동',push:'코드 반영'})[run.event]||'기타'),state,el('td',koreanTime(run.run_started_at||run.created_at)),el('td',koreanTime(run.updated_at)));body.append(row);}
    table.append(head,body);shell.append(table);target.replaceChildren(shell);
  }catch{target.textContent='실행 상태 미확인 · GitHub 조회 제한 또는 연결 오류일 수 있습니다. 위 Actions 링크에서 확인하세요.';}
}
let refreshing=false;
async function refresh(){if(refreshing)return;refreshing=true;const button=byId('refreshStatus');button.disabled=true;button.textContent='확인 중…';await Promise.allSettled([published(),syncStatus(),workflow(MASTER,'refresh-dementia.yml','collectionRuns'),workflow(SITE,'pages.yml','deploymentRuns')]);byId('checkedAt').textContent=`마지막 확인 시도 ${koreanTime(new Date().toISOString())} · 조회 실패 여부는 각 항목에 표시됩니다.`;button.disabled=false;button.textContent='최신 상태 확인';refreshing=false;}
if(typeof document!=='undefined'){byId('refreshStatus').addEventListener('click',refresh);refresh();setInterval(()=>{if(!document.hidden)refresh();},90000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});}
