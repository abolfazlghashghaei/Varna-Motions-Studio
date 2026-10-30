"""Materialize checksum-pinned Media3 build dependencies (never resolve floating versions)."""
from pathlib import Path
import json,urllib.request,hashlib,zipfile,os
ROOT=Path(__file__).resolve().parents[1];cache=Path(os.environ.get('MEDIA59_CACHE','/workspace/shared/native59/maven'));cache.mkdir(parents=True,exist_ok=True)
lock=json.loads((ROOT/'native59/media-lock.json').read_text())
for x in lock:
 p=cache/x['file']
 if not p.exists():
  with urllib.request.urlopen(x['url'],timeout=60) as r:p.write_bytes(r.read())
 if hashlib.sha256(p.read_bytes()).hexdigest()!=x['sha256']:raise RuntimeError('Checksum mismatch '+x['file'])
 if x['type']=='aar':
  dest=cache/(x['name']+'-'+x['version']);dest.mkdir(exist_ok=True)
  with zipfile.ZipFile(p) as z:z.extractall(dest)
print(cache)
