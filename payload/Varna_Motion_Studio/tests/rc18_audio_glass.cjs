const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8'),M=require('../js/music-engine.js');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'varna-rc18-'));
try{
 const runtime=path.join(tmp,'GHAF','Core'),models=path.join(tmp,'Audio Models');
 for(const file of [path.join(runtime,'ComfyUI','main.py'),path.join(runtime,'python_embeded','python.exe'),path.join(models,'checkpoints','yue2_3b_int8_convrot.safetensors'),path.join(models,'diffusion_models','minimax_music3_dit_int8_convrot.safetensors'),path.join(models,'text_encoders','minimax_music3_text_encoder_pruned_int8_convrot.safetensors'),path.join(models,'vae','minimax_music3_dav.safetensors')]){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'model');}
 const cfg=path.join(tmp,'GHAF','Config','extra_model_paths.yaml');fs.mkdirSync(path.dirname(cfg),{recursive:true});fs.writeFileSync(cfg,'photoshop_shared:\n  base_path: /existing\n');
 const found=M.scanModelFolder(models);assert.equal(found.files.length,4);assert(found.models.yue.main.endsWith('yue2_3b_int8_convrot.safetensors'));assert(found.models.minimax.main.endsWith('minimax_music3_dit_int8_convrot.safetensors'));
 const first=M.registerExternalModels({folder:models},'yue',{LOCALAPPDATA:tmp,USERPROFILE:tmp});assert.equal(first.changed,true);
 const yaml=fs.readFileSync(cfg,'utf8');assert(yaml.includes('photoshop_shared:'));for(const category of ['checkpoints: |','diffusion_models: |','text_encoders: |','vae: |'])assert(yaml.includes(category),category);
 assert.equal(M.registerExternalModels({folder:models},'yue',{LOCALAPPDATA:tmp,USERPROFILE:tmp}).changed,false);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
const manual=M.plan({comp:{duration:43},events:[],captions:[]},{duration:30,style:'jazz',business:'industrial',tempo:112,kind:'music'});
assert.equal(manual.cuts,0);assert.equal(manual.bpm,112);assert.match(M.stylePrompt(manual),/industrial manufacturing/);assert.match(M.stylePrompt(manual),/Instrumental soundtrack only/);
const html=read('index.html'),app=read('js/app.js'),host=read('host/ghaf_host.jsx'),table=read('js/table-designer.js');
const section=html.slice(html.indexOf('id="brainMusic"'),html.indexOf('id="brainMusicPlan"'));
assert(section.includes('id="brainMusicSource"')&&section.includes('id="brainMusicBusiness"'));
assert(!section.includes('id="brainMusicEndpoint"')&&!section.includes('id="brainMusicModelPath"')&&!section.includes('id="brainMusicApiPath"'));
assert(html.indexOf('id="brainMusicModelsFolder"')>html.indexOf('id="page-settings"'));
assert(html.includes('data-table-style="aeGlass"'));
for(const key of ['LightAngle','LightIntensity','Refraction','Depth','Dispersion','Frost','Splay','Magnify','EffectScale','RimScale'])assert(html.includes('id="tableAe'+key+'"'));
assert(table.includes("glassEngine:'aeGlass'")&&table.includes("num('tableAe'"));
assert(host.includes("'ADBE Vector Fill Opacity').setValue(100)")&&host.includes('optic.moveAfter(layer)'));
assert(app.includes("const t=await host('getTimelineInfo')")&&app.includes('analysis={comp:{id:t.compId')&&app.includes("manual?'':$('#brainBrief').value"));
assert(app.includes("VarnaMusicEngine.start(musicEndpoint,'',")&&app.includes('VarnaMusicEngine.stop()'));
console.log('PASS RC18: model folder discovery, shared settings preservation, manual music plan, glass and UI wiring');
