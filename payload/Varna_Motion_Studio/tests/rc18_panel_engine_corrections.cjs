const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const M=require('../js/music-engine.js'),root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8'),css=fs.readFileSync(path.join(root,'css/varna-ui.css'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(app.includes('function captionUncertain(g)')&&app.includes('showUncertainMenu(e,g,a)'));
assert(app.includes("e.target.closest?.('#correctionTextPreview,#reviewText')"));
assert(!app.includes("' needs-correction-review'"));
assert(css.includes('.caption-row .uncertain-token'));
for(const pair of [['KeyL:1','تفکیک'],['KeyK:2','انتقال'],['KeyJ:3','استایل'],['KeyH:4','اصلاح'],['KeyG:5','ذخیره']])assert(app.includes(pair[0])&&html.includes(pair[1]));
assert(app.includes("window.addEventListener('focus',registerPanelShortcuts)"));
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'varna-engine-exit-'));
 try{
  const main=path.join(tmp,'ComfyUI','main.py'),python=path.join(tmp,'python_embeded','python.exe'),cli=path.join(tmp,'ComfyUI','comfy','cli_args.py');
  for(const file of [main,python,cli])fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(main,'# mock');fs.writeFileSync(cli,"parser.add_argument('--windows-standalone-build')\n");
  fs.writeFileSync(python,'#!/bin/sh\necho "engine dependency unavailable" >&2\nexit 7\n');fs.chmodSync(python,0o755);
  const old=process.env.VARNA_ENGINE_ROOT;process.env.VARNA_ENGINE_ROOT=tmp;
  try{await assert.rejects(()=>M.start('http://127.0.0.1:8188',tmp),/engine dependency unavailable/);}finally{if(old===undefined)delete process.env.VARNA_ENGINE_ROOT;else process.env.VARNA_ENGINE_ROOT=old;}
  assert(M.runtimeCandidates({LOCALAPPDATA:tmp,USERPROFILE:tmp,VARNA_ENGINE_ROOT:tmp})[0].root===tmp);
  console.log('PASS RC18 panel: word-only review, right-click, shortcut registration and engine exit details');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
