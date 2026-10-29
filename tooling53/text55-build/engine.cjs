'use strict';
const nspell = require('nspell');
const normalize = value => String(value || '').normalize('NFC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/ـ/g,'');
const informal = new Set('می‌خوام میخوام نمی‌خوام نمیخوام می‌خوای میخوای چطوری خوبی خوبم آره اونو اینو اون این خب باشه مرسی ممنون سلام خداحافظ واسه برام برات میشه نمیشه می‌شه نمی‌شه یه خیلی باحال خودم خودت خودمون خودتون می‌دونم میدونم نمی‌دونم نمیدونم می‌تونم میتونم نمی‌تونم نمیتونم چرا چطور چطوره'.split(' '));
// A small, authored phrase lexicon, not a trained language-identification model.
const finglish = {salam:['سلام'],chetori:['چطوری'],chetory:['چطوری'],khobi:['خوبی'],khoobi:['خوبی'],khobam:['خوبم'],khoobam:['خوبم'],mersi:['مرسی'],mamnoon:['ممنون'],mamnun:['ممنون'],mikham:['می‌خوام','می‌خواهم'],mikhaham:['می‌خواهم'],mikhay:['می‌خوای'],nemikham:['نمی‌خوام'],mishe:['میشه','می‌شه'],nemishe:['نمیشه','نمی‌شه'],sobh:['صبح'],shab:['شب'],bekheir:['بخیر'],khodahafez:['خداحافظ'],khodafez:['خداحافظ'],dust:['دوست'],doost:['دوست'],daram:['دارم'],dari:['داری'],baraye:['برای'],baram:['برام'],barat:['برات'],vase:['واسه'],vaseh:['واسه'],emrooz:['امروز'],emruz:['امروز'],farda:['فردا'],dirooz:['دیروز'],diruz:['دیروز'],kheili:['خیلی'],kheyli:['خیلی'],khob:['خوب','خب'],khoob:['خوب'],khoobe:['خوبه'],bale:['بله'],are:['آره'],na:['نه'],badan:['بعداً','بدن'],bad:['بعد','بد'],kar:['کار'],video:['ویدیو'],matn:['متن'],seda:['صدا'],ahang:['آهنگ'],jadval:['جدول'],rang:['رنگ'],ketab:['کتاب'],man:['من'],to:['تو'],ma:['ما'],in:['این'],oon:['اون'],on:['آن'],chera:['چرا'],cheraaa:['چرا'],chetor:['چطور'],bego:['بگو'],bebin:['ببین'],dorost:['درست'],ghalat:['غلط'],bashe:['باشه'],nemidonam:['نمی‌دونم'],midonam:['می‌دونم'],mitoonam:['می‌تونم'],mitunam:['می‌تونم'],'alan':['الان']};
function tokenize(text) {
 const out=[], re=/https?:\/\/\S+|\S+@\S+|[A-Za-z0-9_]+(?:[./:@-][A-Za-z0-9_]+)+|[A-Za-z\u0621-\u063a\u0641-\u064a\u0671-\u06d3][A-Za-z\u0621-\u063a\u0641-\u064a\u0671-\u06d3\u064b-\u065f\u200c'’-]*/g; let m;
 while ((m=re.exec(String(text)))) {const raw=m[0], trimmed=raw.replace(/[،؛؟]+$/g,'');if(trimmed)out.push({text:trimmed,start:m.index,end:m.index+trimmed.length});}
 return out;
}
function distance(a,b){if(a.length===b.length){const at=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])at.push(i);if(at.length===2&&at[1]===at[0]+1&&a[at[0]]===b[at[1]]&&a[at[1]]===b[at[0]])return 1;}let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=row;}return prev[b.length];}
function applyEdit(text,range,replacement,selection){
 if(!Number.isInteger(range.start)||!Number.isInteger(range.end)||range.start<0||range.end<range.start||range.end>text.length)throw Error('Invalid correction range');
 if(range.wrong!=null&&text.slice(range.start,range.end)!==range.wrong)throw Error('Text changed; review again');
 const delta=replacement.length-(range.end-range.start),pos=n=>n<=range.start?n:n>=range.end?n+delta:range.start+replacement.length;
 return {text:text.slice(0,range.start)+replacement+text.slice(range.end),selection:selection?{start:pos(selection.start),end:pos(selection.end),direction:selection.direction}:null};
}
function create(options){
 const dictionaries={fa:nspell(options.fa),en:nspell(options.en)}, cache=new Map();let userWords;
 function setUserWords(words){userWords=new Set((Array.isArray(words)?words:[]).slice(0,10000).map(x=>normalize(x).toLowerCase()));cache.clear();}
 setUserWords(options.userWords);
 function suggest(token,opts={}){
  const word=normalize(token),latin=/^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(word),fa=/^[\u0600-\u06ff\u200c]+$/.test(word),lang=opts.language==='finglish'?'finglish':fa?'fa':latin?'en':'other';
  const result={token,normalized:word,language:lang,correct:true,suggestions:[],auto:null};
  if(!word||word.length>48||lang==='other'||userWords.has(word.toLowerCase())||informal.has(word))return result;
  if(latin&&(/[A-Z]{2}/.test(word)||/[a-z][A-Z]/.test(word)))return result;
  const dict=dictionaries[fa?'fa':'en'],known=dict.correct(word);
  // Known English words stay English unless the user explicitly requests Finglish.
  if(latin&&opts.finglish!==false&&(opts.language==='finglish'||!known)&&finglish[word.toLowerCase()]){
   result.correct=false;result.language='finglish';result.suggestions=finglish[word.toLowerCase()].map(text=>({text,kind:'finglish',confidence:.6}));return result;
  }
  if(latin&&opts.finglish!==false&&!known&&word.length>=5){const similar=Object.keys(finglish).filter(k=>k[0]===word[0].toLowerCase()&&distance(k,word.toLowerCase())===1);if(similar.length){result.correct=false;result.language='finglish';result.suggestions=[...new Set(similar.flatMap(k=>finglish[k]))].slice(0,5).map(text=>({text,kind:'finglish',confidence:.4}));return result;}}
  if(opts.language==='finglish'&&latin){result.correct=false;return result;}
  result.correct=known;if(known&&word===token)return result;
  const candidates=[];
  if(word!==token&&known)candidates.push({text:word,kind:'normalize',confidence:1});
  if(fa){const spaced=word.replace(/^(ن?می)(?!\u200c)(.{2,})$/,'$1\u200c$2');if(spaced!==word&&dict.correct(spaced))candidates.push({text:spaced,kind:'spacing',confidence:.8});}
  if(!known){for(let i=0;i<word.length-1;i++){const transposed=word.slice(0,i)+word[i+1]+word[i]+word.slice(i+2);if(transposed!==word&&dict.correct(transposed)&&!candidates.some(c=>c.text===transposed))candidates.push({text:transposed,kind:'spelling',confidence:.8});}const key=lang+':'+word;let list=cache.get(key);if(!list){list=dict.suggest(word).slice(0,40);cache.set(key,list);if(cache.size>500)cache.delete(cache.keys().next().value);}for(const text of list)if(!candidates.some(c=>c.text===text))candidates.push({text,kind:'spelling',confidence:Math.max(.2,.85-distance(word,text)*.15)});}
  // Rank explicitly supplied local context pairs. No network or neural model is used.
  for(const c of candidates){if((opts.contextPairs||[]).some(p=>p.wrong===token&&p.right===c.text&&p.before===opts.before&&p.after===opts.after))c.confidence=Math.min(.95,c.confidence+.15);}
  result.suggestions=candidates.sort((a,b)=>b.confidence-a.confidence).slice(0,6);result.auto=candidates.find(c=>c.kind==='normalize')||null;return result;
 }
 function inspect(text,opts={}){if(typeof text!=='string'||text.length>20000)throw Error('Review one caption at a time (maximum 20,000 characters)');const tokens=tokenize(text),out=[];for(let i=0;i<tokens.length;i++){const t=tokens[i],next=tokens[i+1];if(next&&(/^(?:ن?می)$/.test(t.text)||/^(?:ها|های)$/.test(next.text))&&/^ +$/.test(text.slice(t.end,next.start))){const combined=normalize(t.text)+'\u200c'+normalize(next.text);if(dictionaries.fa.correct(combined)||informal.has(combined)){const raw=text.slice(t.start,next.end);if(!opts.protectedPhrases?.some(p=>p===raw||p===t.text||p===next.text)) {out.push({token:raw,normalized:combined,language:'fa',correct:false,start:t.start,end:next.end,suggestions:[{text:combined,kind:'spacing',confidence:.8}],auto:null});i++;continue;}}}if(opts.protectedPhrases?.some(p=>normalize(p).split(/\s+/).includes(normalize(t.text))))continue;const row=suggest(t.text,{...opts,before:tokens[i-1]?.text||'',after:tokens[i+1]?.text||''});if(!row.correct||row.suggestions.length)out.push({...row,start:t.start,end:t.end});if(out.length>=100)break;}return out;}
 return {suggest,inspect,setUserWords};
}
module.exports={create,normalize,tokenize,applyEdit,distance};
