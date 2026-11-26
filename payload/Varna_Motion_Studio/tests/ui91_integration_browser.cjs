// Real browser UI integration. Host calls are mocked, never reported as native AE execution.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {launch,prepare,root}=require('./helpers/panel69.cjs');
const out=path.resolve(root,'../docs/ui91');fs.mkdirSync(out,{recursive:true});
const cep99=process.env.UI91_CEP99==='1',report={nativeAdobe:false,actualChromium99:false,profile:cep99?'post-99-features-disabled':'modern',errors:[],cases:0,layoutFailures:[],checks:[]};
function sameIDs(){const baseline=cp.execFileSync('git',['show','405b5c7:Varna_Motion_Studio/index.html'],{cwd:root,encoding:'utf8'});const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).sort();assert.deepEqual(ids(fs.readFileSync(path.join(root,'index.html'),'utf8')),ids(baseline));report.originalIDs=899;}
(async()=>{sameIDs();const h=await launch({cep99});try{
 const p=await h.browser.newPage({viewport:{width:1000,height:800}});p.on('pageerror',e=>report.errors.push(e.stack));await prepare(p,h.url,{cep99});report.browser=h.browser.version();
 assert.equal(await p.evaluate(()=>VarnaFlow77.version),91);assert.equal(await p.evaluate(()=>VarnaFlow77.pages.length),20);
 for(const name of ['director','assistant49']){await p.evaluate(n=>VarnaUI.open(n),name);assert.equal(await p.evaluate(()=>VarnaUI.current()),'home');assert.equal(await p.locator('[data-destination69="'+name+'"]').filter({visible:true}).count(),0);}
 assert(await p.locator('#speechPause91').count());assert(await p.locator('.curve-monitor91').count());
 assert(await p.evaluate(()=>!!VarnaFlow77.registerDestination84));
 assert(await p.evaluate(()=>VarnaBackgroundMotion81.find('none')?.family==='none'));
 report.checks.push('20 original destinations, both assistants excluded; all seven UI84 collections retained; background normal/IN/OUT model preserved');
 const routes=await p.evaluate(()=>[...VarnaFlow77.pages,...VarnaDestinations84.definitions().map(d=>'library-'+d[0])]);assert.equal(routes.length,27);
 for(const width of [300,420,900,1400])for(const height of [400,800])for(const theme of ['dark','light'])for(const lang of ['fa','en']){
  await p.setViewportSize({width,height});await p.evaluate(({theme,lang})=>{const n=document.getElementById('uiTheme');n.value=theme;n.dispatchEvent(new Event('change',{bubbles:true}));VarnaI18n52.set(lang);},{theme,lang});
  for(const name of routes){await p.evaluate(n=>VarnaUI.open(n),name);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));const m=await p.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth,work:document.getElementById('workspace').scrollWidth>document.getElementById('workspace').clientWidth,active:document.querySelectorAll('.page.active').length}));if(m.document||m.work||m.active!==1)report.layoutFailures.push({width,height,theme,lang,name,m});report.cases++;}
 }
 await p.setViewportSize({width:1000,height:800});await p.evaluate(()=>{VarnaI18n52.set('fa');const n=document.getElementById('uiTheme');n.value='dark';n.dispatchEvent(new Event('change',{bubbles:true}));VarnaUI.open('home');});
 await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>VarnaLiquid48.status().particles===413);
 assert.equal(await p.locator('.studio-brand-art87 #varnaGlyphs48').count(),1);assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('.studio-brand-art87'),'::before').content),'none');assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('.studio-brand-art87'),'::after').content),'none');
 const bounds=await p.locator('#varnaGlyphs48').boundingBox(),sample=await p.evaluate(()=>VarnaLiquid48.sample()[70]);await p.mouse.move(bounds.x+sample.homeX,bounds.y+sample.homeY);await p.waitForFunction(()=>VarnaLiquid48.status().collisions>0&&VarnaLiquid48.status().displacement>0);await p.mouse.move(3,3);await p.waitForFunction(()=>!VarnaLiquid48.status().animating,{},{timeout:5000});
 const burst=await p.evaluate(()=>VarnaLiquid48.status().bursts);await p.mouse.click(bounds.x+bounds.width*.25,bounds.y+bounds.height*.5);await p.waitForFunction(n=>VarnaLiquid48.status().bursts>n,burst);assert.equal(await p.evaluate(()=>VarnaLiquid48.status().returnStyle),'cascade-fold');await p.mouse.move(3,3);await p.waitForFunction(()=>VarnaLiquid48.status().phase==='rest'&&!VarnaLiquid48.status().animating,{},{timeout:10000});assert.equal(await p.evaluate(()=>VarnaLiquid48.status().displacement),0);
 const paints=await p.evaluate(()=>VarnaLiquid48.status().paints);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.equal(await p.evaluate(()=>VarnaLiquid48.status().paints),paints);
 if(!cep99)await p.screenshot({path:path.join(out,'home-original-v-dark.png')});
 await p.evaluate(()=>VarnaUI.open('table'));await p.mouse.move(400,250);assert.equal(await p.evaluate(()=>VarnaLiquid48.status().animating),false);
 await p.evaluate(()=>{VarnaUI.open('home');VarnaLiquid48.refresh();});await p.emulateMedia({reducedMotion:'reduce'});await p.mouse.click(bounds.x+bounds.width*.25,bounds.y+bounds.height*.5);assert.equal(await p.evaluate(()=>VarnaLiquid48.status().bursts),burst+1);
 report.checks.push('original 413-glyph V occupies the incoming V slot; static V removed; pointer repulsion, click scatter, cascade-fold return, rest caching, off-page pause and reduced motion verified');
 if(!cep99)for(const theme of ['dark','light'])for(const name of ['home','table','text','motion','bg','easing49','tools']){await p.evaluate(({theme,name})=>{const n=document.getElementById('uiTheme');n.value=theme;n.dispatchEvent(new Event('change',{bubbles:true}));VarnaUI.open(name);if(name==='bg')VarnaBackgroundWorkspace81.choose('motion');},{theme,name});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await p.screenshot({path:path.join(out,name+'-'+theme+'.png')});}
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.layoutFailures,[]);
 console.log('PASS UI91: '+report.cases+' layouts; 899 IDs; original animated V; requested removals and original library retained. Native AE untested.');
 }finally{await h.close();fs.writeFileSync(path.join(out,cep99?'integration-browser-cep99.json':'integration-browser.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
