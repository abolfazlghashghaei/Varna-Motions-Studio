(function(w){
'use strict';
const c=document.getElementById('varnaMark'),bg=document.getElementById('varnaAmbient');
if(!c||!bg)return;
const ctx=c.getContext('2d'),ambient=bg.getContext('2d'),letters=Array.from('VАРΝΑᚠᚢᚱᚾᚨ日本語한글بپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی∆ΩλЖЯαβ');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,pts=[];
let until=0,raf=0,active=true,last=0;
const rand=n=>{const x=Math.sin(n*127.17+91.3)*43758.5453;return x-Math.floor(x);};
for(let i=0;i<320;i++){const u=rand(i+20),t=(rand(i+241)-.5)*34,x=i%2?288-u*117+t:40+u*117+t,y=28+u*225;pts.push({x,y,tx:x,ty:y,dx:x,dy:y,ch:letters[i%letters.length],s:8+rand(i+99)*7,a:.38+rand(i+99)*.58});}
for(let i=0;i<170;i++){ambient.font=(11+rand(i+18)*7)+'px Arial';ambient.fillStyle='rgba(182,221,247,'+(.06+rand(i+23)*.12)+')';ambient.fillText(letters[i%letters.length],rand(i+41)*740,rand(i+53)*1180);}
function draw(now){raf=0;if(!active||document.hidden)return;const scatter=now<until,alpha=1-Math.exp(-Math.min(now-last||16,64)/140);last=now;let moving=false;ctx.clearRect(0,0,328,288);ctx.textAlign='center';ctx.textBaseline='middle';
for(const p of pts){const x=scatter?p.dx:p.tx,y=scatter?p.dy:p.ty;p.x+= (x-p.x)*alpha;p.y+=(y-p.y)*alpha;moving=moving||Math.abs(x-p.x)+Math.abs(y-p.y)>.15;ctx.font=p.s+'px Arial';ctx.fillStyle='rgba(187,232,250,'+p.a+')';ctx.fillText(p.ch,p.x,p.y);}
if(!reduced&&(moving||scatter))raf=requestAnimationFrame(draw);}
function start(){if(!raf&&active&&!document.hidden)raf=requestAnimationFrame(draw);}
w.triggerVarnaV=()=>{if(reduced)return;until=performance.now()+5000;for(const p of pts){const a=Math.random()*Math.PI*2,r=45+Math.random()*160;p.dx=164+Math.cos(a)*r;p.dy=144+Math.sin(a)*r*.85;}start();};
c.addEventListener('click',w.triggerVarnaV);c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();w.triggerVarnaV();}});
document.addEventListener('mobile-route63',e=>{active=e.detail==='home';if(!active){cancelAnimationFrame(raf);raf=0;}else start();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();});
start();
})(window);
