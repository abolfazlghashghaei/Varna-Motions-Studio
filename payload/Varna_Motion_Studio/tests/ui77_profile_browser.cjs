// Exercise the exact WithoutEngine frontend fragment emitted by Profile60.ps1.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {launch,prepare,root}=require('./helpers/panel69.cjs');
(async()=>{const h=await launch();try{
 const profile=fs.readFileSync(path.join(root,'tools/Profile60.ps1'),'utf8');
 const match=profile.match(/else\{@'\r?\n([\s\S]*?)\r?\n'@\}/);assert(match,'original installer profile fragment');
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><script>'+match[1]+'</script>');
 for(const name of ['audio50','audio51','music-engine'])html=html.replace(new RegExp('<script\\s+src="(?:\\./)?js/'+name+'\\.js"\\s*></script>','g'),'');
 const p=await h.browser.newPage({viewport:{width:620,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.route('**/index.html',r=>r.fulfill({contentType:'text/html',body:html}));await prepare(p,h.url);
 assert.equal(await p.evaluate(()=>VARNA_ENGINE_ENABLED),false);
 assert.equal(await p.evaluate(()=>VarnaFlow77.pages.length),21);
 assert.equal(await p.locator('#page-music,[data-page69="music"],[data-destination69="music"]').count(),0);
 await p.evaluate(()=>VarnaUI.open('text'));assert.equal(await p.locator('#offlineText55').count(),1);
 await p.evaluate(()=>VarnaUI.open('audio'));assert.equal(await p.locator('#btnTranscribe').count(),1);
 assert.equal(await p.locator('script[src$="audio50.js"],script[src$="audio51.js"],script[src$="music-engine.js"]').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS UI77 WithoutEngine: exact installer frontend profile; 21 real pages, no dead music shortcuts, transcription and offline correction retained. Native installer execution untested.');
}finally{await h.close()}})().catch(e=>{console.error(e);process.exitCode=1});
