// Real Chromium interaction; mocked CEP calls. Does not claim native Adobe rendering.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),http=require('http');
(async()=>{const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webm':'video/webm'})[ext]||'application/octet-stream');res.end(b);});});let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.VARNA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForTimeout(200);await page.waitForSelector('#brandWelcome49[open]');await page.click('#startupNewBrand49');
const reveal=async id=>page.evaluate(id=>VarnaUI.reveal(document.getElementById(id)),id);
await page.waitForFunction(()=>!!window.VarnaReflowUI67);
await page.evaluate(()=>{
 const S=GHAFState;S.settings.livePreview=false;S.settings.caption38.auto=false;
 S.importManualCaptions([{text:'یک جمله با ده واژه برای نمایش سطح مشترک',start:0,end:3},{text:'کوتاه و روشن',start:3,end:5},{text:'دوباره متن بلندتر',start:5,end:8}]);S.select(S.groups[1].id);VarnaActions.refresh();
 window.calls67=[];window.active67=0;window.max67=0;GHAFBridge.available=true;
 window.__adobe_cep__={evalScript(script,cb){
  const match=script.match(/dispatch\(("(?:\\.|[^"\\])*"),("(?:\\.|[^"\\])*")\)/);
  if(!match){cb('null');return;}
  const method=JSON.parse(match[1]),payload=JSON.parse(decodeURIComponent(JSON.parse(match[2])));calls67.push({method,payload});active67++;max67=Math.max(max67,active67);
  const result=method==='checkOutput'?{comp:'Test',id:41}:method==='getTimelineInfo'?{compId:41,time:3,duration:8}:method==='updateLivePreview'?{compId:41,created:3}:method==='refreshCaptionStyles'?{updated:0}:{};
  setTimeout(()=>{active67--;cb(JSON.stringify({ok:true,data:result}));},method==='refreshCaptionStyles'?80:1);
 }};
 VarnaProduction47.go('background',4,0);document.querySelector('#bgScope').value='all';
});
await reveal('bgMotionReflow67');await page.locator('label').filter({has:page.locator('#bgMotionReflow67')}).click();await page.waitForFunction(()=>calls67.some(c=>c.method==='refreshCaptionStyles'));
const enabled=await page.evaluate(()=>({bg:GHAFState.settings.bg,call:calls67.find(c=>c.method==='refreshCaptionStyles')}));assert.equal(enabled.bg.reflow67.enabled,true);assert.equal(enabled.bg.engine,'native');assert.equal(enabled.bg.followTyping,false);assert.equal(enabled.call.payload.allGroups67.length,3);assert.equal(enabled.call.payload.groups.length,3);
await page.evaluate(async()=>{document.querySelector('#bgMotionReflowDuration67').value='.4';const a=VarnaReflowUI67.apply();document.querySelector('#bgScope').value='selected';document.querySelector('#bgMotionReflowCurve67').value='linear';const b=VarnaReflowUI67.apply();await Promise.all([a,b]);});
assert.equal(await page.evaluate(()=>GHAFState.bgFor(GHAFState.current()).reflow67.curve),'linear');assert.equal(await page.evaluate(()=>GHAFState.settings.bg.reflow67.duration),.4);assert.equal(await page.evaluate(()=>max67),1,'native calls remain serialized');
// Enabling the real preview sends neighbor geometry while focusing the selected caption.
await page.evaluate(async()=>{document.querySelector('#livePreviewMode').value='fast';await VarnaActions.previewCurrent();});
await page.waitForFunction(()=>calls67.some(c=>c.method==='updateLivePreview'));
const preview=await page.evaluate(()=>calls67.filter(c=>c.method==='updateLivePreview').at(-1).payload);assert.equal(preview.groups.length,3);assert.equal(preview.focusGroupId67,await page.evaluate(()=>GHAFState.selectedId));
await page.evaluate(async()=>{GHAFState.settings.livePreview=false;document.querySelector('#bgMotionReflow67').checked=false;await VarnaReflowUI67.apply();});assert.equal(await page.evaluate(()=>GHAFState.bgFor(GHAFState.current()).reflow67.enabled),false);
// Incompatible scene engines fail before editing the project background.
const protectedBg=await page.evaluate(()=>{GHAFState.current().animOverride={...GHAFState.animFor(GHAFState.current()),kinetic40:{enabled:true}};const before=JSON.stringify(GHAFState.bgFor(GHAFState.current()));document.querySelector('#bgMotionReflow67').checked=true;window.before67=before;return before;});await page.evaluate(()=>VarnaReflowUI67.apply());assert.equal(await page.evaluate(()=>JSON.stringify(GHAFState.bgFor(GHAFState.current()))),protectedBg);assert.equal(await page.locator('#bgMotionReflow67').isChecked(),false);
await page.evaluate(()=>{VarnaI18n52.set('en');});await page.waitForTimeout(80);assert.equal(await page.locator('#bgMotionReflowCurve67').locator('..').locator(':scope>span').textContent(),'Resize curve');
assert.deepEqual(errors,[]);console.log('PASS67 browser: shared surface controls, global/local state, full refresh graph, serialized rapid edits, neighboring fast preview, focus mapping, disable restoration, protected scene failure and English labels. Native rendering remains a separate gate.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
