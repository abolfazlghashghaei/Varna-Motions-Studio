/* One background destination, two flat work areas, all original control nodes. */
(function(w){'use strict';
if(!document.documentElement.hasAttribute('data-ui77'))return;
const S=w.GHAFState,M=w.VarnaBackgroundMotion81,B=w.GHAFBridge,$=s=>document.querySelector(s),page=$('#page-bg');
if(!page||!M||!S)return;
const en=()=>document.documentElement.lang==='en',labels=[],all=M.catalog(),savedKey='VARNA_BG_PRESETS81';
function node(tag,cls){const n=document.createElement(tag);if(cls)n.className=cls;return n;}
function label(n,fa,english){labels.push([n,fa,english]);n.textContent=en()?english:fa;return n;}
function button(fa,english,handler,cls='btn secondary'){const n=label(node('button',cls),fa,english);n.type='button';n.onclick=handler;return n;}
const look=node('section','bg-look81'),motion=node('section','bg-motion81'),common=node('section','bg-common81'),tabs=node('div','bg-tabs81');
tabs.setAttribute('role','tablist');const lookTab=button('ظاهر پس‌زمینه','Appearance',()=>choose('look')),motionTab=button('انیمیشن پس‌زمینه','Animation',()=>choose('motion'));
const tabPairs=[['look',lookTab,look],['motion',motionTab,motion]];
for(const [name,button,panel] of tabPairs){
 button.id='background-tab-'+name;panel.id='background-panel-'+name;
 button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);
 panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;
 tabs.append(button);
}
tabs.addEventListener('keydown',event=>{
 const index=tabPairs.findIndex(([,button])=>button===event.target);
 if(index<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 event.preventDefault();
 const next=event.key==='Home'?0:event.key==='End'?tabPairs.length-1:1-index;
 choose(tabPairs[next][0]);tabPairs[next][1].focus();
});
const scope=$('#bgScope')?.closest('label');if(scope)common.append(scope);
const existing=Array.from(page.children);for(const n of existing)look.append(n);
// Keep original controls connected while resolving/moving them by their IDs.
page.append(look);
const card=node('article','card bg-animation-card81'),heading=label(node('h2'),'انیمیشن پس‌زمینه','Background animation'),intro=label(node('p','bg-description81'),'حرکت کادر را جدا طراحی کن. در حالت پیوسته، متن ثابت می‌ماند.','Design the surface independently. Continuous mode keeps text still.');
card.append(heading,intro);motion.append(card);
function field(id){const target=document.getElementById(id),unit=target?.closest('label.control');if(unit)return unit;return null;}
function group(fa,english){const n=node('section','bg-motion-group81');n.append(label(node('h3'),fa,english));card.append(n);return n;}
const gallery=group('طرح‌های حرکت','Motion presets'),filters=node('div','bg-motion-filter81'),select=node('select'),category=node('select');
select.setAttribute('aria-label','Background motion preset');category.setAttribute('aria-label','Motion family filter');
const categories=[['all','همهٔ حرکت‌ها','All motions'],['reveal','بازشدن','Reveal'],['scale','پاپ و اندازه','Pop & scale'],['slide','جابه‌جایی','Slide'],['rotate','چرخش','Rotation'],['elastic','کشسان','Elastic'],['ambient','حرکت آرام','Ambient']];
for(const [value,fa,english]of categories){const o=label(node('option'),fa,english);o.value=value;category.append(o);}
const grid=node('div','bg-motion-grid81'),more=button('نمایش طرح‌های بیشتر','Show more presets',()=>{limit+=12;renderGallery();}),match=button('هماهنگ با موشن متن','Match saved text motion',()=>apply(M.matchText(S.animFor(S.current())).id));
const phaseRow84=node('div','bg-phase84'),in84=button('ورود کادر','Background IN',()=>setPhase84('in')),out84=button('خروج کادر','Background OUT',()=>setPhase84('out')),normal84=button('معمولی · بدون حرکت','Normal · no motion',()=>apply('none'));phaseRow84.setAttribute('role','group');phaseRow84.setAttribute('aria-label','Entrance and exit');phaseRow84.append(in84,out84,normal84);filters.append(category,select,match);gallery.append(phaseRow84,filters,grid,more);
let limit=12,tab='look',updating=false,pending=null,phase84='in',lastAnimated84=null;
const timing=group('ورود و خروج','Entrance & exit'),timingGrid=node('div','form-grid two');timing.append(timingGrid);
for(const id of ['bgMotionDur','bgMotionDelay','bgOutMotion','bgOutDuration']){const n=field(id);if(n)timingGrid.append(n);}
const custom=node('div','form-grid two'),strength=node('input'),loop=node('input');strength.type='number';strength.min='.1';strength.max='3';strength.step='.05';strength.value='1';strength.setAttribute('aria-label','Motion strength');loop.type='checkbox';
const strengthLabel=node('label','control');strengthLabel.append(label(node('span'),'شدت حرکت','Motion strength'),strength);const loopLabel=node('label','switch-row');loopLabel.append(loop,node('span','switch'),label(node('span'),'حرکت آرام هنگام نمایش','Ambient movement while visible'));custom.append(strengthLabel,loopLabel);timing.append(custom);
const mode84=node('select');mode84.setAttribute('aria-label','Background motion mode');for(const [value,fa,english]of [['normal','معمولی · هر کپشن جدا','Normal · separate captions'],['continuous','پیوسته · فقط بک‌گراند','Continuous · background only'],['static','ثابت · بدون حرکت','Static · no motion']]){const o=label(node('option'),fa,english);o.value=value;mode84.append(o);}timing.prepend(mode84);
const continuous=group('تغییر اندازه بین متن‌ها','Resize between captions'),reflow=$('.reflow-panel67');
if(reflow){
 // Gather actual control nodes, including units regrouped by older adapters.
 const flag=$('#bgMotionReflow67')?.closest('label'),resize=node('div','form-grid two');
 for(const id of ['bgMotionReflowDuration67','bgMotionReflowCurve67','bgMotionReflowGap67']){const n=field(id);if(n)resize.append(n);}
 const canvas=$('#bgReflowCanvas67'),reference=canvas?.closest('.reflow-reference67')||node('div','reflow-reference67'),sample=$('#bgMotionSample67')?.closest('label');
 if(canvas)reference.append(canvas);if(sample)reference.append(sample);if(flag)reflow.prepend(flag);
 reflow.append(resize,reference,$('#bgMotionReflowStatus67'));continuous.append(reflow);
}
continuous.append(label(node('p','bg-description81'),'شیپ در اولین متن از صفر باز می‌شود، بین متن‌ها تغییر اندازه می‌دهد و در پایان آخرین متن به صفر می‌رسد. خاموش‌کردن این حالت، موشن قبلی متن را برمی‌گرداند.','The surface opens from zero at the first caption, resizes between captions and closes to zero at the last. Switching off restores saved text motion.'));
const advanced=node('details','bg-advanced81');advanced.append(label(node('summary'),'طرح شخصی و حرکت‌های قبلی','Custom presets & legacy motion'));
const legacy=node('div','form-grid two');for(const id of ['bgMotion','bgMotionSpeed','bgMotionIndependent']){const n=field(id);if(n)legacy.append(n);}advanced.append(legacy);
const savedName=node('input'),savedSelect=node('select');savedName.type='text';savedName.maxLength=60;savedName.setAttribute('aria-label','Custom preset name');savedSelect.setAttribute('aria-label','Saved custom preset');
const saveRow=node('div','bg-motion-save81');saveRow.append(savedName,button('ذخیرهٔ طرح','Save preset',save),savedSelect,button('اعمال طرح ذخیره‌شده','Apply saved preset',applySaved),button('حذف طرح ذخیره‌شده','Delete saved preset',deleteSaved));advanced.append(saveRow);card.append(advanced);
page.append(common,tabs,look,motion);page.dataset.bgWorkspace81='true';
// Original IDs and their owners stay in the DOM; empty layout shells no longer
// reserve rows after the real timing controls move to the Animation workspace.
for(const n of look.querySelectorAll('.form-grid'))if(!n.children.length)n.hidden=true;
function current(){return $('#bgScope').value==='selected'&&S.current()?S.bgFor(S.current()):S.settings.bg;}
function choose(value){tab=value==='motion'?'motion':'look';look.hidden=tab!=='look';motion.hidden=tab!=='motion';for(const [name,button] of tabPairs){button.setAttribute('aria-selected',String(tab===name));button.tabIndex=tab===name?0:-1;}try{localStorage.setItem('VARNA_BG_TAB81',tab);}catch(_){}document.dispatchEvent(new CustomEvent('varna:workspacepage67'));if(tab==='motion')w.VarnaReflowUI67?.animate();}
function renderGallery(){
 const value=category.value||'all',rank={soft:0,quick:1,cinema:2,bold:3,spring:4,precise:5},items=all.filter(p=>value==='all'||p.category===value).sort((a,b)=>rank[a.id.split(':')[1]]-rank[b.id.split(':')[1]]),selected=phase84==='out'?current().motion81?.outPreset:current().motion81?.preset;
 select.replaceChildren();const empty=node('option');empty.textContent=en()?'Choose a motion preset':'یک طرح حرکت انتخاب کن';empty.value='';select.append(empty);
 for(const p of items){const o=node('option');o.value=p.id;o.textContent=en()?p.en:p.fa;select.append(o);}select.value=selected||'';normal84.setAttribute('aria-pressed',String(selected==='none'));
 grid.replaceChildren();for(const p of items.slice(0,limit)){
  const b=node('button','bg-motion-preset81');b.type='button';b.dataset.bgPreset81=p.id;b.setAttribute('aria-pressed',String(p.id===selected));
  const icon=node('canvas','bg-thumb84');icon.width=240;icon.height=112;icon.setAttribute('aria-hidden','true');w.VarnaPreviewClock84.add(icon,time=>drawThumb84(icon,p,time));
  const text=node('span');text.textContent=en()?p.en:p.fa;b.append(icon,text);b.onclick=()=>apply(p.id);grid.append(b);
 }more.hidden=items.length<=limit;
}
function drawThumb84(canvas,preset,time){const ctx=canvas.getContext('2d'),bg=M.applyPreset({enabled:true},preset.id);if(phase84==='out'){bg.motion81.outPreset=preset.id;bg.motion81.preset='none';bg.outDur=preset.inDur;}const cfg=M.resolve(bg),sample=M.sample(cfg,time,0,3.6,160,44,false);ctx.clearRect(0,0,240,112);ctx.fillStyle='#102031';ctx.fillRect(0,0,240,112);ctx.save();ctx.translate(120+sample.x,56+sample.y);ctx.rotate(sample.rotation*Math.PI/180);ctx.scale(sample.scaleX/100,sample.scaleY/100);ctx.globalAlpha=sample.opacity/100;ctx.fillStyle='rgba(74,163,212,.5)';ctx.fillRect(-80,-22,160,44);ctx.strokeStyle='#8edbff';ctx.strokeRect(-80,-22,160,44);ctx.restore();ctx.fillStyle='#cedceb';ctx.font='13px sans-serif';ctx.textAlign='center';ctx.fillText(en()?'Text stays still':'متن ثابت می‌ماند',120,61);}
function setPhase84(value){phase84=value==='out'?'out':'in';in84.setAttribute('aria-pressed',String(phase84==='in'));out84.setAttribute('aria-pressed',String(phase84==='out'));renderGallery();}
function sync(bg){bg=bg||current();mode84.value=bg.reflow67?.enabled?'continuous':bg.motion81?.preset==='none'?'static':'normal';$('#bgMotion').dataset.native81=String(!!bg.motion81);const cfg=M.resolve(bg);strength.value=cfg.strength;loop.checked=cfg.loop;loop.disabled=!bg.motion81;renderGallery();}
async function update(){
 pending=$('#bgScope').value;if(updating)return;updating=true;
 try{while(pending){const scope=pending;pending=null;if(B.available)await w.VarnaAppearance.updateOutput(scope,'bgMotionReflowStatus67');}}
 catch(e){$('#bgMotionReflowStatus67').textContent=e.message;}finally{updating=false;}
}
function commit(bg){S.setBg($('#bgScope').value,bg);w.VarnaActions.refresh();sync(bg);w.VarnaReflowUI67?.animate();update();}
function apply(id){try{let bg;if(phase84==='out'){bg=JSON.parse(JSON.stringify(current()));if(!bg.motion81)bg=M.applyPreset(bg,'none');bg.motion81.outPreset=id;bg.outDur=M.find(id).inDur;}else{const previous=current().motion81?.outPreset;bg=M.applyPreset(current(),id);if(previous)bg.motion81.outPreset=previous;}commit(bg);}catch(e){$('#bgMotionReflowStatus67').textContent=e.message;}}
mode84.onchange=()=>{const selectedMode84=mode84.value,flag=$('#bgMotionReflow67');flag.checked=selectedMode84==='continuous';flag.dispatchEvent(new Event('change',{bubbles:true}));if(selectedMode84==='static'){const old=current();lastAnimated84={motion81:old.motion81,outPreset:old.outPreset,motionDur:old.motionDur,outDur:old.outDur,motionDelay:old.motionDelay};const bg=M.applyPreset(current(),'none');bg.motion81.outPreset='none';bg.outPreset='none';commit(bg);}else if(selectedMode84==='normal'&&current().motion81?.preset==='none'){const bg=JSON.parse(JSON.stringify(current()));Object.assign(bg,lastAnimated84||M.applyPreset(bg,'expand-x:soft'));commit(bg);}else sync();};
select.onchange=()=>{if(select.value)apply(select.value);};category.onchange=()=>{limit=12;renderGallery();};
for(const control of [strength,loop])control.onchange=()=>{const bg=JSON.parse(JSON.stringify(current()));if(!bg.motion81)Object.assign(bg,M.applyPreset(bg,'expand-x:soft'));bg.motion81.strength=Math.max(.1,Math.min(3,+strength.value||1));bg.motion81.loop=loop.checked;commit(bg);};
// A deliberate selection in the old picker opts out of the new native preset.
$('#bgMotion').addEventListener('change',()=>{$('#bgMotion').dataset.native81='false';},true);
function saved(){try{const list=JSON.parse(localStorage.getItem(savedKey)||'[]');return Array.isArray(list)?list.filter(x=>x&&typeof x.name==='string'&&M.find(x.bg?.motion81?.preset)).slice(-500):[];}catch(_){return [];}}
function savedChoices(){savedSelect.replaceChildren();for(const [i,p]of saved().entries()){const o=node('option');o.value=i;o.textContent=p.name;savedSelect.append(o);}}
function save(){const name=savedName.value.trim(),bg=current();if(!name||!bg.motion81){$('#bgMotionReflowStatus67').textContent=en()?'Choose a motion and enter a name first.':'اول طرح حرکت و نام آن را انتخاب کن.';return;}try{const list=saved().filter(p=>p.name!==name);list.push({name,bg:JSON.parse(JSON.stringify(bg))});localStorage.setItem(savedKey,JSON.stringify(list.slice(-500)));savedChoices();}catch(e){$('#bgMotionReflowStatus67').textContent=e.message;}}
function applySaved(){const p=saved()[+savedSelect.value];if(p)commit(p.bg);}
function deleteSaved(){const list=saved();if(!list[+savedSelect.value])return;list.splice(+savedSelect.value,1);try{localStorage.setItem(savedKey,JSON.stringify(list));savedChoices();}catch(e){$('#bgMotionReflowStatus67').textContent=e.message;}}
const reveal=w.VarnaUI.reveal;w.VarnaUI.reveal=function(n){if(n&&page.contains(n)){if(motion.contains(n))choose('motion');else if(look.contains(n))choose('look');}return reveal(n);};
document.addEventListener('varna:bg67',e=>sync(e.detail));
document.addEventListener('varna:language52',()=>{for(const [n,fa,english]of labels)n.textContent=en()?english:fa;renderGallery();});
document.addEventListener('varna:page',()=>{if(w.VarnaUI.current()==='bg')sync();});
let initial='look';try{initial=localStorage.getItem('VARNA_BG_TAB81')||'look';}catch(_){}choose(initial);setPhase84('in');sync();savedChoices();
w.VarnaBackgroundWorkspace81={choose,apply,sync,current,tab:()=>tab};
})(window);
