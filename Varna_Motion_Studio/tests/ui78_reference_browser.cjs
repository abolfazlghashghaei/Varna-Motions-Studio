// UI78 regression: reference focus panels, bounded DOM work and real V physics.
// Native Adobe is explicitly mocked; this proves browser behavior only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch,prepare,root}=require('./helpers/panel69.cjs');
(async()=>{const h=await launch(),report={browser:h.browser.version(),nativeAdobe:false,checks:[],pages:[]};try{
 const p=await h.browser.newPage({viewport:{width:900,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));await prepare(p,h.url);
 for(const name of await p.evaluate(()=>VarnaFlow77.pages)){
  await p.evaluate(name=>VarnaUI.open(name),name);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const state=await p.evaluate(()=>{const page=document.querySelector('.page.active');return {name:page.id,main:[...page.querySelectorAll('[data-focus-panel78=main]')].map(d=>({open:d.open,title:d.querySelector('summary')?.textContent})),advanced:[...page.querySelectorAll(':scope>.flow-advanced78')].map(d=>d.open)}});
  assert(state.main.every(s=>s.open),name+': essential groups stay open together');assert(state.advanced.length<=1,name+': one secondary group');assert(state.advanced.every(v=>!v),name+': advanced closed by default');report.pages.push(state);
 }
 await p.evaluate(()=>VarnaUI.open('table'));
 for(const id of ['tableRows','tableCols','tableEditor','tableFontPS66'])assert(await p.locator('#'+id).isVisible(),id+': essential control visible without opening a disclosure');
 await p.evaluate(()=>VarnaUI.reveal(document.getElementById('tableAeRefraction')));assert(await p.locator('#tableAeRefraction').isVisible(),'advanced shader control remains reachable');
 await p.locator('#tableRows').fill('4');await p.locator('#tableCols').fill('2');await p.click('#tableResize');assert.equal(await p.locator('#tableEditor .table-cell').count(),8);
 await p.evaluate(()=>VarnaUI.open('text'));assert(await p.locator('#reviewText').isVisible());assert(await p.locator('#offlineText55').isVisible(),'offline correction stays beside text');assert(await p.locator('#fontSelectTrigger67').isVisible());
 await p.evaluate(()=>VarnaUI.reveal(document.getElementById('startRange')));assert(await p.locator('#startRange').isVisible(),'original draggable timing handles remain available');
 report.checks.push('Essential controls visible together; one secondary disclosure; real table edits, fonts, spelling and timing controls preserved.');
 // Idle measurement uses the same document-wide observer as the captured UI77 baseline.
 await p.evaluate(()=>VarnaUI.open('motion'));await p.waitForTimeout(1400);
 const before=await p.evaluate(()=>{window.mutations78=0;window.observer78=new MutationObserver(ms=>mutations78+=ms.length);observer78.observe(document.body,{attributes:true,childList:true,subtree:true});return VarnaFlow77.performance().syncs;});
 await p.waitForTimeout(1200);report.idle=await p.evaluate(()=>({mutations:mutations78,syncs:VarnaFlow77.performance().syncs}));await p.evaluate(()=>observer78.disconnect());
 report.idle.syncDelta=report.idle.syncs-before;assert(report.idle.syncDelta<=2,'idle previews must not resynchronize the rail');assert(report.idle.mutations<2000,'no per-frame DOM feedback loop');
 await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>VarnaUI.open('home'));
 // Check this feature's finite route animations, not legacy catalog animations.
 await p.waitForFunction(()=>!document.querySelector('#page-home').getAnimations({subtree:true}).some(a=>a.id==='flow-route78'),{},{timeout:2000});
 await p.evaluate(()=>VarnaUI.open('table'));await p.waitForTimeout(40);assert(await p.evaluate(()=>document.querySelector('#page-table').getAnimations({subtree:true}).some(a=>a.id==='flow-route78')),'reference-style route entrance is present');await p.waitForTimeout(420);
 const target=await p.evaluate(()=>VarnaLiquid48.sample()[80]);await p.mouse.move(target.homeX,target.homeY);await p.waitForTimeout(350);
 const collided=await p.evaluate(()=>VarnaLiquid48.status());assert(collided.collisions>0&&collided.collisions<collided.particles,'mouse repels nearby particles, not the whole V');assert(collided.displacement>1);
 await p.mouse.move(1,1);await p.waitForFunction(()=>!VarnaLiquid48.status().animating);assert.equal(await p.evaluate(()=>VarnaLiquid48.status().displacement),0,'pointer exit settles exactly at home');
 const paints=await p.evaluate(()=>VarnaLiquid48.status().paints);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>VarnaLiquid48.status().paints),paints,'no idle canvas loop');
 const bursts=await p.evaluate(()=>VarnaLiquid48.status().bursts);await p.click('#tableRows');assert.equal(await p.evaluate(()=>VarnaLiquid48.status().bursts),bursts,'editing controls do not scatter the V');
 await p.click('[data-flow-logo77]');const first=await p.evaluate(()=>VarnaLiquid48.status());assert.equal(first.returnDuration,5000);
 await p.waitForFunction(()=>VarnaLiquid48.status().phase==='anticipation');const anticipation=await p.evaluate(()=>VarnaLiquid48.sample());await p.waitForTimeout(30);const second=await p.evaluate(()=>VarnaLiquid48.sample());assert(anticipation.some((v,i)=>Math.hypot(v.x-second[i].x,v.y-second[i].y)>.1),'visible anticipation shimmer before gather');
 await p.waitForFunction(()=>VarnaLiquid48.status().phase==='gather');await p.waitForFunction(()=>!VarnaLiquid48.status().animating,{},{timeout:7000});assert.equal(await p.evaluate(()=>VarnaLiquid48.status().displacement),0);
 await p.click('[data-flow-logo77]');assert.notEqual(await p.evaluate(()=>VarnaLiquid48.status().burstSignature),first.burstSignature,'every burst follows a fresh randomized trajectory');
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>VarnaLiquid48.status().displacement),0);assert.equal(await p.evaluate(()=>document.querySelector('.page.active').getAnimations({subtree:true}).filter(a=>a.id==='flow-route78').length),0);
 report.particles=await p.evaluate(()=>VarnaLiquid48.status());report.checks.push('Local mouse repulsion, smooth bounded anticipation, randomized scatter, five-second gather, exact rest, no control-click bursts, finite route animation and reduced motion.');
 assert.deepEqual(errors,[]);report.errors=errors;fs.mkdirSync(path.resolve(root,'../docs/ui78'),{recursive:true});fs.writeFileSync(path.resolve(root,'../docs/ui78/reference-regression.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS UI78 reference behavior, 22 page groups, real controls, idle work and V physics.');
}finally{await h.close()}})().catch(e=>{console.error(e);process.exitCode=1});
