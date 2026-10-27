/* Startup brand choice, consistent property groups and transparent material. */
(function(w){'use strict';
function init(){
const S=w.GHAFState,$=s=>document.querySelector(s);document.body.classList.add('finalize49');
function startBrand(){
 if($('#brandWelcome49'))return;
 const d=document.createElement('dialog');d.id='brandWelcome49';d.className='review-dialog47 brand-welcome49';d.setAttribute('aria-label','شروع پروژهٔ وارنا');
 d.innerHTML='<img src="./assets/varna-logo.svg" alt=""/><h2>شروع با هویت خودت</h2><label class="control"><span>برند ذخیره‌شده</span><select id="startupBrand49"></select></label><div class="action-inline"><button type="button" class="btn primary" id="startupUseBrand49">ادامه با برند</button><button type="button" class="btn secondary" id="startupNewBrand49">New · پروژهٔ جدید</button></div><label class="switch-row"><input id="startupBrandAssets50" type="checkbox" checked/><span class="switch"></span><span>ورود فایل‌های برند به پروژه</span></label><small>ذخیرهٔ برند اختیاری است.</small><p role="status" id="startupBrandStatus49"></p>';
 document.body.append(d);const list=S.mergeBrandLibrary(),select=$('#startupBrand49');
 for(const b of list){const o=document.createElement('option');o.value=b.id;o.textContent=b.name;select.append(o);}
 if(list.some(b=>b.id===S.settings.activeBrandId))select.value=S.settings.activeBrandId;
 $('#startupUseBrand49').disabled=!list.length;select.disabled=!list.length;
 if(!list.length){const o=document.createElement('option');o.textContent='برندی ذخیره نشده';select.append(o);}
 let choosing=false;async function choose(id){if(choosing)return;choosing=true;$('#startupUseBrand49').disabled=$('#startupNewBrand49').disabled=true;try{const existing=id&&S.mergeBrandLibrary().find(b=>b.id===id);if(existing&&$('#startupBrandAssets50').checked&&(existing.assets||[]).some(a=>a.enabled!==false)){ $('#startupBrandStatus49').textContent='ورود فایل‌های برند…';await w.GHAFBridge.call('importBrandLibrary50',{brandId:existing.id,name:existing.name,assets:existing.assets},{timeout:180000});}const b=S.startBrand49(id);w.VarnaActions.refresh();w.VarnaAppearance.brands();if(b){$('#brandList').value=b.id;$('#brandList').dispatchEvent(new Event('change'));}else{$('#brandNew').click();}d.close();d.remove();w.VarnaUI.open('home');$('#brandShortcut').textContent=b?b.name:'برند · New';$('#homeShortcut').focus();}catch(e){$('#startupBrandStatus49').textContent=e.message;}finally{choosing=false;if(d.isConnected){$('#startupUseBrand49').disabled=!list.length;$('#startupNewBrand49').disabled=false;}}}
 $('#startupUseBrand49').onclick=()=>choose(select.value);$('#startupNewBrand49').onclick=()=>choose('');
 d.addEventListener('cancel',e=>{e.preventDefault();choose('');});d.showModal();(list.length?$('#startupUseBrand49'):$('#startupNewBrand49')).focus();
}
document.addEventListener('varna:startup49',startBrand);
if(w.VarnaBoot49?.phase==='ready')startBrand();
// Put related values in vertical pairs, preserving input nodes, IDs and handlers.
const groups=[['bgOffsetX','bgOffsetY','موقعیت'],['bgScaleX','bgScaleY','بزرگ‌نمایی'],['tableX','tableY','موقعیت'],['bgPaddingX','bgPaddingY','فاصلهٔ داخلی'],['posX','posY','موقعیت'],['scaleX','scaleY','بزرگ‌نمایی'],['videoInspectorX','videoInspectorY','موقعیت'],['naPX','naPY','موقعیت'],['mbX','mbY','موقعیت']];
for(const [x,y,title]of groups){const a=document.getElementById(x)?.closest('label.control'),b=document.getElementById(y)?.closest('label.control');if(!a||!b||a.parentElement!==b.parentElement)continue;const pair=document.createElement('div');pair.className='property-pair49';pair.setAttribute('role','group');pair.setAttribute('aria-label',title);a.before(pair);pair.append(a,b);}
// Native selects remain native and searchable controls keep their own popup.
$('#bgModelHead')?.closest('label').classList.add('background-model49');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
