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
assert(installer.includes("VarnaMotionStudio\\Engines59\\"),'incomplete engines must be repaired in a separate staged installation');
assert(installer.includes("if($sharedPresent -or $suspected.Count)"),'suspected engines must be reported without silently skipping repair');
assert(installer.indexOf('if(!(Test-VarnaEngine $candidate59[0].FullName))')<installer.indexOf('Move-Item -LiteralPath $candidate59[0].FullName'),'new engine must pass health before activation');
assert(!installer.includes('C:\\Users\\ghashghaei'),'account names must not be fixed');
assert(installer.indexOf('if (Test-RunningVarnaEngine)')<installer.indexOf("$uri = 'https://api.github.com"));
console.log('PASS RC18 shared engine: Qaf runtime reuse, corrected health probe, reuse of healthy engines and staged repair of incomplete engines');
