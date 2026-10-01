#!/usr/bin/env python3
"""서버 없는 정적 배포 산출물. 동기화된 데이터는 Git에 중복 저장하지 않는다."""
import argparse, gzip, hashlib, json, shutil, tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def remove_generated(path):
    def retry(function, name, error):
        # Finder가 정리 중 생성한 메타파일은 빌드 결과에 영향을 주지 않는다.
        metadata=Path(name)/'.DS_Store'
        if metadata.is_file(): metadata.unlink()
        function(name)
    shutil.rmtree(path,onerror=retry)

def validate(root):
    data=root/'data'
    sync=json.loads((data/'sync-manifest.json').read_text())
    for item in sync['files']:
        path=data/item['path']
        if not path.is_file() or path.stat().st_size!=item['bytes'] or hashlib.sha256(path.read_bytes()).hexdigest()!=item['sha256']:
            raise ValueError('MASTER와 다른 파일: '+str(path))
    manifest=json.loads((data/'dementia/manifest.json').read_text())
    rows=json.loads(gzip.decompress((data/'dementia'/manifest['file']).read_bytes()))
    assert len(rows)==manifest['count'] and len({r['id'] for r in rows})==len(rows)
    assert set(manifest['sourceCounts'])=={'standard','nmc'}
    for row in rows:
        detail=json.loads((data/'dementia/details'/f"{row['id']}.json").read_text())
        assert detail['id']==row['id'] and detail['sources']
    assert sum(i['bytes'] for i in sync['files'])<900*1024*1024, '정적 배포 용량 재검토 필요'
    print(f'검증: 센터 {len(rows)}곳 · 두 필수 출처 · 공유 파일 {sync["fileCount"]:,}개 무결성 일치')

def build():
    validate(ROOT)
    cache=ROOT/'.cache';cache.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='build-',dir=cache) as temp:
        dest=Path(temp)/'dist';shutil.copytree(ROOT/'public',dest,ignore=shutil.ignore_patterns('.DS_Store'))
        shutil.copytree(ROOT/'data',dest/'data',ignore=shutil.ignore_patterns('.DS_Store'))
        assert (dest/'index.html').exists()
        backup=cache/'dist-previous'
        if backup.exists(): remove_generated(backup)
        if (ROOT/'dist').exists(): (ROOT/'dist').rename(backup)
        try: dest.rename(ROOT/'dist')
        except Exception:
            if backup.exists(): backup.rename(ROOT/'dist')
            raise
        if backup.exists(): remove_generated(backup)
    print('빌드 완료: dist/ · dementia.designboard.net')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true')
    if parser.parse_args().check: validate(ROOT)
    else: build()
