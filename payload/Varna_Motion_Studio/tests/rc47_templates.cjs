/* Real template adapter with strict AE-like structural groups. No Adobe runtime/pixels. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
let fixture=fs.readFileSync(path.join(__dirname,'rc38_templates.cjs'),'utf8').split('const ready=')[0];
// The old fixture models every property as writable. Preserve native identity and
// explicit groups when duplicating this stricter template graph.
fixture=fixture.replace('n.children=p.children.map(cloneProp);return n;',"n.children=p.children.map(cloneProp);n.matchName=p.matchName;n.hasMin=p.hasMin;n.hasMax=p.hasMax;n.minValue=p.minValue;n.maxValue=p.maxValue;if(p.strictGroup47){n.strictGroup47=true;n.setValue=undefined;n.setValueAtTime=undefined;}return n;");
const F=new Function('require','__dirname','console','Buffer','process','setTimeout','clearTimeout',fixture+';return {H,c,ctx,call,items,source,sourceText,fx,Prop,CompItem,register};')(require,__dirname,console,Buffer,process,setTimeout,clearTimeout);
const {H,c,ctx,call,items,source,sourceText,fx,Prop,CompItem,register}=F;
assert(fs.readFileSync(root+'/host/ghaf_host.jsx','utf8').includes(fs.readFileSync(root+'/host/templates38.jsx','utf8').trim()),'production host embeds exact template adapter');
for(const effect of fx.children){effect.matchName='ADBE '+(effect.name==='Auto Animate'?'Checkbox':effect.name.includes('Color')?'Color':'Slider')+' Control';effect.children[0].matchName=effect.matchName+'-0001';
 const group=effect.addProperty('Compositing Options');group.matchName='ADBE Effect Built In Params';group.strictGroup47=true;group.setValue=group.setValueAtTime=undefined;group._value=null;
 // A genuine numeric compositing child is also unrelated to active-word control.
 const mix=group.addProperty('Effect Opacity');mix.matchName='ADBE Effect Mask Opacity';mix.setValue(85);
 const end=effect.addProperty('Group End');end.matchName='ADBE Group End';end.strictGroup47=true;end.setValue=end.setValueAtTime=undefined;end._value=null;
 const auxiliary=effect.addProperty('Unrelated numeric option');auxiliary.matchName='Unrelated-0002';auxiliary.setValue(77);
}
const ready=call('prepareTemplate38',{id:'fixture'});assert(ready.ok,ready.error);
assert.equal(ready.data.controls.filter(p=>p.path[0]===2||p.path[0]===3).length,0,'structural/compositing groups are not editable inspector controls');
assert(ready.data.controls.every(p=>p.kind!=='readonly'));assert(ready.data.controls.every(p=>typeof p.effectMatchName==='string'&&typeof p.matchName==='string'));
const active=ready.data.controls.find(p=>p.effectName==='Active Word'&&p.path.length===1&&p.path[0]===1),auto=ready.data.controls.find(p=>p.effectName==='Auto Animate'&&p.path[0]===1);
assert(active&&auto);const uneditable={...auto,path:[3],matchName:'ADBE Group End'};
assert.equal(H._templateProperty38(source,uneditable,true),null);assert.throws(()=>H._templateProperty38(source,uneditable),/گروه/);
assert.throws(()=>{const e=fx.children[0].children[2];e.setValue(0);},/function/,'negative control reproduces original setValue-on-group failure');
for(const bad of [{...active,path:[]},{...active,path:['bad']},{...active,effectIndex:NaN},{...active,layerPath:['bad']},{...active,path:[999]},{...active,matchName:'WRONG'},{...active,effectMatchName:'WRONG'}])assert.throws(()=>H._templateProperty38(source,bad),/قالب/);
const cfg={id:'fixture',slots:[ready.data.slots[0].path],parameters:[{...auto,path:[3],matchName:'ADBE Group End',kind:'readonly',value:null},{...auto,path:[2,1],matchName:'ADBE Effect Mask Opacity',value:50}],activeMode:'speech',panelFont:false};
const g={id:47,text:'سلام عرض میکنم خدمت',rawText:'سلام عرض میکنم خدمت',start:2,end:6,style:{x:50,y:60},bg:{enabled:false},anim:{template38:cfg},highlight37:{rawIndices38:[-1,1,1,3,99],color:'#ffcc00'},timing38:[{start:2},{start:3},{start:4},{start:5}]};
// Existing animated controls must be replaced deliberately by word automation,
// not rejected by native setValue-on-keyframed-property rules.
for(const control of ready.data.controls.filter(p=>p.path[0]===1&&['Auto Animate','Word Duration','Start Delay','Active Word'].includes(p.effectName))){const p=H._templateProperty38(source,control);p.setValueAtTime(1,9);p.expression='time';p.canSetExpression=true;}
const originalText=sourceText.property('ADBE Text Properties').property('ADBE Text Document').value.text;
const out=H._createTemplate38(c,g,'GHAF_CAP_047');const info=H._templateInventory38(out.source),find=(name,first=1)=>info.controls.find(p=>p.effectName===name&&p.path.length===1&&p.path[0]===first);
assert.equal(H._templateProperty38(out.source,find('Auto Animate')).value,0);assert.equal(H._templateProperty38(out.source,find('Auto Animate')).numKeys,0);assert.equal(H._templateProperty38(out.source,find('Auto Animate')).expression,'');
assert.equal(H._templateProperty38(out.source,find('Word Duration')).value,out.source.duration/4);assert.equal(H._templateProperty38(out.source,find('Start Delay')).value,0);
const activeProp=H._templateProperty38(out.source,find('Active Word'));assert.equal(activeProp.numKeys,4);assert.deepEqual(activeProp.keys.map(k=>k.v),[1,2,3,4]);
for(const name of ['Auto Animate','Active Word','Word Duration','Start Delay'])assert.equal(H._templateProperty38(out.source,find(name,4)).value,77,'automation may not change unrelated option '+name);
assert.equal(sourceText.property('ADBE Text Properties').property('ADBE Text Document').value.text,originalText);
H._deleteLayers([out]);
const before=items.length,bad={...g,anim:{template38:{...cfg,parameters:[{...active,path:[999],value:2}]}}};assert.throws(()=>H._createTemplate38(c,bad,'GHAF_CAP_bad'),/قالب/);assert.equal(items.length,before,'invalid leaf route rolls back the private template graph');
const chosen=H._createTemplate38(c,{...g,id:48,anim:{template38:{...cfg,activeMode:'important'}}},'GHAF_CAP_048'),chosenInfo=H._templateInventory38(chosen.source),chosenActive=H._templateProperty38(chosen.source,chosenInfo.controls.find(p=>p.effectName==='Active Word'&&p.path[0]===1));assert.deepEqual(chosenActive.keys.map(k=>k.v),[2,4],'invalid/duplicate important indexes are excluded');H._deleteLayers([chosen]);
const scalar=new Prop('scalar');scalar.setValue(1);assert.throws(()=>H._templateValue47(scalar,NaN,false),/معتبر/);scalar.hasMin=true;scalar.minValue=0;assert.throws(()=>H._templateValue47(scalar,-1,false),/بازه/);assert.throws(()=>H._templateValue47(scalar,[1,2],false),/معتبر/);
// Two imported assets may contain external (expression-only) dependencies with
// the same composition name. Resolve within this asset, independent of order.
const foreign=register(new CompItem());foreign.name='External Palette';foreign.comment='VARNA_TEMPLATE38_ASSET:foreign'+String.fromCharCode(10);
const own=register(new CompItem());own.name='External Palette';own.comment='VARNA_TEMPLATE38_ASSET:fixture'+String.fromCharCode(10);
const ref=source.layer(1).property('ADBE Transform Group').property('ADBE Position'),savedExpression=ref.expression;ref.expression='comp("External Palette").layer(1).transform.position';
const externalBefore=items.length,external=H._createTemplate38(c,{...g,id:49},'GHAF_CAP_external'),tag=external.source.comment,peers=items.filter(item=>item.comment===tag),externalCopy=peers.find(item=>item.name.endsWith('_'+own.id));
assert(externalCopy,'same-asset external dependency was copied');assert(!peers.some(item=>item.name.endsWith('_'+foreign.id)),'foreign asset with matching name was not copied');assert(external.source.layer(1).property('ADBE Transform Group').property('ADBE Position').expression.includes(externalCopy.name));assert.equal(ref.expression,'comp("External Palette").layer(1).transform.position','original expression is not rewritten');
const retained=c.layers.add(external.source);retained.name='Retained duplicate output';
H._deleteLayers([external]);assert(peers.every(item=>items.includes(item)),'retained output keeps the whole private graph including expression-only peers');
H._deleteLayers([retained]);assert.equal(items.length,externalBefore,'last output deletion removes expression-only private peers');assert(items.includes(foreign)&&items.includes(own),'both original asset sources survive');
own.remove();const missingBefore=items.length;assert.throws(()=>H._createTemplate38(c,{...g,id:50},'GHAF_CAP_external_missing'),/همین دارایی/);assert.equal(items.length,missingBefore,'missing own dependency rolls back instead of binding to foreign asset');assert(items.includes(foreign));ref.expression=savedExpression;
console.log('PASS RC47 native templates: all120 bundled catalog assets verified; legacy group setValue failure reproduced; real adapter filters structural/compositing/readonly leaves, validates stable identities/routes, repairs old unsupported snapshots, replaces active-word automation only, preserves unrelated controls/source, rolls back invalid private graphs, resolves external dependencies by owning asset, and cleans private peers only after the last retained output is removed. Adobe runtime untested.');
