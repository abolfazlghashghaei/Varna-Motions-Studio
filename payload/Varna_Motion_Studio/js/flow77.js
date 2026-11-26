/* UI77 presentation adapter. The original state, controls and host handlers own all work.
   The supplied standalone prototype is a design reference, never an execution engine. */
(function (w) {
  'use strict';
  if (!document.documentElement.hasAttribute('data-ui77')) return;
  const $ = (s, root = document) => root.querySelector(s);
  const all = (s, root = document) => Array.from(root.querySelectorAll(s));
  const shell = $('.app-shell'), nav = $('.flat-nav69'), chooser = $('.flat-chooser69');
  const actions = $('.flat-actions69'), workspace = $('#workspace');
  if (!shell || !nav || !chooser || !actions || !w.VarnaUI) return;
  document.body.dataset.flowShell77 = 'true';
  const en = () => w.VarnaI18n52?.language() === 'en';
  const text = (fa, english) => en() ? english : fa;
  const pages = {
    home: ['فضای کار', 'Workspace', 'house', 'ابزارهای تدوین و موشن', 'Editing and motion tools', null],
    audio: ['ساخت زیرنویس', 'Create captions', 'audio-lines', 'صدا یا لایه‌های متن را به کپشن‌های قابل ویرایش تبدیل کن.', 'Turn audio or text layers into editable captions.', 'btnTranscribe'],
    text: ['ویرایش متن', 'Edit text', 'type', 'متن و زمان را ویرایش کن؛ اصلاح آفلاین کنار متن در دسترس است.', 'Edit text and timing, with optional offline spelling beside the text.', 'btnRefreshPreview'],
    motion: ['موشن', 'Motion', 'wand-sparkles', 'حرکت ورود، خروج و نوشتن متن را تنظیم کن.', 'Set text entrance, exit and typing motion.', 'motionApply'],
    kinetic: ['تایپوگرافی', 'Typography', 'kinetic44', 'ظاهر و حرکت هر عبارت یا کلمه را جدا تنظیم کن.', 'Design the appearance and motion of each phrase or word.', null],
    templates: ['استایل‌ها', 'Styles', 'layout-template', 'یک استایل انتخاب کن و روی متن خودت اعمال کن.', 'Choose a style and apply it to your own text.', 'templateBuild45'],
    bg: ['پس‌زمینه', 'Background', 'layers', 'رنگ، شیشه و حرکت کادر پشت متن را تنظیم کن.', 'Design the color, glass and motion behind your text.', 'btnPreviewBg'],
    table: ['جدول', 'Table', 'table-2', 'ساختار، متن، ظاهر و حرکت خانه‌ها را تنظیم کن.', 'Set the table structure, cell text, appearance and motion.', null],
    sfx: ['افکت صوتی', 'Sound effects', 'sound-effect', 'صداهای کتابخانه‌ات را برای لحظه‌های مناسب انتخاب کن.', 'Choose sounds from your library for the right moments.', 'btnAnalyzeSfx'],
    music: ['ساخت صدا', 'Generate audio', 'music-2', 'موسیقی بی‌کلام یا صدای محیط را برای بازه‌های مشخص بساز.', 'Generate instrumental music or ambience for specific time ranges.', 'cueGenerate50'],
    brand: ['برند', 'Brand', 'palette', 'فونت، رنگ، موشن و فایل‌های همیشگی یک برند را نگه دار.', 'Keep a brand’s fonts, colors, motion and reusable assets together.', 'brandApply'],
    safe: ['محدودهٔ امن', 'Safe area', 'scan', 'جای متن را با قاب و رابط پلتفرم مقصد هماهنگ کن.', 'Keep text clear of the destination platform’s interface.', 'btnApplySafe'],
    ai: ['اصلاح هوشمند', 'Smart correction', 'check', 'پیشنهادهای مدل و حافظهٔ اصلاح را ببین و خودت تأیید کن.', 'Review model and correction-memory suggestions before accepting.', 'btnAiAll'],
    keywords: ['کلمات مهم', 'Keywords', 'highlighter44', 'کلمات کلیدی را انتخاب کن و ظاهرشان را متمایز کن.', 'Choose key words and give them a distinct appearance.', 'suggestAllHighlight37'],
    translate: ['ترجمه', 'Translation', 'languages', 'ترجمه را کنار متن اصلی بررسی و تأیید کن.', 'Review and accept translations beside the original text.', 'btnTranslateAll'],
    easing49: ['منحنی حرکت', 'Motion curves', 'easing-curve', 'شتاب حرکت را تنظیم و به کلیدهای انتخاب‌شده اعمال کن.', 'Adjust easing and apply it to the selected keyframes.', 'curveApply49'],
    director: ['دستیار پروژه', 'Project assistant', 'clapperboard', 'شرح پروژه را بده و پیشنهادهای طراحی را پیش از اعمال ببین.', 'Describe the project and review design suggestions before applying.', 'brainAnalyze'],
    assistant49: ['دستیار اسکریپت', 'Script assistant', 'code', 'کد پیشنهادی را بررسی کن؛ اجرای آن مرحله‌ای جداست.', 'Review generated code; running it is a separate action.', 'assistantGenerate49'],
    tools: ['ابزارهای افزوده', 'Additional tools', 'tool-grid', 'ابزار نصب‌شده را انتخاب کن تا کنترل‌های واقعی آن باز شود.', 'Choose an installed tool to open its actual controls.', null],
    resources: ['منابع سیستم', 'System resources', 'system-activity', 'مسیر موتور و مدل‌ها و مصرف منابع را بررسی کن.', 'Check engine and model paths and resource use.', 'btnCheckLocalRoles'],
    output: ['خروجی', 'Output', 'upload', 'لایه‌های متن را در افتر بساز یا فایل زیرنویس ذخیره کن.', 'Build text layers in After Effects or save a subtitle file.', 'btnBuildOutput'],
    settings: ['تنظیمات', 'Settings', 'sliders-horizontal', 'ظاهر رابط، اتصال میزبان و پروفایل‌های تنظیمات را مدیریت کن.', 'Manage interface appearance, host connection and settings profiles.', null]
  };
  delete pages.director;
  delete pages.assistant49;
  // Profile60 omits the music engine scripts and removes their page on DOM ready.
  // Do not introduce a new shortcut or a dead primary action for that profile.
  if (w.VARNA_ENGINE_ENABLED === false) delete pages.music;
  function element(tag, cls, value) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value != null) node.textContent = value;
    return node;
  }
  function label(node, fa, english) {
    node.dataset.fa77 = fa; node.dataset.en77 = english;
    node.textContent = text(fa, english); return node;
  }
  const iconPaths = {
    'sound-effect': 'M3 9h4l5-4v14l-5-4H3z M16 9c2 1.5 2 4.5 0 6 M19 6c4 3 4 9 0 12',
    languages: 'M3 5h12 M9 3v2 M5 8c1 3 4 5 7 6 M13 5c-1 4-5 8-9 10 M14 21l4-10 4 10 M15.5 18h5',
    'easing-curve': 'M3 4v17h18 M5 17c3 0 5-1 7-5s4-6 8-6',
    code: 'm8 6-6 6 6 6m8-12 6 6-6 6 M14 4l-4 16',
    'tool-grid': 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    'system-activity': 'M3 6h18v12H3z M5 12h3l2-3 3 6 2-3h4',
    'chevron-up': 'm6 15 6-6 6 6',
    'chevron-down': 'm6 9 6 6 6-6',
    'quick-project': 'M14 2 4 14h7l-1 8 10-12h-7z',
    'undo-edit': 'm9 5-5 5 5 5 M4 10h10a5 5 0 0 1 0 10h-2'
  };
  function icon(name) {
    const node = element('span', 'flow-icon77'); node.setAttribute('aria-hidden', 'true');
    const path = iconPaths[name];
    node.innerHTML = path ? '<svg viewBox="0 0 24 24"><path d="' + path + '"/></svg>' :
      w.VarnaIcons30?.[name] || '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    return node;
  }
  function button(fa, english, glyph, handler, cls = 'flow-button77') {
    const node = element('button', cls); node.type = 'button';
    if (glyph) node.append(icon(glyph));
    node.append(label(element('span'), fa, english)); node.onclick = handler;
    return node;
  }
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem('VARNA_FLOW77') || '{}');
      return {
        pins: Array.isArray(value.pins) ? [...new Set(value.pins.filter(x => Object.hasOwnProperty.call(pages, x) && x !== 'home'))].slice(0, 8) : ['audio', 'text', 'motion', 'bg', 'table'],
        side: value.side,
        dock: value.dock === 'bottom' ? 'bottom' : 'top',
        collapsed: value.collapsed === true,
        blur: Number.isFinite(value.blur) ? Math.max(0, Math.min(16, value.blur)) : 0
      };
    } catch (_) { return {pins: ['audio', 'text', 'motion', 'bg', 'table'], dock: 'top', collapsed: false, blur: 0}; }
  }
  const prefs = read();
  function save() { try { localStorage.setItem('VARNA_FLOW77', JSON.stringify(prefs)); } catch (_) { /* In-memory controls still work when storage is unavailable. */ } }

  // Flatten presentation only. Conditional model/effect states and all original IDs stay intact.
  // Existing pagers consult data-flat69; they keep their controllers but stop hiding controls.
  for (const [name, info] of Object.entries(pages)) {
    const page = $('#page-' + name); if (!page) continue;
    page.dataset.flow77 = 'true'; page.dataset.flat69 = 'true';
    all('.production-hidden47,.workspace-paged67,.table-paged-out66', page).forEach(n => n.classList.remove('production-hidden47', 'workspace-paged67', 'table-paged-out66'));
    if (!['table', 'kinetic'].includes(name)) {
      all('.workflow-tab-hidden', page).forEach(n => n.classList.remove('workflow-tab-hidden'));
      const intro = label(element('p', 'flat-intro69'), info[3], info[4]); page.prepend(intro);
      const cards = all('article.card,section.card', page).filter(n => !n.parentElement.closest('.card'));
      const primaryCard = info[5] && document.getElementById(info[5])?.closest('article.card,section.card');
      for (const [i, card] of cards.entries()) {
        const title = card.querySelector('.card-title b')?.textContent.trim() || text('تنظیمات', 'Settings');
        const details = element('details', 'flat-section69 flow-section77'), summary = element('summary');
        summary.append(icon(info[2]), element('span', '', title));
        details.open = card === primaryCard || (!primaryCard && i === 0);
        card.before(details); details.append(summary, card);
        card.dataset.flowCard77 = 'true';
        // A hidden conditional tool must not leave an empty, clickable heading.
        const visibility = () => { details.hidden = card.hidden; };
        new MutationObserver(visibility).observe(card, {attributes: true, attributeFilter: ['hidden']}); visibility();
      }
    }
  }

  // UI78: match the reference's focus panels. Main work stays visible together;
  // only secondary tools share one disclosure. Original control nodes and card
  // ancestry are retained, including handlers that resolve their closest card.
  const essential78 = {
    audio:['transcriptionSource','language'], text:['captionCount','reviewText','wordList','textFontCard'],
    motion:['animScope','animSimple'], templates:['templateLibrary38','nativeStyles50'],
    bg:['bgScope'], table:['tableRows','tableEditor','tableFontPS66'],
    kinetic:['sceneLines40','scenePieces40','sceneScope40','wordPresets39','wordScope39'],
    sfx:['sfxCompName','sfxLibraryPath','sfxSuggestionList'], music:['audioStudio50'],
    brand:['brandList','brandName','brandAssetsCard'], safe:['safePresetSelect','safeOverlayColor'],
    ai:['aiPreset','pendingList'], keywords:['captionHighlight37'],
    translate:['translateTarget','translatePendingList','translateOriginal'],
    easing49:['curveEditor49','shapeMotion50'], director:['brainBrief','brainPlan'],
    assistant49:['assistantPrompt49'], resources:['resourceProfile'],
    output:['outputMode'], settings:['appearance50','hostDiagnosticStatus']
  };
  const advanced78 = new Map();
  for (const [name, ids] of Object.entries(essential78)) {
    const page = $('#page-' + name); if (!page) continue;
    page.dataset.focus78 = 'true';
    const sections = all('details.flat-section69', page).filter(d => !d.closest('.flat-preview69') && !d.parentElement.closest('details.flat-section69'));
    const advanced = element('details', 'flow-advanced78');
    advanced.append(label(element('summary'), 'تنظیمات پیشرفته و ابزارهای بیشتر', 'Advanced settings & more tools'));
    advanced78.set(page, advanced);
    for (const d of sections) {
      const main = ids.some(id => {const n = document.getElementById(id); return n && d.contains(n);});
      const compactTable=name==='table'&&!d.contains($('#tableEditor'));
      d.open = !compactTable; d.dataset.focusPanel78 = main ? 'main' : 'secondary';
      // Keep a semantic section heading, without a redundant expand/collapse row.
      const summary = d.querySelector(':scope>summary');
      if (compactTable) continue;
      summary.setAttribute('role', 'heading'); summary.setAttribute('aria-level', '2');
      summary.addEventListener('click', event => event.preventDefault());
      summary.addEventListener('keydown', event => {if(event.key==='Enter'||event.key===' ')event.preventDefault();});
      summary.tabIndex = -1;
      if (!main) advanced.append(d);
      d.addEventListener('toggle', () => {if(!d.open)d.open=true;});
    }
    if (advanced.childElementCount > 1) page.append(advanced);
  }
  // Per-cell font and color are core editing controls, not hidden expert options.
  const cellLook78 = $('#cellFontPS')?.closest('details');
  if (cellLook78) {cellLook78.open=true;cellLook78.dataset.focusPanel78='main';const s=cellLook78.querySelector('summary');s.setAttribute('role','heading');s.tabIndex=-1;s.addEventListener('click',event=>event.preventDefault());}
  // Keep technical shader controls separate while preserving their label/grid ancestry.
  const tableAppearance78 = $('#tableFontPS66')?.closest('article.card');
  if (tableAppearance78) {
    const technical = all('details.advanced-panel', tableAppearance78);
    technical.forEach(d=>d.open=false);
  }

  // Split the large table inspector into a useful everyday strip and one expert
  // group, following the reference. Every label keeps its live input children,
  // and remains inside the same original card for delegated/native handlers.
  if (tableAppearance78) {
    const expert=element('details','flow-table-expert78');
    expert.append(label(element('summary'),'زمان‌بندی دقیق، جای‌گذاری و متریال','Precise timing, placement & material'));
    const quick=element('div','form-grid two flow-table-quick78');
    const controls=['tableFontPS66','tableFont','tableFill','tableText','tableStroke','tableRoundness','tableTimingPreset','tableMotion','tableAnimDuration'];
    const labels=[...new Set(controls.map(id=>document.getElementById(id)?.closest('label.control')).filter(Boolean))];
    const title=tableAppearance78.querySelector(':scope>.card-title');
    for(const n of Array.from(tableAppearance78.children))if(n!==title)expert.append(n);
    for(const n of labels)quick.append(n);
    tableAppearance78.append(quick,expert);
  }
  // Start typography with the authored text and word selection. Layout tuning
  // follows the content rather than pushing the editor below a long form.
  const sceneSettings78=$('#sceneLines40')?.closest('.scene-settings40');
  if(sceneSettings78){const text=$('#sceneLines40').closest('details.flat-section69'),words=$('#scenePieces40').closest('details.flat-section69');sceneSettings78.prepend(text,words);}
  const timeGuide78=$('#startRange')?.closest('.time-guide');
  if(timeGuide78){const d=element('details','flow-time-guide78');d.append(label(element('summary'),'تنظیم زمان با کشیدن دستگیره‌ها','Adjust timing with draggable handles'));timeGuide78.before(d);d.append(timeGuide78);}
  const structureActions78=$('#tableResize')?.parentElement;
  if(structureActions78){const advanced=element('details','flow-table-rows78');advanced.append(label(element('summary'),'افزودن و حذف ردیف یا ستون','Insert or remove rows & columns'));const buttons=element('div','action-inline');for(const n of Array.from(structureActions78.children))if(n.id!=='tableResize')buttons.append(n);advanced.append(buttons);structureActions78.after(advanced);}
  const heading = $('#currentPageTitle');
  heading.tabIndex = -1;
  heading.setAttribute('role', 'heading');
  heading.setAttribute('aria-level', '1');
  function openWorkspace(name) {
    w.VarnaUI.open(name);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (w.VarnaUI.current() === name) (heading.getClientRects().length ? heading : workspace).focus({preventScroll: true});
    }));
  }

  // Reuse the existing page navigator and its accessible dialog on every page.
  const navigationButtons = new Map(all('[data-page69]', nav).map(n => [n.dataset.page69, n]));
  for (const [name, info] of Object.entries(pages)) {
    if (name === 'home' || navigationButtons.has(name)) continue;
    const b = button(info[0], info[1], info[2], () => w.VarnaUI.open(name));
    b.dataset.page69 = name; navigationButtons.set(name, b); nav.append(b);
  }
  const railNames79={
    home:['خانه','Home'],audio:['زیرنویس','Captions'],text:['متن','Text'],motion:['موشن','Motion'],
    kinetic:['کلمه‌ها','Words'],templates:['استایل','Styles'],bg:['زمینه','Backdrop'],table:['جدول','Table'],
    sfx:['افکت صدا','SFX'],music:['صدا','Audio'],brand:['برند','Brand'],safe:['قاب امن','Safe area'],
    ai:['اصلاح','Correct'],keywords:['کلمات','Keywords'],translate:['ترجمه','Translate'],easing49:['منحنی','Curves'],
    director:['پروژه','Project'],assistant49:['اسکریپت','Script'],tools:['ابزارها','Tools'],resources:['سیستم','System'],
    output:['خروجی','Output'],settings:['تنظیمات','Settings']
  };
  const more = $('[data-more69]', nav), logo = element('button', 'flow-logo77'); logo.type = 'button';
  logo.dataset.flowLogo77 = 'true'; logo.title = 'Varna Motion Studio'; logo.setAttribute('aria-label', 'Varna Motion Studio');
  const wordmark = element('span', 'studio-wordmark', 'VARNA');
  wordmark.dir = 'ltr'; logo.append(wordmark); logo.onclick = () => openWorkspace('home');
  $('.topbar').prepend(logo);
  const moreLabel79=$('.flat-nav-label69',more);moreLabel79.removeAttribute('data-label-fa69');moreLabel79.removeAttribute('data-label-en69');label(moreLabel79,'ابزارها','Tools');
  const customize = button('میانبرهای من', 'My shortcuts', 'star', () => openCatalog(true), 'flow-dock-option77');
  customize.dataset.customize77 = 'true';
  const collapse = button('نمایش نام ابزارها', 'Show tab names', 'layout-template', () => { prefs.collapsed = !prefs.collapsed; save(); renderDock(); }, 'flow-dock-option77');
  collapse.dataset.collapse77 = 'true'; nav.append(customize, collapse);
  function attr(node, name, value) { value=String(value); if(node.getAttribute(name)!==value)node.setAttribute(name,value); }
  let dockKey78='', railFrame79=0;
  function fitRail79() {
    railFrame79 = 0;
    const unit = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const enough = shell.clientWidth >= Math.max(510, (prefs.pins.length + 3) * 5.25 * unit);
    attr(shell, 'data-rail-mode79', !prefs.collapsed && enough ? 'labels' : 'icons');
  }
  function queueRail79(){if(!railFrame79)railFrame79=requestAnimationFrame(()=>fitRail79());}
  new ResizeObserver(queueRail79).observe(nav);
  new ResizeObserver(queueRail79).observe(shell);
  document.fonts?.ready.then(()=>fitRail79(true));
  function renderDock() {
    const key=JSON.stringify([prefs.pins,prefs.dock,prefs.collapsed,en(),w.VarnaUI.current()]);
    if(key===dockKey78)return; dockKey78=key;
    attr(shell,'data-dock86',prefs.dock); attr(shell,'data-dock-collapsed77',prefs.collapsed);
    if (nav.dataset.placement86 !== prefs.dock) {
      if (prefs.dock === 'top') workspace.before(nav); else shell.append(nav);
      nav.dataset.placement86 = prefs.dock;
    }
    const language = en() ? 'en' : 'fa';
    nav.lang = language; nav.dir = en() ? 'ltr' : 'rtl'; chooser.lang = language;
    attr(nav,'aria-label',text('میانبرهای فضای کار','Workspace shortcuts'));
    attr(more,'title',text('همهٔ ابزارها','All tools'));attr(more,'aria-label',more.title);
    attr(logo,'aria-label',text('خانهٔ وارنا موشن استودیو','Varna Motion Studio home'));
    attr(customize,'title',text('چیدمان و میانبرهای من','Arrange my shortcuts'));attr(customize,'aria-label',customize.title);
    attr(collapse, 'aria-pressed', !prefs.collapsed);
    collapse.title = text('نمایش نام ابزارها', 'Show tab names');
    attr(collapse, 'aria-label', collapse.title);
    const current = w.VarnaUI.current();
    for (const [name, b] of navigationButtons) {
      const info = pages[name], pinned = name === 'home' || prefs.pins.includes(name);
      b.hidden = !pinned; b.dataset.pinned77 = String(pinned);
      b.title = text(info[0], info[1]); b.setAttribute('aria-label', b.title);
      b.setAttribute('aria-current', name === current ? 'page' : 'false');
      if (!b.dataset.icon77) {
        b.replaceChildren(icon(info[2]), label(element('span', 'flat-nav-label69'), ...railNames79[name])); b.dataset.icon77 = 'true';
      }
    }
    for (const b of all('[data-destination69]', chooser)) {
      attr(b, 'aria-current', b.dataset.destination69 === current ? 'page' : 'false');
    }
    // Reorder only after a preference change. Moving focused buttons on every click
    // would discard keyboard focus in Chromium 99.
    const orderKey = prefs.pins.join('|');
    if (nav.dataset.order77 !== orderKey) {
      for (const name of ['home', ...prefs.pins]) if (navigationButtons.has(name)) nav.append(navigationButtons.get(name));
      nav.append(more, customize, collapse); nav.dataset.order77 = orderKey;
    }
    queueRail79();
    for (const b of all('[data-pin77]')) {
      const selected = prefs.pins.includes(b.dataset.pin77); b.setAttribute('aria-pressed', String(selected));
      b.title = selected ? text('حذف از میانبرها', 'Unpin shortcut') : text('افزودن به میانبرها', 'Pin shortcut'); b.setAttribute('aria-label', b.title + ': ' + text(...pages[b.dataset.pin77].slice(0, 2)));
    }
  }
  function togglePin(name) {
    if (prefs.pins.includes(name)) prefs.pins = prefs.pins.filter(p => p !== name);
    else if (prefs.pins.length < 8) prefs.pins.push(name);
    else { catalogNotice.textContent = text('حداکثر ۸ میانبر؛ ابتدا یکی را بردار.', 'Up to 8 shortcuts; remove one first.'); return; }
    save(); renderDock(); renderOrder();
  }

  const oldClose = chooser.firstElementChild, catalogHead = element('header', 'flow-catalog-head77');
  const catalogTitle = label(element('h2'), 'همهٔ ابزارها', 'All tools'); oldClose.classList.add('flow-catalog-close77');
  catalogTitle.id = 'tool-catalog-title';
  chooser.removeAttribute('aria-label'); chooser.setAttribute('aria-labelledby', catalogTitle.id);
  chooser.prepend(catalogHead); catalogHead.append(catalogTitle, oldClose);
  const catalogNotice = element('p', 'hint'); catalogNotice.setAttribute('role', 'status');
  const catalogSearch = element('input'); catalogSearch.type = 'search'; catalogSearch.dataset.catalogSearch77 = 'true';
  const catalogGrid = $('.flat-chooser-grid69', chooser);
  chooser.insertBefore(catalogSearch, catalogGrid); chooser.append(catalogNotice);
  const catalogEmpty = label(element('p', 'catalog-empty'), 'ابزاری پیدا نشد. نام دیگری بنویس یا جست‌وجو را پاک کن.', 'No tools found. Try another name or clear the search.');
  catalogEmpty.setAttribute('role', 'status'); catalogEmpty.hidden = true; catalogGrid.after(catalogEmpty);
  const config = element('details', 'flow-dock-config77');
  config.append(label(element('summary'), 'چیدمان میانبرهای من', 'Arrange my shortcuts'));
  const sides = element('div', 'flow-button-row77');
  for (const [dock, fa, english] of [['top','نوار بالا','Top navigation'],['bottom','نوار پایین','Bottom navigation']]) {
    const b = button(fa, english, null, () => { prefs.dock = dock; save(); renderDock(); renderOrder(); });
    b.dataset.dockPosition = dock; sides.append(b);
  }
  const order = element('div', 'flow-dock-order77');
  const resetDock = button('بازگشت به چیدمان اصلی', 'Reset shortcut layout', null, () => {
    prefs.pins = ['audio', 'text', 'motion', 'bg', 'table']; prefs.dock = 'top'; prefs.collapsed = false;
    save(); renderDock(); renderOrder();
  }); resetDock.dataset.resetDock77 = 'true';
  config.append(sides, resetDock, order); catalogSearch.after(config);
  let draggedPin = '';
  function renderOrder(focusName, focusDelta) {
    order.replaceChildren();
    for (const [i, name] of prefs.pins.entries()) {
      const row = element('div', 'flow-order-row77'); row.draggable = true; row.dataset.pinRow77 = name;
      row.append(element('span', '', text(pages[name][0], pages[name][1])));
      row.ondragstart = event => { draggedPin = name; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', name); };
      row.ondragover = event => { if (draggedPin && draggedPin !== name) event.preventDefault(); };
      row.ondrop = event => {
        event.preventDefault(); const from = prefs.pins.indexOf(draggedPin), to = prefs.pins.indexOf(name); draggedPin = '';
        if (from < 0 || to < 0 || from === to) return;
        prefs.pins.splice(to, 0, prefs.pins.splice(from, 1)[0]); save(); renderDock(); renderOrder();
      };
      row.ondragend = () => { draggedPin = ''; };
      for (const delta of [-1, 1]) {
        const b = button(delta < 0 ? 'بالاتر' : 'پایین‌تر', delta < 0 ? 'Move up' : 'Move down', null, () => {
          const next = i + delta; if (next < 0 || next >= prefs.pins.length) return;
          [prefs.pins[i], prefs.pins[next]] = [prefs.pins[next], prefs.pins[i]]; save(); renderDock(); renderOrder(name, delta);
        });
        b.dataset.moveShortcut = delta;
        b.disabled = i + delta < 0 || i + delta >= prefs.pins.length; row.append(b);
      }
      row.append(button('برداشتن', 'Remove', null, () => togglePin(name))); order.append(row);
    }
    for (const b of all('[data-dock-position]', config)) b.setAttribute('aria-pressed', String(b.dataset.dockPosition === prefs.dock));
    if (focusName) {
      const row = all('[data-pin-row77]', order).find(item => item.dataset.pinRow77 === focusName);
      (row?.querySelector('[data-move-shortcut="' + focusDelta + '"]:enabled') || row?.querySelector('button:enabled') || $('summary', config)).focus();
    }
  }
  const catalogButtons = new Map(all('[data-destination69]', chooser).map(b => [b.dataset.destination69, b]));
  catalogGrid.replaceChildren();
  const workspaceGroups = [
    ['متن و زبان', 'Text & language', ['audio', 'text', 'keywords', 'ai', 'translate']],
    ['تصویر و حرکت', 'Image & motion', ['motion', 'kinetic', 'templates', 'bg', 'table', 'safe', 'easing49']],
    ['صدا', 'Audio', ['sfx', 'music']],
    ['پروژه و سیستم', 'Project & system', ['output', 'brand', 'tools', 'resources', 'settings']]
  ];
  const catalogGroups = [['فضای کار','Workspace',['home']], ...workspaceGroups].map(([fa, english, names]) => {
    const section = element('section', 'catalog-group');
    const groupGrid = element('div', 'catalog-group-grid');
    section.append(label(element('h3'), fa, english), groupGrid); catalogGrid.append(section);
    const rows = names.filter(name => pages[name] && catalogButtons.has(name)).map(name => {
      const info = pages[name], b = catalogButtons.get(name);
      const row = element('div', 'flow-catalog-row77'); groupGrid.append(row); row.append(b);
      // The older localizer changes the entire node's textContent.
      delete b.dataset.labelFa69;
      delete b.dataset.labelEn69;
      b.replaceChildren(icon(info[2]), label(element('span'), info[0], info[1])); b.classList.add('flow-catalog-link77');
      b.onclick = () => { chooser.close('navigate'); openWorkspace(name); };
      if (name !== 'home') {
        const pin = button('میانبر', 'Pin', 'star', () => togglePin(name), 'flow-pin77');
        pin.dataset.pin77 = name; row.append(pin);
      }
      return {row, name};
    });
    return {section, rows};
  });
  const normalizeSearch = value => value.toLocaleLowerCase().normalize('NFKC')
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064b-\u065f]/g, '').replace(/[\s\u200c\u200d\u0640]+/g, '');
  catalogSearch.oninput = () => {
    const query = normalizeSearch(catalogSearch.value);
    let matches = 0;
    for (const {section, rows} of catalogGroups) {
      let groupMatches = 0;
      for (const {row, name} of rows) {
        const aliases = name === 'bg' ? ['بک‌گراند', 'زمینه'] : [];
        row.hidden = ![name, ...pages[name].slice(0, 2), ...aliases].some(value => normalizeSearch(value).includes(query));
        if (!row.hidden) groupMatches++;
      }
      section.hidden = !groupMatches;
      matches += groupMatches;
    }
    catalogEmpty.hidden = Boolean(matches);
  };
  workspace.tabIndex = -1;
  let catalogOpener;
  function openCatalog(arrange = false, opener = document.activeElement) {
    catalogNotice.textContent = ''; config.open = arrange; catalogSearch.value = ''; catalogSearch.oninput(); renderOrder();
    if (!chooser.open) { catalogOpener = opener; chooser.returnValue = ''; chooser.showModal(); }
    if (arrange) config.querySelector('summary').focus(); else catalogSearch.focus();
  }
  more.onclick = () => openCatalog(false, more);
  customize.onclick = () => openCatalog(true, customize);
  oldClose.onclick = () => chooser.close();
  chooser.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); chooser.close(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.stopPropagation(); event.preventDefault(); catalogSearch.focus();
    }
  });
  chooser.addEventListener('close', () => {
    if (chooser.open || chooser.returnValue === 'navigate') return;
    const target = catalogOpener?.getClientRects().length ? catalogOpener : more;
    target.focus({preventScroll: true});
  });

  // The prototype's undo and search now invoke the actual panel, not a demo history.
  const undo = button('واگردانی ویرایش', 'Undo edit', 'undo-edit', () => {
    if (w.GHAFState.undo()) w.VarnaActions.refresh();
  }, 'flow-header-button77');
  undo.dataset.undo77 = 'true';
  const language = $('button[data-language52]', $('#headerOptions'));
  if (language) { language.classList.add('flow-language77'); $('.topbar').append(language); }
  $('.topbar').append(undo);
  const headerSummary = $('#headerOptions>summary');
  headerSummary.replaceChildren(icon('sliders-horizontal')); headerSummary.title = text('ظاهر و کنترل‌های افتر', 'Appearance & After Effects controls');
  const searchButton = $('#studio30Search');
  if (searchButton) searchButton.replaceChildren(icon('search'));
  const commandSearch = $('#studio30Palette');
  const headerOptions = $('#headerOptions');
  document.addEventListener('keydown', event => {
    if (commandSearch && !commandSearch.hidden) {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopImmediatePropagation(); w.VarnaStudio30.closeSearch();
      } else if (event.key === 'Tab') {
        const controls = all('button:enabled,input:enabled,[tabindex="0"]', commandSearch)
          .filter(node => node.getClientRects().length);
        const edge = event.shiftKey ? controls[0] : controls[controls.length - 1];
        if (event.target === edge) {
          event.preventDefault();
          (event.shiftKey ? controls[controls.length - 1] : controls[0]).focus();
        }
      }
    } else if (event.key === 'Escape' && headerOptions.open && headerOptions.contains(event.target)) {
      event.preventDefault(); event.stopImmediatePropagation(); headerOptions.open = false; headerSummary.focus();
    }
  }, true);

  // All quick colors route through the existing palette owner. Custom colors stay editable.
  const appearance = element('section', 'flow-appearance77'), palette = element('div', 'flow-palette77');
  appearance.append(label(element('h3'), 'رنگ رابط', 'Interface color'), palette);
  const paletteColors = {original: '#9dbdff', ocean: '#75d8ed', mint: '#8ce8bb', ember: '#ffb596', noir: '#d5e1f1', rose: '#f0aad7'};
  const paletteNames = {original: ['اصلی', 'Original'], ocean: ['اقیانوس', 'Ocean'], mint: ['نعنا', 'Mint'], ember: ['اخگر', 'Ember'], noir: ['نوآر', 'Noir'], rose: ['رز', 'Rose']};
  for (const [name, color] of Object.entries(paletteColors)) {
    const b = button(...paletteNames[name], null, () => {
      const select = $('#themePreset50'); select.value = name; select.dispatchEvent(new Event('change', {bubbles: true}));
    }, 'flow-swatch77'); b.dataset.palette77 = name; b.style.setProperty('--swatch77', color); palette.append(b);
  }
  appearance.append(button('رنگ‌های دلخواه و ماتی کارت‌ها', 'Custom colors & card opacity', 'palette', () => {
    $('#headerOptions').open = false; w.VarnaUI.open('settings'); w.VarnaUI.reveal($('#themeBase50'));
  }));
  const blur = element('label', 'control flow-blur77'), blurLabel = element('span');
  label(blurLabel, 'محو کردن پس‌زمینهٔ رابط', 'Interface background blur');
  const blurRow = element('div', 'flow-blur-row77'), range = element('input'), blurValue = element('output');
  range.type = 'range'; range.min = '0'; range.max = '16'; range.step = '1'; range.value = String(prefs.blur); range.dataset.blur77 = 'true';
  range.setAttribute('aria-label', text('محو کردن پس‌زمینهٔ رابط', 'Interface background blur'));
  range.oninput = () => { prefs.blur = Math.max(0, Math.min(16, Number(range.value) || 0)); save(); applyBlur(); };
  blurRow.append(range, blurValue); blur.append(blurLabel, blurRow, label(element('small'), 'فقط ظاهر پنل تغییر می‌کند؛ خروجی ویدیو دست‌نخورده می‌ماند.', 'Changes the panel only; the video output stays unchanged.')); appearance.append(blur);
  $('#headerOptions .header-options-panel').prepend(appearance);
  const buildLabel = element('small', 'panel-build', 'Varna Motion Studio · UI89');
  buildLabel.dir = 'ltr';
  $('#headerOptions .header-options-panel').append(buildLabel);
  function applyBlur() { document.body.style.setProperty('--flow-bg-blur77', prefs.blur + 'px'); blurValue.textContent = prefs.blur + ' px'; }
  function paletteState() { for (const b of all('[data-palette77]')) attr(b,'aria-pressed',b.dataset.palette77 === $('#themePreset50').value); }
  function displayPalette() {
    const cfg = w.VarnaProduction50.currentTheme().config;
    const light = ['light', 'silver'].includes(document.body.dataset.theme);
    // Saved color inputs and --v48-base remain exact user values. Only the UI
    // display surface adapts to brightness; project styles never enter this path.
    for (const key of ['--flow-base77', '--flow-end77', '--flow-tint77']) document.body.style.removeProperty(key);
    if (cfg && light) {
      const brighten = (hex, amount) => 'rgb(' + hex.match(/[0-9a-f]{2}/ig).map(v => Math.round(parseInt(v, 16) * (1 - amount) + 255 * amount)).join(',') + ')';
      const base = brighten(cfg.base, .92), end = brighten(cfg.end, .88), field = brighten(cfg.base, .87);
      document.body.style.setProperty('--u-panel', base); document.body.style.setProperty('--u-input', field);
      document.body.style.setProperty('--u-text', '#152336'); document.body.style.setProperty('--u-muted', '#46576b');
      document.body.style.setProperty('--flow-base77', base); document.body.style.setProperty('--flow-end77', end); document.body.style.setProperty('--flow-tint77', base);
      w.VarnaUITokens68.refresh();
      document.body.style.setProperty('--v48-glyph', getComputedStyle(document.body).getPropertyValue('--ui-color-accent'));
    }
    // Reference-derived glass colors follow the selected palette, including custom
    // themes. They affect interface surfaces only, never project colors/fonts.
    const base=cfg?.base||'#091827', end=cfg?.end||'#18374d';
    const rgb=hex=>hex.match(/[0-9a-f]{2}/ig).map(v=>parseInt(v,16));
    const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
    const alpha=(v,a)=>'rgba('+v.join(',')+','+a+')';
    const b=rgb(base), e=rgb(end);
    document.body.style.setProperty('--flow-card78',light?'linear-gradient(140deg,rgba(255,255,255,.96),rgba(232,242,248,.94))':'linear-gradient(140deg,'+alpha(mix(b,e,.62),.94)+','+alpha(b,.90)+')');
    document.body.style.setProperty('--flow-bar78',light?'rgba(240,247,251,.98)':alpha(mix(b,[0,0,0],.28),.96));
    document.body.style.setProperty('--flow-field78',light?'#f8fbfd':alpha(mix(b,e,.24),.96));
    document.body.style.setProperty('--flow-edge78',light?'rgba(38,71,93,.38)':'rgba(160,216,239,.28)');
    document.body.style.setProperty('--flow-action78',!cfg&&!light?'#e2f57f':'var(--ui-color-action)');
    document.body.style.setProperty('--flow-on-action78',!cfg&&!light?'#1a200b':'var(--ui-color-on-action)');
    if(!cfg&&!light){document.body.style.setProperty('--flow-base77','#151613');document.body.style.setProperty('--flow-end77','#1e2019');document.body.style.setProperty('--v48-glyph','#b1bc71');}
    w.VarnaLiquid48?.refresh();
    paletteState();
  }
  document.addEventListener('varna:palette50', displayPalette);

  const home = $('#page-home');
  const launch = element('section', 'studio-launch87');
  const launchCopy = element('div', 'studio-launch-copy87');
  launchCopy.dir = en() ? 'ltr' : 'rtl';
  const quickHome = button('Quick Start', 'Quick Start', 'quick-project', () => quickProject.start(), 'studio-quick87');
  const brandArt = element('div', 'studio-brand-art87');
  brandArt.setAttribute('aria-hidden', 'true');
  launchCopy.append(label(element('h2'), 'فضای تدوین', 'Editing workspace'), quickHome);
  launch.append(launchCopy, brandArt);
  home.prepend(launch);

  const grid = $('.launcher-grid', home);
  grid.replaceChildren();
  for (const [fa, english, routes] of workspaceGroups) {
    const group = element('section', 'studio-directory87');
    const list = element('div', 'studio-directory-list87');
    group.append(label(element('h2'), fa, english), list);
    for (const route of routes) {
      if (!pages[route]) continue;
      const [faName, englishName, glyph] = pages[route];
      const b = button(faName, englishName, glyph, () => openWorkspace(route), 'studio-directory-link87');
      b.dataset.task77 = route;
      list.append(b);
    }
    if (list.childElementCount) grid.append(group);
  }

  const homeContext = element('p', 'home-host-status');
  homeContext.setAttribute('role', 'status');
  actions.append(homeContext);
  const quickShortcut = button('Quick Start', 'Quick Start', 'quick-project', () => quickProject.start(), 'studio-quick-link87');
  quickShortcut.setAttribute('aria-label', 'Quick Start');
  logo.after(quickShortcut);

  const toolLibrary = element('section', 'flow-tool-library77');
  toolLibrary.append(label(element('h2'), 'یک ابزار انتخاب کن', 'Choose a tool'));
  const toolGrid = element('div', 'flow-button-row77');
  for (const [id, name] of [['orb', 'Orb Reactor'], ['writetyper', 'WriteTyper'], ['glassary', 'Glassary'], ['cuttana', 'CuttanaNir'], ['smart', 'Smart Captions']]) {
    const b = button(name, name, 'layout-template', async () => {
      try { await w.VarnaTools.open(id); } catch (error) { $('#embeddedToolStatus').textContent = error.message; }
    }); b.dataset.tool77 = id; toolGrid.append(b);
  }
  toolLibrary.append(toolGrid); $('#page-tools .flat-intro69').after(toolLibrary);

  // Sticky action forwards to the original button; ancestry-dependent handlers stay intact.
  const proxy = element('button', 'btn primary flow-primary77'); proxy.type = 'button'; proxy.dataset.primary69 = 'true';
  proxy.dataset.proxy77 = 'true'; let primary = null;
  // Keep the actual input and its existing host handlers; no mirrored state/button.
  const previewInput82 = $('#livePreviewGlobal'), previewToggle82 = previewInput82.closest('label');
  previewToggle82.classList.remove('top-preview'); previewToggle82.classList.add('preview-toggle82');
  const previewPower82 = previewToggle82.querySelector('.switch'), previewText82 = previewToggle82.querySelector('span:last-child');
  previewPower82.className = 'preview-power82'; previewPower82.setAttribute('aria-hidden','true');
  previewPower82.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v8m-5.7-5a8 8 0 1 0 11.4 0"/></svg>';
  previewText82.className = 'preview-label82'; previewText82.setAttribute('aria-hidden','true');
  // UI83: preview power, refresh and settings share the non-scrolling header.
  const previewHeader83=element('div','preview-header83'),previewRefresh83=$('#btnRefreshPreview'),previewMode83=$('#livePreviewMode').closest('label');
  previewHeader83.setAttribute('role','group');previewHeader83.setAttribute('aria-label',text('پیش‌نمایش و تنظیمات','Preview & settings'));
  previewRefresh83.classList.remove('quick-btn');previewRefresh83.classList.add('preview-refresh83');
  previewRefresh83.replaceChildren(icon('rotate-ccw'));previewRefresh83.title=text('به‌روزرسانی پیش‌نمایش','Refresh preview');previewRefresh83.setAttribute('aria-label',previewRefresh83.title);
  const previewSettings83=element('section','preview-settings83');previewSettings83.append(label(element('b'),'تنظیم پیش‌نمایش','Preview settings'),previewMode83);
  $('#headerOptions .header-options-panel').prepend(previewSettings83);
  $('#headerOptions').before(previewHeader83);previewHeader83.append(previewToggle82,previewRefresh83,$('#headerOptions'));
  function previewState82() {
    const enabled=previewInput82.checked, title=text('پیش‌نمایش زندهٔ افتر؛ '+(enabled?'روشن است، برای خاموش‌کردن بزن':'خاموش است، برای روشن‌کردن بزن'),'Live AE preview; '+(enabled?'on, click to turn off':'off, click to turn on'));
    attr(previewToggle82,'title',title); attr(previewInput82,'aria-label',text('پیش‌نمایش زندهٔ افتر','Live AE preview'));
    const value=text(enabled?'پیش‌نمایش روشن':'پیش‌نمایش خاموش',enabled?'Preview on':'Preview off');
    if(previewText82.textContent!==value)previewText82.textContent=value;
    const busy=!!w.GHAFBridge.outputBusy;if(previewInput82.disabled!==busy)previewInput82.disabled=busy;if(previewRefresh83.disabled!==busy)previewRefresh83.disabled=busy;
    previewRefresh83.title=text('به‌روزرسانی پیش‌نمایش','Refresh preview');previewRefresh83.setAttribute('aria-label',previewRefresh83.title);
  }
  previewInput82.addEventListener('change',previewState82);
  const pageStatus = element('p', 'hint'); pageStatus.dataset.flowStatus77 = 'true'; pageStatus.setAttribute('role', 'status');
  $('.flat-status-popup69').append(pageStatus);
  const statusSummary = $('.flat-status69>summary');
  statusSummary.append(label(element('span', 'status-label'), 'وضعیت', 'Status'));
  const progress = $('#workflowProgress');
  progress.setAttribute('role', 'progressbar');
  const progressLive = element('span', 'panel-live-message');
  progressLive.setAttribute('role', 'status');
  document.body.append(progressLive);
  document.addEventListener('varna:progress', event => {
    const {percent, label: message} = event.detail;
    const value = Number.isFinite(percent) ? String(Math.min(100, Math.max(0, percent))) : '';
    attr(progress, 'aria-label', message || text('پیشرفت کار', 'Task progress'));
    if (value) attr(progress, 'aria-valuenow', value); else progress.removeAttribute('aria-valuenow');
    if (message && progressLive.textContent !== message) progressLive.textContent = message;
  });
  const primaryActions = {
    tools: () => { if(w.VarnaFeatureHub83)return w.VarnaFeatureHub83.primary();toolLibrary.scrollIntoView({block: 'nearest'}); $('button', toolLibrary).focus(); },
    settings: () => { w.VarnaUI.reveal($('#themePreset50')); $('#themePreset50').focus(); }
  };
  proxy.onclick = () => {
    const name = w.VarnaUI.current();
    if (primary) primary.click(); else if (primaryActions[name]) primaryActions[name]();
  };
  const originalReveal = w.VarnaUI.reveal;
  w.VarnaUI.reveal = function (node) {
    originalReveal(node);
    if (node?.closest('[data-flow77]')) {
      const advanced=advanced78.get(node.closest('.page')); if(advanced?.contains(node))advanced.open=true;
      for (let p = node.parentElement; p && p !== workspace; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;
      node.scrollIntoView({block: 'nearest'});
    }
  };
  const quickPrimaryStages = new Set(['audio', 'motion', 'bg', 'sfx', 'music', 'brand', 'safe', 'ai', 'keywords', 'translate', 'easing49', 'output']);
  function actionState() {
    previewState82();
    if (['home', 'table', 'kinetic'].includes(w.VarnaUI.current())) { if (proxy.isConnected) proxy.remove(); pageStatus.hidden = true; return; }
    const name = w.VarnaUI.current(), feature=name==='tools'&&w.VarnaFeatureHub83?.action(), id = pages[name]?.[5]; primary = feature?.button || (id ? document.getElementById(id) : null);
    pageStatus.hidden = false;
    const statusIds = {audio:'modelStatus',text:'sentenceStatus66',motion:'motionDraftStatus',templates:'templateStatus38',bg:'bgEngineStatus',sfx:'sfxAnalysisDetail',music:'cueStatus50',brand:'brandSummary',ai:'localAIStatus',translate:'translateStatus',director:'brainStatus',resources:'resourceSummary',output:'output35Status'};
    const status = document.getElementById(statusIds[name])?.textContent.trim() || text(pages[name][3], pages[name][4]);
    if (pageStatus.textContent !== status) pageStatus.textContent = status;
    attr(statusSummary, 'aria-label', text('وضعیت عملیات', 'Task status'));
    attr(statusSummary, 'data-error69', /خطا|ناموفق|failed|error/i.test(status));
    if (!['table', 'kinetic'].includes(name)) statusSummary.title = text('وضعیت عملیات', 'Task status');
    if (primary) {
      const titles = {audio:['ساخت زیرنویس','Transcribe'],text:['پیش‌نمایش در افتر','Preview in After Effects'],motion:['اعمال موشن','Apply motion'],templates:['اعمال و ساخت استایل','Apply & build style'],bg:['پیش‌نمایش در افتر','Preview in After Effects'],sfx:['پیشنهاد صداها','Suggest sounds'],music:['ساخت بازه‌های صدا','Generate audio cues'],brand:['اعمال برند','Apply brand'],safe:['اعمال محدودهٔ امن','Apply safe area'],ai:['پیشنهاد اصلاح‌ها','Suggest corrections'],keywords:['پیشنهاد کلمات مهم','Suggest keywords'],translate:['ساخت ترجمه','Translate'],easing49:['اعمال منحنی','Apply curve'],director:['ساخت پیشنهاد','Create plan'],assistant49:['تولید کد','Generate code'],resources:['بررسی مسیرها','Check paths'],output:['ساخت در افتر','Build in After Effects']};
      const short = shell.dataset.panelShort71 === 'true'||shell.dataset.size==='compact';
      const brief = {text:['پیش‌نمایش متن','Preview text'],bg:['پیش‌نمایش کادر','Preview background'],motion:['اعمال موشن','Apply motion'],brand:['اعمال برند','Apply brand'],safe:['اعمال قاب امن','Apply safe area'],easing49:['اعمال منحنی','Apply curve'],translate:['ترجمه','Translate'],resources:['بررسی مسیرها','Check paths'],ai:['اصلاح متن','Review text'],keywords:['پیشنهاد کلمات','Suggest keywords'],sfx:['پیشنهاد صدا','Suggest sounds'],output:['خروجی در افتر','Build in AE']};
      const title = feature?.label || text(...(titles[name] || [primary.textContent.trim(), primary.textContent.trim()]));
      const value = !feature && short && brief[name] ? text(...brief[name]) : title;
      if (proxy.textContent !== value) proxy.textContent = value; proxy.title = title;
      attr(proxy, 'aria-label', value);
      const disabled=primary.disabled||!!feature?.disabled;if(proxy.disabled!==disabled)proxy.disabled=disabled; attr(proxy,'data-target77',primary.id);
    } else {
      const value = name === 'settings' ? text('تنظیم ظاهر', 'Adjust appearance') : text('جست‌وجوی ابزارها', 'Find tools');
      if(proxy.textContent!==value)proxy.textContent=value;
      attr(proxy, 'aria-label', value); proxy.title = value;
      if(proxy.disabled!==!primaryActions[name])proxy.disabled=!primaryActions[name]; if(proxy.hasAttribute('data-target77'))delete proxy.dataset.target77;
    }
    proxy.toggleAttribute('data-quick-primary87', quickPrimaryStages.has(name));
    if (!proxy.isConnected) actions.prepend(proxy);
  }
  const contextBar = element('div', 'studio-context87');
  const sectionLinks = element('nav', 'studio-sections87');
  contextBar.append(sectionLinks);
  workspace.before(contextBar);

  function refreshSections(route) {
    const page = $('#page-' + route);
    sectionLinks.replaceChildren();
    if (route === 'home' || !page) return;
    if (w.VarnaContext90?.renderGroups(route, sectionLinks)) return;
    sectionLinks.setAttribute('aria-label', text('بخش‌های این صفحه', 'Page sections'));
    const targets = all('details.flat-section69, details.flow-advanced78, .text-library80, .text-editor-head80, .text-inspector80', page)
      .filter(node => !node.closest('[hidden], .hidden, .flow-advanced78:not([open]) > details, dialog:not([open])'));
    const titles = new Set();
    for (const target of targets) {
      const title = $('.text-inspector-title80 b, :scope>summary span, :scope>summary, .card-title b', target)?.textContent.trim() ||
        (target.matches('.text-library80') ? text('فهرست کپشن‌ها', 'Caption list') :
          target.matches('.text-editor-head80') ? text('متن فعال', 'Active caption') :
          target.matches('.text-inspector80') ? text('تنظیمات متن', 'Text settings') : '');
      if (!title || titles.has(title)) continue;
      titles.add(title);
      const b = button(title, title, null, () => {
        if (target.matches('details')) target.open = true;
        target.scrollIntoView({block:'start'});
        for (const link of sectionLinks.children) attr(link, 'aria-pressed', link === b);
      }, 'studio-section-link87');
      b.removeAttribute('title');
      // Some titles are from the plug-in's live localization.
      delete b.firstElementChild.dataset.fa77;
      delete b.firstElementChild.dataset.en77;
      attr(b, 'aria-pressed', false);
      sectionLinks.append(b);
    }
  }

  // These are the production stages of a project. Each stage whitelists the real
  // control groups used by that tool; diagnostic and preference pages stay in Full view.
  const stageControls = [
    ['audio', '#transcriptionSource,#transcriptionRange,#btnUseSelected,#sourceLayer,#sourcePath,#language,#quality,#modelSelect,#modelStatus,#timelineTextScope,#btnImportTimelineText,#timelineTextStatus,#btnTranscribe,#btnCancel,#transcribeStatus,#progressBar'],
    ['text', '#captionList,#captionSearch,.text-editor-bar80 > :not([data-text-settings80]):not([data-spell-shortcut83]),#reviewText,#text55-enabled,#text55Review'],
    ['ai', '#aiPreset,#aiPrompt,#btnAiSelected,#btnAiAll,#pendingList,#aiOriginal,#aiSuggestion,#btnRejectOne,#btnApproveOne,#btnApproveAll,#localAIStatus'],
    ['translate', '#translateTarget,#btnTranslateSelected,#btnTranslateAll,#translatePendingList,#translateOriginal,#translateSuggestion,#translateStatus,#btnTranslateApproveOne,#btnTranslateRejectOne,#btnTranslateApproveAll'],
    ['keywords', '#keywordsEnabled44,#keywordNote44,#highlightWords37,#highlightColor37,#suggestHighlight37,#suggestAllHighlight37,#highlightPreview37,#highlightStatus38'],
    ['brand', '#brandList,#brandScope,#brandApply,#brandStatus'],
    ['templates', '#nativeCollection50,#nativeScope50,#nativeGrid50,#nativeStatus50,#templateSearch38,#templateGrid38,#templateScope40,#templateTitle38,#templateSlots38,#templateApply38,#templateStatus38'],
    ['bg', '#bgScope,#bgEnabled,.bg-style-browser,#bgColor,#bgOpacity,#bgRound,#btnPreviewBg,#btnUpdateCaptions,#bgEngineStatus'],
    ['motion', '#animScope,#motionTargetPhase,.motion-category-tabs,.motion-presets,#animSpeedPreset,#animStrengthPreset,#motionApply,#motionDraftStatus'],
    ['kinetic', '#captionPicker40-kinetic,#sceneScope40,#scenePattern40,#sceneLines40,#sceneRead40,#sceneSplit40,#scenePieces40,#sceneStage40,#sceneStatus40,#wordPresets39,#wordScope39,#wordStatus39'],
    ['easing49', '#curveEditor49,.curve-monitor91,.curve-points49,#curvePresets49,#curveApply49,#curveScope49,#curveStatus49'],
    ['table', '#tableRows,#tableCols,#tableResize,#tableEditor,#tableFontPS66,#tableFill,#tableStudio89,#tablePreview,#tableViewport88,#tableWidth,#tableHeight,#tablePreviewTime,#tablePreviewTimeLabel'],
    ['safe', '#safePresetSelect,#safeMiniPreview,#safeOverlayOpacity,#safeEnforceText,#btnApplySafe,#btnRemoveSafe,#safePresetInfo,#safeSocialStatus'],
    ['sfx', '#btnUseActiveCompSfx,#sfxCompName,#sfxLibraryPath,#btnChooseSfxFolder,#btnScanSfx,#btnAnalyzeSfx,#sfxSuggestionList,#btnApplySfx,#sfxAnalysisDetail'],
    ['music', '#cueKind50,#cueStart50,#cueEnd50,#cueStyle50,#cuePrompt50,#cueAdd50,#audioCues50,#cueGenerate50,#cueCancel50,#cueStatus50'],
    ['director', '#brainBrief,#brainProfile,#brainAnalyze,#brainStatus,#brainTimeline,#brainPlan,#brainApply'],
    ['tools', '.flow-tool-library77,#embeddedToolHost,#embeddedToolStatus,#embeddedToolReload,#smartToolControls,#glassaryObjectsCard,#scriptToolControls'],
    ['assistant49', '#assistantProvider49,#assistantModel49,#assistantKey49,#assistantPrompt49,#assistantGenerate49,#assistantCode49,#assistantRun49,#assistantStatus49'],
    ['resources', '#resourceProfile,#resourceSummary,#btnCheckLocalRoles,#localAIStatus'],
    ['settings', '#appearance50,#hostDiagnosticStatus'],
    ['output', '#outputTarget36,#outputReadTargets36,#outputMode,#btnCheckOutput,#btnBuildOutput,#cancelOutput37,#btnExportSrt,#output35Status,#srtStatus']
  ].filter(([route]) => pages[route]);

  const stageByName = new Map(stageControls);
  const baseStages = [...stageByName.keys()];
  const optionalStages = ['tools','resources','settings'];
  const routeStorage = 'VARNA_QUICK_ROUTES88';
  function readRoutes() {
    let stored;
    try { stored = JSON.parse(localStorage.getItem(routeStorage) || 'null'); } catch (_) {}
    const routes = Array.isArray(stored?.routes) ? stored.routes.slice(0, 20).filter(item =>
      typeof item?.id === 'string' && typeof item?.name === 'string' && Array.isArray(item.order)).map(item => ({
      id: item.id, name: item.name.trim().slice(0, 48), order: [...new Set(item.order.filter(route => baseStages.includes(route)))],
      off: [...new Set([...(Array.isArray(item.off) ? item.off.filter(route => baseStages.includes(route)) : []),
        ...optionalStages.filter(route => !item.order.includes(route))])]
    })).filter(item => item.name || item.id === 'default') : [];
    if (!routes.length) routes.push({id:'default', name:'', order:[...baseStages], off:[...optionalStages]});
    return {routes, selected: routes.some(item => item.id === stored?.selected) ? stored.selected : routes[0].id};
  }
  const routeSettings = readRoutes();
  const currentRoute = () => routeSettings.routes.find(item => item.id === routeSettings.selected);
  const routeTitle = item => item.name || text('مسیر کامل', 'Full workflow');
  function stageOrder(item) {
    const known = new Set(item.order);
    return [...item.order, ...baseStages.filter(stage => !known.has(stage))];
  }
  const activeStages = item => stageOrder(item).filter(stage => !item.off.includes(stage));
  const routeChoose = element('select', 'studio-route-select88');
  const routeEdit = button('ویرایش مسیر', 'Edit workflow', 'sliders-horizontal', () => workflowDialog.open(), 'studio-route-edit88');
  routeEdit.setAttribute('aria-haspopup','dialog');
  const routeCount = element('output','studio-route-count88');
  const routeActions = element('div', 'studio-route-actions88');
  quickHome.before(routeActions);
  routeActions.append(routeChoose, quickHome, routeEdit);
  launchCopy.append(routeCount);

  function renderRouteChoice() {
    routeChoose.setAttribute('aria-label', text('مسیر Quick Start','Quick Start workflow'));
    routeChoose.replaceChildren(...routeSettings.routes.map(item => {
      const option = element('option','', routeTitle(item));
      option.value = item.id;
      return option;
    }));
    routeChoose.value = routeSettings.selected;
    launchCopy.dir = en() ? 'ltr' : 'rtl';
    const size = activeStages(currentRoute()).length;
    quickHome.disabled = quickShortcut.disabled = !size;
    routeCount.textContent = size ? size + text(' مرحلهٔ فعال', ' active stages') :
      text('برای شروع، یک مرحله فعال کن.', 'Enable a stage to start.');
  }
  function saveRoutes() {
    localStorage.setItem(routeStorage, JSON.stringify(routeSettings));
    renderRouteChoice();
  }
  routeChoose.onchange = () => {
    const selected = routeSettings.selected;
    routeSettings.selected = routeChoose.value;
    try { saveRoutes(); } catch (_) { routeSettings.selected = selected; renderRouteChoice(); }
  };

  function createWorkflowDialog() {
    const dialog = element('dialog','studio-route-dialog88');
    dialog.setAttribute('aria-labelledby','quickRouteTitle88');
    const title = label(element('h2'),'مسیرهای Quick Start','Quick Start workflows');
    title.id = 'quickRouteTitle88';
    const head = element('header','studio-route-head88');
    const close = button('بستن','Close','x',()=>dialog.close(),'studio-route-icon88');
    close.setAttribute('aria-label','Close');
    head.append(title,close);
    const profile = element('select');
    const name = element('input');
    name.type = 'text';
    name.maxLength = 48;
    const controls = element('div','studio-route-controls88');
    const add = button('مسیر تازه','New workflow','plus',()=>{
      if (draft.routes.length >= 20) return;
      const before = selectedRoute();
      const fresh = {id:'workflow-'+Date.now(),name:text('مسیر تازه','New workflow'),order:[...before.order],off:[...before.off]};
      draft.routes.push(fresh);
      draft.selected = fresh.id;
      render();
      name.focus();
      name.select();
    },'studio-route-button88');
    const remove = button('حذف مسیر','Delete workflow',null,()=>{
      if (draft.routes.length < 2) return;
      draft.routes = draft.routes.filter(item => item.id !== draft.selected);
      draft.selected = draft.routes[0].id;
      render();
      profile.focus();
    },'studio-route-button88');
    controls.append(profile,add,remove);
    const nameLabel = element('label','studio-route-name88');
    nameLabel.append(label(element('span'),'نام مسیر','Workflow name'),name);
    const list = element('ol','studio-route-list88');
    const count = element('span','studio-route-help88');
    const status = element('p','studio-route-status88');
    status.setAttribute('role','status');
    const footer = element('footer','studio-route-footer88');
    const reset = button('ترتیب پیش‌فرض','Default order',null,()=>{
      selectedRoute().order = [...baseStages];
      renderList();
    },'studio-route-button88');
    const save = button('ذخیرهٔ مسیرها','Save workflows',null,()=>{
      if (draft.routes.some(item=>!item.name.trim() && item.id !== 'default')) {
        status.textContent = text('برای هر مسیر یک نام وارد کن.', 'Enter a name for each workflow.');
        name.focus();
        return;
      }
      const before = {...routeSettings};
      Object.assign(routeSettings, draft);
      try { saveRoutes(); } catch (_) {
        Object.assign(routeSettings, before);
        status.textContent = text('ذخیره در این محیط در دسترس نیست.', 'Storage is unavailable in this environment.');
        return;
      }
      dialog.close();
    },'studio-route-save88');
    footer.append(reset,count,save);
    dialog.append(head,controls,nameLabel,list,status,footer);
    document.body.append(dialog);
    let draft, returnFocus;
    const selectedRoute = () => draft.routes.find(item => item.id === draft.selected);
    function renderList(focusStage, direction) {
      const item = selectedRoute();
      list.replaceChildren();
      const stages = stageOrder(item);
      if (stages.length !== item.order.length) item.order = stages;
      for (const [index,stage] of stages.entries()) {
        const [fa,english,glyph] = pages[stage];
        const stageName = text(fa,english);
        const row = element('li','studio-route-row88');
        row.dataset.stage88 = stage;
        const toggle = element('input');
        toggle.type = 'checkbox';
        toggle.checked = !item.off.includes(stage);
        const display = element('label','studio-route-stage88');
        display.append(toggle, icon(glyph), element('span','',stageName));
        row.toggleAttribute('data-disabled88',!toggle.checked);
        toggle.onchange = () => {
          item.off = toggle.checked ? item.off.filter(id=>id!==stage) : [...item.off,stage];
          row.toggleAttribute('data-disabled88',!toggle.checked);
          updateCount();
        };
        const reorder = element('div','studio-route-order88');
        for (const offset of [-1,1]) {
          const verb = offset < 0 ? text('بالا بردن','Move up') : text('پایین بردن','Move down');
          const arrow = button(verb,verb,offset<0?'chevron-up':'chevron-down',()=>{
            const destination = index + offset;
            [item.order[index],item.order[destination]] = [item.order[destination],item.order[index]];
            renderList(stage,offset);
          },'studio-route-icon88');
          arrow.dataset.move88 = String(offset);
          arrow.setAttribute('aria-label',verb + ' · ' + stageName);
          arrow.title = verb;
          arrow.disabled = index + offset < 0 || index + offset === stages.length;
          reorder.append(arrow);
        }
        row.append(display,reorder);
        list.append(row);
      }
      updateCount();
      if (focusStage) {
        const row = list.querySelector('[data-stage88="'+focusStage+'"]');
        (row.querySelector('[data-move88="'+direction+'"]:enabled') || row.querySelector('button:enabled')).focus();
      }
    }
    function updateCount() {
      count.textContent = activeStages(selectedRoute()).length + text(' مرحلهٔ فعال',' active stages');
    }
    function render() {
      close.setAttribute('aria-label', text('بستن','Close'));
      profile.setAttribute('aria-label',text('مسیر ذخیره‌شده','Saved workflow'));
      profile.replaceChildren(...draft.routes.map(item=>{
        const option = element('option','',routeTitle(item));option.value = item.id;return option;
      }));
      profile.value = draft.selected;
      name.value = selectedRoute().name;
      name.placeholder = text('مسیر کامل','Full workflow');
      add.disabled = draft.routes.length >= 20;
      remove.disabled = draft.routes.length < 2;
      renderList();
    }
    profile.onchange = () => { draft.selected = profile.value; render(); };
    name.oninput = () => {
      const item = selectedRoute();
      item.name = name.value;
      profile.selectedOptions[0].textContent = routeTitle(item);
    };
    dialog.addEventListener('close',()=>returnFocus?.focus());
    return {open() {
      returnFocus = document.activeElement;
      draft = JSON.parse(JSON.stringify(routeSettings));
      status.textContent = '';
      render();
      dialog.showModal();
      profile.focus();
    }};
  }
  const workflowDialog = createWorkflowDialog();
  renderRouteChoice();

  function createQuickProject() {
    const guide = element('section', 'quick-guide87');
    guide.setAttribute('aria-label', 'Quick Start');
    guide.hidden = true;
    const guideName = element('b', 'quick-name88');
    const picker = element('select');
    const progress = element('progress');
    const position = element('b', 'quick-progress-text87');
    position.dir = 'ltr';
    const progressGroup = element('div', 'quick-progress87');
    progressGroup.append(progress, position);
    const exit = button('همهٔ تنظیمات', 'Full controls', null, () => leave(false), 'quick-exit87');
    guide.append(guideName, picker, progressGroup, exit);
    contextBar.append(guide);
    const advanceStatus = element('p', 'panel-live-message');
    advanceStatus.setAttribute('aria-live', 'polite');
    contextBar.append(advanceStatus);

    const footer = element('div', 'quick-actions87');
    const previous = button('قبلی', 'Previous', null, () => go(index - 1), 'quick-action87');
    const skip = button('رد کردن', 'Skip', null, () => move('skipped'), 'quick-action87');
    const next = button('بعدی', 'Next', null, () => move('reviewed'), 'quick-action87 quick-next87');
    footer.append(previous, skip, next);
    footer.hidden = true;
    actions.append(footer);

    let index = -1;
    let omissions = new Set();
    const disclosed = new Set();
    let activePage;
    let pendingFrame = 0;
    let previousBackgroundTab = null;
    let result = [];
    let steps = [];
    let runningRoute = null;
    function restore() {
      if (pendingFrame) w.cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
      observer.disconnect();
      if (previousBackgroundTab) w.VarnaBackgroundWorkspace81?.choose(previousBackgroundTab);
      previousBackgroundTab = null;
      for (const node of omissions) node.removeAttribute('data-qp-omit87');
      omissions.clear();
      for (const details of disclosed) details.open = false;
      disclosed.clear();
      activePage = null;
    }
    const unit = 'label, .control, .form-field, .switch-row, .check';
    function filter() {
      pendingFrame = 0;
      if (index < 0 || !activePage) return;
      const selectors = stageByName.get(steps[index]);
      const whole = new Set();
      const keep = new Set();
      for (const target of all(selectors, activePage)) {
        // Preserve the input with its live label and compound control.
        const node = target.matches('input,select,textarea,span,b,small') ? target.closest(unit) || target.closest('.numeric37,.field,.color-editor') || target : target;
        whole.add(node);
        for (let p = node; p && p !== activePage; p = p.parentElement) keep.add(p);
      }
      const nextOmissions = new Set();
      function walk(parent) {
        for (const node of parent.children) {
          if (whole.has(node)) continue;
          if (keep.has(node)) {
            if (node.matches('details:not([open])')) { node.open = true; disclosed.add(node); }
            walk(node);
          } else if (!node.matches('summary, .card-title, .flat-intro69, script, style, input[type=hidden]')) {
            nextOmissions.add(node);
          }
        }
      }
      walk(activePage);
      for (const node of omissions) if (!nextOmissions.has(node)) node.removeAttribute('data-qp-omit87');
      for (const node of nextOmissions) node.setAttribute('data-qp-omit87', '');
      omissions = nextOmissions;
    }
    const observer = new MutationObserver(() => {
      if (!pendingFrame) pendingFrame = w.requestAnimationFrame(filter);
    });
    function stagePane() {
      restore();
      const route = steps[index];
      activePage = route && $('#page-' + route);
      if (!activePage) return;
      if (route === 'bg' && w.VarnaBackgroundWorkspace81) {
        const background = w.VarnaBackgroundWorkspace81;
        if (background.tab() !== 'look') {
          previousBackgroundTab = background.tab();
          background.choose('look');
        }
      }
      filter();
      observer.observe(activePage, {childList:true, subtree:true});
    }
    function render() {
      const active = index >= 0;
      guide.hidden = footer.hidden = !active;
      shell.toggleAttribute('data-quick87', active);
      advanceStatus.hidden = !active;
      if (!active) return;
      guideName.textContent = runningRoute ? routeTitle(runningRoute) : 'Quick Start';
      picker.setAttribute('aria-label', text('مرحلهٔ Quick Start', 'Quick Start stage'));
      progress.setAttribute('aria-label', text('موقعیت مرحله', 'Stage position'));
      progress.max = steps.length;
      progress.value = index + 1;
      position.textContent = (index + 1) + ' / ' + steps.length;
      const options = steps.map((route, at) => {
        const outcome = result[at];
        const name = text(...pages[route].slice(0, 2)) + (outcome === 'skipped' ? text(' · رد شد', ' · Skipped') :
          outcome === 'done' ? text(' · انجام شد', ' · Done') : '');
        const option = element('option', '', name);
        option.value = String(at);
        return option;
      });
      picker.replaceChildren(...options);
      picker.value = String(index);
      advanceStatus.textContent = text('مرحله ', 'Stage ') + position.textContent + ' · ' + picker.selectedOptions[0].textContent;
      previous.disabled = index === 0;
      const last = index === steps.length - 1;
      skip.hidden = false;
      label(next.lastElementChild, last ? 'پایان' : 'بعدی', last ? 'Finish' : 'Next');
    }
    function leave(finished) {
      restore();
      index = -1;
      runningRoute = null;
      render();
      if (finished) openWorkspace('home');
      else requestAnimationFrame(() => heading.focus({preventScroll:true}));
    }
    function busy() {
      const route = steps[index];
      return !!(w.GHAFBridge.outputBusy || (route === 'audio' && $('#btnTranscribe').disabled) ||
        (route === 'table' && $('#tableBuild').disabled));
    }
    function go(at, force = false) {
      if ((!force && busy()) || !steps[at]) { if (index >= 0) picker.value = String(index); return; }
      index = at;
      render();
      const route = steps[at];
      openWorkspace(route);
      if (w.VarnaUI.current() === route) stagePane();
    }
    function move(outcome) {
      if (index < 0 || busy()) return;
      if (outcome === 'skipped' && steps[index] === 'keywords') w.VarnaActions.setQuickKeywordsOff88(true);
      if (result[index] !== 'done' || outcome === 'skipped') result[index] = outcome;
      if (index === steps.length - 1) leave(true); else go(index + 1);
    }
    function routeChanged(route) {
      if (index < 0 || route === steps[index]) return;
      // Native audio import opens Text; honor the saved route, even when Text was disabled.
      if (steps[index] === 'audio' && route === 'text') {
        committed('audio', true);
        return;
      }
      leave(false);
    }
    function committed(route, routedByHost = false) {
      if (index < 0 || steps[index] !== route || (!routedByHost && w.VarnaUI.current() !== route)) return;
      result[index] = 'done';
      if (index === steps.length - 1) leave(true);
      else go(index + 1, true);
    }
    picker.onchange = () => go(Number(picker.value));
    document.addEventListener('varna:stage-committed87', event => committed(event.detail.route));
    document.addEventListener('varna:progress', event => {
      const {label: message, percent} = event.detail;
      if (percent === 100 && message === 'خروجی کامل شد') committed('output');
    });
    return {start() {
      if (index >= 0 || busy()) return;
      runningRoute = currentRoute();
      steps = activeStages(runningRoute);
      if (!steps.length) return;
      result = [];
      w.VarnaActions.setQuickKeywordsOff88(true);
      go(0, true);
    }, routeChanged, render};
  }
  const quickProject = createQuickProject();

  let scheduled = 0, syncCount78=0, route78='', language78='';
  const motion78=w.matchMedia('(prefers-reduced-motion: reduce)');
  const compactHeader86=w.matchMedia('(max-width: 480px)');
  let routeAnimations78=[];
  function animateRoute78(page) {
    routeAnimations78.forEach(a=>a.cancel()); routeAnimations78=[];
    if(motion78.matches||!page?.animate)return;
    const panels=all('[data-focus-panel78=main],.studio-launch87,.launcher-grid',page).filter(n=>!n.parentElement.closest('[data-focus-panel78]')).slice(0,6);
    for(const node of panels){const a=node.animate([{opacity:.72},{opacity:1}],{duration:160,easing:'ease-out'});a.id='flow-route78';routeAnimations78.push(a);}
  }
  motion78.addEventListener('change',()=>{if(motion78.matches){routeAnimations78.forEach(a=>a.cancel());routeAnimations78=[];}});
  function sync() {
    scheduled = 0; syncCount78++;
    const current = w.VarnaUI.current(), info = pages[current]; if (!info) return;
    attr(shell, 'data-workspace86', current);
    const compactHeader83=compactHeader86.matches||shell.dataset.panelShort71==='true';
    const headerParent = compactHeader83 ? $('#headerOptions .header-options-panel') : $('.topbar');
    for (const n of [language, undo]) if (n && n.parentElement !== headerParent) headerParent.append(n);
    const refreshParent83=shell.dataset.panelMicro69==='true'?previewSettings83:previewHeader83;
    if(previewRefresh83.parentElement!==refreshParent83)refreshParent83.insertBefore(previewRefresh83,refreshParent83===previewHeader83?$('#headerOptions'):null);
    // Only stale navigation classes are cleared; conditionally hidden controls remain hidden.
    const active = $('#page-' + current);
    all('.production-hidden47,.workspace-paged67,.table-paged-out66', active).forEach(n => n.classList.remove('production-hidden47', 'workspace-paged67', 'table-paged-out66'));
    if (current !== 'kinetic') all('.workflow-tab-hidden', active).forEach(n => n.classList.remove('workflow-tab-hidden'));
    const headingValue=current==='tools'&&w.VarnaFeatureHub83?.title()||text(info[0],info[1]);if(heading.textContent!==headingValue)heading.textContent=headingValue;
    if(language78!==String(en())) {
      language78=String(en());
      for (const n of all('[data-fa77]')) { const value = en() ? n.dataset.en77 : n.dataset.fa77; if (n.textContent !== value) n.textContent = value; }
      renderRouteChoice();
      quickProject.render();
      refreshSections(current);

    }
    if(route78!==current){route78=current;refreshSections(current);animateRoute78(active);}
    // These catalog samples are fixed UI artwork, not the user's caption text.
    for (const n of all('#page-motion .motion-card-preview-inner>span')) if (['VARNA MOTION','MOTION','حرکت'].includes(n.textContent)) {
      const value = text('حرکت', 'MOTION'); if (n.textContent !== value) n.textContent = value;
    }
    attr(catalogSearch,'placeholder',text('جست‌وجوی بخش‌ها…', 'Find a section…')); attr(catalogSearch,'aria-label',text('جست‌وجوی بخش‌ها', 'Find a section'));
    attr(range,'aria-label',text('محو کردن پس‌زمینهٔ رابط', 'Interface background blur'));
    if (searchButton) {
      searchButton.title = text('جست‌وجوی ابزار و تنظیمات · Ctrl+K', 'Search tools and settings · Ctrl+K');
      attr(searchButton, 'aria-label', text('جست‌وجوی ابزار و تنظیمات', 'Search tools and settings'));
      attr(searchButton, 'aria-keyshortcuts', 'Control+K');
    }
    headerSummary.title = text('ظاهر و کنترل‌های افتر', 'Appearance & After Effects controls');
    attr(headerSummary, 'aria-label', headerSummary.title);
    attr(undo, 'aria-label', text('واگردانی ویرایش', 'Undo edit'));
    undo.title = text('واگردانی ویرایش', 'Undo edit');
    attr(previewHeader83, 'aria-label', text('پیش‌نمایش و تنظیمات', 'Preview and settings'));
    attr(actions, 'aria-label', text('عملیات این بخش', 'Workspace actions'));
    const hostStatus = w.GHAFBridge.available ? text('متصل به افتر', 'AE connected') : text('بدون اتصال به افتر', 'AE disconnected');
    if (homeContext.textContent !== hostStatus) homeContext.textContent = hostStatus;
    homeContext.dataset.hostAvailable = String(w.GHAFBridge.available);
    homeContext.hidden = current !== 'home';
    renderDock(); queueRail79(); actionState(); paletteState();
  }
  function schedule() { if (!scheduled) scheduled = requestAnimationFrame(sync); }
  compactHeader86.addEventListener('change', schedule);
  document.addEventListener('varna:page', event => { quickProject.routeChanged(event.detail.name); schedule(); });
  document.addEventListener('varna:language52', schedule);
  document.addEventListener('varna:project-restored88', () => quickProject.routeChanged(''));
  document.addEventListener('varna:feature83', actionState);
  // Observe only real primary actions/status. Numeric widgets and animated previews
  // mutate their own DOM; those updates must not rebuild the rail every frame.
  for(const info of Object.values(pages))if(info[5]){const n=document.getElementById(info[5]);if(n)new MutationObserver(actionState).observe(n,{attributes:true,attributeFilter:['disabled']});}
  for(const id of ['modelStatus','sentenceStatus66','motionDraftStatus','templateStatus38','bgEngineStatus','sfxAnalysisDetail','cueStatus50','brandSummary','localAIStatus','translateStatus','brainStatus','resourceSummary','output35Status']){const n=document.getElementById(id);if(n)new MutationObserver(actionState).observe(n,{childList:true,characterData:true,subtree:true});}
  new MutationObserver(schedule).observe(shell, {attributes:true, attributeFilter:['data-panel-short71']});
  // Keep footer progress/disabled labels synchronized without polling or rebuilding fields.
  document.addEventListener('varna:progress', actionState);
  applyBlur(); displayPalette(); renderOrder(); renderDock(); w.VarnaPilot69.sync(); sync();
  // Existing UI84 collections remain independent destinations in the UI91 catalog.
  function registerDestination84(name, info) {
    if (pages[name]) return;
    pages[name] = info; railNames79[name] = info.slice(0, 2);
    const tab = button(info[0], info[1], info[2], () => w.VarnaUI.open(name));
    tab.dataset.page69 = name; navigationButtons.set(name, tab); nav.append(tab);
    const row = element('div', 'flow-catalog-row77');
    const link = button(info[0], info[1], info[2], () => { chooser.close('navigate'); w.VarnaUI.open(name); }, 'flow-catalog-link77');
    link.dataset.destination69 = name;
    const pin = button('میانبر', 'Pin', 'star', () => togglePin(name), 'flow-pin77');
    pin.dataset.pin77 = name; row.append(link, pin);
    const group = catalogGroups[catalogGroups.length - 1];
    group.section.querySelector('.catalog-group-grid').append(row); group.rows.push({row, name});
    Object.assign(prefs, read()); dockKey78 = ''; renderDock(); renderOrder();
  }
  w.VarnaFlow77 = {sync, openCatalog, registerDestination84, version: 91, quickProject, pages: Object.keys(pages), preferences: () => JSON.parse(JSON.stringify(prefs)), performance:()=>({syncs:syncCount78}), focus:essential78, fitRail:fitRail79};
})(window);
