"""Run actual staged host installers, using the checksum-pinned official Windows ZIP."""
import json,os,pathlib,shutil,subprocess,tempfile
root=pathlib.Path(__file__).resolve().parents[1];payload=root/'Varna_Motion_Studio'
pwsh=os.environ.get('VARNA_PWSH') or shutil.which('pwsh');archive=os.environ.get('VARNA_RUNTIME_ZIP54')
if not pwsh or not archive:raise RuntimeError('Set VARNA_PWSH and VARNA_RUNTIME_ZIP54 to verified development tools')
with tempfile.TemporaryDirectory(prefix='installer54-') as temp:
    temp=pathlib.Path(temp);source=temp/'Source';source.mkdir()
    for name in ['js','css','tools','integrations','assets/fonts','assets/templates38','assets/sfx','assets/vendor/ui30','assets/vendor/rebound49','assets/vendor/conjure49']:
        shutil.copytree(payload/name,source/name)
    for name in ['plugin.html','premiere.html','resolve.html','editor.html','PACKAGE_MANIFEST.json','assets/varna-logo.svg']:
        (source/name).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(payload/name,source/name)
    import re
    for entry in json.loads((payload/'PACKAGE_MANIFEST.json').read_text())['files']:
        name=entry['path']
        if re.match(r'^assets/vendor/.*/(?:LICENSE|NOTICE|UPSTREAM)(?:\.[^/]*)?$',name):
            (source/name).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(payload/name,source/name)
    env={**os.environ,'APPDATA':str(temp/'Roaming'),'LOCALAPPDATA':str(temp/'Local')}
    def run(host,ok=True,env=env,archive=archive):
        r=subprocess.run([pwsh,'-NoProfile','-File',str(source/'integrations/INSTALL_CROSS_HOST_WINDOWS.ps1'),'-HostApp',host,'-RuntimeArchive',archive],env=env,capture_output=True,text=True)
        assert (r.returncode==0)==ok,r.stdout+r.stderr
        return r
    run('Resolve');target=temp/'Local/VarnaMotionStudio/Hosts/Resolve'
    for name in ['resolve.html','js/host54-runtime.js','js/render54.js','assets/fonts/Vazirmatn.woff2','assets/vendor/ui30/tom-select/tom-select.css']:
        assert (target/name).is_file(),name
    assert not (target/'editor.html').exists() and not (target/'js/editor51.js').exists()
    utility=temp/'Roaming/Blackmagic Design/DaVinci Resolve/Support/Fusion/Scripts/Utility'
    assert not (utility/'Motion_Tools.lua').read_bytes().startswith(b'\xef\xbb\xbf');lua=(utility/'Motion_Tools.lua').read_text(encoding='utf-8-sig');assert '__VARNA_ROOT54__' not in lua and str(target) in lua
    cfg=json.loads((target/'integrations/resolve/runtime54-user.json').read_text(encoding='utf-8-sig'));assert pathlib.Path(cfg['electron']).is_file();assert pathlib.Path(cfg['bus']).is_dir()
    runtime=pathlib.Path(cfg['electron']).parent;(runtime/'resources/default_app.asar').unlink();(target/'personal.txt').write_text('preserve');run('Resolve');assert (runtime/'resources/default_app.asar').is_file();assert any((p/'personal.txt').read_text()=='preserve' for p in target.parent.glob('Resolve.backup-*'))
    run('Editor');editor=temp/'Local/VarnaMotionStudio/Hosts/Editor';assert (editor/'editor.html').is_file() and (editor/'js/production54.js').is_file() and (editor/'OPEN_WORKSPACE.cmd').is_file()
    run('Premiere');premiere=temp/'Roaming/Adobe/CEP/extensions/com.varnalabs.editstudio.premiere';assert (premiere/'premiere.html').is_file();assert not (premiere/'js/nle53.js').exists();assert 'id="reviewText"' in (premiere/'premiere.html').read_text()
    before=(target/'resolve.html').read_bytes();(source/'resolve.html').write_text('corrupt');failed=run('Resolve',False);assert 'Package verification failed: resolve.html' in failed.stderr;assert (target/'resolve.html').read_bytes()==before
    shutil.copy2(payload/'resolve.html',source/'resolve.html');bad=temp/'bad.zip';bad.write_bytes(b'invalid archive');env2={**env,'LOCALAPPDATA':str(temp/'BadLocal')};failed=run('Resolve',False,env2,str(bad));assert 'checksum failed' in failed.stderr;assert not (temp/'BadLocal/VarnaMotionStudio/Hosts/Resolve').exists()
print('PASS actual PowerShell: official runtime verification/extraction/cache, full Resolve Lua/app config, full Premiere tools without NLE, standalone full workspace, reinstall backup, corrupt-source and corrupt-runtime rejection before activation. Windows activation is unrun.')
