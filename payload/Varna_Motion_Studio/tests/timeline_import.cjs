const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const sctx={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},document:{createElement:()=>({getContext:()=>({measureText:s=>({width:s.length*10})})})}};
vm.createContext(sctx);for(const file of ['timing.js','text-layout.js','state.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),sctx);
const S=sctx.window.GHAFState;
assert(S.importManualCaptions([{text:'کوتاه',start:1,end:1.012},{text:'بعدی',start:1.012,end:2}]));
assert.equal(S.groupEnd(S.groups[0]),1.012,'short captions must retain original out point');
assert.equal(S.exportGroups().length,2);
assert(S.undo());assert.equal(S.groups.length,0);
class Comp {constructor(layers){this.children=layers;this.duration=10;this.frameDuration=.04;}get numLayers(){return this.children.length;}layer(i){return this.children[i-1];}get selectedLayers(){return [this.children[0]];}}
const textProp={numKeys:3,keyTime:k=>[0,2,4][k-1],valueAtTime:t=>({text:t<4?'سلام':'متن بعد'}),value:{text:'سلام'}};
function layer(index){return {index,name:'User Text '+index,inPoint:1,outPoint:6,property:n=>n==='ADBE Text Properties'?{property:m=>m==='ADBE Text Document'?textProp:null}:null};}
const comp=new Comp([layer(1),layer(2)]);
const hctx={CompItem:Comp,app:{project:{activeItem:comp}},console};vm.createContext(hctx);vm.runInContext(fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8'),hctx);
function run(scope){const x=hctx.GHAFHost.importTimelineText(encodeURIComponent(JSON.stringify({scope})));const r=JSON.parse(x);assert(r.ok,r.error);return r.data.items;}
const selected=run('selected');assert.equal(selected.length,2,'style-only Source Text key must not duplicate text');
assert.deepEqual(selected.map(x=>[x.text,x.start,x.end]),[['سلام',1,4],['متن بعد',4,6]]);
assert.equal(run('all').length,4);
console.log('PASS short caption timing, undo, selected/all source text keys, style-only key merge');
