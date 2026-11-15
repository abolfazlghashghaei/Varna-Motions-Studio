const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),os=require('os');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'js','app.js'),'utf8'),host=fs.readFileSync(path.join(root,'host','ghaf_host.jsx'),'utf8'),engine=fs.readFileSync(path.join(root,'js','node-engine.js'),'utf8');
// Every Composer card exposed in UI must have a native host mapping.
const ids=[...html.matchAll(/data-preset="(ac[^"]+)"/g)].map(m=>m[1]);assert(ids.length>=40,'expected expanded Composer text library');for(const id of ids)assert(host.includes("preset==='"+id+"'"),'missing host mapping '+id);
assert(app.includes('motion-card-preview')||app.includes('decorateMotionCards'));assert(app.includes("acWordLift:'word-rise'"));assert(app.includes("acCharSides:'char-sides'"));
// Marker driven IN/OUT and start/end markers.
['VARNA START','VARNA IN START','VARNA IN END','VARNA OUT START','VARNA OUT END','VARNA END'].forEach(x=>assert(host.includes(x),x+' marker missing'));
assert(host.includes("sp.expression=ex"),'text intro must be marker driven');assert(host.includes("value*(1-q)"),'outro must be marker driven');
assert(host.indexOf('GHAFHost._addAnimMarkers(l,g,aa);')<host.indexOf('GHAFHost._animTransform(l,g,aa);'),'markers must exist before expressions');
// SFX host contract.
['removeSfxPreview','removeGhafSfx','applySfxPlan','analyzeComposition','renderSfxAnalysisFrames'].forEach(x=>assert(host.includes('GHAFHost.'+x+'=')||host.includes('GHAFHost.'+x+' ='),x+' missing'));
assert(host.includes('eventTime!=null?x.eventTime:x.time'));assert(host.includes('l.startTime=placeStart'));
// Correction learning, shortcuts and portability.
assert(app.includes("key==='KeyH'"));assert(app.includes("key==='Digit4'"));assert(app.includes('scheduleAutomaticCorrectionLearning'));assert(app.includes('btnExportCorrectionMemory'));assert(app.includes('btnImportCorrectionMemory'));assert(engine.includes('exportCorrectionMemory=function'));assert(engine.includes('importCorrectionMemory=function'));
// Native color picker and Liquid Glass optical layers.
assert(host.includes('GHAFHost.pickColor=function'));assert(!app.includes("await host('pickColor')"),'native color input must not be hijacked');['bgGradientEnabled','bgGradientColor2','bgRimColor1','bgRimColor2','bgEdgeDepth','bgLensing'].forEach(id=>assert(html.includes('id="'+id+'"'),id+' missing'));
['VARNA R11 Two Tint','VARNA R11 Optical Core','VARNA R11 Lower Lens Edge','VARNA Lens Refraction'].forEach(x=>assert(host.includes(x),x+' missing'));
// No app host call may target a missing dispatch method.
const calls=new Set([...app.matchAll(/host\(['"]([A-Za-z0-9_]+)['"]/g)].map(m=>m[1]));const impl=new Set([...host.matchAll(/GHAFHost\.([A-Za-z0-9_]+)\s*=\s*function/g)].map(m=>m[1]));const missing=[...calls].filter(x=>!impl.has(x));assert.deepEqual(missing,[],`missing host functions: ${missing.join(', ')}`);
// Import/export memory roundtrip.
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'varna-r10-')),mem={};const c={window:{require},require,process:{env:{APPDATA:scratch}},Buffer,console,URL,setTimeout,clearTimeout,localStorage:{getItem:k=>mem[k]||null,setItem:(k,v)=>mem[k]=v},document:{createElement:()=>({getContext:()=>({font:'',measureText:t=>({width:t.length*20})})})}};vm.createContext(c);vm.runInContext(engine,c);const N=c.window.GHAFNode;N.learnCorrectionPairs([{wrong:'منصوعي',right:'مصنوعی'}]);const outDir=path.join(scratch,'out');fs.mkdirSync(outDir);const ex=N.exportCorrectionMemory(outDir);assert(fs.existsSync(ex.file));N.clearCorrectionMemory();assert.equal(N.loadCorrectionMemory().items.length,0);N.importCorrectionMemory(ex.file);assert(N.loadCorrectionMemory().items.some(x=>x.right==='مصنوعی'));
fs.rmSync(scratch,{recursive:true,force:true});console.log('PASS R10 Composer previews/runtime, smart markers, SFX host contract, correction shortcuts/portability, native color and Liquid Glass');
