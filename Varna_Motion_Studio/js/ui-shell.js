(function(){'use strict';
const $=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));
const paths={timeline:'M3 6h18M3 12h18M3 18h18M7 3v18M11 8h7m-7 6h4',wave:'M4 10v4m4-8v12m4-15v18m4-15v12m4-8v4',text:'M5 5h14M12 5v14M8 19h8',glass:'M5 5h14v14H5zM8 8h8m-8 4h4',motion:'m8 5 11 7-11 7z',video:'M3 5h18v14H3zM9 8l6 4-6 4z',music:'M9 17V6l10-2v11M9 17c0 4-6 4-6 1s6-4 6-1m10-2c0 4-6 4-6 1s6-4 6-1',table:'M4 4h16v16H4zM4 10h16M10 4v16',safe:'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M8 8h8v8H8z',export:'M12 15V3m-4 4 4-4 4 4M4 14v7h16v-7'};
all('[data-icon]').forEach(e=>e.innerHTML='<svg viewBox="0 0 24 24"><path d="'+paths[e.dataset.icon]+'"/></svg>');
let current='home',history=[],goingBack=false;const tabSets=new Map();
function nav(name){$('.nav-item[data-page="'+name+'"]')?.click();}
all('.nav-item[data-page]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.page;if(name!==current&&!goingBack)history.push(current);current=name;document.body.dataset.page=name;$('#workspaceBack').hidden=name==='home';$('#workspace').scrollTop=0;$('#headerOptions').open=false;document.dispatchEvent(new CustomEvent('varna:page',{detail:{name}}));}));
all('[data-launch]').forEach(button=>button.addEventListener('click',()=>nav(button.dataset.launch)));
function back(){if(current==='home')return;goingBack=true;nav(history.pop()||'home');goingBack=false;}
$('#workspaceBack').addEventListener('click',back);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&current!=='home'&&!all('.ghaf-modal').some(x=>!x.hidden)){e.preventDefault();back();}});
function category(page,card,index){
 const has=id=>!!card.querySelector('#'+id)||card.id===id,title=card.querySelector('.card-title b')?.textContent||'';
 if(page.id==='page-text'){if(has('layoutLines')||/Justify|زبان دیگر/.test(title))return ['layout','چیدمان و زبان'];if(has('fontSelect')||has('textStyleGlass')||has('cosmicTextCard'))return ['appearance','فونت و استایل'];return ['edit','متن و زمان'];}
 if(page.id==='page-bg')return card.id==='vendorEffectCard'?['effect','تنظیمات اصلی افکت']:['box','مدل و کادر'];
 if(page.id==='page-motion'){if(has('motionRender')){card.classList.add('workflow-preview');return ['always','پیش‌نمایش'];}if(has('animScope'))return ['always','محدوده'];if(has('typingStudio'))return ['typing','تایپ و کادر'];if(has('cuttanaStudio')||card.classList.contains('companion-card')||/ابزارهای نوشتار/.test(title))return ['tools','ابزارهای نوشتار'];if(has('textyleBridge'))return ['library','پریست‌های Textyle'];if(has('animSimple')||has('animNative'))return ['motion','موشن و زمان'];return ['builder','ساخت موشن'];}
 if(page.id==='page-audio')return /لاگ فنی/.test(title)?['diagnostic','عیب‌یابی']:['source','منبع و زیرنویس'];
 if(page.id==='page-table')return /ساختار|محتوا/.test(title)?['structure','ساختار و خانه‌ها']:/Preview/.test(title)?['always','پیش‌نمایش']:['look','زمان و ظاهر'];
 if(page.id==='page-sfx')return card.id==='brainMusic'?['music','موزیک و تولید صدا']:/کتابخانه/.test(title)?['library','کتابخانه SFX']:/تراز/.test(title)?['mix','تراز صدا']:['sfx','تحلیل و جای‌گذاری SFX'];
 if(page.id==='page-settings')return card.id==='brainAudioModelSettings'?['models','مدل‌ها']:/پروفایل|Import|Export|پیش‌فرض/.test(title)?['profiles','پروفایل و پشتیبان']:['workspace','چیدمان و اتصال'];
 if(page.id==='page-ai')return /حافظه|واژه‌نامه/.test(title)?['memory','حافظه و قوانین']:/چت/.test(title)?['chat','چت پروژه']:['review','اصلاح و بررسی'];
 if(page.id==='page-broll'){if(has('videoSetup'))return ['setup','شروع پروژه'];if(has('brollChooseFolder'))return ['files','رسانه‌ها'];if(has('brollPlayer'))return ['shots','نمایشگر منبع'];return ['timeline','تدوین و Inspector'];}
 return ['main','اصلی'];
}
all('.page:not(#page-home):not(#page-tools):not(#page-broll)').forEach(page=>{
 const cards=Array.from(page.querySelectorAll('article.card')).filter(c=>!c.parentElement.closest('article.card'));const groups=new Map();
 cards.forEach((card,i)=>{if(!card.id)card.id='workflow-'+page.id+'-card-'+i;const [key,label]=category(page,card,i);card.dataset.workflowGroup=key;if(key!=='always'&&!groups.has(key))groups.set(key,label);});if(groups.size<2)return;
 const bar=document.createElement('div');bar.className='workflow-tabs';bar.setAttribute('role','tablist');bar.setAttribute('aria-label','بخش‌های '+(page.querySelector('h1')?.textContent||'کار'));page.insertBefore(bar,page.firstElementChild?.nextSibling||page.firstChild);
 let active=groups.keys().next().value;const buttons=new Map();
 function select(key){if(!groups.has(key))return;active=key;page.dataset.workflowTab=key;for(const [k,b] of buttons){b.setAttribute('aria-selected',String(k===key));b.tabIndex=k===key?0:-1;b.classList.toggle('active',k===key);}cards.forEach(card=>{const hide=card.dataset.workflowGroup!=='always'&&card.dataset.workflowGroup!==key;if(card.classList.contains('workflow-tab-hidden')!==hide)card.classList.toggle('workflow-tab-hidden',hide);});}
 for(const [key,label] of groups){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.workflowTab=key;b.setAttribute('role','tab');b.setAttribute('aria-controls',cards.filter(c=>c.dataset.workflowGroup===key).map(c=>c.id).join(' '));b.addEventListener('click',()=>select(key));buttons.set(key,b);bar.appendChild(b);}
 bar.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const keys=[...groups.keys()],i=keys.indexOf(active),j=e.key==='Home'?0:e.key==='End'?keys.length-1:(i+(e.key==='ArrowLeft'?1:-1)+keys.length)%keys.length;select(keys[j]);buttons.get(keys[j]).focus();});
 tabSets.set(page.id,{select,cards});select(active);
});
function reveal(el){const page=el?.closest('.page'),card=el?.closest('article.card');if(page&&card&&card.dataset.workflowGroup!=='always')tabSets.get(page.id)?.select(card.dataset.workflowGroup);for(let p=el?.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;}
// No focus-triggered auto-collapse: keyboard and pointer cannot undo each other's choice.
const connection=$('.nav-connection .status-pill');if(connection)$('#launcherConnection').appendChild(connection);
let progressTimer;document.addEventListener('varna:progress',e=>{clearTimeout(progressTimer);const p=$('#workflowProgress');p.hidden=false;p.classList.toggle('indeterminate',e.detail.percent==null);p.querySelector('i').style.width=(e.detail.percent||0)+'%';p.querySelector('em').textContent=e.detail.label||'';if(e.detail.percent===100)progressTimer=setTimeout(()=>p.hidden=true,1200);});
window.VarnaUI={open:nav,back,reveal,tab:(page,key)=>page==='broll'?window.VarnaVideoLayout?.focus(key):tabSets.get('page-'+page)?.select(key),current:()=>current};nav('home');
})();
