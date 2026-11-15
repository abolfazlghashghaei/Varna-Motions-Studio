/* AmanowTools — постоянное хранилище настроек панели (05.10.2026).

   Почему. CEP держит localStorage панели во временной папке системы
   (%TEMP%\cep_cache\AEFT_<версия AE>_<id панели>\Local Storage) и ОТДЕЛЬНО
   для каждой версии After Effects. Обновился AE (26.3 -> 26.5) — панель
   открывается с пустым хранилищем: пропадают свои категории Save Objects,
   палитры, раскладки колеса, настройки субтитров, Save у анимаций. То же
   бывает после чистки временных файлов Windows/macOS.

   Что делаем. Каждую запись панели (ключи amanow_*, amdef:*, ammotion*)
   дублируем в файл <userData>/AmanowTools/panel_settings.json — рядом с
   save_objects, которые как раз переживают и обновления, и чистки. При
   запуске возвращаем из файла ТОЛЬКО то, чего в localStorage нет: свежие
   значения этой машины и этого окна никогда не перезаписываются.

   Несколько окон (панель и плавающие карточки) пишут в один файл, поэтому
   запись идёт по ключам: перед записью файл перечитывается и меняются только
   ключи, тронутые в этом окне. Кеши и служебные отметки не сохраняем.

   Подключается ПЕРВЫМ скриптом страницы, до main.js и встроенных скриптов,
   чтобы всё, что читает настройки при запуске, уже видело восстановленное.
   ES5: работает в CEF 61 (After Effects 2020). */
(function(){
  try{
    var LS=window.localStorage;
    if(!LS || !window.cep || !window.cep.fs || !window.__adobe_cep__ || !window.Storage) return;

    var raw=""; try{ raw=window.__adobe_cep__.getSystemPath("userData"); }catch(eP){ return; }
    var u=String(raw||"").replace(/^file:\/\//,"").replace(/^\/([A-Za-z]:)/,"$1");
    try{ u=decodeURIComponent(u); }catch(eD){}
    if(!u) return;
    var win=/^[A-Za-z]:/.test(u), sep=win?"\\":"/";
    u=(win?u.replace(/\//g,"\\"):u.replace(/\\/g,"/")).replace(/[\\\/]+$/,"");
    var dir=u+sep+"AmanowTools", file=dir+sep+"panel_settings.json";
    try{ window.cep.fs.makedir(dir); }catch(eM){}

    var KEEP=/^(amanow_|amdef:|ammotion)/;
    /* кеши и служебное: восстанавливать их вредно или бессмысленно */
    var SKIP=/^amanow_(libc|upd_ts|srv|card_last_|cache|tmp)/;
    function keep(k){ return typeof k==="string" && KEEP.test(k) && !SKIP.test(k); }

    function readFile(){
      try{
        var r=window.cep.fs.readFile(file);
        if(r && r.err===0 && r.data){
          var o=JSON.parse(r.data);
          if(o && typeof o==="object" && o.data && typeof o.data==="object") return o;
        }
      }catch(eR){}
      return null;
    }

    var P=window.Storage.prototype, oGet=P.getItem, oSet=P.setItem, oRem=P.removeItem;
    var pend={}, dirty=false, timer=null, k;

    /* 1) вернуть потерянное */
    var saved=readFile(), restored=0;
    if(saved){
      for(k in saved.data){
        if(!saved.data.hasOwnProperty(k) || !keep(k)) continue;
        if(k==="__proto__"||k==="prototype"||k==="constructor") continue;
        var v=saved.data[k];
        if(typeof v!=="string") continue;
        try{ if(oGet.call(LS,k)===null){ oSet.call(LS,k,v); restored++; } }catch(eS){}
      }
    }

    function flush(){
      timer=null;
      if(!dirty) return;
      dirty=false;
      var cur=readFile() || {v:1, data:{}};
      for(var p in pend){
        if(!pend.hasOwnProperty(p)) continue;
        if(pend[p]===null) delete cur.data[p]; else cur.data[p]=pend[p];
      }
      pend={};
      cur.v=1; cur.t=(new Date()).getTime();
      try{ window.cep.fs.writeFile(file, JSON.stringify(cur)); }catch(eW){}
    }
    function later(){ dirty=true; if(!timer) timer=setTimeout(flush, 500); }

    /* 2) то, что есть здесь, но ещё не попало в файл (первый запуск с этой
       версией: в файл уходит всё накопленное раньше) */
    try{
      for(var i=0;i<LS.length;i++){
        k=LS.key(i);
        if(!keep(k)) continue;
        if(saved && saved.data.hasOwnProperty(k)) continue;
        pend[k]=String(oGet.call(LS,k)); dirty=true;
      }
    }catch(eL){}
    if(dirty) later();

    /* 3) дальше каждая запись панели сразу дублируется в файл */
    P.setItem=function(key, val){
      oSet.call(this, key, val);
      try{ if(this===LS && keep(String(key))){ pend[String(key)]=String(val); later(); } }catch(e1){}
    };
    P.removeItem=function(key){
      oRem.call(this, key);
      try{ if(this===LS && keep(String(key))){ pend[String(key)]=null; later(); } }catch(e2){}
    };
    /* окно закрывают — дописать немедленно, не дожидаясь таймера */
    window.addEventListener("beforeunload", function(){ try{ if(timer){ clearTimeout(timer); } flush(); }catch(e3){} });

    window.AM_PERSIST={ file:file, restored:restored, flush:flush };
  }catch(e){}
})();
