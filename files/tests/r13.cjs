const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('js/app.js'), state=read('js/state.js'), node=read('js/node-engine.js'), host=read('host/ghaf_host.jsx'), html=read('index.html'), manifest=read('CSXS/manifest.xml');
function ok(v,msg){assert.ok(v,msg);}
ok(html.includes('4.3 R13 · VarnaLabs'),'R13 visible version');
ok(manifest.includes('ExtensionBundleVersion="4.3.13"'),'manifest R13 version');
// No external model-manager dependency in production UI/runtime.
for(const [name,src] of [['app',app],['state',state],['node',node],['html',html]]) ok(!/LM Studio|lmstudio|ollama/i.test(src),name+' must not reference removed external model managers');
// Fixed-but-editable role folders.
['C:\\\\whisper.cpp\\\\models\\\\Taype','Qwen3.5-9B-GGUF','translategemma-4b-it-GGUF','Qwen2.5-VL-3B-Instruct-GGUF','llama-b11277-bin-win-cuda-12.4-x64'].forEach(x=>ok(state.includes(x.replace(/\\\\/g,'\\\\'))||state.includes(x), 'local default path '+x));
['localRoot','localRuntimeDir','localTypeDir','localTextDir','localTranslatorDir','localVisionDir'].forEach(id=>ok(html.includes('id="'+id+'"'),'editable local role UI '+id));
ok(node.includes("if(role==='type'&&!model){model=x.textModel;actualRole='text';}"),'Type role falls back to Text model');
ok(app.includes("N.chatRole('type'"),'SFX planner uses local Type role');
ok(app.includes('N.chatVisionRole'),'SFX Vision uses local Vision role');
// SFX event/context intelligence, beat sync, learning and atmosphere separation.
['SFX_ATMOS_CATEGORIES','categoryForEvent','maybeSnapToBeat','buildAtmosphereSuggestions','learnSfxDecision','analyzeCompBeat','audioStandardFromUI'].forEach(x=>ok(app.includes(x),'SFX feature '+x));
ok(node.includes('api.analyzeBeats='),'beat analyzer available');
ok(node.includes('api.learnSfxDecision='),'SFX persistent learning available');
ok(host.includes('GHAFHost.applyAudioBalance='),'AE audio balance host method');
ok(host.includes('GHAFHost.applySfxPlan='),'AE SFX placement host method');
ok(host.includes('l.startTime=placeStart'),'SFX layer placement uses event startTime');
ok(host.includes('eventTime:tm'),'SFX placement records requested event time');
// Motion phase: IN, OUT, BOTH, and native host parity.
ok(html.includes('<option value="both">هر دو · IN + OUT</option>'),'Motion BOTH UI');
ok(app.includes("phase==='both'"),'Motion BOTH selection logic');
ok(host.includes('GHAFHost._motionTransformParams'),'transform IN/OUT host engine');
ok(host.includes('GHAFHost._composerOutConfig'),'Composer OUT engine');
ok(host.includes("add(inTime,'IN')")&&host.includes("add(outTime,'OUT')"),'IN/OUT marker names');
const presets=[...html.matchAll(/data-preset="(ac[A-Za-z0-9]+)"/g)].map(m=>m[1]);
ok(presets.length>=40,'Composer text motion library should contain >=40 presets');
const inBlock=host.slice(host.indexOf('GHAFHost._applyComposerPreset'),host.indexOf('GHAFHost._markerProgressExpr'));
const outBlock=host.slice(host.indexOf('GHAFHost._composerOutConfig'),host.indexOf('GHAFHost._textOutConfig'));
for(const p of new Set(presets)){ok(inBlock.includes(p),'IN host maps Composer preset '+p);ok(outBlock.includes(p),'OUT host maps Composer preset '+p);}
// Runtime-critical saved libraries/settings profile renderers must exist.
['function renderSavedBgStyles','function renderUserMotionPresets','async function renderSettingsProfiles'].forEach(x=>ok(app.includes(x),x));
console.log('R13 tests PASS · '+new Set(presets).size+' Composer presets audited');
