/* Stage B pilot: reparent live controls, never clone handlers or translate project data. */
(function(w){'use strict';
if(!document.documentElement.hasAttribute('data-ui-a68'))return;
const $=s=>document.querySelector(s),all=(s,r=document)=>Array.from(r.querySelectorAll(s));
const pages=[$('#page-table'),$('#page-kinetic')],shell=$('.app-shell');
const en=()=>w.VarnaI18n52?.language()==='en';
function label(el,fa,english){el.dataset.labelFa69=fa;el.dataset.labelEn69=english;const text=en()?english:fa;if(el.textContent!==text)el.textContent=text;return el;}
function element(tag,cls){const e=document.createElement(tag);if(cls)e.className=cls;return e;}
function accordion(fa,english,open=false){const d=element('details','flat-section69'),s=element('summary');d.open=open;d.dataset.defaultOpen69=String(open);label(s,fa,english);d.append(s);return d;}
function wrap(node,fa,english,open){const d=accordion(fa,english,open);node.before(d);d.append(node);return d;}
function clearPaging(page){all('.production-hidden47,.workspace-paged67,.table-paged-out66',page).forEach(e=>e.classList.remove('production-hidden47','workspace-paged67','table-paged-out66'));}
for(const page of pages){page.dataset.flat69='true';clearPaging(page);}
all('.workflow-tab-hidden',pages[0]).forEach(e=>e.classList.remove('workflow-tab-hidden'));
const table=pages[0],kinetic=pages[1];
for(const [page,fa,english]of [[table,'ردیف‌ها و متن خانه‌ها را تنظیم کن، سپس جدول را در افتر بساز.','Set the rows and cell text, then create the table in After Effects.'],[kinetic,'متن را انتخاب کن و ظاهر و حرکت هر عبارت یا کلمه را تنظیم کن.','Choose text and set the appearance and motion of each phrase or word.']]){const intro=label(element('p','flat-intro69'),fa,english);page.prepend(intro);}
// Keep the original table cards and descendants together: native handlers use their ancestry.
const tableRoot=table.querySelector('.table-pro-layout'),tableCards=all('article.card',tableRoot);
for(const card of tableCards){const isStructure=!!card.querySelector('#tableRows'),isContent=!!card.querySelector('#tableEditor');wrap(card,isStructure?'ساختار جدول':isContent?'متن خانه‌ها و تنظیمات انتخاب':'ظاهر و حرکت جدول',isStructure?'Table structure':isContent?'Cell text & selection settings':'Appearance & motion',isStructure);}
const tablePreview=table.querySelector('.mini-preview-toggle');tablePreview.querySelector('summary').hidden=false;
label(tablePreview.querySelector('summary'),'پیش‌نمایش و جای‌گذاری','Preview & placement');
const tableDock=table.querySelector('.table-preview-card');
const tablePreviewShell=wrap(tableDock,'پیش‌نمایش جدول','Table preview',true);tablePreviewShell.classList.add('flat-preview69');
// Only one disclosure controls the preview; the old details stays open for compatibility.
tablePreview.querySelector('summary').hidden=true;tablePreview.open=true;
const tableLayout=element('div','flat-layout69');tablePreviewShell.before(tableLayout);tableLayout.append(tableRoot,tablePreviewShell);
for(const d of all('details.advanced-panel',tableRoot))d.open=false;
const weights=accordion('اندازهٔ ستون و ردیف انتخاب‌شده','Selected column & row size',false);table.querySelector('.cell-inspector').append(weights);
for(const [axis,fa,english]of [['column','عرض نسبی ستون','Column relative width'],['row','ارتفاع نسبی ردیف','Row relative height']]){const field=element('label','control');field.append(label(element('span'),fa,english));const input=element('input');input.type='number';input.min='.05';input.max='100';input.step='.05';input.value='1';input.dataset.weight69=axis;input.setAttribute('aria-label',en()?english:fa);field.append(input);weights.append(field);input.addEventListener('change',()=>{w.VarnaTable50.setSelectedWeight69(axis,input.value);syncEditor();});}
const editor=$('#tableEditor');
// Reserve four pixels for cell borders/insets in addition to the 32px input target.
function syncEditor(){if(!active||w.VarnaUI.current()!=='table')return;const values=w.VarnaTable50.selectedWeights69();editor.classList.toggle('compact-list69',editor.clientWidth/values.columns<36);for(const input of all('[data-weight69]'))if(document.activeElement!==input)input.value=values[input.dataset.weight69];for(const cell of all('.table-cell',editor)){const row=+cell.dataset.row+1,column=+cell.dataset.col+1;cell.dataset.cellLabel69=en()?'Row '+row+' · Column '+column:'ردیف '+row+' · ستون '+column;}}
// Scene/line is the single in-page tab row. All settings below it are disclosures.
const scene=$('#kineticStudio40'),sceneSettings=scene.querySelector('.scene-settings40');
const firstGrid=sceneSettings.querySelector(':scope > .form-grid');wrap(firstGrid,'چیدمان و ورود عبارت‌ها','Layout & entrance',true);
const lines=$('#sceneLines40').closest('label'),lineButtons=lines.nextElementSibling;
const content=wrap(lines,'متن و تقسیم عبارت‌ها','Text & phrase grouping',true);if(lineButtons?.matches('.button-row'))content.append(lineButtons);
const words=$('#scenePieces40');wrap(words,'ظاهر و حرکت هر کلمه','Per-word appearance & motion',false);
const scenePreview=wrap(scene.querySelector('.scene-preview40'),'پیش‌نمایش تایپوگرافی','Typography preview',true);scenePreview.classList.add('flat-preview69');
const sceneGrid=scene.querySelector('.kinetic-grid40');sceneGrid.classList.add('flat-layout69');
const lineCard=$('#wordMotion39');wrap($('#wordPresets39'),'حرکت آماده','Motion presets',true);wrap(lineCard.querySelector('.form-grid'),'تنظیمات حرکت و رنگ','Motion & color settings',true);const linePreview=wrap($('#wordPreview39'),'پیش‌نمایش حرکت','Motion preview',false);linePreview.classList.add('flat-preview69');
// Status and the original main action live outside the scrolling workspace.
const actionBar=element('div','flat-actions69');actionBar.setAttribute('role','region');actionBar.setAttribute('aria-label','Page action');$('#workspace').after(actionBar);
const statusDetails=element('details','flat-status69'),statusSummary=element('summary');statusSummary.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></svg>';statusSummary.setAttribute('aria-label','وضعیت ساخت');statusDetails.append(statusSummary);const statusPopup=element('div','flat-status-popup69');statusDetails.append(statusPopup);actionBar.append(statusDetails);
const actions=new Map();
for(const [key,button,status]of [['table',$('#tableBuild'),$('#tableStatus')],['scene',$('#sceneApply40'),$('#sceneStatus40')],['line',$('#applyWord39'),$('#wordStatus39')]]){
 const slot=element('div','flat-action-slot69');button.before(slot);actions.set(key,{slot,button,status,homeStatus:status.parentElement});button.dataset.primary69='true';
}
// A bottom page navigator replaces the nested production/pager chrome on the pilot pages.
const nav=element('nav','flat-nav69');nav.setAttribute('aria-label','Pages');nav.dataset.navigationLevel69='1';shell.append(nav);
const pageLinks=[['home','خانه','Home','house'],['text','متن','Text','type'],['table','جدول','Table','table-2'],['kinetic','تایپوگرافی','Typography','kinetic44']];
for(const [name,fa,english,icon]of pageLinks){const b=element('button');b.type='button';b.dataset.page69=name;b.title=fa;b.setAttribute('aria-label',fa);const mark=element('span','flat-nav-icon69');mark.setAttribute('aria-hidden','true');mark.innerHTML=w.VarnaIcons30?.[icon]||w.VarnaIcons30?.layers||'';const text=label(element('span','flat-nav-label69'),fa,english);b.append(mark,text);b.onclick=()=>w.VarnaUI.open(name);nav.append(b);}
const more=element('button');more.type='button';more.setAttribute('aria-haspopup','dialog');more.dataset.more69='true';more.innerHTML='<span class="flat-nav-icon69" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg></span>';more.append(label(element('span','flat-nav-label69'),'همهٔ بخش‌ها','All pages'));nav.append(more);
const chooser=element('dialog','flat-chooser69');chooser.setAttribute('aria-label','Pages');const close=label(element('button'),'بستن','Close');close.type='button';chooser.append(close);const chooserGrid=element('div','flat-chooser-grid69');chooser.append(chooserGrid);document.body.append(chooser);
const pageNames={home:['خانه','Home'],text:['متن','Text'],table:['جدول','Table'],kinetic:['تایپوگرافی','Typography'],motion:['موشن','Motion'],templates:['قالب‌ها','Templates'],sfx:['کتابخانهٔ صدا','Sound library'],music:['ساخت صدا','Generate audio'],audio:['ساخت زیرنویس','Transcription'],ai:['اصلاح متن','Text correction'],bg:['پس‌زمینه','Background'],brand:['برند','Brand'],director:['دستیار پروژه','Project assistant'],easing49:['منحنی حرکت','Easing'],assistant49:['دستیار اسکریپت','Script assistant'],safe:['محدودهٔ امن','Safe area'],keywords:['کلمات مهم','Keywords'],translate:['ترجمه','Translation'],tools:['ابزارها','Tools'],resources:['منابع سیستم','System resources'],output:['خروجی','Output'],settings:['تنظیمات','Settings']};
for(const [name,[fa,english]]of Object.entries(pageNames)){const b=label(element('button'),fa,english);b.type='button';b.dataset.destination69=name;b.onclick=()=>{chooser.close();w.VarnaUI.open(name);};chooserGrid.append(b);}
more.onclick=()=>chooser.showModal();const closeChooser=()=>{chooser.close();more.focus();};close.onclick=closeChooser;chooser.addEventListener('cancel',e=>{e.preventDefault();closeChooser();});chooser.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeChooser();}});
// Move duplicate global actions into the existing display popover while a pilot page is active.
const tools=accordion('ابزارهای افتر و متن فعال','After Effects & active text',false);$('#headerOptions .header-options-panel').append(tools);
const liveLabel=$('#livePreviewGlobal').closest('label').querySelector('span:last-child'),liveLabelOriginal=liveLabel.textContent;
const globalControls=[$('#btnRefreshPreview'),$('#btnGoOutput'),$('#livePreviewGlobal').closest('label'),$('.bottom-dock .active-caption-mini'),$('.bottom-dock .dock-actions')].map(node=>{const slot=element('span','flat-return69');node.before(slot);return {node,slot};});
let active=false,mode='',lastBand='',moving=false;
function size(){const current=document.body.dataset.uiSize44;document.documentElement.style.setProperty('--panel-root69',({tiny:12,compact:13,standard:14,large:16,xlarge:18}[current]||14)+'px');}
// Preserve both live footer nodes; share their grid row when available height is scarce.
// The threshold follows the user's UI scale, not the monitor or a new CSS feature.
function shortLayout(){const short=active&&innerHeight<32*parseFloat(getComputedStyle(document.documentElement).fontSize);
 if(shell.dataset.panelShort71!==String(short))shell.dataset.panelShort71=String(short);
 const parent=short?$('.topbar'):actionBar;if(statusDetails.parentElement!==parent)parent.append(statusDetails);
}
function fitScene(){if(!active||w.VarnaUI.current()!=='kinetic'||!scenePreview.open)return;const stage=$('#sceneStage40'),ratio=stage.style.aspectRatio.split('/').map(Number),aspect=ratio[0]/ratio[1];if(!Number.isFinite(aspect)||aspect<=0)return;const cap=Math.min(innerHeight*.22,parseFloat(getComputedStyle(document.documentElement).fontSize)*13),width=Math.max(1,Math.min(stage.parentElement.clientWidth,cap*aspect));const value=width+'px';if(stage.style.getPropertyValue('--scene-inline69')!==value)stage.style.setProperty('--scene-inline69',value);}
function layout(){const width=shell.getBoundingClientRect().width,band=width<340?'compact':width<=640?'regular':'wide';shell.dataset.panelBand69=band;shell.dataset.size=band==='regular'?'normal':band;shell.dataset.panelMicro69=String(width<180);
 if(band!==lastBand){for(const preview of [tablePreviewShell,scenePreview])if(!preview.dataset.touched69)preview.open=band!=='compact';lastBand=band;}
 size();shortLayout();fitScene();if(active&&w.VarnaUI.current()==='table')w.VarnaTable50?.render?.();
}
for(const preview of [tablePreviewShell,scenePreview]){preview.querySelector('summary').addEventListener('click',()=>preview.dataset.touched69='true');preview.addEventListener('toggle',()=>{if(preview.open)requestAnimationFrame(()=>w.dispatchEvent(new Event('resize')));});}
function restoreActions(){for(const a of actions.values()){if(a.button.parentElement===actionBar)a.slot.after(a.button);if(a.status.parentElement===statusPopup)a.homeStatus.append(a.status);}}
function sync(){if(moving)return;moving=true;try{
 const name=w.VarnaUI.current(),pilot=['table','kinetic'].includes(name),enabled=pilot||document.documentElement.hasAttribute('data-ui77'),wasActive=active;active=enabled;
 document.documentElement.toggleAttribute('data-flat69',pilot);document.body.toggleAttribute('data-flat69',pilot);
 if(enabled){clearPaging($('#page-'+name));globalControls.forEach(x=>{if(x.node.parentElement!==tools)tools.append(x.node);});}
 else {globalControls.forEach(x=>{if(x.node.parentElement===tools)x.slot.after(x.node);});liveLabel.textContent=liveLabelOriginal;delete liveLabel.dataset.labelFa69;delete liveLabel.dataset.labelEn69;if(wasActive){const heading=$('#page-'+name+' .page-head h1');$('#currentPageTitle').textContent=heading?.textContent||pageNames[name]?.[en()?1:0]||name;}}
 const line=$('#wordMotion39').classList.contains('workflow-tab-hidden')===false;
 const next=pilot?(name==='table'?'table':line?'line':'scene'):name;
 if(mode!==next||!enabled){restoreActions();mode=next;}
 if(enabled&&pilot){const a=actions.get(next);if(a.status.parentElement!==statusPopup)statusPopup.append(a.status);if(actionBar.firstElementChild!==a.button)actionBar.prepend(a.button);statusSummary.title=a.status.textContent;statusSummary.setAttribute('aria-label',(en()?'Status: ':'وضعیت: ')+a.status.textContent);for(const b of all('[data-page69]',nav))b.setAttribute('aria-current',b.dataset.page69===name?'page':'false');}
 layout();localize();for(const b of all('[data-typo40]')){b.setAttribute('role','tab');b.setAttribute('aria-selected',String(b.classList.contains('active')));b.tabIndex=b.classList.contains('active')?0:-1;}
 }finally{moving=false;}}
