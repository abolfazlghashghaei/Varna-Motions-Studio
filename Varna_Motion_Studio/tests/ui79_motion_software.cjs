// Exercise the actual old/new renderers in a software compositor, not a mocked
// canvas. Timings are observations; structural assertions prove work reduction.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('playwright'),{launch,prepare,root}=require('./helpers/panel69.cjs');
(async()=>{const h=await launch();await h.browser.close();const browser=await chromium.launch({executablePath:process.env.VARNA_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-accelerated-2d-canvas']});const report={browser:browser.version(),softwareCompositor:true,nativeCEP:false,cases:[]};try{
 const old=new Map(['index.html','js/flow77.js','css/ui/flow77.css','js/liquid48.js'].map(file=>[file,cp.execFileSync('git',['show','ea5579337969d27ba3103bda976dd4801f9296a0:Varna_Motion_Studio/'+file],{cwd:root,maxBuffer:8*1024*1024})]));
 for(const dpr of [1,2])for(const baseline of [true,false]){const context=await browser.newContext({viewport:{width:809,height:580},deviceScaleFactor:dpr}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.stack));
  if(baseline)await p.route('**/*',route=>{const file=new URL(route.request().url()).pathname.slice(1);return old.has(file)?route.fulfill({body:old.get(file),contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html'}):route.continue();});
  await prepare(p,h.url);await p.evaluate(()=>VarnaUI.open('bg'));await p.waitForTimeout(700);await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(150);
  const before=await p.evaluate(()=>{window.pointerStyleWrites79=0;window.watch79=new MutationObserver(rs=>pointerStyleWrites79+=rs.length);watch79.observe(document.body,{attributes:true,attributeFilter:['style']});return VarnaLiquid48.status().paints;});
  for(let i=0;i<20;i++){await p.mouse.move(1+i%3,2+i%3);await p.waitForTimeout(20);}await p.waitForTimeout(100);
  const far=await p.evaluate(before=>({paintDelta:VarnaLiquid48.status().paints-before,bodyStyleWrites:pointerStyleWrites79}),before);
  const point=await p.evaluate(()=>VarnaLiquid48.sample()[80]);for(let i=0;i<35;i++){await p.mouse.move(point.homeX+Math.sin(i*.15)*20,point.homeY+Math.cos(i*.15)*16);await p.waitForTimeout(16);}await p.waitForTimeout(300);
  const near=await p.evaluate(()=>VarnaLiquid48.status()),styles=await p.evaluate(()=>[...document.querySelectorAll('.page.active .card')].map(n=>getComputedStyle(n).backdropFilter));
  if(!baseline){assert.equal(far.paintDelta,0,'irrelevant pointer movement must not redraw V');assert.equal(far.bodyStyleWrites,0,'pointer events must not rewrite body CSS');assert(near.drawCalls<near.particles,'resting glyphs use a cached plane');assert(near.pixelRatio<=1.25,'decorative backing pixels are capped');assert(styles.length>0&&styles.every(x=>x==='none'),'no nested UI backdrop sampling during pointer animation');
   await p.mouse.move(1,1);await p.waitForFunction(()=>!VarnaLiquid48.status().animating);assert.equal(await p.evaluate(()=>VarnaLiquid48.status().displacement),0);
   if(dpr===1){await p.evaluate(()=>VarnaLiquid48.shatterAt(400,300));await p.waitForFunction(()=>VarnaLiquid48.status().phase==='gather');await p.waitForTimeout(500);
    const wave=await p.evaluate(()=>{const ps=VarnaLiquid48.sample(),avg=a=>a.reduce((sum,p)=>sum+p.progress,0)/a.length;return{tip:avg(ps.filter(p=>p.row>.8)),top:avg(ps.filter(p=>p.row<.2)),upright:ps.every(p=>p.rotation===0)};});assert(wave.tip>wave.top,'gather wave starts at the tip');assert(wave.upright,'glyphs never spin on their return');report.wave=wave;
    await p.waitForFunction(()=>!VarnaLiquid48.status().animating,{},{timeout:7000});assert.equal(await p.evaluate(()=>VarnaLiquid48.status().displacement),0);assert.equal(await p.evaluate(()=>VarnaLiquid48.status().returnStyle),'cascade-fold');
   }
  }else{assert(far.paintDelta>0);assert(far.bodyStyleWrites>0);}
  assert.deepEqual(errors,[]);report.cases.push({baseline,dpr,far,near,styles,errors});await context.close();
 }
 // Match live and cached alpha at the end of the actual animation. Controlled
 // browser time samples the final moving frame and the resting frame precisely.
 report.restingPixels=[];
 for(const dpr of [1,2]){const p=await browser.newPage({viewport:{width:809,height:580},deviceScaleFactor:dpr});await prepare(p,h.url);await p.waitForTimeout(400);await p.emulateMedia({reducedMotion:'no-preference'});await p.clock.install({time:new Date('2026-11-13T12:00:00Z')});await p.clock.pauseAt(new Date('2026-11-13T12:00:10Z'));await p.evaluate(()=>VarnaLiquid48.shatterAt(400,300));await p.clock.runFor(5800);
  assert.equal(await p.evaluate(()=>VarnaLiquid48.status().phase),'gather');
  await p.evaluate(()=>{const c=document.getElementById('varnaGlyphs48');window.beforePixels79=c.getContext('2d').getImageData(0,0,c.width,c.height).data;});await p.clock.runFor(50);
  const pixels=await p.evaluate(()=>{const c=document.getElementById('varnaGlyphs48'),b=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let difference=0,count=0;for(let i=3;i<b.length;i+=4)if(b[i]||beforePixels79[i]){difference+=Math.abs(b[i]-beforePixels79[i]);count++;}return{meanAlphaDifference:difference/count,nonemptyPixels:count};});
  assert(pixels.nonemptyPixels>1000);assert(pixels.meanAlphaDifference<1,'no brightness jump from live to cached glyphs');assert.equal(await p.evaluate(()=>VarnaLiquid48.status().phase),'rest');report.restingPixels.push({dpr,...pixels});await p.close();
 }
 const out=path.resolve(root,'../docs/ui79');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'software-motion.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS UI79 actual software-rendered old/new pointer work at 100/200% DPR, cached glyphs, zero pointer CSS writes, bounded backing pixels, tip-first upright gather and exact rest.');
}finally{await browser.close();await h.close();}})().catch(e=>{console.error(e);process.exitCode=1});
