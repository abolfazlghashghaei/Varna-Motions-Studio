"""Embed the canonical ES3 geometry and host adapter; --check verifies byte equality."""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
p = ROOT / 'host/ghaf_host.jsx'
start = '/* REFLOW67_SHARED_BEGIN */'
end = '/* REFLOW67_SHARED_END */'
core = (ROOT / 'js/reflow67-core.js').read_text().strip().rstrip(';')
adapter = (ROOT / 'host/reflow67.jsx').read_text().strip()
block = start + '\nvar VarnaReflow67=' + core + ';\n' + adapter + '\n' + end
source = p.read_text()
if start in source:
    a = source.index(start)
    b = source.index(end, a) + len(end)
    updated = source[:a] + block + source[b:]
else:
    marker = '/* Only publish readiness after every adapter has completed initialization. */'
    updated = source.replace(marker, block + '\n' + marker, 1)
if '--check' in sys.argv:
    if source != updated:
        raise SystemExit('Reflow67 host embedding differs from its canonical source')
else:
    p.write_text(updated)
