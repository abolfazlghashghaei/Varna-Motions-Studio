const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../js/corrections.js'),read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
let db=C.learn({},[
 {wrong:'من اشتباه هستم',right:'من درست هستم',canonical:'درست',mode:'context',autoApply:true},
 {wrong:'اشتباه',right:'درست',mode:'token',autoApply:false}
]);
assert.equal(C.applyText('من اشتباه هستم',db).text,'من درست هستم');
const uncertain=C.applyText('تو اشتباه بودی',db);
assert.equal(uncertain.text,'تو اشتباه بودی');assert.equal(uncertain.ambiguities[0].start,3);assert.equal(uncertain.ambiguities[0].candidates[0].right,'درست');
assert.equal(C.applyText('من، اشتباه هستم',db).hits,0,'punctuation breaks the left anchor');
assert.equal(C.applyText('من اشتباه هستم',db,{protectedPhrases:['اشتباه']}).hits,0);
assert.equal(C.applyText('من اشتباه هستم',db,{protectedPhrases:['اشتباه']}).ambiguities.length,0);
const app=read('js/app.js'),installer=read('INSTALL_WINDOWS.ps1'),host=read('host/ghaf_host.jsx');
assert(!app.includes('const memoryPattern=value=>'),'AI pass must not rewrite bare aliases');
assert(app.includes("host('setCompTime',{time:S.groupStart(g),focusViewer:false})"));
assert(app.includes('previewRemoval=pending')&&app.includes('if(previewRemoval)await previewRemoval'));
assert(app.includes('textStart:a.start,textEnd:a.end')&&app.includes('before.slice(0,a.textStart)'));
assert(installer.includes('Get-AEEffectPath')&&installer.includes('CommonPluginInstallPath')&&installer.includes('Install-AEEffect $bundledEffect $sharedEffect'));
assert(installer.includes('Test-VarnaEngine')&&installer.includes('Receive-VarnaEngine')&&!installer.includes('Engine setup skipped'));
assert(host.includes('thisProperty.createPath')&&host.includes('freshCaption[i].solo=true'));
console.log('PASS RC18 maintenance: conservative correction, per-occurrence approval, preview race guards, installer validation and continuous corners');
