// Prove that scroll clipping removes false overlap, not detection coverage.
const assert=require('node:assert/strict');
const {launch,measure}=require('./helpers/panel69.cjs');
(async()=>{const h=await launch();try{
 const p=await h.browser.newPage({viewport:{width:400,height:300}});
 await p.setContent(`<style>body{margin:0;font:14px Arial}button{font:14px Arial;width:100px;height:32px}#workspace{position:relative;width:200px;height:200px}.page{height:200px}#fixed{position:absolute;top:0;left:0}#clip{position:absolute;top:50px;left:0;width:180px;height:100px;overflow:auto}#scrolled{position:absolute;top:-50px;left:0}#probe{position:absolute;top:0;left:0}.flat-actions69{position:absolute;top:250px;left:250px}</style><div class="topbar"></div><nav class="flat-nav69"></nav><main id="workspace"><section class="page active"><button id="fixed">Visible</button><div id="clip"><button id="scrolled">Clipped</button></div></section></main><footer class="flat-actions69"><button data-primary69>Build</button></footer>`);
 let m=await p.evaluate(measure);assert.deepEqual(m.overlap,[],'fully clipped rows cannot overlap the fixed editor');
 await p.evaluate(()=>{document.getElementById('scrolled').style.top='0px';document.getElementById('fixed').style.top='50px';});
 m=await p.evaluate(measure);assert(m.overlap.some(pair=>pair.includes('fixed')&&pair.includes('scrolled')),'real overlapping buttons inside the scrollport must still fail');
 await p.evaluate(()=>{document.getElementById('scrolled').hidden=true;const n=document.createElement('span');n.id='probe';n.textContent='This text is clipped';n.style.cssText='display:block;width:20px;white-space:nowrap;overflow:hidden';document.querySelector('.page').append(n);});
 m=await p.evaluate(measure);assert(m.clipped.some(n=>n.id==='probe'),'real text outside its own box must still fail');
 await p.evaluate(()=>{document.getElementById('probe').remove();document.getElementById('fixed').style.cssText='font-size:8px;width:20px';});
 m=await p.evaluate(measure);assert(m.small.some(n=>n.id==='fixed'),'small fonts must still fail');assert(m.touch.some(n=>n.id==='fixed'),'small targets must still fail');
 console.log('PASS UI80 geometry oracle: scroll-clipped false overlap excluded; actual overlap, text clipping, small fonts and small targets still rejected.');
}finally{await h.close();}})().catch(e=>{console.error(e);process.exitCode=1});
