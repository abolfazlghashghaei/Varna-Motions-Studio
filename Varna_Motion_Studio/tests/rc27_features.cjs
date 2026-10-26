const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const host={app:{effects:[],version:'fixture'},File:function(p){this.fsName=p;}};vm.createContext(host);vm.runInContext(fs.readFileSync(__dirname+'/../host/ghaf_host.jsx','utf8'),host);
const props={};for(const key of ['ADBE Opacity','ADBE Scale','ADBE Position'])props[key]={numKeys:0,expression:'old',setValue(v){this.value=v;}};
const shape={parent:{inPoint:0,outPoint:5},property(){return {numProperties:0,property(k){return props[k];}};}};
host.GHAFHost._backgroundMotion27(shape,{motion:'fade',motionDur:1,outPreset:'fade',outDur:1,independentMotion:true});
function opacity(t){return vm.runInNewContext(props['ADBE Opacity'].expression,{parent:shape.parent,time:t,value:100,ease:(t,a,b,x,y)=>x+(y-x)*Math.max(0,Math.min(1,(t-a)/(b-a))),Math});}
assert.equal(opacity(-1),0);assert.equal(opacity(.5),50);assert.equal(opacity(2),100);assert.equal(opacity(4.5),50);assert.equal(opacity(5),0);
let expression;const vec={addProperty(){return {property(){return {set expression(v){expression=v;}};}};}};
host.GHAFHost._continuousShape(vec,0,10000,'circular');const path=vm.runInNewContext(expression,{thisLayer:{parent:{sourceRectAtTime(){return {left:0,top:0,width:200,height:40};}}},time:0,Math,createPath:(points,ins,outs,closed)=>({points,ins,outs,closed})});
assert.equal(path.points[0][0],20);assert.equal(path.points[2][1],20);assert(path.closed);assert(Math.abs(path.outs[1][0]-20*.5522847498307936)<1e-9);
const context={window:{},localStorage:{getItem(){return null;}}};context.window.window=context.window;vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../js/brand-assets27.js','utf8'),context);
assert.throws(()=>context.window.VarnaBrandFiles.validateBrand({version:1,name:'x',appearance:{},assets:[{id:'a',name:'bad',path:'/a',role:'unknown',placement:'timeline'}]}));
const valid=context.window.VarnaBrandFiles.validateBrand({version:1,name:'Test',appearance:{},assets:[{id:'a',name:'logo',path:'/a',role:'logo',placement:'timeline'}]});assert.equal(valid.assets[0].role,'logo');
console.log('PASS RC27: independent background entry/exit timing, capsule radius and circular tangents, brand asset validation');
