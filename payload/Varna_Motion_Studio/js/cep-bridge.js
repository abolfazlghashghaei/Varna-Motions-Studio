(function(global){
  'use strict';
  const api={available:!!global.__adobe_cep__?.evalScript,capabilities:null,blocked:false,lastTimeoutAt:0};
  let queue=Promise.resolve(),pendingCalls=0,peekPending=false;
  api.nativeBusy=null;api.outputBusy=false;api.lastSettled=null;api.bootError43=null;
  const idleWaiters=new Set(),outputMethods=/^(ping|capabilities|checkOutput|getOutputComps36|getActiveCompInfo|detectTextBox2|removeLivePreview|endMotionPreview|beginOutputSession|buildOutput|commitOutputSession|abortOutputSession|getOutputSession41)$/;
  const failure=(code,message,method)=>Object.assign(Error(message),{code,method});
  function idle(){if(!api.nativeBusy&&!peekPending)for(const fn of Array.from(idleWaiters))fn();}
  function release(record){if(api.nativeBusy===record)api.nativeBusy=null;idle();}
  api.waitForIdle=function(options={}){if(!api.nativeBusy&&!peekPending)return Promise.resolve();return new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);idleWaiters.delete(done);resolve();},timer=setTimeout(()=>{idleWaiters.delete(done);reject(failure('HOST_STILL_BUSY','عملیات قبلی هنوز در افتر پایان نیافته؛ دستور دیگری ارسال نشد.'));},options.timeout||120000);idleWaiters.add(done);});};
  api.waitQueue=function(){return queue;};
  const quote=s=>JSON.stringify(String(s)).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const messages={NO_COMP:'ابتدا یک Composition را فعال کنید.',NO_CAPTIONS:'متنی برای ساخت وجود ندارد.',TIME_REMAP_UNSUPPORTED:'برای لایه دارای Time Remap ابتدا صدا را رندر کنید.',NEGATIVE_STRETCH_UNSUPPORTED:'صدای معکوس را ابتدا رندر کنید.',HOST_TIMEOUT:'پاسخ After Effects نرسید. پس از پایان عملیات، اتصال را دوباره بررسی کنید.'};
  api.call=function(method,payload,options={}){
    pendingCalls++;
    const task=()=>new Promise((resolve,reject)=>{
      if(!api.available)return reject(Error('اتصال به After Effects برقرار نیست'));
      if(api.outputBusy&&!outputMethods.test(method))return reject(failure('HOST_PAUSED','این عملیات تا پایان خروجی متوقف است.',method));
      if(api.nativeBusy)return reject(failure('HOST_STILL_BUSY','افتر هنوز مشغول '+api.nativeBusy.method+' است؛ دستور تکراری ارسال نشد.',method));
      if(peekPending)return api.waitForIdle({timeout:120000}).then(()=>task().then(resolve,reject),reject);
      if(api.blocked&&method!=='capabilities'&&method!=='ping')return reject(failure(api.bootError43?'HOST_BOOT_ERROR':'HOST_TIMEOUT',api.bootError43||messages.HOST_TIMEOUT,method));
      if(!/^[A-Za-z][A-Za-z0-9]*$/.test(method))return reject(Error('نام عملیات Host معتبر نیست'));
      let enc,script;
      try{
        enc=encodeURIComponent(JSON.stringify(payload||{}));
        let hostFile=decodeURIComponent(String(global.location?.pathname||'')).replace(/\/(?:index|premiere|resolve|editor)\.html$/i,'/host/ghaf_host.jsx');
        if(/^\/[A-Za-z]:/.test(hostFile))hostFile=hostFile.slice(1);
        script='(function(){try{var p='+quote(hostFile)+';var r=(typeof $!=="undefined"&&$.global)?$.global:this;var GHAFHost=r.VarnaHost43;if(!GHAFHost||GHAFHost._bridgeRevision!=="rc47.7"||GHAFHost._tableRevision!==1||GHAFHost._bootReady43!==true||!GHAFHost._kinetic45||typeof GHAFHost._kinetic45.resolve!=="function"||typeof GHAFHost.dispatch!=="function"||typeof GHAFHost._err!=="function"||typeof GHAFHost._ok!=="function"){$.evalFile(new File(p));GHAFHost=r.VarnaHost43;}if(!GHAFHost||GHAFHost._bridgeRevision!=="rc47.7"||GHAFHost._tableRevision!==1||GHAFHost._bootReady43!==true||!GHAFHost._kinetic45||typeof GHAFHost._kinetic45.resolve!=="function"||typeof GHAFHost.dispatch!=="function"||typeof GHAFHost._err!=="function"||typeof GHAFHost._ok!=="function")throw Error("HOST_INITIALIZATION_INCOMPLETE");GHAFHost._filePath=new File(p).fsName;return GHAFHost.dispatch('+quote(method)+','+quote(enc)+');}catch(e){return "VARNA_HOST_BOOT_ERROR: "+String(e)+" [line "+String(e.line||"?")+"] [file "+String(e.fileName||"ghaf_host.jsx")+"]";}})()';
      }catch(e){return reject(e);}
      let finished=false;
      const timeout=options.timeout||(/^(checkOutput|getOutputComps36)$/.test(method)?120000:/OutputSession/.test(method)?600000:/build|render|PreviewFrame|LivePreview|refreshCaptionStyles|vendorEffectSchema|applyVendorValues|Glassary|scriptTool|applySfxPlan/i.test(method)?180000:60000);
      const record={method,started:Date.now(),timedOut:false};api.nativeBusy=record;
      const timer=setTimeout(()=>{finished=true;record.timedOut=true;api.blocked=true;api.lastTimeoutAt=Date.now();reject(failure('HOST_TIMEOUT','پاسخ عملیات «'+method+'» هنوز نرسیده؛ پایان اجرای آن در افتر تأیید نشده است.',method));},timeout);
      try{global.__adobe_cep__.evalScript(script,res=>{
        release(record);api.lastSettled={method,timedOut:record.timedOut,response:String(res),at:Date.now()};if(finished)return;finished=true;clearTimeout(timer);
        let x;try{x=JSON.parse(res);}catch(e){if(String(res).indexOf('VARNA_HOST_BOOT_ERROR:')>=0){api.blocked=true;api.bootError43='بارگذاری بخش افتر پلاگین انجام نشد: '+String(res);return reject(failure('HOST_BOOT_ERROR',api.bootError43,method));}return reject(failure('HOST_INVALID_RESPONSE','پاسخ نامعتبر از After Effects: '+String(res).slice(0,400),method));}
        if(!x||typeof x!=='object'||Array.isArray(x)||typeof x.ok!=='boolean')return reject(failure('HOST_INVALID_RESPONSE','ساختار پاسخ After Effects معتبر نیست: '+String(res).slice(0,400),method));
        if(x.ok){api.blocked=false;api.bootError43=null;resolve(x.data);}else reject(Error(messages[x.error]||x.error||'عملیات After Effects انجام نشد'));
      });}catch(e){clearTimeout(timer);finished=true;release(record);reject(e);}
    });
    const result=queue.then(task,task);queue=result.catch(()=>{});result.then(()=>pendingCalls--,()=>pendingCalls--);return result;
  };
  api.peekTime=function(){
    if(!api.available||api.blocked||api.nativeBusy||api.outputBusy||pendingCalls||peekPending)return Promise.resolve(null);
    peekPending=true;
    return new Promise(resolve=>{
      let settled=false;
      const finish=value=>{if(!settled){settled=true;clearTimeout(timer);resolve(value);}};
      const timer=setTimeout(()=>finish(null),2500);
      try{global.__adobe_cep__.evalScript('(function(){try{var r=(typeof $!=="undefined"&&$.global)?$.global:this;var GHAFHost=r.VarnaHost43;if(!GHAFHost||GHAFHost._bootReady43!==true||GHAFHost._bridgeRevision!=="rc47.7"||GHAFHost._tableRevision!==1||typeof GHAFHost.getTimelineTime!=="function")return "null";return GHAFHost.getTimelineTime();}catch(e){return "null";}})()',raw=>{
        peekPending=false;idle();let x=null;try{x=JSON.parse(raw);}catch(e){}finish(x&&x.ok&&x.data&&Number.isFinite(x.data.time)?x.data:null);
      });}catch(e){peekPending=false;idle();finish(null);}
    });
  };
  api.reconnect=async function(){if(api.nativeBusy||peekPending)throw failure('HOST_STILL_BUSY','افتر هنوز عملیات قبلی را تمام نکرده؛ اتصال مجدد موازی انجام نشد.');api.blocked=false;try{await api.call('ping',{}, {timeout:12000});api.capabilities=await api.call('capabilities',{}, {timeout:12000});return api.capabilities;}catch(e){api.blocked=true;throw Error('اتصال CEP برقرار است اما After Effects پاسخ نداد: '+e.message);}};
  api.diagnose=async function(){api.capabilities=await api.call('capabilities',{}, {timeout:12000});return api.capabilities;};
  api.getHostEnvironment=function(){try{return JSON.parse(global.__adobe_cep__.getHostEnvironment());}catch(e){return null;}};
  api.chooseFile=function(title,extensions){try{const r=global.cep?.fs?.showOpenDialog(false,false,title||'Select file','',extensions||[]);return r?.data?.[0]||'';}catch(e){return '';}};
  api.chooseFiles=function(title,extensions){try{const r=global.cep?.fs?.showOpenDialog(true,false,title||'Select files','',extensions||[]);return Array.isArray(r?.data)?r.data:[];}catch(e){return [];}};
  api.chooseFolder=function(title){try{const r=global.cep?.fs?.showOpenDialog(false,true,title||'Select folder','',[]);return r?.data?.[0]||'';}catch(e){return '';}};
  api.vendorEval=function(script,callback){pendingCalls++;const task=()=>new Promise(resolve=>{
    if(api.nativeBusy||api.outputBusy||api.blocked)return resolve('EvalScript error: Host busy; no script sent');
    if(peekPending)return api.waitForIdle({timeout:120000}).then(()=>task().then(resolve),()=>resolve('EvalScript error: Host busy'));
    const record={method:'vendorEval',started:Date.now(),timedOut:false};api.nativeBusy=record;let done=false;
    const finish=v=>{release(record);if(done)return;done=true;clearTimeout(timer);resolve(String(v));};
    const timer=setTimeout(()=>{done=true;record.timedOut=true;api.blocked=true;resolve('EvalScript error: Host timeout; operation may still be running');},180000);
    try{global.__adobe_cep__.evalScript(String(script),finish);}catch(e){finish('EvalScript error: '+e.message);}
  });const result=queue.then(task,task);queue=result.catch(()=>{});result.then(v=>{pendingCalls--;if(callback)callback(v);});return result;};
  global.GHAFBridge=api;
})(window);
