/* One bounded preview clock for visible cards, never a timer per thumbnail. */
(function(w){'use strict';const tasks=new Map(),visible=new Set(),media=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,last=0,frames=0;
const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target);}wake();},{threshold:.05});
function runnable(n){return n.isConnected&&visible.has(n)&&!document.hidden&&!!n.getClientRects().length&&!n.closest('[hidden]');}
function frame(now){raf=0;if(media.matches)return;if(now-last>=50){last=now;for(const [n,draw]of tasks){if(!n.isConnected){tasks.delete(n);visible.delete(n);observer.unobserve(n);}else if(runnable(n)){draw((now%4000)/1000);frames++;}}}if([...tasks.keys()].some(runnable))raf=requestAnimationFrame(frame);}
function wake(){if(!raf&&!media.matches&&[...tasks.keys()].some(runnable))raf=requestAnimationFrame(frame);}
function add(n,draw){for(const old of tasks.keys())if(!old.isConnected){tasks.delete(old);visible.delete(old);observer.unobserve(old);}tasks.set(n,draw);observer.observe(n);draw(1.5);wake();return ()=>{tasks.delete(n);visible.delete(n);observer.unobserve(n);};}
media.addEventListener('change',()=>{if(media.matches){cancelAnimationFrame(raf);raf=0;for(const [n,draw]of tasks)if(n.isConnected)draw(1.5);}else wake();});document.addEventListener('visibilitychange',wake);document.addEventListener('varna:page',wake);document.addEventListener('varna:workspacepage67',wake);
w.VarnaPreviewClock84={add,wake,status:()=>({tasks:tasks.size,visible:visible.size,frames,animating:!!raf,reduced:media.matches})};})(window);
