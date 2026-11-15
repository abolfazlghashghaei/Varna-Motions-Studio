// Model-based AE gate: real host code and generated expressions, not native AE.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const prefix=fs.readFileSync(__dirname+'/r14.cjs','utf8').split('(async()=>{try{')[0],sandbox={require,__dirname,console,Buffer,process,setTimeout,clearTimeout};
vm.createContext(sandbox);vm.runInContext(prefix+';fixture81={hostContext,Layer};',sandbox);
const {H,c,ctx,call}=sandbox.fixture81.hostContext();ctx.app.project.itemByID=id=>id===c.id?c:null;ctx.app.project.numItems=1;ctx.app.project.item=()=>c;
sandbox.fixture81.Layer.prototype.duplicate=function(){const l=this.containingComp.layers.addText(this.property('ADBE Text Properties').property('ADBE Text Document').value.text);l.property('ADBE Text Properties').property('ADBE Text Document').setValue(this.property('ADBE Text Properties').property('ADBE Text Document').value);for(const name of ['ADBE Position','ADBE Anchor Point','ADBE Scale','ADBE Opacity'])l.property('ADBE Transform Group').property(name).setValue(this.property('ADBE Transform Group').property(name).value);l.inPoint=this.inPoint;l.outPoint=this.outPoint;l.name=this.name;return l;};
const M=require('../js/background-motion81-core.js');
const bg=M.applyPreset({enabled:true,engine:'native',style:'solid',hex:'#223344',padding:16,round:24,reflow67:{enabled:true,duration:.4,gap:.2,curve:'smooth'}},'expand-x:soft');
const groups=[['one two three four five six seven eight nine ten',1,3],['one two three four five',3,4],['one two three',4,7]].map(([text,start,end],i)=>({id:i+1,text,start,end,style:{size:40,x:50,y:70},anim:{mode:'simple',preset:'rise',inDur:.4,outPreset:'fade',outDur:.3,typeSound:true,typingEnabled:true},bg}));
const original=JSON.stringify(groups);
const owned=()=>c._layers.filter(l=>String(l.comment).includes('VARNA_REFLOW67'));
const carrier=()=>owned().find(l=>l.name.startsWith('__VARNA_BG_ANCHOR__'));
const texts=()=>c._layers.filter(l=>/^VARNA_CAPTION_ID:/.test(String(l.comment)));
function expression(text,time,extra={}){return JSON.parse(JSON.stringify(vm.runInNewContext(text,{time,...extra})));}
let r=call('buildOutput',{compId:c.id,groups,mode:'separateFirst',strict:true,clearOld:true});assert(r.ok,r.error);assert.equal(owned().length,2);assert.equal(texts().length,3);assert.equal(JSON.stringify(groups),original);
for(const l of texts()){
 assert.equal(l.property('ADBE Text Properties').property('ADBE Text Document').expression,'','continuous mode removes typing expressions');
 for(const name of ['ADBE Position','ADBE Scale','ADBE Opacity','ADBE Rotate Z'])assert.equal(l.property('ADBE Transform Group').property(name).numKeys,0,'continuous text has no transform motion');
}
const anchor=carrier(),size=anchor.property('ADBE Effect Parade').property('VARNA_REFLOW_SIZE67').property(1),surface=owned().find(l=>l!==anchor),tr=surface.property('ADBE Transform Group');
const parent={inPoint:1,outPoint:7,effect:()=>()=>[640,80]};
for(const t of [1,7])assert.deepEqual(expression(tr.property('ADBE Scale').expression,t,{parent}),[0,0],'first and last boundaries close all geometry including padding');
for(const t of [2,3,3.01,4,4.01,6])assert.deepEqual(expression(tr.property('ADBE Scale').expression,t,{parent}),[100,100],'intermediate captions never restart entry/exit');
assert(expression(size.expression,2.5)[0]>expression(size.expression,3.5)[0],'actual path size shrinks with the next caption');
assert.equal(tr.property('ADBE Scale').numKeys,0,'intermediate dimensions use the native path instead of keyed scale');
const misses=H._reflowCache81.misses;
r=call('updateLivePreview',{compId:c.id,groups:[groups[1]],reflowGroups67:groups,focusGroupId67:2,focusViewer:false});assert(r.ok,r.error);
const liveAnchor=c._layers.find(l=>String(l.comment).includes('VARNA_LIVE_OWNER')&&l.name.startsWith('__VARNA_BG_ANCHOR__'));
assert.equal(liveAnchor.inPoint,1);assert.equal(liveAnchor.outPoint,7);assert.equal(H._reflowCache81.misses,misses,'warm preview does not remeasure unchanged text');assert(H._reflowCache81.hits>=3);
assert.equal(c._layers.filter(l=>l.name.startsWith('__VARNA_LIVE_CAP_')).length,1,'fast preview retains only the requested caption root');
r=call('removeLivePreview',{compId:c.id});assert(r.ok,r.error);
const off=groups.map(g=>({...g,bg:{...g.bg,reflow67:{...g.bg.reflow67,enabled:false}}}));
r=call('refreshCaptionStyles',{groups:off,allGroups67:off});assert(r.ok,r.error);assert.equal(owned().length,0);
for(const l of texts()){
 const p=l.property('ADBE Transform Group').property('ADBE Position');assert(p.expression,'rise uses the existing marker-driven expression renderer');
 const context={inPoint:l.inPoint,outPoint:l.outPoint,marker:{numKeys:0},value:p.value,ease:(t,a,b,x,y)=>x+(y-x)*Math.max(0,Math.min(1,(t-a)/(b-a)))};
 const first=expression(p.expression,l.inPoint,context),settled=expression(p.expression,l.inPoint+.5,context);
 assert(first[1]>settled[1],'switch-off restores actual rise displacement');
}
r=call('refreshCaptionStyles',{groups,allGroups67:groups});assert(r.ok,r.error);
assert(texts().every(l=>{const p=l.property('ADBE Transform Group').property('ADBE Position');return p.numKeys===0&&!p.expression;}),'switch-on resets existing animated layers, not only new output');
const before=c._layers.slice();r=call('buildOutput',{compId:c.id,groups:[{...groups[0],bg:{...bg,style:'textGlow'}}],clearOld:true,strict:true});assert.equal(r.ok,false);assert(before.every(l=>c._layers.includes(l)),'unsupported materials preserve all previous output');
const originalApply=H._applyBg;H._applyBg=()=>{throw Error('Injected material failure');};
try{r=call('refreshCaptionStyles',{groups,allGroups67:groups});assert.equal(r.ok,false);assert(before.every(l=>c._layers.includes(l)),'failed new staging never deletes prior output');assert.equal(c._layers.length,before.length,'failed staging cleans temporary layers');}finally{H._applyBg=originalApply;}
assert.equal(JSON.stringify(groups),original,'saved caller motion is never overwritten');
console.log('PASS UI81 host model: static text, zero run endpoints including padding, no intermediate reopening, true geometric resize, full fast-preview context, warm cache, motion restoration and transactional failures. Native AE rendering remains untested.');
