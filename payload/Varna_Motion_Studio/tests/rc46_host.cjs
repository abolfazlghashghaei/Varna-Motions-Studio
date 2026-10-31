/* Regression model for AE property constraints; this is not an Adobe runtime. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),plain=x=>JSON.parse(JSON.stringify(x));
const prefix=fs.readFileSync(path.join(__dirname,'r14.cjs'),'utf8').split('(async()=>{try{')[0];
const sandbox={require,__dirname,console,Buffer,process,setTimeout,clearTimeout};vm.createContext(sandbox);vm.runInContext(prefix+';model46={hostContext,CompItem,Layer,Prop};',sandbox);
const {CompItem,Layer,Prop,hostContext}=sandbox.model46;
let blockedWrites=0,hiddenWrites=0,remapWrites=0;
// AE exposes 3D-only transform properties on a 2D layer, even though setting
// their expression is invalid. canSetExpression alone is insufficient.
const oldAdd=CompItem.prototype.add,oldProperty=Layer.prototype.property;
CompItem.prototype.add=function(type,source){
 const l=oldAdd.call(this,type,source),tr=oldProperty.call(l,'ADBE Transform Group');
 for(const name of ['ADBE Anchor Point','ADBE Position','ADBE Scale','ADBE Rotate Z','ADBE Opacity']){const p=tr.property(name);p.canSetExpression=true;}
 for(const name of ['ADBE Rotate X','ADBE Rotate Y','ADBE Orientation']){
  const p=tr.property(name);p.canSetExpression=true;p.hidden46=true;
  Object.defineProperty(p,'expression',{get(){return '';},set(){blockedWrites++;hiddenWrites++;throw Error('Can not set expression because the property or a parent property is hidden');},configurable:true});
 }
 return l;
};
Object.defineProperty(Layer.prototype,'timeRemapEnabled',{get(){return !!this.remapEnabled46;},set(enabled){
 this.remapEnabled46=!!enabled;
 if(enabled){const p=oldProperty.call(this,'ADBE Time Remapping');p.keys=[{t:this.inPoint,v:0},{t:this.outPoint,v:this.source?this.source.duration:this.outPoint-this.inPoint}];}
},configurable:true});
Layer.prototype.property=function(n){
 const p=oldProperty.call(this,n);
 if(n==='ADBE Time Remapping'&&p&&!p.remap46){
  const l=this,remove=p.removeKey;
  p.remap46=true;p.canSetExpression=true;p.expression46='';
  p.removeKey=function(i){remove.call(this,i);if(!this.numKeys)l.timeRemapEnabled=false;};
  Object.defineProperty(p,'expression',{get(){return this.expression46;},set(v){remapWrites++;if(!l.timeRemapEnabled){blockedWrites++;throw Error('Can not set expression because the property or a parent property is hidden');}this.expression46=v;},configurable:true});
 }
 return p;
};
// Native duplicate support for the independent background measurement anchor.
// Hidden empty properties remain hidden; duplication does not assign to them.
Layer.prototype.duplicate=function(){
 const result=this.containingComp.add(this.type,this.source);
 for(const key of ['name','startTime','inPoint','outPoint','comment','parent','enabled','threeDLayer'])if(this[key]!==undefined)result[key]=this[key];
 function copyProps(source,dest){
  dest.setValue(plain(source.value));dest.keys=plain(source.keys);if(source.expression&&!source.hidden46)dest.expression=source.expression;
  for(const child of source.children){let target=dest.children.find(p=>p.name===child.name);if(!target)target=dest.addProperty(child.name);copyProps(child,target);}
 }
 copyProps(this,result);return result;
};
const {H,c,ctx,call}=hostContext(),items=[c];let next=461;
function register(comp){comp.id=next++;items.push(comp);comp.layers.add=source=>comp.add('precomp',source);comp.layers.addNull=()=>comp.add('null');Object.defineProperty(comp,'usedIn',{get:()=>items.filter(x=>x._layers.some(l=>l.source===comp))});comp.remove=()=>items.splice(items.indexOf(comp),1);return comp;}
c.width=1080;c.height=1920;c.layers.add=source=>c.add('precomp',source);
ctx.app.project={activeItem:c,get numItems(){return items.length;},item:i=>items[i-1],itemByID:id=>items.find(x=>x.id===id),items:{addComp:(name,width,height,pixelAspect,duration,frameRate)=>{const out=register(new CompItem());Object.assign(out,{name,width,height,pixelAspect,duration,frameRate,frameDuration:1/frameRate});return out;}}};
// Prove that this model rejects the exact RC45 sequence before testing fixes.
const old=c.layers.add(register(new CompItem()));old.timeRemapEnabled=true;const oldRemap=old.property('ADBE Time Remapping');while(oldRemap.numKeys)oldRemap.removeKey(1);assert.equal(old.timeRemapEnabled,false);assert.throws(()=>{oldRemap.expression='time';},/hidden/);H._deleteLayers([old]);old.source.remove();
const hidden=c.layers.addText('existing'),hiddenRotation=hidden.property('ADBE Transform Group').property('ADBE Rotate X');assert.equal(hiddenRotation.canSetExpression,true);assert.throws(()=>{hiddenRotation.expression='';},/hidden/);hidden.remove();
// The real reset helper also handles separated positions and unsupported/null
// channels without hiding a failure in an ordinary, editable channel.
const separated=c.layers.addText('separated'),transform=separated.property('ADBE Transform Group'),position=transform.property('ADBE Position'),opacity=transform.property('ADBE Opacity'),unsupported=transform.property('ADBE Scale'),followers=[new Prop('X Position'),new Prop('Y Position')];
position.dimensionsSeparated=true;position.getSeparationFollower=i=>followers[i];followers.forEach(p=>{p.canSetExpression=true;p.expression='time';});opacity.expression='50';unsupported.canSetExpression=false;unsupported.expression='keep';
Object.defineProperty(position,'expression',{get(){return 'hidden leader';},set(){throw Error('Separated position leader is hidden');},configurable:true});
const transformProperty=transform.property;transform.property=function(n){if(n==='ADBE Anchor Point')return null;return transformProperty.call(this,n);};
H._clearTransformExpressions46(separated);assert.equal(opacity.expression,'');assert(followers.every(p=>p.expression===''));assert.equal(unsupported.expression,'keep');assert.equal(position.expression,'hidden leader');
opacity.expression='failure';Object.defineProperty(opacity,'expression',{get(){return 'failure';},set(){throw Error('EDITABLE_EXPRESSION_FAILURE_46');},configurable:true});assert.throws(()=>H._clearTransformExpressions46(separated),/EDITABLE_EXPRESSION_FAILURE_46/);separated.remove();
blockedWrites=hiddenWrites=remapWrites=0;
const group={id:46,rawText:'سلام عرض میکنم خدمت',text:'سلام عرض میکنم خدمت',start:2,end:8,style:{size:64,fill:'#ffffff',fontPS:'ArialMT',x:50,y:50},bg:{enabled:false},anim:{kinetic40:{entry:'none',pattern:'zigzag',segments:[{from:0,to:1},{from:1,to:2},{from:2,to:3},{from:3,to:4}]}}};
const before=plain(group),out=H._createCaption(c,group,'GHAF_CAP_046');assert.deepEqual(group,before);assert.equal(out.startTime,2);assert.equal(out.inPoint,2);assert.equal(out.outPoint,8);assert.equal(out.source.duration,6);assert.equal(out.timeRemapEnabled,false,'native duration matches cue; no hidden time-remap property is needed');
const pieces=out.source._layers.filter(l=>l.type==='text').reverse();assert.equal(pieces.length,4);assert.deepEqual(plain(pieces.map(l=>l.property('ADBE Text Properties').property('ADBE Text Document').value.text)),['سلام','عرض','میکنم','خدمت']);
const positions=pieces.map(l=>l.property('ADBE Transform Group').property('ADBE Position').value);for(let i=1;i<positions.length;i++)assert(positions[i][1]>positions[i-1][1]);assert(positions[0][0]<positions[1][0]);assert(positions[2][0]<positions[3][0]);
assert.equal(hiddenWrites,0,'empty 3D-only expressions must not be written on 2D text');assert.equal(remapWrites,0,'native caption path must not touch remap expressions');
// Real dispatch + renderer preserves an earlier preview if a later native write fails.
let response=call('updateLivePreview',{compId:c.id,groups:[group],focusViewer:false,seekPreview45:true});assert(response.ok,response.error);assert(c.time>group.start&&c.time<group.end);const previous=c._layers.filter(l=>l.name.startsWith('__VARNA_LIVE_CAP_'));assert.equal(previous.length,1);const itemCount=items.length;
const apply=H._applyTextStyle;H._applyTextStyle=function(){throw Error('NATIVE_STYLE_FAILURE_46');};response=call('updateLivePreview',{compId:c.id,groups:[{...group,id:47}],focusViewer:false});assert.equal(response.ok,false);assert.match(response.error,/NATIVE_STYLE_FAILURE_46/);assert(c._layers.includes(previous[0]));assert.equal(items.length,itemCount);H._applyTextStyle=apply;
response=call('updateLivePreview',{compId:c.id,groups:[{...group,id:47}],focusViewer:false});assert(response.ok,response.error);assert(!c._layers.includes(previous[0]));assert.equal(call('removeLivePreview',{compId:c.id}).ok,true);H._deleteLayers([out]);assert.equal(items.length,1);
const styled=plain(group);styled.id=48;styled.anim.kinetic40.entry='fade';styled.anim.kinetic40.segments[0].background45={mode:'solid',fill:'#123456',padding:12,round:8,motion:'pop',duration:.4,out:'fade'};
const designed=H._createCaption(c,styled,'GHAF_CAP_048'),anchor=designed.source._layers.find(l=>String(l.comment||'').startsWith('VARNA_BG_ANCHOR:')),surface=designed.source._layers.find(l=>l.type==='shape');assert(anchor,'independent native background has a measurement anchor');assert(surface);assert.equal(surface.parent,anchor);assert.equal(anchor.parent.comment,'VARNA_KINETIC40_HANDLE');assert.match(surface.property('ADBE Transform Group').property('ADBE Scale').expression,/qi/);assert.equal(hiddenWrites,0,'background measurement anchor reset also avoids hidden 2D transforms');H._deleteLayers([designed]);assert.equal(items.length,1);
H.probeNative46=function(){const e=new TypeError('null is not an object');e.line=246;throw e;};const diagnostic=call('probeNative46');assert.equal(diagnostic.ok,false);assert.match(diagnostic.error,/HOST_DISPATCH_ERROR: TypeError: null is not an object/);assert.match(diagnostic.error,/method: probeNative46, line: 246/);delete H.probeNative46;
console.log('PASS RC46 native-constraint model: legacy last-key remap failure reproduced; actual production text styling/reset/layout/native preview and independent background without renderer stubs; hidden 2D/null/unsupported/separated transform channels; native cue duration; transactional preview replacement/rollback; method+line error diagnostics. Adobe runtime remains untested.');
