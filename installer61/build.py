from pathlib import Path
import argparse,hashlib,json,zipfile,subprocess,os,shutil,struct,re
p=argparse.ArgumentParser();p.add_argument('--commit',required=True);p.add_argument('--archive',required=True);p.add_argument('--compiler',required=True);p.add_argument('--nsis-dir',required=True);args=p.parse_args()
root=Path(__file__).resolve().parent;archive=Path(args.archive)
assert len(args.commit)==40 and all(c in '0123456789abcdef' for c in args.commit)
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 prefix=z.namelist()[0].split('/')[0]+'/payload/'
 required=['PREPARE_GITHUB_DOWNLOAD.ps1','VarnaDownload.psm1','Varna_Motion_Studio/INSTALL_WINDOWS.ps1','Varna_Motion_Studio/tools/Download59.psm1','Varna_Motion_Studio/tools/Profile60.ps1','Varna_Motion_Studio/integrations/INSTALL_CROSS_HOST_WINDOWS.ps1']
 for name in required:assert prefix+name in z.namelist(),name
 # The embedded downloader must exactly match the pinned package's downloader.
 assert z.read(prefix+'Varna_Motion_Studio/tools/Download59.psm1')==(root/'Download61.psm1').read_bytes()
sha=hashlib.sha256(archive.read_bytes()).hexdigest();meta={'commit':args.commit,'url':'https://github.com/abolfazlghashghaei/Varna-Motions-Studio/archive/'+args.commit+'.zip','sha256':sha,'bytes':archive.stat().st_size}
(root/'package-lock61.json').write_text(json.dumps(meta,indent=2)+'\n');(root/'build').mkdir(exist_ok=True)
env=os.environ.copy();env['NSISDIR']=args.nsis_dir
subprocess.run([args.compiler,'-WX','-V3',str(root/'setup.nsi')],cwd=root,env=env,check=True)
f=root/'build/Varna-Studio-Setup-61.exe';b=f.read_bytes();assert b[:2]==b'MZ';pe=struct.unpack_from('<I',b,0x3c)[0];assert b[pe:pe+4]==b'PE\0\0'
inputs={name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in re.findall(r'^File "([^"]+)"', (root/'setup.nsi').read_text(), re.M)}
result={'embeddedFiles':inputs,'file':f.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'source':meta,'authenticode':'unsigned','nativeWindowsUiExecuted':False}
(root/'build/release61.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
