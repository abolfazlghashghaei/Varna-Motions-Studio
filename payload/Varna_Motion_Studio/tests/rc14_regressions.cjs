const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../js/music-engine.js');
const root=path.join(__dirname,'..');

const p=M.plan({comp:{duration:80},events:[
  {time:9,type:'marker',strength:90},
  {time:21,type:'cut',strength:91},
  {time:25,type:'marker',strength:88},
  {time:62,type:'cut',strength:95}
]},{start:20,duration:10,maxDuration:10,tempo:112,kind:'sfx',instruments:'soft synth',rhythm:'sparse'});
assert.equal(p.start,20);
assert.equal(p.duration,10);
assert.deepEqual(p.events.map(x=>x.time),[1,5]);
assert.equal(p.bpm,112);
assert.match(M.stylePrompt(p),/no speech, no vocals or lyrics/i);
assert.match(M.stylePrompt(p),/soft synth/);
assert.equal(M.graphFor(p,{workflow:'yue'})['2'].inputs.lyrics,'[Instrumental]');
assert.equal(M.graphFor(p,{workflow:'ace_turbo'})['5'].inputs.lyrics,'[Instrumental]');
const custom=M.graphFor(p,{workflow:'custom',apiGraph:{a:{class_type:'TextNode',inputs:{lyrics:'hello',tags:'song'}},b:{class_type:'SaveAudioAdvanced',inputs:{}}}});
assert.equal(custom.a.inputs.lyrics,'[Instrumental]');
assert.match(custom.a.inputs.tags,/no vocals/);
const candidates=M.runtimeCandidates({LOCALAPPDATA:'C:\\Local',USERPROFILE:'C:\\User'},{path:path.win32,os:{homedir:()=>''}});
assert.equal(candidates[0].port,'17861');
assert.match(candidates[0].main,/GHAF\\Core\\ComfyUI\\main.py$/);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const host=fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8');
for(const id of ['bgModelHead','bgAlwaysVisible','bgFollowTyping','bgOffsetX','bgOffsetY','btnUpdateCaptions','brainDurationMode','brainAudioKind','brainTempo','brainInstruments','brainRhythm'])assert(html.includes('id="'+id+'"'),id);
assert(app.includes('refreshCaptionStyles'));
assert(host.includes('GHAFHost._prepareTypingBounds'));
assert(host.includes('GHAFHost.refreshCaptionStyles=function'));
assert(!app.includes("openCorrectionMemoryPanel();return;"));
console.log('PASS RC14: range-relative events, instrumental graph inputs, shared runtime candidates, UI wiring');
