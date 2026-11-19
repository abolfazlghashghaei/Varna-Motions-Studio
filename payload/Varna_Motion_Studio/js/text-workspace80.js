/* Caption workspace: original controls/state/handlers, independent list scrolling,
   and an editor that remains visible while selecting or reviewing captions. */
(function(w){'use strict';
if(!document.documentElement.hasAttribute('data-ui77'))return;
const $=(s,r=document)=>r.querySelector(s),page=$('#page-text'),work=$('#workspace'),S=w.GHAFState;
const list=$('#captionList'),input=$('#reviewText'),live=input?.closest('article.card'),library=list?.closest('article.card');
if(!page||!live||!library||!S)return;
const all=(s,r=document)=>Array.from(r.querySelectorAll(s)),en=()=>w.VarnaI18n52?.language()==='en';
const labels=[];function el(tag,cls){const n=document.createElement(tag);if(cls)n.className=cls;return n;}
function label(node,fa,english){labels.push([node,fa,english]);node.textContent=en()?english:fa;return node;}
function action(fa,english,icon,handler){const b=el('button','btn secondary text80-action');b.type='button';b.title=en()?english:fa;b.setAttribute('aria-label',b.title);b.dataset.fa80=fa;b.dataset.en80=english;const mark=el('span');mark.setAttribute('aria-hidden','true');mark.innerHTML=w.VarnaIcons30?.[icon]||'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';b.append(mark);b.onclick=handler;return b;}
const listHolder=library.closest('details.flow-section77'),editHolder=live.closest('details.flow-section77');
const viewport=el('div','text-workbench80'),aside=el('aside','text-library80'),editor=el('section','text-editor80');
viewport.dataset.textViewport80='true';aside.setAttribute('aria-label',en()?'Caption list':'فهرست زیرنویس‌ها');
listHolder.remove();editHolder.remove();aside.append(library);listHolder.remove();editor.append(live);editHolder.remove();
const header=el('section','text-editor-head80'),bar=el('div','text-editor-bar80'),counter=el('output','text-counter80');counter.dir='auto';
const previous=action('کپشن قبلی','Previous caption','arrow-right',()=>$('#prevCaption').click()),next=action('کپشن بعدی','Next caption','chevron-left',()=>$('#nextCaption').click());
previous.classList.add('text80-step');next.classList.add('text80-step');
const inspector=el('section','text-inspector80'),dialog=el('dialog','text-inspector-dialog80'),dialogHead=el('header','text-inspector-title80');
const dialogTitle=label(el('b'),'تنظیمات متن و زمان','Text & timing settings'),close=action('بستن تنظیمات','Close settings','x',()=>dialog.close());dialogHead.append(dialogTitle,close);dialog.append(dialogHead);
const settings=action('تنظیمات متن، زمان و واژه‌نامه','Text, timing & dictionary settings','sliders-horizontal',()=>openInspector());
let expanded83=false,external84=null;
const grow83=action('بزرگ‌کردن کادر متن','Expand text editor','maximize-2',()=>{expanded83=!expanded83;grow83.setAttribute('aria-pressed',String(expanded83));layout();}),spellShortcut83=action('اصلاح واژه‌های همین متن','Review this caption','highlighter44',()=>openInspector($('#text55-enabled')));
grow83.dataset.textGrow83='true';grow83.setAttribute('aria-pressed','false');spellShortcut83.dataset.spellShortcut83='true';
settings.dataset.textSettings80='true';bar.append(counter,previous,next,grow83,spellShortcut83,settings);header.append(bar);
input.dir='auto';input.setAttribute('aria-label',en()?'Edit selected caption':'ویرایش متن انتخاب‌شده');header.append(input);
// Keep all existing options; only the primary switch/review button stay in the
// editor header. Long status, dictionary and marked copy live in the inspector.
const spell=$('#offlineText55',library)||$('#offlineText55'),spellExtra=el('section','text55 text80-spell-extra');
if(spell){const title=spell.querySelector('header>b');if(title)title.classList.add('text80-spell-title');const status=$('#text55Status',spell),options=spell.querySelector(':scope>details');spellExtra.append(label(el('h3'),'اصلاح آفلاین و واژه‌نامه','Offline correction & dictionary'));if(status)spellExtra.append(status);if(options)spellExtra.append(options);header.append(spell);}
const marked=$('#correctionTextPreview',live);if(marked){marked.dir='auto';spellExtra.append(marked);}
// Keep the live-edit card as the ancestry owner, including dialogs. display:
// contents flattens the card; generated details wrappers are removed because
// native details-content boxes otherwise prevent independent scroll sizing.
const remainingLive=Array.from(live.children);for(const n of remainingLive)inspector.append(n);
inspector.prepend(spellExtra);
const remainingPage=Array.from(page.children);for(const n of remainingPage)inspector.append(n);
live.append(header,inspector,dialog);viewport.append(aside,editor);page.append(viewport);page.dataset.textWorkspace80='true';
let mode='',queued=0,lastSelected=null,selectionFrame=0;
function active(){return w.VarnaUI.current()==='text';}
function localize(){for(const [n,fa,english]of labels)if(n.isConnected)n.textContent=en()?english:fa;for(const b of [previous,next,settings,close,grow83,spellShortcut83]){const value=en()?b.dataset.en80:b.dataset.fa80;b.title=value;b.setAttribute('aria-label',value);}input.setAttribute('aria-label',en()?'Edit selected caption':'ویرایش متن انتخاب‌شده');if(spell){const toggle=$('#text55-enabled')?.closest('label')?.querySelector('span');if(toggle)toggle.textContent=en()?'Offline correction':'اصلاح آفلاین';const check=$('#text55Review');if(check)check.textContent=en()?'Review words':'بررسی واژه‌ها';}const title=library.querySelector('.card-title b');if(title)title.textContent=en()?'Captions':'فهرست زیرنویس‌ها';}
function syncSelection(){if(!active())return;const g=S.current(),i=g?S.groupIndex(g.id):-1,value=(i+1)+' / '+S.groups.length;if(counter.textContent!==value)counter.textContent=value;previous.disabled=i<=0;next.disabled=i<0||i>=S.groups.length-1;
 if(lastSelected!==g?.id){lastSelected=g?.id;cancelAnimationFrame(selectionFrame);selectionFrame=requestAnimationFrame(()=>{const row=all('.caption-row',list).find(n=>n.dataset.id===String(lastSelected));if(!row)return;const a=list.getBoundingClientRect(),b=row.getBoundingClientRect();if(b.top<a.top)list.scrollTop-=a.top-b.top;else if(b.bottom>a.bottom)list.scrollTop+=b.bottom-a.bottom;});}
}
function layout(){queued=0;if(!active())return;if(external84){mode='wide';page.dataset.textMode80='wide';external84.layout(expanded83);syncSelection();return;}const rect=work.getBoundingClientRect(),micro=rect.width<340||rect.height<400,nextMode=rect.width>=700&&rect.height>=250?'wide':micro?'micro':'stacked',tight=rect.height<250;
 if(mode!==nextMode){mode=nextMode;page.dataset.textMode80=mode;if(dialog.open)dialog.close();if(mode==='wide')live.insertBefore(inspector,dialog);else dialog.append(inspector);}
 page.dataset.textTight83=String(tight);page.dataset.textRowScroll83=String(rect.width<180);page.style.setProperty('--caption-row-max83',Math.max(32,list.clientHeight-4)+'px');grow83.hidden=tight;spellShortcut83.hidden=!tight;
 if(spell){const owner=tight?spellExtra:header;if(spell.parentElement!==owner)owner.append(spell);}
 const chrome=Math.max(0,header.getBoundingClientRect().height-input.getBoundingClientRect().height),maxHeight=Math.max(32,Math.min(280,rect.height-chrome-48)),minHeight=Math.min(maxHeight,tight?32:80),height=Math.max(minHeight,Math.min(maxHeight,rect.height*(expanded83 ? .55 : mode==='wide' ? .25 : .34)));
 for(const [key,value]of [['--text-editor-min83',minHeight],['--text-editor-height83',height],['--text-editor-max83',maxHeight]]){const next=Math.round(value)+'px';if(page.style.getPropertyValue(key)!==next)page.style.setProperty(key,next);}
 syncSelection();}
function schedule(){if(!queued)queued=requestAnimationFrame(layout);}
function openInspector(target){if(external84){external84.open(target);return;}if(mode!=='wide'&&!dialog.open)dialog.showModal();if(target){for(let n=target;n&&n!==inspector;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;target.scrollIntoView({block:'nearest'});}else if(mode!=='wide')close.focus();else inspector.focus({preventScroll:true});}
inspector.tabIndex=-1;
dialog.addEventListener('close',()=>{if(active())settings.focus({preventScroll:true});});dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.close();});dialog.addEventListener('keydown',e=>e.stopPropagation());
const reveal=w.VarnaUI.reveal;w.VarnaUI.reveal=function(n){if(n&&inspector.contains(n)&&active())openInspector(n);reveal(n);};
list.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('.caption-row')){e.preventDefault();e.target.closest('.caption-row').click();input.focus({preventScroll:true});}});
const sizing83=new ResizeObserver(schedule);sizing83.observe(work);sizing83.observe(list);
w.addEventListener('varna:caption-render56',syncSelection);
document.addEventListener('varna:language52',()=>{localize();schedule();});
document.addEventListener('varna:page',()=>{const enabled=active();document.body.toggleAttribute('data-text-edit80',enabled);if(enabled){work.scrollTop=0;localize();schedule();}else if(dialog.open)dialog.close();});
localize();if(active()){document.body.setAttribute('data-text-edit80','');schedule();}
w.VarnaTextWorkspace80={layout,openSettings:openInspector,mode:()=>mode,usePanes84(value){external84=value;if(!value)mode='';layout();}};
})(window);