// Deep links keep their original routing, then open the relevant disclosure ancestors.
const reveal=w.VarnaUI.reveal;w.VarnaUI.reveal=function(el){reveal(el);if(el?.closest('[data-flat69]')){sync();for(let p=el.parentElement;p&&p!==shell;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.scrollIntoView({block:'nearest'});}};
const replacements=[['px','پیکسل','px'],['RTL','راست‌به‌چپ','RTL'],['LTR','چپ‌به‌راست','LTR'],['IN','ورود','Entrance'],['OUT','خروج','Exit'],['Preview','پیش‌نمایش','Preview'],['Direct Resize','تغییر اندازه با کشیدن','Drag to resize'],['AE First','رندر در افتر','Rendered in After Effects'],['Table Pro','جدول','Table'],['RC39','موشن کلمه‌ای','Word motion'],['RC47','نسخهٔ پنل','Panel version'],['AE','افتر','After Effects'],['Composition','کامپوزیشن','Composition'],['Comp','کامپوزیشن','Composition'],['New','جدید','New'],['Timeline','زمان‌بندی','Timeline'],['Playhead','نشانگر زمان','Playhead'],['Marker','نشانهٔ زمانی','Marker'],['Merge','ادغام','Merge'],['Unmerge','جداکردن','Unmerge'],['Cell','خانه','Cell'],['Shape','شکل','Shape'],['Header','عنوان','Header'],['Zebra','ردیف راه‌راه','Alternating rows'],['Native','داخلی','Built-in'],['Fade','محو','Fade'],['Rise','بالا آمدن','Rise'],['Scale','تغییر اندازه','Scale'],['Slide Left','از چپ','Slide left'],['Slide Right','از راست','Slide right'],['Drop','از بالا','Drop'],['Pop','جهش','Pop'],['Auto','خودکار','Auto']];
for(const [,fa,english]of replacements)w.VarnaI18n52.dictionary[fa]=english;
function localize(){
 for(const el of all('[data-label-fa69]')){const value=en()?el.dataset.labelEn69:el.dataset.labelFa69;if(el.textContent!==value)el.textContent=value;}
 for(const b of all('[data-page69]',nav)){const text=b.querySelector('.flat-nav-label69').textContent;b.title=text;b.setAttribute('aria-label',text);}more.title=en()?'All pages':'همهٔ بخش‌ها';more.setAttribute('aria-label',more.title);
 if(!active)return;
 const current=w.VarnaUI.current();$('#currentPageTitle').textContent=pageNames[current]?.[en()?1:0]||current;
 label($('#tableBuild'),'ساخت جدول','Create table');label($('#sceneApply40'),'اعمال','Apply');label($('#applyWord39'),'اعمال حرکت','Apply motion');
 const roots=[...pages,statusPopup];
 for(const root of roots){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;const nodes=[];while((n=walker.nextNode()))nodes.push(n);
  for(const node of nodes){const parent=node.parentElement;if(!parent||parent.closest('script,style,[data-label-fa69],[data-user-content],#tableEditor,#tablePreview,#sceneStage40,#scenePieces40 input,#scenePieceSelect45,#captionPicker40-kinetic,input,textarea,#brandShortcut,svg,bdi,.word-chips48,select[id*="font" i],#tableFontPS66,#cellFontPS'))continue;let text=node.nodeValue;if(!en())for(const [token,fa]of replacements)text=text.replace(new RegExp('\\b'+token+'\\b','g'),fa);if(text!==node.nodeValue)node.nodeValue=text;
   // Isolate technical Latin runs without touching authored text or native select options.
   if(!en()&&!parent.closest('option,select')&&/[A-Za-z]/.test(text)){
    const parts=text.split(/([A-Za-z][A-Za-z0-9_+.-]*(?:[ ][A-Za-z][A-Za-z0-9_+.-]*)*)/g);if(parts.length>1){const fragment=document.createDocumentFragment();for(let i=0;i<parts.length;i++){if(i%2){const bdi=element('bdi');bdi.dir='ltr';bdi.textContent=parts[i];fragment.append(bdi);}else fragment.append(document.createTextNode(parts[i]));}node.replaceWith(fragment);}
   }
  }
 }
 $('#currentPageEyebrow').title=en()?'Panel version':'نسخهٔ پنل';
 const badge=$('#livePreviewGlobal').closest('label').querySelector('span:last-child');label(badge,'پیش‌نمایش زندهٔ افتر','Live AE preview');
 // Bidi isolation uses direction on controls and CSS isolate on UI values; project text is untouched.
 all('input[type=number],.numeric37-value,.numeric37-slider',document).forEach(e=>e.dir='ltr');
 if(active&&w.VarnaUI.current()==='table')syncEditor();
 const section=$('#pieceSection66');if(section)section.closest('label').classList.add('flat-category69');
}
const selectMirrors=new Map();
function selectedText(){if(!active)return;for(const select of all('select', $('.page.active'))){
 if(!select.getClientRects().length||select.matches('.sr-only,.tomselected')||select.closest('details:not([open])'))continue;
 let mirror=selectMirrors.get(select);if(!mirror){mirror=element('span','select-value69');mirror.dataset.userContent='true';mirror.dir='auto';mirror.setAttribute('aria-hidden','true');const wrapper=element('div','select-shell69');select.before(wrapper);const focused=document.activeElement===select;wrapper.append(select,mirror);if(focused)select.focus({preventScroll:true});selectMirrors.set(select,mirror);}
 const text=select.selectedOptions?.[0]?.textContent||'',ctx=selectedText.canvas||(selectedText.canvas=document.createElement('canvas').getContext('2d'));ctx.font=getComputedStyle(select).font;
 const clipped=ctx.measureText(text).width>select.clientWidth-34;if(select.parentElement.hasAttribute('data-wrapped69')!==clipped)select.parentElement.toggleAttribute('data-wrapped69',clipped);if(mirror.hidden!==!clipped)mirror.hidden=!clipped;if(mirror.textContent!==text)mirror.textContent=text;select.title=text;
 }}
let selectFrame=0;function scheduleSelect(){cancelAnimationFrame(selectFrame);selectFrame=requestAnimationFrame(selectedText);}
const typoTabs=kinetic.querySelector('.workflow-tabs');typoTabs.setAttribute('role','tablist');typoTabs.dataset.navigationLevel69='2';
typoTabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=all('[data-typo40]',typoTabs),i=tabs.indexOf(e.target);if(i<0)return;e.preventDefault();const forward=(e.key==='ArrowRight'?1:-1)*(document.documentElement.dir==='rtl'?-1:1),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+forward+tabs.length)%tabs.length;tabs[next].click();tabs[next].focus();});
// Preserve disclosure choices and focus when the legacy word inspector rebuilds its fields.
const pieceRoot=$('#scenePieces40'),pieceOpen69=new Map();let pieceFocus69=null;
pieceRoot.addEventListener('change',e=>{const focused=document.activeElement;pieceFocus69=focused?.id&&pieceRoot.contains(focused)?{node:focused,id:focused.id}:e.target.id?{node:e.target,id:e.target.id}:null;},true);
function managePieces69(records){let removedFocus=false;
 for(const record of records)for(const node of record.removedNodes){
  if(pieceFocus69&&(node===pieceFocus69.node||node.contains?.(pieceFocus69.node)))removedFocus=true;
  const boxes=node.matches?.('.piece-inspector45')?[node]:Array.from(node.querySelectorAll?.('.piece-inspector45')||[]);
  for(const box of boxes)if(box.dataset.managed69)for(const d of all(':scope>details',box))pieceOpen69.set(d.dataset.section66,d.open);
 }
 for(const node of all('.word-chips48,select[id*="font" i]',pieceRoot))node.dataset.userContent='true';
 const category=$('#pieceSection66');category?.closest('label').classList.add('flat-category69');
 const box=pieceRoot.querySelector('.piece-inspector45');if(box){for(const d of all(':scope>details',box))if(pieceOpen69.has(d.dataset.section66))d.open=pieceOpen69.get(d.dataset.section66);box.dataset.managed69='true';}
 if(removedFocus&&pieceFocus69&&active&&w.VarnaUI.current()==='kinetic'&&document.activeElement===document.body)document.getElementById(pieceFocus69.id)?.focus({preventScroll:true});
 scheduleSelect();
}
new MutationObserver(managePieces69).observe(pieceRoot,{childList:true});managePieces69([]);
function statusChanged(){if(!active)return;const a=actions.get(mode);if(!a)return;const text=a.status.textContent;statusSummary.title=text;statusSummary.setAttribute('aria-label',(en()?'Status: ':'وضعیت: ')+text);statusSummary.dataset.error69=String(/خطا|نیست|نشد|error|failed/i.test(text));}
for(const a of actions.values())new MutationObserver(statusChanged).observe(a.status,{childList:true,characterData:true,subtree:true});
statusDetails.addEventListener('toggle',()=>{if(statusDetails.open)statusPopup.style.bottom=(innerHeight-actionBar.getBoundingClientRect().top+4)+'px';});
document.addEventListener('keydown',e=>{if(active&&statusDetails.open&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();statusDetails.open=false;statusSummary.focus();}},true);
new ResizeObserver(()=>{layout();syncEditor();scheduleSelect();}).observe(shell);
new ResizeObserver(()=>syncEditor()).observe(editor);
new ResizeObserver(()=>{if(active&&w.VarnaUI.current()==='kinetic'&&scenePreview.open){fitScene();w.VarnaScene40.render();}}).observe($('#sceneStage40'));
new MutationObserver(()=>{if(active)fitScene();}).observe($('#sceneStage40'),{attributes:true,attributeFilter:['style']});
new MutationObserver(()=>requestAnimationFrame(syncEditor)).observe(editor,{childList:true});
document.addEventListener('click',()=>requestAnimationFrame(syncEditor));
new MutationObserver(records=>{if(records.some(r=>r.target.matches?.('select,option')||r.target.closest?.('select')))scheduleSelect();}).observe($('#workspace'),{childList:true,subtree:true});
document.addEventListener('change',scheduleSelect);document.addEventListener('toggle',scheduleSelect,true);document.addEventListener('varna:page',scheduleSelect);
new MutationObserver(()=>{size();shortLayout();}).observe(document.body,{attributes:true,attributeFilter:['data-ui-size44']});
new MutationObserver(()=>requestAnimationFrame(sync)).observe($('#wordMotion39'),{attributes:true,attributeFilter:['class']});
document.addEventListener('varna:page',()=>requestAnimationFrame(sync));document.addEventListener('varna:language52',()=>requestAnimationFrame(localize));
document.addEventListener('click',e=>{if(e.target.closest('[data-typo40]'))requestAnimationFrame(sync);});
w.VarnaPilot69={sync,layout,pages:['table','kinetic'],preview:{table:tablePreviewShell,kinetic:scenePreview}};sync();
})(window);
