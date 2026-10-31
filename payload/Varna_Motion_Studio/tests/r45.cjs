/* Geometry/effect and bridge behavior under modelled host APIs; not Adobe rendering. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),host=fs.readFileSync(root+'/host/ghaf_host.jsx','utf8').replace(/^#.*$/mg,'');
const c={console,Math,JSON,Number,isFinite};vm.createContext(c);vm.runInContext(host,c);const H=c.GHAFHost;
const plain=x=>JSON.parse(JSON.stringify(x));
function points(o={},own=true,angle=0,xy=[]){
 const p=H._paintRampPoints(0,angle,0,...(xy.length?xy:[null,null,null,null]),o,own);
 const rect=()=>({left:-100,top:-20,width:200,height:40});
 return ['start','end'].map(k=>plain(vm.runInNewContext(p[k],{Math,time:0,sourceRectAtTime:rect,thisLayer:{parent:{sourceRectAtTime:rect}}})));
}

assert.deepEqual(points(),[[-100,0],[100,0]]);assert.deepEqual(points({start:25,end:75}),[[-50,0],[50,0]]);assert.deepEqual(points({scale:200}),[[-200,0],[200,0]]);assert.deepEqual(points({type:'radial'}),[[0,0],[100,0]]);assert.deepEqual(points({},false,0,[.2,.5,.8,.5]),[[-60,0],[60,0]]);
for(const o of [{scale:NaN,start:Infinity,end:-4},{start:100,end:0},{type:'radial',scale:400}])for(const pt of points(o))assert(pt.every(Number.isFinite));
function effectsLayer(){const fx={list:[],get numProperties(){return this.list.length},property(i){return this.list[i-1]},addProperty(type){const effect={matchName:type,name:'',values:{},property(i){return this.values[i]||(this.values[i]={setValue(x){this.value=x;}})},moveTo(i){this.moved=i;},remove(){fx.list.splice(fx.list.indexOf(this),1);}};this.list.push(effect);return effect;}};return {fx,property(){return fx;}};}
const text=effectsLayer();H._applyTextGradient(text,{fillMode:'gradient',fill:'#112233',fill2:'#AABBCC',fillAngle:0,fillGradient:{type:'radial',reverse:true,dither:false}});let e=text.fx.list[0];assert.equal(e.matchName,'ADBE Ramp');assert.equal(e.values[5].value,2);assert.equal(e.values[6].value,0);assert.equal(e.moved,1);assert.deepEqual(plain(e.values[2].value),[170/255,187/255,204/255]);
H._applyTextGradient(text,{fillMode:'solid'});assert.equal(text.fx.list.length,0);
H._applyTextGlow(text,{glowEnabled:true,glowRadius:0,glowIntensity:0,glowColor:'#0000ff'});e=text.fx.list[0];assert.equal(e.values[1].value,2);assert.equal(e.values[3].value,0);assert.equal(e.values[4].value,0);H._applyTextGlow(text,{glowEnabled:false});assert.equal(text.fx.list.length,0);
const surface=effectsLayer(),rim=effectsLayer();H._addGlassRamp(surface,'#FF0000','#0000FF',10,0,0,null,null,null,null,{type:'linear'});H._addGlassRamp(rim,'#00FF00','#FFFFFF',10,90,0,null,null,null,null,{type:'radial',reverse:true});assert.equal(surface.fx.list[0].values[5].value,1);assert.equal(rim.fx.list[0].values[5].value,2);assert.deepEqual(plain(surface.fx.list[0].values[2].value),[1,0,0]);assert.deepEqual(plain(rim.fx.list[0].values[2].value),[1,1,1]);
console.log('PASS 4.5 host model: independent native gradient channels, angle/scale/stops/radial geometry, malformed-number bounds, reverse/dither, removal, glow alpha and zero intensity/radius.');
(async()=>{
 const callbacks=[],timers=new Map();let timerId=0;
 const context={window:{location:{pathname:'/index.html'},__adobe_cep__:{evalScript(s,cb){callbacks.push({s,cb});}}},JSON,Number,Promise,Error,encodeURIComponent,decodeURIComponent,setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}};vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/js/cep-bridge.js','utf8'),context);const B=context.window.GHAFBridge;
 const pending=B.peekTime();assert.equal(callbacks.length,1);assert.equal(await B.peekTime(),null);const expire=[...timers.values()][0];expire();assert.equal(await pending,null);assert.equal(B.blocked,false);assert.equal(await B.peekTime(),null);assert.equal(callbacks.length,1);
 callbacks[0].cb('{"ok":true,"data":{"compId":1,"time":2}}');const next=B.peekTime();assert.equal(callbacks.length,2);callbacks[1].cb('{"ok":true,"data":{"compId":1,"time":3}}');assert.equal((await next).time,3);
 const edit=B.call('ping');await Promise.resolve();assert.equal(await B.peekTime(),null);assert.equal(callbacks.length,3);callbacks[2].cb('{"ok":true,"data":{"host":"fixture"}}');assert.equal((await edit).host,'fixture');
 const bad=B.peekTime();callbacks[3].cb('EvalScript error.');assert.equal(await bad,null);assert.equal(B.blocked,false);
 console.log('PASS 4.5 bridge: one outstanding read, soft timeout without blocking writes, no poll pile-up, late response recovery, queued-action priority, invalid read ignored.');
})().catch(e=>{console.error(e);process.exitCode=1;});
