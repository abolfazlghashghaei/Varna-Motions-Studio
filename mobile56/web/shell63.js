/* v9 design adapter. Commands use the existing media/project engine; no demo state. */
(function (w) {
  'use strict';
  let route = 'home', busy = false, queuedAction = null;
  const $ = s => document.querySelector(s);
  const startupTag = $('#home .hero-rc47-tag'), startupMarkup = startupTag?.innerHTML;
  function refresh() {
    if (!w.MobileApp) return;
    const p = MobileApp.savedProject();
    $('#currentProject63').textContent = p.name;
    $('#projectDetails63').textContent = p.width + ' × ' + p.height + ' · ' + p.fps + ' FPS';
  }
  function show(value) {
    if (!['home','editor','projects','servers'].includes(value)) return;
    if (w.MobileApp && MobileApp.state().exporting) return;
    if (w.MobileApp) MobileApp.pause();
    route=value;
    document.querySelectorAll('#shell63 > .view').forEach(el => {
      const active=el.id===value; el.classList.toggle('active',active); el.inert=!active;
    });
    refresh();
    document.dispatchEvent(new CustomEvent('mobile-route63',{detail:value}));
    if (value==='editor') requestAnimationFrame(()=>{w.dispatchEvent(new Event('resize'));MobileApp.render();});
  }
  async function command(action) {
    if (action==='logo') {if(w.triggerVarnaV)w.triggerVarnaV();return;}
    if (!MobileApp.ready) {queuedAction=action;if(startupTag)startupTag.textContent='در حال آماده‌سازی برنامه…';return;}
    if (busy) return;
    if (['home','projects','servers'].includes(action)) {show(action);return;}
    busy=true;
    try {
      show('editor');
      await MobileApp.continueProject();
      switch(action) {
        case 'editor': break;
        case 'new': MobileApp.newProject();break;
        case 'project': MobileApp.openProject();break;
        case 'appearance': MobileApp.appearance();break;
        case 'captions': MobileApp.setTab('text');break;
        case 'glass': MobileApp.addGraphic('shape');MobileApp.change(doc=>{doc.layers52.find(x=>x.id===MobileApp.state().selected).material='glass';});break;
        case 'motion': MobileApp.openPresets();break;
        case 'table': MobileApp.addGraphic('table');break;
        case 'effects': MobileApp.setTab('style');break;
        case 'audio': MobileApp.setTab('audio');break;
        case 'ai': MobileApp.openSpeech();break;
        case 'brand': MobileApp.openBrand();break;
        case 'export': MobileApp.openExport();break;
        case 'connect': MobileApp.openConnection();break;
      }
    } catch(error) {
      const status=$('#status');status.textContent=error.message;status.setAttribute('role','alert');
    } finally {busy=false;}
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)command(b.dataset.action);});
  $('#home63').onclick=()=>show('home');
  document.addEventListener('mobile-ready63',()=>{refresh();if(startupTag&&queuedAction){startupTag.innerHTML=startupMarkup;startupTag.querySelectorAll('[data-i18n]').forEach(el=>{const pair=el.dataset.i18n.split('|');el.textContent=document.documentElement.lang==='en'?pair[0]:pair[1];});}const next=queuedAction;queuedAction=null;if(next)command(next);});
  w.MobileShell63={show,command,route:()=>route};
  show('home');
})(window);
