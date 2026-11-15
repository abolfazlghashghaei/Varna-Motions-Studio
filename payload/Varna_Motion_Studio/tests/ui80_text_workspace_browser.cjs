// Long transcripts exercise scrolling that the two-caption layout fixture cannot.
// Actual state, worker and handlers run; Adobe calls alone are mocked by prepare.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch,prepare,root}=require('./helpers/panel69.cjs');
const report={cases:0,failures:[],errors:[],nativeCEP:false};
function inspect(){
 const work=document.querySelector('#workspace'),input=document.querySelector('#reviewText'),list=document.querySelector('#captionList');
 const wr=work.getBoundingClientRect(),r=input.getBoundingClientRect(),lr=list.getBoundingClientRect();
 const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),bad=[];
 if(hit!==input)bad.push('editor-covered');
 if(r.top<wr.top-.5||r.bottom>wr.bottom+.5)bad.push('editor-outside-workspace');
 if(lr.height<32)bad.push('list-too-short');
 if(work.scrollTop)bad.push('outer-workspace-scrolled');
 if(document.documentElement.scrollWidth>innerWidth||work.scrollWidth>work.clientWidth||list.scrollWidth>list.clientWidth)bad.push('horizontal-overflow');
 for(const token of list.querySelectorAll('.corrected-token'))if(getComputedStyle(token).display!=='inline')bad.push('highlight-layout-box');
 return {bad,mode:VarnaTextWorkspace80.mode(),editor:[r.x,r.y,r.width,r.height],listHeight:lr.height,scroll:list.scrollTop};
}
(async()=>{const h=await launch({cep99:true});report.browser=h.browser.version();try{
 for(const scale of [1,2]){
  const context=await h.browser.newContext({deviceScaleFactor:scale}),p=await context.newPage();p.setDefaultTimeout(10000);
  p.on('pageerror',e=>report.errors.push(e.stack));await prepare(p,h.url,{cep99:true});
  await p.evaluate(()=>{
   GHAFState.importManualCaptions(Array.from({length:60},(_,i)=>({text:['می‌کنم رابطهٔ خوب بین عروس و مادر شوهر از اینجا شروع می‌شود.','این اتفاق‌های کوچک پایهٔ یک زندگی بهتر را می‌سازند.','اینجا هیچ کالایی بدون بررسی کیفیت وارد فروشگاه نمی‌شود.','Mixed Persian متن انگلیسی Model S509 با قیمت ۱۲٬۳۰۰ تومان.'][i%4],start:i*3,end:i*3+2.6})));
   for(const g of GHAFState.groups){const word=GHAFState.text(g).split(' ')[0];g.correctionMarks=[{from:'نمونه',to:word,start:0,end:word.length}];}
   window.controls80=['reviewText','startTime','endTime','wordList','text55-enabled','text55Personal'].map(id=>document.getElementById(id));
   VarnaActions.refresh();VarnaUI.open('text');
  });
  for(const width of [250,320,400,620,890,1400])for(const height of [400,700,1000])for(const theme of ['dark','light'])for(const lang of ['fa','en']){
   await p.setViewportSize({width:Math.round(width/scale),height:Math.round(height/scale)});
   await p.evaluate(({theme,lang})=>{const t=document.getElementById('uiTheme');t.value=theme;t.dispatchEvent(new Event('change',{bubbles:true}));VarnaI18n52.set(lang);},{theme,lang});
   await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await p.locator('.caption-row').nth(report.cases%2?0:59).click();
   const metrics=await p.evaluate(inspect);report.cases++;if(metrics.bad.length)report.failures.push({width,height,scale,theme,lang,...metrics});
   assert(await p.evaluate(()=>controls80.every(n=>n===document.getElementById(n.id))),'original controls must retain identity');
  }
  await p.setViewportSize({width:890,height:580});await p.evaluate(()=>VarnaI18n52.set('fa'));await p.locator('.caption-row').nth(44).click();
  const before=await p.locator('#captionList').evaluate(n=>n.scrollTop);
  await p.locator('#reviewText').fill('helo world');await p.locator('#reviewText').press('End');await p.locator('#reviewText').press('!');
  assert.equal(await p.evaluate(()=>GHAFState.text(GHAFState.current())),'helo world!');
  assert.equal(await p.locator('#reviewText').evaluate(n=>n.selectionStart),11,'typing preserves caret');
  assert(Math.abs(await p.locator('#captionList').evaluate(n=>n.scrollTop)-before)<1,'typing preserves list position');
  // Enable the real bundled dictionaries and accept one actual word suggestion.
  await p.locator('#text55-enabled').check();await p.evaluate(()=>VarnaTextUI55.ready());await p.locator('#text55Review').click();await p.locator('#text55Dialog').waitFor();
  const correction=p.locator('.text55-result').filter({has:p.locator('b',{hasText:'helo'})});await correction.locator('select').selectOption('hello');await p.locator('#text55Dialog .primary').click();
  assert.equal(await p.locator('#reviewText').inputValue(),'hello world!');
  await p.locator('#text55-enabled').uncheck();assert.equal(await p.evaluate(()=>VarnaTextUI55.state().running),false);
  assert.equal(await p.locator('.text-editor-head80 .corrected-token').count(),0,'editable input is never replaced with marked HTML');
  assert.equal((await p.evaluate(inspect)).bad.length,0);
  // Narrow settings remain reachable, preserve originals, and Escape returns focus.
  await p.setViewportSize({width:250,height:400});await p.locator('[data-text-settings80]').click();assert(await p.locator('.text-inspector-dialog80[open]').isVisible());
  await p.evaluate(()=>VarnaUI.reveal(document.getElementById('text55Personal')));assert(await p.locator('#text55Personal').isVisible());
  await p.keyboard.press('Escape');assert.equal(await p.locator('.text-inspector-dialog80[open]').count(),0);assert.equal(await p.evaluate(()=>document.activeElement.hasAttribute('data-text-settings80')),true);
  await p.setViewportSize({width:890,height:580});await p.locator('#reviewText').focus();await p.keyboard.press('Alt+k');
  assert(await p.locator('#wordMergeModal').isVisible());await p.locator('#mergeWordGrid .modal-word').first().click();const previous=await p.evaluate(()=>GHAFState.groups.length);await p.locator('#extractMergeWords').click();assert.equal(await p.evaluate(()=>GHAFState.groups.length),previous+1,'word extraction uses original handlers');
  await context.close();
 }
 assert.deepEqual(report.failures,[]);assert.deepEqual(report.errors,[]);console.log('PASS UI80: '+report.cases+' long-transcript layouts, persistent editor, stable scrolling/caret, real offline worker/apply/off, original control identity, settings focus and word extraction.');
}finally{fs.mkdirSync(path.resolve(root,'../docs/ui80'),{recursive:true});fs.writeFileSync(path.resolve(root,'../docs/ui80/text-workspace.json'),JSON.stringify(report,null,2)+'\n');await h.close();}})().catch(e=>{console.error(e);process.exitCode=1});
