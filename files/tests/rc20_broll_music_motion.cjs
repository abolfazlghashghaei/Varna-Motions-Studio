const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const B=require('../js/broll-browser.js'),M=require('../js/music-engine.js');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'varna-broll-'));
try{
 fs.mkdirSync(path.join(folder,'sub'));
 for(const f of ['one.mp4','sub/two.mov','sub/ignore.txt'])fs.writeFileSync(path.join(folder,f),'test');
 assert.deepEqual(B.scan(folder).map(x=>x.name).sort(),['one.mp4','two.mov']);
 const one=path.join(folder,'one.mp4');
 assert.equal(B.segment(one,1.2,4.2,8).end,4.2);
 assert.throws(()=>B.segment(one,4,4,8));
 assert.throws(()=>B.segment(one,0,10,8));
 assert(B.sourceURL(one).startsWith('file:'));
}finally{fs.rmSync(folder,{recursive:true,force:true});}
const p=M.plan({comp:{duration:40},events:[{time:5,type:'marker',strength:90}]},{durationMode:'comp',source:'video',meter:'6/8',editSync:'strong',style:'funk'});
assert(M.stylePrompt(p).includes('Time signature: 6/8'));
assert.equal(M.aceGraph?.(p)?.['5']?.inputs?.timesignature||M.graphFor(p,{workflow:'ace_turbo'})['5'].inputs.timesignature,'6/8');
assert(M.editSyncFilter(p,0,40,'strong').includes('t-5.000'));
assert.equal(M.editSyncFilter(p,0,40,'off'),'');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
for(const id of ['page-broll','brollFiles','brollPlayer','brollTimeline','brollInsertAll','brainMusicCustomPrompt','brainMusicEditSync','motionShowcase'])assert(html.includes('id="'+id+'"'));
assert(app.includes('function initMotionGallery()')&&app.includes('renderBrollQueue()')&&app.includes('editSelectedVideoAtPlayhead'));
const host=fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8');
class FootageItem{constructor(){this.hasVideo=true;this.duration=8;this.file={fsName:'C:\\clips\\a.mp4'};}}
const item=new FootageItem(),layers=[];
function File(name){this.fsName=name;this.name=path.win32.basename(name);this.exists=name==='C:\\clips\\a.mp4';}
let selected=[];
const comp={id:3,duration:20,time:2,frameDuration:.04,get selectedLayers(){return selected;},get numLayers(){return layers.length;},layer(i){return layers[i-1]},layers:{add(source){const l={name:'',source,locked:false,hasVideo:true,inPoint:0,outPoint:8,moveToBeginning(){},moveAfter(){},remove(){layers.splice(layers.indexOf(l),1);},duplicate(){const copy={...l,remove(){layers.splice(layers.indexOf(copy),1);}};layers.push(copy);return copy;}};layers.push(l);return l;}}};
const context={app:{project:{importFile(){return item},numItems:0},beginUndoGroup(){},endUndoGroup(){}},File,FootageItem,ImportOptions:function(file){this.file=file;}};
vm.createContext(context);vm.runInContext(host,context);context.GHAFHost._activeComp=()=>comp;context.GHAFHost._findFootageByFile=()=>null;
const enc=x=>encodeURIComponent(JSON.stringify(x)),dec=x=>JSON.parse(x);
assert.equal(dec(context.GHAFHost.placeBroll(enc({path:'C:\\clips\\a.mp4',sourceIn:1,sourceOut:4,atTime:2,compId:3}))).ok,true);
assert.equal(layers[0].startTime,1);assert.equal(layers[0].inPoint,2);assert.equal(layers[0].outPoint,5);
assert.equal(dec(context.GHAFHost.placeBroll(enc({path:'C:\\clips\\a.mp4',sourceIn:0,sourceOut:20,atTime:3,compId:3}))).ok,false);
assert.equal(dec(context.GHAFHost.placeBroll(enc({path:'C:\\clips\\a.mp4',sourceIn:0,sourceOut:2,compId:99}))).ok,false);
selected=[layers[0]];comp.time=3;
assert.equal(dec(context.GHAFHost.editSelectedVideoAtPlayhead(enc({mode:'split'}))).ok,true);
assert.equal(layers[0].outPoint,3);assert.equal(layers[1].inPoint,3);
console.log('PASS RC20: B-roll scan, multiple ranges, timeline insertion/split, motion filtering and edit-aware music');
