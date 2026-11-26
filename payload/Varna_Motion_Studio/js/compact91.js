/* Compact UI91 presentation over the original editing and host controls. */
(function(w){
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const all=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const id=name=>document.getElementById(name);
  const en=()=>w.VarnaI18n52.language()==='en';
  const tr=(fa,english)=>en()?english:fa;
  const labels=[];
  function create(tag,cls){
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    return node;
  }
  function label(node,fa,english,attribute){
    if(!node)return node;
    const update=()=>{
      const value=tr(fa,english);
      if(attribute)node.setAttribute(attribute,value);
      else if(node.textContent!==value)node.textContent=value;
    };
    labels.push(update);update();return node;
  }
  function button(fa,english,click,cls='btn secondary'){
    const node=label(create('button',cls),fa,english);
    node.type='button';node.addEventListener('click',click);return node;
  }
  function hide(node){if(node)node.dataset.hidden91='';}
  function field(name){return id(name)?.closest('label,.control');}
  function markFields(names){
    for(const name of names){
      const node=id(name)?.closest('.numeric37');
      if(node)node.dataset.numericCompact91='';
      else if(id(name))id(name).dataset.compactField91='';
    }
  }
  function moveFields(target,names){
    for(const name of names){
      const node=field(name);
      if(!node)continue;
      const old=node.parentElement;
      target.append(node);
      if(!old.childElementCount)hide(old);
    }
  }
  function disclosure(fa,english){
    const root=create('details','line-panel91');
    root.append(label(create('summary'),fa,english));
    return root;
  }
  function cleanChildren(root,selector){if(root)all(selector,root).forEach(hide);}
  function workspaceRoute(route,target){
    w.VarnaUI.open(route);
    requestAnimationFrame(()=>{const control=id(target);w.VarnaUI.reveal(control);control?.focus({preventScroll:true});});
  }

  // Exclude both assistants from direct navigation and legacy search targets.
  const excluded=new Set(['director','assistant49']);
  for(const name of excluded){
    hide(id('page-'+name));
    for(const item of all('[data-page="'+name+'"],[data-page69="'+name+'"],[data-destination69="'+name+'"]'))hide(item);
  }
  const open=w.VarnaUI.open;
  w.VarnaUI.open=function(name){if(!excluded.has(name))return open.apply(this,arguments);};
  document.addEventListener('varna:page',event=>{if(excluded.has(event.detail.name))open('home');});

  // Four Bézier values are scrubbable. The graph still supports pointer and keyboard editing.
  const curveNames=['curveX149','curveY149','curveX249','curveY249'];
  const shapeNames=['shapeFromWidth50','shapeFromHeight50','shapeWidth50','shapeHeight50','shapeDuration50','shapeDelay50','shapeRepeat50'];
  markFields([...curveNames,...shapeNames]);
  const graph=id('curveEditor49');
  const shape=id('shapeMotion50');
  const curveCard=graph.closest('article');
  hide(curveCard.closest('details.flat-section69')?.querySelector(':scope > summary'));
  for(const [i,name] of curveNames.entries()){
    const unit=field(name),axis=i%2?'Y':'X',point=i<2?'1':'2';
    label($('span',unit),axis+point,axis+point);
    label(id(name),axis+point,axis+point,'aria-label');
  }
  const curveScope=field('curveScope49');
  const curveActions=id('curveApply49').closest('.action-inline');
  const curveOptions=disclosure('محدودهٔ اعمال','Apply range');
  const allPresets=disclosure('پریست‌های منحنی','Curve presets');
  const presets=id('curvePresets49');
  presets.before(allPresets);allPresets.append(presets);
  hide(id('curveApply49'));
  curveActions.after(curveOptions);curveOptions.append(curveScope);
  label($('span',curveScope),'لبهٔ کی‌فریم','Keyframe side');
  label(id('curveRead49'),'خواندن کی‌فریم','Read keyframes');
  label(id('curveApply49'),'اعمال منحنی','Apply curve');

  const monitor=create('section','curve-monitor91');
  const surface=create('div','curve-surface91');
  const shapeSample=create('div','curve-shape91');
  const track=create('div','curve-track91'),dot=create('i','curve-dot91');
  const monitorBar=create('div','curve-monitor-bar91');
  const dims=create('output');dims.dir='ltr';
  const replay=button('پخش','Replay',()=>preview(true),'btn tiny secondary');
  track.append(dot);surface.append(shapeSample,track);monitorBar.append(dims,replay);
  monitor.append(surface,monitorBar);
  label(monitor,'پیش‌نمایش منحنی و ابعاد','Curve and size preview','aria-label');
  const graphRow=create('div','curve-row91');
  graph.before(graphRow);graphRow.append(graph,monitor);
  const shapeGrid=create('div','shape-fields91');
  const shapeControls=create('div','shape-options91');
  const shapeApply=id('shapeApply50');
  shapeApply.before(shapeGrid,shapeControls);
  hide($(':scope > .card-title',shape));
  moveFields(shapeGrid,shapeNames);
  moveFields(shapeControls,['shapeCurrent50','shapeYoyo50']);
  label($('span:last-child',field('shapeCurrent50')),'شروع از اندازهٔ فعلی','Use current size');
  label($('span:last-child',field('shapeYoyo50')),'رفت‌وبرگشت','Alternate');
  label(shapeApply,'اعمال ابعاد','Apply size');
  for(const [name,fa,english] of [
    ['shapeFromWidth50','عرض شروع','Start W'],['shapeFromHeight50','ارتفاع شروع','Start H'],
    ['shapeWidth50','عرض مقصد','End W'],['shapeHeight50','ارتفاع مقصد','End H'],
    ['shapeDuration50','مدت · s','Dur. · s'],['shapeDelay50','تأخیر · s','Delay · s'],['shapeRepeat50','تکرار','Repeat']
  ])label($('span',field(name)),fa,english);
  let previewFrame=0,animations=[];
  const reduced=w.matchMedia('(prefers-reduced-motion: reduce)');
  function preview(manual=false){
    cancelAnimationFrame(previewFrame);
    previewFrame=requestAnimationFrame(()=>{
      animations.forEach(animation=>animation.cancel());animations=[];
      if(w.VarnaUI.current()!=='easing49'||document.hidden)return;
      const num=(name,fallback)=>id(name).valueAsNumber||fallback;
      const current=id('shapeCurrent50').checked;
      const from=[num('shapeFromWidth50',100),num('shapeFromHeight50',100)];
      const to=[num('shapeWidth50',600),num('shapeHeight50',240)];
      const unit=Math.min(116/Math.max(from[0],to[0]),82/Math.max(from[1],to[1]));
      const frame=([width,height])=>({width:Math.max(2,width*unit)+'px',height:Math.max(2,height*unit)+'px'});
      const initial=frame(from),final=frame(to);
      Object.assign(shapeSample.style,final);
      dims.textContent=from.join(' × ')+' → '+to.join(' × ')+' px';
      dims.title=current?tr('پیش‌نمایش از ابعاد نمونهٔ محلی شروع می‌شود. افتر از اندازهٔ واقعی شیپ استفاده می‌کند.','The preview uses local start values. AE uses the actual shape size.'):'';
      if(reduced.matches&&!manual)return;
      const {x1,y1,x2,y2}=w.VarnaStudio49.curve();
      const timing={duration:Math.max(50,Math.min(20000,num('shapeDuration50',.6)*1000)),
        delay:Math.max(0,Math.min(60000,num('shapeDelay50',0)*1000)),
        iterations:Math.max(1,Math.min(8,Math.round(num('shapeRepeat50',1)))),
        direction:id('shapeYoyo50').checked?'alternate':'normal',
        easing:'cubic-bezier('+[x1,y1,x2,y2].join(',')+')',fill:'both'};
      animations=[shapeSample.animate([initial,final],timing),dot.animate([{left:'0%'},{left:'100%'}],timing)];
    });
  }
  document.addEventListener('varna:curve91',()=>preview());
  document.addEventListener('varna:page',()=>preview());
  for(const name of [...shapeNames,'shapeCurrent50','shapeYoyo50']){
    id(name).addEventListener('input',()=>preview());
    id(name).addEventListener('change',()=>preview());
  }

  // One word limit lives in Text. Both segmentation entry points share the pause setting.
  hide(field('maxWordsAudio'));
  const pause=id('silenceGap'),sentencePause=id('sentenceGap66');
  const pauseRow=field('silenceGap'),speechPause=create('input');
  speechPause.type='number';speechPause.min=sentencePause.min;speechPause.max=sentencePause.max;speechPause.step='.01';
  speechPause.dir='ltr';speechPause.dataset.numericSkip='true';speechPause.id='speechPause91';
  const pauseLabel=label(create('label','control'),'مکث مرزی · s','Boundary pause · s');
  pauseLabel.htmlFor=speechPause.id;
  const segmentation=create('div','speech-segmentation91');
  const smartToggle=create('input'),smartLabel=create('label','switch-row');
  smartToggle.type='checkbox';smartToggle.id='speechSmart91';
  smartLabel.append(smartToggle,create('span','switch'),label(create('span'),'جداسازی هوشمند','Smart split'));
  segmentation.append(smartLabel,pauseLabel,speechPause,button('جمله‌بندی','Sentences',()=>workspaceRoute('text','sentenceEnabled66'),'btn tiny secondary'));
  pauseRow.after(segmentation);hide(pauseRow);
  const state=w.GHAFState;
  function syncPause(){
    const value=Number(state.settings.silenceGap)||.72;
    speechPause.value=String(value);
    smartToggle.checked=id('smartGroup').checked;
    speechPause.disabled=!smartToggle.checked;
    if(!sentencePause.disabled)sentencePause.value=String(value);
  }
  function savePause(input,commit){
    const value=input.valueAsNumber;
    if(!Number.isFinite(value)){if(commit)syncPause();return;}
    if(!commit&&(value<+sentencePause.min||value>+sentencePause.max))return;
    const seconds=Math.min(+sentencePause.max,Math.max(+sentencePause.min,value));
    pause.min=sentencePause.min;pause.max=sentencePause.max;pause.step='.01';pause.value=seconds;
    state.settings.silenceGap=seconds;state.saveSettings();
    if(commit)syncPause();
    w.VarnaNumeric37?.refresh();
  }
  pause.min=sentencePause.min;pause.max=sentencePause.max;pause.step='.01';pause.value=state.settings.silenceGap;
  smartToggle.onchange=()=>{id('smartGroup').checked=smartToggle.checked;state.settings.smartGroup=smartToggle.checked;state.saveSettings();syncPause();};
  for(const input of [speechPause,sentencePause]){
    input.addEventListener('input',()=>savePause(input,false));
    input.addEventListener('change',()=>savePause(input,true));
    input.addEventListener('blur',()=>savePause(input,true));
    input.addEventListener('keydown',event=>{if(event.key==='Enter')savePause(input,true);});
  }
  document.addEventListener('varna:page',syncPause);syncPause();

  // Discovery fills in the existing tool path after a matching binary is found.
  const scannerStatus=create('output','speech-scan-status91');scannerStatus.setAttribute('role','status');
  for(const [name,tool,setting,brand] of [['whisperPath','whisper','whisper','Whisper CLI'],['ffmpegPath','ffmpeg','ffmpeg','FFmpeg']]){
    const input=id(name),owner=field(name),row=create('div','input-action speech-tool91');
    const scan=button('اسکن','Scan',()=>{
      const engine=w.GHAFNode;
      if(!engine?.available){
        scannerStatus.textContent=tr('اسکن '+brand+' در پنل AE در دسترس است.','Scan '+brand+' inside the AE panel.');return;
      }
      let result=engine.findSpeechTool91(tool,input.value,id('modelPath').value);
      if(!result){
        const folder=w.GHAFBridge.chooseFolder(tr('پوشهٔ '+brand,brand+' folder'));
        if(folder)result=engine.findSpeechTool91(tool,input.value,id('modelPath').value,folder);
      }
      if(!result){scannerStatus.textContent=tr(brand+' پیدا نشد. مسیر را وارد کن یا پوشه را دوباره انتخاب کن.',brand+' was not found. Enter a path or scan another folder.');return;}
      input.value=result;state.settings[setting]=result;state.saveSettings();
      scannerStatus.textContent=tr(brand+' پیدا شد.',brand+' found.');
    },'btn tiny secondary');
    label(scan,'اسکن '+brand,'Scan '+brand,'aria-label');
    input.before(row);row.append(input,scan);
    if(tool==='ffmpeg')owner.after(scannerStatus);
  }

  // Motion parameters sit together and the native settings stay behind their tab.
  const simple=id('animSimple'),native=id('animNative'),motionScope=id('animScope');
  const modeSwitch=$('.mode-switch',motionScope.closest('article'));
  const scopeCard=motionScope.closest('article'),modeRow=create('div','motion-mode91');
  modeSwitch.before(modeRow);modeRow.append(motionScope,modeSwitch);
  const scopeHeading=$('.card-title',scopeCard);hide(scopeHeading);
  hide(scopeCard.closest('details.flat-section69')?.querySelector(':scope > summary'));
  modeRow.dataset.scope91='';
  label(motionScope,'اعمال به','Apply to','aria-label');
  const feel=$('.motion-feel-grid',simple);
  $('.motion-target-row',simple)?.before(feel);
  hide($(':scope > .card-title',simple));
  hide($(':scope > .section-note',simple));
  hide($('#motionShowcase small',simple));
  cleanChildren(simple,'.preset small');
  const detailed=['animIn','animOffset','animOut','animStrength'];
  const precision=field('animIn').closest('details');moveFields(feel,detailed);hide(precision);
  markFields(detailed);
  cleanChildren(feel,'small');
  hide(id('motionSyncHint'));hide(id('motionTargetHint'));
  label($('span',field('animSpeedPreset')),'سرعت','Speed');
  label($('span',field('animStrengthPreset')),'شدت','Strength');
  label($('span',field('motionSyncMode')),'هماهنگی','Sync');
  for(const [i,[fa,english]] of [['همزمان','Together'],['زمینه زودتر','BG first'],['متن زودتر','Text first'],['مستقل','Separate']].entries()){
    label(id('motionSyncMode').options[i],fa,english);
  }
  label($('#page-motion .flow-advanced78 > summary'),'پیش‌نمایش و ابزارهای موشن','Motion preview & tools');
  for(const [name,fa,english] of [['animIn','ورود · s','In · s'],['animOffset','تأخیر · s','Delay · s'],['animOut','خروج · s','Out · s'],['animStrength','شدت','Strength']])label($('span',field(name)),fa,english);
  hide($('.composer-assets-panel',simple));
  const applyRow=id('motionApply').closest('.action-inline');hide(applyRow);
  cleanChildren(id('motionScopeModal'),'.scope-choice small');
  hide(id('motionScopeCaptionText'));
  const builder=id('motionBuilderName')?.closest('article');
  if(builder){
    const wrapper=builder.closest('details.flat-section69');
    native.append(builder);
    if(wrapper&&!wrapper.contains(native))hide(wrapper);
  }
  const advancedWrap=native.closest('details.flat-section69');
  if(advancedWrap&&advancedWrap!==simple.closest('details.flat-section69')){
    const tabPanel=advancedWrap.parentElement;
    const simpleWrap=simple.closest('details.flat-section69')||simple;
    simpleWrap.after(advancedWrap);
    if(tabPanel.matches('.flow-advanced78')&&tabPanel.childElementCount===1)hide(tabPanel);
    advancedWrap.classList.add('motion-native91');
    const update=()=>advancedWrap.toggleAttribute('data-hidden91',native.classList.contains('hidden'));
    new MutationObserver(update).observe(native,{attributes:true,attributeFilter:['class']});
    update();
  }

  // Shared appearance fields have one location regardless of the selected material.
  const bgMain=$('#background-panel-look'),bgAnimation=$('.bg-animation-card81');
  const appearanceIds=['bgColor','bgOpacity','bgPadding','bgRoundMode','bgRound','bgOffsetX','bgOffsetY','bgRoughness','bgSpecular'];
  const appearance=create('div','bg-common-fields91');
  const gallery=$('.bg-style-browser',bgMain);
  if(gallery){
    gallery.after(appearance);
    moveFields(appearance,appearanceIds);
    label($('span',field('bgColor')),'رنگ زمینه','Fill');
    label($('span',field('bgOpacity')),'شفافیت · %','Opacity · %');
    label($('span',field('bgPadding')),'فاصلهٔ داخلی · px','Padding · px');
    label($('span',field('bgOffsetX')),'افست X · px','X offset · px');
    label($('span',field('bgOffsetY')),'افست Y · px','Y offset · px');
    hide($('.bg-style-head',gallery));hide($('.glass-note',gallery));
  }
  for(const name of ['bgEngine','bgEngineStatus','aeGlassCheck'])hide(field(name));
  const toggles=create('div','bg-animation-switches91');
  const reflowCanvas=id('bgReflowCanvas67'),reference=reflowCanvas.closest('.reflow-reference67');
  const sample=id('bgMotionSample67');
  sample.checked=true;hide(sample.closest('label'));
  bgAnimation.prepend(reference,toggles);
  moveFields(toggles,['bgFollowTyping','bgAlwaysVisible']);
  label($('span:last-child',field('bgFollowTyping')),'رشد با تایپ','Grow while typing');
  label($('span:last-child',field('bgAlwaysVisible')),'سطح از ابتدا · 100%','Full size from start');
  cleanChildren(bgAnimation,':scope > h2, .bg-description81, .bg-advanced81');
  for(const node of all('#page-bg .numeric37'))node.dataset.numericCompact91='';
  for(const node of all('#page-bg .gradient-handle-editor'))hide(node);
  // Fold glass-only optical controls while leaving the same common settings visible.
  const glass=id('aeGlassControls');if(glass)glass.open=false;

  // Table preview and Properties remain open. Structural and per-cell controls are line disclosures.
  const table=id('page-table'),inspector=$('.vp-inspector89',table),align=id('tableAlignment48');
  const oldAlign=align.parentElement;
  $('.vp-fields89',inspector).before(align);hide(oldAlign);
  label($('strong span',align),'تراز در کامپوزیشن','Align to composition');
  hide(id('tablePreviewTime').closest('.table-timeline'));
  id('tableFollowPlayhead').checked=false;
  hide($('.vp-time89',id('tableViewport89')));
  const tableEditor=id('tableEditor');
  const cellInspector=$('.cell-inspector',table);
  const cellPanel=disclosure('تنظیمات خانه','Cell settings');cellInspector.before(cellPanel);cellPanel.append(cellInspector);
  const cellAlignPanel=disclosure('تراز متن خانه‌ها','Cell text alignment');
  const cellAlign=id('cellAlignment48');cellAlign.before(cellAlignPanel);cellAlignPanel.append(cellAlign);
  hide($(':scope > strong',cellAlign));
  const previewShell=$('.flat-preview69',table);
  if(previewShell){previewShell.open=true;hide($(':scope > summary',previewShell));}
  const aeActions=id('tableDockActions66'),aeOptions=id('tablePreviewOptions66')?.closest('details')||id('tablePreviewOptions66');
  if(aeActions){
    const hostPanel=disclosure('پیش‌نمایش AE','AE preview');
    aeActions.before(hostPanel);hostPanel.append(aeActions);
    if(aeOptions&&!aeOptions.contains(hostPanel))hostPanel.append(aeOptions);
  }
  hide($('#tableSelectedLabel',tableEditor.closest('article')));
  if(aeOptions)label($('summary',aeOptions),'تنظیمات فریم','Frame settings');
  label(tableEditor,'ویرایش خانه‌های جدول','Edit table cells','aria-label');
  for(const node of all('#page-table .numeric37'))node.dataset.numericCompact91='';

  document.addEventListener('varna:language52',()=>labels.forEach(update=>update()));
  // Deep links to a native range must reveal a real, keyboard-focusable slider.
  // Normal navigation keeps the supplied compact numeric presentation.
  const reveal91=w.VarnaUI.reveal,expandedRanges91=new Set();
  w.VarnaUI.reveal=function(target){
    if(target?.matches('input[type=range]')){
      const group=target.closest('[data-numeric-compact91]');
      if(group){group.removeAttribute('data-numeric-compact91');expandedRanges91.add(group);}
    }
    return reveal91.apply(this,arguments);
  };
  document.addEventListener('varna:page',()=>{
    for(const group of expandedRanges91)group.dataset.numericCompact91='';
    expandedRanges91.clear();
  });
  // Attribute equivalents keep contextual selectors usable in Chromium 99 CEP.
  function selectorMarks91(){
    for(const node of all('#page-table details.flat-section69'))node.toggleAttribute('data-table-editor91',!!$('#tableEditor',node));
    for(const node of all('.studio-sections87'))node.toggleAttribute('data-context-groups91',!!$('.context-groups90',node));
    const frame=id('tableFrameCard50');
    if(frame)frame.toggleAttribute('data-followed-viewport91',!!frame.nextElementSibling?.matches('.vp-grid89'));
  }
  let marksFrame91=0;
  function queueMarks91(){if(!marksFrame91)marksFrame91=requestAnimationFrame(()=>{marksFrame91=0;selectorMarks91();});}
  const context91=$('.studio-sections87');
  if(context91)new MutationObserver(queueMarks91).observe(context91,{childList:true,subtree:true});
  document.addEventListener('varna:page',queueMarks91);selectorMarks91();
})(window);
