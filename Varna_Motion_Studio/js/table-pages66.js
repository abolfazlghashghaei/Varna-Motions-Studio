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
const pager67=new w.VarnaPager67(page,root,pager,{hidden:'table-paged-out66',selectId:'tablePageJump66',previousId:'tablePagePrevious66',nextId:'tablePageNext66'});let pending=false;
function refresh(target){if(w.VarnaUI.current()==='table')pager67.refresh(target);}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh();});}
new MutationObserver(schedule).observe($('#productionRoutes47'),{childList:true});w.addEventListener('resize',schedule);document.addEventListener('varna:page',schedule);root.addEventListener('toggle',schedule,true);extra.addEventListener('toggle',schedule);new ResizeObserver(schedule).observe(dock);
const reveal=w.VarnaUI.reveal;w.VarnaUI.reveal=function(el){reveal(el);if(el?.closest('#page-table'))refresh(el);};
w.VarnaTablePages66={refresh,reveal:el=>refresh(el),count:()=>pager67.count(),current:()=>pager67.index,sections:()=>pager67.sections.map(s=>({key:s.key,title:s.title,pages:s.pages.length})),select:index=>pager67.select(index),show:index=>pager67.show(index)};
})(window);
