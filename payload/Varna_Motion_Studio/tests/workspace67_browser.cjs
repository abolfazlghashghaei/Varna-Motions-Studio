// Real Chromium interaction; mocked CEP calls. Does not claim native Adobe rendering.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),http=require('http');
(async()=>{const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webm':'video/webm'})[ext]||'application/octet-stream');res.end(b);});});let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.VARNA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForTimeout(200);await page.waitForSelector('#brandWelcome49[open]');await page.click('#startupNewBrand49');

await page.waitForFunction(()=>!!window.VarnaWorkspace67);
await page.evaluate(()=>{GHAFState.settings.caption38.auto=false;GHAFState.importManualCaptions([{text:'سلام این یک متن آزمایشی است',start:0,end:5}]);VarnaActions.refresh();});
const overflows=[];const routes=await page.evaluate(()=>Object.entries(VarnaProduction47.flows).flatMap(([flow,f])=>flow==='table'?[]:f.steps.flatMap((s,i)=>s.routes.map((r,sub)=>({flow,i,sub,page:r.page})))));
for(const viewport of [{width:1000,height:800},{width:760,height:520}]){
 await page.setViewportSize(viewport);
 for(const route of routes){
  await page.evaluate(r=>VarnaProduction47.go(r.flow,r.i,r.sub),route);await page.waitForTimeout(70);
  const expected=await page.evaluate(()=>{const root=document.querySelector('.page.active'),hidden=Array.from(root.querySelectorAll('.workspace-paged67'));hidden.forEach(el=>el.classList.remove('workspace-paged67'));const ids=Array.from(root.querySelectorAll('input:not([type=hidden])[id],select[id],button[id],textarea[id]')).filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>el.id);VarnaWorkspace67.refresh();return ids;});
  const seen=new Set(),sections=await page.evaluate(()=>VarnaWorkspace67.sections());assert(sections.length>0,JSON.stringify(route));
  for(let category=0;category<sections.length;category++){
   const nav=page.locator('.page.active .workspace-pager67');
   if(viewport.width>=800)await nav.locator('[role=tab]').nth(category).click();else await nav.locator('select').selectOption(String(category));
   const count=await page.evaluate(()=>VarnaWorkspace67.count());
   for(let n=0;n<count;n++){
    if(n)await nav.locator('[data-leaf67=next]').click();
    for(const id of await page.evaluate(()=>Array.from(document.querySelector('.page.active').querySelectorAll('[id]')).filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>el.id)))seen.add(id);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'horizontal overflow '+JSON.stringify(route));
    const fit=await page.evaluate(()=>{const root=document.querySelector('.page.active').getBoundingClientRect(),workspace=document.querySelector('#workspace').getBoundingClientRect();return {bottom:root.bottom,limit:workspace.bottom};});if(fit.bottom>fit.limit+2)overflows.push({viewport,route,category,n,fit});
   }
  }
  assert.deepEqual(expected.filter(id=>!seen.has(id)),[],'unreachable controls '+JSON.stringify(route));
 }
}
await page.evaluate(()=>VarnaUI.reveal(document.querySelector('#fontSize')));assert(await page.locator('#fontSize').isVisible());await page.evaluate(()=>VarnaUI.reveal(document.querySelector('#typingApply')));assert(await page.locator('#typingApply').isVisible());
// The font dialog uses the original search, selection, and favorite handlers.
await page.evaluate(()=>VarnaUI.reveal(document.querySelector('#fontSelect')));assert(await page.locator('.font-dialog67[open]').isVisible());
await page.fill('#fontSelectSearch','Tahoma');await page.locator('#fontSelectResults .font31-choose').first().click();
assert.equal(await page.locator('.font-dialog67[open]').count(),0);assert.match(await page.locator('#fontSelectTrigger67').innerText(),/Tahoma/);
await page.click('#fontSelectTrigger67');await page.keyboard.press('Escape');assert.equal(await page.locator('.font-dialog67[open]').count(),0);
await page.evaluate(()=>VarnaProduction47.go('text',2,0));await page.setViewportSize({width:1000,height:800});await page.waitForTimeout(150);
const tabs=page.locator('.page.active .workspace-pager67 [role=tab]');await tabs.first().click();await tabs.first().focus();await page.keyboard.press('ArrowLeft');assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');
fs.writeFileSync('/tmp/workspace67-overflow.json',JSON.stringify(overflows,null,2));assert.deepEqual(errors,[]);console.log('PASS67 workspace: all production routes at two widths, every initially visible control reachable by task tabs and pages; font search/selection, Escape, arrow navigation, overflow and deep links. Native Adobe not exercised.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
