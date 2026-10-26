const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const M=require('../js/music-engine.js');
if(process.platform==='win32'){
 assert(fs.readFileSync(path.join(__dirname,'../js/music-engine.js'),'utf8').includes("env.PYTHONIOENCODING='utf-8:backslashreplace'"));
 console.log('PASS RC19 engine diagnostics: Windows launch encoding');
}else{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'varna-engine-diag-'));
 const python=path.join(temp,'python_embeded','python.exe'),main=path.join(temp,'ComfyUI','main.py');
 fs.mkdirSync(path.dirname(python),{recursive:true});fs.mkdirSync(path.dirname(main),{recursive:true});fs.writeFileSync(main,'# fixture');
 fs.writeFileSync(python,'#!/bin/sh\nprintf "some rgthree-comfy nodes and features, breaking some rendering\\nRuntimeError: audio backend failed\\n" >&2\nprintf "ENC=%s UTF=%s\\n" "$PYTHONIOENCODING" "$PYTHONUTF8" >&2\nexit 23\n');fs.chmodSync(python,0o755);
 const previous=process.env.VARNA_ENGINE_ROOT;process.env.VARNA_ENGINE_ROOT=temp;
 (async()=>{
  try{await assert.rejects(()=>M.start('http://127.0.0.1:8188',''),e=>{
   assert.match(e.message,/کد خروج 23/);assert.match(e.message,/RuntimeError: audio backend failed/);
   assert.doesNotMatch(e.message,/rgthree-comfy/);assert.match(e.diagnostic,/rgthree-comfy/);
   assert.match(e.diagnostic,/ENC=utf-8:backslashreplace UTF=1/);return true;
  });console.log('PASS RC19 engine diagnostics: real cause, exit code, full log, UTF-8');}
  finally{if(previous===undefined)delete process.env.VARNA_ENGINE_ROOT;else process.env.VARNA_ENGINE_ROOT=previous;fs.rmSync(temp,{recursive:true,force:true});}
 })().catch(e=>{console.error(e);process.exitCode=1;});
}
