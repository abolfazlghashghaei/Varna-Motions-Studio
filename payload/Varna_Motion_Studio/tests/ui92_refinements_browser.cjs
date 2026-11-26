// UI92 regression: production plugin controls, persisted palettes and particle motion.
// Native Windows/Adobe execution is deliberately not represented as a pass.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {launch,prepare,root}=require('./helpers/panel69.cjs');
const output=path.resolve(root,'../docs/ui92');fs.mkdirSync(output,{recursive:true});
const luminance=rgb=>rgb.map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const parse=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
// Exercise the actual position function at exact timestamps, independent of RAF
// scheduling. At scatter end, return has no oscillating anticipation or jump.
const source=fs.readFileSync(path.join(root,'js/liquid48.js'),'utf8');
const durations=source.match(/const scatterDuration=.*?;/)[0];
const position=source.slice(source.indexOf('function position('),source.indexOf('function currentPhase('));
const engine={};vm.createContext(engine);vm.runInContext(`let burstStart=100,reduced={matches:false};${durations}${position};this.position=position;this.anticipation=anticipationDuration;`,engine);
assert.equal(engine.anticipation,0,'no pre-return shake phase');
const particle={sx:0,sy:0,peakX:100,peakY:0,homeX:0,homeY:0,foldX:65,foldY:0,approachX:0,approachY:0,returnDelay:0};
let previous=Infinity;for(let time=700;time<=5700;time+=10){engine.position(particle,time);assert(particle.x<=previous+1e-8,'fold must not reverse on a straight return');assert.equal(particle.y,0);previous=particle.x;}
assert.equal(particle.x,0);assert.equal(particle.progress,1);
(async()=>{const h=await launch({cep99:process.env.UI92_CEP99==='1'}),report={nativeWindows:false,nativeAdobe:false,oldChromiumExecuted:false,profile:h.profile,checks:[],themes:[],errors:[]};try{
 const p=await h.browser.newPage({viewport:{width:1000,height:800}});p.on('pageerror',e=>report.errors.push(e.stack));await prepare(p,h.url,{cep99:process.env.UI92_CEP99==='1'});
 const original=await p.evaluate(()=>JSON.stringify(GHAFState.exportGroups()));
 for(const brightness of ['dark','light']){
  const seen=new Set();
  for(const name of ['original','ocean','mint','ember','noir','rose']){
   await p.evaluate(({brightness,name})=>{let e=document.getElementById('uiTheme');e.value=brightness;e.dispatchEvent(new Event('change',{bubbles:true}));e=document.getElementById('themePreset50');e.value=name;e.dispatchEvent(new Event('change',{bubbles:true}));VarnaUI.open('table');},{brightness,name});
   await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const colors=await p.evaluate(()=>{const s=getComputedStyle(document.body),prop=n=>s.getPropertyValue(n).trim();return {surface:prop('--ui-color-surface'),field:prop('--ui-color-field'),text:prop('--ui-color-text'),muted:prop('--ui-color-muted'),accent:prop('--ui-color-accent'),onAccent:prop('--ui-color-on-accent'),visibleAction:getComputedStyle(document.querySelector('.flat-actions69 button')).backgroundColor,viewport:getComputedStyle(document.getElementById('tableViewport89')).getPropertyValue('--vp-accent').trim(),chosen:VarnaProduction50.currentTheme().name};});
   assert.equal(colors.chosen,name);assert.equal(colors.viewport,colors.accent);
   for(const bg of ['surface','field'])for(const ink of ['text','muted'])assert(contrast(parse(colors[ink]),parse(colors[bg]))>=4.5,brightness+' '+name+' '+ink+' AA');
   assert(contrast(parse(colors.onAccent),parse(colors.accent))>=4.5);
   assert.equal(colors.visibleAction,colors.accent,'primary action uses the selected palette');
   seen.add(colors.surface+colors.accent);report.themes.push({brightness,name,...colors});
   if(brightness==='dark'&&['ocean','mint','ember','rose'].includes(name))await p.screenshot({path:path.join(output,'palette-'+name+'.png')});
  }
  assert.equal(seen.size,6,'all six existing presets produce distinct visible palettes');
 }
 assert.equal(await p.evaluate(()=>JSON.stringify(GHAFState.exportGroups())),original,'UI palettes never change project styles');
 await p.evaluate(()=>{VarnaUI.open('settings');const base=document.getElementById('themeBase50');base.value='#113322';base.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('VARNA_THEME50')).name),'custom');
 await p.reload();await p.waitForFunction(()=>window.VarnaProduction50&&VarnaProduction50.currentTheme().name==='custom');
 assert.equal(await p.locator('#themeBase50').inputValue(),'#113322','custom colors survive reopening');
 await p.waitForFunction(()=>window.VarnaFlow77&&document.querySelector('.curve-monitor91'));
 if(await p.locator('#brandWelcome49[open]').isVisible())await p.locator('#startupNewBrand49').click();
 await p.evaluate(()=>{GHAFState.settings.caption38.auto=false;GHAFState.importManualCaptions([{text:'آزمون ویرایش حرکت',start:0,end:4}]);VarnaActions.refresh();});
 // Default numeric controls reclaim the auxiliary grip/range space. Real canvas,
 // table row/column, curve, timeline and paired gradient handles remain available.
 await p.evaluate(()=>{const e=document.getElementById('themePreset50');e.value='original';e.dispatchEvent(new Event('change',{bubbles:true}));VarnaUI.open('motion');});
 assert.equal(await p.locator('#animIn').locator('..').getAttribute('data-numeric-compact91'),'');
 assert.equal(await p.locator('#animIn').locator('..').locator('.numeric37-handle').isVisible(),false);
 await p.evaluate(()=>VarnaUI.reveal(document.getElementById('animIn')));const input=p.locator('#animIn');await input.fill('0.7');await input.press('Tab');assert.equal(await input.inputValue(),'0.7');
 await p.evaluate(()=>{VarnaUI.open('table');VarnaUI.tab('table','look');});
 assert(await p.locator('#tableViewport89 [data-handle89=corner]').first().isVisible());
 assert(await p.locator('#tableViewport89 [data-handle89=anchor]').isVisible());
 for(const width of [250,400,620,1400])for(const name of ['table','text','motion','settings']){
  await p.setViewportSize({width,height:700});await p.evaluate(name=>VarnaUI.open(name),name);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width+' '+name);
  if(width===400||width===1400)await p.screenshot({path:path.join(output,'after-'+name+'-'+width+'.png')});
 }
 await p.setViewportSize({width:1000,height:800});await p.evaluate(()=>VarnaUI.open('home'));await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>VarnaLiquid48.status().particles===413);
 await p.evaluate(()=>VarnaLiquid48.shatterAt(100,100));await p.mouse.move(1,1);await p.waitForFunction(()=>VarnaLiquid48.status().phase==='gather');assert.equal(await p.evaluate(()=>VarnaLiquid48.status().anticipationDuration),0);
 await p.waitForFunction(()=>!VarnaLiquid48.status().animating,{},{timeout:10000});assert.equal(await p.evaluate(()=>VarnaLiquid48.status().displacement),0);const paints=await p.evaluate(()=>VarnaLiquid48.status().paints);await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>VarnaLiquid48.status().paints),paints);
 report.checks=['12 preset/brightness combinations with AA text and distinct rendered palettes','custom palette persisted through reload; project styling unchanged','redundant numeric grips hidden; typing and geometry handles retained','16 narrow/wide page layouts and 8 screenshots','actual particle position function: zero anticipation; monotonic fold test; live scatter/fold/rest and idle stop'];assert.deepEqual(report.errors,[]);console.log('PASS UI92 refinements: palettes, density, preserved geometry handles and shake-free V.');
 }finally{await h.close();fs.writeFileSync(path.join(output,process.env.UI92_CEP99==='1'?'refinements-cep99.json':'refinements.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
