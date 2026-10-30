from pathlib import Path
import zipfile,hashlib,os,subprocess
root=Path(__file__).resolve().parents[1];build=root/'build';apk=build/'Varna-Mobile-0.4.0-preview.apk'
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None
 for source in (build/'web').rglob('*'):
  if source.is_file():assert z.read('assets/'+str(source.relative_to(build/'web')))==source.read_bytes(),source
 assert z.getinfo('classes.dex').file_size>10000
 for abi in ['arm64-v8a','x86_64']:
  assert z.read('lib/'+abi+'/libvarna_whisper59.so')==(root.parent/'native59/libs'/abi/'libvarna_whisper59.so').read_bytes()
 assert all(not name.endswith(('.jks','.keystore')) for name in z.namelist())
tools=Path(os.environ['ANDROID56_SDK'])/'android-15'
subprocess.run([str(tools/'apksigner'),'verify','--verbose',str(apk)],check=True)
permissions=subprocess.check_output([str(tools/'aapt2'),'dump','permissions',str(apk)],text=True)
assert permissions.count('uses-permission')==1 and 'android.permission.INTERNET' in permissions,permissions
badging=subprocess.check_output([str(tools/'aapt2'),'dump','badging',str(apk)],text=True)
assert 'application-debuggable' not in badging
assert "versionCode='5901'" in badging
print('PASS APK exact bundled assets, dictionaries, font/notices, bytecode, signature and only the requested INTERNET permission; not a device execution test.')
print('SHA256',hashlib.sha256(apk.read_bytes()).hexdigest())
