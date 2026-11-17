// Real UI and actual panel state/bridge queue; Adobe execution is explicitly mocked.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch,measure,root}=require('./helpers/panel69.cjs');
(async()=>{const h=await launch({cep99:true}),report={browser:h.browser.version(),nativeAdobe:false,cases:0,failures:[],errors:[]};try{
 const p=await h.browser.newPage({viewport:{width:900,height:700}});p.setDefaultTimeout(12000);p.on('pageerror',e=>report.errors.push(e.stack));await p.emulateMedia({reducedMotion:'reduce'});await p.goto(h.url);await p.waitForSelector('#brandWelcome49[open]');await p.click('#startupNewBrand49');
 await p.evaluate(()=>{
  GHAFState.settings.livePreview=false;GHAFState.settings.caption38.auto=false;GHAFState.importManualCaptions(Array.from({length:12},(_,i)=>({text:i%2?'متن کوتاه':'این یک متن طولانی‌تر برای نمایش تغییر اندازهٔ واقعی پس‌زمینه است',start:i*2,end:i*2+2})));
  GHAFState.settings.anim={...GHAFState.settings.anim,mode:'simple',preset:'rise',inDur:.4,outPreset:'fade',outDur:.3};VarnaActions.refresh();
  window.calls81=[];window.active81=0;window.max81=0;window.original81=['bgScope','bgMotion','bgMotionReflow67','bgMotionReflowCurve67','bgMotionDur'].map(id=>document.getElementById(id));
  GHAFBridge.available=true;window.__adobe_cep__={evalScript(script,callback){const m=script.match(/dispatch\(("(?:\\.|[^"\\])*"),("(?:\\.|[^"\\])*")\)/);if(!m){callback('null');return;}const method=JSON.parse(m[1]),payload=JSON.parse(decodeURIComponent(JSON.parse(m[2])));calls81.push({method,payload});active81++;max81=Math.max(max81,active81);let data={};
   if(method==='refreshCaptionStyles')data={updated:12};if(method==='checkOutput')data={comp:'Test',id:41};if(method==='getActiveCompInfo'||method==='getTimelineInfo')data={id:41,compId:41,width:1080,height:1920,time:8,duration:30,frameRate:30};if(method==='updateLivePreview')data={compId:41,created:payload.groups.length};
   if(method==='library81Status')data={root:'/not-installed-in-browser',privateLibrary:false,packs:VarnaUserLibrary81.packs().map(p=>({id:p.id,available:false}))};
   setTimeout(()=>{active81--;callback(JSON.stringify({ok:true,data}));},method==='refreshCaptionStyles'?20:1);
  }};VarnaUI.open('bg');VarnaBackgroundWorkspace81.choose('motion');
 });
 await p.locator('[data-bg-preset81="expand-x:soft"]').click();assert.equal(await p.evaluate(()=>GHAFState.settings.bg.motion81.preset),'expand-x:soft');
 const saved=await p.evaluate(()=>JSON.stringify(GHAFState.settings.anim));
 await p.locator('label').filter({has:p.locator('#bgMotionReflow67')}).click();await p.waitForFunction(()=>GHAFState.settings.bg.reflow67?.enabled===true);
 assert.equal(await p.evaluate(()=>JSON.stringify(GHAFState.settings.anim)),saved);assert(await p.evaluate(()=>GHAFState.exportGroups().every(g=>g.anim.preset==='none'&&!g.anim.typingEnabled)));
 await p.locator('#bgMotionDur').fill('.52');await p.locator('#bgMotionDur').dispatchEvent('change');assert.equal(await p.evaluate(()=>GHAFState.settings.bg.motion81.preset),'expand-x:soft','ordinary timing changes preserve the new native preset');
 await p.evaluate(async()=>{document.getElementById('livePreviewMode').value='fast';await VarnaActions.previewCurrent();});
 const live=await p.evaluate(()=>calls81.filter(c=>c.method==='updateLivePreview').at(-1).payload);assert(live.groups.length<=3);assert.equal(live.reflowGroups67.length,12,'fast preview retains complete first/last geometry context');assert(live.reflowGroups67.every(g=>g.anim.preset==='none'));
 await p.evaluate(()=>{GHAFState.settings.livePreview=false;});await p.locator('label').filter({has:p.locator('#bgMotionReflow67')}).click();assert.equal(await p.evaluate(()=>GHAFState.exportGroups()[0].anim.preset),'rise');assert.equal(await p.evaluate(()=>JSON.stringify(GHAFState.settings.anim)),saved);
 assert(await p.evaluate(()=>original81.every(n=>n===document.getElementById(n.id))),'original controls retain identity');
 const refresh=await p.evaluate(()=>calls81.find(c=>c.method==='refreshCaptionStyles'));assert.equal(refresh.payload.allGroups67.length,12);assert.equal(await p.evaluate(()=>max81),1,'host work stays serialized');
 // Every appearance update is retained, including selected-scope edits queued
 // while another native action is in progress. Selection is captured on enqueue.
 await p.evaluate(async()=>{const before=calls81.filter(c=>c.method==='refreshCaptionStyles').length,ids=GHAFState.groups.slice(0,3).map(g=>g.id),tasks=[];for(const id of ids){GHAFState.select(id);tasks.push(VarnaAppearance.updateOutput('selected','bgMotionReflowStatus67'));}await Promise.all(tasks);window.queueRequests81=calls81.filter(c=>c.method==='refreshCaptionStyles').slice(before);window.queueIds81=ids;});
 const queued=await p.evaluate(()=>({requests:queueRequests81,ids:queueIds81}));assert.equal(queued.requests.length,3,'rapid requested edits cannot be silently discarded');assert.deepEqual(queued.requests.map(r=>r.payload.groups[0].id),queued.ids);assert(queued.requests.every(r=>r.payload.allGroups67.length===12));assert.equal(await p.evaluate(()=>max81),1);
 // Native recipes remain usable without installing opaque vendor files.
 await p.evaluate(()=>VarnaUI.open('tools'));await p.waitForFunction(()=>document.querySelector('.library-status81').textContent.includes('نصب نیست'));
 assert.equal(await p.locator('.library-packs81 button:disabled').count(),12);assert.equal(await p.locator('.library-native81 select').first().locator('option').count(),3);
 // Every mode of both workspaces uses the same strict geometry oracle.
 for(const width of [250,320,400,620,900,1400])for(const height of [400,700])for(const theme of ['dark','light'])for(const lang of ['fa','en']){
  await p.setViewportSize({width,height});await p.evaluate(({theme,lang})=>{const t=document.getElementById('uiTheme');t.value=theme;t.dispatchEvent(new Event('change',{bubbles:true}));VarnaI18n52.set(lang);},{theme,lang});
  for(const mode of ['look','motion']){await p.evaluate(mode=>{VarnaUI.open('bg');VarnaBackgroundWorkspace81.choose(mode);document.getElementById('workspace').scrollTop=0;},mode);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const m=await p.evaluate(measure);report.cases++;if(m.documentOverflow||m.workspaceOverflow||!m.mainVisible||['small','clipped','overflow','touch','overlap'].some(k=>m[k].length))report.failures.push({width,height,theme,lang,mode,m});}
  for(const task of ['titles','gradients','highlight']){await p.evaluate(task=>{VarnaUI.open('tools');VarnaUserLibraryUI81.choose('library');const s=document.querySelector('.library-native81 select');s.value=task;s.dispatchEvent(new Event('change'));document.getElementById('workspace').scrollTop=0;},task);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const m=await p.evaluate(measure);report.cases++;if(m.documentOverflow||m.workspaceOverflow||!m.mainVisible||['small','clipped','overflow','touch','overlap'].some(k=>m[k].length))report.failures.push({width,height,theme,lang,task,m});}
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failures,[]);console.log('PASS UI81 browser: '+report.cases+' strict workspace modes; original controls, preset/timing edits, static/restore, full fast-preview graph, serialized native queue and honest absent-private-library UI.');
}finally{fs.mkdirSync(path.resolve(root,'../docs/ui81'),{recursive:true});fs.writeFileSync(path.resolve(root,'../docs/ui81/workspaces.json'),JSON.stringify(report,null,2)+'\n');await h.close();}})().catch(e=>{console.error(e);process.exitCode=1});
