// Real state/modules regression; canvas only estimates font measurement.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),plain=x=>JSON.parse(JSON.stringify(x)),stored=new Map();
const ctx={window:{},console,document:{createElement:()=>({getContext:()=>({font:'',measureText:t=>({width:String(t).length*52})})})},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)}};
vm.createContext(ctx);for(const name of ['timing.js','text-layout.js','captions37.js','kinetic40.js','state.js','appearance-state.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',name),'utf8'),ctx,{filename:name});
const S=ctx.window.GHAFState,K=ctx.window.VarnaKinetic40;
S.source={compWidth:360,compHeight:640};S.settings.layout={lines:1,wordsPerLine:2,kashida:false};
S.addManual(0,3);const g=S.current();g.text='سلام این یک متن بسیار بلند برای بررسی اندازه قلم است';
const ordinary=plain(S.exportGroups())[0];assert(ordinary.style.size<S.styleFor(g).size,'fixture fits long text');
g.animOverride={...S.animFor(g),kinetic40:{enabled:false,segments:[{from:0,to:999}]}};
const disabled=plain(S.exportGroups())[0];assert.equal(disabled.style.size,ordinary.style.size,'disabled scene follows normal fitting');assert(!disabled.kinetic40Repair47);
S.addManual(3.1,2);S.current().text='عبارت دوم';S.settings.caption37.stack={enabled:true,lines:3,gap:1.35,mode:'aligned'};
const stacked=plain(S.exportGroups());assert(stacked[0].stack37&&stacked[1].stack37);assert.equal(stacked[0].stack37.id,stacked[1].stack37.id);assert.equal(stacked[0].end,stacked[1].end);
S.settings.caption37.stack.enabled=false;S.select(g.id);g.text='سلام علی';const valid={enabled:true,group:1,pattern:'right',segments:[{from:0,to:1,color:'#aabbcc',motion45:{entry:'drop'}},{from:1,to:2,fontPS:'Vazirmatn'}]};g.animOverride.kinetic40=plain(valid);
let output=plain(S.exportGroups())[0];assert.deepEqual(output.anim.kinetic40,valid,'valid artwork exported exactly');assert(!output.kinetic40Repair47);
for(const text of ['سلام','سلام علی و محصول LG OLED امروز']){
 const saved=plain(g.animOverride),history=S.undoStack.length;S.setText(g.id,text);S.settings.caption37.protected=['LG OLED'];output=plain(S.exportGroups())[0];assert.equal(output.kinetic40Repair47.reason,'TEXT_PARTITION_CHANGED');assert.equal(K.resolve(output,output.anim.kinetic40,output.protected40).pieces.map(p=>p.text).join(' '),text);assert.deepEqual(plain(g.animOverride),saved,'export leaves saved artwork untouched');assert.equal(S.undoStack.length,history);assert.equal(output.anim.kinetic40.pattern,'right');if(text.includes('LG OLED'))assert(output.anim.kinetic40.segments.some(p=>p.to-p.from===2));
}
g.animOverride.kinetic40={group:1,pattern:'center',customText:'سلام\nعلی',segments:[{from:0,to:1,color:'#123456',motion45:{entry:'pop'}},{from:1,to:2,background45:{mode:'solid',fill:'#654321'}}]};S.setText(g.id,'سلام علی امروز');output=plain(S.exportGroups())[0];assert.equal(output.kinetic40Repair47.preservedSegments,2);assert.equal(output.anim.kinetic40.segments[0].color,'#123456');assert.equal(output.anim.kinetic40.segments[1].background45.fill,'#654321');assert(!output.anim.kinetic40.segments[2].color);
// Same-length positional artwork remains intentional; no phrase identity is guessed.
g.animOverride.kinetic40=valid;S.setText(g.id,'علی سلام');assert.deepEqual(plain(S.sceneAnimForExport47(g).anim.kinetic40),valid);
g.highlight37={words:[{key:'سلام',ordinal:0}],color:'#ff0000',scale:130};S.settings.caption38.enabled44=false;output=plain(S.exportGroups())[0];assert.equal(output.highlight37,null);assert.equal(output.anim.kinetic40.segments[0].color,'#aabbcc');S.settings.caption38.enabled44=true;assert.equal(S.exportGroups()[0].highlight37.rawIndices38[0],1);
// Undo imports must restore their immutable reset baselines as well as document data.
const original=[{id:1,text:'متن',start:0,end:1},{id:2,text:'اصلی',start:1,end:2}];S.initWords(original);const originalWords=plain(S.words);S.importManualCaptions([{text:'متن واردشده',start:4,end:6}]);const importedWords=plain(S.words);S.undo();assert.deepEqual(plain(S.words),originalWords);S.resetToOriginal();assert.deepEqual(plain(S.words),originalWords);
S.initWords(original);S.importManualCaptions([{text:'متن واردشده',start:4,end:6}]);S.undo();S.redo();S.resetToOriginal();assert.deepEqual(plain(S.words),importedWords);assert.notDeepEqual(originalWords,importedWords);
console.log('PASS RC47 state: disabled typography uses ordinary fitting/stacking; stale partition export repair is nonmutating and explicit; exact phrase decorations/protected grouping preserved; valid artwork/keyword-off remain intact; import undo/redo restores matching reset baseline');
