const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),app=read('js/app.js'),node=read('js/node-engine.js'),host=read('host/ghaf_host.jsx');
function ok(c,m){if(!c)throw new Error(m)}
ok(html.includes('4.3 R12'),'version');
ok(html.includes('motionTargetPhase'),'motion target missing');
ok(!html.includes('motionOutroLibrary'),'old outro library remains');
ok(app.includes("animOutroPreset = 'mirror:'")||app.includes("'mirror:'+"),'mirror outro assignment missing');
ok(host.includes("add(inTime,'IN')")&&host.includes("add(outTime,'OUT')"),'IN/OUT marker creation missing');
ok(!host.includes('VARNA IN START')&&!host.includes('VARNA OUT END'),'old marker names remain');
ok(node.includes('deleteCorrectionPair'),'delete correction API missing');
ok(app.includes('correction-delete'),'correction delete UI missing');
ok(host.includes('gradientX1')&&host.includes('gradientX2')&&host.includes('rimColor1')&&host.includes('rimColor2')&&host.includes('edgeWave'),'liquid controls not wired');
ok(host.includes('VARNA Glass Gradient Tint'),'stable tint layer missing');
ok(host.includes("_R11_")&&host.includes('eClean'),'R11 helper cleanup missing');
console.log('R12 tests PASS');
