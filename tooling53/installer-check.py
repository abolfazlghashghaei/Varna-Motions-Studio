"""Exercise the real PowerShell filesystem installer in isolated user roots."""
import json, os, pathlib, shutil, subprocess, tempfile
root=pathlib.Path(__file__).resolve().parents[1]
pwsh=os.environ.get('VARNA_PWSH') or shutil.which('pwsh')
if not pwsh:
    raise RuntimeError('Set VARNA_PWSH to an official verified PowerShell executable')
with tempfile.TemporaryDirectory(prefix='installer53-') as folder:
    folder=pathlib.Path(folder);source=folder/'Package';source.mkdir()
    payload=root/'Varna_Motion_Studio'
    for name in ['js','css','tools','integrations','assets/fonts']:
        shutil.copytree(payload/name,source/name)
    for name in ['plugin.html','premiere.html','PACKAGE_MANIFEST.json','assets/varna-logo.svg']:
        (source/name).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(payload/name,source/name)
    env={**os.environ,'APPDATA':str(folder/'Roaming'),'LOCALAPPDATA':str(folder/'Local')}
    command=[pwsh,'-NoProfile','-File',str(source/'integrations/INSTALL_CROSS_HOST_WINDOWS.ps1'),'-HostApp','Resolve']
    def run(ok=True):
        p=subprocess.run(command,env=env,capture_output=True,text=True)
        assert (p.returncode==0)==ok, p.stdout+p.stderr
        return p
    run();target=folder/'Local/VarnaMotionStudio/Hosts/Resolve'
    for name in ['plugin.html','js/plugin53.js','js/titles53.js','assets/fonts/Vazirmatn.woff2']:
        assert (target/name).is_file(),name
    for name in ['editor.html','index.html','js/editor51.js','js/nle53.js','css/nle53.css']:
        assert not (target/name).exists(),name
    utility=folder/'Roaming/Blackmagic Design/DaVinci Resolve/Support/Fusion/Scripts/Utility'
    config=json.loads((utility/'Motion_Tools.json').read_text(encoding='utf-8-sig'))
    assert pathlib.Path(config['server']).is_file() and config['port']==8795
    marker=target/'personal.txt';marker.write_text('preserve')
    run();assert any((d/'personal.txt').read_text()=='preserve' for d in target.parent.glob('Resolve.backup-*'))
    before=(target/'plugin.html').read_bytes();(source/'plugin.html').write_text('corrupted source')
    failed=run(False);assert 'Package verification failed: plugin.html' in failed.stderr
    assert (target/'plugin.html').read_bytes()==before
    print('PASS actual PowerShell staged install/reinstall, font/launcher paths, no NLE copied, backup retention and corrupt-source rejection before activation')
