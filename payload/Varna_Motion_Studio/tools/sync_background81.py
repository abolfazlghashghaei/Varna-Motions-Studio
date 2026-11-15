"""Embed the canonical native motion core before reflow, and adapters after it."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
host = ROOT / 'host/ghaf_host.jsx'
source = host.read_text()
parts = [
    ('USER_LIBRARY81_CORE', 'var VarnaUserLibrary81=' + (ROOT / 'js/user-library81-core.js').read_text().strip().rstrip(';') + ';', '/* REFLOW67_SHARED_BEGIN */'),
    ('BACKGROUND81_CORE', 'var VarnaBackgroundMotion81=' + (ROOT / 'js/background-motion81-core.js').read_text().strip().rstrip(';') + ';', '/* REFLOW67_SHARED_BEGIN */'),
    ('USER_LIBRARY81_HOST', (ROOT / 'host/user-library81.jsx').read_text().strip(), '/* Only publish readiness after every adapter has completed initialization. */'),
    ('BACKGROUND81_HOST', (ROOT / 'host/background81.jsx').read_text().strip(), '/* Only publish readiness after every adapter has completed initialization. */'),
]
for name, content, anchor in parts:
    start, end = '/* ' + name + '_BEGIN */', '/* ' + name + '_END */'
    block = start + '\n' + content + '\n' + end
    if start in source:
        a = source.index(start)
        b = source.index(end, a) + len(end)
        source = source[:a] + block + source[b:]
    else:
        if anchor not in source:
            raise ValueError('Host synchronization anchor not found')
        source = source.replace(anchor, block + '\n' + anchor, 1)
if '--check' in sys.argv:
    if host.read_text() != source:
        raise SystemExit('Background81 host differs from canonical sources')
else:
    host.write_text(source)
