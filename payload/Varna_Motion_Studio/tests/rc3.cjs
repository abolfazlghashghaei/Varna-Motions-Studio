const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const mem={};const c={window:{},console,localStorage:{getItem:k=>mem[k]||null,setItem:(k,v)=>mem[k]=v},document:{createElement:()=>({getContext:()=>({font:'',measureText:t=>({width:String(t).length*9})})})}};
vm.createContext(c);['timing.js','text-layout.js','state.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),c));
const S=c.window.GHAFState,L=c.window.GHAFLayout;
// Long paragraphs must not hit the old quadratic layout freeze and may not drop text.
const words=Array.from({length:1800},(_,i)=>'کلمه'+(i+1)),raw=words.join(' '),t0=Date.now();
const laid=L.layout(raw,{lines:2,wordsPerLine:4,width:900,kashida:true,kashidaChance:100,kashidaLength:5},s=>String(s).length*9),elapsed=Date.now()-t0;
assert.equal(laid.text.replace(/\r/g,' ').replace(/ـ/g,'').split(/\s+/).join(' '),raw);
assert(laid.longTextFastPath===true);assert(elapsed<1500,'long layout took '+elapsed+'ms');
// SRT/manual import gets synthetic, monotonic word timing and the normal split pipeline.
assert(S.importManualCaptions([{text:'این یک متن وارد شده از اس آر تی است',start:12.5,end:16.5}]));
const g=S.current();assert.equal(g.manual,false);assert(g.wordIds.length>3);assert.equal(S.groupStart(g),12.5);assert.equal(S.groupEnd(g),16.5);
for(let i=1;i<g.wordIds.length;i++){const a=S.word(g.wordIds[i-1]),b=S.word(g.wordIds[i]);assert(a.start<=a.end);assert(a.end<=b.start+.000001);}
const picked=g.wordIds.slice(2,4),out=S.splitGroup(g.id,'selected',0,picked);assert(out&&out.length===3);assert.equal(S.groupStart(out[0]),12.5);assert.equal(S.groupEnd(out[out.length-1]),16.5);assert.equal(out.map(S.text).join(' '),'این یک متن وارد شده از اس آر تی است');
console.log('PASS RC3: long-text fast layout and SRT synthetic word timing/split');
