const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),ctx={console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8'),ctx);const H=ctx.GHAFHost;
let native=0;H._applyNativeAnimator=()=>native++;H._animTransform({property:()=>({})},{start:0,end:2},{mode:'native',preset:''});assert.equal(native,1);
const prop={value:{text:'سلامــــــــــ',fontSize:72},setValue(d){this.value={...d}}};const layer={containingComp:{width:500},inPoint:0,property(){return {property:()=>prop}},sourceRectAtTime(){return {width:prop.value.text.length*prop.value.fontSize,height:72};}};
H._fitText(layer,{maxLines:2,fitWidthPct:82});assert(!prop.value.text.includes('ـ'));assert(layer.sourceRectAtTime().width<=411);
assert.equal(typeof H._createCaption,'function');assert.equal(H._textSlots,undefined);assert.equal(H.createExternalMotionStage,undefined);
console.log('PASS native motion, text fit, external motion paths removed');
