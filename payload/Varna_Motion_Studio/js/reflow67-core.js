/* ES3 shared geometry: native preview and export evaluate the same transition. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaReflow67=api;return api;})(typeof window!=='undefined'?window:this,function factoryReflow67(){
function num(v,d,a,b){v=Number(v);return Math.max(a,Math.min(b,isFinite(v)?v:d));}
function config(v){v=v||{};return {enabled:v.enabled===true,duration:num(v.duration,.32,.03,2),gap:num(v.gap,.15,0,2),curve:/^(smooth|spring|linear)$/.test(v.curve)?v.curve:'spring'};}
function progress(u,curve){u=Math.max(0,Math.min(1,u));if(curve==='linear')return u;if(curve==='spring')return u>=1?1:1-Math.exp(-8*u)*Math.cos(10*u);return u*u*(3-2*u);}
function runs(entries){var list=entries.slice(0),out=[],run=null,i;list.sort(function(a,b){return a.start-b.start||a.order-b.order;});for(i=0;i<list.length;i++){
 var e=list[i],cfg=config(e.config);if(!(e.end>e.start)||e.bounds.length!==4)throw Error('INVALID_REFLOW_BOUNDS');for(var k=0;k<4;k++)if(!isFinite(Number(e.bounds[k])))throw Error('INVALID_REFLOW_BOUNDS');if(e.bounds[0]<=0||e.bounds[1]<=0)throw Error('INVALID_REFLOW_BOUNDS');
 if(!run||run.signature!==e.signature||e.start<run.end-.0001||e.start-run.end>cfg.gap){run={signature:e.signature,config:cfg,start:e.start,end:e.end,points:[]};out.push(run);}run.end=e.end;run.points.push({time:e.start,end:e.end,bounds:e.bounds.slice(0),id:e.id,config:cfg});
 }return out;}
function at(run,time){var points=run.points;if(!points.length)throw Error('EMPTY_REFLOW');var lo=0,hi=points.length-1,index=0;while(lo<=hi){var mid=Math.floor((lo+hi)/2);if(points[mid].time<=time){index=mid;lo=mid+1;}else hi=mid-1;}
 var point=points[index],target=point.bounds;if(index===0)return target.slice(0);var duration=Math.min((point.config||run.config).duration,(point.end-point.time)*.45),u=progress((time-point.time)/Math.max(.001,duration),(point.config||run.config).curve),from=points[index-1].bounds,result=[];for(var i=0;i<4;i++)result.push(from[i]+(target[i]-from[i])*u);result[0]=Math.max(2,result[0]);result[1]=Math.max(2,result[1]);return result;
}
function expression(run,stringify){return '('+factoryReflow67.toString()+')().at('+stringify({config:run.config,points:run.points})+',time)';}
return {config:config,progress:progress,runs:runs,at:at,expression:expression};
});
