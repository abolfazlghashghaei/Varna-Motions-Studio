// Exercise the settings hidden behind disclosures, using the original strict oracle.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {launch,prepare,measure,root}=require('./helpers/panel69.cjs');
(async()=>{const h=await launch(),report={cases:0,failures:[],errors:[],profile:h.profile};try{
 const p=await h.browser.newPage({viewport:{width:620,height:900}});p.on('pageerror',e=>report.errors.push(e.stack));await prepare(p,h.url);
 const names=await p.evaluate(()=>VarnaFlow77.pages.filter(n=>!['home','table','kinetic','tools'].includes(n)));
 for(const width of [250,620,1400]){await p.setViewportSize({width,height:900});
  for(const name of names){await p.evaluate(name=>VarnaUI.open(name),name);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const count=await p.locator('.page.active .flow-section77').count();
   for(let i=0;i<count;i++){
    await p.evaluate(i=>{const ds=[...document.querySelectorAll('.page.active .flow-section77')];ds.forEach((d,j)=>d.open=i===j);for(const d of ds[i].querySelectorAll('details'))d.open=true;},i);
    await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const m=await p.evaluate(measure);report.cases++;
    // These four original dual-range rails intentionally overlay two inputs.
    // Keep their drag behavior (also covered by unchanged UI47); never allow
    // overlapping text, buttons, or any other pair through this exception.
    const dualPairs=[['startRange','endRange'],['fillGradStart','fillGradEnd'],['bgGradStart','bgGradEnd'],['rimGradStart','rimGradEnd']];
    const intentional=[];
    for(const overlap of m.overlap){
     const pair=dualPairs.find(([a,b])=>(a===overlap[0]&&b===overlap[1])||(b===overlap[0]&&a===overlap[1]));
     if(!pair)continue;
     assert(await p.evaluate(([a,b])=>{const x=document.getElementById(a),y=document.getElementById(b);return x&&y&&x.type==='range'&&y.type==='range'&&x.parentElement===y.parentElement;},pair),'only original shared range rails may overlap');
     intentional.push(overlap);
    }
    m.overlap=m.overlap.filter(item=>!intentional.includes(item));
    if(intentional.length)report.intentionalSharedRails=(report.intentionalSharedRails||0)+intentional.length;
    if(m.documentOverflow||m.workspaceOverflow||!m.mainVisible||['small','clipped','overflow','touch','overlap'].some(k=>m[k].length))report.failures.push({name,width,section:i,metrics:m});
   }
  }
 }
 fs.writeFileSync(path.resolve(root,'../docs/ui77/sections.json'),JSON.stringify(report,null,2)+'\n');
 assert.deepEqual(report.errors,[]);assert.equal(report.failures.length,0,'See docs/ui77/sections.json');
 console.log('PASS UI77 expanded sections: '+report.cases+' cases, original controls and strict geometry at 250/620/1400px.');
}finally{await h.close();}})().catch(e=>{console.error(e);process.exitCode=1});
