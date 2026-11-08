/* Paginate actual table controls without cloning inputs or replacing their handlers. */
(function(w){'use strict';
const $=s=>document.querySelector(s),page=$('#page-table'),root=page.querySelector('.table-pro-layout'),dock=page.querySelector('.table-preview-card');
const preview=dock.querySelector('.mini-preview-toggle'),stage=$('#tablePreviewStage');
const lookCard=$('.table-style-time-card');lookCard.querySelector('.card-title b').textContent='تنظیمات جدول';lookCard.prepend(lookCard.querySelector('.card-title'));
const alignment=$('#tableAlignment48');$('.table-style-time-card').append(alignment);
$('#tablePreviewAE').textContent='پیش‌نمایش افتر';$('#tableBuild').textContent='ساخت جدول';$('#tableLiveAE').closest('label').querySelector('span:last-child').textContent='پیش‌نمایش زنده';
page.insertBefore(dock,root);preview.open=true;preview.querySelector('summary').hidden=true;preview.addEventListener('toggle',()=>{if(!preview.open)preview.open=true;});
const actions=document.createElement('div');actions.id='tableDockActions66';for(const el of [$('#tablePreviewAE'),$('#tableBuild'),$('#tableLiveAE').closest('label'),$('#tableStatus')])actions.append(el);
const extra=document.createElement('details');extra.id='tablePreviewOptions66';extra.innerHTML='<summary>کنترل‌های پیش‌نمایش و فریم افتر</summary>';for(const el of Array.from(dock.children))if(el!==preview)extra.append(el);const commit=document.createElement('label');commit.className='control';commit.innerHTML='<span>ارسال متن خانه‌ها به افتر</span><select id="tableCommitMode66"><option value="blur">پس از خروج از کادر متن</option><option value="pause">پس از مکث در نوشتن</option></select>';extra.append(commit);const commitSelect=commit.querySelector('select');commitSelect.value=localStorage.getItem('VARNA_TABLE_COMMIT66')||'blur';commitSelect.onchange=e=>{localStorage.setItem('VARNA_TABLE_COMMIT66',e.target.value);w.VarnaTable50.render();};
if($('#tableTimingHelp'))extra.append($('#tableTimingHelp'));dock.append(actions,extra);dock.classList.add('table-dock66');
const pager=document.createElement('nav');pager.id='tablePages66';pager.setAttribute('aria-label','صفحه‌های تنظیمات جدول');pager.innerHTML='<button type="button" class="btn tiny" id="tablePagePrevious66">قبلی</button><select id="tablePageJump66" aria-label="بخش تنظیمات جدول"></select><output id="tablePageLabel66" class="sr-only" aria-live="polite"></output><button type="button" class="btn tiny" id="tablePageNext66">بعدی</button>';root.before(pager);
let units=[],parents=new Map(),pages=[],index=0,key='',pending=false,busy=false;const memory=new Map(),hidden='table-paged-out66';
const visible=el=>!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
function clear(){root.querySelectorAll('.'+hidden).forEach(el=>el.classList.remove(hidden));}
function apply(list){root.style.zoom='1';const chosen=new Set(list);for(const el of units)el.classList.toggle(hidden,!chosen.has(el));for(const [parent,children]of parents)parent.classList.toggle(hidden,!children.some(el=>chosen.has(el)));}
function collect(node,limit){if(!visible(node))return;const rect=node.getBoundingClientRect();if(node.matches('.card-title,.inspector-head,.section-note,.section-divider'))return;
 const compound=node.matches('.control,.switch-row,.action-inline,.button-row,.table-editor-wrap,.table-range-editor,.table-style-card,details:not([open])');
 if(node.matches('.table-editor-wrap')||compound&&rect.height<=limit||node.matches('input,select,textarea,button')){units.push(node);return;}
 for(const child of node.children)collect(child,limit);
}
function show(next){index=Math.max(0,Math.min(pages.length-1,next));apply(pages[index]||[]);const bounds=root.getBoundingClientRect(),space=$('#workspace').getBoundingClientRect().bottom-bounds.top-14;if(bounds.height>space&&space>0)root.style.zoom=String(Math.max(.85,Math.min(1,space/bounds.height)));memory.set(key,index);$('#tablePageJump66').value=index;$('#tablePagePrevious66').disabled=index===0;$('#tablePageNext66').disabled=index>=pages.length-1;const first=pages[index]?.[0],title=first?.querySelector('span,b,summary')?.textContent||first?.getAttribute('aria-label')||'';$('#tablePageLabel66').textContent=(index+1)+' / '+Math.max(1,pages.length)+(title?' · '+title.slice(0,42):'');$('#workspace').scrollTop=0;}
function refresh(target){if(busy||w.VarnaUI.current()!=='table')return;busy=true;try{
 clear();units=[];parents=new Map();const workspace=$('#workspace'),base=root.getBoundingClientRect().top,bottom=workspace.getBoundingClientRect().bottom-18,limit=Math.max(70,bottom-base-50);collect(root,Math.max(45,limit-80));
 for(const el of units)for(let parent=el.parentElement;parent&&parent!==root;parent=parent.parentElement){if(!parents.has(parent))parents.set(parent,[]);parents.get(parent).push(el);}
 const rows=[];for(const el of units){const top=el.getBoundingClientRect().top,last=rows[rows.length-1];if(last&&Math.abs(last.top-top)<4)last.items.push(el);else rows.push({top,items:[el]});}
 pages=[];let current=[];for(const row of rows){apply(current.concat(row.items));if(current.length&&root.getBoundingClientRect().height>limit){pages.push(current);current=row.items.slice();}else current.push(...row.items);}if(current.length)pages.push(current);if(!pages.length)pages=[[]];
 const jump=$('#tablePageJump66');jump.replaceChildren();pages.forEach((items,i)=>{const o=document.createElement('option'),first=items[0];o.value=i;o.textContent=(i+1)+' / '+pages.length+' · '+(first?.querySelector('span,b,summary')?.textContent||first?.textContent||'بررسی').trim().slice(0,45);jump.append(o);});
 const state=w.VarnaProduction47.current();key=[state.flow,state.index,state.sub].join(':');const found=target?pages.findIndex(items=>items.some(el=>el===target||el.contains(target))):-1;show(found>=0?found:memory.get(key)||0);
 }finally{busy=false;}}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh();});}
$('#tablePageJump66').onchange=e=>show(+e.target.value);$('#tablePagePrevious66').onclick=()=>show(index-1);$('#tablePageNext66').onclick=()=>show(index+1);
new MutationObserver(schedule).observe($('#productionRoutes47'),{childList:true});w.addEventListener('resize',schedule);document.addEventListener('varna:page',schedule);root.addEventListener('toggle',schedule,true);
root.addEventListener('change',e=>{if(e.target.closest('#tableStyleGallery')||e.target.id==='tableRows'||e.target.id==='tableCols')schedule();});
extra.addEventListener('toggle',schedule);new ResizeObserver(schedule).observe(dock);
const reveal=w.VarnaUI.reveal;w.VarnaUI.reveal=function(el){reveal(el);if(el?.closest('#page-table'))refresh(el);};
w.VarnaTablePages66={refresh,reveal:el=>refresh(el),count:()=>pages.length,current:()=>index};
})(window);
