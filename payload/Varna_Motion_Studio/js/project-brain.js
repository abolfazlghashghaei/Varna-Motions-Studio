(function(root, factory) {
  var api=factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VarnaProjectBrain = api;
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  var PROFILES = {
    luxury: {label:'لوکس',accent:'#D6B77A',motion:'rise',density:0.24,glass:12},
    corporate: {label:'شرکتی',accent:'#A9CBEC',motion:'fade',density:0.22,glass:10},
    tech: {label:'تکنولوژی',accent:'#80D9F4',motion:'rise',density:0.32,glass:15},
    energetic: {label:'پرانرژی',accent:'#F3B660',motion:'pop',density:0.52,glass:18},
    editorial: {label:'ادیتوریال',accent:'#E9DCC9',motion:'fade',density:0.23,glass:8},
    minimal: {label:'مینیمال',accent:'#C8D8E7',motion:'none',density:0.12,glass:8}
  };
  function finite(value, fallback) { var n=Number(value); return isFinite(n)?n:fallback; }
  function cleanBrief(value) { return String(value||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,600); }
  function profileFor(key) { return PROFILES[key]||PROFILES.minimal; }
  function selectProfile(brief, key) {
    if (PROFILES[key]) return key;
    var s=cleanBrief(brief).toLowerCase();
    if (/لوکس|luxury|premium|لاکچری/.test(s)) return 'luxury';
    if (/شرکتی|corporate|رسمی/.test(s)) return 'corporate';
    if (/تکنولوژی|tech|دیجیتال/.test(s)) return 'tech';
    if (/انرژی|energetic|هیجان/.test(s)) return 'energetic';
    if (/editorial|مجله/.test(s)) return 'editorial';
    return 'minimal';
  }
  function normalize(input) {
    input=input||{};
    var captions=Array.isArray(input.captions)?input.captions:[];
    var analysis=input.analysis||{};
    var events=Array.isArray(analysis.events)?analysis.events:[];
    var brief=cleanBrief(input.brief);
    var profile=selectProfile(brief,input.profile);
    var total=finite(analysis.comp&&analysis.comp.duration,0);
    captions.forEach(function(c) { total=Math.max(total,finite(c.end,0)); });
    return {version:1,brief:brief,profile:profile,compId:analysis.comp&&analysis.comp.id||null,duration:total,
      captions:captions.map(function(c) {return {id:c.id,text:String(c.rawText||c.text||'').slice(0,500),start:finite(c.start,0),end:finite(c.end,0),manual:!!c.manual};}),
      events:events.filter(function(e){return e&&isFinite(Number(e.time));}).map(function(e){return {time:finite(e.time,0),type:String(e.type||''),strength:finite(e.strength,0),role:String(e.meta&&e.meta.role||'')};})};
  }
  function propose(input) {
    var context=normalize(input),profile=profileFor(context.profile),items=[],lastMotion=-100;
    context.captions.forEach(function(c,index) {
      if (!c.text.trim() || c.end<=c.start) return;
      var numeric=/(?:\d|[۰-۹])+(?:[.,٫٪%]|\s*(?:برابر|درصد|میلیون|هزار|%|٪))/.test(c.text);
      var cta=/\b(?:buy|order|subscribe|contact)\b|خرید|سفارش|تماس|همین حالا|ثبت نام/.test(c.text.toLowerCase());
      var headline=(index===0&&c.text.length<=60);
      var forceQuiet=/شلوغ نکن|بدون افکت|بدون موشن|کم صدا|ساکت/.test(context.brief);
      var priority=cta?90:numeric?76:headline?62:0;
      if (!priority) return;
      if (forceQuiet && !cta && !numeric) return;
      if (c.start-lastMotion<Math.max(1.2,2.8-profile.density*2)) return;
      var kind=cta?'cta':numeric?'number':'title';
      var motion=forceQuiet?'none':(cta&&context.profile==='energetic'?'pop':profile.motion);
      items.push({id:'caption-'+String(c.id)+'-'+kind,kind:kind,groupId:c.id,time:c.start,priority:priority,
        title:kind==='cta'?'دعوت به اقدام':kind==='number'?'عدد مهم':'شروع ویدیو',
        detail:c.text.slice(0,110),motion:motion,accent:profile.accent,glassOpacity:profile.glass,
        enabled:true,actions:{motion:motion!=='none',accent:kind==='number'||kind==='cta',glass:kind==='cta'},source:'caption'});
      lastMotion=c.start;
    });
    var lastCut=-100;
    context.events.filter(function(e){return /cut|scene|transition/i.test(e.type)&&e.role!=='caption'&&e.strength>=65;})
      .sort(function(a,b){return a.time-b.time;}).forEach(function(e) {
        if (e.time-lastCut<0.8 || /کم صدا|بدون صدا|no sfx/i.test(context.brief)) return;
        items.push({id:'cut-'+Math.round(e.time*1000),kind:'cut',groupId:null,time:e.time,priority:Math.min(90,e.strength),
          title:'تغییر تصویر',detail:'صدای کوتاه و نرم پیشنهاد می‌شود؛ پیش از قرارگیری باید فایل صدا انتخاب شود.',enabled:false,
          actions:{sfx:true},source:'composition'});lastCut=e.time;
      });
    items.sort(function(a,b){return a.time-b.time||b.priority-a.priority;});
    return {version:1,context:context,items:items,generatedAt:new Date().toISOString()};
  }
  function apply(plan, enabledIds, state) {
    if (!plan||plan.version!==1||!Array.isArray(plan.items)) throw Error('Invalid Director plan');
    if (!state||!Array.isArray(state.groups)||typeof state.pushUndo!=='function') throw Error('Invalid project state');
    var ids={};(enabledIds||[]).forEach(function(id){ids[id]=true;});
    var changes=[];
    plan.items.forEach(function(item){
      if (!ids[item.id]||item.source!=='caption'||item.groupId==null) return;
      var group=state.groups.find(function(g){return g.id===item.groupId;});
      if (!group||!item.actions||!group.id) return;
      if (group.manualLocks&&Object.keys(item.actions).some(function(k){return item.actions[k]&&group.manualLocks[k];})) return;
      if (item.actions.motion&&group.animOverride) return;
      if (item.actions.accent&&group.styleOverride) return;
      if (item.actions.glass&&group.bgOverride) return;
      changes.push({group:group,item:item});
    });
    if (!changes.length) return {applied:0,skipped:(enabledIds||[]).length};
    state.pushUndo();
    changes.forEach(function(entry){
      var g=entry.group,i=entry.item;
      if(i.actions.motion){g.animOverride=JSON.parse(JSON.stringify(state.animFor(g)));g.animOverride.preset=i.motion;g.animOverride.mode='simple';}
      if(i.actions.accent){g.styleOverride=JSON.parse(JSON.stringify(state.styleFor(g)));g.styleOverride.fill=i.accent;}
      if(i.actions.glass){g.bgOverride=JSON.parse(JSON.stringify(state.bgFor(g)));g.bgOverride.enabled=true;g.bgOverride.style='liquid';g.bgOverride.opacity=i.glassOpacity;}
      g.preserve=true;
    });
    return {applied:changes.length,skipped:(enabledIds||[]).length-changes.length};
  }
  return {profiles:PROFILES,normalize:normalize,propose:propose,apply:apply};
});
