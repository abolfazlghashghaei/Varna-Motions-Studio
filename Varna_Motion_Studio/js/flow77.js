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
    home: ['خانه', 'Home', 'house', 'یک نتیجه انتخاب کن و کار را شروع کن.', 'Choose what you want to create.', null],
    audio: ['ساخت زیرنویس', 'Create captions', 'audio-lines', 'صدا یا لایه‌های متن را به کپشن‌های قابل ویرایش تبدیل کن.', 'Turn audio or text layers into editable captions.', 'btnTranscribe'],
    text: ['ویرایش متن', 'Edit text', 'type', 'متن و زمان را ویرایش کن؛ اصلاح آفلاین کنار متن در دسترس است.', 'Edit text and timing, with optional offline spelling beside the text.', 'btnRefreshPreview'],
    motion: ['موشن', 'Motion', 'wand-sparkles', 'حرکت ورود، خروج و نوشتن متن را تنظیم کن.', 'Set text entrance, exit and typing motion.', 'motionApply'],
    kinetic: ['تایپوگرافی', 'Typography', 'kinetic44', 'ظاهر و حرکت هر عبارت یا کلمه را جدا تنظیم کن.', 'Design the appearance and motion of each phrase or word.', null],
    templates: ['استایل‌ها', 'Styles', 'layout-template', 'یک استایل انتخاب کن و روی متن خودت اعمال کن.', 'Choose a style and apply it to your own text.', 'templateBuild45'],
    bg: ['بک‌گراند', 'Background', 'layers', 'رنگ، شیشه و حرکت کادر پشت متن را تنظیم کن.', 'Design the color, glass and motion behind your text.', 'btnPreviewBg'],
    table: ['جدول', 'Table', 'table-2', 'ساختار، متن، ظاهر و حرکت خانه‌ها را تنظیم کن.', 'Set the table structure, cell text, appearance and motion.', null],
    sfx: ['افکت صوتی', 'Sound effects', 'music-2', 'صداهای کتابخانه‌ات را برای لحظه‌های مناسب انتخاب کن.', 'Choose sounds from your library for the right moments.', 'btnAnalyzeSfx'],
    music: ['ساخت صدا', 'Generate audio', 'music-2', 'موسیقی بی‌کلام یا صدای محیط را برای بازه‌های مشخص بساز.', 'Generate instrumental music or ambience for specific time ranges.', 'cueGenerate50'],
    brand: ['برند', 'Brand', 'palette', 'فونت، رنگ، موشن و فایل‌های همیشگی یک برند را نگه دار.', 'Keep a brand’s fonts, colors, motion and reusable assets together.', 'brandApply'],
    safe: ['محدودهٔ امن', 'Safe area', 'scan', 'جای متن را با قاب و رابط پلتفرم مقصد هماهنگ کن.', 'Keep text clear of the destination platform’s interface.', 'btnApplySafe'],
    ai: ['اصلاح هوشمند', 'Smart correction', 'wand-sparkles', 'پیشنهادهای مدل و حافظهٔ اصلاح را ببین و خودت تأیید کن.', 'Review model and correction-memory suggestions before accepting.', 'btnAiAll'],
    keywords: ['کلمات مهم', 'Keywords', 'highlighter44', 'کلمات کلیدی را انتخاب کن و ظاهرشان را متمایز کن.', 'Choose key words and give them a distinct appearance.', 'suggestAllHighlight37'],
    translate: ['ترجمه', 'Translation', 'type', 'ترجمه را کنار متن اصلی بررسی و تأیید کن.', 'Review and accept translations beside the original text.', 'btnTranslateAll'],
    easing49: ['منحنی حرکت', 'Motion curves', 'sliders-horizontal', 'شتاب حرکت را تنظیم و به کلیدهای انتخاب‌شده اعمال کن.', 'Adjust easing and apply it to the selected keyframes.', 'curveApply49'],
    director: ['دستیار پروژه', 'Project assistant', 'layers', 'شرح پروژه را بده و پیشنهادهای طراحی را پیش از اعمال ببین.', 'Describe the project and review design suggestions before applying.', 'brainAnalyze'],
    assistant49: ['دستیار اسکریپت', 'Script assistant', 'code', 'کد پیشنهادی را بررسی کن؛ اجرای آن مرحله‌ای جداست.', 'Review generated code; running it is a separate action.', 'assistantGenerate49'],
    tools: ['ابزارهای افزوده', 'Additional tools', 'layout-template', 'ابزار نصب‌شده را انتخاب کن تا کنترل‌های واقعی آن باز شود.', 'Choose an installed tool to open its actual controls.', null],
    resources: ['منابع سیستم', 'System resources', 'sliders-horizontal', 'مسیر موتور و مدل‌ها و مصرف منابع را بررسی کن.', 'Check engine and model paths and resource use.', 'btnCheckLocalRoles'],
    output: ['خروجی', 'Output', 'upload', 'لایه‌های متن را در افتر بساز یا فایل زیرنویس ذخیره کن.', 'Build text layers in After Effects or save a subtitle file.', 'btnBuildOutput'],
    settings: ['تنظیمات', 'Settings', 'sliders-horizontal', 'ظاهر رابط، اتصال میزبان و پروفایل‌های تنظیمات را مدیریت کن.', 'Manage interface appearance, host connection and settings profiles.', null]
  };
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
  function icon(name) {
    const node = element('span', 'flow-icon77'); node.setAttribute('aria-hidden', 'true');
    node.innerHTML = w.VarnaIcons30?.[name] || w.VarnaIcons30?.['sliders-horizontal'] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
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
        side: value.side === 'right' ? 'right' : 'left',
        collapsed: value.collapsed === true,
        blur: Number.isFinite(value.blur) ? Math.max(0, Math.min(16, value.blur)) : 0
      };
    } catch (_) { return {pins: ['audio', 'text', 'motion', 'bg', 'table'], side: 'left', collapsed: false, blur: 0}; }
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
      d.open = true; d.dataset.focusPanel78 = main ? 'main' : 'secondary';
      // Keep a semantic section heading, without a redundant expand/collapse row.
      const summary = d.querySelector(':scope>summary');
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
  const identity78=element('div','flow-identity78');identity78.dir='ltr';
  identity78.append(element('strong','','VARNA.'),element('span','','MOTION STUDIO / AFTER EFFECTS'));
  $('.topbar').append(identity78);

  // Reuse the existing page navigator and its accessible dialog on every page.
  const navigationButtons = new Map(all('[data-page69]', nav).map(n => [n.dataset.page69, n]));
  for (const [name, info] of Object.entries(pages)) {
    if (name === 'home' || navigationButtons.has(name)) continue;
    const b = button(info[0], info[1], info[2], () => w.VarnaUI.open(name));
    b.dataset.page69 = name; navigationButtons.set(name, b); nav.append(b);
  }
  const more = $('[data-more69]', nav), logo = element('button', 'flow-logo77'); logo.type = 'button';
  logo.dataset.flowLogo77 = 'true'; logo.title = 'Varna Motion Studio'; logo.setAttribute('aria-label', 'Varna Motion Studio');
  const logoImage = element('img'); logoImage.src = './assets/varna-logo.svg'; logoImage.alt = ''; logo.append(logoImage); logo.onclick = () => w.VarnaUI.open('home'); nav.prepend(logo);
  const customize = button('میانبرهای من', 'My shortcuts', 'star', () => openCatalog(true), 'flow-dock-option77');
  customize.dataset.customize77 = 'true';
  const collapse = button('جمع‌کردن نوار', 'Collapse rail', 'chevron-left', () => { prefs.collapsed = !prefs.collapsed; save(); renderDock(); }, 'flow-dock-option77');
  collapse.dataset.collapse77 = 'true'; nav.append(customize, collapse);
  function attr(node, name, value) { value=String(value); if(node.getAttribute(name)!==value)node.setAttribute(name,value); }
  let dockKey78='';
  function renderDock() {
    const key=JSON.stringify([prefs.pins,prefs.side,prefs.collapsed,en(),w.VarnaUI.current()]);
    if(key===dockKey78)return; dockKey78=key;
    attr(shell,'data-dock-side77',prefs.side); attr(shell,'data-dock-collapsed77',prefs.collapsed);
    collapse.setAttribute('aria-expanded', String(!prefs.collapsed));
    collapse.title = prefs.collapsed ? text('بازکردن نوار ابزار', 'Expand the tool rail') : text('جمع‌کردن نوار ابزار', 'Collapse the tool rail');
    collapse.setAttribute('aria-label', collapse.title);
    for (const [name, b] of navigationButtons) {
      const info = pages[name], pinned = name === 'home' || prefs.pins.includes(name);
      b.hidden = !pinned; b.dataset.pinned77 = String(pinned);
      b.title = text(info[0], info[1]); b.setAttribute('aria-label', b.title);
      b.setAttribute('aria-current', name === w.VarnaUI.current() ? 'page' : 'false');
      if (!b.dataset.icon77) {
        b.replaceChildren(icon(info[2]), label(element('span', 'flat-nav-label69'), info[0], info[1])); b.dataset.icon77 = 'true';
      }
    }
    // Reorder only after a preference change. Moving focused buttons on every click
    // would discard keyboard focus in Chromium 99.
    const orderKey = prefs.pins.join('|');
    if (nav.dataset.order77 !== orderKey) {
      for (const name of ['home', ...prefs.pins]) if (navigationButtons.has(name)) nav.append(navigationButtons.get(name));
      nav.append(more, customize, collapse); nav.dataset.order77 = orderKey;
    }
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
  chooser.prepend(catalogHead); catalogHead.append(catalogTitle, oldClose);
  const catalogNotice = element('p', 'hint'); catalogNotice.setAttribute('role', 'status');
  const catalogSearch = element('input'); catalogSearch.type = 'search'; catalogSearch.dataset.catalogSearch77 = 'true';
  chooser.insertBefore(catalogSearch, $('.flat-chooser-grid69')); chooser.append(catalogNotice);
  const config = element('details', 'flow-dock-config77');
  config.append(label(element('summary'), 'چیدمان میانبرهای من', 'Arrange my shortcuts'));
  const sides = element('div', 'flow-button-row77');
  for (const side of ['left', 'right']) {
    const b = button(side === 'left' ? 'نوار در چپ' : 'نوار در راست', side === 'left' ? 'Rail on left' : 'Rail on right', null, () => { prefs.side = side; save(); renderDock(); renderOrder(); });
    b.dataset.side77 = side; sides.append(b);
  }
  const order = element('div', 'flow-dock-order77');
  const resetDock = button('بازگشت به چیدمان اصلی', 'Reset shortcut layout', null, () => {
    prefs.pins = ['audio', 'text', 'motion', 'bg', 'table']; prefs.side = 'left'; prefs.collapsed = false;
    save(); renderDock(); renderOrder();
  }); resetDock.dataset.resetDock77 = 'true';
  config.append(sides, resetDock, order); catalogSearch.after(config);
  let draggedPin = '';
  function renderOrder() {
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
          [prefs.pins[i], prefs.pins[next]] = [prefs.pins[next], prefs.pins[i]]; save(); renderDock(); renderOrder();
        });
        b.disabled = i + delta < 0 || i + delta >= prefs.pins.length; row.append(b);
      }
      row.append(button('برداشتن', 'Remove', null, () => togglePin(name))); order.append(row);
    }
    for (const b of all('[data-side77]', config)) b.setAttribute('aria-pressed', String(b.dataset.side77 === prefs.side));
  }
  const catalogRows = [];
  for (const b of all('[data-destination69]', chooser)) {
    const name = b.dataset.destination69, info = pages[name];
    if (!info) { b.remove(); continue; }
    const row = element('div', 'flow-catalog-row77'); b.before(row); row.append(b);
    b.replaceChildren(icon(info[2]), label(element('span'), info[0], info[1])); b.classList.add('flow-catalog-link77');
    if (name !== 'home') {
      const pin = button('میانبر', 'Pin', 'star', () => togglePin(name), 'flow-pin77'); pin.dataset.pin77 = name; row.append(pin);
    }
    catalogRows.push({row, name});
  }
  catalogSearch.oninput = () => {
    const query = catalogSearch.value.trim().toLocaleLowerCase();
    for (const {row, name} of catalogRows) row.hidden = ![name, ...pages[name].slice(0, 2)].join(' ').toLocaleLowerCase().includes(query);
  };
  function openCatalog(arrange = false) {
    catalogNotice.textContent = ''; config.open = arrange; catalogSearch.value = ''; catalogSearch.oninput(); renderOrder();
    if (!chooser.open) chooser.showModal();
    if (arrange) config.querySelector('summary').focus(); else catalogSearch.focus();
  }
  more.onclick = () => openCatalog();

  // The prototype's undo and search now invoke the actual panel, not a demo history.
  const undo = button('برگرداندن ویرایش', 'Undo edit', 'rotate-ccw', () => { if (w.GHAFState.undo()) w.VarnaActions.refresh(); }, 'flow-header-button77');
  undo.dataset.undo77 = 'true';
  const language = $('button[data-language52]', $('#headerOptions'));
  if (language) { language.classList.add('flow-language77'); $('.topbar').append(language); }
  $('.topbar').append(undo);
  const headerSummary = $('#headerOptions>summary');
  headerSummary.replaceChildren(icon('sliders-horizontal')); headerSummary.title = text('ظاهر و کنترل‌های افتر', 'Appearance & After Effects controls');
  const searchButton = $('#studio30Search'); if (searchButton) { searchButton.replaceChildren(icon('search')); searchButton.title = text('جست‌وجوی ابزارها · Ctrl+K', 'Find tools · Ctrl+K'); }

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
    document.body.style.setProperty('--flow-action78',!cfg&&!light?'#8edfeb':'var(--ui-color-action)');
    document.body.style.setProperty('--flow-on-action78',!cfg&&!light?'#071b29':'var(--ui-color-on-action)');
    if(!cfg&&!light){document.body.style.setProperty('--flow-base77','#061321');document.body.style.setProperty('--flow-end77','#14364a');document.body.style.setProperty('--v48-glyph','#9ce2ed');}
    w.VarnaLiquid48?.refresh();
    paletteState();
  }
  document.addEventListener('varna:palette50', displayPalette);

  // Five task cards and a real three-step starting route, rather than sample content.
  const home = $('#page-home'), hero = element('section', 'flow-hero77');
  const signature = element('b', 'flow-signature77', 'VARNA / MOTION STUDIO'); signature.dir = 'ltr';
  hero.append(signature, label(element('h1'), 'حرفه‌ای بساز. ساده کار کن.', 'Create professionally. Work simply.'), label(element('p'), 'از متن و صدا تا ظاهر و حرکت، ابزارهای واقعی پروژه اینجاست.', 'Real project tools for text, sound, design and motion.'));
  home.prepend(hero);
  const grid = $('.launcher-grid', home); grid.replaceChildren();
  const tasks = [
    ['audio', 'ساخت زیرنویس', 'Create captions', 'از صدای ویدیو کپشن بساز.', 'Create captions from your video’s audio.'],
    ['text', 'طراحی متن', 'Design text', 'ویرایش، فونت، رنگ و حرکت کلمات.', 'Edit words, fonts, colors and motion.'],
    ['table', 'ساخت جدول', 'Create a table', 'خانه‌های قابل ویرایش با ظاهر و موشن.', 'Editable cells with their own look and motion.'],
    ['sfx', 'آماده‌کردن صدا', 'Prepare sound', 'کتابخانهٔ افکت و ساخت صدای محیط.', 'Sound library and generated ambience.'],
    ['brand', 'انتخاب برند', 'Choose a brand', 'ظاهر و فایل‌های همیشگی، در یک‌جا.', 'Reusable looks and assets, together.']
  ];
  for (const [name, fa, english, descFa, descEn] of tasks) {
    const b = element('button', 'flow-task77'); b.type = 'button'; b.dataset.task77 = name;
    const copy = element('span', 'flow-task-copy77'); copy.append(label(element('strong'), fa, english), label(element('small'), descFa, descEn));
    b.append(icon(pages[name][2]), copy, icon('chevron-left')); b.onclick = () => w.VarnaUI.open(name); grid.append(b);
  }
  const homeMore = button('همهٔ ابزارها', 'All tools', 'layout-template', () => openCatalog());
  const start = element('details', 'flow-quickstart77'); start.append(label(element('summary'), 'شروع سریع در سه قدم', 'Quick start in three steps'));
  for (const [i, name] of ['audio', 'text', 'output'].entries()) {
    const b = button((i + 1) + ' · ' + pages[name][0], (i + 1) + ' · ' + pages[name][1], pages[name][2], () => w.VarnaUI.open(name)); start.append(b);
  }
  grid.after(homeMore, start);

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
  const pageStatus = element('p', 'hint'); pageStatus.dataset.flowStatus77 = 'true'; pageStatus.setAttribute('role', 'status');
  $('.flat-status-popup69').append(pageStatus);
  const primaryActions = {
    home: () => openCatalog(), tools: () => { toolLibrary.scrollIntoView({block: 'nearest'}); $('button', toolLibrary).focus(); },
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
  function actionState() {
    if (['table', 'kinetic'].includes(w.VarnaUI.current())) { if (proxy.isConnected) proxy.remove(); pageStatus.hidden = true; return; }
    const name = w.VarnaUI.current(), id = pages[name]?.[5]; primary = id ? document.getElementById(id) : null;
    pageStatus.hidden = false;
    const statusIds = {audio:'modelStatus',text:'sentenceStatus66',motion:'motionDraftStatus',templates:'templateStatus38',bg:'bgEngineStatus',sfx:'sfxAnalysisDetail',music:'cueStatus50',brand:'brandSummary',ai:'localAIStatus',translate:'translateStatus',director:'brainStatus',resources:'resourceSummary',output:'output35Status'};
    const status = document.getElementById(statusIds[name])?.textContent.trim() || text(pages[name][3], pages[name][4]);
    if (pageStatus.textContent !== status) pageStatus.textContent = status;
    if (primary) {
      const titles = {audio:['ساخت زیرنویس','Transcribe'],text:['پیش‌نمایش در افتر','Preview in After Effects'],motion:['اعمال موشن','Apply motion'],templates:['اعمال و ساخت استایل','Apply & build style'],bg:['پیش‌نمایش در افتر','Preview in After Effects'],sfx:['پیشنهاد صداها','Suggest sounds'],music:['ساخت بازه‌های صدا','Generate audio cues'],brand:['اعمال برند','Apply brand'],safe:['اعمال محدودهٔ امن','Apply safe area'],ai:['پیشنهاد اصلاح‌ها','Suggest corrections'],keywords:['پیشنهاد کلمات مهم','Suggest keywords'],translate:['ساخت ترجمه','Translate'],easing49:['اعمال منحنی','Apply curve'],director:['ساخت پیشنهاد','Create plan'],assistant49:['تولید کد','Generate code'],resources:['بررسی مسیرها','Check paths'],output:['ساخت در افتر','Build in After Effects']};
      const short = shell.dataset.panelShort71 === 'true';
      const brief = {text:['نمایش','Preview'],bg:['نمایش','Preview'],motion:['اعمال','Apply'],brand:['اعمال','Apply'],safe:['اعمال','Apply'],easing49:['اعمال','Apply'],translate:['ترجمه','Send'],resources:['بررسی','Check'],ai:['بررسی','Review'],keywords:['پیشنهاد','Review'],sfx:['پیشنهاد','Review']};
      const value = short ? text(...(brief[name] || ['بساز','Build'])) : text(...(titles[name] || [primary.textContent.trim(), primary.textContent.trim()]));
      if (proxy.textContent !== value) proxy.textContent = value; proxy.title = primary.textContent.trim();
      if(proxy.disabled!==primary.disabled)proxy.disabled=primary.disabled; attr(proxy,'data-target77',primary.id);
    } else {
      const value = shell.dataset.panelShort71 === 'true' ? text('ابزارها', 'Tools') : name === 'home' ? text('همهٔ ابزارها', 'All tools') : name === 'settings' ? text('تنظیم رنگ و ظاهر', 'Adjust appearance') : text('انتخاب ابزار', 'Choose a tool');
      if(proxy.textContent!==value)proxy.textContent=value;
      if(proxy.disabled!==!primaryActions[name])proxy.disabled=!primaryActions[name]; if(proxy.hasAttribute('data-target77'))delete proxy.dataset.target77;
    }
    if (!proxy.isConnected) actions.prepend(proxy);
  }
  let scheduled = 0, syncCount78=0, route78='', language78='';
  const motion78=w.matchMedia('(prefers-reduced-motion: reduce)');
  let routeAnimations78=[];
  function animateRoute78(page) {
    routeAnimations78.forEach(a=>a.cancel()); routeAnimations78=[];
    if(motion78.matches||!page?.animate)return;
    const panels=all('[data-focus-panel78=main],.flow-hero77,.launcher-grid',page).filter(n=>!n.parentElement.closest('[data-focus-panel78]')).slice(0,6);
    for(const [i,node]of panels.entries()){const a=node.animate([{opacity:.45,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,delay:i*24,easing:'cubic-bezier(.2,.8,.2,1)'});a.id='flow-route78';routeAnimations78.push(a);}
  }
  motion78.addEventListener('change',()=>{if(motion78.matches){routeAnimations78.forEach(a=>a.cancel());routeAnimations78=[];}});
  function sync() {
    scheduled = 0; syncCount78++;
    const current = w.VarnaUI.current(), info = pages[current]; if (!info) return;
    const headerParent = shell.dataset.panelShort71 === 'true' ? $('#headerOptions .header-options-panel') : $('.topbar');
    for (const n of [language, undo]) if (n && n.parentElement !== headerParent) headerParent.append(n);
    // Only stale navigation classes are cleared; conditionally hidden controls remain hidden.
    const active = $('#page-' + current);
    all('.production-hidden47,.workspace-paged67,.table-paged-out66', active).forEach(n => n.classList.remove('production-hidden47', 'workspace-paged67', 'table-paged-out66'));
    if (current !== 'kinetic') all('.workflow-tab-hidden', active).forEach(n => n.classList.remove('workflow-tab-hidden'));
    const heading = $('#currentPageTitle'); if (heading.textContent !== text(info[0], info[1])) heading.textContent = text(info[0], info[1]);
    if(language78!==String(en())) {
      language78=String(en());
      for (const n of all('[data-fa77]')) { const value = en() ? n.dataset.en77 : n.dataset.fa77; if (n.textContent !== value) n.textContent = value; }
    }
    if(route78!==current){route78=current;animateRoute78(active);}
    // These catalog samples are fixed UI artwork, not the user's caption text.
    for (const n of all('#page-motion .motion-card-preview-inner>span')) if (['VARNA MOTION','MOTION','حرکت'].includes(n.textContent)) {
      const value = text('حرکت', 'MOTION'); if (n.textContent !== value) n.textContent = value;
    }
    attr(catalogSearch,'placeholder',text('جست‌وجوی بخش‌ها…', 'Find a section…')); attr(catalogSearch,'aria-label',text('جست‌وجوی بخش‌ها', 'Find a section'));
    attr(range,'aria-label',text('محو کردن پس‌زمینهٔ رابط', 'Interface background blur'));
    renderDock(); actionState(); paletteState();
  }
  function schedule() { if (!scheduled) scheduled = requestAnimationFrame(sync); }
  document.addEventListener('varna:page', schedule);
  document.addEventListener('varna:language52', schedule);
  // Observe only real primary actions/status. Numeric widgets and animated previews
  // mutate their own DOM; those updates must not rebuild the rail every frame.
  for(const info of Object.values(pages))if(info[5]){const n=document.getElementById(info[5]);if(n)new MutationObserver(actionState).observe(n,{attributes:true,attributeFilter:['disabled']});}
  for(const id of ['modelStatus','sentenceStatus66','motionDraftStatus','templateStatus38','bgEngineStatus','sfxAnalysisDetail','cueStatus50','brandSummary','localAIStatus','translateStatus','brainStatus','resourceSummary','output35Status']){const n=document.getElementById(id);if(n)new MutationObserver(actionState).observe(n,{childList:true,characterData:true,subtree:true});}
  new MutationObserver(schedule).observe(shell, {attributes:true, attributeFilter:['data-panel-short71']});
  // Keep footer progress/disabled labels synchronized without polling or rebuilding fields.
  document.addEventListener('varna:progress', actionState);
  applyBlur(); displayPalette(); renderOrder(); renderDock(); w.VarnaPilot69.sync(); sync();
  w.VarnaFlow77 = {sync, openCatalog, version: 77, pages: Object.keys(pages), preferences: () => JSON.parse(JSON.stringify(prefs)), performance:()=>({syncs:syncCount78}), focus:essential78};
})(window);
