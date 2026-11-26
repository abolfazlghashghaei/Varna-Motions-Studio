(function (w) {
  'use strict';
  const M=w.VarnaTransform89, S=w.GHAFState, B=w.GHAFBridge, N=w.GHAFNode;
  const $=(selector,root=document)=>root.querySelector(selector);
  const en=()=>document.documentElement.lang==='en';
  const tr=(fa,english)=>en()?english:fa;
  if(!M||!S||!B||!w.VarnaUI||!$('#tablePreviewStage')||!$('#page-text'))return;

  function node(tag,cls='',content=''){
    const element=document.createElement(tag);
    element.className=cls;
    element.textContent=content;
    return element;
  }
  function control(fa,english,handler,cls='vp-button89'){
    const button=node('button',cls,tr(fa,english));
    button.type='button';
    button.addEventListener('click',handler);
    document.addEventListener('varna:language52',()=>{button.textContent=tr(fa,english);});
    return button;
  }
  function nameFor(element,fa,english){
    const apply=()=>element.setAttribute('aria-label',tr(fa,english));
    apply();document.addEventListener('varna:language52',apply);
  }
  function live(element){element.setAttribute('role','status');return element;}
  function limited(n,fallback=0){return Number.isFinite(n)?n:fallback;}
  const shell=$('.app-shell');
  const bridgeLabel=live(node('span','vp-connection89'));
  const compLabel=node('span','vp-comp89');
  const appHeader=$('.topbar');
  const context=node('div','vp-context89');
  context.append(compLabel,bridgeLabel);
  appHeader.append(context);

  let currentComp=null, hostSync=null;
  function contextStatus(){
    bridgeLabel.textContent=B.available?tr('متصل به افتر','AE connected'):tr('بدون اتصال به افتر','AE disconnected');
    compLabel.textContent=currentComp?currentComp.name:'';
  }
  function readComposition(){
    if(!B.available){contextStatus();return Promise.resolve(null);}
    if(!hostSync)hostSync=B.call('getActiveCompInfo',{}).then(meta=>{
      currentComp=meta;contextStatus();return meta;
    }).catch(()=>{currentComp=null;contextStatus();return null;}).finally(()=>{hostSync=null;});
    return hostSync;
  }
  contextStatus();
  w.addEventListener('focus',readComposition);
  document.addEventListener('varna:language52',contextStatus);
  readComposition();

  // All view coordinates are CSS pixels. The DOM/Canvas HUD sits above the
  // media transform, so zoom changes the image and leaves the controls legible.
  function viewport(stage){
    const view=node('section','vp-panel89');
    const bar=node('div','vp-toolbar89');
    const surface=node('div','vp-surface89');
    const hud=node('div','vp-hud89');
    const foot=node('div','vp-footer89');
    const zoomStatus=node('output','vp-zoom89');
    const dimensions=node('output','vp-dimensions89');
    dimensions.dir='ltr';
    stage.classList.add('vp-stage89');
    if(stage.isConnected)stage.before(view);
    surface.append(stage,hud);
    view.append(bar,surface,foot);
    let scale=1, x=0,y=0, panning=false, quality='draft';
    let onLayout=()=>{}, onQuality=()=>{};
    const draw=()=>{
      const center=stage.id==='tablePreviewStage'?'translate(-50%,-50%) ':'';
      stage.style.transform=center+'translate('+x+'px,'+y+'px) scale('+scale+')';
      zoomStatus.textContent=Math.round(scale*100)+'%';
      onLayout();
    };
    function zoom(next){scale=M.clamp(next,.5,4);draw();}
    function fit(){x=0;y=0;zoom(1);}
    const minus=control('−','−',()=>zoom(scale/1.2));nameFor(minus,'کوچک‌نمایی','Zoom out');
    const plus=control('+','+',()=>zoom(scale*1.2));nameFor(plus,'بزرگ‌نمایی','Zoom in');
    const fitButton=control('جا دادن','Fit',fit);
    const pan=control('دست','Pan',()=>{panning=!panning;surface.classList.toggle('is-panning89',panning);pan.setAttribute('aria-pressed',String(panning));});
    pan.setAttribute('aria-pressed','false');
    const qualityControl=node('select','vp-select89');
    nameFor(qualityControl,'کیفیت پیش‌نمایش','Preview quality');
    for(const [id,label] of [['draft','Draft'],['full','Full']]){
      const option=node('option','',tr(id==='draft'?'سبک':'کامل',label));option.value=id;qualityControl.append(option);
      document.addEventListener('varna:language52',()=>{option.textContent=tr(id==='draft'?'سبک':'کامل',label);});
    }
    qualityControl.onchange=()=>{quality=qualityControl.value;onQuality(quality);draw();};
    for(const [item,role] of [[fitButton,'view'],[minus,'view'],[plus,'view'],[pan,'view'],[qualityControl,'source']])item.dataset.tool90=role;
    bar.append(fitButton,minus,plus,pan,qualityControl);
    foot.append(zoomStatus,dimensions);
    surface.addEventListener('wheel',event=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();zoom(scale*(event.deltaY<0?1.12:1/1.12));},{passive:false});
    surface.addEventListener('pointerdown',event=>{
      if(!panning&&event.button!==1)return;
      event.preventDefault();event.stopPropagation();
      const pointer=event.pointerId, sx=event.clientX-x,sy=event.clientY-y;
      surface.setPointerCapture(pointer);
      const move=e=>{if(e.pointerId===pointer){x=e.clientX-sx;y=e.clientY-sy;draw();}};
      const end=e=>{
        if(e.pointerId!==pointer)return;
        surface.removeEventListener('pointermove',move);
        surface.removeEventListener('lostpointercapture',end);
      };
      surface.addEventListener('pointermove',move);
      surface.addEventListener('lostpointercapture',end);
    },true);
    surface.tabIndex=0;
    surface.setAttribute('aria-label',tr('قاب پیش‌نمایش، دست و کلیدهای جهت برای جابه‌جایی','Preview viewport, Pan and arrow keys to move'));
    surface.addEventListener('keydown',event=>{
      if(!panning||event.target!==surface)return;
      const delta={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[event.key];
      if(!delta)return;
      event.preventDefault();x+=delta[0];y+=delta[1];draw();
    });
    if(w.ResizeObserver)new ResizeObserver(()=>draw()).observe(surface);
    else w.addEventListener('resize',draw);
    function rect(){return stage.getBoundingClientRect();}
    fit();
    return {view,bar,stage,surface,hud,foot,dimensions,fit,rect,quality:()=>quality,
      panning:()=>panning,layout(handler){onLayout=handler;draw();},qualityChanged(handler){onQuality=handler;}};
  }

  const tableIDs={x:'tableX',y:'tableY',width:'tableWidth',height:'tableHeight'};
  const extras={rotation:0,scale:100,opacity:100,ax:0,ay:0};
  const numericFieldDefs=[
    ['x','موقعیت X','X position','px'],['y','موقعیت Y','Y position','px'],
    ['width','عرض','Width','px'],['height','ارتفاع','Height','px'],
    ['rotation','چرخش','Rotation','°'],['scale','مقیاس','Scale','%'],
    ['opacity','شفافیت','Opacity','%'],['ax','محور X','Anchor X','px'],['ay','محور Y','Anchor Y','px']
  ];
  function transformTable(){
    const stage=$('#tablePreviewStage'), preview=$('#tablePreview');
    const v=viewport(stage);
    v.view.id='tableViewport89';
    const tableLayer=node('div','vp-grid89');
    v.view.before(tableLayer);
    tableLayer.id='tableStudio89';
    const inspector=node('details','vp-inspector89');
    inspector.open=true;
    const inspectorTitle=node('summary','',tr('ویژگی‌های جدول','Properties'));
    inspector.append(inspectorTitle);
    document.addEventListener('varna:language52',()=>{inspectorTitle.textContent=tr('ویژگی‌های جدول','Properties');});
    const fields=node('div','vp-fields89');
    const actions=node('div','vp-toolbar89 vp-split89');
    const aspect=control('قفل نسبت','Lock ratio',()=>{
      lock=!lock;aspect.setAttribute('aria-pressed',String(lock));
    });
    aspect.setAttribute('aria-pressed','false');
    const reset=control('بازنشانی','Reset',()=>{
      if(initial){commit({...initial});guides=[];queue();v.fit();}
    });
    const separator=node('div','vp-resizer89');
    separator.setAttribute('role','separator');
    separator.setAttribute('aria-label',tr('عرض تنظیمات','Inspector width'));
    separator.setAttribute('aria-orientation','vertical');
    separator.tabIndex=0;
    const setInspectorWidth=width=>{
      const next=M.clamp(width,220,340);
      tableLayer.style.setProperty('--vp-inspector-width',next+'px');
      separator.setAttribute('aria-valuenow',String(next));
    };
    setInspectorWidth(255);
    separator.setAttribute('aria-valuemin','220');
    separator.setAttribute('aria-valuemax','340');
    separator.onkeydown=event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();setInspectorWidth(+separator.getAttribute('aria-valuenow')+(event.key==='ArrowLeft'?-12:12));
    };
    separator.onpointerdown=event=>{
      if(event.button!==0)return;
      separator.setPointerCapture(event.pointerId);
      const start=event.clientX, width=+separator.getAttribute('aria-valuenow');
      const rtl=getComputedStyle(tableLayer).direction==='rtl';
      separator.onpointermove=next=>setInspectorWidth(width+(next.clientX-start)*(rtl?1:-1));
      separator.onlostpointercapture=()=>{separator.onpointermove=null;};
    };
    actions.append(aspect,reset);inspector.append(fields,actions);
    tableLayer.append(v.view,separator,inspector);
    inspector.addEventListener('toggle',()=>tableLayer.toggleAttribute('data-inspector-collapsed89',!inspector.open));
    const report=live(node('output','vp-transform-status89'));
    const compTime=node('output','vp-time89');compTime.dir='ltr';v.foot.append(compTime);
    report.dir='ltr';v.foot.append(report);
    const wires=node('div','vp-wires89');
    const pointerHUD=node('div','vp-pointer89');
    v.hud.append(wires,pointerHUD);
    const buttons=[];
    let drawing=null, pen=null, path=null, dotted=null;
    if(w.Konva){
      drawing=new w.Konva.Stage({container:wires,width:1,height:1,listening:false});
      pen=new w.Konva.Layer({listening:false});drawing.add(pen);
      path=new w.Konva.Line({closed:true,stroke:'#b3a3ff',strokeWidth:1,listening:false});
      dotted=new w.Konva.Line({stroke:'#b3a3ff',strokeWidth:1,listening:false});
      pen.add(path,dotted);
    }
    let active=null, lock=false, initial=null, guides=[], pending=0, editing=0, hiddenOverlay=false;
    const presetsKey='VARNA_TABLE_TRANSFORM89';
    const inputs=new Map();
    function dimensions89(){
      const meta=w.VarnaTable50?.timeline()||{};
      return {width:+meta.width||1920,height:+meta.height||1080};
    }
    function read(){
      const value={...extras};
      const d=dimensions89(), defaults={x:d.width/2,y:d.height/2,width:850,height:360};
      for(const [key,id] of Object.entries(tableIDs))value[key]=limited(parseFloat($('#'+id).value),defaults[key]);
      return value;
    }
    const bounds=(key,value)=>{
      const d=dimensions89();
      return {x:[-d.width*3,d.width*4],y:[-d.height*3,d.height*4],width:[80,d.width*3],height:[60,d.height*3],
        rotation:[-3600,3600],scale:[1,600],opacity:[0,100],ax:[-value.width*2,value.width*2],ay:[-value.height*2,value.height*2]}[key];
    };
    const round=value=>Math.round(value*100)/100;
    function limit(key, number, value){return round(M.clamp(number,...bounds(key,value)));}
    function update(value){
      Object.keys(extras).forEach(key=>{extras[key]=limit(key,value[key],value);});
      for(const [key,id] of Object.entries(tableIDs))$('#'+id).value=limit(key,value[key],value);
      if(!editing){
        w.VarnaTable50.render();
        w.VarnaNumeric37?.refresh();
      }
      queue();
    }
    function commit(value){editing=0;update(value);}
    const storePreset=control('ذخیرهٔ تبدیل','Save transform',()=>{
      try{localStorage.setItem(presetsKey,JSON.stringify({values:read(),lock}));report.textContent=tr('ذخیره شد','Saved');}
      catch(error){report.textContent=error.message;}
    });
    const usePreset=control('بارگذاری تبدیل','Load transform',()=>{
      try{
        const saved=JSON.parse(localStorage.getItem(presetsKey)||'null');
        if(!saved?.values){report.textContent=tr('تبدیل ذخیره‌شده‌ای وجود ندارد','No saved transform');return;}
        const value=read();
        for(const key of Object.keys(value))value[key]=limited(saved.values[key],value[key]);
        lock=saved.lock===true;aspect.setAttribute('aria-pressed',String(lock));commit(value);
      }catch(error){report.textContent=error.message;}
    });
    actions.append(storePreset,usePreset);
    const floating=control('شناور','Float',()=>{
      const mode=tableLayer.toggleAttribute('data-floating89');
      floating.setAttribute('aria-pressed',String(mode));
      if(mode){inspector.open=true;inspector.style.setProperty('--vp-float-x','10px');inspector.style.setProperty('--vp-float-y','8px');}
    });
    floating.classList.add('vp-float-toggle89');
    const grip=control('جابه‌جایی پنل','Move inspector',()=>{},'vp-button89 vp-float-grip89');
    grip.onpointerdown=event=>{
      if(!tableLayer.hasAttribute('data-floating89')||event.button!==0)return;
      const initialRect=inspector.getBoundingClientRect(), outer=tableLayer.getBoundingClientRect();
      const startX=event.clientX,startY=event.clientY;
      grip.setPointerCapture(event.pointerId);
      grip.onpointermove=next=>{
        const x=M.clamp(initialRect.left-outer.left+next.clientX-startX,0,Math.max(0,outer.width-initialRect.width));
        const y=M.clamp(initialRect.top-outer.top+next.clientY-startY,0,Math.max(0,outer.height-140));
        inspector.style.setProperty('--vp-float-x',x+'px');inspector.style.setProperty('--vp-float-y',y+'px');
      };
      grip.onlostpointercapture=()=>{grip.onpointermove=null;};
    };
    grip.onkeydown=event=>{
      const delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[event.key];
      if(!delta)return;
      event.preventDefault();
      const box=tableLayer.getBoundingClientRect(), panel=inspector.getBoundingClientRect();
      inspector.style.setProperty('--vp-float-x',M.clamp(panel.left-box.left+delta[0],0,box.width-panel.width)+'px');
      inspector.style.setProperty('--vp-float-y',M.clamp(panel.top-box.top+delta[1],0,Math.max(0,box.height-140))+'px');
    };
    inspector.querySelector('summary').after(grip);
    floating.dataset.tool90='view';v.bar.append(floating);
    function adjust(key,value,base=read()){
      const next={...base,[key]:limit(key,value,base)};
      if(lock&&(key==='width'||key==='height')){
        const d=dimensions89();
        const ratio=M.clamp(next[key]/base[key],Math.max(80/base.width,60/base.height),Math.min(d.width*3/base.width,d.height*3/base.height));
        next.width=base.width*ratio;next.height=base.height*ratio;
      }
      return next;
    }
    for(const [key,fa,english,unit] of numericFieldDefs){
      const field=node('div','vp-field89');
      const label=control(fa,english,()=>input.focus(),'vp-scrub89');
      label.title=tr('بکش · Shift سریع‌تر · Alt دقیق‌تر','Scrub · Shift faster · Alt for precision');
      const input=node('input','vp-number89');input.type='text';
      input.inputMode='decimal';input.dir='ltr';nameFor(input,fa+' '+unit,english+' '+unit);
      const unitNode=node('span','vp-unit89',unit);
      let before='', discard=false;
      const parse=()=>Number(input.value.trim().replace(/[,٫]/g,'.').replace(/−/g,'-')
        .replace(/[۰-۹]/g,ch=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)).replace(/[٠-٩]/g,ch=>'٠١٢٣٤٥٦٧٨٩'.indexOf(ch)));
      input.addEventListener('focus',()=>{before=input.value;discard=false;});
      input.addEventListener('dblclick',()=>input.select());
      input.addEventListener('blur',()=>{
        const n=parse();
        if(!discard&&input.value.trim()&&Number.isFinite(n))commit(adjust(key,n));
        else input.value=read()[key];
      });
      input.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key==='Escape'){
          event.preventDefault();event.stopPropagation();discard=event.key==='Escape';
          if(discard)input.value=before;
          input.blur();return;
        }
        if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
        event.preventDefault();event.stopPropagation();
        const amount=event.shiftKey?10:event.altKey?.1:1;
        commit(adjust(key,limited(parse(),read()[key])+(event.key==='ArrowUp'?amount:-amount)));
        input.value=read()[key];
      });
      label.onpointerdown=event=>{
        if(event.button!==0)return;
        event.preventDefault();
        const from=event.clientX, base=read();
        editing=1;
        w.VarnaTable50.freezePreview();
        label.setPointerCapture(event.pointerId);
        label.onpointermove=e=>update(adjust(key,base[key]+(e.clientX-from)*(e.shiftKey?5:e.altKey?.1:1),base));
        const escape=e=>{
          if(e.key!=='Escape')return;
          e.preventDefault();e.stopImmediatePropagation();
          commit(base);
          if(label.hasPointerCapture(event.pointerId))label.releasePointerCapture(event.pointerId);
        };
        w.addEventListener('keydown',escape,true);
        label.onpointercancel=()=>commit(base);
        label.onlostpointercapture=()=>{
          label.onpointermove=null;w.removeEventListener('keydown',escape,true);
          if(editing)commit(read());
        };
      };
      field.append(label,input,unitNode);fields.append(field);inputs.set(key,input);
    }
    function geometry(){
      const rect=v.rect(), surface=v.surface.getBoundingClientRect(), d=dimensions89();
      const fit=rect.width/d.width;
      return {fit,width:d.width,height:d.height,left:rect.left-surface.left,top:rect.top-surface.top};
    }
    const project=(p,g)=>[g.left+p.x*g.fit,g.top+p.y*g.fit];
    function place(button,p,g){const [x,y]=project(p,g);button.style.left=x+'px';button.style.top=y+'px';}
    function draw(){
      pending=0;
      if(!v.view.getClientRects().length)return;
      const s=read(), g=geometry();
      if(!(g.fit>0))return;
      if(!initial)initial={...s};
      if(drawing&&(drawing.width()!==v.surface.clientWidth||drawing.height()!==v.surface.clientHeight)){
        drawing.size({width:v.surface.clientWidth,height:v.surface.clientHeight});
      }
      const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>project(M.point(s,x*s.width/2,y*s.height/2),g)).flat();
      const full=stage.dataset.frameMode50==='full';
      const hide=full||hiddenOverlay;
      v.hud.hidden=hide;
      compareButton.disabled=full;
      if(!hide&&path){
        const accent=getComputedStyle(v.view).getPropertyValue('--vp-accent').trim();
        path.stroke(accent);dotted.stroke(accent);
        path.points(corners);
        dotted.points([M.point(s,0,-s.height/2),M.point(s,0,-s.height/2-24/g.fit/(s.scale/100))].map(p=>project(p,g)).flat());
        for(const child of Array.from(pen.getChildren()).slice(2))child.destroy();
        for(const [axis,pos]of guides){
          const points=axis==='x'?[[pos,0],[pos,g.height]]:[[0,pos],[g.width,pos]];
          pen.add(new w.Konva.Line({points:points.map(([x,y])=>project({x,y},g)).flat(),stroke:'#55c7df',strokeWidth:1,dash:[4,3]}));
        }
        pen.batchDraw();
      }
      for(const [button,a,b] of buttons){
        const p=typeof a==='number'?M.point(s,a*s.width/2,b*s.height/2):
          a==='rotate'?M.point(s,0,-s.height/2-24/g.fit/(s.scale/100)):{x:s.x+s.ax,y:s.y+s.ay};
        place(button,p,g);
      }
      const fit=stage.clientWidth/g.width;
      if(editing){
        preview.style.width=s.width*fit+'px';preview.style.height=s.height*fit+'px';
        preview.style.left=(s.x-s.width/2)*fit+'px';preview.style.top=(s.y-s.height/2)*fit+'px';
      }
      preview.style.setProperty('transform-origin','calc(50% + '+s.ax*fit+'px) calc(50% + '+s.ay*fit+'px)','important');
      preview.style.setProperty('transform','rotate('+s.rotation+'deg) scale('+s.scale/100+')','important');
      preview.style.setProperty('opacity',String((preview.dataset.timeOpacity89||1)*s.opacity/100),'important');
      v.dimensions.textContent=g.width+'×'+g.height;
      compTime.textContent=M.timecode(+$('#tablePreviewTime').value||0,w.VarnaTable50.timeline().frameRate||30);
      if(active)report.textContent=(active.kind==='rotate'?round(s.rotation)+'°':active.kind==='move'||active.kind==='anchor'?round(s.x)+' / '+round(s.y)+' px':round(s.width)+'×'+round(s.height)+' px');
      for(const [key,input]of inputs)if(document.activeElement!==input)input.value=s[key];
    }
    function queue(){if(!pending)pending=requestAnimationFrame(draw);}
    document.addEventListener('varna:palette50',queue);
    new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
    function begin(event,kind,edgeX,edgeY){
      if(event.button!==0||v.panning()||stage.dataset.frameMode50==='full'||hiddenOverlay)return;
      event.preventDefault();event.stopImmediatePropagation();
      const target=event.currentTarget, s=read(), g=geometry(), pointer=event.pointerId;
      const sr=v.surface.getBoundingClientRect();
      const px=sr.left+g.left+(s.x+s.ax)*g.fit, py=sr.top+g.top+(s.y+s.ay)*g.fit;
      const angle=Math.atan2(event.clientY-py,event.clientX-px);
      active={kind};
      editing=1;
      w.VarnaTable50.freezePreview();
      target.setPointerCapture(pointer);
      const move=e=>{
        if(e.pointerId!==pointer)return;
        const dx=(e.clientX-event.clientX)/g.fit,dy=(e.clientY-event.clientY)/g.fit;
        let next={...s};
        if(kind==='move'){
          const snap=M.snapMove(s,{...s,x:s.x+dx,y:s.y+dy},g,6/g.fit,!e.altKey&&$('#tableSnap66')?.checked!==false);
          next=snap.value;guides=snap.guides;
        }else if(kind==='resize') next=M.anchoredResize(s,edgeX,edgeY,dx,dy,lock||e.shiftKey,{width:g.width*3,height:g.height*3});
        else if(kind==='anchor')next=M.changeAnchor(s,dx,dy);
        else{
          const diff=M.degrees(Math.atan2(e.clientY-py,e.clientX-px)-angle);
          next.rotation=s.rotation+((diff+540)%360-180);
          if(e.shiftKey)next.rotation=Math.round(next.rotation/15)*15;
        }
        update(next);
      };
      const end=e=>{
        if(e.pointerId!==pointer)return;
        target.removeEventListener('pointermove',move);
        target.removeEventListener('pointercancel',end);
        target.removeEventListener('lostpointercapture',end);
        w.removeEventListener('keydown',abort,true);
        active=null;guides=[];report.textContent='';commit(e.type==='pointercancel'||e.type==='keydown'?s:read());
        if(e.type==='keydown'&&target.hasPointerCapture(pointer))target.releasePointerCapture(pointer);
      };
      const abort=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();end({type:'keydown',pointerId:pointer});}};
      target.addEventListener('pointermove',move);
      target.addEventListener('pointercancel',end);
      target.addEventListener('lostpointercapture',end);
      w.addEventListener('keydown',abort,true);
    }
    const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    function keyTransform(event,kind,a,b){
      const arrow=direction[event.key];if(!arrow)return;
      event.preventDefault();event.stopImmediatePropagation();
      const s=read(),g=geometry(),amount=event.shiftKey?10:event.altKey?.1:1;
      const [x,y]=arrow.map(d=>d*amount);
      const next=kind==='resize'?M.anchoredResize(s,a,b,x,y,lock,{width:g.width*3,height:g.height*3}):
        kind==='anchor'?M.changeAnchor(s,x,y):kind==='rotate'?{...s,rotation:s.rotation+x+y}:{...s,x:s.x+x,y:s.y+y};
      commit(next);
    }
    const directions=[[-1,-1,'بالا چپ','Top left'],[0,-1,'بالا','Top'],[1,-1,'بالا راست','Top right'],
      [-1,0,'چپ','Left'],[1,0,'راست','Right'],[-1,1,'پایین چپ','Bottom left'],[0,1,'پایین','Bottom'],[1,1,'پایین راست','Bottom right'],
      ['rotate',0,'چرخش','Rotation'],['anchor',0,'محور','Anchor point']];
    for(const [x,y,fa,english]of directions){
      const kind=typeof x==='number'?'resize':x;
      const button=node('button','vp-handle89');button.type='button';
      button.dataset.handle89=kind==='resize'?(x&&y?'corner':'edge'):kind;
      const label=kind==='resize'?tr('تغییر اندازه · '+fa,'Resize · '+english):tr(fa,english);
      button.title=label;button.setAttribute('aria-label',label);
      if(kind==='resize')button.style.cursor=x&&y?(x===y?'nwse-resize':'nesw-resize'):x?'ew-resize':'ns-resize';
      button.onpointerdown=e=>begin(e,kind,x,y);
      button.onkeydown=e=>keyTransform(e,kind,x,y);
      pointerHUD.append(button);buttons.push([button,x,y]);
    }
    preview.addEventListener('pointerdown',event=>begin(event,'move'),true);
    preview.addEventListener('keydown',event=>{if(event.target===preview)keyTransform(event,'move');},true);
    function compare(){
      hiddenOverlay=!hiddenOverlay;
      stage.toggleAttribute('data-before89',hiddenOverlay);
      compareButton.setAttribute('aria-pressed',String(hiddenOverlay));queue();
    }
    const compareButton=control('قبل / بعد','Before / After',compare);
    const aeBackground=control('فریم افتر','AE frame',async()=>{
      if(!B.available){report.textContent=tr('اتصال به افتر برقرار نیست','After Effects is disconnected');return;}
      aeBackground.disabled=true;
      try{await w.VarnaTable50.refreshTimeline();await w.VarnaFrameSource89.table('background',v.quality());}
      finally{aeBackground.disabled=false;queue();}
    });
    const aeFull=control('رندر با جدول','Render with table',async()=>{
      if(!B.available){report.textContent=tr('اتصال به افتر برقرار نیست','After Effects is disconnected');return;}
      aeFull.disabled=true;
      try{await w.VarnaTable50.refreshTimeline();await w.VarnaFrameSource89.table('full',v.quality());}
      finally{aeFull.disabled=false;queue();}
    });
    const edit=control('طراحی','Design',()=>{$('#tableDesign50').click();queue();});
    for(const [item,role] of [[compareButton,'view'],[aeBackground,'source'],[aeFull,'source'],[edit,'source']])item.dataset.tool90=role;
    v.bar.append(compareButton,aeBackground,aeFull,edit);
    let lastSize='';
    v.layout(()=>{
      const size=v.surface.clientWidth+'x'+v.surface.clientHeight;
      if(size!==lastSize&&v.surface.clientWidth>16&&v.surface.clientHeight>16&&!editing){
        lastSize=size;w.VarnaTable50.render();
      }
      queue();
    });
    v.qualityChanged(quality=>{if(pen){pen.getCanvas().setPixelRatio(quality==='full'?Math.min(2,devicePixelRatio||1):1);queue();}});
    document.addEventListener('varna:tablerender89',queue);
    document.addEventListener('varna:page',queue);
    return {values:()=>({...extras}),editing:()=>!!editing};
  }

  let captureQueue=Promise.resolve();
  function hostCapture(job){
    const run=captureQueue.then(job);
    captureQueue=run.catch(()=>{});
    return run;
  }
  async function scaledImage(source,maxEdge){
    return new Promise(resolve=>{
      const picture=new Image();
      picture.onload=()=>{
        const ratio=Math.min(1,maxEdge/Math.max(picture.naturalWidth,picture.naturalHeight));
        if(ratio===1){resolve(source);return;}
        const canvas=node('canvas');
        canvas.width=Math.max(1,Math.round(picture.naturalWidth*ratio));
        canvas.height=Math.max(1,Math.round(picture.naturalHeight*ratio));
        const ctx=canvas.getContext('2d');ctx.drawImage(picture,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      picture.onerror=()=>resolve(source);
      picture.src=source;
    });
  }
  w.VarnaFrameSource89.scale=scaledImage;
  async function compFrame(comp,time,folder,quality,stale){
    const data=await B.call('renderTableFrame50',{compId:comp.id,time,folder,mode:'background'},{timeout:180000});
    if(data.compId!==comp.id)throw Error(tr('کامپوزیشن تغییر کرد.','The active composition changed.'));
    const source=await N.waitFrame(data.path,stale);
    return scaledImage(source,quality==='draft'?480:960);
  }
  function wordMonitor(){
    const dialog=node('dialog','vp-monitor89');
    dialog.setAttribute('aria-labelledby','vp-monitor-title89');
    const head=node('header','vp-monitor-head89');
    const title=node('h2','',tr('پخش کلمه‌به‌کلمه','Word playback'));title.id='vp-monitor-title89';
    const stage=node('div','vp-word-stage89');
    const img=node('img','vp-media89');img.alt='';img.hidden=true;
    const video=node('video','vp-media89');video.playsInline=true;video.preload='metadata';video.hidden=true;
    const words=node('div','vp-caption89');words.setAttribute('aria-live','off');
    stage.append(img,video,words);
    const v=viewport(stage);
    const close=control('بستن','Close',()=>dialog.close());
    head.append(title,close);
    document.addEventListener('varna:language52',()=>{title.textContent=tr('پخش کلمه‌به‌کلمه','Word playback');});
    const controls=node('div','vp-transport89');
    const seek=node('input','vp-seek89');seek.type='range';seek.dataset.numericSkip='true';seek.min=0;seek.max=4;seek.step='.001';seek.dir='ltr';
    seek.setAttribute('aria-label',tr('زمان پیش‌نمایش','Preview time'));
    const timecode=node('output','vp-time89');timecode.dir='ltr';
    const sourceLabel=live(node('span','vp-source89'));
    const status=live(node('p','vp-status89'));
    const progress=node('progress','vp-progress89');progress.max=1;progress.value=0;progress.hidden=true;
    const mediaFile=node('input');mediaFile.type='file';mediaFile.accept='image/*,video/*';mediaFile.hidden=true;
    let metadata={width:1920,height:1080,frameRate:30}, timed=[], cap=null, activeWord=-1;
    let time=0,startTime=0,endTime=4,playing=false,raf=0,clock=0, offset=0;
    let before=false, opener=null, frames=[], shownFrame=null, objectURL='', job=null, externalCaptions=null;
    const captionsFile=node('input');
    captionsFile.type='file';captionsFile.accept='.srt';captionsFile.hidden=true;
    const importSrt=control('باز کردن SRT','Open SRT',()=>captionsFile.click());
    const useProject=control('متن پروژه','Project captions',()=>{
      externalCaptions=null;stop();loadCaptions();setTime(time);
    });
    captionsFile.onchange=async()=>{
      const file=captionsFile.files?.[0];captionsFile.value='';
      if(!file)return;
      try{
        externalCaptions=w.VarnaEdit51.parseSrt(await file.text()).map(item=>({...item,rawText:item.text}));
        stop();const selected=loadCaptions();setTime(selected?.start||0);
        status.textContent=tr('زمان کلمه‌ها در SRT تخمینی است.','Word timing is estimated for SRT.');
      }catch(error){status.textContent=error.message;}
    };
    function loadCaptions(){
      const groups=externalCaptions||S.exportGroups();
      timed=groups.filter(group=>group.rawText&&group.end>group.start).map(group=>{
        const tokens=w.VarnaCaptions37?.tokens(group.rawText)||[];
        const pieces=tokens.length?tokens.map(token=>token.text):group.rawText.split(/\s+/).filter(Boolean);
        const useTime=group.timing38?.length===pieces.length&&group.timing38.every(item=>Number.isFinite(item.start)&&Number.isFinite(item.end));
        const duration=group.end-group.start;
        return {...group,pieces,estimated:!useTime,intervals:pieces.map((_,index)=>{
          if(!useTime)return [group.start+duration*index/pieces.length,group.start+duration*(index+1)/pieces.length];
          const t=group.timing38[index];
          return [M.clamp(t.start,group.start,group.end),M.clamp(t.end,group.start,group.end)];
        })};
      }).sort((a,b)=>a.start-b.start);
      const selected=timed.find(group=>group.id===S.selectedId)||timed[0];
      startTime=video.hidden?(frames[0]?.time??timed[0]?.start??0):0;
      endTime=video.hidden?(frames.length>1?frames[frames.length-1].time:Math.max(startTime+.04,...timed.map(group=>group.end),time)):limited(video.duration,4);
      seek.min=startTime;seek.max=endTime;
      seek.disabled=!(endTime>startTime);
      cap=null;activeWord=-1;
      return selected;
    }
    function render(){
      timecode.textContent=M.timecode(time,metadata.frameRate);seek.value=time;
      v.dimensions.textContent=metadata.width+'×'+metadata.height;
      const next=timed.find(group=>time>=group.start&&time<group.end);
      if(cap!==next||(!cap&&!words.childElementCount)){
        cap=next;activeWord=-1;
        words.replaceChildren();
        if(cap){
          words.dir=cap.style?.rtl?'rtl':'auto';
          const frag=document.createDocumentFragment();
          for(const [i,text] of cap.pieces.entries()){
            const word=node('span','',text);
            if(cap.highlight37?.rawIndices38?.includes(i)){
              word.dataset.keyword89='';word.style.setProperty('--word-color89',cap.highlight37.color);
            }
            frag.append(word);
          }
          words.append(frag);
        }else if(!timed.length)words.append(node('span','vp-empty89',tr('برای پخش، زیرنویس وارد کن.','Import captions to preview timed words.')));
        words.dataset.estimated89=String(!!cap?.estimated);
      }
      if(cap){
        const index=cap.intervals.findIndex(([start,end])=>time>=start&&time<end);
        if(index!==activeWord){if(activeWord>=0)words.children[activeWord]?.removeAttribute('data-playing89');if(index>=0)words.children[index]?.setAttribute('data-playing89','');activeWord=index;}
      }
      if(frames.length){
        const display=frames.reduce((selected,frame)=>frame.time<=time?frame:selected,frames[0]);
        if(shownFrame!==display){img.src=display.url;shownFrame=display;}
      }
    }
    function motionClock(now){
      if(!playing)return;
      const next=video.hidden?offset+(now-clock)/1000:video.currentTime;
      time=M.clamp(next,startTime,endTime);render();
      if(next>=endTime||(!video.hidden&&video.ended)){stop();return;}
      raf=requestAnimationFrame(motionClock);
    }
    function stop(){
      playing=false;cancelAnimationFrame(raf);video.pause();
      play.textContent=tr('پخش','Play');play.setAttribute('aria-pressed','false');
    }
    function setTime(next,writeVideo=true){
      time=M.clamp(next,startTime,endTime);
      if(writeVideo&&!video.hidden&&Number.isFinite(video.duration))video.currentTime=time;
      if(playing){clock=performance.now();offset=time;}
      render();
    }
    const play=control('پخش','Play',async()=>{
      if(playing){stop();return;}
      if(!frames.length&&video.hidden&&!timed.length){status.textContent=tr('ابتدا زیرنویس یا ویدئو وارد کن.','Import captions or a video first.');return;}
      if(time>=endTime)setTime(startTime);
      if(!video.hidden){try{await video.play();}catch(error){status.textContent=error.message;return;}}
      playing=true;clock=performance.now();offset=time;
      play.textContent=tr('مکث','Pause');play.setAttribute('aria-pressed','true');
      raf=requestAnimationFrame(motionClock);
    });
    play.setAttribute('aria-pressed','false');
    const back=control('فریم قبل','Previous frame',()=>{stop();setTime(time-1/(metadata.frameRate||30));});
    const next=control('فریم بعد','Next frame',()=>{stop();setTime(time+1/(metadata.frameRate||30));});
    const follow=control('رفتن به تایم‌لاین','Seek AE timeline',async()=>{
      if(!B.available){status.textContent=tr('اتصال به افتر برقرار نیست.','After Effects is disconnected.');return;}
      try{await B.call('previewCaption',{start:time,end:time+1/(metadata.frameRate||30),audioOnly:false});}
      catch(error){status.textContent=error.message;}
    });
    const comparison=control('قبل / بعد','Before / After',()=>{
      before=!before;words.hidden=before;stage.toggleAttribute('data-before89',before);comparison.setAttribute('aria-pressed',String(before));
    });
    comparison.setAttribute('aria-pressed','false');
    seek.oninput=()=>{stop();setTime(+seek.value);};
    controls.append(play,back,next,timecode,seek,follow);
    const importButton=control('باز کردن رسانه','Open media',()=>mediaFile.click());
    const crop=node('details','vp-crop89');crop.hidden=true;
    crop.append(node('summary','',tr('برش و جای‌گذاری رسانه','Media crop & position')));
    const cropInputs=node('div','vp-fields89');
    const cropValues={left:0,top:0,right:0,bottom:0,x:0,y:0};
    const controlsByName={};
    function applyCrop(){
      const {left,top,right,bottom,x,y}=cropValues;
      for(const media of [video,img]){
        media.style.clipPath='inset('+top+'% '+right+'% '+bottom+'% '+left+'%)';
        media.style.transform='translate('+x+'%,'+y+'%)';
      }
    }
    for(const [key,fa,english] of [['left','برش چپ','Crop left'],['top','برش بالا','Crop top'],['right','برش راست','Crop right'],['bottom','برش پایین','Crop bottom'],['x','موقعیت X رسانه','Media X'],['y','موقعیت Y رسانه','Media Y']]){
      const row=node('label','vp-field89'),n=node('input','vp-number89');
      const position=key==='x'||key==='y';
      n.type='number';n.value=0;n.step='.1';n.min=position?-100:0;n.max=position?100:90;
      controlsByName[key]=n;
      n.oninput=()=>{
        const opposite={left:'right',right:'left',top:'bottom',bottom:'top'}[key];
        cropValues[key]=M.clamp(+n.value||0,+n.min,opposite?Math.min(+n.max,99-cropValues[opposite]):+n.max);
        applyCrop();
      };
      n.onchange=()=>{n.value=cropValues[key];};
      row.append(node('span','',tr(fa,english)),n,node('span','vp-unit89','%'));
      cropInputs.append(row);
    }
    const resetCrop=control('بازنشانی برش','Reset crop',()=>{
      for(const [key,input] of Object.entries(controlsByName)){input.value=cropValues[key]=0;}
      applyCrop();
    });
    crop.append(cropInputs,resetCrop);

    function releaseMedia(){
      stop();video.removeAttribute('src');video.load();video.hidden=true;img.hidden=true;img.removeAttribute('src');
      if(objectURL)URL.revokeObjectURL(objectURL);
      objectURL='';frames=[];shownFrame=null;
      crop.hidden=true;
      for(const [key,input] of Object.entries(controlsByName)){input.value=cropValues[key]=0;}
      applyCrop();
    }
    function fitMedia(){
      v.surface.dataset.orientation90=metadata.width>=metadata.height?'landscape':'portrait';
      const width=v.surface.clientWidth-16,height=v.surface.clientHeight-16;
      if(width<=0||height<=0)return;
      const fit=Math.min(width/metadata.width,height/metadata.height);
      stage.style.width=metadata.width*fit+'px';stage.style.height=metadata.height*fit+'px';
    }
    v.layout(fitMedia);
    function setDimensions(width,height){
      metadata.width=width||1920;metadata.height=height||1080;
      stage.style.aspectRatio=metadata.width+' / '+metadata.height;
      fitMedia();render();
    }
    mediaFile.onchange=()=>{
      const file=mediaFile.files?.[0];mediaFile.value='';
      if(!file)return;
      if(job)job.cancelled=true;
      releaseMedia();objectURL=URL.createObjectURL(file);
      const url=objectURL;
      crop.hidden=false;
      sourceLabel.textContent=file.name;
      status.textContent='';
      if(file.type.startsWith('video/')||/\.(mp4|webm|mov|m4v)$/i.test(file.name)){
        video.onloadedmetadata=()=>{
          if(objectURL!==url)return;
          video.hidden=false;setDimensions(video.videoWidth,video.videoHeight);loadCaptions();setTime(0);
        };
        video.onerror=()=>{if(objectURL===url)status.textContent=tr('این فرمت ویدئو در پنل قابل پخش نیست.','This video format is unavailable in this panel.');};
        video.src=url;
      }else{
        img.onload=()=>{if(objectURL===url){img.hidden=false;setDimensions(img.naturalWidth,img.naturalHeight);}};
        img.onerror=()=>{if(objectURL===url)status.textContent=tr('تصویر خوانده نشد.','Image could not be decoded.');};
        img.src=url;
      }
    };
    async function capture(sequence){
      if(job)return;
      if(!B.available||!N.available){status.textContent=tr('اتصال به افتر برقرار نیست.','After Effects is disconnected.');return;}
      stop();
      const request={cancelled:false};
      job=request;cancel.hidden=false;progress.hidden=false;progress.value=0;
      frameButton.disabled=sequenceButton.disabled=true;
      status.textContent=tr('در حال خواندن فریم‌ها از افتر…','Reading frames from After Effects…');
      const quality=v.quality();
      try{
        const result=await hostCapture(async()=>{
          if(request.cancelled)return null;
          const comp=await B.call('getActiveCompInfo',{});
          const active=await B.call('getTimelineInfo',{});
          if(active.compId!==comp.id)throw Error(tr('کامپوزیشن تغییر کرد.','The active composition changed.'));
          const at=M.clamp(active.time||0,0,Math.max(0,comp.duration-1/comp.frameRate));
          const rate=quality==='draft'?3:6;
          const count=sequence?Math.min(1+Math.floor((comp.duration-at-1/comp.frameRate)*rate),1+Math.floor(3*rate)):1;
          const folder=N.makeMotionTemp(), out=[];
          try{
            for(let i=0;i<Math.max(1,count)&&!request.cancelled;i++){
              const instant=at+i/rate;
              out.push({time:instant,url:await compFrame(comp,instant,folder,quality,()=>request.cancelled)});
              progress.value=(i+1)/Math.max(1,count);
            }
            return {comp,frames:out,at};
          }finally{N.cleanMotionTemp(folder);}
        });
        if(request.cancelled||!result)return;
        releaseMedia();metadata={...metadata,...result.comp};
        frames=result.frames;
        img.hidden=false;img.onload=null;img.onerror=null;
        time=result.at;loadCaptions();
        setDimensions(metadata.width,metadata.height);setTime(time);
        sourceLabel.textContent=result.comp.name;
        status.textContent=sequence?tr('دنبالهٔ کوتاه آماده است؛ پخش را بزن.','Short frame sequence ready. Press Play.'):
          tr('فریم افتر خوانده شد.','After Effects frame loaded.');
      }catch(error){if(!request.cancelled)status.textContent=error.message;}
      finally{
        job=null;frameButton.disabled=sequenceButton.disabled=false;cancel.hidden=true;progress.hidden=true;
        if(request.cancelled)status.textContent=tr('خواندن فریم لغو شد.','Frame capture cancelled.');
      }
    }
    const frameButton=control('فریم افتر','AE frame',()=>capture(false));
    const sequenceButton=control('دنبالهٔ افتر','AE sequence',()=>capture(true));
    const cancel=control('لغو','Cancel',()=>{if(job)job.cancelled=true;});cancel.hidden=true;
    comparison.dataset.tool90='view';
    for(const item of [importButton,importSrt,useProject,frameButton,sequenceButton,cancel])item.dataset.tool90='source';
    v.bar.append(importButton,importSrt,useProject,frameButton,sequenceButton,comparison,cancel);
    v.foot.append(sourceLabel);
    dialog.append(head,v.view,controls,crop,progress,status,mediaFile,captionsFile);
    document.body.append(dialog);
    function open(){
      if(dialog.open)return;
      opener=document.activeElement;
      if(!frames.length&&video.hidden&&!objectURL){
        metadata={width:S.source?.compWidth||1920,height:S.source?.compHeight||1080,frameRate:30};
        stage.style.aspectRatio=metadata.width+' / '+metadata.height;
        sourceLabel.textContent=tr('پیش‌نمایش متن','Caption preview');
      }
      const selected=loadCaptions();
      setTime(selected&&!frames.length&&video.hidden?selected.start:time);
      dialog.showModal();v.fit();
    }
    dialog.addEventListener('close',()=>{stop();if(job)job.cancelled=true;opener?.focus();});
    w.addEventListener('unload',()=>{if(objectURL)URL.revokeObjectURL(objectURL);});
    const openButton=control('پخش کلمات','Word playback',open);openButton.id='wordsPreview89';
    openButton.setAttribute('aria-haspopup','dialog');
    $('.text-editor-bar80')?.append(openButton);
    return {open};
  }

  const monitor=wordMonitor();
  const table=transformTable();
  w.VarnaViewport89={table,open:monitor.open};

  const navigation=node('nav','vp-workspaces89');
  nameFor(navigation,'فضاهای کاری','Workspaces');
  const workspaceLinks=[
    ['home','خانه','Home','house',['home']],
    ['table','ویرایش','Edit','scan',['table','motion','kinetic','easing49','bg','safe']],
    ['ai','هوش مصنوعی','AI','wand-sparkles',['ai','translate','keywords']],
    ['text','زیرنویس','Captions','captions',['text','audio']],
    ['templates','دارایی‌ها','Assets','library-big',['templates','brand','tools','sfx','music','output']],
    ['settings','تنظیمات','Settings','settings-2',['settings','resources']]
  ];
  for(const [route,fa,english,icon,routes] of workspaceLinks){
    const button=control(fa,english,()=>w.VarnaUI.open(route),'vp-workspace89');
    const marker=node('span','vp-icon89');marker.setAttribute('aria-hidden','true');
    marker.dataset.icon89=icon;
    const name=node('span','',tr(fa,english));button.replaceChildren(marker,name);
    button.title=tr(fa,english);nameFor(button,fa,english);
    document.addEventListener('varna:language52',()=>{name.textContent=tr(fa,english);button.replaceChildren(marker,name);});
    navigation.append(button);
    const active=()=>{if(routes.includes(w.VarnaUI.current()))button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');};
    document.addEventListener('varna:page',active);active();
  }
  shell.append(navigation);
  function classify(){
    const width=shell.clientWidth,height=shell.clientHeight;
    shell.dataset.viewportBand89=width<400?'compact':width<700?'standard':'expanded';
    shell.dataset.viewportShort89=String(height<470);
  }
  classify();
  if(w.ResizeObserver)new ResizeObserver(classify).observe(shell);else w.addEventListener('resize',classify);
  const themes=$('#uiTheme');
  const theme=control('◐','◐',()=>{
    themes.value=(document.body.dataset.theme==='light'||document.body.dataset.theme==='silver')?'dark':'light';
    if(!themes.value)themes.value='mid';
    themes.dispatchEvent(new Event('change',{bubbles:true}));
  });
  nameFor(theme,'جابه‌جایی تم روشن و تیره','Toggle light and dark theme');
  theme.classList.add('vp-theme89');
  context.append(theme);
  const openMonitor=control('پیش‌نمایش و پخش','Preview & play',monitor.open,'studio-route-edit88');
  openMonitor.setAttribute('aria-haspopup','dialog');
  $('.studio-route-actions88')?.append(openMonitor);
  const lastKey='VARNA_LAST_VIEW89';
  document.addEventListener('varna:page',event=>{
    if(shell.hasAttribute('data-quick87'))return;
    try{localStorage.setItem(lastKey,event.detail.name);}catch(_){}
  });
  let last;
  try{last=localStorage.getItem(lastKey);}catch(_){}
  if(last&&last!=='home'&&w.VarnaFlow77?.pages.includes(last)){
    // Keep the startup/brand dialog first. Restore after the project is opened.
    const startup=$('#startup49');
    const restore=()=>{if(startup.hidden){observer.disconnect();requestAnimationFrame(()=>w.VarnaUI.open(last));}};
    const observer=new MutationObserver(restore);
    observer.observe(startup,{attributes:true,attributeFilter:['hidden']});restore();
  }
})(window);
