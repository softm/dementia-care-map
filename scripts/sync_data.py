#!/usr/bin/env python3
"""MASTER의 공개 JSON 전체를 검증 후 로컬 스냅샷으로 복사한다. 원본은 수정하지 않는다."""
import argparse, hashlib, json, os, shutil, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MASTER = ROOT.parent/'homecare-nationwide-care-services-map'
PUBLIC_DIRS = {'care','care-photos','hira','nhis','dementia'}

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def remove_generated(path):
    def retry(function,name,error):
        metadata=Path(name)/'.DS_Store'
        if metadata.is_file(): metadata.unlink()
        function(name)
    shutil.rmtree(path,onerror=retry)

def inventory(master):
    files=[]
    for path in sorted((master/'data').rglob('*')):
        if not path.is_file() or not (path.name.endswith('.json') or path.name.endswith('.json.gz')): continue
        if path.is_symlink(): raise ValueError('공개 자료에 심볼릭 링크를 허용하지 않습니다.')
        rel=path.relative_to(master/'data')
        if rel.parts[0] not in PUBLIC_DIRS: raise ValueError('새 공개 데이터 디렉터리를 검토하고 PUBLIC_DIRS에 추가하세요: '+str(rel))
        files.append({'path':rel.as_posix(),'bytes':path.stat().st_size,'sha256':digest(path)})
    required={'care/manifest.json','nhis/manifest.json','dementia/manifest.json','dementia/centers.json.gz'}
    if not required.issubset({r['path'] for r in files}): raise ValueError('MASTER 필수 자료가 없습니다. MASTER에서 치매 데이터를 먼저 생성하세요.')
    return files

def sync(master):
    master=master.resolve()
    if master==ROOT: raise ValueError('치매안심 자체를 MASTER로 사용할 수 없습니다.')
    files=inventory(master)
    revision=hashlib.sha256(json.dumps(files,sort_keys=True).encode()).hexdigest()
    commit=subprocess.check_output(['git','-C',str(master),'rev-parse','HEAD'],text=True).strip()
    dirty=bool(subprocess.check_output(['git','-C',str(master),'status','--porcelain','--','data'],text=True).strip())
    metadata={'schemaVersion':1,'masterRepository':'softm/homecare-nationwide-care-services-map','masterCommit':commit,
        'includesLocalChanges':dirty,'revision':revision,'fileCount':len(files),'bytes':sum(r['bytes'] for r in files),'files':files}
    target=ROOT/'data'; backup=ROOT/'.cache/data-previous';backup.parent.mkdir(exist_ok=True)
    # 다운로드·복사 중 오류가 나면 기존 스냅샷과 서비스 빌드를 보존한다.
    with tempfile.TemporaryDirectory(prefix='data-',dir=ROOT/'.cache') as temp:
        staged=Path(temp)/'data';staged.mkdir()
        for item in files:
            source=master/'data'/item['path'];dest=staged/item['path'];dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(source,dest)
            if digest(dest)!=item['sha256']: raise ValueError('동기화 도중 MASTER 변경 감지: '+item['path'])
        if inventory(master)!=files: raise ValueError('동기화 도중 MASTER 파일 목록 또는 내용이 변경되었습니다. 다시 실행하세요.')
        (staged/'sync-manifest.json').write_text(json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+'\n')
        if backup.exists(): remove_generated(backup)
        if target.exists(): target.rename(backup)
        try: staged.rename(target)
        except Exception:
            if backup.exists(): backup.rename(target)
            raise
    if backup.exists(): remove_generated(backup)
    print(f'공개 JSON {len(files):,}개 · {metadata["bytes"]/1024/1024:.1f} MiB · MASTER {commit[:10]} · 검증 완료')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--master',type=Path,default=Path(os.environ.get('MASTER_DIR',DEFAULT_MASTER)))
    sync(parser.parse_args().master)
