from pathlib import Path
import tempfile,subprocess,json,os,hashlib,zipfile,shutil
root=Path(__file__).resolve().parents[1];shell=os.environ.get('PWSH61','/workspace/shared/pwsh53/runtime/pwsh')
with tempfile.TemporaryDirectory(prefix='backend61-') as temp:
 base=Path(temp);env=os.environ.copy();env.update(LOCALAPPDATA=str(base/'local'),APPDATA=str(base/'roam'),TEMP=str(base/'temp'),SystemDrive='/')
 for d in ['local','roam','temp']:(base/d).mkdir()
 def run(action,hosts=['AE'],**extra):
  request={'action':action,'hosts':hosts,'engine':False,'scanEngines':False,'enginePaths':[],'clearCache':False,'allowManagerOnly':False,**extra}
  req=base/'request.json';req.write_text(json.dumps(request));status=base/'status.json';status.unlink(missing_ok=True)
  r=subprocess.run([shell,'-NoProfile','-File',str(root/'tests/backend-harness.ps1'),'-RequestFile',str(req),'-StatusFile',str(status),'-SpecFile',str(base/'spec.json')],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=60)
  state=json.loads(status.read_text('utf-8-sig'));return r,state
 def make_archive(missing_helper=False):
  package=base/'input/fixture/payload';shutil.rmtree(base/'input',ignore_errors=True);package.mkdir(parents=True)
  payload=package/'Varna_Motion_Studio';(payload/'tools').mkdir(parents=True);(payload/'integrations').mkdir()
  (package/'PREPARE_GITHUB_DOWNLOAD.ps1').write_text("Write-Host 'prepared fixture';exit 0")
  if not missing_helper:shutil.copy2(root.parent/'VarnaDownload.psm1',package/'VarnaDownload.psm1')
  for name in ['Download59.psm1','Profile60.ps1']:shutil.copy2(root.parent/'Varna_Motion_Studio/tools'/name,payload/'tools'/name)
  (payload/'PACKAGE_MANIFEST.json').write_text('{"fixture":true}')
  (payload/'INSTALL_WINDOWS.ps1').write_text('''param([string]$Level,[string]$EngineMode,[switch]$EngineOnly)
if($Level -ne 'Max' -or $EngineMode -ne 'WithoutEngine'){exit 18}
$p=Join-Path $env:APPDATA 'Adobe/CEP/extensions/VarnaMotionStudio';New-Item -ItemType Directory (Join-Path $p 'CSXS') -Force|Out-Null
[IO.File]::WriteAllText((Join-Path $p 'CSXS/manifest.xml'),'<ExtensionManifest ExtensionBundleId="com.varnalabs.motionstudio"/>')
Write-Host 'fixture AE installed';exit 0
''')
  (payload/'integrations/INSTALL_CROSS_HOST_WINDOWS.ps1').write_text("param($HostApp,$EngineMode);Write-Host 'fixture host failure';exit 17")
  (package/'padding.bin').write_bytes(os.urandom(1100000));archive=base/'fixture.zip'
  with zipfile.ZipFile(archive,'w',zipfile.ZIP_STORED) as z:
   for f in (base/'input').rglob('*'):
    if f.is_file():z.write(f,f.relative_to(base/'input'))
  data=archive.read_bytes();sha=hashlib.sha256(data).hexdigest();cache=base/'local/VarnaMotionStudio/Cache61';cache.mkdir(parents=True,exist_ok=True);(cache/(sha+'.zip')).write_bytes(data)
  (base/'spec.json').write_text(json.dumps({'commit':'a'*40,'url':'https://github.com/abolfazlghashghaei/Varna-Motions-Studio/archive/'+('a'*40)+'.zip','bytes':len(data),'sha256':sha}))
 r,s=run('Inspect');assert r.returncode==0 and s['phase']=='Inspected',r.stdout
 make_archive(missing_helper=True)
 r,s=run('Install');assert r.returncode!=0 and 'VarnaDownload.psm1' in s['message'],r.stdout
 make_archive()
 r,s=run('Install');assert r.returncode==0 and s['phase']=='Complete',r.stdout
 receipt=base/'local/VarnaMotionStudio/Setup61State/installed.json';assert json.loads(receipt.read_text('utf-8-sig'))['profiles']['AE']=='WithoutEngine'
 r,s=run('Install',hosts=['AE','Premiere']);assert r.returncode!=0 and s['phase']=='Failed' and s['data']['completed']==['AE'],r.stdout
 assert json.loads(receipt.read_text('utf-8-sig'))['hosts']==['AE']
 panel=base/'roam/Adobe/CEP/extensions/VarnaMotionStudio'
 r,s=run('Remove');assert r.returncode==0 and not panel.exists() and list((base/'local/VarnaMotionStudio/Recovery61').iterdir()),r.stdout
 foreign=base/'roam/Adobe/CEP/extensions/com.varnalabs.editstudio.premiere';(foreign/'CSXS').mkdir(parents=True);(foreign/'CSXS/manifest.xml').write_text('<ExtensionManifest ExtensionBundleId="someone.else"/>')
 r,s=run('Remove',hosts=['Premiere']);assert r.returncode!=0 and foreign.exists(),r.stdout
 r,s=run('Remove',hosts=[],allowManagerOnly=True);assert r.returncode==0,s
 cancel=base/'cancel';cancel.write_text('cancel');env['VARNA_CANCEL_FILE']=str(cancel)
 r,s=run('Install');assert r.returncode!=0 and s['phase']=='Cancelled',r.stdout
 print('PASS61 actual worker orchestration: preflight, missing-helper rejection, cached verified archive/extraction, child failure propagation, partial receipts, owned removal/recovery, foreign preservation, manager-only removal and cancellation. Host installers and GPU inventory are controlled fixtures; Windows activation is not claimed.')
