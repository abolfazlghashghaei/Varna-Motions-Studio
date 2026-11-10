/* Task-based sections shared by the table and the other inspectors. */
(function(w){'use strict';
const titles={font:'قلم',color:'رنگ',position:'جای‌گذاری',material:'متریال',effects:'جلوه‌ها',captions:'کپشن‌ها',edit:'ویرایش',time:'زمان‌بندی',sentences:'جمله‌بندی',correction:'اصلاح',words:'کلمه‌ها',presets:'طرح‌های آماده',custom:'ساخت موشن',entry:'ورود',exit:'خروج',preview:'پیش‌نمایش',continuous:'سطح پیوسته',stroke:'خطوط',surface:'سطح',structure:'ساختار',content:'محتوا',align:'تراز',sound:'صدا',curve:'منحنی',model:'مدل',source:'منبع'};
const icons={font:'type',color:'palette',position:'layout44',material:'layers',effects:'wand-sparkles',captions:'type',edit:'type',time:'film',sentences:'type',correction:'wand-sparkles',words:'type',presets:'layout-template',custom:'wand-sparkles',entry:'film',exit:'film',preview:'film',continuous:'layers',stroke:'table-2',surface:'layers',structure:'table-2',content:'table-2',align:'layout44',sound:'music-2',curve:'sliders-horizontal',model:'sliders-horizontal',source:'audio-lines'};
function section(page,unit){const ids=[unit,...unit.querySelectorAll('[id]')].map(el=>el.id||'').join(' '),has=pattern=>pattern.test(ids),within=s=>!!unit.closest(s),part=w.VarnaProduction47?.current().route?.part,tab=page.dataset.workflowTab;
 let key;
 if(page.id==='page-table'){
  if(has(/tableMotionSound|tableEntry/))key='sound';else if(has(/tableMotionEase|tableMotionExitDuration/))key='curve';else if(has(/tableMotionExit/))key='exit';else if(has(/tableMotionBundle|tableSurfaceEntry/))key='entry';else if(has(/tableFont|cellFont/))key='font';else if(has(/tableAlignment|tableAlign|cellAlignment|cellAlign|cellTextAlign/))key='align';else if(has(/tableX\b|tableY\b|tableCenter/))key='position';else if(has(/cell(Text|Anim|Motion|Speed|Start|Duration|Timing)/))key='time';else if(has(/cell(Fill|Ink|Stroke|Line|StyleReset)|table(Text|HeaderText|HeaderFill|ZebraFill)/))key='color';else if(has(/table(Stroke|Line|Divider)/))key='stroke';else if(has(/table(Ae|Glass|FillGlass|Liquid)/)||within('.table-glass-material,.table-corner-row'))key='material';else if(has(/table(Unified|FrameOpacity|CellOpacity|Round|Fill)/))key='surface';else if(within('#tableStyleGallery'))key='presets';else if(has(/table(Rows|Cols|Resize|Insert|Delete|RowIndex|ColIndex|Direction|Width|Height)/))key='structure';else if(has(/tableEditor|tableMerge|tableUnmerge|tableMergedHeader|tableSelectedLabel/))key='content';else key=part==='timing'?'time':part==='content'?'content':part==='look'?'surface':'structure';
 }else if(page.id==='page-text'){
  if(within('#sentence66'))key='sentences';else if(within('#offlineText55')||has(/text55/))key='correction';else if(has(/reviewText|reviewMode|globalCaptionText/))key='edit';else if(has(/captionList|captionSearch|captionCount/))key='captions';else if(has(/wordList|highlight|keyword/i))key='words';else if(has(/startTime|endTime|Range|time|Timing|Duration|Playhead|Regroup|MaxWords|maxLines|wordsPerLine|smartGroup/i))key='time';else if(has(/font|tracking|leading/i))key='font';else if(has(/posX|posY|align\b|CenterText|layout/i))key='position';else if(has(/Material|Ae|AE|Glass|Cosmic|SolidOpacity|cosmic/))key='material';else if(has(/fill|Grad|Color/i))key='color';else if(has(/stroke|glow/i))key='effects';else key=tab==='appearance'?'font':tab==='layout'?'position':'edit';
 }else if(page.id==='page-bg'){
  if(has(/Reflow67|ReflowCanvas|bgMotionSample67/))key='continuous';else if(has(/materialFrame|btnPreviewBg/))key='preview';else if(has(/bgOut/))key='exit';else if(part==='timing')key='entry';else if(has(/bgOffset|Position|inspector31/))key='position';else if(part==='geometry')key='surface';else if(part==='color')key=has(/rim|Rim|Border/)?'stroke':'color';else if(part==='optics')key=has(/ae|Ae|AE|bgGlass|bgLens|bgEdge|bgRough|bgSpec/)?'material':'effects';else if(within('.bg-style-gallery,.bg-category-tabs')||has(/bgPreset|savedBg/))key='presets';else if(within('#vendorEffectCard'))key='effects';else key='material';
 }else if(page.id==='page-motion'){
  if(within('#entrySoundCard66'))key='sound';else if(within('.workflow-preview'))key='preview';else if(has(/motionRender|motionPlay|motionScrub|motionStatus|motionCancel|motionPreview/))key='preview';else if(unit.matches('.mode-switch')||has(/motionBuilder|motionCustom|userMotion|\bmb[A-Z]/))key='custom';else if(has(/animIn|animOut|animOffset|animStrength|animSpeed|motionSync/))key='time';else if(has(/na[A-Z]/))key='custom';else if(within('.preset')||unit.matches('.preset')||has(/animIntro|animOutro|animCategory|textyle/))key='presets';else key=tab==='typing'?'edit':tab==='tools'?'effects':'presets';
 }else if(page.id==='page-kinetic'){
  if(within('.scene-preview40'))key='preview';else if(within('#scenePieces40'))key='words';else if(has(/sceneLines|sceneSplit|sceneWords|sceneGroup|scenePattern|sceneSpread/))key='content';else if(has(/sceneEntry|sceneHold|sceneReveal|sceneTiming|sceneGap/))key='entry';else if(has(/sceneX|sceneY|sceneW|sceneH/))key='position';else key='content';
 }else if(page.id==='page-templates')key='presets';else if(page.id==='page-audio')key=has(/model|Model|whisperPath|ffmpegPath|CheckTools/)?'model':'source';
 if(!key){const card=unit.closest('article.card'),title=card?.querySelector('.card-title b')?.textContent?.trim();return {key:card?.id||'main',title:title||'تنظیمات',icon:'sliders-horizontal'};}return {key,title:titles[key],icon:icons[key]};
}
class Pager{
 constructor(page,root,nav,settings={}){this.page=page;this.root=root;this.nav=nav;this.settings=settings;this.hidden=settings.hidden||'workspace-paged67';this.units=[];this.parents=new Map();this.sections=[];this.selected=0;this.index=0;this.memory=new Map();this.key='';this.busy=false;
 nav.classList.add('section-pager67');nav.innerHTML='<div class="section-tabs67" role="tablist" aria-label="دستهٔ تنظیمات"></div><div class="section-navigation67"><select aria-label="دستهٔ تنظیمات"></select><div class="section-leaves67"><button type="button" class="btn tiny" data-leaf67="previous" aria-label="صفحهٔ قبل">‹</button><output aria-live="polite"></output><button type="button" class="btn tiny" data-leaf67="next" aria-label="صفحهٔ بعد">›</button></div></div>';
 if(settings.selectId)nav.querySelector('select').id=settings.selectId;if(settings.previousId)nav.querySelector('[data-leaf67=previous]').id=settings.previousId;if(settings.nextId)nav.querySelector('[data-leaf67=next]').id=settings.nextId;
 nav.querySelector('.section-tabs67').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=Array.from(nav.querySelectorAll('[role=tab]')),i=tabs.indexOf(e.target);if(i<0)return;e.preventDefault();const rtl=getComputedStyle(nav).direction==='rtl',delta=(e.key==='ArrowRight'?1:-1)*(rtl?-1:1),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+delta+tabs.length)%tabs.length;this.select(next);tabs[next].focus();});
 nav.querySelector('select').onchange=e=>this.select(+e.target.value);nav.querySelector('[data-leaf67=previous]').onclick=()=>this.show(this.index-1);nav.querySelector('[data-leaf67=next]').onclick=()=>this.show(this.index+1);
 }
 visible(el){return !!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';}
 clear(){this.root.style.zoom='1';this.root.querySelectorAll('.'+this.hidden).forEach(el=>el.classList.remove(this.hidden));}
 collect(node,limit){if(!this.visible(node)||node===this.nav||node.matches('.page-head,.workflow-tabs,.studio40-tabs,.section-divider,summary,.card-title,.inspector-head,.section-pager67,#brandCommit47,#sceneCommit67'))return;
 const collections='#captionList,#wordList,#sceneStage40,.word-chips48,.table-editor-wrap,.font31-results,.embedded-tool-host,.gradient-mini,.motion-screen,.motion-showcase';const compound='.control,.switch-row,.check,.chip,.preset,.bg-style-card,.table-style-card,.native-style50,.action-inline,.button-row,.chip-grid,.mode-switch,details:not([open])';
 if(node.matches(collections)||node.matches(compound)&&node.getBoundingClientRect().height<=limit||node.matches('input:not([type=hidden]):not([data-numeric-aux]),select,textarea,button,iframe,video,audio,canvas,img,output,[role=status]')){this.units.push(node);return;}
 const before=this.units.length;for(const child of node.children)this.collect(child,limit);
 // Explanatory text belongs to a section too; otherwise orphan cards stay visible on every page.
 if(this.units.length===before&&node.textContent.trim()&&!node.matches('script,style,option'))this.units.push(node);
 }
 apply(items){const chosen=new Set(items);for(const el of this.units)el.classList.toggle(this.hidden,!chosen.has(el));for(const [p,children]of this.parents)p.classList.toggle(this.hidden,!children.some(el=>chosen.has(el)));}
 refresh(target){
  if(this.busy)return;this.busy=true;
  try{
   this.clear();const workspace=document.querySelector('#workspace');workspace.scrollTop=0;
   this.units=[];this.parents=new Map();
   const initialSpace=Math.max(100,workspace.getBoundingClientRect().bottom-this.root.getBoundingClientRect().top-18);
   this.collect(this.root,Math.max(55,initialSpace-150));
   for(const el of this.units)for(let p=el.parentElement;p&&p!==this.root;p=p.parentElement){if(!this.parents.has(p))this.parents.set(p,[]);this.parents.get(p).push(el);}
   const sections=new Map();
   for(const unit of this.units){const group=section(this.page,unit);if(!sections.has(group.key))sections.set(group.key,{...group,units:[],pages:[]});sections.get(group.key).units.push(unit);}
   this.sections=Array.from(sections.values());
   if(!this.sections.length)this.sections=[{key:'empty',title:'تنظیمات',icon:'sliders-horizontal',units:[],pages:[]}];
   // Render navigation first: its final height is part of the available panel space.
   const tabs=this.nav.querySelector('.section-tabs67'),select=this.nav.querySelector('select');tabs.replaceChildren();select.replaceChildren();
   this.sections.forEach((g,i)=>{
    const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.dataset.section67=g.key;
    const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.innerHTML=w.VarnaIcons30?.[g.icon]||'';
    const label=document.createElement('span');label.textContent=g.title;b.append(icon,label);b.onclick=()=>this.select(i);tabs.append(b);
    const option=document.createElement('option');option.value=i;option.textContent=g.title;select.append(option);
   });
   // Reserve the leaf navigation before packing so adding a second page cannot overflow.
   this.nav.querySelector('.section-leaves67').hidden=false;
   const available=Math.max(70,workspace.getBoundingClientRect().bottom-this.root.getBoundingClientRect().top-18);
   for(const group of this.sections){
    // Previous sections hide other units. Reveal this section before measuring its rows.
    this.apply(group.units);
    const rows=[];
    for(const unit of group.units){const top=unit.getBoundingClientRect().top,last=rows[rows.length-1];if(last&&Math.abs(last.top-top)<3)last.items.push(unit);else rows.push({top,items:[unit]});}
    let current=[];
    for(const row of rows){
     this.apply(current.concat(row.items));
     if(current.length&&this.root.getBoundingClientRect().height>available){group.pages.push(current);current=row.items.slice();}
     else current.push(...row.items);
    }
    if(current.length)group.pages.push(current);if(!group.pages.length)group.pages=[[]];
   }
   const route=w.VarnaProduction47.current();this.key=[this.page.id,route.flow,route.index,route.sub,this.page.dataset.workflowTab||''].join(':');
   const saved=this.memory.get(this.key),anchor=target&&this.root.contains(target)?target:saved?.anchor?document.getElementById(saved.anchor):null;
   let sectionIndex=saved?this.sections.findIndex(s=>s.key===saved.section):-1,pageIndex=saved?.page||0;
   if(sectionIndex<0){const preferred=this.page.id==='page-audio'&&route.route?.part==='model'?'model':this.page.id==='page-motion'&&this.page.dataset.workflowTab==='motion'?'presets':this.page.id==='page-table'&&route.route?.part==='look'?'surface':null;if(preferred)sectionIndex=this.sections.findIndex(s=>s.key===preferred);}
   if(anchor)for(const [i,g]of this.sections.entries()){const index=g.pages.findIndex(items=>items.some(el=>el===anchor||el.contains(anchor)));if(index>=0){sectionIndex=i;pageIndex=index;break;}}
   this.selected=Math.max(0,sectionIndex);this.show(pageIndex,anchor);
  }finally{this.busy=false;}
 }

 select(index){this.selected=Math.max(0,Math.min(this.sections.length-1,index));this.show(0);}
 show(index,anchor){const group=this.sections[this.selected];if(!group)return;this.index=Math.max(0,Math.min(group.pages.length-1,index));const items=group.pages[this.index]||[];this.apply(items);this.nav.querySelector('select').value=this.selected;this.nav.querySelectorAll('[role=tab]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===this.selected));b.tabIndex=i===this.selected?0:-1;});const leaves=this.nav.querySelector('.section-leaves67');leaves.hidden=group.pages.length<2;leaves.querySelector('output').textContent=(this.index+1)+' / '+group.pages.length;leaves.querySelector('[data-leaf67=previous]').disabled=this.index===0;leaves.querySelector('[data-leaf67=next]').disabled=this.index>=group.pages.length-1;
 const first=items[0];this.memory.set(this.key,{section:group.key,page:this.index,anchor:anchor?.id||first?.id||first?.querySelector('[id]')?.id||''});document.querySelector('#workspace').scrollTop=0;document.dispatchEvent(new Event('varna:workspacepage67'));
 }
 count(){return this.sections[this.selected]?.pages.length||0;}
}
w.VarnaPager67=Pager;
})(window);
