const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const C=require('../js/corrections.js'),root=path.resolve(__dirname,'..');
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
check('direct and old imported unsafe rules stay manual even with an explicit auto flag',()=>{
 for(const pair of [{wrong:'و',right:'9'},{wrong:'بوش',right:'Bosch Pro 5'},{wrong:'9',right:'نه'}]){
  const learned=C.learn({},[pair]),legacy=C.database({items:[{...pair,autoApply:true,mode:'direct'}]});
  assert.equal(learned.items[0].autoApply,false);
  assert.equal(legacy.items[0].autoApply,false);
  assert.equal(C.applyText(pair.wrong,legacy).text,pair.wrong);
 }
});
check('two anchors permit a one-to-many brand correction only in the same phrase',()=>{
 const rule={wrong:'گفتم بوش کار',right:'گفتم Bosch Pro 5 کار',mode:'context',autoApply:true};
 const db=C.learn({},[rule]);
 assert.equal(db.items[0].autoApply,true);
 assert.equal(C.applyText('گفتم بوش کار. این بوش مال ماست',db).text,'گفتم Bosch Pro 5 کار. این بوش مال ماست');
 assert.equal(C.applyText('گفتم، بوش کار',db).hits,0);
 assert.equal(C.database({items:[{wrong:'گفتم بوش',right:'گفتم Bosch Pro 5',mode:'context',autoApply:true}]}).items[0].autoApply,false);
 const family=C.learn(db,[{wrong:'بوش',right:'Bosch Pro 5',autoApply:false}]);
 assert.equal(C.groups(C.learn(family,[{...rule,canonical:'Bosch Pro 5'}])).length,1);
});
check('bare spelling aliases are retained for review, not applied blindly',()=>{
 let db=C.learn({},[{wrong:'فرفرج',right:'فرفورژه'},{wrong:'فرفرژ',right:'فرفورژه'},{wrong:'مي توانم',right:'می‌توانم'}]);
 assert.equal(C.applyText('فرفرج، فرفرژ! مي توانم',db).text,'فرفرج، فرفرژ! مي توانم');
 assert.equal(C.applyText('خیلی‌فرفرج',db).hits,0);
});
check('project entity locks prevent both phrase and fuzzy auto-edits',()=>{
 const rule=C.learn({},[{wrong:'وستا فرفرج عالی',right:'وستا فرفورج عالی',mode:'context'}]);
 const out=C.applyText('وستا فرفرج عالی برند سپس وستا فرفرج عالی',rule,{protectedPhrases:['وستا فرفرج عالی برند']});
 assert.equal(out.text,'وستا فرفرج عالی برند سپس وستا فرفورج عالی');
 assert.equal(out.hits,1);
 const engine=fs.readFileSync(path.join(root,'js/node-engine.js'),'utf8');
 assert(engine.includes('C.protectedMask(words,opts.protectedPhrases||[])'));
 assert(engine.includes('w._entityLocked'));
});
check('manual subtitle edits learn two-sided context; boundary edits are manual',()=>{
 const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8'),start=app.indexOf('function correctionTokenNorm('),end=app.indexOf('function correctionDb(',start);
 assert(start>=0&&end>start);
 const context={C,Set,Array};vm.createContext(context);
 vm.runInContext(app.slice(start,end)+';globalThis.pairs=correctionPairs;',context);
 const inside=Array.from(context.pairs('گفتم بوش کار','گفتم Bosch Pro 5 کار'));
 assert.equal(inside.length,1);assert.equal(inside[0].mode,'context');assert.equal(inside[0].autoApply,true);
 const edge=Array.from(context.pairs('بوش کار','Bosch Pro 5 کار'));
 assert.equal(edge[0].autoApply,false);
 assert.equal(C.applyText('بوش کار',C.learn({},edge)).text,'بوش کار');
});
check('direct selection borrows context only from a unique occurrence',()=>{
 const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8'),start=app.indexOf('function selectedContextRule('),end=app.indexOf("$('#btnSaveDirectCorrection')",start);
 assert(start>=0&&end>start);
 let text='گفتم بوش کار',ctx={C,S:{current:()=>({id:1}),text:()=>text}};vm.createContext(ctx);
 vm.runInContext(app.slice(start,end)+';globalThis.fromSelection=selectedContextRule;',ctx);
 assert.equal(ctx.fromSelection('بوش','Bosch Pro 5').autoApply,true);
 text='گفتم بوش کار، بعد بوش کار';assert.equal(ctx.fromSelection('بوش','Bosch Pro 5'),null);
 text='این و آن';assert.equal(ctx.fromSelection('و','9'),null);
});
check('word-level memory respects pauses/punctuation and a one-off call never saves memory',()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'varna-correction-safe-'));
 try{
  const context={window:{require},process:{env:{APPDATA:dataDir},platform:process.platform},Buffer,console,URL,setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem:()=>{}},document:{createElement:()=>({getContext:()=>({measureText:()=>({width:20})})})}};
  vm.createContext(context);for(const file of ['timing.js','text-layout.js','state.js','node-engine.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
  const N=context.window.GHAFNode;
  N.learnCorrectionPairs([{wrong:'گفتم بوش کار',right:'گفتم Bosch Pro 5 کار',mode:'context',autoApply:true}]);
  N.learnCorrectionPairs([{wrong:'بوش',right:'Bosch Pro 5',autoApply:false}]);
  N.learnCorrectionPairs([{wrong:'گفتم بوش کار',right:'گفتم Bosch Pro 5 کار',mode:'context',autoApply:true,canonical:'Bosch Pro 5'}]);
  assert.equal(C.groups(N.loadCorrectionMemory()).length,1);
  N.replaceCorrectionCanonical('Bosch Pro 5','Bosch Pro 6');
  assert.equal(C.applyText('گفتم بوش کار',N.loadCorrectionMemory()).text,'گفتم Bosch Pro 6 کار');
  N.learnCorrectionPairs([{wrong:'و',right:'9',autoApply:true}]);
  const words=(first='گفتم',gap=.1)=>[{id:1,text:first,start:0,end:.2},{id:2,text:'بوش',start:.2+gap,end:.6+gap},{id:3,text:'کار',start:.7+gap,end:1+gap},{id:4,text:'و',start:1.2+gap,end:1.4+gap}];
  const fixed=N.applyCorrectionMemoryToWords(words());
  assert.equal(fixed.hits,1);assert.equal(fixed.words.map(w=>w.text).join(' '),'گفتم Bosch Pro 6 کار و');
  assert.equal(N.applyCorrectionMemoryToWords(words('گفتم،')).hits,0);
  assert.equal(N.applyCorrectionMemoryToWords(words('گفتم',2)).hits,0);
  const before=JSON.stringify(N.loadCorrectionMemory());
  N.applySingleCorrectionToWords([{id:8,text:'منصوعي',start:0,end:1}],'منصوعي','مصنوعی');
  assert.equal(JSON.stringify(N.loadCorrectionMemory()),before);
 }finally{fs.rmSync(dataDir,{recursive:true,force:true});}
});
console.log('TOTAL '+checks+' safe correction checks');
