const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const M=require('../js/music-engine.js'),root=path.resolve(__dirname,'..'),installer=fs.readFileSync(path.join(root,'INSTALL_WINDOWS.ps1'),'utf8');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'varna-shared-engine-'));
try{
 const env={LOCALAPPDATA:tmp,APPDATA:tmp,USERPROFILE:tmp,SystemDrive:'C:'},pointer=path.join(tmp,'VarnaMotionStudio','engine-root.txt'),shared=path.join(tmp,'GHAF','Core');
 fs.mkdirSync(path.dirname(pointer),{recursive:true});fs.writeFileSync(pointer,shared);
 let choices=M.runtimeCandidates(env);assert.equal(choices[0].root,shared);assert.equal(choices[0].port,'17861');assert.equal(choices[0].config,path.join(tmp,'GHAF','Config','extra_model_paths.yaml'));
 const alternate=path.join(tmp,'GHAF','Engine');fs.writeFileSync(pointer,alternate);
 choices=M.runtimeCandidates(env);assert.equal(choices[0].root,alternate);assert.equal(choices[0].port,'17861');assert.equal(choices[0].config,path.join(tmp,'GHAF','Config','extra_model_paths.yaml'));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
assert(installer.includes('sys.path.insert(0, sys.argv[1])'),'the Python probe must import modules from the actual engine directory');
assert(installer.includes('Get-VarnaEngineCandidates')&&installer.includes('Save-VarnaEngineLocation $candidate'));
assert(installer.includes("$sharedRoot = Join-Path $env:LOCALAPPDATA 'GHAF\\Core'"));
assert(installer.includes('if ($sharedPresent) {')&&installer.indexOf('if ($sharedPresent) {')<installer.indexOf("$uri = 'https://api.github.com"),'an existing shared directory must prevent the download regardless of probe outcome');
assert(installer.indexOf('if ($suspected.Count) { return')<installer.indexOf("$uri = 'https://api.github.com"),'an unverified existing engine must prevent a duplicate download');
assert(!installer.includes('C:\\Users\\ghashghaei'),'account names must not be fixed');
assert(installer.indexOf('if (Test-RunningVarnaEngine)')<installer.indexOf("$uri = 'https://api.github.com"));
console.log('PASS RC18 shared engine: Qaf runtime reuse, corrected health probe and no duplicate download on uncertain installations');
