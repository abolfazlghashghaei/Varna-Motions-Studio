(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaSfxPolicy=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const atmo=new Set(['ambience','nature','city','room','music']);
 const families={click:['click','ui','pop','typing'],ui:['ui','click','pop','tonal'],pop:['pop','click','ui'],typing:['typing','click'],whoosh:['whoosh'],hit:['hit','pop'],riser:['riser'],downer:['downer','whoosh'],glitch:['glitch'],foley:['foley'],mechanical:['mechanical'],tonal:['tonal'],other:['other']};
 function allowed(event,policy={}){
  if(event.meta?.role==='caption')return policy.captions===true;
  const map={cut:'cuts',scene:'scenes',motion:'motion',effect:'effects',marker:'markers',typography:'typography',textIn:'typography',textOut:'typography'};
  return ['typography','textIn','textOut'].includes(event.type)?policy.typography===true:policy[map[event.type]]!==false;
 }
 function eligible(file,category,event){
  if(atmo.has(category))return file.category===category;
  if(atmo.has(file.category)||!(families[category]||[]).includes(file.category))return false;
  const strength=+event?.strength||50,small=event?.type==='cut'||(['textIn','textOut'].includes(event?.type));
  const text=(file.name+' '+file.folder).toLowerCase();
  if((small||strength<72)&&/heavy|massive|cinematic|explosion|boom|slam|long|riser/.test(text))return false;
  if(Number.isFinite(file.duration)){
   const limit=small?1.1:(category==='riser'?Math.max(1.5,+event?.meta?.duration||0):strength<72?1.8:4.5);
   if(file.duration>limit)return false;
  }
  return true;
 }
 function snap(event,beat,mode='soft'){
  const time=+event.time;if(mode==='off'||!beat?.compBeats?.length||(+beat.confidence||0)<(mode==='strong'?35:55)||(+event.strength||0)<72)return {time,beatOffset:null};
  if(!['cut','scene','motion','effect'].includes(event.type))return {time,beatOffset:null};
  let best=time,dist=mode==='strong'?.12:.06;for(const t of beat.compBeats){const d=Math.abs(t-time);if(d<dist){best=t;dist=d;}}
  return {time:best,beatOffset:best===time?null:best-time};
 }
 return {allowed,eligible,snap};
});
