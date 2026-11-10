const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
async function launch(options={}){
 const overlay=new Map();if(options.baseline){if(!/^[a-f0-9]{7,40}$/.test(options.baseline))throw Error('Expected commit SHA');const {execFileSync}=require('node:child_process');for(const file of ['index.html','js/ui-shell.js','js/production47.js','js/sections67.js','js/table-pages66.js','js/table-designer.js'])overlay.set(path.join(root,file),execFileSync('git',['show',options.baseline+':Varna_Motion_Studio/'+file],{cwd:root,maxBuffer:8*1024*1024}));}
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();const read=overlay.has(file)?callback=>callback(null,overlay.get(file)):callback=>fs.readFile(file,callback);read((error,body)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webm':'video/webm'})[path.extname(file)]||'application/octet-stream');res.end(body);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.VARNA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 return {browser,url:'http://127.0.0.1:'+server.address().port+'/index.html',async close(){await browser.close();await new Promise(resolve=>server.close(resolve));}};
}
async function prepare(page,url){
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{let seed=691;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);});
 await page.goto(url);await page.waitForSelector('#brandWelcome49[open]');await page.click('#startupNewBrand49');
 await page.evaluate(()=>{
  GHAFState.settings.livePreview=false;GHAFState.settings.caption38.auto=false;
  GHAFState.importManualCaptions([{text:'این یک متن آزمایشی برای بررسی رابط است.',start:0,end:4},{text:'هر کلمه باید واضح و خوانا باشد.',start:4,end:8}]);VarnaActions.refresh();
  GHAFBridge.call=async(method)=>method==='getTimelineInfo'?{compId:99,width:1920,height:1080,time:1,duration:10,frameRate:30,markers:[]}:{layers:12,removed:12};
 });
}
// Ignore only authored graphics (where text size is a project parameter), SVG and
// the intentional two overlapping range inputs. All interface controls are measured.
function measure(){
 const page=document.querySelector('.page.active'),work=document.querySelector('#workspace');
 const protectedArea='script,style,svg,canvas,option,#tablePreview,#sceneStage40,#wordPreview39,.font31-preview';
 const visible=e=>{if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return false;for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&e!==p&&!p.querySelector(':scope>summary')?.contains(e))return false;return true;};
 const id=e=>e.id||e.tagName.toLowerCase()+'.'+Array.from(e.classList).join('.');
 const roots=[page,document.querySelector('.topbar'),document.querySelector('.flat-actions69'),document.querySelector('.flat-nav69')];
 const elements=roots.flatMap(r=>[r,...r.querySelectorAll('*')]).filter(e=>visible(e)&&!e.closest(protectedArea));
 const small=[],clipped=[],overflow=[],touch=[],overlap=[],textBoxes=[];
 const group=e=>e.closest('#workspace')?'workspace':e.closest('.topbar')?'header':e.closest('.flat-actions69')?'action':'navigation';
 for(const e of elements){
  const s=getComputedStyle(e),r=e.getBoundingClientRect();
  if(e.clientWidth>0&&e.scrollWidth>e.clientWidth&&!e.matches('input,select,textarea')&&!e.closest('.table-range-track'))overflow.push({id:id(e),client:e.clientWidth,scroll:e.scrollWidth});
  const hasText=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
  if(hasText&&parseFloat(s.fontSize)<12-.01)small.push({id:id(e),font:s.fontSize});
  if(hasText&&!e.closest('input,textarea,select')){
   for(const n of e.childNodes){if(n.nodeType!==3||!n.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(n);
    for(const t of range.getClientRects()){if(t.width)textBoxes.push({e,r:t,id:'text:'+id(e),group:group(e)});if(t.width&& (t.left<r.left-1||t.right>r.right+1||t.top<r.top-1||t.bottom>r.bottom+1))clipped.push({id:id(e),text:n.textContent.trim().slice(0,70),bounds:[r.left,r.right,r.top,r.bottom],textBounds:[t.left,t.right,t.top,t.bottom]});}
   }
  }
 }
 const controls=elements.filter(e=>e.matches('button,input:not([type=hidden]),select,textarea,summary')&&!e.closest('.table-range-track'));
 const boxes=textBoxes;
 for(const e of controls){if(parseFloat(getComputedStyle(e).fontSize)<11.99)small.push({id:id(e),font:getComputedStyle(e).fontSize});const check=e.matches('input[type=checkbox],input[type=radio]'),target=check?e.closest('label')||e:e,r=target.getBoundingClientRect();if(r.width<31.9||r.height<31.9)touch.push({id:id(e),width:r.width,height:r.height});
  // Labels for switches are measured as the real pointer target, rather than the decorative input.
  boxes.push({e:target,r,id:id(e),group:group(target)});
 }
 boxes.sort((a,b)=>a.r.top-b.r.top);
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length&&boxes[j].r.top<boxes[i].r.bottom-1;j++){
  const a=boxes[i],b=boxes[j];if(a.group!==b.group||a.e.contains(b.e)||b.e.contains(a.e))continue;// Native picker + its painted value are a single control, like a label inside a button.
  const selectShell=a.e.closest('.select-shell69');if(selectShell&&selectShell===b.e.closest('.select-shell69')&&(a.e.tagName==='SELECT'||b.e.tagName==='SELECT'))continue;
  const ix=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),iy=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
  if(ix>1&&iy>1)overlap.push([a.id,b.id,+ix.toFixed(1),+iy.toFixed(1)]);
 }
 const main=document.querySelector('.flat-actions69 [data-primary69]'),m=main?.getBoundingClientRect();
 const hit=m&&document.elementFromPoint(m.x+m.width/2,m.y+m.height/2);
 const mainVisible=!!m&&m.width>=32&&m.height>=32&&m.top>=0&&m.left>=0&&m.right<=innerWidth+.5&&m.bottom<=innerHeight+.5&&(hit===main||main.contains(hit));
 const navSelectors=['.flat-nav69','#productionSteps47','#productionRoutes47','#routeSelect66','.workspace-pager67','#tablePages66','.page.active>.workflow-tabs'];
 const navigation=navSelectors.filter(s=>[...document.querySelectorAll(s)].some(visible));
 return {viewport:[innerWidth,innerHeight],documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,workspaceOverflow:work.scrollWidth>work.clientWidth,small,clipped,overflow,touch,overlap,mainVisible,navigation,workspaceHeight:work.clientHeight};
}
module.exports={root,launch,prepare,measure};
