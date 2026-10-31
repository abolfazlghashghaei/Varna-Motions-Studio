const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const M=require('../js/music-engine.js'),root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'varna-audio-auto-'));
try{
 const core=path.join(tmp,'GHAF','Core'),models=path.join(tmp,'External Models'),config=path.join(tmp,'GHAF','Config','extra_model_paths.yaml');
 for(const file of [path.join(core,'ComfyUI','main.py'),path.join(core,'python_embeded','python.exe'),path.join(models,'checkpoints','yue2_3b_int8_convrot.safetensors'),path.join(models,'diffusion_models','minimax_music3_dit_int8_convrot.safetensors'),path.join(models,'text_encoders','minimax_music3_text_encoder_pruned_int8_convrot.safetensors'),path.join(models,'vae','minimax_music3_dav.safetensors')]){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'fixture');}
 fs.mkdirSync(path.dirname(config),{recursive:true});fs.writeFileSync(config,'shared:\n  base_path: "'+models.replace(/\\/g,'/')+'"\n  checkpoints: |\n    checkpoints\n  diffusion_models: |\n    diffusion_models\n');
 const found=M.discoverAudioModels('',{LOCALAPPDATA:tmp,USERPROFILE:tmp});
 assert.equal(found.files.length,4);assert(M.completeModels('yue',found.models.yue));assert(M.completeModels('minimax',found.models.minimax));
 const registered=M.registerExternalModels({discovered:found.models},'yue',{LOCALAPPDATA:tmp,USERPROFILE:tmp});assert(registered.changed);const yaml=fs.readFileSync(config,'utf8');for(const name of ['checkpoints','diffusion_models','text_encoders','vae'])assert(yaml.includes('  '+name+': |'));
 const missing=M.classifyInventory({diffusion_models:['acestep_v1.5_xl_turbo_bf16.safetensors']});assert.equal(M.completeModels('ace_turbo',missing.ace_turbo),false);
 const ready=M.classifyInventory({checkpoints:['audio/yue2_3b_int8_convrot.safetensors'],diffusion_models:['minimax_music3_dit_int8_convrot.safetensors'],text_encoders:['minimax_music3_text_encoder_pruned_int8_convrot.safetensors'],vae:['minimax_music3_dav.safetensors']});
 assert.equal(ready.yue.main,'audio/yue2_3b_int8_convrot.safetensors');assert(M.completeModels('minimax',ready.minimax));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'js/app.js'),'utf8'),engine=fs.readFileSync(path.join(root,'js/music-engine.js'),'utf8');
const card=html.slice(html.indexOf('id="brainMusic"'),html.indexOf('id="brainMusicPlan"'));
assert(card.includes('id="brainMusicEngineStart"')&&card.includes('id="brainMusicEngineStop"'));
for(const id of ['brainMusicEndpoint','brainMusicEngineRoot','brainMusicModelPath','brainMusicApiPath','brainMusicRegisterPaths'])assert(!html.includes('id="'+id+'"'));
assert(app.includes('engine=await window.VarnaMusicEngine.probe(musicEndpoint)'));
assert(engine.includes("if(!state.running||!state.enabled)throw Error('موتور وارنا در این پنل خاموش است"));
assert(app.includes("setMusicEngineBadge('off','خاموش در پنل')"));
assert(engine.includes("launchPort=candidate.port==='17861'?await selectLaunchPort"));
console.log('PASS RC18 audio lifecycle: automatic folder/inventory discovery, complete models, local power control and simplified UI');
