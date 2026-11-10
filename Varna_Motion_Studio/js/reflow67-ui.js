/* Shared caption backgrounds use measured native bounds. This canvas is a motion reference. */
(function(w){'use strict';const S=w.GHAFState,B=w.GHAFBridge,C=w.VarnaReflow67,$=id=>document.getElementById(id);
const panel=document.createElement('section');panel.className='control reflow-panel67';panel.innerHTML='<label class="switch-row"><input id="bgMotionReflow67" type="checkbox"><span class="switch"></span><span>سطح پیوسته بین کپشن‌ها</span></label><div class="form-grid three"><label class="control"><span>مدت تغییر اندازه · ثانیه</span><input id="bgMotionReflowDuration67" type="number" min=".03" max="2" step=".01" value=".32"></label><label class="control"><span>منحنی تغییر اندازه</span><select id="bgMotionReflowCurve67"><option value="spring">کشسان</option><option value="smooth">نرم</option><option value="linear">خطی</option></select></label><label class="control"><span>فاصلهٔ قابل اتصال · ثانیه</span><input id="bgMotionReflowGap67" type="number" min="0" max="2" step=".05" value=".15"></label></div><div class="reflow-reference67"><canvas id="bgReflowCanvas67" width="560" height="160" aria-label="نمونهٔ حرکت سطح پیوسته"></canvas><label class="switch-row"><input id="bgMotionSample67" type="checkbox" checked><span class="switch"></span><span>انیمیشن نمونه</span></label></div><output id="bgMotionReflowStatus67" role="status"></output>';
$('bgMotion').closest('.form-grid').after(panel);
function current(){return $('bgScope').value==='selected'&&S.current()?S.bgFor(S.current()):S.settings.bg;}
function sync(bg){const c=C.config((bg||current()).reflow67);$('bgMotionReflow67').checked=c.enabled;$('bgMotionReflowDuration67').value=c.duration;$('bgMotionReflowCurve67').value=c.curve;$('bgMotionReflowGap67').value=c.gap;for(const id of ['bgMotionReflowDuration67','bgMotionReflowCurve67','bgMotionReflowGap67'])$(id).disabled=!c.enabled;}
function read(){return C.config({enabled:$('bgMotionReflow67').checked,duration:+$('bgMotionReflowDuration67').value,curve:$('bgMotionReflowCurve67').value,gap:+$('bgMotionReflowGap67').value});}
let updating=false;const pendingScopes=new Set();
async function apply(){
 let scope;
 try{
  const config=read();scope=$('bgScope').value;
  const targets=scope==='selected'?[S.current()].filter(Boolean):S.groups;
  if(config.enabled&&targets.some(g=>{const a=S.animFor(g);return a.kinetic40&&a.kinetic40.enabled!==false||a.template38||a.smartTemplate;}))throw Error('برای صحنه یا قالب، بک‌گراند هر عبارت را تنظیم کن؛ سطح پیوسته برای کپشن بومی است.');
  const bg=JSON.parse(JSON.stringify(current()));bg.reflow67=config;
  if(config.enabled){bg.enabled=true;bg.engine='native';bg.followTyping=false;}
  S.setBg(scope,bg);w.VarnaActions.refresh();sync(bg);
  $('bgMotionReflowStatus67').textContent=config.enabled?'عرض سطح با اندازهٔ متن تغییر می‌کند؛ گردی با Scale تغییر نمی‌کند.':'سطح مستقل هر کپشن فعال است.';
 }catch(e){$('bgMotionReflowStatus67').textContent=e.message;sync();return;}
 pendingScopes.add(scope);if(updating)return;updating=true;
 try{
  while(pendingScopes.size){const next=pendingScopes.has('all')?'all':'selected';pendingScopes.clear();await w.VarnaAppearance.updateOutput(next,'bgMotionReflowStatus67');}
 }finally{updating=false;}
}

for(const id of ['bgMotionReflow67','bgMotionReflowDuration67','bgMotionReflowCurve67','bgMotionReflowGap67'])$(id).addEventListener('change',apply);
document.addEventListener('varna:bg67',e=>sync(e.detail));
// Every style refresh includes the full panel graph so a selected edit can rebuild its shared run.
const call=B.call.bind(B);B.call=function(method,payload,options){if(method==='refreshCaptionStyles'&&S.groups.length)payload=Object.assign({},payload,{allGroups67:S.exportGroups()});return call(method,payload,options);};
const canvas=$('bgReflowCanvas67'),ctx=canvas.getContext('2d'),reduced=w.matchMedia('(prefers-reduced-motion: reduce)');let raf=null,start=0;
function paint(now){raf=null;if(document.hidden||!canvas.getClientRects().length||!$('page-bg').classList.contains('active'))return;const cfg=read(),phase=((now-start)/1000)%4,run={config:cfg,points:[{time:0,end:1.8,bounds:[390,64,280,75]},{time:1.8,end:4,bounds:[190,64,280,75]}]},size=C.at(run,phase);ctx.clearRect(0,0,560,160);const grad=ctx.createLinearGradient(0,0,560,160);grad.addColorStop(0,current().hex||'#FFFFFF');grad.addColorStop(1,current().gradientColor2||'#A2DDF7');const x=size[2]-size[0]/2,y=size[3]-size[1]/2,r=Math.min(24,size[1]/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+size[0],y,x+size[0],y+size[1],r);ctx.arcTo(x+size[0],y+size[1],x,y+size[1],r);ctx.arcTo(x,y+size[1],x,y,r);ctx.arcTo(x,y,x+size[0],y,r);ctx.closePath();ctx.globalAlpha=.7;ctx.fillStyle=grad;ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#12283E';ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText(phase<1.8?'Ten words in one surface':'Five words',280,83);if($('bgMotionSample67').checked&&!reduced.matches)raf=w.requestAnimationFrame(paint);}
function animate(){if(raf)w.cancelAnimationFrame(raf);start=performance.now();raf=w.requestAnimationFrame(paint);}
$('bgMotionSample67').onchange=animate;document.addEventListener('varna:page',animate);document.addEventListener('varna:workspacepage67',animate);document.addEventListener('visibilitychange',animate);document.addEventListener('varna:bg67',animate);reduced.addEventListener('change',animate);w.addEventListener('unload',()=>{if(raf)w.cancelAnimationFrame(raf);});
// Explicit AE frame reference; no CSS swatch is advertised as native glass pixels.
const frame=document.createElement('div');frame.className='control material-frame67';frame.innerHTML='<button type="button" class="btn secondary" id="materialFrame67">فریم واقعی افتر</button><img id="materialFrameImage67" alt="فریم واقعی کامپوزیشن افتر" hidden><output id="materialFrameStatus67" role="status"></output>';document.querySelector('.bg-style-browser').append(frame);let folder=null,frameBusy=false;
$('materialFrame67').onclick=async()=>{if(frameBusy)return;frameBusy=true;$('materialFrame67').disabled=true;try{await w.VarnaActions.previewCurrent();const t=await B.call('getTimelineInfo',{});if(!t.compId)throw Error('کامپوزیشن فعال پیدا نشد.');if(!folder)folder=w.GHAFNode.makeMotionTemp();const r=await B.call('renderTableFrame50',{compId:t.compId,time:t.time,folder,mode:'full'},{timeout:180000});$('materialFrameImage67').src=await w.GHAFNode.waitFrame(r.path,()=>false);$('materialFrameImage67').hidden=false;$('materialFrameStatus67').textContent='فریم افتر · '+Number(t.time).toFixed(2)+' ثانیه';}catch(e){$('materialFrameStatus67').textContent=e.message;}finally{frameBusy=false;$('materialFrame67').disabled=false;}};w.addEventListener('unload',()=>{if(folder)w.GHAFNode.cleanMotionTemp(folder);});
sync();w.VarnaReflowUI67={sync,read,apply};
})(window);
