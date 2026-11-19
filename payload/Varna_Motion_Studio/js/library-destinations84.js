/* Independent, pinnable destinations share one renderer; host connections stay put. */
(function(w){'use strict';if(!document.documentElement.hasAttribute('data-ui77'))return;
const H=w.VarnaFeatureHub83,P=w.VarnaLibraryPreview84,UI=w.VarnaUI,$=(s,r=document)=>r.querySelector(s),en=()=>w.VarnaI18n52?.language()==='en',t=(a,b)=>en()?b:a,records=H.records();
const definitions=[
 ['hooks','هوک‌ها و عنوان‌ها','Hooks & titles','type',['hook-titles-25','social-hooks-100'],['native-titles']],
 ['lower-thirds','معرفی و نام‌نوشته','Lower thirds','layout-template',['lower-thirds-100'],[]],
 ['social','عناصر شبکه‌های اجتماعی','Social elements','layout-template',['instagram-ui-100'],[]],
 ['backgrounds','بک‌گراندهای آماده','Background designs','layers',['saas-gradients-20'],['native-gradients']],
 ['transitions','ترنزیشن‌ها','Transitions','film',['light-leaks','paper-burn'],[]],
 ['effects','افکت‌ها و متریال','Effects & materials','wand-sparkles',['holographic-foil','highlighter-2','neon-dj-subtitle'],['native-highlight','tool:orb','tool:glassary','tool:writetyper','tool:cuttana','tool:smart']],
 ['amanow','AMANOW','AMANOW','layout-template',['atools-2.106'],[]]
];let destination=null,renderEpoch=0;const originalOpen=UI.open,originalCatalog=H.catalog,originalTitle=H.title;
const page=$('#page-tools'),root=document.createElement('section');root.className='library-destinations84';page.append(root);
function element(tag,cls){const n=document.createElement(tag);if(cls)n.className=cls;return n;}
function icon(name){const s=element('span','feature-icon83');s.setAttribute('aria-hidden','true');s.innerHTML=w.VarnaIcons30[name]||w.VarnaIcons30.layers;return s;}
function definition(key){return definitions.find(d=>d[0]===key);}
function find(record){return definitions.find(d=>d[4].includes(record.pack)||d[5].includes(record.key));}
function route(){return destination?'library-'+destination:null;}
function title(){const active=H.active();if(active)return originalTitle();const d=definition(destination);return d?t(d[1],d[2]):t('قالب‌ها و افکت‌ها','Templates & effects');}
function signal(){document.body.dataset.destination84=destination||'';w.VarnaFlow77.sync();}
function card(d){const b=element('button','feature-card83');b.type='button';b.dataset.collection84=d[0];b.append(icon(d[3]));const text=element('span','feature-card-copy83'),h=element('b'),desc=element('span');h.textContent=t(d[1],d[2]);desc.textContent=d[0]==='hooks'?t('۱۲۵ هوک ارسالی در یک بخش؛ اول پیش‌نمایش، سپس اعمال.','125 supplied hooks together; preview before Apply.'):t('پیش‌نمایش‌ها و تنظیمات مستقل این مجموعه','This collection’s own previews and controls');text.append(h,desc);b.append(text);b.onclick=()=>open(d[0]);return b;}
async function catalog(key=destination){destination=definition(key)?key:null;const token=++renderEpoch;originalCatalog({internal84:true});$('.feature-hub83').hidden=true;root.hidden=false;root.querySelectorAll('video').forEach(v=>{v.pause();v.removeAttribute('src');v.load();});root.replaceChildren();
const head=element('header','feature-head83'),h=element('h2');h.textContent=title();head.append(h);if(destination){const back=element('button','btn secondary');back.textContent=t('همهٔ مجموعه‌ها','All collections');back.onclick=()=>catalog(null);head.append(back);}root.append(head);
if(!destination){const grid=element('div','feature-deck83');grid.append(...definitions.map(card));root.append(grid);signal();return;}
const d=definition(destination),search=element('input','feature-search83');search.type='search';search.placeholder=t('جست‌وجو در همین مجموعه…','Search this collection…');search.setAttribute('aria-label',search.placeholder);root.append(search);const grid=element('div','asset-grid84');root.append(grid);signal();await P.ready;if(token!==renderEpoch)return;
let limit=12;const more=element('button','btn secondary');more.textContent=t('نمایش طرح‌های بیشتر','Show more designs');more.onclick=()=>{limit+=12;draw();};root.append(more);
function draw(){grid.replaceChildren();const q=search.value.trim().toLowerCase(),items=P.items().filter(x=>d[4].includes(x.pack)&&(!q||[x.composition,x.pack,...x.folders||[]].join(' ').toLowerCase().includes(q)));
for(const item of items.slice(0,limit)){const record=records.find(r=>r.pack===item.pack),b=element('button','asset-card84');b.type='button';b.dataset.asset84=item.key;b.append(P.viewer(record,item,true));const label=element('b');label.textContent=item.composition+(item.orientation==='portrait'?t(' · عمودی',' · portrait'):'');b.append(label);if(item.uniqueRenderName&&w.require&&w.__adobe_cep__){let hover84=0;b.addEventListener('pointerenter',()=>{hover84=setTimeout(()=>P.renderOriginal(item,b.querySelector('.asset-thumb84')),700);});b.addEventListener('pointerleave',()=>clearTimeout(hover84));}b.onclick=async()=>{H.open(record.key);await P.ready;await new Promise(r=>setTimeout(r,0));P.selectItem(item);};grid.append(b);}
for(const key of d[5]){const r=records.find(x=>x.key===key);if(!r||q&&![r.fa,r.en].join(' ').toLowerCase().includes(q))continue;const b=element('button','asset-card84');b.type='button';b.dataset.feature84=r.key;b.append(P.viewer(r,null,true));const label=element('b');label.textContent=t(r.fa,r.en);b.append(label);b.onclick=()=>H.open(r.key);grid.append(b);}
for(const pack of d[4]){if(P.items().some(x=>x.pack===pack))continue;const r=records.find(x=>x.pack===pack);if(!r||q&&![r.fa,r.en].join(' ').toLowerCase().includes(q))continue;const b=element('button','asset-card84');b.type='button';b.dataset.feature84=r.key;b.append(P.viewer(r));const label=element('b');label.textContent=t(r.fa,r.en);b.append(label);b.onclick=()=>H.open(r.key);grid.append(b);}more.hidden=items.length<=limit;}
search.oninput=()=>{limit=12;draw();};draw();}
function open(key){if(UI.current()!=='tools')originalOpen('tools');catalog(key);}
UI.open=function(name){if(name.startsWith('library-')&&definition(name.slice(8))){open(name.slice(8));return;}if(name!=='tools'){destination=null;root.hidden=true;}originalOpen(name);};
const previousPrimary=H.primary;H.primary=()=>{if(H.active())return previousPrimary();const target=root.querySelector('input,button');target?.focus();};H.title=title;
document.addEventListener('varna:feature83',()=>{const key=H.active();if(key){const d=find(records.find(r=>r.key===key)||{});if(d)destination=d[0];root.hidden=true;document.body.dataset.destination84=destination||'';}});
document.addEventListener('varna:page',e=>{if(e.detail.name!=='tools'){root.querySelectorAll('video').forEach(v=>v.pause());root.hidden=true;}});
const captureBack=e=>{if(UI.current()!=='tools'||document.querySelector('dialog[open]'))return;if(H.active()){e.preventDefault();e.stopImmediatePropagation();catalog();}else if(destination){e.preventDefault();e.stopImmediatePropagation();catalog(null);}};$('#workspaceBack').addEventListener('click',captureBack,true);
w.VarnaDestinations84={open,catalog,route,title,definitions:()=>definitions.map(x=>x.slice(0,4))};
for(const d of definitions)w.VarnaFlow77.registerDestination84('library-'+d[0],[d[1],d[2],d[3],t('اول پیش‌نمایش؛ ورود فایل اصلی فقط با اعمال.','Preview first; original files enter only on Apply.'),'Preview first; original files enter only on Apply.',null]);
const home=element('section','library-home84'),heading=element('h2'),homeGrid=element('div','feature-deck83');heading.textContent=t('قالب‌ها، موشن و افکت‌های آماده','Templates, motion & effects');homeGrid.append(...definitions.map(card));home.append(heading,homeGrid);$('#page-home').append(home);
P.selectItem=async item=>{await P.selectAsset(item.asset,item.key);};
document.addEventListener('varna:language52',()=>{heading.textContent=t('قالب‌ها، موشن و افکت‌های آماده','Templates, motion & effects');homeGrid.replaceChildren(...definitions.map(card));if(UI.current()==='tools'&&!H.active())catalog();});
})(window);
