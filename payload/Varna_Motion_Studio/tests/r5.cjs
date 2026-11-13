const assert=require('assert'),vm=require('vm'),fs=require('fs'),path=require('path'),os=require('os');
const root=path.resolve(__dirname,'..'),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'varna-r5-'));
const memory={};const c={window:{require},require,process:{env:{APPDATA:scratch}},Buffer,console,URL,setTimeout,clearTimeout,localStorage:{getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v},document:{createElement:()=>({getContext:()=>({font:'',measureText:t=>({width:t.length*20})})})}};vm.createContext(c);
['timing.js','text-layout.js','state.js','node-engine.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),c));
const S=c.window.GHAFState,N=c.window.GHAFNode;
S.settings.maxWords=50;S.settings.smartGroup=false;S.initWords([
 {id:1,text:'یک',start:0,end:.7},{id:2,text:'دو',start:1,end:1.7},{id:3,text:'سه',start:2,end:2.7}
]);
const g=S.current(),originalLater={s2:S.word(2).start,e2:S.word(2).end,s3:S.word(3).start,e3:S.word(3).end};
S.setTextAnchored(g.id,'یک اضافه دو سه');
assert.equal(S.text(g),'یک اضافه دو سه');assert.equal(g.wordIds.length,4);
const synthetic=g.wordIds.map(id=>S.word(id)).find(w=>w&&w.synthetic);assert(synthetic,'inserted token should get a synthetic audio slot');assert.equal(synthetic.text,'اضافه');assert(synthetic.start<synthetic.end);
assert.equal(S.word(2).start,originalLater.s2);assert.equal(S.word(2).end,originalLater.e2);assert.equal(S.word(3).start,originalLater.s3);assert.equal(S.word(3).end,originalLater.e3);
N.learnCorrectionPairs([{wrong:'منصوعي',right:'مصنوعی'},{wrong:'هوش منصوعي',right:'هوش مصنوعی'}]);const db=N.loadCorrectionMemory();assert(db.items.some(x=>x.wrongKey==='منصوعی'&&x.rightKey==='مصنوعی'));assert(db.items.some(x=>x.wrongKey==='هوش منصوعی'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),table=fs.readFileSync(path.join(root,'js/table-designer.js'),'utf8'),host=fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8');
['tableEnd','tableStartPlayhead','tableEndPlayhead','cellTextStart','cellTextEnd','cellTextMotion','tableStyleGallery'].forEach(id=>assert(html.includes('id="'+id+'"'),id+' missing'));
['clean','glass','dark','editorial','luxury','tech','broadcast','outline','softCards'].forEach(x=>assert(table.includes(x),x+' style missing'));
['slideLeft','slideRight','drop','pop'].forEach(x=>assert(host.includes(x),x+' motion missing'));
fs.rmSync(scratch,{recursive:true,force:true});console.log('PASS R5 table styles/range, independent text timing, correction memory normalization, anchored synthetic word timing');
