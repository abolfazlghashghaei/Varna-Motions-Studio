/* Exact alias families. Similar, unknown spellings require human approval. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.VarnaCorrections=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const edges=/^[«“‘(\[{"']+|[،؛:,.!?؟…»”’\)\]}"']+$/g;
const clean=x=>String(x||'').trim().replace(edges,'');
const key=x=>String(x||'').trim().replace(/[\u064B-\u065F\u0670]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ـ\u200c\u200d]/g,'').replace(/\s+/g,' ').toLowerCase();
const token=x=>key(clean(x)),phrase=x=>String(x||'').trim().split(/\s+/).map(token).join(' ');
const riskySingles=new Set(['و','یا','به','از','در','که','را','با','تا','من','تو','او','ما','این','آن','هم','یک']);
const numeric=x=>/^[0-9۰-۹٠-٩]+$/.test(x);
function safeAuto(wrong,right,mode){
 const w=phrase(wrong).split(' ').filter(Boolean),r=phrase(right).split(' ').filter(Boolean);
 if(!w.length||!r.length||w.join(' ')===r.join(' ')||mode==='manual')return false;
 if(mode==='context'){
   // Both unchanged neighbours are required. A single neighbour can be a common word
   // and is not enough evidence to expand one ASR token into several tokens everywhere.
   const middleW=w.slice(1,-1),middleR=r.slice(1,-1);
   return w.length>=3&&r.length>=3&&w[0]===r[0]&&w[w.length-1]===r[r.length-1]
     &&middleW.length>0&&middleR.length>0
     &&middleW.length<=3&&middleR.length<=5
     &&!middleW.some(numeric)
     &&!middleW.some(x=>x.length===1||/[.!?؟؛]/.test(x))
     &&!(middleW.length===1&&(middleW[0].length<2||riskySingles.has(middleW[0])||numeric(middleW[0])))
     &&!(middleR.length===1&&numeric(middleR[0]))
     &&middleW.join(' ')!==middleR.join(' ');
 }
 // A bare token, even an exact alias, can have a different meaning elsewhere.
 // Only an unchanged word on each side authorizes an automatic replacement.
 return false;
}
function inferredAuto(wrong,right){return safeAuto(wrong,right,'token');}
function database(input){const db={version:5,items:[],preferences:{}};for(const p of input&&input.items||[]){const wrong=clean(p.wrong),right=clean(p.right),wk=phrase(wrong),rk=phrase(right);if(!wk||!rk||wk===rk)continue;const mode=p.mode||((wk.split(' ').length===rk.split(' ').length)?'token':'legacy'),autoApply=p.autoApply!==false&&safeAuto(wrong,right,mode),canonical=mode==='context'?clean(p.canonical):'';const hit=db.items.find(x=>x.wrongKey===wk&&x.rightKey===rk);if(hit){hit.count=Math.max(hit.count,+p.count||1);hit.autoApply=hit.autoApply&&autoApply;if(p.mode)hit.mode=p.mode;if(canonical)hit.canonical=canonical;}else db.items.push({wrong,right,wrongKey:wk,rightKey:rk,count:Math.max(1,+p.count||1),updatedAt:p.updatedAt||'',autoApply,mode,canonical});}for(const k of Object.keys(input&&input.preferences||{})){const wk=phrase(k),rk=phrase(input.preferences[k]);if(db.items.some(x=>x.wrongKey===wk&&x.rightKey===rk))db.preferences[wk]=rk;}return db;}
function rules(input){const db=database(input),buckets=new Map();db.items.forEach(x=>{if(!buckets.has(x.wrongKey))buckets.set(x.wrongKey,[]);buckets.get(x.wrongKey).push(x);});const entries=[...buckets.entries()].map(([wk,items])=>{const selected=items.find(x=>x.rightKey===db.preferences[wk]);return Object.assign({},selected||items[0],!selected&&items.length>1?{ambiguous:items}:{});}),index=new Map(entries.map(x=>[x.wrongKey,x]));return entries.map(item=>{const r=Object.assign({},item),seen=new Set([r.wrongKey]);if(!r.ambiguous)for(let n=0;n<32;n++){const next=index.get(r.rightKey);if(!next||next.ambiguous||seen.has(next.rightKey))break;seen.add(r.rightKey);r.right=next.right;r.rightKey=next.rightKey;}return r;}).sort((a,b)=>b.wrongKey.split(' ').length-a.wrongKey.split(' ').length||b.wrongKey.length-a.wrongKey.length);}
function learn(input,pairs,options){let db=database(input);const now=new Date().toISOString();options=options||{};for(const p of pairs||[]){let wrong=clean(p.wrong),right=clean(p.right),wk=phrase(wrong),rk=phrase(right);if(!wk||!rk||wk===rk||wrong.length>250||right.length>250)continue;
 const explicitAuto=typeof p.autoApply==='boolean',mode=p.mode||((wk.split(' ').length===rk.split(' ').length)?'token':'direct'),autoApply=p.autoApply!==false&&safeAuto(wrong,right,mode),familyLabel=mode==='context'?clean(p.canonical):'';
 const canonical=db.items.some(x=>x.rightKey===wk),previous=db.items.filter(x=>x.wrongKey===wk);
 if(canonical&&(!previous.length||options.recanonicalize)){for(const x of db.items)if(x.rightKey===wk){x.right=right;x.rightKey=rk;x.updatedAt=now;if(explicitAuto)x.autoApply=autoApply;if(p.mode)x.mode=mode;}for(const k of Object.keys(db.preferences))if(db.preferences[k]===wk)db.preferences[k]=rk;}
 const visited=new Set([wk]);for(let n=0;n<32;n++){const r=rules(db).find(x=>x.wrongKey===rk&&!x.ambiguous&&x.autoApply!==false);if(!r||visited.has(rk)||r.rightKey===wk)break;visited.add(rk);right=r.right;rk=r.rightKey;}
 if(options.replaceAlias){db.items=db.items.filter(x=>x.wrongKey!==wk);delete db.preferences[wk];}
 const hit=db.items.find(x=>x.wrongKey===wk&&x.rightKey===rk);if(hit){hit.count++;hit.updatedAt=now;if(explicitAuto)hit.autoApply=autoApply;if(p.mode)hit.mode=mode;if(familyLabel)hit.canonical=familyLabel;}else db.items.push({wrong,right,wrongKey:wk,rightKey:rk,count:1,updatedAt:now,autoApply,mode,canonical:familyLabel});
 }return database(db);}
function groups(input){const map=new Map();for(const x of database(input).items){const right=x.canonical||x.right,k=phrase(right);if(!map.has(k))map.set(k,{right,rightKey:k,aliases:[],count:0});const g=map.get(k);g.aliases.push(x);g.count+=x.count;}return [...map.values()].sort((a,b)=>b.count-a.count||a.right.localeCompare(b.right));}
function protectedMask(tokens,phrases){const mask=new Set(),keys=tokens.map(x=>token(typeof x==='string'?x:(x.raw!=null?x.raw:(x.editedText!=null?x.editedText:x.text))));for(const term of phrases||[]){const parts=String(term||'').trim().split(/\s+/).map(token).filter(Boolean);if(!parts.length||parts.length>16)continue;for(let i=0;i<=keys.length-parts.length;i++)if(parts.every((part,j)=>keys[i+j]===part))for(let j=0;j<parts.length;j++)mask.add(i+j);}return mask;}
function applyText(text,input,options){text=String(text||'');const entries=Array.isArray(input)?input:rules(input),tokens=[],edits=[],ambiguities=[],covered=new Set();let m;const re=/\S+/g;while((m=re.exec(text)))tokens.push({raw:m[0],key:token(m[0]),start:m.index,end:re.lastIndex});const protectedWords=protectedMask(tokens,options&&options.protectedPhrases);
 const matches=(i,parts)=>parts.length<=tokens.length-i&&parts.every((part,j)=>!protectedWords.has(i+j)&&tokens[i+j].key===part&&(j===parts.length-1||!/[،.!?؟؛][»”’\)\]}"']*$/.test(tokens[i+j].raw)));
 for(let i=0;i<tokens.length;){let match=null;for(const r of entries){if(r.autoApply===false||!safeAuto(r.wrong,r.right,r.mode||'token'))continue;const parts=r.wrongKey.split(' ');if(matches(i,parts)){match={r,n:parts.length};break;}}
  if(!match){i++;continue;}const first=tokens[i],last=tokens[i+match.n-1],r=match.r;if(r.ambiguous){ambiguities.push({wrong:text.slice(first.start,last.end),start:first.start,end:last.end,candidates:r.ambiguous});for(let j=0;j<match.n;j++)covered.add(i+j);i+=match.n;continue;}const pre=(first.raw.match(/^[«“‘(\[{"']+/)||[''])[0],post=(last.raw.match(/[،؛:,.!?؟…»”’\)\]}"']+$/)||[''])[0];edits.push({start:first.start,end:last.end,from:text.slice(first.start,last.end),to:pre+r.right+post,ruleKey:r.wrongKey});for(let j=0;j<match.n;j++)covered.add(i+j);i+=match.n;
 }
 // A learned alias is a review candidate whenever its two neighbours differ.
 // No fuzzy or single-neighbour match can silently modify the transcript.
 const candidates=[];for(const entry of entries)for(const r of entry.ambiguous||[entry]){if(r.mode==='context'){const w=r.wrongKey.split(' '),right=r.rightKey.split(' ');if(w.length>=3&&right.length>=3&&w[0]===right[0]&&w[w.length-1]===right[right.length-1])candidates.push({parts:w.slice(1,-1),right:r.canonical||r.right.split(/\s+/).slice(1,-1).join(' '),count:r.count||1});}else if(!r.autoApply&&r.mode!=='legacy')candidates.push({parts:r.wrongKey.split(' '),right:r.right,count:r.count||1});}
 for(let i=0;i<tokens.length;i++){if(covered.has(i))continue;const applicable=candidates.filter(c=>c.parts.length&&matches(i,c.parts)&&c.parts.every((_,j)=>!covered.has(i+j)));if(!applicable.length)continue;const n=Math.max(...applicable.map(c=>c.parts.length)),best=applicable.filter(c=>c.parts.length===n),first=tokens[i],last=tokens[i+n-1],choices=[...new Map(best.map(c=>[phrase(c.right),{right:c.right,count:c.count}])).values()].filter(c=>c.right&&phrase(c.right)!==phrase(text.slice(first.start,last.end)));if(choices.length)ambiguities.push({wrong:text.slice(first.start,last.end),start:first.start,end:last.end,candidates:choices});for(let j=0;j<n;j++)covered.add(i+j);i+=n-1;}
 let result=text;for(let i=edits.length-1;i>=0;i--)result=result.slice(0,edits[i].start)+edits[i].to+result.slice(edits[i].end);return {text:result,hits:edits.length,edits,ambiguities};}
function distance(a,b){let p=Array.from({length:b.length+1},(_,j)=>j);for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[b.length];}
function suggest(text,input){const db=database(input),known=new Set(db.items.flatMap(x=>[x.wrongKey,x.rightKey])),entries=rules(db).filter(x=>!x.ambiguous&&!/\s/.test(x.wrongKey)&&!/\s/.test(x.rightKey)),out=[],seen=new Set();for(const raw of String(text||'').split(/\s+/)){const k=token(raw);if(k.length<4||known.has(k)||seen.has(k))continue;seen.add(k);let best=Infinity,targets=new Map();for(const r of entries)for(const form of [r.wrongKey,r.rightKey]){if(form[0]!==k[0]||Math.abs(form.length-k.length)>1)continue;const d=distance(k,form);if(d>1)continue;if(d<best){best=d;targets.clear();}if(d===best)targets.set(r.rightKey,r.right);}if(targets.size===1)out.push({wrong:clean(raw),right:[...targets.values()][0]});if(out.length>=80)break;}return out;}
function diffMarks(before,after){before=String(before||'');after=String(after||'');const lex=s=>{const out=[],re=/\S+/g;let m;while((m=re.exec(s)))out.push({text:m[0],start:m.index,end:m.index+m[0].length,key:token(m[0])});return out;},a=lex(before),b=lex(after),n=a.length,m=b.length;if(n*m>20000)return [];
 const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i].key===b[j].key?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,ai=0,bj=0;const marks=[];const flush=()=>{if(ai===i&&bj===j)return;if(bj<j){const start=b[bj].start,end=b[j-1].end;marks.push({start,end,from:ai<i?before.slice(a[ai].start,a[i-1].end):'',to:after.slice(start,end),source:'manual'});}ai=i;bj=j;};
 while(i<n&&j<m){if(a[i].key===b[j].key){flush();i++;j++;ai=i;bj=j;}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;}i=n;j=m;flush();return marks;
}
// Review is intentionally separate from applyText: exact context, the word itself,
// approved aliases and nearby spellings all produce proposals, never mutations.
function reviewMatches(text,input,options){
 options=options||{};text=String(text||'');const lex=[],re=/\S+/g;let hit;while((hit=re.exec(text)))lex.push({raw:hit[0],key:token(hit[0]),start:hit.index,end:re.lastIndex});
 const protectedWords=protectedMask(lex,options.protectedPhrases),excluded=new Set(options.excluded||[]),sources=[];
 const pair=options.pair,goal=pair?phrase(pair.right):null;
 for(const r of database(input).items){let wrong=r.wrong,right=r.right,left=null,next=null;
  if(r.mode==='context'){const a=wrong.split(/\s+/),b=right.split(/\s+/);if(a.length<3||b.length<3||token(a[0])!==token(b[0])||token(a[a.length-1])!==token(b[b.length-1]))continue;left=token(a[0]);next=token(a[a.length-1]);wrong=a.slice(1,-1).join(' ');right=r.canonical||b.slice(1,-1).join(' ');}
  if(goal&&phrase(right)!==goal)continue;if(excluded.has(r.wrongKey)||excluded.has(phrase(wrong)))continue;
  sources.push({wrong,right,left,next,ruleKey:r.wrongKey,count:r.count||1});
 }
 if(pair&&pair.wrong&&pair.right&&!excluded.has(phrase(pair.wrong)))sources.push({wrong:pair.wrong,right:pair.right,ruleKey:phrase(pair.wrong),count:1});
 const out=new Map();for(const rule of sources){const parts=phrase(rule.wrong).split(' ').filter(Boolean);if(!parts.length||parts.length>16)continue;
  for(let i=0;i<=lex.length-parts.length;i++){if(parts.some((_,j)=>protectedWords.has(i+j)))continue;
   const exact=parts.every((v,j)=>v===lex[i+j].key),near=!exact&&options.similar!==false&&parts.length===1&&parts[0].length>=3&&lex[i].key.length>=3&&!riskySingles.has(parts[0])&&!riskySingles.has(lex[i].key)&&!numeric(parts[0])&&!numeric(lex[i].key)&&Math.abs(parts[0].length-lex[i].key.length)<=1&&distance(parts[0],lex[i].key)===1;
   if(!exact&&!near)continue;if(parts.some((_,j)=>j<parts.length-1&&/[،.!?؟؛][»”’\)\]}"']*$/.test(lex[i+j].raw)))continue;
   const first=lex[i],last=lex[i+parts.length-1],pre=(first.raw.match(/^[«“‘(\[{"']+/)||[''])[0],post=(last.raw.match(/[،؛:,.!?؟…»”’\)\]}"']+$/)||[''])[0],right=pre+clean(rule.right)+post;
   if(phrase(text.slice(first.start,last.end))===phrase(right))continue;
   const reason=near?'similar':rule.left&&lex[i-1]?.key===rule.left&&lex[i+parts.length]?.key===rule.next?'context':'word';
   const id=first.start+':'+last.end;let row=out.get(id);if(!row){row={start:first.start,end:last.end,wrong:text.slice(first.start,last.end),candidates:[]};out.set(id,row);}
   const prior=row.candidates.find(c=>phrase(c.right)===phrase(right));if(!prior)row.candidates.push({right,reason,ruleKey:rule.ruleKey,count:rule.count});else if(reason==='context'||prior.reason==='similar'&&reason==='word'){prior.reason=reason;prior.ruleKey=rule.ruleKey;}
  }
 }return [...out.values()].sort((a,b)=>a.start-b.start||b.end-a.end).slice(0,options.limit||Infinity);
}
return {key,token,phrase,database,learn,rules,groups,applyText,reviewMatches,protectedMask,suggest,inferredAuto,safeAuto,diffMarks};
});
