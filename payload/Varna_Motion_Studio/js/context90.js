/* Contextual control layout for the real Varna workspaces. */
(function (w) {
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const all=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const en=()=>w.VarnaI18n52?.language()==='en';
  const tr=(fa,english)=>en()?english:fa;
  const localized=[];
  function element(tag,cls){
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    return node;
  }
  function label(node,fa,english){
    localized.push([node,fa,english]);node.textContent=tr(fa,english);return node;
  }
  function button(fa,english,click){
    const node=label(element('button','context-button90'),fa,english);
    node.type='button';node.addEventListener('click',click);return node;
  }
  function targetFor(route,group){
    const page=$('#page-'+route);
    if(!page)return null;
    return group.targets.map(selector=>$(selector,page)).find(node=>node&&!node.closest('[hidden],.hidden,[data-hidden91],[data-qp-omit87]'))||null;
  }
  function reveal(target){
    w.VarnaUI.reveal(target);
    target.scrollIntoView({block:target.matches('input,select,textarea,button')?'nearest':'start',inline:'nearest'});
    if(target.matches('input:not([type=hidden]),select,textarea,button,[tabindex]'))target.focus({preventScroll:true});
    else {
      const focusable=all('button,input:not([type=hidden]),select,textarea',target).find(node=>node.getClientRects().length&&!node.disabled);
      focusable?.focus({preventScroll:true});
    }
  }
  function renderGroups(route,container){
    const definitions=w.VarnaUISchema90[route];
    if(!definitions)return false;
    const groups=definitions.filter(group=>targetFor(route,group));
    if(!groups.length)return false;
    const row=element('div','context-groups90');
    for(const group of groups){
      const control=element('button','studio-section-link87 context-group90');
      control.type='button';control.textContent=tr(group.fa,group.en);
      control.dataset.task90=group.id;
      control.setAttribute('aria-pressed','false');
      const target=targetFor(route,group);
      if(target.id)control.setAttribute('aria-controls',target.id);
      control.onclick=()=>{
        const current=targetFor(route,group);
        if(!current)return;
        reveal(current);
        for(const sibling of row.children)sibling.setAttribute('aria-pressed',String(sibling===control));
      };
      row.append(control);
    }
    container.replaceChildren(row);
    return true;
  }
  w.VarnaContext90={renderGroups};
  // Keep the actual controls adjacent to the object they modify. Reparenting
  // preserves the original listeners, settings, and control IDs.
  const tableViewport=$('#tableViewport89'),alignment=$('#tableAlignment48');
  if(tableViewport&&alignment){
    const tray=element('div','context-align90');
    tray.append(alignment);
    const timeline=$('#tablePreviewTime')?.closest('.table-timeline');
    const footer=$('.vp-footer89',tableViewport);
    const status=$('#tableFrameStatus50');
    footer.before(tray);
    if(timeline)footer.before(timeline);
    if(status){status.setAttribute('role','status');footer.after(status);}
    alignment.querySelector('strong').replaceChildren(label(element('span'),'تراز نسبت به کامپوزیشن','Align to composition'));
    const margin=$('#tableAlignMargin48')?.closest('label');
    if(margin){margin.classList.add('context-margin90');label(margin.querySelector('span'),'حاشیه · px','Margin · px');}
    const cellAlignment=$('#cellAlignment48'),editor=$('#tableEditor');
    if(cellAlignment&&editor){
      editor.closest('.table-editor-wrap').after(cellAlignment);
      const selection=element('output','context-selection90');
      selection.setAttribute('role','status');cellAlignment.prepend(selection);
      const update=()=>{
        const info=w.VarnaTable50.selectionInfo90();
        selection.textContent=info.count>1
          ?tr(info.count+' خانه انتخاب شده',info.count+' cells selected')
          :tr('خانه '+info.row+'، '+info.column,'Cell '+info.row+', '+info.column);
      };
      document.addEventListener('varna:table-selection90',update);
      document.addEventListener('varna:language52',update);update();
      label(cellAlignment.querySelector('strong'),'تراز متن خانه‌ها','Align cell text');
      label($('#cellAlignScope48').closest('label').querySelector('span'),'اعمال به','Apply to');
      for(const option of $('#cellAlignScope48').options){
        const names={current:['خانه فعلی','Current cell'],selection:['انتخاب','Selection'],all:['همه خانه‌ها','All cells']};
        label(option,...names[option.value]);
      }
    }
  }

  // Preview view controls and media/source commands are distinct toolbar groups.
  for(const toolbar of all('.vp-toolbar89')){
    const controls=all(':scope > [data-tool90]',toolbar);
    if(!controls.length)continue;
    for(const [role,fa,english] of [['view','نمایش','View'],['source','منبع و کیفیت','Source & quality']]){
      const group=element('div','context-tools90');
      group.dataset.role90=role;group.setAttribute('role','group');
      group.setAttribute('aria-label',tr(fa,english));
      document.addEventListener('varna:language52',()=>group.setAttribute('aria-label',tr(fa,english)));
      group.append(...controls.filter(node=>node.dataset.tool90===role));
      if(group.childElementCount)toolbar.append(group);
    }
  }

  // The motion scrubber and transport form a single unit immediately below
  // the actual motion frame. Render controls remain within the same card.
  const motionScreen=$('#motionFrame')?.closest('.motion-screen'),motionScrub=$('#motionScrub');
  const transport=$('#motionPlay')?.closest('.action-inline');
  if(motionScreen&&motionScrub&&transport){
    const unit=element('div','context-motion90');
    motionScreen.after(unit);unit.append(motionScrub,transport);
    const status=$('#motionStatus');if(status)unit.append(status);
  }

  const safePreview=$('#safeMiniPreview'),safePreset=$('#safePresetSelect');
  if(safePreview&&safePreset){
    const preset=safePreset.closest('label'),card=safePreview.closest('article');
    if(preset?.closest('article')===card)preset.after(safePreview);
  }
  // Keep the keyword preview beside the selected word chips and their appearance.
  const wordChips=$('#highlightWords37'),wordPreview=$('#highlightPreview37'),wordColor=$('#highlightColor37');
  if(wordChips&&wordPreview&&wordColor){
    const group=wordColor.closest('.form-grid');
    if(group&&group.parentElement===wordPreview.parentElement)group.after(wordPreview);
  }

  // Let the selected caption lead directly to its keyword editor. Preserve
  // the existing master switch and selected caption in both directions.
  const textBar=$('.text-editor-bar80'),keywordTarget=$('#keywordsEnabled44');
  if(textBar&&keywordTarget){
    const shortcut=button('کلمات مهم','Keywords',()=>{
      w.VarnaUI.open('keywords');requestAnimationFrame(()=>reveal(keywordTarget));
    });
    shortcut.id='textKeywords90';shortcut.dataset.contextFull90='';
    textBar.append(shortcut);
    const home=button('بازگشت به متن','Back to caption',()=>{
      w.VarnaUI.open('text');requestAnimationFrame(()=>reveal($('#reviewText')));
    });
    home.dataset.contextFull90='';
    keywordTarget.closest('label').before(home);
    const sync=()=>{
      const enabled=w.GHAFState.keywordsEnabled88();
      shortcut.toggleAttribute('data-keywords-active90',enabled);
      shortcut.setAttribute('aria-label',tr('ویرایش کلمات مهم · '+(enabled?'فعال':'غیرفعال'),'Edit keywords · '+(enabled?'enabled':'disabled')));
    };
    document.addEventListener('varna:page',sync);
    keywordTarget.addEventListener('change',sync);
    document.addEventListener('varna:language52',sync);
    sync();
  }
  document.addEventListener('varna:language52',()=>{
    for(const [node,fa,english] of localized)node.textContent=tr(fa,english);
  });
  // The first route has already been rendered before this deferred adapter.
  const groups=$('.studio-sections87');
  if(groups)renderGroups(w.VarnaUI.current(),groups);
})(window);
