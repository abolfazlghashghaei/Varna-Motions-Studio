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
// UI79 renderer: cache the resting sculpture; animate only the pointer's local
// neighborhood. Pointer events never change CSS or query layout/style.
let particles=[],width=0,height=0,raf=0,last=0,paintCount=0,burstCount=0,color='',opacity=.4,burstStart=0,burstSignature='',layoutKey='';
const sprites=new Map(),buckets=new Map(),restCanvas=document.createElement('canvas'),restContext=restCanvas.getContext('2d');
const scatterDuration=600,anticipationDuration=220,returnDuration=5000,burstDuration=scatterDuration+anticipationDuration+returnDuration,cellSize=80;
let pointer={x:-1000,y:-1000,active:false},collisionCount=0,phase='rest',frameMs=0,framePeakMs=0,pixelRatio=1,radius=80;
let activeParticles=[],restKey=null,restBounds={left:0,top:0,width:1,height:1},staticBuilds=0,drawCalls=0,pointerEvents=0;
function request(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
function sprite(glyph,size){const key=glyph+':'+size;if(sprites.has(key))return sprites.get(key);const side=Math.ceil(size*2.6),c=document.createElement('canvas');c.width=c.height=Math.ceil(side*pixelRatio);const s=c.getContext('2d');s.scale(pixelRatio,pixelRatio);s.fillStyle=color;s.textAlign='center';s.textBaseline='middle';s.font='700 '+size+'px "Segoe UI", "Vazirmatn", "Nirmala UI", "Yu Gothic", sans-serif';s.fillText(glyph,side/2,side/2);const entry={canvas:c,side};sprites.set(key,entry);return entry;}
function palette(){const s=getComputedStyle(document.body);color=s.getPropertyValue('--v48-glyph').trim()||'#9dbdff';opacity=parseFloat(s.getPropertyValue('--v48-glyph-opacity'))||.4;sprites.clear();for(const p of particles)p.art=sprite(p.glyph,p.size);restKey=null;request();}
function resize(){const work=document.querySelector('#workspace').getBoundingClientRect(),key=[w.innerWidth,w.innerHeight,work.left,work.width,w.devicePixelRatio].join(':');if(key===layoutKey)return;layoutKey=key;width=w.innerWidth;height=w.innerHeight;
 // Decorative artwork needs fewer pixels than the text/UI. The cap also bounds
 // the offscreen copies on high-DPI CEP panels and software compositors.
 pixelRatio=Math.min(1.25,w.devicePixelRatio||1);canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
 particles=[];activeParticles=[];buckets.clear();sprites.clear();burstStart=0;phase='rest';radius=Math.max(52,Math.min(100,width*.12));
 const size=Math.min(work.width*.78,height*.72,690),cx=work.left+work.width*.5,cy=height*.49,rows=30;
 for(let row=0;row<rows;row++){const t=row/(rows-1),y=cy-size*.43+t*size*.86;for(const side of [-1,1])for(let j=0;j<7;j++){if(row===rows-1&&side===1)continue;const x=cx+side*(size*.39*(1-t))+(j-3)*size*.022;
  const p={index:particles.length,x,y,homeX:x,homeY:y,ox:0,oy:0,glyph:glyphs[(row*7+j*3+(side===1?2:0))%glyphs.length],size:Math.max(10,size*.026),rotation:0,seed:row*1.7+j*.81,row:t,side,progress:1};p.art=sprite(p.glyph,p.size);particles.push(p);
  const bucket=Math.floor(x/cellSize)+':'+Math.floor(y/cellSize);if(!buckets.has(bucket))buckets.set(bucket,[]);buckets.get(bucket).push(p);
 }}
 const left=Math.floor(Math.min(...particles.map(p=>p.homeX-p.art.side/2))*pixelRatio)/pixelRatio,top=Math.floor(Math.min(...particles.map(p=>p.homeY-p.art.side/2))*pixelRatio)/pixelRatio;
 restBounds={left,top,width:Math.ceil((Math.max(...particles.map(p=>p.homeX+p.art.side/2))-left)*pixelRatio)/pixelRatio,height:Math.ceil((Math.max(...particles.map(p=>p.homeY+p.art.side/2))-top)*pixelRatio)/pixelRatio};
 restCanvas.width=Math.ceil(restBounds.width*pixelRatio);restCanvas.height=Math.ceil(restBounds.height*pixelRatio);restContext.setTransform(pixelRatio,0,0,pixelRatio,0,0);restKey=null;last=0;request();}
function candidates(x,y){const cx=Math.floor(x/cellSize),cy=Math.floor(y/cellSize),n=Math.ceil(radius/cellSize),found=[];for(let ix=cx-n;ix<=cx+n;ix++)for(let iy=cy-n;iy<=cy+n;iy++){const group=buckets.get(ix+':'+iy);if(group)found.push(...group);}return found;}
function position(p,now){
 if(!burstStart||reduced.matches||now-burstStart>=burstDuration){p.x=p.homeX;p.y=p.homeY;p.rotation=0;p.progress=1;return;}
 const elapsed=Math.max(0,now-burstStart);p.rotation=0;
 if(elapsed<scatterDuration){const u=1-Math.pow(1-elapsed/scatterDuration,3);p.x=p.sx+(p.peakX-p.sx)*u;p.y=p.sy+(p.peakY-p.sy)*u;p.progress=0;}
 else if(elapsed<scatterDuration+anticipationDuration){const u=(elapsed-scatterDuration)/anticipationDuration,a=Math.pow(Math.sin(u*Math.PI),2)*1.6;p.x=p.peakX+Math.sin(u*Math.PI*4+p.seed)*a;p.y=p.peakY+Math.cos(u*Math.PI*4+p.seed)*a;p.progress=0;}
 else {
  // Fold back along two arms in a wave from the tip upwards. Each glyph follows
  // a non-looping cubic curve, decelerates into place, and keeps its orientation.
  const elapsedReturn=elapsed-scatterDuration-anticipationDuration,u=Math.max(0,Math.min(1,(elapsedReturn-p.returnDelay)/(returnDuration-p.returnDelay))),t=1-Math.pow(1-u,3),k=1-t;
  p.x=k*k*k*p.peakX+3*k*k*t*p.foldX+3*k*t*t*p.approachX+t*t*t*p.homeX;
  p.y=k*k*k*p.peakY+3*k*k*t*p.foldY+3*k*t*t*p.approachY+t*t*t*p.homeY;p.progress=t;
 }
}
function currentPhase(now){if(!burstStart||reduced.matches||now-burstStart>=burstDuration)return 'rest';const t=now-burstStart;return t<scatterDuration?'scatter':t<scatterDuration+anticipationDuration?'anticipation':'gather';}
function draw(context,p,x,y){const g=p.art;context.drawImage(g.canvas,x-g.side/2,y-g.side/2,g.side,g.side);}
// Cache alpha and backing-pixel alignment match live glyph drawing, so joining
// the cached resting plane does not change brightness or sharpness.
function restingImage(active){const key=active.map(p=>p.index).join(',');if(key===restKey)return;restKey=key;staticBuilds++;const excluded=new Set(active);restContext.clearRect(0,0,restBounds.width,restBounds.height);restContext.globalAlpha=opacity;for(const p of particles)if(!excluded.has(p))draw(restContext,p,p.homeX-restBounds.left,p.homeY-restBounds.top);}
function frame(now){raf=0;if(document.hidden)return;const began=performance.now(),dt=Math.min(64,last?now-last:16.667);last=now;const previousPhase=phase;phase=currentPhase(now);if(phase==='rest'&&previousPhase!=='rest'){for(const p of particles){p.x=p.homeX;p.y=p.homeY;p.rotation=0;p.progress=1;}activeParticles=[];restKey=null;}let moving=phase!=='rest';collisionCount=0;drawCalls=0;
 ctx.clearRect(0,0,width,height);ctx.globalAlpha=opacity;
 if(phase==='rest'){
  const region=new Set(!reduced.matches&&pointer.active?candidates(pointer.x,pointer.y):[]);for(const p of activeParticles)if(p.ox||p.oy)region.add(p);activeParticles=Array.from(region).sort((a,b)=>a.index-b.index);
  const ease=1-Math.exp(-dt/38),r2=radius*radius;
  for(const p of activeParticles){p.x=p.homeX;p.y=p.homeY;p.progress=1;let tx=0,ty=0;
   if(pointer.active&&!reduced.matches){const dx=p.homeX-pointer.x,dy=p.homeY-pointer.y,d2=dx*dx+dy*dy;if(d2<r2){const d=Math.sqrt(d2)||.1,force=Math.pow(1-d/radius,2)*25;tx=(d2?dx/d:Math.cos(p.seed))*force;ty=(d2?dy/d:Math.sin(p.seed))*force;collisionCount++;}}
   p.ox+=(tx-p.ox)*ease;p.oy+=(ty-p.oy)*ease;if(Math.abs(tx-p.ox)+Math.abs(ty-p.oy)>.035)moving=true;else {p.ox=tx;p.oy=ty;}
  }
  if(!moving&&!pointer.active)activeParticles=[];
  restingImage(activeParticles);ctx.globalAlpha=1;ctx.drawImage(restCanvas,restBounds.left,restBounds.top,restBounds.width,restBounds.height);ctx.globalAlpha=opacity;drawCalls++;
  for(const p of activeParticles){draw(ctx,p,p.x+p.ox,p.y+p.oy);drawCalls++;}
 } else {restKey=null;for(const p of particles){position(p,now);draw(ctx,p,p.x,p.y);drawCalls++;}}
 paintCount++;const cost=performance.now()-began;frameMs=frameMs?frameMs*.95+cost*.05:cost;framePeakMs=Math.max(framePeakMs,cost);if(moving)request();else last=0;
}
document.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;pointerEvents++;const wasActive=pointer.active,r2=radius*radius;
 pointer={x:e.clientX,y:e.clientY,active:candidates(e.clientX,e.clientY).some(p=>{const dx=p.homeX-e.clientX,dy=p.homeY-e.clientY;return dx*dx+dy*dy<r2;})};
 if(pointer.active||wasActive||phase!=='rest')request();
},{passive:true});
function leave(){const needed=pointer.active||activeParticles.some(p=>p.ox||p.oy);pointer.active=false;if(needed)request();}
document.documentElement.addEventListener('pointerleave',leave);w.addEventListener('blur',leave);
function shatter(x,y){if(reduced.matches)return;const seed=new Uint32Array(1);if(w.crypto?.getRandomValues)w.crypto.getRandomValues(seed);else seed[0]=Math.floor(Math.random()*4294967296);let state=seed[0]||1;
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;},now=performance.now();
 for(const p of particles){position(p,now);p.sx=p.x+p.ox;p.sy=p.y+p.oy;p.ox=p.oy=0;
  const angle=Math.atan2(p.y-y,p.x-x)+(random()-.5)*Math.PI*1.7,strength=40+random()*Math.min(width,height)*.25;
  p.peakX=p.homeX+Math.cos(angle)*strength;p.peakY=p.homeY+Math.sin(angle)*strength;
  p.returnDelay=(1-p.row)*1050+random()*100;p.foldX=p.peakX+(p.homeX-p.peakX)*.65+p.side*24;p.foldY=p.peakY+(p.homeY-p.peakY)*.2;
  p.approachX=p.homeX+p.side*14;p.approachY=p.homeY+20;p.progress=0;
 }
 burstSignature=particles.slice(0,4).map(p=>[p.peakX.toFixed(2),p.peakY.toFixed(2),p.returnDelay.toFixed(2)].join(':')).join('|');burstStart=now;burstCount++;restKey=null;request();
}
document.addEventListener('click',e=>{if(reduced.matches||!document.getElementById('startup49')?.hidden)return;
 if(document.documentElement.hasAttribute('data-ui77')&&!e.target.closest('[data-flow-logo77]')&&e.target.closest('button,input,select,textarea,a,summary,label,[role=button],.card,.flat-section69,.flow-task77,.flat-nav69,.topbar,.flat-actions69,.flow-hero77,dialog'))return;
 const rect=e.target.getBoundingClientRect?.(),x=e.detail?e.clientX:rect?rect.left+rect.width/2:width/2,y=e.detail?e.clientY:rect?rect.top+rect.height/2:height/2;shatter(x,y);
},{passive:true,capture:true});
document.addEventListener('varna:palette50',palette);new MutationObserver(palette).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
const motionChange=()=>{if(reduced.matches){burstStart=0;pointer.active=false;for(const p of particles)p.ox=p.oy=0;restKey=null;}request();};if(reduced.addEventListener)reduced.addEventListener('change',motionChange);else reduced.addListener(motionChange);
w.addEventListener('resize',resize);new ResizeObserver(resize).observe(document.getElementById('workspace'));document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else request();});palette();resize();
w.VarnaLiquid48={refresh:palette,shatterAt:shatter,sample:()=>particles.map(p=>({x:p.x+p.ox,y:p.y+p.oy,homeX:p.homeX,homeY:p.homeY,row:p.row,progress:p.progress,rotation:p.rotation})),status:()=>({particles:particles.length,paints:paintCount,bursts:burstCount,animating:!!raf,reduced:reduced.matches,phase,collisions:collisionCount,frameMs,framePeakMs,burstDuration,anticipationDuration,returnDuration,returnStyle:'cascade-fold',drawCalls,staticBuilds,pointerEvents,pixelRatio,gradientWrites:0,burstSignature,displacement:Math.max(0,...particles.map(p=>Math.hypot(p.x+p.ox-p.homeX,p.y+p.oy-p.homeY)))}),icon};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
