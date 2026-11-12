const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),M=require('../js/music-engine.js');
const p=M.plan({comp:{duration:42},captions:[],events:[{time:4,type:'cut',strength:95}]},{maxDuration:40});
for(const mode of ['ace_turbo','ace_base']){
 const graph=M.graphFor(p,{workflow:mode,models:{main:'my_model.safetensors'}});
 assert.equal(graph['1'].inputs.unet_name,'my_model.safetensors');
 assert.equal(graph['5'].inputs.tags,M.stylePrompt(p));
 assert.equal(graph['5'].inputs.lyrics,'[Instrumental]');
 assert.equal(graph['7'].inputs.seconds,40);
 assert.equal(graph['8'].inputs.steps,mode==='ace_turbo'?8:50);
 assert.equal(graph['10'].class_type,'SaveAudioAdvanced');
}
assert.throws(()=>M.graphFor(p,{workflow:'stable_audio'}),/پشتیبانی نمی‌شود/);
assert.throws(()=>M.graphFor(p,{workflow:'stable_audio',apiGraph:{a:{class_type:'NotAudio',inputs:{}}}}),/پشتیبانی نمی‌شود/);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),host=fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8');
for(const id of ['aeLightAngle','aeRefraction','aeDispersion','aeRimScale','brainMusicWorkflow','brainMusicEngineStart','brainMusicModelsFolder'])assert(html.includes('id="'+id+'"'));
assert(!html.includes('id="brainMusicModelPath"')&&!html.includes('id="brainMusicApiPath"'));
assert(html.includes('data-bg-mode="aeGlass"'));
assert(host.includes('if(style==="aeGlass")return GHAFHost._applyAEGlassBg(layer,bg)'));
assert(html.includes('id="tableGlassEngine"'));assert(host.includes('if(aeGlassTable)GHAFHost._applyAEGlass(shape,p.aeGlass||{})')); 
const assets=fs.readdirSync(path.join(root,'assets/workflows')).filter(x=>x.endsWith('.json'));assert(assets.length>=9);
console.log('PASS RC12: separate AE Glass background, ACE graphs, workflow catalog and model controls');
