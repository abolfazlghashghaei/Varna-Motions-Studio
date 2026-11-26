// Verify UI91 still boots when the real WithoutEngine profile omits music scripts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch,prepare,root}=require('./helpers/panel69.cjs');
(async()=>{const h=await launch();try{const p=await h.browser.newPage({viewport:{width:620,height:760}}),errors=[],removedRequests=[];p.on('pageerror',e=>errors.push(e.stack));p.on('request',r=>{if(/\/js\/(audio50|audio51|music-engine)\.js/.test(r.url()))removedRequests.push(r.url());});
 let index=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const name of ['audio50','audio51','music-engine'])index=index.replace(new RegExp('<script\\s+src="(?:\\./)?js/'+name+'\\.js"\\s*></script>','g'),'');
 await p.route('**/index.html',r=>r.fulfill({body:index,contentType:'text/html'}));
 await p.addInitScript(()=>{window.VARNA_ENGINE_ENABLED=false;document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('#brainMusic,#audioStudio50,#page-music,[data-page="music"],[data-launch="music"]').forEach(n=>n.remove()));});
 await prepare(p,h.url);assert.equal(await p.locator('#page-music').count(),0);assert.equal(await p.evaluate(()=>VarnaFlow77.pages.includes('music')),false);
 const routes=await p.evaluate(()=>[...VarnaFlow77.pages,...VarnaDestinations84.definitions().map(d=>'library-'+d[0])]);assert.equal(routes.length,26);
 for(const name of routes){await p.evaluate(n=>VarnaUI.open(n),name);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));assert.equal(await p.locator('.page.active').count(),1);}
 assert.deepEqual(errors,[]);assert.deepEqual(removedRequests,[]);console.log('PASS UI91 WithoutEngine: 26 routes, omitted engine scripts never requested, no dead music route or startup errors. Native Adobe untested.');
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
