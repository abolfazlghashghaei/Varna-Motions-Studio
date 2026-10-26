const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.join(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8'),M=require('../js/music-engine.js');
const base=fs.mkdtempSync(path.join(os.tmpdir(),'varna-model-paths-'));
try{
 const engine=path.join(base,'GHAF','Core'),config=path.join(base,'GHAF','Config','extra_model_paths.yaml');
 fs.mkdirSync(path.join(engine,'ComfyUI'),{recursive:true});fs.mkdirSync(path.join(engine,'python_embeded'),{recursive:true});fs.mkdirSync(path.dirname(config),{recursive:true});
 fs.writeFileSync(path.join(engine,'ComfyUI','main.py'),'');fs.writeFileSync(path.join(engine,'python_embeded','python.exe'),'');
 fs.writeFileSync(config,'photoshop_shared:\n  base_path: /models\n  checkpoints: checkpoints\n');
 const files={main:path.join(base,'external','dit.safetensors'),clip:path.join(base,'external','encoder.safetensors'),vae:path.join(base,'other','dav.safetensors')};
 for(const file of Object.values(files)){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'model-data');}
 const result=M.registerExternalModels(files,'minimax',{LOCALAPPDATA:base,USERPROFILE:base});assert.equal(result.changed,true);
 const text=fs.readFileSync(config,'utf8');assert(text.includes('photoshop_shared:'));assert(text.includes('varna_motion_audio:'));assert(text.includes('diffusion_models: |'));assert(text.includes('text_encoders: |'));assert(text.includes('vae: |'));assert(fs.existsSync(config+'.varna-backup'));
 assert.equal(M.registerExternalModels(files,'minimax',{LOCALAPPDATA:base,USERPROFILE:base}).changed,false);
 assert.deepEqual(M.modelNames(files),{main:'dit.safetensors',clip:'encoder.safetensors',vae:'dav.safetensors'});
}finally{fs.rmSync(base,{recursive:true,force:true});}
const html=read('index.html'),app=read('js/app.js'),css=read('css/project-brain.css'),backend=read('INSTALL_WINDOWS.ps1'),batch=read('INSTALL_WINDOWS.bat');
for(const id of ['brainMusicEngineStart','brainMusicEngineStop','brainMusicModelsFolder','brainMusicScanModels'])assert(html.includes('id="'+id+'"'));
assert(!html.includes('id="brainMusicClipPath"')&&!html.includes('id="brainMusicRegisterPaths"'));
assert(app.includes('registerExternalModels({discovered:found.models}'));
assert(css.includes('body .ghaf-modal{position:fixed;left:50%;top:50%'));
assert(!css.includes('body .card,body .ghaf-modal{position:relative'));
assert(app.includes('focus({preventScroll:true})'));
assert(!backend.includes('InstallAudioModels')&&!batch.includes('audioModelsChoice'));
assert(backend.includes("if ($Level -eq 'Max') {"));
assert(batch.includes('Read the error above.')&&batch.includes('pause'));
console.log('PASS RC16: automatic engine detection, model path registration, centered shortcuts and visible error');
