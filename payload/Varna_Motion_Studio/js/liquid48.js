(function(w){'use strict';
function init(){
const paths={
 home:'M3 3h7v7H3Z M14 3h7v7h-7Z M3 14h7v7H3Z M14 14h7v7h-7Z',
 text:'M4 5h16M12 5v15M8 20h8 M4 10h3M17 10h3',
 background:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M3 15l5-5 7 7 3-3 3 3 M16 7h.01',
 table:'M3 4h18v16H3Z M3 9h18M3 14h18M9 4v16M15 4v16',
 video:'M3 5h18v15H3Z M3 10h18M7 5l3 5M14 5l3 5 M10 13l5 2-5 3Z',
 sound:'M3 10v4M7 6v12M12 3v18M17 7v10M21 10v4',
 brand:'m12 3 9 5v8l-9 5-9-5V8Z M3 8l9 5 9-5M12 13v8',
 settings:'M4 6h16M4 12h16M4 18h16 M8 3v6M16 9v6M10 15v6',
 info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 10v7M12 7h.01',
 left:'M4 3v18M8 6h12v4H8ZM8 14h8v4H8Z',
 center:'M12 3v18M4 6h16v4H4ZM7 14h10v4H7Z',
 right:'M20 3v18M4 6h12v4H4ZM8 14h8v4H8Z',
 top:'M3 4h18M6 8h4v12H6ZM14 8h4v8h-4Z',
 middle:'M3 12h18M6 4h4v16H6ZM14 7h4v10h-4Z',
 bottom:'M3 20h18M6 4h4v12H6ZM14 8h4v8h-4Z'
};
function icon(name){const el=document.createElement('span');el.className='varna-icon48';el.setAttribute('aria-hidden','true');el.innerHTML='<svg viewBox="0 0 24 24" focusable="false"><path d="'+(paths[name]||paths.settings)+'"/></svg>';return el;}
w.VarnaIcons48={icon};document.body.classList.add('liquid48');
const names=['home','text','background','table','video','sound','brand','settings','info'];
document.querySelectorAll('.production-main47>button').forEach((b,i)=>{const label=document.createElement('span');label.className='nav-label48';label.textContent=b.textContent;b.replaceChildren(icon(b.dataset.flow47||(b.id==='openVarnaInfo47'?'info':'home')),label);b.title=label.textContent;b.setAttribute('aria-label',label.textContent);});
document.querySelectorAll('#page-home .launcher-tile').forEach((b,i)=>{const title=b.querySelector('strong');if(!title)return;const name=Object.keys(w.VarnaProduction47.flows)[i];b.replaceChildren(icon(name),title);b.setAttribute('aria-label',title.textContent);});
document.querySelectorAll('[data-align-icon48]').forEach(b=>b.replaceChildren(icon(b.dataset.alignIcon48)));
const head=document.querySelector('#page-home .page-head');if(head)head.remove();
document.querySelectorAll('#page-home .launcher-intro p').forEach(el=>el.remove());
const atmosphere=document.createElement('div'),canvas=document.createElement('canvas');atmosphere.id='varnaAtmosphere48';atmosphere.setAttribute('aria-hidden','true');canvas.id='varnaGlyphs48';atmosphere.append(canvas);document.body.prepend(atmosphere);
const ctx=canvas.getContext('2d'),reduced=w.matchMedia('(prefers-reduced-motion: reduce)');
// V equivalents and transliterations across several scripts, not a claim of a V in every language.
const glyphProbe=document.createElement('canvas');glyphProbe.width=glyphProbe.height=36;const probe=glyphProbe.getContext('2d',{willReadFrequently:true});
function glyphFingerprint(glyph){probe.clearRect(0,0,36,36);probe.font='500 22px "Segoe UI", "Vazirmatn", "Nirmala UI", "Yu Gothic", sans-serif';probe.fillText(glyph,2,27);return Array.from(probe.getImageData(0,0,36,36).data).join(',');}
const missing=glyphFingerprint('\u{10FFFF}'),glyphs=['V','v','Ⅴ','ν','В','в','ڤ','و','व','ヴ','ვ','Վ','브'].filter(g=>glyphFingerprint(g)!==missing);
let particles=[],width=0,height=0,raf=0,last=0,paintCount=0,burstCount=0,color='',opacity=.4,burstStart=0,burstSignature='',layoutKey='';
const sprites=new Map(),scatterDuration=600,anticipationDuration=220,returnDuration=5000,burstDuration=scatterDuration+anticipationDuration+returnDuration;
let pointer={x:-1000,y:-1000,active:false},collisionCount=0,phase='rest',frameMs=0,framePeakMs=0;
function request(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
function palette(){const s=getComputedStyle(document.body);color=s.getPropertyValue('--v48-glyph').trim()||'#9dbdff';opacity=parseFloat(s.getPropertyValue('--v48-glyph-opacity'))||.4;sprites.clear();request();}
function sprite(glyph,size){const key=glyph+':'+size;if(sprites.has(key))return sprites.get(key);const side=Math.ceil(size*2.6),dpr=Math.min(2,w.devicePixelRatio||1),c=document.createElement('canvas');c.width=c.height=Math.ceil(side*dpr);const s=c.getContext('2d');s.scale(dpr,dpr);s.fillStyle=color;s.textAlign='center';s.textBaseline='middle';s.font='700 '+size+'px "Segoe UI", "Vazirmatn", "Nirmala UI", "Yu Gothic", sans-serif';s.fillText(glyph,side/2,side/2);const entry={canvas:c,side};sprites.set(key,entry);return entry;}
function resize(){const work=document.querySelector('#workspace').getBoundingClientRect(),key=[w.innerWidth,w.innerHeight,work.left,work.width].join(':');if(key===layoutKey)return;layoutKey=key;width=w.innerWidth;height=w.innerHeight;const dpr=Math.min(2,w.devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);particles=[];burstStart=0;phase='rest';const size=Math.min(work.width*.78,height*.72,690),cx=work.left+work.width*.5,cy=height*.49,rows=30;
 for(let row=0;row<rows;row++){const t=row/(rows-1),y=cy-size*.43+t*size*.86;for(const side of [-1,1])for(let j=0;j<7;j++){if(row===rows-1&&side===1)continue;const x=cx+side*(size*.39*(1-t))+(j-3)*size*.022;particles.push({x,y,homeX:x,homeY:y,ox:0,oy:0,glyph:glyphs[(row*7+j*3+(side===1?2:0))%glyphs.length],size:Math.max(10,size*.026),rotation:0,seed:row*1.7+j*.81});}}
 sprites.clear();last=0;request();}
function smooth(t){return t*t*(3-2*t);}
function position(p,now){
 if(!burstStart||reduced.matches||now-burstStart>=burstDuration){p.x=p.homeX;p.y=p.homeY;p.rotation=0;return;}
 const elapsed=Math.max(0,now-burstStart);
 if(elapsed<scatterDuration){const u=1-Math.pow(1-elapsed/scatterDuration,3);p.x=p.sx+(p.peakX-p.sx)*u;p.y=p.sy+(p.peakY-p.sy)*u;p.rotation=p.spin*u;}
 else if(elapsed<scatterDuration+anticipationDuration){
  // A bounded anticipation shimmer has zero offset at both endpoints, so the
  // gather starts continuously rather than receiving a random velocity jolt.
  const u=(elapsed-scatterDuration)/anticipationDuration,a=Math.pow(Math.sin(u*Math.PI),2)*2.2;
  p.x=p.peakX+Math.sin(u*Math.PI*4+p.seed)*a;p.y=p.peakY+Math.cos(u*Math.PI*4+p.seed)*a;p.rotation=p.spin;
 } else {const u=(elapsed-scatterDuration-anticipationDuration)/returnDuration,k=1-smooth(u),arc=Math.sin(u*Math.PI)*Math.pow(1-u,2)*p.curl;
  const dx=p.peakX-p.homeX,dy=p.peakY-p.homeY;p.x=p.homeX+dx*k-dy*arc;p.y=p.homeY+dy*k+dx*arc;p.rotation=p.spin*k;
 }
}
function currentPhase(now){if(!burstStart||reduced.matches||now-burstStart>=burstDuration)return 'rest';const t=now-burstStart;return t<scatterDuration?'scatter':t<scatterDuration+anticipationDuration?'anticipation':'gather';}
function frame(now){raf=0;if(document.hidden)return;const began=performance.now(),dt=Math.min(2,last?(now-last)/16.667:1);last=now;phase=currentPhase(now);let moving=phase!=='rest';collisionCount=0;
 ctx.clearRect(0,0,width,height);ctx.globalAlpha=opacity;
 const radius=Math.max(52,Math.min(110,width*.13)),radius2=radius*radius;
 for(const p of particles){
  position(p,now);let tx=0,ty=0;
  if(pointer.active&&!reduced.matches&&phase==='rest'){
   const dx=p.homeX-pointer.x,dy=p.homeY-pointer.y,d2=dx*dx+dy*dy;
   if(d2<radius2){const d=Math.sqrt(d2)||.1,force=Math.pow(1-d/radius,2)*34;tx=(d2?dx/d:Math.cos(p.seed))*force;ty=(d2?dy/d:Math.sin(p.seed))*force;collisionCount++;}
  }
  const ease=1-Math.pow((tx||ty)? .78 : .84,dt);p.ox+=(tx-p.ox)*ease;p.oy+=(ty-p.oy)*ease;
  if(Math.abs(tx-p.ox)+Math.abs(ty-p.oy)>.035)moving=true;else {p.ox=tx;p.oy=ty;}
  const g=sprite(p.glyph,p.size),x=p.x+p.ox,y=p.y+p.oy;
  if(p.rotation){ctx.save();ctx.translate(x,y);ctx.rotate(p.rotation);ctx.drawImage(g.canvas,-g.side/2,-g.side/2,g.side,g.side);ctx.restore();}else ctx.drawImage(g.canvas,x-g.side/2,y-g.side/2,g.side,g.side);
 }
 paintCount++;const cost=performance.now()-began;frameMs=frameMs?frameMs*.95+cost*.05:cost;framePeakMs=Math.max(framePeakMs,cost);
 if(moving)request();else last=0;
}
let gradientAt=0;
document.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;pointer={x:e.clientX,y:e.clientY,active:true};
 // Particle response stays frame-synchronous. The much larger CSS gradient only
 // follows at a low frequency, and is never rewritten by the gather animation.
 const now=performance.now();if(now-gradientAt>80){gradientAt=now;document.body.style.setProperty('--v48-mouse-x',(e.clientX/Math.max(1,width)*100).toFixed(1)+'%');document.body.style.setProperty('--v48-mouse-y',(e.clientY/Math.max(1,height)*100).toFixed(1)+'%');}
 request();},{passive:true});
function leave(){pointer.active=false;request();}
document.documentElement.addEventListener('pointerleave',leave);w.addEventListener('blur',leave);
function shatter(x,y){if(reduced.matches)return;
 const seed=new Uint32Array(1);if(w.crypto?.getRandomValues)w.crypto.getRandomValues(seed);else seed[0]=Math.floor(Math.random()*4294967296);let state=seed[0]||1;
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
 const now=performance.now();for(const p of particles){position(p,now);p.sx=p.x+p.ox;p.sy=p.y+p.oy;p.ox=p.oy=0;
  const angle=Math.atan2(p.y-y,p.x-x)+(random()-.5)*Math.PI*1.7,strength=45+random()*Math.min(width,height)*.32;
  p.peakX=p.homeX+Math.cos(angle)*strength;p.peakY=p.homeY+Math.sin(angle)*strength;p.spin=(random()-.5)*Math.PI*.7;p.curl=(random()-.5)*.22;
 }
 burstSignature=particles.slice(0,4).map(p=>[p.peakX.toFixed(2),p.peakY.toFixed(2),p.spin.toFixed(3)].join(':')).join('|');burstStart=now;burstCount++;request();
}
document.addEventListener('click',e=>{if(reduced.matches||!document.getElementById('startup49')?.hidden)return;
 // UI78 follows the uploaded prototype: empty background/logo clicks scatter;
 // editing, navigation and playback controls never trigger a second animation.
 if(document.documentElement.hasAttribute('data-ui77')&&!e.target.closest('[data-flow-logo77]')&&e.target.closest('button,input,select,textarea,a,summary,label,[role=button],.card,.flat-section69,.flow-task77,.flat-nav69,.topbar,.flat-actions69,.flow-hero77,dialog'))return;
 const rect=e.target.getBoundingClientRect?.(),x=e.detail?e.clientX:rect?rect.left+rect.width/2:width/2,y=e.detail?e.clientY:rect?rect.top+rect.height/2:height/2;shatter(x,y);
},{passive:true,capture:true});
document.addEventListener('varna:palette50',palette);new MutationObserver(palette).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
const motionChange=()=>{if(reduced.matches){burstStart=0;pointer.active=false;for(const p of particles)p.ox=p.oy=0;}request();};if(reduced.addEventListener)reduced.addEventListener('change',motionChange);else reduced.addListener(motionChange);
w.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else request();});palette();resize();
w.VarnaLiquid48={refresh:palette,shatterAt:shatter,sample:()=>particles.map(p=>({x:p.x+p.ox,y:p.y+p.oy,homeX:p.homeX,homeY:p.homeY})),status:()=>({particles:particles.length,paints:paintCount,bursts:burstCount,animating:!!raf,reduced:reduced.matches,phase,collisions:collisionCount,frameMs,framePeakMs,burstDuration,anticipationDuration,returnDuration,burstSignature,displacement:Math.max(0,...particles.map(p=>Math.hypot(p.x+p.ox-p.homeX,p.y+p.oy-p.homeY)))}),icon};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
