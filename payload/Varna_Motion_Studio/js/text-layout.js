(function(global){
'use strict';
// Balanced caption layout. Short/normal captions use the exact DP solver; very long
// captions use a bounded O(n) solver so the CEP panel never freezes before output.
function fastBalanced(words,count,measure){
 const n=words.length,parts=[];
 if(count<=1)return [words.slice()];
 const widths=new Array(n),space=Math.max(0,measure('a a')-measure('aa'));
 let total=0;
 for(let i=0;i<n;i++){widths[i]=Math.max(0,measure(words[i]));total+=widths[i]+(i?space:0);}
 let at=0,remaining=total;
 for(let line=0;line<count;line++){
  const linesLeft=count-line,wordsLeft=n-at;
  if(linesLeft===1){parts.push(words.slice(at));break;}
  const target=remaining/linesLeft;let start=at,w=0;
  const maxEnd=n-(linesLeft-1);
  while(at<maxEnd){
   const add=widths[at]+(at>start?space:0);
   if(at>start && w+add>target)break;
   w+=add;at++;
  }
  // Never emit an empty line and keep at least one word for every remaining line.
  if(at===start)at++;
  parts.push(words.slice(start,at));remaining=Math.max(0,remaining-w);
 }
 return parts;
}
function exactBalanced(words,count,measure){
 const n=words.length,cache=new Map(),metric=(a,b)=>{const k=a+':'+b;if(!cache.has(k))cache.set(k,measure(words.slice(a,b).join(' ')));return cache.get(k);};
 const dp=Array.from({length:count+1},()=>Array(n+1).fill(null));dp[0][0]={max:0,cost:0,breaks:[]};
 for(let l=1;l<=count;l++)for(let j=l;j<=n;j++)for(let k=l-1;k<j;k++){
  const prev=dp[l-1][k];if(!prev)continue;const w=metric(k,j),mx=Math.max(prev.max,w),cost=prev.cost+w*w;
  const old=dp[l][j];if(!old||mx<old.max-.01||(Math.abs(mx-old.max)<.01&&cost<old.cost))dp[l][j]={max:mx,cost,breaks:prev.breaks.concat(j)};
 }
 const best=dp[count][n];if(!best)return fastBalanced(words,count,measure);
 let from=0;return best.breaks.map(end=>{const line=words.slice(from,end);from=end;return line;});
}
function layout(raw,opts,measure){
 let words=String(raw||'').replace(/ـ/g,'').trim().split(/\s+/).filter(Boolean);
 if(global.VarnaCaptions37&&opts.protectedPhrases?.length)words=global.VarnaCaptions37.units(words,opts.protectedPhrases).map(unit=>unit.join(' '));
 if(!words.length)return {text:'',fontScale:1,lines:0};
 const maxLines=Math.max(1,Math.min(6,Math.floor(+opts.lines||2))),per=Math.max(1,+opts.wordsPerLine||4);
 const count=Math.min(maxLines,Math.max(1,Math.ceil(words.length/per))),width=Math.max(20,+opts.width||800)*.95;
 // Exact DP is excellent for normal subtitles but quadratic/cubic-ish with repeated text
 // measurement on paragraph-sized imports. Cap it and switch to a deterministic fast path.
 const EXACT_WORD_LIMIT=96;
 const lines=words.length<=EXACT_WORD_LIMIT?exactBalanced(words,count,measure):fastBalanced(words,count,measure);
 let widest=0;for(const ws of lines)widest=Math.max(widest,measure(ws.join(' ')));
 const scale=Math.min(1,width/Math.max(1,widest));
 const joining=/[بتثجحخسشصضطظعغفقكلمنهيئپچکگی]/,arabic=/[\u0621-\u063A\u0641-\u064A\u0671-\u06D3]/;
 if(opts.kashida && words.length<=160){
  for(const ws of lines){
   const maxCount=Math.max(0,Math.min(12,+opts.kashidaLength||0)),share=Math.max(0,Math.min(100,+opts.kashidaChance||0));
   const slots=[];ws.forEach((word,i)=>{for(let j=0;j<word.length-1;j++){if(joining.test(word[j])&&arabic.test(word[j+1])){slots.push({i,at:j+1,used:0,base:word});break;}}});
   const eligible=slots.slice(0,Math.ceil(slots.length*share/100));
   for(let r=0;r<maxCount;r++)for(const slot of eligible){const old=ws[slot.i],candidate=slot.base.slice(0,slot.at)+'ـ'.repeat(slot.used+1)+slot.base.slice(slot.at);ws[slot.i]=candidate;if(measure(ws.join(' '))*scale<=width)slot.used++;else ws[slot.i]=old;}
  }
 }
 return {text:lines.map(x=>x.join(' ')).join('\r'),fontScale:scale,lines:count,longTextFastPath:words.length>EXACT_WORD_LIMIT};
}
global.GHAFLayout={layout};
})(window);
