const assert=require('assert'),vm=require('vm'),fs=require('fs'),path=require('path'),os=require('os');
const root=path.resolve(__dirname,'..'),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'varna-r6-'));
const memory={};const c={window:{require},require,process:{env:{APPDATA:scratch}},Buffer,console,URL,setTimeout,clearTimeout,localStorage:{getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v},document:{createElement:()=>({getContext:()=>({font:'',measureText:t=>({width:t.length*20})})})}};vm.createContext(c);
['timing.js','text-layout.js','state.js','node-engine.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),c));
const N=c.window.GHAFNode;
N.learnCorrectionPairs([{wrong:'منصوعي',right:'مصنوعی'},{wrong:'این هوش منصوعي خوبه',right:'این هوش مصنوعی خوبه',mode:'context'},{wrong:'می خام',right:'می خواهم'}]);
let src=[
 {id:1,text:'این',start:0,end:.3},{id:2,text:'هوش',start:.31,end:.55},{id:3,text:'منصوعي',start:.56,end:.95},{id:4,text:'خوبه',start:1.0,end:1.35}
];
let out=N.applyCorrectionMemoryToWords(src);assert(out.hits>=1);assert.equal(out.words.map(w=>w.text).join(' '),'این هوش مصنوعی خوبه');assert.equal(out.words[out.words.length-1].start,1.0);assert.equal(out.words[out.words.length-1].end,1.35);
// word-count-changing correction must stay inside its own audio span and never move later words.
src=[{id:1,text:'می',start:0,end:.2},{id:2,text:'خام',start:.21,end:.5},{id:3,text:'بعدی',start:.7,end:1.0}];out=N.applyCorrectionMemoryToWords(src);assert.equal(out.words.map(w=>w.text).join(' '),'می خام بعدی');const later=out.words.find(w=>w.text==='بعدی');assert.equal(later.start,.7);assert.equal(later.end,1.0);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'css','varna-ui.css'),'utf8'),app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');
['timeStartLabel','timeEndLabel','btnLearnCurrentCorrections','correctionMemoryLastApplied'].forEach(id=>assert(html.includes('id="'+id+'"'),id+' missing'));
assert(css.includes('R6 · Single-source AE-native theme'));assert(css.includes('direction:ltr!important'));assert(css.includes('--r6-surface'));assert(app.includes('applyAeNativePalette'));assert(!app.includes('N.applyCorrectionMemoryToWords(r.words'),'imported ASR words stay raw until review');const review=require('../js/corrections').reviewMatches('این هوش منصوعي خوبه',N.loadCorrectionMemory());assert(review.length>0,'stored corrections produce proposals for explicit review');const reviewPath=app.slice(app.indexOf('function applyMemoryToTranscript('),app.indexOf('function learnApprovedCorrection('));assert(!reviewPath.includes('S.setTextAnchored'),'proposal scan cannot rewrite captions');
fs.rmSync(scratch,{recursive:true,force:true});console.log('PASS R6 AE-native unified theme, stable dual-handle time rail, legacy explicit memory API and review-only transcript proposals');
