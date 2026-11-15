// Real Chromium interaction; mocked CEP calls. Does not claim native Adobe rendering.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),http=require('http');
(async()=>{const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webm':'video/webm'})[ext]||'application/octet-stream');res.end(b);});});let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.VARNA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForTimeout(200);await page.waitForSelector('#brandWelcome49[open]');await page.click('#startupNewBrand49');


await page.waitForFunction(()=>!!window.VarnaWorkspace67);
const directory=process.env.VARNA_SCREENSHOT_DIR||'/tmp/varna-ui67';fs.mkdirSync(directory,{recursive:true});
await page.evaluate(()=>{GHAFState.settings.caption38.auto=false;GHAFState.importManualCaptions([{text:'هر کلمه، یک حرکت تازه',start:0,end:5},{text:'طراحی روشن و ساده',start:5,end:9}]);VarnaActions.refresh();});
for(const size of [{width:1000,height:760},{width:760,height:520}]){
 await page.setViewportSize(size);
 for(const [name,flow,index,sub]of [['font','text',2,0],['motion','text',3,0],['materials','background',1,0],['table','table',2,0],['words','text',2,2]]){
  await page.evaluate(x=>VarnaProduction47.go(x.flow,x.index,x.sub),{flow,index,sub});await page.waitForTimeout(250);
  if(name==='motion'&&size.width===1000)assert.equal(await page.locator('.page.active .section-pager67 [role=tab][aria-selected=true]').getAttribute('data-section67'),'presets');await page.screenshot({path:path.join(directory,name+'-'+size.width+'.png')});
 }
}
await page.evaluate(()=>VarnaUI.reveal(document.querySelector('#fontSelect')));await page.waitForTimeout(100);await page.screenshot({path:path.join(directory,'font-dialog.png')});
assert.deepEqual(errors,[]);console.log('Captured ten workspaces and the font dialog in '+directory+'. Native Adobe rendering not exercised.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
