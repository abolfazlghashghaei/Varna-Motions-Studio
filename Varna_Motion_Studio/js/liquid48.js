(function(w){'use strict';
function init(){
const paths={
 home:'M3 10 12 3l9 7v10H3Z M9 20v-7h6v7',
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
document.querySelectorAll('.production-main47>button').forEach((b,i)=>{const label=document.createElement('span');label.className='nav-label48';label.textContent=b.textContent;b.replaceChildren(icon(b.dataset.flow47||names[i]),label);b.title=label.textContent;b.setAttribute('aria-label',label.textContent);});
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
let particles=[],width=0,height=0,raf=0,last=0,paintCount=0,burstCount=0,color='',opacity=.4,burstStart=0,pointerUntil=0,burstSignature='',layoutKey='';const sprites=new Map(),scatterDuration=800,returnDuration=5000,burstDuration=scatterDuration+returnDuration;
let mouse={x:.65,y:.25},target={x:.65,y:.25};
function random(){if(w.crypto&&w.crypto.getRandomValues){const v=new Uint32Array(1);w.crypto.getRandomValues(v);return v[0]/4294967296;}return Math.random();}
function request(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
function palette(){const s=getComputedStyle(document.body);color=s.getPropertyValue('--v48-glyph').trim()||'#9dbdff';opacity=parseFloat(s.getPropertyValue('--v48-glyph-opacity'))||.4;sprites.clear();request();}
function sprite(glyph,size){const key=glyph+':'+size;if(sprites.has(key))return sprites.get(key);const side=Math.ceil(size*2.6),dpr=Math.min(2,w.devicePixelRatio||1),c=document.createElement('canvas');c.width=c.height=Math.ceil(side*dpr);const s=c.getContext('2d');s.scale(dpr,dpr);s.fillStyle=color;s.textAlign='center';s.textBaseline='middle';s.font='700 '+size+'px "Segoe UI", "Vazirmatn", "Nirmala UI", "Yu Gothic", sans-serif';s.fillText(glyph,side/2,side/2);const entry={canvas:c,side};sprites.set(key,entry);return entry;}
function resize(){const work=document.querySelector('#workspace').getBoundingClientRect(),key=[w.innerWidth,w.innerHeight,work.left,work.width].join(':');if(key===layoutKey)return;layoutKey=key;width=w.innerWidth;height=w.innerHeight;const dpr=Math.min(2,w.devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);particles=[];burstStart=0;const size=Math.min(work.width*.78,height*.72,690),cx=work.left+work.width*.5,cy=height*.49,rows=30;
 for(let row=0;row<rows;row++){const t=row/(rows-1),y=cy-size*.43+t*size*.86;for(const side of [-1,1])for(let j=0;j<7;j++){if(row===rows-1&&side===1)continue;const x=cx+side*(size*.39*(1-t))+(j-3)*size*.022;particles.push({x,y,homeX:x,homeY:y,glyph:glyphs[(row*7+j*3+(side===1?2:0))%glyphs.length],size:Math.max(10,size*.026),rotation:0});}}
 sprites.clear();last=0;request();}
function position(p,now){
 if(!burstStart||reduced.matches||now-burstStart>=burstDuration){p.x=p.homeX;p.y=p.homeY;p.rotation=0;return;}
 const elapsed=Math.max(0,now-burstStart);
 if(elapsed<scatterDuration){const u=1-Math.pow(1-elapsed/scatterDuration,3);p.x=p.sx+(p.peakX-p.sx)*u;p.y=p.sy+(p.peakY-p.sy)*u;p.rotation=p.spin*u;}
 else{const u=(elapsed-scatterDuration)/returnDuration,decay=Math.pow(1-u,3),spring=decay*Math.cos(u*Math.PI*2.3),curl=Math.sin(u*Math.PI*2)*Math.pow(1-u,2)*p.curl;
 const dx=p.peakX-p.homeX,dy=p.peakY-p.homeY;p.x=p.homeX+dx*spring-dy*curl;p.y=p.homeY+dy*spring+dx*curl;p.rotation=p.spin*spring;}
}
function frame(now){raf=0;if(document.hidden)return;const dt=Math.min(2,last?(now-last)/16.667:1);last=now;const ease=1-Math.pow(.83,dt);mouse.x+=(target.x-mouse.x)*ease;mouse.y+=(target.y-mouse.y)*ease;if(now>pointerUntil){mouse.x=target.x;mouse.y=target.y;}document.body.style.setProperty('--v48-mouse-x',(mouse.x*100).toFixed(2)+'%');document.body.style.setProperty('--v48-mouse-y',(mouse.y*100).toFixed(2)+'%');ctx.clearRect(0,0,width,height);ctx.globalAlpha=opacity;let moving=now<pointerUntil||!!(burstStart&&!reduced.matches&&now-burstStart<burstDuration);
 const dx=reduced.matches?0:(mouse.x-.5)*16,dy=reduced.matches?0:(mouse.y-.5)*16;
 for(const p of particles){position(p,now);const g=sprite(p.glyph,p.size);if(p.rotation){ctx.save();ctx.translate(p.x+dx,p.y+dy);ctx.rotate(p.rotation);ctx.drawImage(g.canvas,-g.side/2,-g.side/2,g.side,g.side);ctx.restore();}else ctx.drawImage(g.canvas,p.x+dx-g.side/2,p.y+dy-g.side/2,g.side,g.side);}
 paintCount++;if(moving)request();else last=0;
}
document.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;target.x=Math.max(0,Math.min(1,e.clientX/Math.max(1,width)));target.y=Math.max(0,Math.min(1,e.clientY/Math.max(1,height)));pointerUntil=performance.now()+800;request();},{passive:true});
document.addEventListener('click',e=>{if(reduced.matches||!document.getElementById('startup49')?.hidden)return;const rect=e.target.getBoundingClientRect?.(),x=e.detail?e.clientX:rect?rect.left+rect.width/2:width/2,y=e.detail?e.clientY:rect?rect.top+rect.height/2:height/2,now=performance.now();
 for(const p of particles){position(p,now);p.sx=p.x;p.sy=p.y;const angle=Math.atan2(p.y-y,p.x-x)+(random()-.5)*Math.PI*1.7,strength=45+random()*Math.min(width,height)*.38;p.peakX=p.homeX+Math.cos(angle)*strength;p.peakY=p.homeY+Math.sin(angle)*strength;p.spin=(random()-.5)*Math.PI*2;p.curl=(random()-.5)*.9;}
 burstSignature=particles.slice(0,4).map(p=>[p.peakX.toFixed(2),p.peakY.toFixed(2),p.spin.toFixed(3)].join(':')).join('|');burstStart=now;burstCount++;request();},{passive:true,capture:true});
new MutationObserver(palette).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
const motionChange=()=>{if(reduced.matches){target={x:.65,y:.25};mouse={...target};burstStart=0;pointerUntil=0;}request();};if(reduced.addEventListener)reduced.addEventListener('change',motionChange);else reduced.addListener(motionChange);
w.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else request();});palette();resize();
w.VarnaLiquid48={status:()=>({particles:particles.length,paints:paintCount,bursts:burstCount,animating:!!raf,reduced:reduced.matches,burstDuration,returnDuration,burstSignature,displacement:Math.max(0,...particles.map(p=>Math.hypot(p.x-p.homeX,p.y-p.homeY)))}),icon};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
