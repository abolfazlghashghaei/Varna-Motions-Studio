// Browser geometry plus source checks for the Node/CEP-only phone bridge.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch,prepare,root}=require('./helpers/panel69.cjs');
(async()=>{for(const entry of ['index','premiere','resolve'])assert(!/<script[^>]+phone58\.js/.test(fs.readFileSync(path.join(root,entry+'.html'),'utf8')),entry+': phone bridge must not load');
const h=await launch({cep99:true}),report={cases:0,failures:[],errors:[],browser:h.browser.version(),nativeCEP:false};try{const p=await h.browser.newPage({viewport:{width:809,height:580}});p.on('pageerror',e=>report.errors.push(e.stack));await prepare(p,h.url,{cep99:true});
 for(const lang of ['fa','en'])for(const size of ['tiny','standard','xlarge'])for(const [width,height]of [[809,580],[809,400],[400,700],[250,400],[1400,1000]]){
  await p.setViewportSize({width,height});await p.evaluate(({lang,size})=>{VarnaI18n52.set(lang);const n=document.getElementById('uiSize44');n.value=size;n.dispatchEvent(new Event('change',{bubbles:true}));}, {lang,size});await p.waitForTimeout(100);
  const m=await p.evaluate(()=>{const nav=document.querySelector('.flat-nav69'),shell=document.querySelector('.app-shell'),bad=[];for(const b of [...nav.children].filter(n=>n.matches('button')&&n.getClientRects().length&&getComputedStyle(n).display!=='none')){const r=b.getBoundingClientRect();if(r.width<31.9||r.height<31.9)bad.push('small:'+b.dataset.page69);const label=b.querySelector('.flat-nav-label69');if(label?.getClientRects().length){const range=document.createRange();range.selectNodeContents(label);const boxes=[...range.getClientRects()].filter(r=>r.width>0),height=boxes.length?Math.max(...boxes.map(r=>r.bottom))-Math.min(...boxes.map(r=>r.top)):0;if(height>parseFloat(getComputedStyle(label).lineHeight)+1||label.scrollWidth>label.clientWidth)bad.push('wrapped:'+label.textContent);}if(!b.title&&!b.getAttribute('aria-label'))bad.push('unnamed');}return{mode:shell.dataset.railMode79,bad,navScroll:nav.scrollHeight-nav.clientHeight};});
  report.cases++;if(m.bad.length)report.failures.push({lang,size,width,height,...m});
 }
 assert.deepEqual(report.failures,[]);
 // Constrain the rail independently of the monitor/panel, as in the screenshot.
 await p.setViewportSize({width:809,height:580});await p.evaluate(()=>{const n=document.getElementById('uiSize44');n.value='standard';n.dispatchEvent(new Event('change',{bubbles:true}));VarnaI18n52.set('fa');});
 await p.addStyleTag({content:'.flat-nav69{width:40px!important;max-width:40px!important;min-width:0!important}'});
 await p.waitForFunction(()=>document.querySelector('.app-shell').dataset.railMode79==='icons');
 assert.equal(await p.locator('.flat-nav69 .flat-nav-label69').evaluateAll(ns=>ns.filter(n=>n.getClientRects().length).length),0);
 await p.locator('[data-page69=table]').click();assert.equal(await p.evaluate(()=>VarnaUI.current()),'table');
 await p.locator('[data-more69]').click();assert.equal(await p.locator('.flat-chooser69[open]').count(),1);await p.keyboard.press('Escape');
 assert(!await p.evaluate(()=>[...document.querySelectorAll('button')].some(n=>/Phone connection/.test(n.textContent))));assert.deepEqual(report.errors,[]);
 fs.mkdirSync(path.resolve(root,'../docs/ui79'),{recursive:true});fs.writeFileSync(path.resolve(root,'../docs/ui79/rail.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS UI79 rail: '+report.cases+' size/scale/language cases; constrained 40px rail, single-line labels, icon navigation, phone bridge removed from three hosts.');
}finally{await h.close()}})().catch(e=>{console.error(e);process.exitCode=1});
