/* Original ES3 motion math shared by the browser reference and native AE.
   No vendor template code or protected binary is reproduced here. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaBackgroundMotion81=api;return api;})(typeof window!=='undefined'?window:this,function factoryBackgroundMotion81(){
  function evaluator81(){
    function number(v,d,min,max){v=Number(v);return Math.max(min,Math.min(max,isFinite(v)?v:d));}
    function ease(u,curve){
      u=number(u,0,0,1);if(u===0||u===1)return u;
      if(curve==='linear')return u;
      if(curve==='spring')return 1-Math.exp(-7*u)*Math.cos(9*u);
      if(curve==='quart')return 1-Math.pow(1-u,4);
      if(curve==='sine')return (1-Math.cos(Math.PI*u))/2;
      if(curve==='back'){var a=u-1;return 1+2.4*a*a*a+1.4*a*a;}
      return u*u*(3-2*u);
    }
    function sample(cfg,time,start,end,width,height,forceZero){
      cfg=cfg||{};start=number(start,0,-100000,100000);end=number(end,start+.001,start+.001,100000);
      time=number(time,start,-100000,100000);width=number(width,300,0,100000);height=number(height,80,0,100000);
      var span=end-start,delay=number(cfg.delay,0,0,Math.max(0,span*.2)),a=start+delay;
      var di=Math.max(.001,Math.min(number(cfg.inDur,.36,.001,10),span*.44));
      var dout=Math.max(.001,Math.min(number(cfg.outDur,.3,.001,10),span*.44));
      var pin=cfg.family==='none'&&!forceZero?1:ease((time-a)/di,cfg.curve),pout=cfg.exitMotion?0:cfg.exit==='none'&&!forceZero?0:ease((time-(end-dout))/dout,'smooth');
      var strength=number(cfg.strength,1,.1,3),distance=Math.min(180,Math.max(12,width*.12))*strength;
      var dy=Math.min(100,Math.max(12,height*.6))*strength,remaining=1-pin;
      var sx=100,sy=100,x=0,y=0,rotation=0,f=cfg.family||'expand-x';
      if(f==='expand-x'||f==='wipe-left'||f==='wipe-right'||f==='elastic-x')sx=pin*100;
      if(f==='expand-y'||f==='curtain-top'||f==='curtain-bottom'||f==='elastic-y')sy=pin*100;
      if(f==='expand-both'||f==='elastic-both'){sx=pin*100;sy=pin*100;}
      if(f==='pop'){sx=(.7+.3*pin)*100;sy=sx;}
      if(f==='slide-left'||f==='diagonal-nw')x=-distance*remaining;
      if(f==='slide-right'||f==='diagonal-ne')x=distance*remaining;
      if(f==='slide-up'||f==='diagonal-nw'||f==='diagonal-ne')y=-dy*remaining;
      if(f==='slide-down')y=dy*remaining;
      if(f==='wipe-left')x=-width*(1-sx/100)/2;
      if(f==='wipe-right')x=width*(1-sx/100)/2;
      if(f==='curtain-top')y=-height*(1-sy/100)/2;
      if(f==='curtain-bottom')y=height*(1-sy/100)/2;
      if(f==='rotate-left'||f==='rotate-right'){
        rotation=(f==='rotate-left'?-1:1)*14*strength*remaining;sx=(.85+.15*pin)*100;sy=sx;
      }
      if(f==='bounce')y=-dy*Math.abs(Math.sin((time-a)*10))*Math.exp(-Math.max(0,time-a)*7)*Math.max(0,remaining);
      var settled=Math.max(0,time-a-di),loop=cfg.loop===true?Math.min(1,settled/.3):0;
      if(f==='float')y-=Math.sin(settled*2)*height*.07*strength*loop;
      if(f==='pulse'){var pulse=1+Math.sin(settled*3)*.035*strength*loop;sx*=pulse;sy*=pulse;}
      if(f==='swing')rotation+=Math.sin(settled*2.5)*3*strength*loop;
      if(f==='orbit'){x+=Math.sin(settled*1.8)*height*.08*strength*loop;y+=(Math.cos(settled*1.8)-1)*height*.06*strength*loop;}
      if(f==='elastic-x'||f==='elastic-y'||f==='elastic-both'){
        var eu=number((time-a)/di,0,0,1),elastic=eu===0?0:eu===1?1:1-Math.exp(-6*eu)*Math.cos(12*eu);
        if(f!=='elastic-y')sx=100*elastic;if(f!=='elastic-x')sy=100*elastic;
      }
      var visible=time>=start&&time<end,edge=Math.max(0,Math.min(1,pin))*(1-pout);
      if(forceZero){
        // Padding and stroke must also disappear at a run's outer boundaries.
        // During the middle of the run scale is exactly 100 (unless a chosen
        // ambient preset explicitly requests movement); size uses path geometry.
        var horizontal=/^(expand-x|wipe-left|wipe-right|elastic-x)$/.test(f),vertical=/^(expand-y|curtain-top|curtain-bottom|elastic-y)$/.test(f),both=f==='expand-both'||f==='elastic-both';
        var fastEdge=ease((time-a)/Math.max(.001,Math.min(.08,di*.3)),'smooth');
        if(!horizontal&&!both)sx*=vertical?fastEdge:Math.max(0,Math.min(1,pin));
        if(!vertical&&!both)sy*=horizontal?fastEdge:Math.max(0,Math.min(1,pin));
      }
      var exit=cfg.exit||'nativeMirror81',outX=1,outY=1;
      if(forceZero||exit==='scaleOut'){outX=1-pout;outY=1-pout;}
      else if(exit==='splitClose')outX=1-pout;
      else if(exit==='nativeMirror81'){
        if(/^(expand-x|wipe-left|wipe-right|elastic-x)$/.test(f))outX=1-pout;
        else if(/^(expand-y|curtain-top|curtain-bottom|elastic-y)$/.test(f))outY=1-pout;
        else if(/^(expand-both|elastic-both|pop)$/.test(f)){outX=1-pout;outY=1-pout;}
        if(f==='slide-left'||f==='diagonal-nw')x-=distance*pout;
        if(f==='slide-right'||f==='diagonal-ne')x+=distance*pout;
        if(f==='slide-up'||f==='diagonal-nw'||f==='diagonal-ne')y-=dy*pout;
        if(f==='slide-down')y+=dy*pout;
        if(f==='rotate-left'||f==='rotate-right')rotation+=(f==='rotate-left'?-1:1)*14*strength*pout;
      }
      if(exit==='slideLeftOut')x-=distance*pout;
      if(exit==='slideRightOut')x+=distance*pout;
      if(exit==='slideDown')y+=dy*pout;
      sx=Math.max(0,sx)*outX;sy=Math.max(0,sy)*outY;
      if(cfg.exitMotion){var om=cfg.exitMotion,reverse=sample({family:om.family,curve:om.curve,strength:om.strength,inDur:dout,outDur:.001,exit:'none',loop:false},Math.max(0,end-time),0,span+20,width,height,forceZero);sx*=reverse.scaleX/100;sy*=reverse.scaleY/100;x+=reverse.x;y+=reverse.y;rotation+=reverse.rotation;edge*=reverse.opacity/100;}
      if(!visible||time<=a){sx=forceZero?0:sx;sy=forceZero?0:sy;}
      if(!visible&&time>=end){sx=0;sy=0;}
      return {x:x===0?0:x,y:y===0?0:y,scaleX:sx,scaleY:sy,rotation:rotation===0?0:rotation,opacity:visible?100*edge:0};
    }
    return {sample:sample,ease:ease};
  }
  var engine=evaluator81();
  var families=[
    ['expand-x','بازشدن افقی','Horizontal reveal','reveal'],['expand-y','بازشدن عمودی','Vertical reveal','reveal'],
    ['expand-both','بازشدن از مرکز','Center reveal','reveal'],['pop','پاپ نرم','Soft pop','scale'],
    ['slide-left','ورود از چپ','From left','slide'],['slide-right','ورود از راست','From right','slide'],
    ['slide-up','ورود از بالا','From above','slide'],['slide-down','ورود از پایین','From below','slide'],
    ['diagonal-nw','ورود مورب چپ','Diagonal left','slide'],['diagonal-ne','ورود مورب راست','Diagonal right','slide'],
    ['wipe-left','بازشدن از لبهٔ چپ','Left edge reveal','reveal'],['wipe-right','بازشدن از لبهٔ راست','Right edge reveal','reveal'],
    ['curtain-top','پرده از بالا','Top curtain','reveal'],['curtain-bottom','پرده از پایین','Bottom curtain','reveal'],
    ['rotate-left','چرخش نرم چپ','Left tilt','rotate'],['rotate-right','چرخش نرم راست','Right tilt','rotate'],
    ['elastic-x','کشش افقی','Elastic width','elastic'],['elastic-y','کشش عمودی','Elastic height','elastic'],
    ['elastic-both','کشش دوطرفه','Elastic surface','elastic'],['bounce','فرود فنری','Spring landing','elastic'],
    ['float','شناوری آرام','Gentle float','ambient'],['pulse','نفس‌کشیدن','Breathing','ambient'],
    ['swing','تاب نرم','Gentle swing','ambient'],['orbit','گردش آرام','Gentle orbit','ambient']
  ];
  var profiles=[
    ['soft','نرم','Soft',.48,.36,.65,'smooth'],['quick','سریع','Quick',.2,.18,.8,'quart'],
    ['cinema','سینمایی','Cinematic',.72,.52,.85,'sine'],['bold','پرقدرت','Bold',.32,.26,1.5,'back'],
    ['spring','فنری','Spring',.58,.4,1.15,'spring'],['precise','دقیق','Precise',.4,.32,1,'linear']
  ];
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function number(v,d,a,b){v=Number(v);return Math.max(a,Math.min(b,isFinite(v)?v:d));}
  function catalog(){var out=[];for(var i=0;i<families.length;i++)for(var j=0;j<profiles.length;j++){
    var f=families[i],p=profiles[j];out.push({id:f[0]+':'+p[0],family:f[0],category:f[3],fa:f[1]+' · '+p[1],en:f[2]+' · '+p[2],inDur:p[3],outDur:p[4],strength:p[5],curve:p[6],loop:f[3]==='ambient'});
  }return out;}
  var presets=catalog();
  function find(id){if(id==='none')return {id:'none',family:'none',category:'normal',fa:'معمولی · بدون حرکت',en:'Normal · no motion',inDur:.03,outDur:.03,strength:1,curve:'linear',loop:false};for(var i=0;i<presets.length;i++)if(presets[i].id===id)return clone(presets[i]);return null;}
  function resolve(bg){
    bg=bg||{};var source=bg.motion81||{},p=find(source.preset)||find('expand-x:soft'),out=find(source.outPreset);
    return {exitMotion:out?{family:out.family,curve:out.curve,strength:out.strength}:null,family:p.family,curve:/^(smooth|linear|spring|quart|sine|back)$/.test(source.curve)?source.curve:p.curve,inDur:number(bg.motionDur,p.inDur,.03,10),outDur:number(bg.outDur,p.outDur,.03,10),delay:number(bg.motionDelay,0,0,10),strength:number(source.strength,p.strength,.1,3),loop:source.loop==null?p.loop:source.loop===true,exit:/^(none|fade|nativeMirror81|scaleOut|splitClose|slideDown|slideLeftOut|slideRightOut)$/.test(bg.outPreset)?bg.outPreset:'nativeMirror81'};
  }
  function applyPreset(bg,id){var p=find(id);if(!p)throw Error('UNKNOWN_BACKGROUND_PRESET');var out=clone(bg||{});out.enabled=true;out.independentMotion=true;out.motion81={preset:p.id,strength:p.strength,loop:p.loop};out.motionDur=p.inDur;out.outDur=p.outDur;out.outPreset='nativeMirror81';out.motionDelay=0;return out;}
  function staticText(group){
    var g=clone(group),bg=g.bg||{};if(!bg.enabled||!bg.reflow67||bg.reflow67.enabled!==true)return g;
    g.anim={mode:'simple',preset:'none',outPreset:'none',typingEnabled:false,typeSound:false,inDur:0,outDur:0,syncMode:'separate'};
    delete g.word39;return g;
  }
  function matchText(anim){
    anim=anim||{};var name=String(anim.preset||anim.nativePreset||anim.textyleIn||'').toLowerCase(),family='expand-x';
    if(/left/.test(name))family='slide-left';else if(/right/.test(name))family='slide-right';
    else if(/rise|up/.test(name))family='slide-down';else if(/drop|down/.test(name))family='slide-up';
    else if(/bounce|spring/.test(name))family='bounce';else if(/rotate|spin|tilt/.test(name))family='rotate-left';
    else if(/elastic|stretch/.test(name))family='elastic-x';else if(/pop|zoom|scale/.test(name))family='pop';
    else if(/fade/.test(name))family='expand-both';else if(/float/.test(name))family='float';
    var duration=number(anim.inDur,.4,.03,10),profile=duration<.28?'quick':duration>.6?'cinema':'soft';
    return find(family+':'+profile);
  }
  function expression(cfg,argumentsText,stringify){return '('+evaluator81.toString()+')().sample('+stringify(cfg)+','+argumentsText+')';}
  return {catalog:catalog,find:find,resolve:resolve,applyPreset:applyPreset,staticText:staticText,matchText:matchText,sample:engine.sample,ease:engine.ease,expression:expression};
});
