/* Permanent B gate, two pilot pages until approval. Dimensions are available panel
   pixels at 100%. Zoom reflows to width/zoom × height/zoom CSS pixels, DPR=zoom.
   DPR alone would not test reflow. Native Adobe CEF/DPI/rendering remain manual. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {root,launch,prepare,measure}=require('./helpers/panel69.cjs');
const values=(key,fallback)=>process.env[key]?process.env[key].split(',').map(Number):fallback;
const report={scope:['table','kinetic'],widths:values('B69_WIDTHS',[250,320,400,620,900,1400]),heights:values('B69_HEIGHTS',[400,700,1000]),zooms:values('B69_ZOOMS',[1,1.25,1.5,2]),themes:['light','dark'],languages:['fa','en'],cases:0,states:0,failures:[],pageErrors:[]};
const snapshot=()=>Object.fromEntries(['index.html','css/ui/cep70.css','js/cep70.js','css/ui/pilot-b69.css','js/pilot-b69.js','js/ui-shell.js','js/sections67.js','js/table-pages66.js','js/table-designer.js','js/production47.js'].map(file=>[file,require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
report.source=snapshot();
const out=process.env.B69_REPORT||'/tmp/varna-ui69-matrix.json';
async function settle(p){await p.waitForTimeout(90);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));}
(async()=>{const h=await launch();try{report.actualBrowser=await h.browser.version();report.compatibilityProfile=h.profile;
 const baseline=JSON.parse(fs.readFileSync(path.resolve(root,'../docs/ux-audit68/source-inventory.json')));
 for(const entry of ['index','premiere','resolve']){const html=fs.readFileSync(path.join(root,entry+'.html'),'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,899);assert.equal(new Set(ids).size,899);assert.deepEqual(ids.sort(),baseline[entry].ids);if(entry!=='index')assert(!html.includes('pilot-b69'));}
 for(const zoom of report.zooms){
  const context=await h.browser.newContext({deviceScaleFactor:zoom}),p=await context.newPage();p.on('pageerror',e=>report.pageErrors.push(e.stack));await prepare(p,h.url);
  assert.deepEqual(await p.evaluate(()=>VarnaPilot69.pages),['table','kinetic']);
  for(const theme of report.themes)for(const language of report.languages){
   await p.evaluate(({theme,language})=>{const t=document.querySelector('#uiTheme');t.value=theme;t.dispatchEvent(new Event('change',{bubbles:true}));VarnaI18n52.set(language);},{theme,language});
   for(const width of report.widths)for(const height of report.heights){
    await p.setViewportSize({width:Math.round(width/zoom),height:Math.round(height/zoom)});
    for(const name of report.scope){
     const key={width,height,zoom,theme,language,page:name};
     await p.evaluate(name=>{VarnaUI.open(name);if(name==='kinetic')VarnaStudio40.tab('scene');VarnaPilot69.sync();document.querySelector('#workspace').scrollTop=0;
      for(const d of document.querySelectorAll('.page.active details'))d.open=d.dataset.defaultOpen69==='true';
      for(const d of document.querySelectorAll('.page.active .mini-preview-toggle'))d.open=true;
      VarnaPilot69.preview[name].open=document.querySelector('.app-shell').dataset.panelBand69!=='compact';
     },name);await settle(p);
     const initial=await p.evaluate(measure);
     if(!initial.mainVisible||initial.documentOverflow||initial.navigation.length>2||initial.workspaceHeight<=0)report.failures.push({key,state:'initial',metrics:initial});
     // Measure expanded content too. Only vertical scroll clipping is legitimate.
     for(const mode of name==='kinetic'?['scene','line']:['table']){
      await p.evaluate(mode=>{if(mode!=='table')VarnaStudio40.tab(mode);VarnaPilot69.sync();for(const d of document.querySelectorAll('.page.active details'))d.open=true;},mode);await settle(p);
      const metrics=await p.evaluate(measure);report.states++;
      if(metrics.documentOverflow||metrics.workspaceOverflow||!metrics.mainVisible||metrics.navigation.length>2||metrics.workspaceHeight<=0||['small','clipped','overflow','touch','overlap'].some(k=>metrics[k].length))report.failures.push({key,state:mode,metrics});
     }
     report.cases++;
    }
   }
  }
  console.log('Matrix zoom '+zoom+': '+report.cases+' page cases, '+report.failures.length+' failures');await context.close();
 }
 report.profileStats=h.profileStats;
 assert.deepEqual(snapshot(),report.source,'runtime files changed during the matrix');
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');assert.deepEqual(report.pageErrors,[],'browser errors');assert.equal(report.failures.length,0,'matrix failures; see '+out);
 console.log('PASS B69: '+report.cases+' page cases / '+report.states+' expanded states; 899 IDs; no horizontal overflow, clipped UI text, intersecting controls or undersized text/targets; main actions visible; at most two navigation levels. Two-page pilot only.');
}finally{await h.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
