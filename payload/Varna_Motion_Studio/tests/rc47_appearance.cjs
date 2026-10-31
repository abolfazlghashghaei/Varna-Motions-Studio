/* Native property/layer constraints are modeled; these checks do not render Adobe pixels. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
// Reuse RC46's constrained native primitives and duplicate support, not its tests.
const fixture=fs.readFileSync(path.join(__dirname,'rc46_host.cjs'),'utf8').split('// Prove that this model')[0];
const sandbox={require,__dirname,console,Buffer,process,setTimeout,clearTimeout};vm.createContext(sandbox);vm.runInContext(fixture+';appearance47={H,c,ctx,call};',sandbox);
const {H,c,ctx,call}=sandbox.appearance47;
assert(fs.readFileSync(root+'/host/ghaf_host.jsx','utf8').includes(fs.readFileSync(root+'/host/upgrades27.jsx','utf8').trim()),'test must execute the synchronized production host');
const group={id:47,text:'متن مستقل',rawText:'متن مستقل',start:1,end:6,style:{size:64,fontPS:'ArialMT',fill:'#ffffff',x:50,y:50},bg:{enabled:true,engine:'native',style:'solid',hex:'#123456',opacity:90,padding:12,round:8,gradientEnabled:false,rimGradient:false,independentMotion:true,motion:'pop',motionDur:.4,outPreset:'fade',outDur:.2},anim:{mode:'simple',preset:'none',outPreset:'none',typingEnabled:false,typeSound:false}};
const text=H._createTextLayer(c,group,'Selected text');text.matchName='ADBE Text Layer';
const anchors=()=>c._layers.filter(l=>l.comment==='VARNA_BG_ANCHOR:'+text.name),surfaces=()=>c._layers.filter(l=>String(l.comment||'').includes('VARNA_BG_OWNER:'+text.name+'\n'));
assert.equal(anchors().length,1);assert(surfaces().length>0);const anchor=anchors()[0],surface=surfaces()[0],count=c.numLayers;
H._finalizeBackground27(text,group.bg,group);H._finalizeBackground27(text,group.bg,group);
assert.equal(c.numLayers,count,'repeated finalization cannot add hidden layers');assert.equal(anchors().length,1);assert.equal(anchors()[0],anchor);assert.equal(surface.parent,anchor,'existing detached surface keeps its native anchor');
// Explicitly disabling a background through selected-layer typing removes both
// surfaces and their detached measurement anchor, without touching user shapes.
const user=c.add('shape');user.name='User shape';c.selectedLayers=[text];
let result=call('applyTypingSelection',{anim:group.anim,bg:{enabled:false}});assert(result.ok,result.error);assert.equal(anchors().length,0);assert.equal(surfaces().length,0);assert(c._layers.includes(user));assert(c._layers.includes(text));
// Reapplying fixed-size typing replaces its helper instead of leaking another
// complete text measurement on every click. All rendering hooks remain real.
const typing={mode:'simple',preset:'typewriter',outPreset:'none',typingEnabled:true,typeSound:false,inDur:.4,startOffset:0},fixed={...group.bg,followTyping:false};
const measures=()=>c._layers.filter(l=>l.name==='__GHAF_TYPE_MEASURE__'+text.name&&l.comment==='VARNA_TYPE_MEASUREMENT');
for(let i=0;i<3;i++){result=call('applyTypingSelection',{anim:typing,bg:fixed});assert(result.ok,result.error);assert.equal(measures().length,1);assert.equal(anchors().length,1);assert.equal(surfaces().length,1);assert(c._layers.includes(user));}
result=call('applyTypingSelection',{anim:group.anim,bg:{enabled:false}});assert(result.ok,result.error);assert.equal(measures().length,0);assert.equal(anchors().length,0);assert.equal(surfaces().length,0);assert.equal(c.numLayers,2);
// A native background engine refusal must be visible to the caller. This is an
// explicit failure injection, not a substitute renderer in the success path.
const apply=H._applyBg;H._applyBg=()=>false;result=call('applyTypingSelection',{anim:typing,bg:fixed});H._applyBg=apply;assert.equal(result.ok,false);assert.match(result.error,/BACKGROUND_APPLY_FAILED/);assert.equal(measures().length,0,'failed engine cannot leak a new typing measurement');assert(c._layers.includes(user));
console.log('PASS RC47 appearance: actual native background/style/typing hooks; repeated independent-background finalization is idempotent; explicit disabled background removes owned surfaces/anchors; fixed typing measurements are replaced; user shapes preserved; native refusal reports failure. Adobe rendering remains untested.');
