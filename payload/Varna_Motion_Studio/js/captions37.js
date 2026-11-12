(function(root){'use strict';
const clean=s=>String(s||'').replace(/[ـ\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').toLowerCase();
const key=s=>clean(s).replace(/^[\s.,!?؟،؛:«»"'()[\]{}]+|[\s.,!?؟،؛:«»"'()[\]{}]+$/g,'');
function phrases(values){return (Array.isArray(values)?values:String(values||'').split(/[\n;؛]+/)).map(x=>String(x).trim().split(/\s+/).filter(Boolean)).filter(x=>x.length).sort((a,b)=>b.length-a.length);}
function units(tokens,values){const list=phrases(values),out=[];for(let i=0;i<tokens.length;){let count=1;for(const p of list)if(p.length<=tokens.length-i&&p.every((x,j)=>key(x)===key(tokens[i+j]))){count=p.length;break;}out.push(tokens.slice(i,i+count));i+=count;}return out;}
function tokens(text){const counts=Object.create(null);return String(text||'').match(/\S+/g)?.map((text,index)=>{const k=key(text),ordinal=counts[k]||0;counts[k]=ordinal+1;return {text,index,key:k,ordinal};})||[];}
function marks(text,selected){return tokens(text).filter(t=>(selected||[]).some(s=>s.key===t.key&&s.ordinal===t.ordinal));}
function ranges(text,selected){const ts=tokens(text),chosen=new Set(marks(text,selected).map(x=>x.index)),out=[];let index=0,m;const re=/\S+/g;while((m=re.exec(text))){if(chosen.has(index)){const before=text.slice(0,m.index).replace(/[\r\n]/g,'').length;out.push({start:before,end:before+m[0].length});}index++;}return out;}
function suggest(text,frequency){const stop=new Set('این آن از به در با را که و یا اما برای تا یک هم من تو ما شما است هست بود شد می the a an of to in and or is are was be for with on it this that you we i'.split(' ')),ts=tokens(text),n=Math.max(1,Math.round(ts.length*Math.max(0,Math.min(100,+frequency||0))/100));return ts.filter(t=>t.key&&!stop.has(t.key)).sort((a,b)=>(/[0-9۰-۹]/.test(b.key)?20:0)+b.key.length-((/[0-9۰-۹]/.test(a.key)?20:0)+a.key.length)||a.index-b.index).slice(0,n).sort((a,b)=>a.index-b.index).map(t=>({key:t.key,ordinal:t.ordinal}));}
function time(s){const parts=s.trim().replace(',','.').split(':').map(Number);if(parts.length<2||parts.length>3||parts.some(x=>!Number.isFinite(x)||x<0)||parts[parts.length-1]>=60||parts.length===3&&parts[1]>=60)throw Error('زمان WebVTT معتبر نیست: '+s);return parts.reduce((a,b)=>a*60+b,0);}
function parseVtt(raw){raw=String(raw||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');if(!/^WEBVTT(?:\s|$)/.test(raw))throw Error('سربرگ WEBVTT پیدا نشد.');const out=[];for(const block of raw.split(/\n\s*\n/).slice(1)){const lines=block.split('\n');if(/^(NOTE|STYLE|REGION)(?:\s|$)/.test(lines[0]))continue;const i=lines.findIndex(x=>x.includes('-->'));if(i<0)continue;const m=lines[i].match(/^\s*([\d:.]+)\s+-->\s+([\d:.]+)(?:\s+.*)?$/);if(!m)throw Error('زمان‌بندی WebVTT خوانده نشد.');const start=time(m[1]),end=time(m[2]),text=lines.slice(i+1).join('\n').replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');if(end<=start)throw Error('پایان WebVTT باید بعد از شروع باشد.');if(text.trim())out.push({start,end,text:text.trim()});}if(!out.length)throw Error('کپشنی در WebVTT پیدا نشد.');return out;}
const stamp=n=>{n=Math.round(Math.max(0,+n||0)*1000);return [Math.floor(n/3600000),Math.floor(n/60000)%60,Math.floor(n/1000)%60].map(x=>String(x).padStart(2,'0')).join(':')+'.'+String(n%1000).padStart(3,'0');};
function vtt(groups){return 'WEBVTT\n\n'+groups.map((g,i)=>(i+1)+'\n'+stamp(g.start)+' --> '+stamp(g.end)+'\n'+String(g.rawText??g.text).replace(/[\u2066-\u2069]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r/g,'\n')+'\n').join('\n');}
function stack(groups,opts,geometry){
 if(!opts?.enabled)return groups;const n=Math.max(2,Math.min(7,+opts.lines||3)),gap=Math.max(1,+opts.gap||1.35),width=geometry?.width||1080,height=geometry?.height||1920,out=[],packs=[],activeScene47=g=>g.anim?.kinetic40&&g.anim.kinetic40.enabled!==false;
 for(const g of groups){let pack=packs[packs.length-1];if(!pack||pack.length>=n||activeScene47(pack[0])||activeScene47(g)||g.start-pack[pack.length-1].end>.72){pack=[];packs.push(pack);}pack.push(g);}
 for(const [p,pack]of packs.entries()){if(activeScene47(pack[0])){out.push(pack[0]);continue;}
  const end=Math.max(...pack.map(g=>g.end)),box=pack[0].safeBox,y1=box?box.y1*height:height*.08,y2=box?box.y2*height:height*.92;
  const heights=pack.map(g=>{const lines=Math.max(1,String(g.text||'').split(/[\r\n]/).length),leading=+g.style.leading>0?+g.style.leading:g.style.size*1.25,pad=g.bg?.enabled?Math.max(0,+g.bg.padding||0)*2:0;return Math.max(g.style.size,lines*leading)*Math.max(1,(+g.highlight37?.scale||100)/100)+pad;}),total=heights.reduce((a,b)=>a+b*gap,0),scale=Math.min(1,(y2-y1)*.9/Math.max(1,total)),used=total*scale;
  const center=Math.max(y1+used/2,Math.min(y2-used/2,pack[0].style.y*height/100)),anchorX=pack[0].style.x*width/100;let cursor=center-used/2;
  for(const [i,g]of pack.entries()){
   const row=heights[i]*gap*scale;g.style={...g.style,size:g.style.size*scale,y:(cursor+row/2)/height*100};if(+g.style.leading>0)g.style.leading*=scale;if(g.bg?.enabled)g.bg={...g.bg,padding:(+g.bg.padding||0)*scale};cursor+=row;
   const offset=opts.mode==='alternating'?(i%2?1:-1)*(+opts.offset||0):opts.mode==='scatter'?((i*37+p*17)%11-5)*(+opts.offset||0)/5:0;
   g.style.x=Math.max(box?box.x1*100+3:10,Math.min(box?box.x2*100-3:90,g.style.x+offset));g.end=end;g.stack37={id:'S'+pack[0].id,x:anchorX,y:center};out.push(g);
  }
 }
 return out;
}
function connect(S){
 const names=['regroup','merge','mergeRelative','splitGroup','unmerge','extractSelectedWords','moveSelectedWords'];
 for(const name of names){const original=S[name];S[name]=function(){const byWord=new Map();for(const g of S.groups){const ts=tokens(S.text(g));if(!g.highlight37||ts.length!==(g.wordIds||[]).length)continue;for(const t of marks(S.text(g),g.highlight37.words))byWord.set(g.wordIds[t.index],{color:g.highlight37.color,scale:g.highlight37.scale,manual38:g.highlight37.manual38,auto38:g.highlight37.auto38});}const result=original.apply(S,arguments);if(byWord.size)for(const g of S.groups){const ts=tokens(S.text(g));if(ts.length!==(g.wordIds||[]).length)continue;const chosen=ts.filter(t=>byWord.has(g.wordIds[t.index]));if(chosen.length){const h=byWord.get(g.wordIds[chosen[0].index]);g.highlight37={color:h.color,scale:h.scale,manual38:h.manual38,auto38:h.auto38,words:chosen.map(t=>({key:t.key,ordinal:t.ordinal}))};}}return result;};}
}

root.VarnaCaptions37={key,phrases,units,tokens,marks,ranges,suggest,parseVtt,vtt,stack,connect};
})(window);
