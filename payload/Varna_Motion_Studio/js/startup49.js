/* Runs before the panel scripts: startup never hides an initialization failure. */
(function(w){'use strict';
let ui=false,host=false,error='',timer=0;const started=Date.now();
const boot=w.VarnaBoot49={phase:'loading',uiReady(){ui=true;update();},hostReady(message){host=true;error=message||'';update();},fail(message){error=message||'راه‌اندازی کامل نشد';boot.phase='error';update();}};
function update(){
 const root=document.getElementById('startup49');if(!root)return;
 const label=document.getElementById('startupStatus49');
 if(boot.phase==='error'){label.textContent=error;document.getElementById('startupContinue49').hidden=false;return;}
 label.textContent=ui?(host?'آماده':'اتصال به پروژهٔ افتر…'):'آماده‌سازی وارنا…';
 if(ui&&host){clearTimeout(timer);timer=setTimeout(finish,Math.max(0,900-(Date.now()-started)));}
}
function finish(){if(boot.phase!=='loading')return;boot.phase='ready';const root=document.getElementById('startup49');root.hidden=true;const shell=document.querySelector('.app-shell');shell.inert=false;shell.removeAttribute('aria-hidden');document.dispatchEvent(new CustomEvent('varna:startup49',{detail:{error}}));}
document.addEventListener('DOMContentLoaded',()=>{
 const shell=document.querySelector('.app-shell'),loading=boot.phase!=='ready';shell.inert=loading;if(loading)shell.setAttribute('aria-hidden','true');else shell.removeAttribute('aria-hidden');
 const root=document.getElementById('startup49');root.tabIndex=-1;if(loading)root.focus();
 document.getElementById('startupContinue49').onclick=()=>location.reload();
 setTimeout(()=>{if(boot.phase==='loading'){document.getElementById('startupStatus49').textContent='اتصال به افتر بیشتر طول کشید';document.getElementById('startupContinue49').hidden=false;}},10000);
 update();
});
// Older CEP builds ignore inert. Keep shortcuts and tab focus on the loading screen.
document.addEventListener('keydown',e=>{if(boot.phase==='ready')return;const retry=document.getElementById('startupContinue49');if(e.key==='Tab'){e.preventDefault();(retry&&!retry.hidden?retry:document.getElementById('startup49'))?.focus();}if(e.target!==retry||e.key!=='Enter'&&e.key!==' '){e.stopImmediatePropagation();}},true);
})(window);
