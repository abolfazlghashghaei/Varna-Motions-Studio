/* Permanent short-panel gate. CSS reflow and DPR are both varied; native Adobe
   DPI/CEF are not exercised. The 50% assertion excludes workspace padding. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {launch,prepare,measure,root}=require('./helpers/panel69.cjs');
const restricted=!process.argv.includes('--modern');
const output=process.env.HEIGHT71_REPORT||path.resolve(root,'../docs/stage1-71/height-'+(restricted?'restricted':'modern')+'.json');
const files=['index.html','css/ui/pilot-b69.css','js/pilot-b69.js','css/ui/cep70.css','js/cep70.js'];
const snapshot=()=>Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const settle=async p=>{await p.waitForTimeout(90);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));};
function space(){const workspace=document.getElementById('workspace'),shell=document.querySelector('.app-shell'),style=getComputedStyle(workspace),padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom),action=document.querySelector('.flat-actions69').getBoundingClientRect(),navigation=document.querySelector('.flat-nav69').getBoundingClientRect();return {cssWidth:innerWidth,cssHeight:innerHeight,workspaceHeight:workspace.clientHeight,padding,usableHeight:workspace.clientHeight-padding,short:shell.dataset.panelShort71==='true',rootFont:getComputedStyle(document.documentElement).fontSize,statusInHeader:document.querySelector('.flat-status69').parentElement.classList.contains('topbar'),footerShared:Math.abs(action.top-navigation.top)<1};}
(async()=>{const h=await launch({cep99:restricted}),report={scope:['table','kinetic'],nativeCEF:false,profile:h.profile,browser:await h.browser.version(),source:snapshot(),states:[],failures:[],pageErrors:[]};
try{
 for(const zoom of [1,1.25,1.5,2]){
  const context=await h.browser.newContext({deviceScaleFactor:zoom}),p=await context.newPage();p.on('pageerror',error=>report.pageErrors.push(error.stack));await prepare(p,h.url,{cep99:restricted});await p.waitForTimeout(600);
  for(const size of ['auto','tiny','compact','standard','large','xlarge'])for(const theme of ['light','dark'])for(const language of ['fa','en']){
   await p.evaluate(({size,theme,language})=>{for(const [id,value]of [['uiSize44',size],['uiTheme',theme]]){const node=document.getElementById(id);node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));}VarnaI18n52.set(language);},{size,theme,language});
   for(const width of [250,320,340,400]){
    await p.setViewportSize({width:Math.round(width/zoom),height:Math.round(400/zoom)});
    for(const [page,mode]of [['table','table'],['kinetic','scene'],['kinetic','line']]){
     await p.evaluate(({page,mode})=>{VarnaUI.open(page);if(mode!=='table')VarnaStudio40.tab(mode);VarnaPilot69.sync();for(const node of document.querySelectorAll('.page.active details'))node.open=true;document.getElementById('workspace').scrollTop=0;},{page,mode});await settle(p);
     const metrics=await p.evaluate(measure),layout=await p.evaluate(space),key={width,height:400,zoom,size,theme,language,page,mode};
     const record={...key,...layout,ratio:layout.usableHeight/layout.cssHeight};report.states.push(record);
     if(record.ratio<.5||metrics.documentOverflow||metrics.workspaceOverflow||!metrics.mainVisible||metrics.navigation.length>2||['small','clipped','overflow','touch','overlap'].some(key=>metrics[key].length)||(layout.short&&(!layout.statusInHeader||!layout.footerShared)))report.failures.push({key,layout,metrics});
    }
   }
  }
  // The exact live action/status nodes return when the panel grows or changes page.
  await p.setViewportSize({width:620,height:700});await p.evaluate(()=>{const input=document.getElementById('uiSize44');input.value='standard';input.dispatchEvent(new Event('change',{bubbles:true}));VarnaUI.open('table');VarnaPilot69.sync();window.height71Live={status:document.querySelector('.flat-status69'),action:document.getElementById('tableBuild')};});await settle(p);
  await p.setViewportSize({width:125,height:200});await settle(p);assert(await p.evaluate(()=>height71Live.status===document.querySelector('.topbar>.flat-status69')&&height71Live.action===document.querySelector('.flat-actions69 #tableBuild')));
  await p.locator('.topbar>.flat-status69>summary').click();assert(await p.locator('.flat-status69').evaluate(e=>e.open));await p.keyboard.press('Escape');assert.equal(await p.locator('.flat-status69').evaluate(e=>e.open),false);
  await p.locator('[data-more69]').click();assert.equal(await p.locator('dialog[open] [data-destination69]').count(),22);await p.keyboard.press('Escape');assert(await p.locator('[data-more69]').evaluate(e=>document.activeElement===e));
  await p.setViewportSize({width:620,height:700});await settle(p);assert(await p.evaluate(()=>height71Live.status===document.querySelector('.flat-actions69>.flat-status69')));
  await p.evaluate(()=>VarnaUI.open('home'));await settle(p);assert.equal(await p.locator('body').getAttribute('data-flat69'),null);assert.equal(await p.locator('.app-shell').getAttribute('data-panel-short71'),'false');
  console.log('Height gate zoom '+zoom+': '+report.states.length+' states; '+report.failures.length+' failures');await context.close();
 }
 assert.deepEqual(snapshot(),report.source,'runtime changed during the height gate');
 report.minimumUsableRatio=Math.min(...report.states.map(record=>record.ratio));fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 assert.deepEqual(report.pageErrors,[]);assert.equal(report.states.length,1152);assert.deepEqual(report.failures,[],'height/geometry failures; see '+output);
 console.log('PASS UI71 '+report.profile+': '+report.states.length+' states, usable content >=50%, shared footer, original status/action and all 22 destinations retained. Native CEF untested.');
}finally{await h.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
