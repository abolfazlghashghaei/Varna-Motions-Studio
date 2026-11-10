"""Open the shared production tools; the AE video editor is not installed here."""
import json
import os
import pathlib
import shutil
import subprocess
import urllib.request
import webbrowser
import time

def launch():
    config_path = pathlib.Path(__file__).with_suffix('.json')
    config = json.loads(config_path.read_text(encoding='utf-8-sig'))
    port = int(config.get('port', 8795))
    if not 1024 <= port <= 65535:
        raise RuntimeError('Invalid local tools port')
    address = 'http://127.0.0.1:' + str(port)
    try:
        with urllib.request.urlopen(address + '/api/health', timeout=1) as response:
            health = json.load(response)
        if health.get('host') != 'resolve':
            raise RuntimeError('The configured port belongs to another workspace')
        webbrowser.open(address + '/plugin.html?host=resolve')
        return
    except (OSError, ValueError):
        pass
    node = config.get('node') or shutil.which('node')
    if not node:
        raise RuntimeError('Install Node.js 18+ or set its executable in Motion_Tools.json')
    script = pathlib.Path(config['server'])
    if not script.is_file():
        raise RuntimeError('Shared Motion Tools installation is incomplete')
    env = dict(os.environ, VARNA_EDITOR_PORT=str(port))
    logdir = pathlib.Path(os.environ.get('LOCALAPPDATA', str(config_path.parent))) / 'VarnaMotionStudio' / 'logs'
    logdir.mkdir(parents=True, exist_ok=True)
    logfile = logdir / 'shared-tools53.log'
    with logfile.open('ab') as output:
        child = subprocess.Popen([node, str(script), '--host', 'resolve', '--open'], env=env,
                                 stdout=output, stderr=output,
                                 creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    for _ in range(40):
        if child.poll() is not None:
            raise RuntimeError('Local tools stopped during startup. Read ' + str(logfile))
        try:
            with urllib.request.urlopen(address + '/api/health', timeout=.3) as response:
                if json.load(response).get('host') == 'resolve':
                    return
        except (OSError, ValueError):
            pass
        time.sleep(.2)
    raise RuntimeError('Local tools startup timed out. Read ' + str(logfile))

if __name__ == '__main__':
    launch()
