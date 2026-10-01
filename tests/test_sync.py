import importlib.util, json, tempfile, unittest
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('sync',Path(__file__).resolve().parents[1]/'scripts/sync_data.py')
sync=importlib.util.module_from_spec(spec);spec.loader.exec_module(sync)

class SyncTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name);self.master=self.base/'master';self.site=self.base/'site';self.site.mkdir()
        self.patch=patch.object(sync,'ROOT',self.site);self.patch.start();self.addCleanup(self.patch.stop)
        for name in ['care/manifest.json','nhis/manifest.json','dementia/manifest.json','dementia/centers.json.gz']:
            p=self.master/'data'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b'{}')
    def test_all_public_files_exact_and_deleted_files_removed(self):
        old=self.site/'data/obsolete.json';old.parent.mkdir();old.write_text('{}')
        extra=self.master/'data/nhis/details/11/test.json.gz';extra.parent.mkdir(parents=True);extra.write_bytes(b'abc')
        with patch.object(sync.subprocess,'check_output',side_effect=['abc123','']):sync.sync(self.master)
        self.assertFalse(old.exists());self.assertEqual((self.site/'data/nhis/details/11/test.json.gz').read_bytes(),b'abc')
        meta=json.loads((self.site/'data/sync-manifest.json').read_text());self.assertEqual(meta['fileCount'],5)
    def test_missing_source_preserves_previous(self):
        old=self.site/'data/keep.json';old.parent.mkdir();old.write_text('keep')
        (self.master/'data/dementia/manifest.json').unlink()
        with self.assertRaises(ValueError):sync.sync(self.master)
        self.assertEqual(old.read_text(),'keep')
    def test_unknown_directory_requires_public_review(self):
        p=self.master/'data/private/example.json';p.parent.mkdir();p.write_text('{}')
        with self.assertRaises(ValueError):sync.inventory(self.master)
    def test_non_json_and_raw_sources_not_copied(self):
        (self.master/'data/care/.env').write_text('never copy')
        self.assertEqual(len(sync.inventory(self.master)),4)

if __name__=='__main__':unittest.main()
