const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),M=require('../js/music-engine.js');
assert.equal(M.normalizeEndpoint('http://127.0.0.1:8188'),'http://127.0.0.1:8188');
for(const url of ['https://example.com','http://192.168.0.12:8188','http://127.0.0.1:8188/other','http://user:pass@localhost:8188'])assert.throws(()=>M.normalizeEndpoint(url));
const p=M.plan({comp:{duration:80},captions:[{id:1}],events:[{time:1,type:'cut',strength:80},{time:2,type:'marker',strength:85},{time:3,type:'scene',strength:80},{time:4,type:'cut',strength:75},{time:4.1,type:'typography',strength:90,meta:{role:'caption'}}]},{style:'luxury',brief:'Luxury product',maxDuration:60});
assert.equal(p.duration,60);assert.equal(p.cuts,4);assert.equal(p.bpm,70);assert.equal(p.events.length,4);assert(M.stylePrompt(p).includes('1.0s cut'));
const graph=M.promptGraph(p);assert.equal(graph['1'].inputs.ckpt_name,M.MODEL);assert.equal(graph['2'].inputs.style,M.stylePrompt(p));assert.equal(graph['2'].inputs.max_duration,60);assert.equal(graph['2'].inputs.lyrics,'[Instrumental]');assert.deepEqual(graph['5'].inputs.positive,['2',0]);assert.equal(graph['7'].inputs.format,'flac');
const root=path.join(__dirname,'..'),bin=fs.readFileSync(path.join(root,'assets/packs/ae-glass/AE Glass.aex'));assert.equal(bin.toString('ascii',0,2),'MZ');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),host=fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8');for(const id of ['aeTextEnabled','brainMusicAnalyze','brainMusicGenerate','brainMusicEngineStart','brainMusicEngineStop'])assert(html.includes('id="'+id+'"'));assert(!html.includes('id="brainMusicEndpoint"'));assert(host.includes('GHAFHost.importProjectMusic=function'));
console.log('PASS RC11: local-only YuE endpoint, edit-aware plan, complete audio graph, AE Glass binary and text/music UI');
// Host import keeps the generated WAV inside the saved project's media folder.
const vm=require('node:vm'),layers=[],folder={fsName:'C:\\Work',name:'Work'},projectFile={parent:folder};
function HostFile(name){this.fsName=name;this.name=path.win32.basename(name);this.exists=/^C:\\Work\\Varna_Audio\\.*\.wav$/i.test(name);this.parent={name:path.win32.basename(path.win32.dirname(name)),parent:folder};}
const comp={id:15,duration:60,frameDuration:.04,layers:{add(item){const l={name:'',property(){return {property(){return {setValue(){}}}}}};layers.push(l);return l;}}};
const context={app:{project:{file:projectFile,importFile(){return {hasAudio:true,duration:30}}},beginUndoGroup(){},endUndoGroup(){}},File:HostFile,ImportOptions:function(f){this.file=f;}};
vm.createContext(context);vm.runInContext(host,context);context.GHAFHost._activeComp=()=>comp;context.GHAFHost._findFootageByFile=()=>null;
const enc=x=>encodeURIComponent(JSON.stringify(x)),decode=x=>JSON.parse(x);
assert.equal(decode(context.GHAFHost.importProjectMusic(enc({path:'C:\\Other\\Varna_Audio\\x.wav',compId:15}))).ok,false);
assert.equal(decode(context.GHAFHost.importProjectMusic(enc({path:'C:\\Work\\Varna_Audio\\x.flac',compId:15}))).ok,false);
assert.equal(decode(context.GHAFHost.importProjectMusic(enc({path:'C:\\Work\\Varna_Audio\\x.wav',compId:99}))).ok,false);
assert.equal(decode(context.GHAFHost.importProjectMusic(enc({path:'C:\\Work\\Varna_Audio\\x.wav',compId:15}))).ok,true);
assert.equal(layers.length,1);
