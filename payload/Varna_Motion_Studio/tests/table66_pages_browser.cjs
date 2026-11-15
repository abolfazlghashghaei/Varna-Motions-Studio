// Real Chromium interaction; mocked CEP calls. Does not claim native Adobe rendering.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),http=require('http');
(async()=>{const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webm':'video/webm'})[ext]||'application/octet-stream');res.end(b);});});let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.VARNA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForTimeout(200);await page.waitForSelector('#brandWelcome49[open]');await page.click('#startupNewBrand49');

await page.waitForFunction(()=>!!window.VarnaTablePages66);
for(const size of [{width:900,height:700},{width:700,height:620},{width:760,height:520}]){
 await page.setViewportSize(size);
 for(let stage=0;stage<5;stage++){
  await page.evaluate(stage=>VarnaProduction47.go('table',stage,0),stage);await page.waitForTimeout(450);
  const sections=await page.evaluate(()=>VarnaTablePages66.sections());assert(sections.length>0);
  const expected=await page.evaluate(()=>{const root=document.querySelector('.table-pro-layout');root.querySelectorAll('.table-paged-out66').forEach(el=>el.classList.remove('table-paged-out66'));const ids=Array.from(root.querySelectorAll('input:not([type=hidden])[id],select[id],button[id],textarea[id]')).filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>el.id);VarnaTablePages66.refresh();return ids;}),seen=new Set();
  for(let category=0;category<sections.length;category++){
   if(size.width>=800)await page.locator('#tablePages66 [role=tab]').nth(category).click();else await page.locator('#tablePageJump66').selectOption(String(category));
   const count=await page.evaluate(()=>VarnaTablePages66.count());
   for(let n=0;n<count;n++){
    if(n)await page.locator('#tablePageNext66').click();
    assert(await page.locator('#tablePreviewStage').isVisible());
    for(const id of await page.evaluate(()=>Array.from(document.querySelector('.table-pro-layout').querySelectorAll('[id]')).filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>el.id)))seen.add(id);
    const bounds=await page.evaluate(()=>{const r=document.querySelector('.table-pro-layout').getBoundingClientRect(),w=document.querySelector('#workspace').getBoundingClientRect();return {bottom:r.bottom,limit:w.bottom};});
    if(bounds.bottom>bounds.limit+2)await page.screenshot({path:'/tmp/table66-failure.png'});
    assert(bounds.bottom<=bounds.limit+2,JSON.stringify({size,stage,category,n,count,bounds}));
   }
  }
  assert.deepEqual(expected.filter(id=>!seen.has(id)),[],'Unreachable table controls at stage '+stage);

 }
}
await page.evaluate(()=>VarnaUI.reveal(document.querySelector('#tableFontPS66')));assert(await page.locator('#tableFontPS66').isVisible());
await page.screenshot({path:'/tmp/workbench66-table.png'});
assert.equal(errors.length,0,errors.join('\n'));console.log('PASS66 paged table: all five stages at 900x700, 700x620 and 760x520, every settings page fits with preview visible, deep links reveal the correct page.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
