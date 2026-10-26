(function(global){
  'use strict';
  const S={
    source:null,words:[],groups:[],nextGroup:1,selectedId:null,selectedWordIds:new Set(),undoStack:[],redoStack:[],maxHist:60,
    pendingAI:[],pendingTranslation:[],translationOriginal:new Map(),baselineGroups:[],baselineWords:[],
    projectBrain:{brief:'',profile:'auto',plan:null},
    settings:{
      whisper:'C:\\whisper.cpp\\whisper-cli.exe',ffmpeg:'C:\\whisper.cpp\\ffmpeg.exe',model:'C:\\whisper.cpp\\models',modelFile:'',threads:6,language:'fa',quality:5,keepTemp:false,cleanArtifacts:true,dropShortNumeric:true,
      caption38:{enabled44:true,auto:true,density:25,templateId:"",manualSlots:false},
      caption37:{protected:[],stack:{enabled:false,lines:3,mode:"aligned",gap:1.35,offset:4}},
      maxWords:8,maxLines:2,wordsPerLine:4,smartGroup:true,silenceGap:.72,
      style:{aeGlassText:false,fontPS:'ArialMT',fontLabel:'Arial',size:72,x:50,y:62,fill:'#FFFFFF',fillMode:'solid',fill2:'#8FD8FF',fillAngle:90,fillBalance:0,tracking:0,leading:0,align:0,stroke:false,strokeHex:'#000000',strokeWidth:2,glowEnabled:false,glowColor:'#FFFFFF',glowRadius:24,glowIntensity:.75,rtl:true,justifyMode:'none',boxWidthPct:82},
      layout:{lines:2,wordsPerLine:4,kashida:false,kashidaChance:35,kashidaLength:5},
      anim:{mode:'simple',preset:'none',outPreset:'mirror:fade',inDur:.48,startOffset:0,outDur:.26,strength:45,based:'words',opacity:true,position:false,scale:false,rotation:false,blur:false,tracking:false,skew:false,px:0,py:45,scaleV:70,rotV:15,blurV:20,trackV:40,skewV:20,typeSound:true,typeSoundDb:-22,typingSfxPath:'',textyleIn:'',textyleOut:'',syncMode:'together'},
      bg:{roundMode:'circular',independentMotion:true,outPreset:'fade',outDur:.25,aeOptics:false,aeGlass:{lightAngle:45,lightIntensity:100,refraction:100,depth:70,dispersion:50,frost:0,splay:0,magnify:0,effectScale:2,rimScale:.5},enabled:false,engine:'native',style:'liquid',preset:'apple-liquid',hex:'#FFFFFF',opacity:9,padding:38,round:34,borderOpacity:54,borderWidth:1.35,highlightOpacity:34,shadowOpacity:11,glassBlur:28,glassSaturation:112,gradientEnabled:true,gradientColor2:'#DCEEFF',gradientAngle:138,gradientBalance:-8,gradientX1:.18,gradientY1:.18,gradientX2:.82,gradientY2:.82,rimGradient:true,rimColor1:'#FFFFFF',rimColor2:'#9FC5E3',rimAngle:142,rimBalance:0,edgeDepth:60,lensing:56,edgeWave:14,glowEnabled:false,glowIntensity:.45,glowRadius:24,glowColor:'#FFFFFF',motion:'pop',motionDelay:0,motionDur:.36},
      safe:{presetKey:'Meta / InstagramREELS916',overlayOpacity:22,overlayColor:'#000000',guideLayer:true,lockLayer:true,visible:true,resize:false,active:false,enforceText:true,showChrome:true},
      localAI:{root:'C:\\whisper.cpp',runtimeDir:'C:\\whisper.cpp\\llama-b11277-bin-win-cuda-12.4-x64',exe:'C:\\whisper.cpp\\llama-b11277-bin-win-cuda-12.4-x64\\llama-server.exe',typeDir:'C:\\whisper.cpp\\models\\Taype',textDir:'C:\\whisper.cpp\\models\\Text amendment\\Qwen3.5-9B-GGUF',translatorDir:'C:\\whisper.cpp\\models\\Translator\\translategemma-4b-it-GGUF',visionDir:'C:\\whisper.cpp\\models\\Vision\\Qwen2.5-VL-3B-Instruct-GGUF',textModel:'',translatorModel:'',visionModel:'',typeModel:'',mmproj:'',port:1235,gpuLayers:24,context:8192,profile:'balanced',batchSize:256,ubatchSize:128,maxTokens:2048,idleMinutes:0,releaseAfterJob:true,priority:'low',reserveRamGB:2},
      vision:{profile:'balanced',model:'',enabled:true},
      translate:{target:'English'},
      livePreview:false,
      sfx:{libraryPath:'',maxPerMin:14,sensitivity:56,targetDb:-18,duckDb:7,measureAudio:true,aiMode:'pro',visualEnabled:true,visionEvery:2.2,visionMaxFrames:21,sceneThreshold:.34,choiceCount:8,styleProfile:'modern-clean',variety:70,avoidRepeats:true,learnChoices:true,beatSync:true,beatMode:'soft',environmentSuggestions:true,densityLevel:'balanced',motionLevel:'balanced',mixLevel:'balanced',duckLevel:'balanced',varietyLevel:'balanced',eventPolicy:{cuts:true,scenes:true,motion:true,effects:true,markers:true,typography:false,captions:false},audioStandard:{preset:'web',targetLUFS:-16,truePeak:-1,dialogueOffset:0,musicOffset:-10,ambienceOffset:-14,sfxOffset:-6,duckDb:9,applyDucking:true}}
    }
  };

  function clone(x){return JSON.parse(JSON.stringify(x));}
  const DEFAULT_SETTINGS=clone(S.settings);
  function resetToDefaults(opts){
    opts=opts||{};const old=clone(S.settings),fresh=clone(DEFAULT_SETTINGS);
    if(opts.preserveSystem!==false){
      ['whisper','ffmpeg','model','modelFile','threads'].forEach(k=>fresh[k]=old[k]);
      if(old.vision)fresh.vision=clone(old.vision);
      if(old.translate)fresh.translate=clone(old.translate);
      if(old.localAI)fresh.localAI=clone(old.localAI);
    }
    S.settings=fresh;saveSettings();return S.settings;
  }
  function defaults(){return clone(DEFAULT_SETTINGS);}
  function saveSettings(){try{localStorage.setItem('GHAF_Studio_2_Settings',JSON.stringify(S.settings));}catch(e){}}
  function loadSettings(){try{const x=JSON.parse(localStorage.getItem('GHAF_Studio_2_Settings')||'null');if(x)deepMerge(S.settings,x);/* R13: legacy external-provider settings are intentionally retired. */delete S.settings.lm;if(S.settings.translate){delete S.settings.translate.base;delete S.settings.translate.model;delete S.settings.translate.provider;}if(!['simple','native'].includes(S.settings.anim.mode))S.settings.anim=clone(DEFAULT_SETTINGS.anim);}catch(e){}return S.settings;}
  function deepMerge(a,b){for(const k in b){if(k==='__proto__'||k==='constructor'||k==='prototype')continue;if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')deepMerge(a[k],b[k]);else a[k]=b[k];}return a;}
  function snapshot(){return {groups:clone(S.groups),words:clone(S.words),selectedWordIds:[...S.selectedWordIds],selectedId:S.selectedId,nextGroup:S.nextGroup,settings:clone(S.settings),baselineGroups:S.baselineGroups,baselineWords:S.baselineWords};}
  function pushUndo(){S.undoStack.push(snapshot());if(S.undoStack.length>S.maxHist)S.undoStack.shift();S.redoStack=[];}
  function restore(x){S.groups=clone(x.groups);if(x.words)S.words=clone(x.words);S.selectedWordIds=new Set(x.selectedWordIds||[]);S.selectedId=x.selectedId;S.nextGroup=x.nextGroup;if(Array.isArray(x.baselineGroups))S.baselineGroups=x.baselineGroups;if(Array.isArray(x.baselineWords))S.baselineWords=x.baselineWords;if(x.settings){S.settings=clone(x.settings);saveSettings();}}
  function undo(){if(!S.undoStack.length)return false;S.redoStack.push(snapshot());restore(S.undoStack.pop());return true;}
  function redo(){if(!S.redoStack.length)return false;S.undoStack.push(snapshot());restore(S.redoStack.pop());return true;}
  function word(id){return S.words.find(w=>w.id===id)||null;}
  function maxWordId(){var m=0;for(var i=0;i<S.words.length;i++){var id=+S.words[i].id||0;if(id>m)m=id;}return m;}
  function group(id){return S.groups.find(g=>g.id===id)||null;}
  function groupIndex(id){return S.groups.findIndex(g=>g.id===id);}
  function current(){return group(S.selectedId)||S.groups[0]||null;}
  function groupStart(g){if(g.manual)return +g.start||0;if(g.startOverride!=null)return +g.startOverride;const w=word(g.wordIds[0]);return w?+w.start:0;}
  function groupEnd(g){if(g.manual)return +g.end||groupStart(g)+1;if(g.endOverride!=null)return +g.endOverride;const w=word(g.wordIds[g.wordIds.length-1]);return w?+w.end:groupStart(g)+1;}
  function cleanVisibleText(x){
    var raw=String(x==null?'':x).replace(/�+/g,'').replace(/\[_TT_\d+\]/gi,'').replace(/\[_[A-Z][A-Z0-9_]*\]/gi,'').replace(/<\|[^|>]+\|>/g,'');
    return raw.replace(/\r\n?/g,'\n').split('\n').map(function(line){return line.replace(/[\t\f\v ]+/g,' ').trim();}).join('\n').replace(/\n{3,}/g,'\n\n').trim();
  }
  function joinTokens(parts){return cleanVisibleText(parts.join(' ')).replace(/\s+([،؛:,.!?؟…])/g,'$1').replace(/([«(])\s+/g,'$1').replace(/\s+([»\)])/g,'$1').replace(/[\t ]+/g,' ').trim();}
  function wordText(w){return w?(w.editedText!=null?String(w.editedText):String(w.text||'')):'';}
  function originalText(g){if(g.manual)return g.text||'';return joinTokens((g.wordIds||[]).map(function(id){return wordText(word(id));}).filter(Boolean));}
  function text(g){return g.textOverride!=null?g.textOverride:originalText(g);}
  function smartRTL(raw){
    raw=String(raw||'');var ar=(raw.match(/[\u0600-\u06FF]/g)||[]).length,lat=(raw.match(/[A-Za-z]/g)||[]).length,dig=(raw.match(/[0-9۰-۹٠-٩]/g)||[]).length;
    if(ar>0)return true;if(lat>0||dig>0)return false;return S.settings.language==='fa'||S.settings.language==='ar';
  }
  // Protect mixed Persian/Arabic + English/numbers from AE's paragraph-level bidi direction.
  // The visible Review text stays untouched; Unicode isolates are added only to exported/rendered text.
  function bidiSafeText(raw,rtl){
    raw=String(raw==null?'':raw).replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g,'');
    if(!raw)return raw;
    var LRI='\u2066',RLI='\u2067',PDI='\u2069';
    function cls(ch){
      if(/[A-Za-z\u00C0-\u024F]/.test(ch))return 'ltr';
      if(/[0-9۰-۹٠-٩]/.test(ch))return 'ltr';
      if(/[\u0621-\u063A\u0641-\u064A\u066E-\u06D3\u06FA-\u06FF]/.test(ch))return 'rtl';
      return 'neutral';
    }
    function protectLine(line){
      var runs=[],buf='',dir=null,pending='';
      function flush(){if(!buf&&!pending)return;if(buf)runs.push({dir:dir,text:buf+pending});else runs.push({dir:null,text:pending});buf='';pending='';dir=null;}
      for(var i=0;i<line.length;i++){
        var ch=line.charAt(i),c=cls(ch);
        if(c==='neutral'){ if(dir)pending+=ch; else pending+=ch; continue; }
        if(!dir){buf=pending+ch;pending='';dir=c;continue;}
        if(c===dir){buf+=pending+ch;pending='';continue;}
        // Keep neutral spacing with the preceding run; isolates prevent the new strong run from reordering it.
        buf+=pending;pending='';flush();buf=ch;dir=c;
      }
      flush();
      return runs.map(function(r){
        if(!r.dir)return r.text;
        if(rtl&&r.dir==='ltr')return LRI+r.text+PDI;
        if(!rtl&&r.dir==='rtl')return RLI+r.text+PDI;
        return r.text;
      }).join('');
    }
    return raw.split(/(\r\n|\r|\n)/).map(function(part){return /^(\r\n|\r|\n)$/.test(part)?part:protectLine(part);}).join('');
  }
  function hashText(s){
    s=String(s||'');let h=2166136261>>>0;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
    return h>>>0;
  }
  function seeded(seed){
    let x=(seed>>>0)||123456789;
    return function(){x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
  }
  function kashidaWord(word,rnd,chance,len){
    word=String(word||'');
    if(!word || rnd()*100>chance)return word;
    const arab=/[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/;
    const noLeft=/[اآأإٱدذرزژوؤءةۀ]/;
    const cand=[];
    for(let i=0;i<word.length-1;i++){
      const a=word[i],b=word[i+1];
      if(arab.test(a)&&arab.test(b)&&!noLeft.test(a)&&a!=='ـ'&&b!=='ـ')cand.push(i);
    }
    if(!cand.length)return word;
    const at=cand[Math.floor(rnd()*cand.length)];
    return word.slice(0,at+1)+'ـ'.repeat(Math.max(1,Math.min(12,+len||5)))+word.slice(at+1);
  }
  function wrapWords(raw,perLine){
    const paragraphs=String(raw||'').replace(/\r/g,'').split('\n'),out=[];
    perLine=Math.max(1,+perLine||4);
    for(const para of paragraphs){
      const ws=para.trim().split(/\s+/).filter(Boolean);
      if(!ws.length){out.push('');continue;}
      for(let i=0;i<ws.length;i+=perLine)out.push(ws.slice(i,i+perLine).join(' '));
    }
    return out.join('\r');
  }
  function layoutFor(g){
    const st=styleFor(g),lay=S.settings.layout||{},cw=S.source?.compWidth||1080;
    ctx.font=fontCSS(st);
    const measure=t=>ctx.measureText(t).width+Math.max(0,t.length-1)*(+st.tracking||0)*(+st.size||72)/1000;
    return global.GHAFLayout.layout(text(g),Object.assign({},lay,{width:cw*(+st.boxWidthPct||82)/100,protectedPhrases:S.settings.caption37?.protected||[],kashida:S.settings.language==='fa'&&lay.kashida}),measure);
  }
  function formattedText(g){return layoutFor(g).text;}
  function newAuto(ids){return {id:S.nextGroup++,wordIds:[...ids],manual:false,preserve:false,textOverride:null,startOverride:null,endOverride:null,styleOverride:null,animOverride:null,bgOverride:null};}
  function newManual(txt,start,end){return {id:S.nextGroup++,wordIds:[],manual:true,preserve:true,text:txt||'متن جدید',start:+start||0,end:+end||(+start||0)+2,textOverride:null,styleOverride:null,animOverride:null,bgOverride:null};}
  function styleFor(g){return clone(g?.styleOverride||S.settings.style);}
  function animFor(g){const a=g?.animOverride||S.settings.anim;return ['simple','native'].includes(a?.mode)?clone(a):clone(DEFAULT_SETTINGS.anim);}
  function bgFor(g){return clone(g?.bgOverride||S.settings.bg);}
  function fontCSS(st){const fam=(st.fontLabel||st.fontPS||'Arial').replace(/['"]/g,'');return `${Math.max(1,+st.size||72)}px "${fam}", Arial, sans-serif`;}
  const measureCanvas=document.createElement('canvas'),ctx=measureCanvas.getContext('2d');
  function safeWidthPx(st){
    const cW=S.source?.compWidth||1080,s=S.settings.safe,left=+s.left||0,right=+s.right||0;
    const safeL=left/cW*1080,safeR=right/cW*1080,x=(+st.x||50)/100*1080;
    return Math.max(80,Math.min(1080-safeL-safeR,2*Math.min(Math.max(30,x-safeL),Math.max(30,1080-safeR-x))));
  }
  function fits(ids,st){
    if(!ids.length)return true;ctx.font=fontCSS(st);const maxW=safeWidthPx(st),maxLines=Math.max(1,+((S.settings.layout||{}).lines)||+S.settings.maxLines||2);let lines=1,w=0;
    for(const id of ids){const t=(word(id)?.text||'')+' ';const tw=ctx.measureText(t).width*(1+(+st.tracking||0)/1000);if(w+tw>maxW){lines++;w=tw;}else w+=tw;if(lines>maxLines)return false;}return true;
  }
  function strongEnd(t){return /[.!?؟…]+[»"'\)\]]*$/.test(String(t||''));}
  function regroup(){
    pushUndo();
    const previousSelected=S.selectedId;
    const manuals=S.groups.filter(g=>g.manual).map(clone);
    const fixed=S.groups.filter(g=>!g.manual&&g.preserve&&g.wordIds&&g.wordIds.length).map(clone);
    const fixedIds=new Set(),fixedByFirst=new Map();
    fixed.forEach(g=>{g.wordIds.forEach(id=>fixedIds.add(id));fixedByFirst.set(g.wordIds[0],g);});
    const out=[],lay=S.settings.layout||{},
      lineCap=Math.max(1,(+lay.lines||+S.settings.maxLines||2)*(+lay.wordsPerLine||+S.settings.wordsPerLine||4)),
      maxW=Math.max(1,Math.min(+S.settings.maxWords||8,lineCap)),st=S.settings.style;
    let bucket=[];
    const flush=()=>{if(bucket.length){out.push(newAuto(bucket));bucket=[];}};

    const phraseUnits=global.VarnaCaptions37?global.VarnaCaptions37.units(S.words.map(w=>w.editedText!=null?w.editedText:w.text),S.settings.caption37?.protected||[]):S.words.map(w=>[w.text]);
    let cursor=0;
    for(const unit of phraseUnits){
      const slice=S.words.slice(cursor,cursor+unit.length);cursor+=unit.length;
      // User-pinned edits have priority over automatic protected-phrase regrouping.
      if(slice.some(w=>fixedIds.has(w.id))){for(const w of slice){const fg=fixedByFirst.get(w.id);if(fg){flush();out.push(fg);}else if(!fixedIds.has(w.id)){bucket.push(w.id);flush();}}continue;}
      const ids=slice.map(w=>w.id),w=slice[slice.length-1],cand=[...bucket,...ids];
      if(bucket.length&&(cand.length>maxW||(S.settings.smartGroup&&!fits(cand,st))))flush();
      bucket.push(...ids);
      const next=S.words[cursor],gap=next?next.start-w.end:99;
      if(bucket.length>=maxW||(S.settings.smartGroup&&(strongEnd(w.text)||gap>=+S.settings.silenceGap)))flush();
    }
    flush();
    S.groups=out.concat(manuals).sort((a,b)=>groupStart(a)-groupStart(b));
    S.selectedId=group(previousSelected)?previousSelected:(S.groups[0]?.id||null);
    return S.groups;
  }
  function initWords(words){
    S.words=clone(words||[]).map(w=>Object.assign({},w,{text:cleanVisibleText(w.text),editedText:null})).filter(w=>w.text);
    S.nextGroup=1;S.groups=[];S.undoStack=[];S.redoStack=[];S.selectedWordIds.clear();
    regroup();S.undoStack=[];S.redoStack=[];S.baselineGroups=clone(S.groups);S.baselineWords=clone(S.words);return S.groups;
  }
  function select(id){if(group(id)){if(S.selectedId!==id)S.selectedWordIds.clear();S.selectedId=id;return group(id);}return null;}
  function addManual(start,duration){pushUndo();duration=Math.max(.08,+duration||2);const g=newManual('متن جدید',Math.max(0,+start||0),Math.max(0,+start||0)+duration);S.groups.push(g);S.groups.sort((a,b)=>groupStart(a)-groupStart(b));S.selectedId=g.id;return g;}
  function addManualAfterSelected(groupId,compDuration,preferredDuration){
    const base=group(groupId)||current();if(!base)return null;
    const gi=groupIndex(base.id),start=Math.max(0,groupEnd(base)),next=gi>=0&&gi<S.groups.length-1?Math.max(start,groupStart(S.groups[gi+1])):Math.max(start,+compDuration||start+Math.max(.2,+preferredDuration||2));
    const maxEnd=Math.max(start,next),dur=Math.max(.08,Math.min(Math.max(.08,+preferredDuration||2),maxEnd-start));
    if(maxEnd-start<.04)return null;
    pushUndo();const g=newManual('متن جدید',start,start+dur);S.groups.push(g);S.groups.sort((a,b)=>groupStart(a)-groupStart(b));S.selectedId=g.id;S.selectedWordIds.clear();return g;
  }
  function deleteGroups(ids){ids=ids&&ids.length?ids:[S.selectedId];pushUndo();S.groups=S.groups.filter(g=>!ids.includes(g.id));S.selectedId=S.groups[0]?.id||null;}
  function merge(ids){const idx=ids.map(groupIndex).filter(x=>x>=0).sort((a,b)=>a-b);if(idx.length<2)return null;for(let i=1;i<idx.length;i++)if(idx[i]!==idx[0]+i)throw new Error('برای Merge کپشن‌های متوالی را انتخاب کن.');const gs=idx.map(i=>S.groups[i]);if(gs.some(g=>g.manual))throw new Error('Merge متن دستی با Word Timing پشتیبانی نمی‌شود.');pushUndo();const ng=newAuto(gs.flatMap(g=>g.wordIds));ng.preserve=true;ng.correctionExclusions=[...new Set(gs.flatMap(g=>g.correctionExclusions||[]))];const anyOverride=gs.some(g=>g.textOverride!=null);if(anyOverride)ng.textOverride=joinTokens(gs.map(text));ng.styleOverride=clone(gs[0].styleOverride);ng.animOverride=clone(gs[0].animOverride);ng.bgOverride=clone(gs[0].bgOverride);for(let i=idx.length-1;i>=0;i--)S.groups.splice(idx[i],1);S.groups.splice(idx[0],0,ng);S.selectedId=ng.id;S.selectedWordIds.clear();return ng;}
  function displayTokens(g){
    return String(text(g)||'').replace(/\r/g,' ').replace(/\n/g,' ').trim().split(/\s+/).filter(Boolean);
  }
  function tokenSlicesForWords(g){
    const ids=(g.wordIds||[]),tok=displayTokens(g),out=[];
    if(!ids.length)return out;
    if(!tok.length)return ids.map(()=>[]);
    for(let i=0;i<ids.length;i++){
      const a=Math.round(i*tok.length/ids.length),b=Math.round((i+1)*tok.length/ids.length);
      out.push(tok.slice(a,Math.max(a,b)));
    }
    // Guard rounding edge cases: every visible token must belong to exactly one word slot.
    const flat=out.reduce((n,x)=>n+x.length,0);
    if(flat<tok.length)out[out.length-1]=out[out.length-1].concat(tok.slice(flat));
    return out;
  }
  function textForWordIds(g,ids){
    const pos=new Map((g.wordIds||[]).map((id,i)=>[id,i])),slices=tokenSlicesForWords(g),parts=[];
    for(const id of ids){const i=pos.get(id);if(i!=null&&slices[i])parts.push.apply(parts,slices[i]);}
    return parts.join(' ').trim();
  }
  function distributeOverride(g,chunks){
    if(!chunks||!chunks.length)return [];
    const out=chunks.map(ids=>textForWordIds(g,ids));
    // If a chunk map was malformed, never silently lose visible tokens: append leftovers to last chunk.
    const original=displayTokens(g),used=[];
    out.forEach(t=>used.push.apply(used,String(t||'').split(/\s+/).filter(Boolean)));
    if(used.length<original.length&&out.length)out[out.length-1]=[out[out.length-1],original.slice(used.length).join(' ')].filter(Boolean).join(' ').trim();
    return out;
  }
  function makeSplitGroups(g,chunks){
    chunks=chunks.filter(a=>a&&a.length);if(chunks.length<2)return null;
    pushUndo();const txts=distributeOverride(g,chunks),out=chunks.map((ids,i)=>{
      const ng=newAuto(ids);ng.preserve=true;
      if(g.textOverride!=null&&txts[i])ng.textOverride=txts[i];
      ng.styleOverride=clone(g.styleOverride);ng.animOverride=clone(g.animOverride);ng.bgOverride=clone(g.bgOverride);ng.correctionExclusions=clone(g.correctionExclusions||[]);
      return ng;
    });
    const gi=groupIndex(g.id);S.groups.splice(gi,1,...out);S.selectedId=out[0].id;return out;
  }
  function splitGroup(groupId,mode,arg,selectedIds){
    const g=group(groupId);if(!g||g.manual||g.wordIds.length<=1)return null;
    const ids=[...g.wordIds],chunks=[];
    if(mode==='selected'||mode==='selectedEach'){
      const chosen=new Set((selectedIds||[]).filter(id=>ids.includes(id)));
      if(!chosen.size)return null;
      let run=[],selected=null;
      const flush=()=>{if(run.length){chunks.push(run);run=[];}};
      for(const id of ids){const hit=chosen.has(id);if(selected!==null&&hit!==selected)flush();selected=hit;
        if(mode==='selectedEach'&&hit){flush();chunks.push([id]);}else run.push(id);
      }flush();
    }else if(mode==='half'){
      const cut=Math.max(1,Math.floor(ids.length/2));chunks.push(ids.slice(0,cut),ids.slice(cut));
    }else if(mode==='everyN'){
      const n=Math.max(1,Math.floor(+arg||3));for(let i=0;i<ids.length;i+=n)chunks.push(ids.slice(i,i+n));
    }else if(mode==='fromWord'){
      const chosen=(selectedIds||[]).filter(id=>ids.includes(id));if(!chosen.length)return null;
      const at=ids.indexOf(chosen[0]);if(at<=0)return null;chunks.push(ids.slice(0,at),ids.slice(at));
    }else if(mode==='punctuation'){
      let run=[];for(const id of ids){run.push(id);if(strongEnd(word(id)?.text||'')){chunks.push(run);run=[];}}if(run.length)chunks.push(run);
    }else if(mode==='each'){
      ids.forEach(id=>chunks.push([id]));
    }else return null;
    return makeSplitGroups(g,chunks);
  }
  function unmerge(groupId,wordIds){return splitGroup(groupId,'selected',null,wordIds);}
  function mergeRelative(groupId,mode,selectedIds){
    const gi=groupIndex(groupId);if(gi<0)return null;
    if(mode==='selected')return merge(selectedIds&&selectedIds.length?selectedIds:[groupId]);
    const ids=[];
    if(mode==='previous'&&gi>0)ids.push(S.groups[gi-1].id,groupId);
    else if(mode==='next'&&gi<S.groups.length-1)ids.push(groupId,S.groups[gi+1].id);
    else if(mode==='both'){if(gi>0)ids.push(S.groups[gi-1].id);ids.push(groupId);if(gi<S.groups.length-1)ids.push(S.groups[gi+1].id);}
    if(ids.length<2)return null;return merge(ids);
  }
  function extractSelectedWords(groupId,selectedIds){
    const g=group(groupId);if(!g||g.manual)return null;
    const chosen=new Set((selectedIds||[]).filter(id=>g.wordIds.includes(id)));if(!chosen.size)return null;
    const chunks=[];let run=[],flag=null;
    const flush=()=>{if(run.length){chunks.push({ids:run,selected:flag});run=[];}};
    for(const id of g.wordIds){const hit=chosen.has(id);if(flag!==null&&hit!==flag)flush();flag=hit;run.push(id);}flush();
    if(chunks.length<2)return null;
    pushUndo();const txts=distributeOverride(g,chunks.map(x=>x.ids)),out=chunks.map((ch,i)=>{const ng=newAuto(ch.ids);ng.preserve=true;if(g.textOverride!=null&&txts[i])ng.textOverride=txts[i];ng.styleOverride=clone(g.styleOverride);ng.animOverride=clone(g.animOverride);ng.bgOverride=clone(g.bgOverride);ng.correctionExclusions=clone(g.correctionExclusions||[]);ng._selectedChunk=ch.selected;return ng;});
    const gi=groupIndex(g.id);S.groups.splice(gi,1,...out);const target=out.find(x=>x._selectedChunk)||out[0];out.forEach(x=>delete x._selectedChunk);S.selectedId=target.id;S.selectedWordIds.clear();return out;
  }
  function moveSelectedWords(groupId,selectedIds,direction){
    const g=group(groupId);if(!g||g.manual)return null;
    const gi=groupIndex(g.id),ni=direction==='previous'?gi-1:gi+1;if(ni<0||ni>=S.groups.length)return null;
    const target=S.groups[ni];if(!target||target.manual)return null;
    const chosen=g.wordIds.filter(id=>(selectedIds||[]).includes(id));if(!chosen.length)return null;
    const chosenSet=new Set(chosen),remain=g.wordIds.filter(id=>!chosenSet.has(id));
    const remainText=textForWordIds(g,remain);
    pushUndo();
    const oldTargetIds=[...target.wordIds],oldTargetSlices=tokenSlicesForWords(target),oldSourceSlices=tokenSlicesForWords(g);
    const byId=new Map();oldTargetIds.forEach((id,i)=>byId.set(id,oldTargetSlices[i]||[]));g.wordIds.forEach((id,i)=>byId.set(id,oldSourceSlices[i]||[]));
    const merged=[...oldTargetIds,...chosen].sort((a,b)=>{const wa=word(a),wb=word(b);return (+wa?.start||0)-(+wb?.start||0)||(+wa?.id||0)-(+wb?.id||0);});
    target.wordIds=merged;target.preserve=true;target.correctionExclusions=[...new Set([...(target.correctionExclusions||[]),...(g.correctionExclusions||[])])];
    // Target display follows actual chronological word order, preventing large Ctrl+M selections from skipping text.
    target.textOverride=joinTokens(merged.flatMap(id=>byId.get(id)||[]))||null;
    if(remain.length){g.wordIds=remain;g.preserve=true;g.textOverride=remainText||null;S.selectedId=target.id;}
    else{S.groups.splice(gi,1);S.selectedId=target.id;}
    S.groups.sort((a,b)=>groupStart(a)-groupStart(b));S.selectedWordIds.clear();return target;
  }
  function resetToOriginal(){
    pushUndo();
    S.words=clone(S.baselineWords||S.words||[]);S.groups=clone(S.baselineGroups||[]);S.nextGroup=Math.max(1,...S.groups.map(g=>+g.id||0))+1;
    S.selectedId=S.groups[0]?.id||null;S.selectedWordIds.clear();S.pendingAI=[];S.pendingTranslation=[];S.translationOriginal.clear();
    return S.groups;
  }
  function setText(id,val){
    const g=group(id);if(!g)return;g.preserve=true;const cleaned=cleanVisibleText(val);
    if(g.manual){g.text=cleaned;return;}
    // Draft edits never mutate audio anchors until a committed edit.
    g.textOverride=cleaned;
  }
  function setTextAnchored(id,val){
    const g=group(id);if(!g)return;const cleaned=cleanVisibleText(val);g.preserve=true;
    if(g.manual){g.text=cleaned;g.textOverride=null;return;}
    const ids=g.wordIds||[],source=ids.map(word).filter(Boolean),set=new Set(ids);
    const aligned=global.VarnaTiming.alignWords(source,cleaned,{nextId:maxWordId()+1,start:groupStart(g),end:groupEnd(g)});
    S.words=S.words.filter(w=>!set.has(w.id)).concat(aligned.words);
    S.words.sort((a,b)=>a.start-b.start||a.id-b.id);g.wordIds=aligned.words.map(w=>w.id);g.textOverride=null;
    S.selectedWordIds.clear();
  }
  function setTime(id,start,end){const g=group(id);if(!g)return;g.preserve=true;if(g.manual){g.start=+start;g.end=+end;}else{g.startOverride=+start;g.endOverride=+end;}}
  function setStyle(scope,style,options){pushUndo();if(scope==='selected'&&current()){current().styleOverride=clone(style);current().preserve=true;}else{const effects=new Map(S.groups.map(g=>[g.id,styleFor(g).vendorEffects]));S.settings.style=clone(style);S.groups.forEach(g=>{g.styleOverride=null;if(options?.preserveVendor&&effects.get(g.id)?.length)g.styleOverride=Object.assign(clone(style),{vendorEffects:clone(effects.get(g.id))});});saveSettings();}}
  function setAnim(scope,a){pushUndo();if(scope==='selected'&&current()){current().animOverride=clone(a);current().preserve=true;}else{S.settings.anim=clone(a);S.groups.forEach(g=>g.animOverride=null);saveSettings();}}
  function setBg(scope,b,options){pushUndo();if(scope==='selected'&&current()){current().bgOverride=clone(b);current().preserve=true;}else{const effects=new Map(S.groups.map(g=>[g.id,bgFor(g).vendorEffects]));S.settings.bg=clone(b);S.groups.forEach(g=>{g.bgOverride=null;if(options?.preserveVendor&&effects.get(g.id)?.length)g.bgOverride=Object.assign(clone(b),{vendorEffects:clone(effects.get(g.id))});});saveSettings();}}
  function setMotionBundle(scope,a,b){
    pushUndo();
    if(scope==='selected'&&current()){current().animOverride=clone(a);current().bgOverride=clone(b);current().preserve=true;}
    else{S.settings.anim=clone(a);S.settings.bg=clone(b);S.groups.forEach(g=>{g.animOverride=null;g.bgOverride=null;});saveSettings();}
  }
  // Structural text edits may invalidate saved phrase ranges. Repair the export,
  // keeping the saved artwork and undo history available for explicit review.
  function sceneAnimForExport47(g){
    const anim=animFor(g),cfg=anim.kinetic40,K=global.VarnaKinetic40;
    if(!cfg||cfg.enabled===false||!K)return {anim,repair:null};
    const raw=text(g),tokens=K.words(raw);let rows=cfg.segments,valid=true;
    if(cfg.customText){try{rows=K.manual(raw,cfg.customText);}catch(e){valid=false;}}
    if(!rows&&valid)return {anim,repair:null};
    if(valid){let at=0;if(!Array.isArray(rows)||!rows.length)valid=false;else for(const row of rows){const from=Number(row.from),to=Number(row.to);if(from!==at||!Number.isInteger(from)||!Number.isInteger(to)||to<=from||to>tokens.length){valid=false;break;}at=to;}if(at!==tokens.length)valid=false;}
    if(valid)return {anim,repair:null};
    const segments=K.split(raw,cfg.group,S.settings.caption37?.protected||[]),oldLines=String(cfg.customText||'').split(/[\r\n]+/).map(line=>K.words(line).join(' ')).filter(Boolean),used=new Set();let preserved=0;
    for(let i=0;i<segments.length;i++){
      const phrase=tokens.slice(segments[i].from,segments[i].to).join(' '),oldIndex=oldLines.findIndex((line,j)=>line===phrase&&!used.has(j));
      if(oldIndex>=0&&Array.isArray(cfg.segments)&&cfg.segments[oldIndex]){segments[i]=Object.assign({},clone(cfg.segments[oldIndex]),segments[i]);used.add(oldIndex);preserved++;}
    }
    anim.kinetic40=Object.assign({},cfg,{segments,customText:''});
    return {anim,repair:{reason:'TEXT_PARTITION_CHANGED',message:'متن تغییر کرده؛ تقسیم عبارت‌ها برای این خروجی دوباره ساخته شد. چیدمان را در تایپوگرافی بررسی و ذخیره کن.',preservedSegments:preserved}};
  }
  function exportGroups(){const result=S.groups.map(g=>{const raw=text(g),fit=layoutFor(g),style=styleFor(g),scene47=sceneAnimForExport47(g);style.size=Math.max(1,style.size*fit.fontScale);style.maxLines=Math.max(1,+S.settings.layout.lines||2);style.fitWidthPct=+style.boxWidthPct||82;style.rtl=smartRTL(raw);const renderText=bidiSafeText(fit.text,style.rtl);return ({id:g.id,text:renderText,rawText:raw,timingQuality40:g.sceneTiming40?.quality||'word',timing38:g.sceneTiming40?.text===raw?g.sceneTiming40.words.map(t=>({text:t.text,start:groupStart(g)+t.start*(groupEnd(g)-groupStart(g)),end:groupStart(g)+t.end*(groupEnd(g)-groupStart(g))})):global.VarnaCaptions37&&global.VarnaCaptions37.tokens(raw).length===(g.wordIds||[]).length?(g.wordIds||[]).map(id=>({text:word(id)?.editedText??word(id)?.text,start:word(id)?.start,end:word(id)?.end})):[],start:groupStart(g),end:groupEnd(g),style,highlight37:S.settings.caption38?.enabled44!==false&&g.highlight37?{color:g.highlight37.color||"#F8CB67",scale:+g.highlight37.scale||100,rawIndices38:global.VarnaCaptions37?global.VarnaCaptions37.marks(raw,g.highlight37.words).map(t=>t.index):[],ranges:global.VarnaCaptions37?global.VarnaCaptions37.ranges(renderText,g.highlight37.words):[],indices:global.VarnaCaptions37?global.VarnaCaptions37.marks(renderText,g.highlight37.words).map(t=>t.index):[]}:null,anim:scene47.anim,...(scene47.repair?{kinetic40Repair47:scene47.repair}:{}),bg:bgFor(g),manual:!!g.manual,safeBox:(S.settings.safe.active&&S.settings.safe.enforceText&&global.VarnaSafe)?global.VarnaSafe.box((()=>{const p=(global.GHAFSafePresets||[]).find(p=>p.key===S.settings.safe.presetKey),m=S.settings.safe.manual;return S.settings.safe.appliedGeometry&&S.settings.safe.appliedGeometry.key===p?.key?S.settings.safe.appliedGeometry:m&&p&&S.settings.safe.manualKey===p.key?global.VarnaSafe.resolve(p,m):p;})()):null});});const output=global.VarnaCaptions37?global.VarnaCaptions37.stack(result,S.settings.caption37?.stack,{width:S.source?.compWidth,height:S.source?.compHeight}):result;if(global.VarnaWordMotion39)for(const g of output)if(g.anim.word39)g.word39=global.VarnaWordMotion39.timing(g,g.anim.word39);for(const g of output)if(g.anim.kinetic40&&g.anim.kinetic40.enabled!==false){g.style.size=styleFor(group(g.id)).size;g.protected40=S.settings.caption37?.protected||[];}return output;}
  function syntheticWordWeights(tokens){return tokens.map(function(t){return Math.max(1,Math.min(14,String(t||'').replace(/[\u200c\u200f\u200e]/g,'').length||1));});}
  function makeTimedImportedGroup(txt,start,end,nextIdRef){
    txt=cleanVisibleText(txt);start=Math.max(0,+start||0);end=(+end>start)?+end:start+2;
    var tokens=String(txt||'').replace(/\r/g,' ').replace(/\n/g,' ').trim().split(/\s+/).filter(Boolean);
    if(!tokens.length)tokens=[''];
    var weights=syntheticWordWeights(tokens),total=weights.reduce(function(a,b){return a+b;},0)||tokens.length,span=Math.max(.001,end-start),cursor=start,ids=[];
    var nextWordId=nextIdRef?nextIdRef.value:maxWordId()+1;
    for(var i=0;i<tokens.length;i++){
      var ws=cursor,we=(i===tokens.length-1)?end:(cursor+span*(weights[i]/total));
      we=Math.max(ws+.0001,Math.min(end,we));
      var w={id:nextWordId++,text:tokens[i],editedText:null,start:ws,end:we,synthetic:true,source:'manual-import'};S.words.push(w);ids.push(w.id);cursor=we;
    }
    if(nextIdRef)nextIdRef.value=nextWordId;
    // Imported SRT/Timeline captions now participate in the normal word editing/split pipeline.
    var g=newAuto(ids);g.preserve=true;g.textOverride=txt;g.importedTiming=true;return g;
  }
  function importManualCaptions(items){
    if(!Array.isArray(items)||!items.length)return false;pushUndo();S.groups=[];S.words=[];S.nextGroup=1;S.selectedWordIds.clear();
    var nextIdRef={value:1};items.forEach(function(x){var start=Math.max(0,+x.start||0),end=(+x.end>start)?+x.end:start+2;S.groups.push(makeTimedImportedGroup(x.text||x.rawText||'',start,end,nextIdRef));});
    S.words.sort(function(a,b){return a.start-b.start||a.id-b.id;});S.groups.sort(function(a,b){return groupStart(a)-groupStart(b);});S.selectedId=S.groups[0]?S.groups[0].id:null;S.baselineGroups=clone(S.groups);S.baselineWords=clone(S.words);return true;
  }
  function auditTranscript(options){return global.VarnaCaptionReview.inspect(S.groups,S.words,options||{});}
  function repairTranscript(options){
    const before=auditTranscript(options),fixes=before.issues.filter(x=>x.fixable);if(!fixes.length)return {before,after:before,changed:0};
    pushUndo();let changed=0;
    for(const issue of fixes)if(issue.type==='drift'||issue.type==='overlap'){
      for(const id of [issue.id,issue.nextId]){const g=group(id),a=before.anchors.get(id);if(!g||!a||g.manual)continue;
        if(g.startOverride!=null||g.endOverride!=null){g.startOverride=a.start;g.endOverride=a.end;g.preserve=true;changed++;}
      }
    }
    for(const split of before.splits.slice().sort((a,b)=>a.id===b.id?b.at-a.at:0)){
      const g=group(split.id);if(!g||g.manual||split.at<1||split.at>=g.wordIds.length)continue;
      const chunks=[g.wordIds.slice(0,split.at),g.wordIds.slice(split.at)],parts=distributeOverride(g,chunks),ng=newAuto(chunks[1]);
      ng.preserve=true;ng.textOverride=g.textOverride!=null?parts[1]:null;ng.styleOverride=g.styleOverride?clone(g.styleOverride):null;ng.animOverride=g.animOverride?clone(g.animOverride):null;ng.bgOverride=g.bgOverride?clone(g.bgOverride):null;ng.correctionExclusions=clone(g.correctionExclusions||[]);
      g.wordIds=chunks[0];g.textOverride=g.textOverride!=null?parts[0]:null;g.startOverride=null;g.endOverride=null;g.preserve=true;
      // Correction highlights are recalculated on subsequent edits; never show stale spans.
      delete g.correctionMarks;delete g.memoryAppliedEdits;
      const gi=groupIndex(g.id),next=S.groups[gi+1],tail=ng.wordIds.map(word).filter(Boolean),head=next&&!next.manual?word(next.wordIds[0]):null;
      if(next&&!next.manual&&head&&tail.length<=2&&tail.length>0&&head.start>=tail[tail.length-1].end&&head.start-tail[tail.length-1].end<=.25){
        // A short tail after a sentence stop belongs to the following sentence.
        const nextText=text(next),tailText=ng.textOverride!=null?ng.textOverride:tail.map(wordText).join(' ');
        next.wordIds=ng.wordIds.concat(next.wordIds);next.textOverride=joinTokens([tailText,nextText]);next.startOverride=null;next.preserve=true;
        next.correctionExclusions=[...new Set([...(next.correctionExclusions||[]),...(ng.correctionExclusions||[])])];
        delete next.correctionMarks;delete next.memoryAppliedEdits;
      }else S.groups.splice(gi+1,0,ng);
      changed++;
    }
    S.groups.sort((a,b)=>groupStart(a)-groupStart(b));return {before,after:auditTranscript(options),changed};
  }

  Object.assign(S,{loadSettings,saveSettings,resetToDefaults,defaults,pushUndo,undo,redo,word,group,current,groupIndex,groupStart,groupEnd,text,formattedText,originalText,styleFor,animFor,bgFor,regroup,initWords,select,addManual,addManualAfterSelected,deleteGroups,merge,mergeRelative,splitGroup,unmerge,extractSelectedWords,moveSelectedWords,resetToOriginal,setText,setTextAnchored,setTime,setStyle,setAnim,setBg,setMotionBundle,sceneAnimForExport47,exportGroups,smartRTL,bidiSafeText,importManualCaptions,auditTranscript,repairTranscript});
  if(global.VarnaCaptions37)global.VarnaCaptions37.connect(S);
  global.GHAFState=S;
})(window);
