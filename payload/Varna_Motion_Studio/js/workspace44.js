/* Display preferences and explicit feature controls; RC45 compact sizes. */
(function(w){'use strict';
const S=w.GHAFState,$=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));
const storage='varna.workspace44',sizes=['auto','tiny','compact','standard','large','xlarge'];
let saved={size:'auto'},lastEnabled,resizeFrame=0;
try{const value=JSON.parse(localStorage.getItem(storage)||'null');if(value&&sizes.includes(value.size))saved.size=value.size;}catch(e){}
const icons=w.VarnaIcons30||{},svg=path=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';
const special={highlighter44:svg('m9 3 12 12-6 6L3 9zM6 12l6-6M2 22h8m0-5-4 4H2v-4l4-4'),layout44:svg('M3 3h18v18H3zM3 9h18M9 9v12'),kinetic44:svg('M4 6h12M10 6v13M6 19h8m4-13 3 3-3 3m0 3 3 3-3 3')};
Object.assign(icons,special);
const pageIcons={kinetic:'kinetic44',keywords:'highlighter44',templates:'layout44',music:'music-2'};
function icon(name){return icons[name]||icons.layers||'';}
for(const [page,name]of Object.entries(pageIcons)){
 const nav=$('.nav-item[data-page="'+page+'"] .nav-icon');if(nav)nav.innerHTML=icon(name);
 const title=$('#page-'+page+' .page-head h1');if(title){const el=document.createElement('span');el.className='page-icon44';el.innerHTML=icon(name);title.prepend(el);}
}
// Later launcher cards are created after the original icon pass.
for(const tile of all('.launcher-tile')){
 const title=tile.querySelector('strong')?.textContent||'';
 const page=tile.dataset.launch||(title.includes('تایپوگرافی')?'kinetic':title.includes('کلمات مهم')?'keywords':title.includes('موگرت')?'templates':null);
 if(pageIcons[page]){let mark=tile.querySelector('.launcher-icon');if(!mark){mark=document.createElement('span');mark.className='launcher-icon';tile.prepend(mark);}mark.setAttribute('aria-hidden','true');mark.innerHTML=icon(pageIcons[page]);}
}
document.addEventListener('varna:page',e=>{if(pageIcons[e.detail.name]){const location=$('.studio30-location');if(location)location.innerHTML=icon(pageIcons[e.detail.name]);}});
const gear=$('#headerOptions'),panel=gear.querySelector('.header-options-panel'),display=document.createElement('div');display.className='display-settings44';
display.innerHTML='<label class="control"><span>اندازهٔ رابط کاربری</span><select id="uiSize44"><option value="auto">خودکار · متناسب با فضای پنل</option><option value="tiny">بسیار کوچک · پنل کم‌عرض</option><option value="compact">کوچک · فشرده</option><option value="standard">متوسط · استاندارد</option><option value="large">بزرگ · خواناتر</option><option value="xlarge">خیلی بزرگ · نمایشگر با تراکم بالا</option></select></label><label class="control"><span>فاصلهٔ کنترل‌ها</span><select id="uiSpacing44"><option value="compact">فشرده</option><option value="comfortable">راحت</option></select></label><p class="hint" id="uiSizeStatus44" role="status"></p><button type="button" class="btn secondary" id="uiReset44">بازگشت به نمایش خودکار</button>';
panel.prepend(display);const previewStatus=document.createElement('p');previewStatus.id='previewStatus45';previewStatus.className='hint';previewStatus.setAttribute('role','status');previewStatus.textContent='پیش‌نمایش: با دکمهٔ بالای پنل، کپشن فعلی را در افتر ببین.';panel.append(previewStatus);document.addEventListener('varna:preview-status',e=>{previewStatus.textContent=e.detail.error?'خطای پیش‌نمایش: '+e.detail.error:'پیش‌نمایش کپشن فعلی آماده است.'+(e.detail.note?' '+e.detail.note:'');previewStatus.classList.toggle('preview-error45',!!e.detail.error);const local=$({kinetic:'#sceneStatus40',templates:'#templateStatus38'}[w.VarnaUI.current()]||'#previewStatus45');if(local)local.textContent=previewStatus.textContent;});
const labels={tiny:'بسیار کوچک',compact:'کوچک',standard:'متوسط',large:'بزرگ',xlarge:'خیلی بزرگ'};
function size(value,persist){
 saved.size=sizes.includes(value)?value:'auto';
 // Viewport pixels already account for the OS display scaling. Product pixels stay unchanged.
 const actual=saved.size==='auto'?(w.innerWidth<350?'tiny':w.innerWidth<1100||w.innerHeight<650?'compact':w.innerWidth>=1800&&w.innerHeight>=950?'large':'standard'):saved.size;
 document.body.dataset.uiSize44=actual;$('#uiSize44').value=saved.size;
 $('#uiSizeStatus44').textContent=(saved.size==='auto'?'خودکار: ':'اندازه: ')+labels[actual]+' · '+w.innerWidth+' × '+w.innerHeight+' — فقط نمایش پنل';
 if(persist)try{localStorage.setItem(storage,JSON.stringify(saved));}catch(e){}
}
$('#uiSize44').onchange=()=>size($('#uiSize44').value,true);
$('#uiSpacing44').onchange=()=>{w.VarnaStudio30.density($('#uiSpacing44').value);};
$('#uiReset44').onclick=()=>{size('auto',true);w.VarnaStudio30.density('compact');$('#uiSpacing44').value='compact';};
w.addEventListener('resize',()=>{w.cancelAnimationFrame(resizeFrame);resizeFrame=w.requestAnimationFrame(()=>size(saved.size,false));});
// Keep the popover inside even a narrow/floating CEP panel; it scrolls on short monitors.
function place(){if(!gear.open)return;const box=gear.querySelector('summary').getBoundingClientRect(),gap=8,width=Math.min(310,w.innerWidth-16),height=Math.max(80,w.innerHeight-box.bottom-16);panel.style.left=Math.max(gap,Math.min(box.right-width,w.innerWidth-width-gap))+'px';panel.style.top=(box.bottom+gap)+'px';panel.style.width=width+'px';panel.style.maxHeight=height+'px';}
gear.addEventListener('toggle',place);w.addEventListener('resize',place);
document.addEventListener('pointerdown',e=>{if(gear.open&&!gear.contains(e.target))gear.open=false;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&gear.open){gear.open=false;gear.querySelector('summary').focus();e.preventDefault();e.stopImmediatePropagation();}},true);

