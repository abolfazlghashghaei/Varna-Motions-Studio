/* Integration model, not the Adobe runtime: execute the generated CEP script,
   production host, real native-text renderer and sequential output together. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),O=require('../js/output35'),root=path.resolve(__dirname,'..');
const main=fs.readFileSync(root+'/host/ghaf_host.jsx','utf8'),bridge=fs.readFileSync(root+'/js/cep-bridge.js','utf8');
const prefix=fs.readFileSync(__dirname+'/r14.cjs','utf8').split('(async()=>{try{')[0],sandbox={require,__dirname,console,Buffer,process,setTimeout,clearTimeout};vm.createContext(sandbox);vm.runInContext(prefix+';model43={hostContext};',sandbox);
function environment(scope='global',preload=false){
 const model=sandbox.model43.hostContext(),{c,ctx}=model;c.name='Timeline';c.duration=90;c.selectedLayers=[];ctx.app.project.numItems=1;ctx.app.project.item=()=>c;
 // Remove the fixture's preloaded adapter to exercise the real cold-start path.
 ctx.VarnaHost43=null;ctx.GHAFHost={_aeSessionId:'existing-session',_lastComp36:c,legacy:true};
 const prior=ctx.GHAFHost;let loads=0,mode='good',active=0,max=0,delay=0;
 ctx.$={global:vm.runInContext('this',ctx),fileName:'/C:/پنل وارنا/host/ghaf_host.jsx',evalFile(file){
  assert(file.fsName.endsWith('/host/ghaf_host.jsx'),'RC36 direct load; boot42 must never be invoked');loads++;
  let source=main;
  if(mode==='syntax'){const e=Error('injected syntax error');e.line=2090;e.fileName=file.fsName;throw e;}
  if(mode==='partial')source=source.replace('GHAFHost._bootReady43=false;','GHAFHost._bootReady43=false;throw Error("injected initialization failure");');
  if(mode==='missingErrorHelper')source=source.replace('var required43=','GHAFHost._err=undefined;var required43=');
  return vm.runInContext(scope==='local'?'(function(){'+source+'\n}).call({foreignScope:true});':source,ctx);
 }};
 if(preload)ctx.$.evalFile({fsName:'/C:/پنل وارنا/host/ghaf_host.jsx'});
 const requests=[],w={location:{pathname:'/C:/%D9%BE%D9%86%D9%84%20%D9%88%D8%A7%D8%B1%D9%86%D8%A7/index.html'},__adobe_cep__:{evalScript(script,cb){
  active++;max=Math.max(max,active);requests.push(script);let value;try{value=vm.runInContext(script,ctx);}catch(e){value='EvalScript error: '+e;}
  if(delay)setTimeout(()=>{active--;cb(value);},delay);else{active--;cb(value);}
 }}};
 const browser={window:w,setTimeout,clearTimeout};vm.createContext(browser);vm.runInContext(bridge,browser);
 return {c,ctx,prior,B:w.GHAFBridge,requests,loads:()=>loads,max:()=>max,mode:x=>mode=x,delay:x=>delay=x};
}
const groups=Array.from({length:64},(_,i)=>({id:i+1,text:'سلام LG '+(i+1),rawText:'سلام LG '+(i+1),start:i,end:i+.8,style:{size:44,fontPS:'ArialMT',fill:'#ffffff',rtl:true,x:50,y:70,align:0},bg:{enabled:false},anim:{mode:'simple',preset:'none',outPreset:'none',typeSound:false}}));
async function nativeFlow(scope,preload,order){
 const e=environment(scope,preload),{B,ctx,c}=e,initial=e.loads();assert.equal((await B.call('ping')).version,'4.5.0-rc.47');assert.equal(e.loads(),preload?initial:initial+1);
 const H=ctx.VarnaHost43;assert.equal(H._aeSessionId,'existing-session');assert.equal(H._lastComp36,c);
 // The reported _err failure cannot recur through alias replacement: all
 // production functions retain their complete, private adapter reference.
 vm.runInContext('GHAFHost={};GHAFJSON={};',ctx);
 assert.equal((await B.call('getActiveCompInfo')).id,c.id);
 const user=c.add('text');user.name='User text';
 const p=await B.call('updateLivePreview',{compId:c.id,groups:[groups[0]],previewMode:'fast',focusViewer:false});assert.equal(p.created,1);
 const preview=c._layers.find(l=>l.name.startsWith('__VARNA_LIVE_CAP_'));assert(preview&&preview.guideLayer&&preview.enabled);assert.equal(preview.property('ADBE Text Properties').property('ADBE Text Document').value.text,groups[0].text);
 assert.equal((await B.call('removeLivePreview',{compId:c.id})).removed,1);assert(c._layers.includes(user));
 await assert.rejects(B.call('unknownMethod'),/HOST_METHOD_NOT_FOUND: unknownMethod/);assert(!B.blocked);
 const loaded=e.loads();e.delay(2);B.outputBusy=true;
 const result=await O.build({call:(...args)=>B.call(...args),profile41:'light',yield:()=>new Promise(r=>setTimeout(r,1))},{id:c.id},groups,order,true,true);B.outputBusy=false;
 assert.equal(result.created,64);assert.equal(e.max(),1);assert.equal(e.loads(),loaded,'one host initialization, never per caption');assert.equal(H._outputSession,null);
 const texts=c._layers.filter(l=>l.name.startsWith('GHAF_CAP_')),ids=Array.from(texts,l=>Number(l.comment.split('\n')[0].split(':')[1])),expected=groups.map(g=>g.id);if(order==='separateLast')expected.reverse();assert.deepEqual(ids,expected);
 assert(texts.every(l=>!l.guideLayer&&l.enabled&&l.outPoint>l.inPoint));assert(c._layers.includes(user));assert.equal(texts.length,64);
 const buildScripts=e.requests.filter(s=>s.includes('GHAFHost.dispatch("buildOutput"'));assert.equal(buildScripts.length,64);for(const script of buildScripts){const args=script.match(/GHAFHost\.dispatch\("buildOutput",(".*?")\)/);assert(args);const payload=JSON.parse(decodeURIComponent(JSON.parse(args[1])));assert.equal(payload.groups.length,1);}
 const again=await B.call('updateLivePreview',{compId:c.id,groups:[groups[1]],previewMode:'fast',focusViewer:false});assert.equal(again.created,1,'preview also works after output');await B.call('removeLivePreview',{compId:c.id});assert.equal(c.numLayers,65);
}
(async()=>{
 const manifest=fs.readFileSync(root+'/CSXS/manifest.xml','utf8');assert(manifest.includes('<ScriptPath>./host/ghaf_host.jsx</ScriptPath>'));assert(!bridge.includes('VarnaBoot42'));
 for(const mode of ['syntax','partial','missingErrorHelper']){
  const e=environment('local'),{B,ctx}=e;e.mode(mode);await assert.rejects(B.call('ping'),x=>x.code==='HOST_BOOT_ERROR'&&/injected|HOST_INITIALIZATION_INCOMPLETE/.test(x.message));assert.equal(ctx.GHAFHost,e.prior);assert.equal(ctx.VarnaHost43,null,'failed load publishes no partial host');const count=e.requests.length;
  await assert.rejects(B.call('getSelectionInfo'),x=>x.code==='HOST_BOOT_ERROR');assert.equal(e.requests.length,count);assert.equal(await B.peekTime(),null);
  e.mode('good');assert.equal((await B.reconnect()).version,'4.5.0-rc.47');assert(!B.blocked&&!B.bootError43);assert(ctx.VarnaHost43._bootReady43);
 }
 const repair=environment();await repair.B.call('ping');repair.ctx.VarnaHost43._err=undefined;const count=repair.loads();await repair.B.call('ping');assert.equal(repair.loads(),count+1);assert.equal(typeof repair.ctx.VarnaHost43._err,'function','incomplete error helper triggers validated reload before dispatch');
 const empty=environment('local');empty.ctx.app.project.activeItem=null;empty.ctx.app.project.numItems=0;await empty.B.call('ping');assert.equal((await empty.B.call('checkOutput')).comp,false,'an empty project boots and reports context separately');
 await nativeFlow('global',false,'separateFirst');await nativeFlow('local',false,'separateLast');await nativeFlow('local',true,'separateFirst');
 console.log('PASS RC43 host: RC36 direct loading; global/local-scope cold and manifest startup; atomic initialization failures; missing _err repair; alias-independent closures; real native-text preview before/after 64 sequential captions in both orders; 1 host load, 1 caption/request, 1 physical call at a time; user layers preserved. Adobe runtime remains untested.');
})().catch(e=>{console.error(e);process.exitCode=1;});
