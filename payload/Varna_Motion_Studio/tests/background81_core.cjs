const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../js/background-motion81-core.js');
const catalog=M.catalog();assert.equal(catalog.length,144);assert.equal(new Set(catalog.map(p=>p.id)).size,144);
const signatures=new Set();
for(const preset of catalog){
 const original={enabled:true,style:'solid',padding:30},bg=M.applyPreset(original,preset.id),cfg=M.resolve(bg);
 assert.deepEqual(original,{enabled:true,style:'solid',padding:30},'preset application must not mutate saved backgrounds');
 const fingerprint=[];
 for(const time of [-1,0,.13,.29,.51,.91,1.53,2.27,3.61,3.89,4,5]){
  const sample=M.sample(cfg,time,0,4,640,80,true);
  for(const value of Object.values(sample))assert(Number.isFinite(value),preset.id+' finite sample');
  assert(sample.scaleX>=0&&sample.scaleY>=0&&sample.opacity>=0&&sample.opacity<=100,preset.id+' valid range');
  const actual=JSON.parse(JSON.stringify(vm.runInNewContext(M.expression(cfg,'time,0,4,640,80,true',JSON.stringify),{time})));
  assert.deepEqual(actual,sample,preset.id+' preview/expression parity');
  if(time<=0||time>=4)assert.deepEqual([sample.scaleX,sample.scaleY,sample.opacity],[0,0,0],preset.id+' zero outer boundaries');
  fingerprint.push(Object.values(sample).map(n=>+n.toFixed(4)));
 }
 signatures.add(JSON.stringify(fingerprint));
 cfg.loop=false;const middle=M.sample(cfg,2,0,4,640,80,true);
 assert.deepEqual([middle.scaleX,middle.scaleY,middle.opacity],[100,100,100],preset.id+' no reopening at caption boundaries');
 for(const duration of [.001,.03,.07,.1])for(const time of [0,duration/2,duration]){
  const s=M.sample(cfg,time,0,duration,80,30,true);assert(Object.values(s).every(Number.isFinite));
 }
}
assert.equal(signatures.size,144,'every offered preset must produce a distinct motion trace');
const stored={id:3,text:'متن',anim:{mode:'native',preset:'rise',typingEnabled:true,word39:{enabled:true}},word39:{timing:[]},bg:{enabled:true,reflow67:{enabled:true}}};
const frozen=M.staticText(stored);assert.equal(frozen.anim.preset,'none');assert.equal(frozen.anim.typingEnabled,false);assert(!frozen.word39);assert.equal(stored.anim.preset,'rise');
stored.bg.reflow67.enabled=false;assert.deepEqual(M.staticText(stored),stored,'switching off retains the stored text animation');
assert.throws(()=>M.applyPreset({},'missing'),/UNKNOWN/);
try{require('acorn').parse(fs.readFileSync(require.resolve('../js/background-motion81-core.js'),'utf8'),{ecmaVersion:3});}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
console.log('PASS UI81 core: 144 distinct motion traces, ES3 expression parity, zero first/last boundaries, short spans, no intermediate reopening and immutable static-text policy.');
