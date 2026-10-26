/* Shared word alignment. Unchanged words retain identity and audio anchors. */
(function(root,factory){
  var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.VarnaTiming=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const norm=s=>String(s||'').normalize('NFC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/\u200c/g,'').replace(/^[«(\["']+|[،؛:,.!?؟…»)\]"']+$/g,'').toLowerCase();
  function alignWords(source,text,options={}){
    const old=source.map(w=>Object.assign({},w)),tokens=Array.isArray(text)?text:String(text||'').trim().split(/\s+/).filter(Boolean);
    const value=w=>String(w.editedText!=null?w.editedText:w.text||'');
    const n=old.length,m=tokens.length;
    if(n*m>1000000)throw Error('متن برای هم‌ترازی یک‌باره طولانی است؛ بخش کوچک‌تری را انتخاب کنید.');
    let nextId=options.nextId||Math.max(0,...old.map(w=>+w.id||0))+1;
    const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
    for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=norm(value(old[i]))===norm(tokens[j])?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
    const anchors=[];let i=0,j=0;
    while(i<n&&j<m){if(norm(value(old[i]))===norm(tokens[j])){anchors.push([i++,j++]);}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;}
    anchors.push([n,m]);const out=[];let ai=0,bi=0;
    const updated=(w,t)=>{const x=Object.assign({},w,{text:t,editedText:null});if(norm(value(w))!==norm(t)){delete x.memoryCorrected;delete x.memoryOriginal;delete x.memoryOriginalPhrase;delete x.memoryCorrectionId;delete x.memoryRuleKey;}return x;};
    for(const [a,b] of anchors){
      const removed=old.slice(ai,a),added=tokens.slice(bi,b);
      if(added.length){
        if(removed.length===added.length){removed.forEach((w,k)=>out.push(updated(w,added[k])));}
        else{
          let start,end,estimated=false;
          if(removed.length){start=+removed[0].start;end=+removed[removed.length-1].end;}
          else{
            estimated=true;const left=out[out.length-1],right=a<n?old[a]:null;
            if(left&&right&&right.start-left.end>.001){start=+left.end;end=+right.start;}
            else if(left){end=right?Math.min(+left.end,+right.start):+left.end;const span=Math.max(.001,end-(+left.start));start=end-span*Math.min(.6,added.length/(added.length+1));left.end=start;}
            else if(right){end=+right.start;start=Math.max(0,end-Math.min(.2*added.length,.6));
              // At comp zero there is no free interval. Flag an estimate; never ripple future anchors.
              if(end<=start){start=+right.start;end=Math.min(+right.end,start+.08*added.length);}
            }else{start=Number(options.start)||0;end=Number(options.end)||start+Math.max(.1,.12*added.length);}
          }
          if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw Error('بازهٔ صوتی معتبر برای این ویرایش پیدا نشد.');
          added.forEach((t,k)=>{const base=removed[k]||{},w=updated(base,t);w.id=base.id!=null?base.id:nextId++;w.start=start+(end-start)*k/added.length;w.end=start+(end-start)*(k+1)/added.length;if(!removed[k])w.synthetic=true;w.anchorSource=estimated?'local-insertion-estimate':'local-replacement';out.push(w);});
        }
      }
      if(a<n)out.push(updated(old[a],tokens[b]));ai=a+1;bi=b+1;
    }
    return {words:out,nextId};
  }
  return {alignWords,norm};
});
