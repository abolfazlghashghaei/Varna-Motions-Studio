// Real browser + production controllers. No Adobe rendering is simulated as a pass.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),http=require('http');
(async()=>{const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(f,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webm':'video/webm'})[path.extname(f)]||'application/octet-stream');res.end(b);});});let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.VARNA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1200,height:920}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));await p.goto('http://127.0.0.1:'+server.address().port+'/index.html');await p.waitForTimeout(350);await p.waitForSelector('#brandWelcome49[open]');await p.click('#startupNewBrand49');

const baseline=JSON.parse(fs.readFileSync(path.resolve(root,'../docs/ux-audit68/source-inventory.json'),'utf8'));
for(const entry of ['index','premiere','resolve']){
 const html=fs.readFileSync(path.join(root,entry+'.html'),'utf8'),ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,'duplicate static IDs: '+entry);
 assert.deepEqual(ids.slice().sort(),baseline[entry].ids,'899 static ID contract: '+entry);
 if(entry!=='index')assert(!html.includes('data-ui-a68')&&!html.includes('ui-tokens68'),'AE-only scope: '+entry);
}
await p.evaluate(()=>{GHAFState.settings.livePreview=false;GHAFState.settings.caption38.auto=false;GHAFState.importManualCaptions([{text:'متن آزمایشی برای اندازه و رنگ رابط',start:0,end:5}]);VarnaActions.refresh();});
const pages=['home','text','table','motion','kinetic','templates','sfx','music','audio','ai','bg','brand','director','easing49','assistant49','safe','keywords','translate','tools','resources','output','settings'];
async function inspect(){return p.evaluate(()=>{
 const active=document.querySelector('.page.active'),protectedArea='svg,canvas,script,style,option,iframe,[data-user-content],#tablePreview,#tableEditor,#sceneStage40,.scene-piece40,.preview-text50,.motion-card-preview,.font31-preview,.caption-preview37,.look37>span';
 const visible=el=>!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
 const text=Array.from(active.querySelectorAll('*')).filter(el=>visible(el)&&!el.closest(protectedArea)&&Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()));
 const identify=el=>el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+Array.from(el.classList).join('.');
 const small=text.filter(el=>parseFloat(getComputedStyle(el).fontSize)<12).map(el=>({id:identify(el),text:el.textContent.trim().slice(0,80),font:getComputedStyle(el).fontSize}));
 const short=Array.from(active.querySelectorAll('button')).filter(el=>visible(el)&&!el.matches('.scene-piece40')&&el.getBoundingClientRect().height<31.9).map(el=>({id:identify(el),height:el.getBoundingClientRect().height}));
 return {small,short,overflow:document.documentElement.scrollWidth>innerWidth+1};
});}
for(const theme of ['dark','light']){
 await p.evaluate(theme=>{const el=document.querySelector('#uiTheme');el.value=theme;el.dispatchEvent(new Event('change',{bubbles:true}));},theme);await p.setViewportSize({width:620,height:640});
 for(const name of pages){
  await p.evaluate(name=>VarnaUI.open(name),name);await p.waitForTimeout(70);const result=await inspect();
  assert.deepEqual(result.small,[],theme+' '+name+' small UI text');assert.deepEqual(result.short,[],theme+' '+name+' short button');assert.equal(result.overflow,false,theme+' '+name+' horizontal overflow');
 }
}
// Custom hues and saved project graphics remain under the original palette/project owners.
const palettes=[['#fefefe','#e2e8f0','#ffff00'],['#111111','#334155','#222222'],['#777777','#888888','#777777'],['#102520','#214a3e','#8ce8bb']];
for(const [base,end,accent]of palettes){
 const result=await p.evaluate(({base,end,accent})=>{
  const before=JSON.stringify(GHAFState.exportGroups());VarnaProduction50.applyTheme('custom',{base,end,accent,glass:.24},false);VarnaUITokens68.refresh();
  const style=getComputedStyle(document.body),rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
  const l=c=>c.map(x=>{x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);}).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>(Math.max(l(a),l(b))+.05)/(Math.min(l(a),l(b))+.05),read=name=>rgb(style.getPropertyValue(name));
  const panel=read('--ui-color-surface'),field=read('--ui-color-field');
  return {same:JSON.stringify(GHAFState.exportGroups())===before,base:style.getPropertyValue('--v48-base').trim(),action:contrast(read('--ui-color-action'),read('--ui-color-on-action')),text:Math.min(contrast(read('--ui-color-text'),panel),contrast(read('--ui-color-text'),field)),muted:Math.min(contrast(read('--ui-color-muted'),panel),contrast(read('--ui-color-muted'),field)),accent:contrast(read('--ui-color-accent'),read('--ui-color-soft'))};
 },{base,end,accent});
 assert.equal(result.same,true,'palette must not change native caption payload');assert.equal(result.base.toLowerCase(),base);
 for(const key of ['action','text','muted','accent'])assert(result[key]>=4.5,'custom palette '+base+' '+key+'='+result[key]);
}
await p.evaluate(()=>{VarnaProduction50.applyTheme('original',null,false);VarnaI18n52.set('en');VarnaUI.reveal(document.querySelector('#fontSelect'));});
assert.equal(await p.locator('html').getAttribute('dir'),'ltr');assert(await p.locator('.font-dialog67[open]').isVisible());await p.keyboard.press('Escape');assert.equal(await p.locator('.font-dialog67[open]').count(),0);await p.evaluate(()=>VarnaI18n52.set('fa'));assert.equal(await p.locator('html').getAttribute('dir'),'rtl');
assert.deepEqual(errors,[]);console.log('PASS A68: 899 IDs per entry, AE-only scope, 22 pages in both themes with >=12px UI text and >=32px buttons, custom-palette AA token pairs, unchanged caption payload, English/RTL and the original font dialog. Native CEP is not exercised.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
