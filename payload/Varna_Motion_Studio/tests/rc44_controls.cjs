// Real state serialization plus the production suggestion coordinator, using a DOM fixture.
// Browser rendering and Adobe execution are separate checks.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),source=f=>fs.readFileSync(path.join(root,'js',f),'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const store=new Map(),ctx={window:{},document:{createElement:()=>({getContext:()=>({font:'',measureText:t=>({width:String(t).length*16})})})},console,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
vm.createContext(ctx);for(const f of ['timing.js','text-layout.js','captions37.js','state.js','appearance-state.js'])vm.runInContext(source(f),ctx);
const S=ctx.window.GHAFState;S.settings.caption38.auto=false;S.addManual(0,2);S.current().text='محصول LG جدید';S.current().highlight37={words:[{key:'lg',ordinal:0}],scale:125,color:'#aabbcc',manual38:true};
const before=plain(S.groups),on=plain(S.exportGroups());assert(on[0].highlight37.indices.length);
S.pushUndo();S.settings.caption38.enabled44=false;S.saveSettings();const off=plain(S.exportGroups());assert.equal(off[0].highlight37,null);assert.deepEqual(plain(S.groups),before,'switch never deletes selections, text or timing');const stripped=plain(on);stripped.forEach(g=>g.highlight37=null);assert.deepEqual(off,stripped,'only emphasis changes in the payload');
S.undo();assert.equal(S.exportGroups()[0].highlight37.color,'#aabbcc');S.redo();assert.equal(S.exportGroups()[0].highlight37,null);
S.settings.caption38.enabled44=true;assert.deepEqual(plain(S.exportGroups()),on,'reenable restores exact output');
S.settings.caption38.enabled44=false;S.saveSettings();S.settings.caption38.enabled44=true;S.loadSettings();assert.equal(S.settings.caption38.enabled44,false,'off survives reload');
S.resetToDefaults();assert.equal(S.settings.caption38.enabled44,true,'reset uses compatible default');

class E{constructor(){this.value='';this.checked=false;this.hidden=false;this.disabled=false;this.classList={contains:()=>false};}querySelector(){return new E();}querySelectorAll(){return [new E(),new E()];}after(){}addEventListener(){}get scrollTop(){return 0;}set scrollTop(v){}}
const nodes=new Map(),el=s=>{if(!nodes.has(s))nodes.set(s,new E());return nodes.get(s);},timers=new Map();let serial=0,modelCalls=0,resolveModel;
const H=require('../js/highlight38.js'),K=require('../js/keywords39.js');const g={id:1,text:'محصول LG جدید'};
const state={settings:{caption38:{enabled44:false,auto:true,provider39:'model',modelFallback39:false}},groups:[g],source:{},projectBrain:{},current:()=>g,group:id=>id===g.id?g:null,text:g=>g.text,saveSettings(){},pushUndo(){}};
const w={GHAFState:state,GHAFBridge:{outputBusy:false},VarnaCaptions37:ctx.window.VarnaCaptions37,VarnaHighlight38:H,VarnaKeywords39:K,GHAFNode:{available:true,chatRole:async()=>{modelCalls++;return new Promise(r=>resolveModel=r);}},VarnaActions:{refresh(){}},VarnaStudio37:{render(){}}};
const ui={window:w,document:{createElement:()=>new E(),querySelector:el,querySelectorAll:()=>[],addEventListener(){},body:{classList:{contains:()=>false}}},MutationObserver:class{observe(){}},setInterval(){},setTimeout:(fn,ms)=>{if(ms===0){queueMicrotask(fn);return 0;}timers.set(++serial,{fn,ms});return serial;},clearTimeout:id=>timers.delete(id),console};
vm.createContext(ui);vm.runInContext(source('studio38.js').split('const baseReveal38=')[0]+'})(window);',ui);
(async()=>{
 assert.equal(timers.size,0,'disabled keyword feature cannot schedule');await w.VarnaHighlightUI38.run();await w.VarnaHighlightUI38.ensure();assert.equal(modelCalls,0,'disabled feature cannot start engine');
 state.settings.caption38.enabled44=true;const run=w.VarnaHighlightUI38.run(true,true);assert.equal(modelCalls,1);state.settings.caption38.enabled44=false;resolveModel('{"captions":[{"id":1,"indices":[1],"reason":"برند"}]}');await run;assert.equal(g.highlight37,undefined,'response finishing after off cannot apply');
 state.settings.caption38.enabled44=true;state.settings.caption38.provider39='rules';el('#highlightColor37').value='#aabbcc';el('#highlightScale37').value='100';await w.VarnaHighlightUI38.run(true,true);assert(g.highlight37.words.length,'reenabled feature still applies explicit suggestions');
 console.log('PASS RC44 controls: compatible default, exact reversible emphasis-only payload, settings persistence/reset/undo/redo, zero disabled model work, rejection of in-flight result, reenabled suggestions');
})().catch(e=>{console.error(e);process.exitCode=1;});
