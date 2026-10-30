#!/usr/bin/env python3
"""Build a self-contained, offline mobile web runtime from the shared renderers."""
from pathlib import Path
import shutil, hashlib, json, subprocess
ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/'Varna_Motion_Studio'
OUT=ROOT/'mobile56/build/web'
if OUT.exists(): shutil.rmtree(OUT)
shutil.copytree(ROOT/'mobile56/web',OUT)
shared=OUT/'shared';shared.mkdir()
files=[APP/'js'/f for f in ['studio52-core.js','editor51-core.js','table-layout.js','table54-renderer.js','titles53.js','kinetic40.js','text55-core.js','text55-worker.js']]
files += [APP/'assets/text55'/f for f in ['fa.aff','fa.dic','en.aff','en.dic','sources.json']]
files += [APP/'assets/fonts/Vazirmatn.woff2']
for f in files: shutil.copy2(f,shared/f.name)
notices=['Varna Mobile Native59. Application and shared renderers: Varna Studio.\nNo native Adobe effects or AI model weights are redistributed.\n']
for f in [APP/'assets/text55'/n for n in ['THIRD_PARTY_NOTICES.md','nspell-LICENSE','is-buffer-LICENSE','fa-license','Apache-2.0.txt','en-license']]+[APP/'assets/fonts/OFL.txt']:
    notices += ['\n--- '+str(f.relative_to(APP))+' ---\n',f.read_text()]
(shared/'NOTICES.txt').write_text('\n'.join(notices))
(shared/'shared-manifest.json').write_text(json.dumps([{'source':str(f.relative_to(ROOT)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in files],indent=2)+'\n')
print(OUT)

subprocess.run(['node',str(ROOT/'native59/build-web.mjs')],cwd=ROOT,check=True)

extra=['\nMedia3 ExoPlayer 1.5.1 and AndroidX dependencies, Apache-2.0; Guava 33.3.1-android, Apache-2.0. Exact artifacts in native59/media-lock.json.\n', (ROOT/'native59/WHISPER_LICENSE').read_text()]
extra += ['\nPinned Android dependencies and their sources:\n', (ROOT/'native59/media-lock.json').read_text(), '\nWhisper source: https://github.com/ggml-org/whisper.cpp/tree/v1.8.3 (MIT). No weights bundled.\n']
(shared/'NOTICES.txt').write_text((shared/'NOTICES.txt').read_text()+'\n'.join(extra))
