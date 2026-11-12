/* Keep task sections stable while font lists and inspectors update. */
(function(w){'use strict';const $=s=>document.querySelector(s),controllers=new Map();let queued=false,lastTarget=null;
function active(){const page=$('.page.active');return page&&!page.hasAttribute('data-flat69')&&!['page-home','page-table','page-broll'].includes(page.id)?page:null;}
function current(){const page=active();if(!page)return null;if(!controllers.has(page)){const nav=document.createElement('nav');nav.className='workspace-pager67';page.prepend(nav);controllers.set(page,new w.VarnaPager67(page,page,nav));}return controllers.get(page);}
function refresh(target){current()?.refresh(target);}
function schedule(target){if(target?.id)lastTarget=target;if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;const el=lastTarget?.isConnected?lastTarget:lastTarget?.id?document.getElementById(lastTarget.id):null;lastTarget=null;refresh(el);});}
const reveal=w.VarnaUI.reveal;w.VarnaUI.reveal=function(el){reveal(el);if(el?.closest('.page')===active())refresh(el);};
document.addEventListener('varna:page',()=>schedule());new MutationObserver(()=>schedule()).observe($('#productionRoutes47'),{childList:true});w.addEventListener('resize',()=>schedule());document.addEventListener('toggle',e=>{if(e.target.closest('.page')===active())schedule(e.target);},true);
new MutationObserver(records=>{const page=active();if(!page)return;for(const r of records){if(!page.contains(r.target)||r.target.closest('.section-pager67'))continue;if(Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.matches('input,button,textarea,.control,.card')||n.querySelector('input,button,textarea,.control,.card')))){schedule();break;}}}).observe($('#workspace'),{childList:true,subtree:true});
w.VarnaWorkspace67={refresh,reveal:el=>refresh(el),count:()=>current()?.count()||0,current:()=>current()?.index||0,sections:()=>current()?.sections.map(s=>({key:s.key,title:s.title,pages:s.pages.length}))||[],select:index=>current()?.select(index),show:index=>current()?.show(index)};
})(window);
