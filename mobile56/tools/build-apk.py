#!/usr/bin/env python3
"""Build without Gradle using Android SDK 35. Requires a JDK (17+), Python3 and Linux SDK tools.
ANDROID56_SDK contains android-35/android.jar and android-15/{aapt2,d8,zipalign,apksigner}.
Signing requires MOBILE56_KEYSTORE, MOBILE56_STORE_PASS and optionally MOBILE56_KEY_ALIAS.
Never generates or stores signing credentials in the repository.
"""
from pathlib import Path
import os,subprocess,sys,zipfile,hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[2];M=ROOT/'mobile56';B=M/'build';B.mkdir(exist_ok=True)
sdk=Path(os.environ['ANDROID56_SDK']);tools=sdk/'android-15';android=sdk/'android-35/android.jar'
def run(*args):subprocess.run([str(a) for a in args],check=True)
for lib in json.loads((ROOT/'native59/source-lock.json').read_text())['libraries']:
 assert hashlib.sha256((ROOT/lib['path']).read_bytes()).hexdigest()==lib['sha256'],lib['path']
run(sys.executable,M/'tools/bundle.py')
run(sys.executable,ROOT/'native59/media-deps.py')
deps=Path(os.environ.get('MEDIA59_CACHE','/workspace/shared/native59/maven'));libraries=json.loads((ROOT/'native59/media-lock.json').read_text());jars=[deps/(x['name']+'-'+x['version'])/'classes.jar' if x['type']=='aar' else deps/x['file'] for x in libraries]
for f in ['aapt2','zipalign','d8','apksigner']:(tools/f).chmod(0o755)
for name in ['gen','classes','dex']:
 if (B/name).exists():shutil.rmtree(B/name)
 (B/name).mkdir()
run(tools/'aapt2','compile','--dir',M/'android/res','-o',B/'res.zip')
resourceZips=[];packages=[]
import xml.etree.ElementTree as E
for x in libraries:
 if x['type']!='aar':continue
 folder=deps/(x['name']+'-'+x['version']);packages.append(E.parse(folder/'AndroidManifest.xml').getroot().get('package'))
 if (folder/'res').is_dir() and any((folder/'res').rglob('*')):
  dest=B/(x['name']+'-res.zip');run(tools/'aapt2','compile','--dir',folder/'res','-o',dest);resourceZips.append(dest)
manifest=M/'android/AndroidManifest.xml'
if os.environ.get('VARNA_DEBUG59')=='1':
 text=manifest.read_text().replace('<application ', '<application android:debuggable="true" ');manifest=B/'test-AndroidManifest.xml';manifest.write_text(text)
run(tools/'aapt2','link','--auto-add-overlay','--extra-packages',':'.join(packages),'-I',android,'--manifest',manifest,'--java',B/'gen','--min-sdk-version','29','--target-sdk-version','35','-A',B/'web','-o',B/'base.apk',*resourceZips,'-R',B/'res.zip')
sources=sorted((M/'android/src').rglob('*.java'))+sorted((B/'gen').rglob('*.java'))
run('java','-m','jdk.compiler/com.sun.tools.javac.Main','-source','8','-target','8','-classpath',os.pathsep.join(str(j) for j in [android,*jars]),'-d',B/'classes',*sources)
with zipfile.ZipFile(B/'classes.jar','w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted((B/'classes').rglob('*.class')):z.write(f,f.relative_to(B/'classes'))
run(tools/'d8','--release','--lib',android,'--min-api','29','--output',B/'dex',B/'classes.jar',*jars)
with zipfile.ZipFile(B/'base.apk') as src,zipfile.ZipFile(B/'unsigned.apk','w') as dst:
 for info in src.infolist():dst.writestr(info,src.read(info.filename))
 for dex in sorted((B/'dex').glob('*.dex')):dst.write(dex,dex.name,zipfile.ZIP_DEFLATED)
 for lib in (ROOT/'native59/libs').glob('*/*.so'):dst.write(lib,'lib/'+str(lib.relative_to(ROOT/'native59/libs')),zipfile.ZIP_STORED)
run(tools/'zipalign','-P','16','-f','4',B/'unsigned.apk',B/'aligned.apk')
output=B/'Varna-Mobile-0.4.0-preview.apk'
run(tools/'apksigner','sign','--ks',os.environ['MOBILE56_KEYSTORE'],'--ks-key-alias',os.environ.get('MOBILE56_KEY_ALIAS','varna-mobile-preview'),'--ks-pass','env:MOBILE56_STORE_PASS','--out',output,B/'aligned.apk')
run(tools/'apksigner','verify','--verbose',output)
run(tools/'aapt2','dump','badging',output)
sha=hashlib.sha256(output.read_bytes()).hexdigest();(B/(output.name+'.sha256')).write_text(sha+'  '+output.name+'\n');print('SHA256',sha)
