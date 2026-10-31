/* Same controlled child + real authenticated HTTP as the existing engine regression. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const prefix=fs.readFileSync(path.join(__dirname,'r14_local_ai.cjs'),'utf8').split('(async()=>{let probe;try{')[0];
const checks=`
(async()=>{try{
 const projector=path.join(dir,'mmproj-model-f16.gguf');fs.writeFileSync(projector,'GGUFprojection');
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const opts={exe,runtimeDir:dir,textDir:dir,textModel:model,typeDir:dir,typeModel:model,translatorDir:dir,translatorModel:model,visionDir:dir,visionModel:model,mmproj:projector,port,reserveRamGB:0,gpuLayers:0,releaseAfterJob:false};
 assert.equal(N.resolveLocalPaths({...opts,mmproj:''}).mmproj,projector,'path discovery finds the sibling Vision projector');
 for(const role of ['text','type','translator']){await N.ensureLocalRole(role,opts);assert(!lastArgs.includes('--mmproj'),role+' must not receive a Vision projector');assert.equal(N.localAIStatus().role,role);}
 await N.ensureLocalRole('vision',opts);assert.equal(lastArgs[lastArgs.indexOf('--mmproj')+1],projector);assert(lastArgs.includes('--no-mmproj-offload'));
 await N.ensureLocalRole('text',opts);assert(!lastArgs.includes('--mmproj'),'Vision -> text transition strips the projector again');
 await N.startLocalAI({...opts,model,mmproj:projector});assert(!lastArgs.includes('--mmproj'),'manual text launch also isolates Vision configuration');
 console.log('PASS Studio51 engine: discovered Qwen2.5 Vision projector never attached to Qwen3.5 text, type, translation or manual text; explicit Vision retains projector; Vision/text role transitions checked against actual spawned arguments and authenticated readiness.');
}finally{N.shutdown();if(server?.listening)await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});`;
const context={require,__dirname,console,Buffer,process,URL,setTimeout,clearTimeout};vm.createContext(context);vm.runInContext(prefix+checks,context);