const card=$('#captionHighlight37'),master=document.createElement('div');master.className='feature-master44';
master.innerHTML='<label class="switch-row"><input type="checkbox" id="keywordsEnabled44" role="switch" aria-controls="keywordControls44"/><span class="switch"></span><span>کلمات مهم فعال باشد</span></label><span class="feature-status44" id="keywordState44" role="status"></span>';
const controls=document.createElement('fieldset');controls.id='keywordControls44';controls.className='feature-controls44';controls.setAttribute('aria-label','تنظیمات کلمات مهم');
for(const child of Array.from(card.children))if(!child.classList.contains('card-title'))controls.append(child);
card.append(master,controls);
const note=document.createElement('p');note.id='keywordNote44';note.className='hint';note.textContent='خاموش: پیشنهادها و تأکید واژه‌های انتخابی در پیش‌نمایش و خروجی بعدی متوقف‌اند. انتخاب‌های قبلی محفوظ‌اند. برای تغییر لایه‌های موجود، «به‌روزرسانی ظاهر خروجی» را بزن.';card.append(note);
const update=document.createElement('button');update.id='keywordUpdate44';update.type='button';update.className='btn secondary';update.textContent='به‌روزرسانی ظاهر خروجی موجود';card.append(update);
const updateStatus=document.createElement('p');updateStatus.id='keywordUpdateStatus44';updateStatus.className='hint';updateStatus.setAttribute('role','status');card.append(updateStatus);
update.onclick=async()=>{if(w.GHAFBridge.outputBusy){updateStatus.textContent='پس از پایان ساخت خروجی دوباره اجرا کن.';return;}if(!S.groups.length){updateStatus.textContent='ابتدا کپشن وارد کن.';return;}update.disabled=true;try{const result=await w.GHAFBridge.call('refreshCaptionStyles',{groups:S.exportGroups(),updateMotion:true},{timeout:180000});updateStatus.textContent=result.updated?'ظاهر '+result.updated+' کپشن موجود به‌روز شد.':'خروجی قبلی در کامپ فعال پیدا نشد؛ خروجی بعدی از این تنظیم استفاده می‌کند.';}catch(e){updateStatus.textContent='به‌روزرسانی انجام نشد: '+e.message;}finally{update.disabled=false;}};
$('#keywordsEnabled44').onchange=()=>{S.pushUndo();S.settings.caption38=S.settings.caption38||{};S.settings.caption38.enabled44=$('#keywordsEnabled44').checked;S.saveSettings();sync();w.VarnaActions.refresh();w.VarnaStudio37.render();if(S.settings.caption38.enabled44)w.VarnaHighlightUI38.schedule();};
// Native fieldsets enforce pointer AND keyboard disabling, without changing stored values.
const dependencies=[];
const autoRow=$('#autoHighlight38').closest('label'),autoGate=document.createElement('fieldset');autoGate.className='dependent44';autoGate.setAttribute('aria-label','پیشنهاد خودکار');autoRow.before(autoGate);autoGate.append(autoRow);
function dependent(switchId,ids){const toggle=$('#'+switchId);if(!toggle)return;const groups=[];for(const id of ids){const el=$('#'+id);if(!el)continue;const host=el.closest('label.control')||el,group=document.createElement('fieldset');group.className='dependent44';group.setAttribute('aria-label','تنظیم وابسته به '+switchId);host.before(group);group.append(host);groups.push(group);}const state=document.createElement('small');state.className='toggle-state44';toggle.closest('label')?.append(state);dependencies.push({toggle,groups,state});}
dependent('strokeOn',['strokeColor','strokeWidth']);
dependent('textGlowEnabled',['textGlowColor','textGlowRadius','textGlowIntensity']);
dependent('bgGlowEnabled',['bgGlowIntensity','bgGlowRadius','bgGlowColor']);
dependent('stackEnabled37',['stackLines37','stackMode37','stackGap37','stackOffset37']);
dependent('kashidaEnabled',['kashidaChance','kashidaLength']);
dependent('typeSoundEnabled',['typeSoundDb']);
dependent('naPosition',['naPX','naPY']);
dependent('naScale',['naScaleV']);
dependent('naRotation',['naRotV']);
dependent('naBlur',['naBlurV']);
dependent('naTracking',['naTrackV']);
dependent('naSkew',['naSkewV']);
dependent('mbPosition',['mbX','mbY']);
dependent('mbScale',['mbScaleV']);
dependent('mbRotation',['mbRot']);
dependent('bgGradientEnabled',['bgGradientColor2','bgGradientAngle','bgGradientBalance','bgGradientHandleEditor']);
dependent('bgRimGradient',['bgRimColor2','bgRimAngle','bgRimBalance']);
function sync(){
 const enabled=S.settings.caption38?.enabled44!==false;autoGate.disabled=$('#suggestionMode39').value==='manual';autoGate.classList.toggle('feature-muted44',autoGate.disabled);$('#keywordsEnabled44').checked=enabled;
 controls.disabled=!enabled;controls.hidden=!enabled;note.hidden=enabled;$('#keywordState44').textContent=enabled?'روشن':'خاموش';card.dataset.featureEnabled44=String(enabled);
 const preflight=$('#outputAnalyze41');if(preflight){preflight.disabled=!enabled;preflight.closest('label')?.classList.toggle('feature-muted44',!enabled);preflight.title=enabled?'':'کلمات مهم از کلید اصلی خاموش شده است.';}
 if(lastEnabled!==enabled){if(!enabled)w.VarnaHighlightUI38.cancel();lastEnabled=enabled;w.VarnaStudio37.render();}
 for(const {toggle,groups,state}of dependencies){state.textContent=toggle.checked?'روشن':'خاموش';for(const group of groups){group.disabled=!toggle.checked;group.classList.toggle('feature-muted44',!toggle.checked);}}
 $('#uiSpacing44').value=document.body.dataset.density==='comfortable'?'comfortable':'compact';
}
document.addEventListener('change',sync);document.addEventListener('varna:page',sync);setInterval(()=>{if(!document.hidden)sync();},500);
size(saved.size,false);sync();
w.VarnaWorkspace44={size:(v)=>size(v,true),sync,preference:()=>saved.size};
})(window);
