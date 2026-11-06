const fs=require('fs'),assert=require('assert/strict'),WebSocket=require('ws');
(async()=>{const ts=await(await fetch('http://127.0.0.1:9259/json')).json();const s=new WebSocket(ts[0].webSocketDebuggerUrl);await new Promise(r=>s.on('open',r));let id=0;const jobs=new Map();s.on('message',raw=>{const m=JSON.parse(raw);if(jobs.has(m.id)){jobs.get(m.id)(m.result);jobs.delete(m.id);}});async function ev(expression){const r=await new Promise(resolve=>{const n=++id;jobs.set(n,resolve);s.send(JSON.stringify({id:n,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}));});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
try{for(let i=0;i<150;i++){if(await ev('!!(window.MobileApp && MobileApp.ready)'))break;await new Promise(r=>setTimeout(r,400));}
assert.equal(await ev('MobileShell63.route()'),'home');assert.equal(await ev('getComputedStyle(document.querySelector("#home .quick")).display'),'grid');
await ev('MobileShell63.command("table")');assert.equal(await ev('MobileShell63.route()'),'editor');assert(await ev('MobileApp.project().layers52.some(function(x){return x.kind==="table";})'));
await ev('MobileApp.back()');assert.equal(await ev('MobileShell63.route()'),'home');
console.log('PASS UI63 native Android 10 / WebView 74: scoped home CSS, live table creation, editor entry, and Android back to home.');
}finally{s.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
