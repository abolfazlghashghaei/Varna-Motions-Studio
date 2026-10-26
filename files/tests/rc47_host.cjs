/* Production host/CEP/output regression models; no Adobe runtime or pixels. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),O=require('../js/output35');
const root=path.resolve(__dirname,'..'),bridge=fs.readFileSync(root+'/js/cep-bridge.js','utf8');
const prefix=fs.readFileSync(__dirname+'/r14.cjs','utf8').split('(async()=>{try{')[0],sandbox={require,__dirname,console,Buffer,process,setTimeout,clearTimeout};vm.createContext(sandbox);vm.runInContext(prefix+';model47={hostContext,CompItem,Layer,Prop};',sandbox);
function model(){const m=sandbox.model47.hostContext();m.c.name='Timeline';m.c.selectedLayers=[];m.ctx.app.project.numItems=1;m.ctx.app.project.item=()=>m.c;return m;}
function stateChecks(){
 const {ctx,call}=model();
 class FolderItem {constructor(name,comment='',items=[]){this.name=name;this.comment=comment;this.items=items;}get numItems(){return this.items.length;}item(i){return this.items[i-1];}}
 ctx.FolderItem=FolderItem;const parts=[new FolderItem('part_0','QUJD'),new FolderItem('part_1','REVG'),new FolderItem('part_2','R0hJ')],snapshot=new FolderItem('snapshot','',parts),state=new FolderItem('__VARNA_PROJECT_STATE__',JSON.stringify({version:1,count:3,hash:'fixture-hash',folder:'snapshot'}),[snapshot]);ctx.app.project.rootFolder=new FolderItem('root','',[state]);
 vm.runInContext('Array.prototype.some=undefined;',ctx);
 let result=call('getProjectState');assert.equal(result.ok,true,result.error);assert.deepEqual(Array.from(result.data.packet.chunks),['QUJD','REVG','R0hJ']);
 snapshot.items=[parts[0],parts[2]];result=call('getProjectState');assert.equal(result.ok,false,'sparse part indexes cannot be returned as a complete project packet');assert.match(result.error,/Incomplete|Invalid/);
 snapshot.items=parts;for(const invalid of [-1,1.5,501,'3']){state.comment=JSON.stringify({version:1,count:invalid,hash:'fixture-hash',folder:'snapshot'});assert.equal(call('getProjectState').ok,false,'invalid count '+invalid);}
 state.comment='null';assert.equal(call('getProjectState').ok,false,'null project metadata is a controlled error');
 state.comment=JSON.stringify({version:1,count:0,hash:'fixture-hash',folder:'snapshot'});snapshot.items=[];result=call('getProjectState');assert(result.ok,result.error);assert.deepEqual(Array.from(result.data.packet.chunks),[],'older zero-chunk packet remains readable');
}
function explicitPreviewChecks(){
 const {ctx,c,H,call}=model(),group={id:474,text:'سلام',rawText:'سلام',start:1,end:2,style:{size:44,fontPS:'ArialMT',fill:'#ffffff',x:50,y:70},bg:{enabled:false},anim:{mode:'simple',preset:'none',outPreset:'none',typeSound:false}};
 for(const focus of [null,{name:'Imported project folder'}]){
  ctx.app.project.activeItem=focus;
  const r=call('updateLivePreview',{compId:c.id,groups:[group],focusViewer:false,seekPreview45:true});assert(r.ok,r.error);assert.equal(r.data.compId,c.id);assert(c._layers.some(l=>l.name.startsWith('__VARNA_LIVE_CAP_')));assert(c.time>group.start&&c.time<group.end);
 }
 const before=c._layers.slice();assert.equal(call('updateLivePreview',{compId:9999,groups:[group],focusViewer:false}).ok,false);assert.deepEqual(c._layers,before,'invalid destination cannot remove the earlier preview');
}
function framePreviewChecks(){
 const {ctx,c,H,call}=model(),CompItem=sandbox.model47.CompItem,items=[c];let nextId=4701,failStage=false;
 function register(comp){comp.id=nextId++;items.push(comp);comp.layers.add=source=>comp.add('precomp',source);comp.layers.addNull=()=>comp.add('null');Object.defineProperty(comp,'usedIn',{get:()=>items.filter(x=>x._layers.some(l=>l.source===comp))});comp.remove=()=>{const i=items.indexOf(comp);if(i>=0)items.splice(i,1);};return comp;}
 c.duplicate=()=>{const copy=register(new CompItem());for(const name of ['width','height','pixelAspect','duration','frameRate','frameDuration'])copy[name]=c[name];return copy;};
 c.layers.add=source=>c.add('precomp',source);let viewers=0;c.openInViewer=()=>viewers++;
 Object.defineProperty(ctx.app.project,'numItems',{get:()=>items.length,configurable:true});ctx.app.project.item=i=>items[i-1];ctx.app.project.itemByID=id=>items.find(x=>x.id===id);
 ctx.app.project.items={addComp(name,width,height,pixelAspect,duration,frameRate){if(failStage&&name==='__GHAF_MOTION_RENDER__')throw Error('FRAME_STAGE_FAILURE47');const comp=register(new CompItem());Object.assign(comp,{name,width,height,pixelAspect,duration,frameRate,frameDuration:1/frameRate});return comp;}};
 ctx.Folder=class{constructor(value){this.absoluteURI=value;this.exists=true;}create(){return true;}};
 ctx.File=class{constructor(value){this.absoluteURI=this.fsName=value;this.exists=true;this.name=String(value).split('/').pop();}open(){return true;}write(){}close(){}remove(){return true;}};
 const group={id:475,text:'سلام عرض میکنم خدمت',rawText:'سلام عرض میکنم خدمت',start:1,end:4,style:{size:44,fontPS:'ArialMT',fill:'#ffffff',x:50,y:70},bg:{enabled:false},anim:{mode:'simple',preset:'none',outPreset:'none',typeSound:false,kinetic40:{entry:'none',pattern:'zigzag',group:1}}};
 ctx.app.project.activeItem={name:'Imported template folder'};
 for(let run=0;run<2;run++){
  const begin=call('beginMotionPreview',{compId:c.id,group,folder:'/fixture/render',maxSize:360,maxDuration:2});assert(begin.ok,begin.error);assert.equal(begin.data.start,1);assert.equal(begin.data.duration,2);assert(H._motionSession);assert(items.some(x=>String(x.comment||'').startsWith('VARNA_KINETIC40_INSTANCE:')),'production frame preview creates owned typography graph');
  assert.equal(call('endMotionPreview',{token:begin.data.token}).ok,true);assert.equal(H._motionSession,null);assert.equal(items.length,1,'frame preview cleanup removes private typography dependencies');assert.equal(items[0],c);
 }
 failStage=true;const failed=call('beginMotionPreview',{compId:c.id,group,folder:'/fixture/render',maxSize:360,maxDuration:2});assert.equal(failed.ok,false);assert.match(failed.error,/FRAME_STAGE_FAILURE47/);assert.equal(H._motionSession,null);assert.equal(items.length,1,'failure after native typography creation cannot leak its dependency graph');assert.equal(items[0],c);assert.equal(c.numLayers,0,'source comp remains unchanged');assert.equal(viewers,2);
}
async function bridgeChecks(){
 let reply='null';const uncaught=[];const w={location:{pathname:'/panel/index.html'},__adobe_cep__:{evalScript(script,cb){setTimeout(()=>{try{cb(reply);}catch(e){uncaught.push(e);}},0);}}},context={window:w,setTimeout,clearTimeout};vm.createContext(context);vm.runInContext(bridge,context);const B=w.GHAFBridge;
 for(const invalid of ['null','[]','true','0','{}','{"ok":"yes"}','not-json']){
  reply=invalid;let settled=false;const request=B.call('getProjectState',{}, {timeout:500}).then(()=>{throw Error('invalid reply accepted '+invalid);},e=>{settled=true;assert.equal(e.code,'HOST_INVALID_RESPONSE');assert.equal(e.method,'getProjectState');});
  await Promise.race([request,new Promise(resolve=>setTimeout(resolve,50))]);assert(settled,'async callback must settle the promise for '+invalid);assert.equal(uncaught.length,0,'callback may not throw after its timer was cleared');assert.equal(B.nativeBusy,null);
  reply='{"ok":true,"data":{"ready":true}}';assert.equal((await B.call('ping')).ready,true,'subsequent queued calls remain usable');
 }
 reply='{"ok":false,"error":"KNOWN_HOST_FAILURE"}';await assert.rejects(B.call('listFonts'),/KNOWN_HOST_FAILURE/);assert.equal(B.blocked,false);
}
async function uncertainCommit(){
 const {ctx,c,H}=model();const old=c.add('text');old.name='GHAF_CAP_old';let commitCalls=0,abortCalls=0,inspectCalls=0;const callbackErrors=[];
 const w={location:{pathname:'/panel/index.html'},__adobe_cep__:{evalScript(script,cb){let result;try{result=vm.runInContext(script,ctx);}catch(e){result='EvalScript error: '+e;}if(script.includes('GHAFHost.dispatch("commitOutputSession"')){commitCalls++;result='null';}if(script.includes('GHAFHost.dispatch("abortOutputSession"'))abortCalls++;if(script.includes('GHAFHost.dispatch("getOutputSession41"'))inspectCalls++;setTimeout(()=>{try{cb(result);}catch(e){callbackErrors.push(e);}},0);}}};
 const browser={window:w,setTimeout,clearTimeout};vm.createContext(browser);vm.runInContext(bridge,browser);const B=w.GHAFBridge;
 const group={id:47,text:'سلام',rawText:'سلام',start:1,end:2,style:{size:44,fontPS:'ArialMT',fill:'#ffffff',x:50,y:70},bg:{enabled:false},anim:{mode:'simple',preset:'none',outPreset:'none',typeSound:false}};
 const result=await O.build({call:(...args)=>B.call(...args),reconnect:()=>B.reconnect(),waitForIdle:()=>B.waitForIdle(),inspectSession:requestId41=>B.call('getOutputSession41',{requestId41}),yield:()=>Promise.resolve()},{id:c.id},[group],'separateFirst',false,true);
 assert.equal(result.recovered41,true,'committed receipt recovers an invalid commit response');assert.equal(result.created,1);assert.equal(commitCalls,1);assert.equal(inspectCalls,1);assert.equal(abortCalls,0,'committed output must not be rolled back or retried');assert.equal(callbackErrors.length,0);assert.equal(H._outputSession,null);assert(!c._layers.includes(old));assert.equal(c._layers.filter(l=>l.name.startsWith('GHAF_CAP_')).length,1);
}
(async()=>{stateChecks();explicitPreviewChecks();framePreviewChecks();await bridgeChecks();await uncertainCommit();console.log('PASS RC47 host/core: ES3 project-state read without Array.some; sparse/invalid metadata rejected; asynchronous malformed CEP envelopes settle and queue recovers; explicit destinations survive folder focus; actual kinetic frame preview cleans dependencies on repeated end and stage failure; actual output commit with null reply recovers its receipt without retry or abort. Adobe runtime untested.');})().catch(e=>{console.error(e);process.exitCode=1;});
