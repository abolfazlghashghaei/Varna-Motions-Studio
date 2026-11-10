const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const M=require('../js/music-engine.js');
const p=M.plan({comp:{duration:34},events:[]},{duration:30,kind:'sfx'});
assert.throws(()=>M.graphFor(p,{workflow:'minimax'}),/EFFECT_MODEL_REQUIRED/);const graph=M.graphFor({...p,kind:'music'},{workflow:'minimax'});
assert.equal(graph['4'].inputs.lyrics,''); // Native MiniMax instrumental requests have no lyric text.
assert.match(graph['4'].inputs.caption,/no speech, no vocals or lyrics/);
assert.equal(graph['9'].class_type,'SaveAudioAdvanced');
assert.equal(M.WORKFLOWS.minimax.ready,true);
const candidates=M.runtimeCandidates({LOCALAPPDATA:'C:\\Users\\x\\AppData\\Local',USERPROFILE:'C:\\Users\\x'},{path:path.win32,os:{homedir:()=>''}});
assert.match(candidates[0].models,/GHAF\\Models$/);
assert.match(candidates[0].config,/GHAF\\Config\\extra_model_paths.yaml$/);
const html=read('index.html'),host=read('host/ghaf_host.jsx'),app=read('js/app.js');
assert(html.indexOf('id="brainMusic"')>html.indexOf('id="page-sfx"'));
assert(html.includes('<option value="minimax">'));
assert(html.includes('id="brainMusicAnalysisProgress"'));
assert(app.includes('musicAnalysisProgress(30')&&app.includes('musicAnalysisProgress(100'));
// Prefix-driven geometry replaces the obsolete full-width scale multiplication.
require('./rc25_appearance.cjs');
assert(host.includes('source.expression=GHAFHost._typingExpression(a)'));
assert(host.includes("'OPTICS',true")&&host.includes('optic.moveAfter(layer)'));
assert(!html.includes('ComfyUI'));
assert(!/ComfyUI/.test(read('INSTALL_WINDOWS.bat')));
assert(read('js/music-engine.js').includes("'GHAF','Models'"));
assert(read('INSTALL_WINDOWS.ps1').includes('Ensure-ComfyPortable'));
assert(!read('INSTALL_WINDOWS.bat').includes('InstallAudioModels'));
assert(!fs.existsSync(path.join(root,'INSTALL_WINDOWS_GUI.ps1')));
console.log('PASS RC15: typed geometry, optics overlay, MiniMax, audio progress and shared engine');
