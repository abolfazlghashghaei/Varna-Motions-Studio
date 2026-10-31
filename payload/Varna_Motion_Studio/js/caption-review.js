/* Conservative subtitle timing and sentence diagnostics. No guessed audio is moved. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaCaptionReview=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const endSentence=t=>/[.!?؟…]+[»"'\)\]]*$/.test(String(t||''));
function inspect(groups,words,options={}){
 const byId=new Map((words||[]).map(w=>[w.id,w])),issues=[],splits=[],anchors=new Map(),fps=Math.max(1,+options.fps||25),frame=1/fps;
 const start=g=>g.manual?(+g.start||0):(g.startOverride!=null?+g.startOverride:(+byId.get(g.wordIds?.[0])?.start||0));
 const end=g=>g.manual?(+g.end||start(g)+1):(g.endOverride!=null?+g.endOverride:(+byId.get(g.wordIds?.[g.wordIds.length-1])?.end||start(g)+1));
 const sorted=[...(groups||[])].sort((a,b)=>start(a)-start(b));
 for(const g of sorted){
  const ids=g.wordIds||[],list=ids.map(id=>byId.get(id)).filter(Boolean);
  if(!g.manual&&list.length){
   const ordered=list.every((w,i)=>!i||w.start+frame*.2>=list[i-1].start);
   if(!ordered){issues.push({type:'order',id:g.id,message:'ترتیب واژه‌ها با زمان گفتار یکی نیست',fixable:false});continue;}
   const a={start:+list[0].start,end:+list[list.length-1].end};anchors.set(g.id,a);
   if(Math.abs(start(g)-a.start)>frame||Math.abs(end(g)-a.end)>frame)issues.push({type:'drift',id:g.id,message:'مرز این کپشن با زمان واژه‌ها اختلاف دارد',fixable:true});
   if(list.some(w=>w.anchorSource==='local-insertion-estimate'||w.source==='manual-import'))issues.push({type:'estimate',id:g.id,message:'زمان واژهٔ افزوده/واردشده تخمینی است؛ با صدا بررسی کن',fixable:false});
   // A sentence boundary inside the group is safe to split only when visible words
   // and audio slots have the same count; otherwise the user chooses the boundary.
   const visible=String(g.textOverride!=null?g.textOverride:list.map(w=>w.text).join(' ')).trim().split(/\s+/).filter(Boolean);
   for(let i=0;i<list.length-1;i++)if(endSentence(visible[i]||list[i].text)){
    const fixable=visible.length===list.length;
    issues.push({type:'sentence',id:g.id,at:i+1,message:'پایان جمله داخل کپشن قرار گرفته'+(fixable?'؛ قابل تفکیک':'؛ محل شکست را دستی تعیین کن'),fixable});
    if(fixable)splits.push({id:g.id,at:i+1});
   }
  }
 }
 for(let i=0;i<sorted.length-1;i++){
  const a=sorted[i],b=sorted[i+1],delta=start(b)-end(a),aa=anchors.get(a.id),bb=anchors.get(b.id);
  if(delta<-.5*frame){const fixable=!!aa&&!!bb&&aa.end<=bb.start+frame*.2;issues.push({type:'overlap',id:a.id,nextId:b.id,seconds:-delta,message:'هم‌پوشانی دو کپشن'+(fixable?'؛ مرزهای صوتی قابل بازیابی‌اند':'؛ واژه‌ها/زمان‌های گفتار را دستی بررسی کن'),fixable});}
  else if(delta>Math.max(.7,+options.longGap||.7))issues.push({type:'silence',id:a.id,nextId:b.id,seconds:delta,message:'فاصلهٔ بدون متن؛ اگر در اینجا گفتار هست، زمان واژه را بررسی کن',fixable:false});
  else if(delta>=0&&delta<frame*.5&&aa&&bb)issues.push({type:'tight',id:a.id,nextId:b.id,message:'مرز بسیار نزدیک؛ زمان گفتار حفظ می‌شود',fixable:false});
 }
 return {issues,splits,anchors,frame,fixable:issues.filter(x=>x.fixable).length};
}
return {inspect,endSentence};
});
