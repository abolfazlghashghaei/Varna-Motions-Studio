const assert=require('assert'),vm=require('vm'),fs=require('fs'),path=require('path'),os=require('os');
const root=path.resolve(__dirname,'..'),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'varna-r7-'));
const memory={};const c={window:{require},require,process:{env:{APPDATA:scratch}},Buffer,console,URL,setTimeout,clearTimeout,localStorage:{getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v},document:{createElement:()=>({getContext:()=>({font:'',measureText:t=>({width:t.length*20})})})}};vm.createContext(c);
['timing.js','text-layout.js','state.js','node-engine.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),c));
const N=c.window.GHAFNode;
// Learned correction survives projects and fuzzy-matches one nearby misspelling while preserving timestamps.
N.learnCorrectionPairs([{wrong:'منصوعي',right:'مصنوعی'}]);
let src=[{id:1,text:'این',start:0,end:.25},{id:2,text:'منصوع',start:.30,end:.75},{id:3,text:'بعدی',start:.90,end:1.2}];
let out=N.applyCorrectionMemoryToWords(src);assert.equal(out.words[1].text,'مصنوعی');assert.equal(out.words[1].start,.30);assert.equal(out.words[1].end,.75);assert.equal(out.words[2].start,.90);assert(out.fuzzyHits>=1);
// Multiple remembered corrections must ask rather than guess until the user picks a preference.
N.learnCorrectionPairs([{wrong:'پریمیر',right:'Premiere'},{wrong:'پریمیر',right:'Adobe Premiere'}]);N.clearCorrectionPreference('پریمیر');
out=N.applyCorrectionMemoryToWords([{id:10,text:'پریمیر',start:2,end:2.6}]);assert.equal(out.ambiguities.length,1);assert.equal(out.words[0].text,'پریمیر');
N.setCorrectionPreference('پریمیر','Premiere');out=N.applyCorrectionMemoryToWords([{id:10,text:'پریمیر',start:2,end:2.6}]);assert.equal(out.ambiguities.length,0);assert.equal(out.words[0].text,'Premiere');assert.equal(out.words[0].start,2);assert.equal(out.words[0].end,2.6);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'js','app.js'),'utf8'),host=fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8'),table=fs.readFileSync(path.join(root,'js/table-designer.js'),'utf8');
['btnLearnSelectionQuick','btnReviewAmbiguities','livePreviewMode','tableRoundMode','tableLiquidGlass','bgGlowEnabled','fillColorHex'].forEach(id=>assert(html.includes('id="'+id+'"'),id+' missing'));
assert(html.includes('data-bg-preset="ice-glow"'));assert(html.includes('data-bg-preset="white-halo"'));assert(html.includes('Ctrl+Alt+1')||app.includes("key==='Digit1'"));assert(app.includes("e.altKey&&!ctrl&&(key==='KeyJ'"));
assert(host.includes('eventTime!=null?x.eventTime:x.time'));assert(host.includes('l.startTime=placeStart'));assert(host.includes('ADBE Glo2'));assert(host.includes('ADBE Gaussian Blur 2'));assert(table.includes('liquidGlass'));
fs.rmSync(scratch,{recursive:true,force:true});console.log('PASS R7 correction alternatives/fuzzy timing, working panel shortcuts, local glass/glow UI, SFX event placement and table liquid glass');
