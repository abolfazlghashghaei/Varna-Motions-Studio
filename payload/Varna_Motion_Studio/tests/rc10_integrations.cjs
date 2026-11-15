const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),host=fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8');
for(const old of ['page-glass','bgOriginalGlass','glassGallery','bgGlassGallery','template-chart','bg-template.js','glass-library.js'])assert(!html.includes(old),'old gallery remains: '+old);
assert(!fs.existsSync(path.join(root,'assets/packs/glass-templates')));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/packs/textyle-presets/catalog.json'),'utf8'));
assert.equal(catalog.length,750);for(const x of catalog)assert(fs.statSync(path.join(root,'assets/packs/textyle-presets',x.path)).size>0);
const selections=[],layers=[];const comp={time:1,numLayers:2,layer:i=>layers[i-1]};
class File {constructor(p){this.fsName=p;this.parent={parent:{fsName:root}};this.exists=p.endsWith('.ffx')&&fs.existsSync(p);}}
const a={adjustmentLayer:false,selected:true,containingComp:comp,inPoint:1,outPoint:4,property(){return {addProperty(match){selections.push(match);const names=['Light Angle','Light Intensity','Refraction','Depth','Dispersion','Frost','Splay','Magnify','Effect Scale','Rim Scale'];return {name:'',numProperties:names.length,property(i){return {name:names[i-1],setValue(v){this.value=v;}}}};}}},applyPreset(file){selections.push([file.fsName,comp.time,...layers.map(x=>x.selected)]);}};
const b={selected:true};layers.push(a,b);
const ctx={app:{effects:[{displayName:'AE Glass',matchName:'SphereLabAEGlass'}]},File,$:{fileName:path.join(root,'host/ghaf_host.jsx')}};
vm.createContext(ctx);vm.runInContext(host,ctx);const H=ctx.GHAFHost;
assert.equal(H._aeGlassInfo().available,true);assert.equal(H._applyAEGlass(a,{refraction:75}).name,'VARNA · AE Glass');assert.equal(selections[0],'SphereLabAEGlass');assert.equal(a.adjustmentLayer,true);
const sample=catalog.find(x=>x.phase==='IN'&&x.basis==='Words');H._textylePreset(a,sample.path,'IN',{inDur:.5});
assert.equal(selections[1][2],true);assert.equal(selections[1][3],false);assert.equal(a.selected,true);assert.equal(b.selected,true);assert.equal(comp.time,1);
assert.throws(()=>H._textylePreset(a,'../evil.ffx','IN',{}),/INVALID_PRESET/);
assert.throws(()=>H._textylePreset(a,sample.path,'OUT',{}),/INVALID_PRESET/);
console.log('PASS direct AE Glass detection/application, 750 FFX assets, isolated Textyle application, old gallery removal');
