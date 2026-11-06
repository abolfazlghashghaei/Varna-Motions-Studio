const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../../Varna_Motion_Studio/js/editor51-core.js');
const context={window:{},VarnaEdit51:C};vm.runInNewContext(fs.readFileSync('mobile56/web/native-editor65.js','utf8'),context);
const compile=context.window.VarnaNativeScene65.compile;
const p=C.fresh();p.width=320;p.height=240;p.layers52=[];
p.assets=[{id:'v',kind:'video',width:320,height:240,duration:2,mobile56:{nativeId:'00000000-0000-0000-0000-000000000065'}}];
C.add(p,'v','v1',0);let result=compile(p,new Map());assert(result.scene);assert.equal(result.scene.clips[0].outUs,2000000);
p.clips[0].x=25;assert.equal(compile(p,new Map()).scene.clips[0].x,25);
p.captions=[{id:'caption'}];assert.match(compile(p,new Map()).reason,/Text/);p.captions=[];
p.clips[0].blur=4;assert.match(compile(p,new Map()).reason,/filters/);p.clips[0].blur=0;
p.clips[0].keys52={x:[{time:0,value:5}]};assert.match(compile(p,new Map()).reason,/Animated/);delete p.clips[0].keys52;
p.assets[0].rotation=90;assert.match(compile(p,new Map()).reason,/Rotated/);p.assets[0].rotation=0;
const id=C.add(p,'v','v1',0).id;C.add(p,'v','v1',0);assert.match(compile(p,new Map()).reason,/budget/);
p.clips=p.clips.filter(c=>c.id!==id);assert(compile(p,new Map()).scene);
p.tracks.find(t=>t.id==='v1').muted=true;assert.equal(compile(p,new Map()).scene.clips.length,0);
console.log('PASS65 scene contract: real timing/transform, explicit text/filter/keyframe/rotation compatibility, decoder budget and mute.');

const sandbox={window:{VarnaEdit51:C,VarnaFX52:{}}};vm.runInNewContext(fs.readFileSync('mobile56/web/mobile-core.js','utf8'),sandbox);
const stacked=C.fresh();stacked.assets=[{id:'v',kind:'video',duration:2}];const first=C.add(stacked,'v','v1',0),second=C.add(stacked,'v','v1',0);const right=sandbox.window.MobileCore56.split(stacked,first.id,.5);assert.deepEqual(stacked.clips.map(c=>c.id),[first.id,right,second.id]);console.log('PASS65 split preserves compositing order for stacked clips.');
