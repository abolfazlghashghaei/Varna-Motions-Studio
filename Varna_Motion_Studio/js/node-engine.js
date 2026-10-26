(function(global){
  'use strict';
  const nodeRequire = global.require || (typeof require !== 'undefined' ? require : null);
  if(!nodeRequire){ global.GHAFNode={available:false}; return; }
  const fs=nodeRequire('fs'), path=nodeRequire('path'), os=nodeRequire('os'), cp=nodeRequire('child_process'), http=nodeRequire('http'), https=nodeRequire('https'), zlib=nodeRequire('zlib'), crypto=nodeRequire('crypto');

  const api={available:true};
  api.packProjectState=function(state){const data=zlib.deflateSync(Buffer.from(JSON.stringify(state),'utf8')).toString('base64');return {version:1,hash:crypto.createHash('sha256').update(data).digest('hex'),chunks:data.match(/.{1,12000}/g)||[]};};
  api.unpackProjectState=function(packet){if(!packet||packet.version!==1||!Array.isArray(packet.chunks)||packet.chunks.length>500)throw Error('Project state version/size invalid');const data=packet.chunks.join('');if(crypto.createHash('sha256').update(data).digest('hex')!==packet.hash)throw Error('Project state checksum mismatch');return JSON.parse(zlib.inflateSync(Buffer.from(data,'base64'),{maxOutputLength:64*1024*1024}).toString('utf8'));};
  const ownedChildren=new Set();
  function trackChild(child){if(!child)return child;ownedChildren.add(child);const drop=()=>ownedChildren.delete(child);try{child.once('close',drop);child.once('exit',drop);child.once('error',drop);}catch(e){}return child;}
  function killTree(child){if(!child||!ownedChildren.has(child))return;ownedChildren.delete(child);const pid=child.pid;if(pid&&process.platform==='win32'){try{const done=cp.spawnSync('taskkill',['/PID',String(pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});if(!done.error&&done.status===0)return;}catch(e){}}try{if(!child.killed)child.kill();}catch(e){}}
  function panelRoot(){
    const loc=global.location||{};
    if(loc.href&&/^file:/i.test(loc.href)){try{return path.dirname(nodeRequire('url').fileURLToPath(loc.href));}catch(e){}}
    const pathname=decodeURIComponent(String(loc.pathname||'')).replace(/^\/([A-Za-z]:)/,'$1');
    return pathname?path.dirname(pathname):'';
  }
  function shared(name){
    const root=panelRoot(),absolute=root?path.join(root,'js',name+'.js'):'';
    // An existing module's syntax/dependency error must not be hidden by fallback lookup.
    if(absolute&&fs.existsSync(absolute))return nodeRequire(absolute);
    const failures=[];
    for(const f of ['./js/'+name+'.js','./'+name+'.js','../js/'+name+'.js']){
      try{return nodeRequire(f);}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;failures.push(f+': '+e.message);}
    }
    throw Error('Missing Varna module: '+name+'\nPanel root: '+root+'\n'+failures.join('\n'));
  }
  const C=global.VarnaCorrections||shared('corrections'),R=global.VarnaResources||shared('resources'),cores=()=>Math.max(1,(os.cpus()||[]).length);
  let resourceConfig=R.normalize({},cores());
  api.hardwareInfo=()=>({cores:cores(),totalRamGB:os.totalmem()/1073741824,freeRamGB:os.freemem()/1073741824});
  api.resourcePreset=name=>R.preset(name,cores());api.configureResources=x=>(resourceConfig=R.normalize(x,cores()));
  function lowerPriority(child,x){if(x.priority==='low'&&child&&child.pid&&os.setPriority)try{os.setPriority(child.pid,os.constants.priority.PRIORITY_BELOW_NORMAL);}catch(e){api.priorityWarning='سیستم تغییر اولویت پردازش را نپذیرفت';}}

  const exists=p=>{try{return !!p&&fs.existsSync(p);}catch(e){return false;}};
  const mkdir=p=>{try{fs.mkdirSync(p,{recursive:true});}catch(e){}};
  const uid=()=>Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const tmpRoot=path.join(os.tmpdir(),'GHAF_Studio');mkdir(tmpRoot);

  api.defaults={
    whisper:'C:\\whisper.cpp\\whisper-cli.exe',
    ffmpeg:'C:\\whisper.cpp\\ffmpeg.exe',
    models:'C:\\whisper.cpp\\models',
    root:'C:\\whisper.cpp',
    runtimeDir:'C:\\whisper.cpp\\llama-b11277-bin-win-cuda-12.4-x64'
  };
  api.exists=exists;
  api.installProfile=function(){
    try{
      let base=decodeURIComponent(String(global.location&&global.location.pathname||'')).replace(/^\/([A-Za-z]:)/,'$1').replace(/[\\/]index\.html$/i,'');
      let file=path.join(base,'INSTALL_PROFILE.json');
      if(exists(file)){let data=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));if(['Core','Studio','Max'].includes(data.level))return data;}
      return {level:'Unknown',packs:[],version:''};
    }catch(e){return {level:'Unknown',packs:[],version:''};}
  };

  api.listModels=function(input){
    input=input||api.defaults.models;
    if(!exists(input)) return [];
    try{
      if(fs.statSync(input).isFile()) return [{name:path.basename(input),path:input}];
      const bins=fs.readdirSync(input).filter(x=>/\.bin$/i.test(x)).sort((a,b)=>a.localeCompare(b));
      return bins.map(n=>({name:n,path:path.join(input,n)}));
    }catch(e){ return []; }
  };

  api.resolveModel=function(input){
    input=input||api.defaults.models;
    if(exists(input)&&fs.statSync(input).isFile()) return input;
    if(!exists(input)||!fs.statSync(input).isDirectory()) return '';
    const prefs=['ggml-large-v3-turbo.bin','ggml-large-v3.bin','ggml-medium.bin','ggml-small.bin','ggml-base.bin'];
    for(const n of prefs){const f=path.join(input,n);if(exists(f))return f;}
    const bins=fs.readdirSync(input).filter(x=>/\.bin$/i.test(x));
    return bins.length?path.join(input,bins[0]):'';
  };

  function splitLines(cb){
    const decoder=new (nodeRequire('string_decoder').StringDecoder)('utf8');let buf='';
    const write=chunk=>{buf+=decoder.write(chunk);let p;while((p=buf.indexOf('\n'))>=0){cb(buf.slice(0,p).replace(/\r$/,''));buf=buf.slice(p+1);}};
    write.end=()=>{buf+=decoder.end();if(buf){cb(buf.replace(/\r$/,''));buf='';}};return write;
  }
  api.spawn=function(exe,args,opts={}){
    return new Promise((resolve,reject)=>{
      const limits=resourceConfig;args=args.slice();if(/^ffmpeg(?:\.exe)?$/i.test(path.basename(exe))&&args.includes('-i')){args=['-threads',String(limits.threads),'-filter_threads',String(limits.threads),'-filter_complex_threads',String(limits.threads)].concat(args);args.splice(args.length-1,0,'-threads',String(limits.threads));}
      let child;try{child=trackChild(cp.spawn(exe,args,{windowsHide:true,shell:false,cwd:opts.cwd||undefined,env:Object.assign({},process.env,opts.env||{})}));}catch(e){reject(e);return;}
      lowerPriority(child,limits);if(opts.onSpawn)opts.onSpawn(child);let out='',err='';
      const onOut=splitLines(line=>{out=(out+line+'\n').slice(-750000);if(opts.onLine)opts.onLine(line,false);});
      const onErr=splitLines(line=>{err=(err+line+'\n').slice(-750000);if(opts.onLine)opts.onLine(line,true);});
      if(child.stdout)child.stdout.on('data',onOut);if(child.stderr)child.stderr.on('data',onErr);
      const timer=opts.timeout?setTimeout(()=>{killTree(child);reject(Error('PROCESS_TIMEOUT'));},opts.timeout):null;
      child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);onOut.end();onErr.end();resolve({code,stdout:out,stderr:err,child});});
    });
  };

  api.checkTools=async function(settings){
    const whisper=settings.whisper||api.defaults.whisper,ffmpeg=settings.ffmpeg||api.defaults.ffmpeg,
          model=(settings.modelFile&&exists(settings.modelFile)?settings.modelFile:api.resolveModel(settings.model||api.defaults.models));
    const r={whisper:exists(whisper),ffmpeg:exists(ffmpeg),model:!!model,modelPath:model};
    if(r.whisper){try{const x=await api.spawn(whisper,['-h']);r.whisperHelp=x.stdout+x.stderr;}catch(e){r.whisper=false;r.whisperError=e.message;}}
    if(r.ffmpeg){try{const x=await api.spawn(ffmpeg,['-version']);r.ffmpegVersion=(x.stdout+x.stderr).split('\n')[0]||'';}catch(e){r.ffmpeg=false;r.ffmpegError=e.message;}}
    return r;
  };

  function stripControlToken(t){t=String(t||'').replace(/\uFFFD+/g,'').trim();return /^\[_TT_\d+\]$/i.test(t)||/^\[_[A-Z][A-Z0-9_]*\]$/i.test(t)||/^\[_.*_\]$/.test(t)||/^<\|.*\|>$/.test(t);}
  function normalizeDigitsForMatch(s){
    const map={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
    return String(s||'').replace(/[۰-۹٠-٩]/g,ch=>map[ch]||ch);
  }
  function cleanWhisperArtifactText(text){
    let t=String(text||'').replace(/\uFFFD+/g,'');
    t=t.replace(/<\|[^|>]+\|>/g,' ');
    t=t.replace(/\[_TT_\d+\]/gi,' ');
    t=t.replace(/\[_[A-Z][A-Z0-9_]*\]/gi,' ');
    t=t.replace(/\[_[^\]]*?_\]/g,' ');
    t=t.replace(/\[(?:BLANK_AUDIO|MUSIC|APPLAUSE|LAUGHTER|SILENCE|NOISE|INAUDIBLE|CROSSTALK|FOREIGN|SPEAKER_TURN)\]/gi,' ');
    t=t.replace(/\((?:music|applause|laughter|silence|noise|inaudible|crosstalk|foreign)\)/gi,' ');
    t=t.replace(/♪+/g,' ');
    t=t.replace(/\b(?:WEBVTT|SRT|VTT)\b/gi,' ');
    t=t.replace(/\[?\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*-->\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*\]?/g,' ');
    t=t.replace(/(^|\s)\[?\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\]?($|\s)/g,' ');
    t=t.replace(/[ \t]+/g,' ').replace(/\s+([،؛:,.!?؟…])/g,'$1').trim();
    return t;
  }
  function suspiciousShortNumericWord(w){
    const t=normalizeDigitsForMatch(String(w.text||'').trim());
    if(!t)return true;
    if(!/^[0-9\s.,:+\-_/\\()[\]#*]+$/.test(t))return false;
    const dur=(Number(w.endMs)-Number(w.startMs))/1000;
    return dur>=0 && dur<0.32;
  }
  function parseTokensFromJSON(data){
    const words=[];
    const segs=data.transcription||data.segments||[];
    let current=null;
    const flush=()=>{if(current&&current.text&&current.text.trim()){current.text=current.text.trim();words.push(current);}current=null;};
    for(const seg of segs){
      const toks=seg.tokens||seg.tokens_data||[];
      if(!toks.length && seg.text){
        const txt=String(seg.text).trim(), a=(seg.offsets&&seg.offsets.from!=null?seg.offsets.from:(seg.start||0)*1000), b=(seg.offsets&&seg.offsets.to!=null?seg.offsets.to:(seg.end||0)*1000);
        const parts=txt.split(/\s+/), d=Math.max(1,b-a)/Math.max(1,parts.length);
        parts.forEach((x,i)=>words.push({text:x,startMs:a+d*i,endMs:i===parts.length-1?b:a+d*(i+1)}));
        continue;
      }
      for(const tok of toks){
        const raw0=String(tok.text!=null?tok.text:(tok.token||'')).replace(/\uFFFD+/g,'');
        if(!raw0||stripControlToken(raw0.trim()))continue;
        const raw=raw0.replace(/\[_TT_\d+\]/gi,'').replace(/\[_[A-Z][A-Z0-9_]*\]/gi,'').replace(/<\|[^|>]+\|>/g,'');
        if(!raw.trim())continue;
        const off=tok.offsets||{}, a=Number(off.from!=null?off.from:(tok.t0!=null?tok.t0*10:0)), b=Number(off.to!=null?off.to:(tok.t1!=null?tok.t1*10:a+1));
        const leading=/^\s/.test(raw), clean=raw.trim();if(!clean)continue;
        const punct=/^[\p{P}\p{S}]+$/u.test(clean);
        if(leading&&current)flush();
        if(!current)current={text:clean,startMs:a,endMs:b};
        else if(punct){current.text+=clean;current.endMs=Math.max(current.endMs,b);}
        else if(!leading){current.text+=clean;current.endMs=Math.max(current.endMs,b);}
        else{flush();current={text:clean,startMs:a,endMs:b};}
      }
      flush();
    }
    return words.filter(w=>w.text&&isFinite(w.startMs)&&isFinite(w.endMs));
  }
  function parseSRT(text){
    const blocks=String(text||'').replace(/\r/g,'').split(/\n\s*\n/), cues=[];
    const tc=s=>{const m=s.match(/(\d+):(\d+):(\d+)[,.](\d+)/);return m?(+m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000):0;};
    for(const b of blocks){const lines=b.split('\n');let ti=lines.findIndex(x=>x.includes('-->'));if(ti<0)continue;const lr=lines[ti].split('-->');const t=lines.slice(ti+1).join(' ').trim();if(t)cues.push({start:tc(lr[0]),end:tc(lr[1]),text:t});}
    return cues;
  }
  function wordsFromSRT(cues){
    const out=[];for(const c of cues){const p=c.text.split(/\s+/).filter(Boolean),d=Math.max(.001,c.end-c.start)/Math.max(1,p.length);p.forEach((x,i)=>out.push({text:x,startMs:(c.start+d*i)*1000,endMs:(i===p.length-1?c.end:c.start+d*(i+1))*1000}));}return out;
  }

  api.transcribe=async function(source,settings,hooks={}){
    const ffmpeg=settings.ffmpeg||api.defaults.ffmpeg, whisper=settings.whisper||api.defaults.whisper,
          model=(settings.modelFile&&exists(settings.modelFile)?settings.modelFile:api.resolveModel(settings.model||api.defaults.models));
    if(!exists(ffmpeg))throw new Error('FFmpeg پیدا نشد: '+ffmpeg);
    if(!exists(whisper))throw new Error('whisper-cli پیدا نشد: '+whisper);
    if(!model)throw new Error('مدل Whisper داخل پوشه models پیدا نشد.');
    const id='ghaf_'+uid(),wav=path.join(tmpRoot,id+'.wav'),base=path.join(tmpRoot,id+'_whisper'),jsonFile=base+'.json',srtFile=base+'.srt';
    if(api._verifyingMusic)throw Error('بررسی موسیقی در حال اجراست');if(api._transcribing)throw Error('تشخیص گفتار در حال اجراست');if(activeRoleJobs)throw Error('ابتدا پردازش مدل فعلی را تمام یا متوقف کن');api.configureResources(settings.localAI||{});api.stopLocalAI();api._transcribing=true;api._cancelled=false;let active=null;api._activeChild=null;const checkCancel=()=>{if(api._cancelled)throw Error('پردازش لغو شد');};
    const log=x=>hooks.onLog&&hooks.onLog(x), progress=(p,m)=>hooks.onProgress&&hooks.onProgress(p,m);
    try{
      progress(8,'استخراج صدا');
      const ffargs=['-y','-hide_banner','-loglevel','error','-i',source.path];
      if(Number(source.sourceStart)>0)ffargs.push('-ss',String(source.sourceStart));
      if(Number(source.sourceDuration)>0)ffargs.push('-t',String(source.sourceDuration));
      ffargs.push('-vn','-ac','1','-ar','16000','-c:a','pcm_s16le','-threads',String(resourceConfig.threads),wav);
      let r=await api.spawn(ffmpeg,ffargs,{onSpawn:c=>{active=c;api._activeChild=c;},onLine:l=>log('[FFmpeg] '+l)});if(r.code!==0)throw new Error('FFmpeg با کد '+r.code+' متوقف شد.\n'+r.stderr);
      checkCancel();progress(32,'تشخیص گفتار');
      const th=String(resourceConfig.threads),lang=settings.language||'fa',q=Number(settings.quality||5);
      const quality=q<=1?['-bs','1','-bo','1','-nf']:q===2?['-bs','2','-bo','2']:q===3?['-bs','3','-bo','3']:q===4?['-bs','5','-bo','5','-wt','0.01']:['-bs','8','-bo','8','-wt','0.005'];
      let suppressArgs=[];
      if(settings.cleanArtifacts!==false){
        try{
          if(!api._whisperHelp){const hh=await api.spawn(whisper,['-h']);api._whisperHelp=(hh.stdout||'')+(hh.stderr||'');}
          if(/(?:-sns|--suppress-nst)/.test(api._whisperHelp))suppressArgs=['-sns'];
        }catch(e){}
      }
      if(resourceConfig.whisperGPU===false){if(!api._whisperHelp){const h=await api.spawn(whisper,['-h']);api._whisperHelp=h.stdout+h.stderr;}if(!/--no-gpu|(?:^|\s)-ng(?:\s|,)/m.test(api._whisperHelp))throw Error('نسخه Whisper از خاموش‌کردن GPU پشتیبانی نمی‌کند');suppressArgs.push('-ng');}const baseArgs=['-m',model,'-f',wav,'-l',lang,'-t',th].concat(suppressArgs);
      let attempts=[baseArgs.concat(['-ojf','-sow','-of',base],quality),baseArgs.concat(['-ojf','-of',base],quality),baseArgs.concat(['-osrt','-ml','1','-of',base])],result=null;
      for(let i=0;i<attempts.length;i++){checkCancel();
        try{if(exists(jsonFile))fs.unlinkSync(jsonFile);if(exists(srtFile))fs.unlinkSync(srtFile);}catch(e){}
        result=await api.spawn(whisper,attempts[i],{onSpawn:c=>{active=c;api._activeChild=c;},onLine:l=>{log('[Whisper] '+l);const m=l.match(/(\d{1,3})%/);if(m)progress(32+Math.min(58,+m[1]*.58),'تشخیص گفتار');}});
        checkCancel();if(result.code===0 && (exists(jsonFile)||exists(srtFile)))break;
      }
      if(!result||result.code!==0||(!exists(jsonFile)&&!exists(srtFile)))throw new Error('Whisper خروجی معتبر تولید نکرد.\n'+(result?result.stderr:''));
      progress(92,'ساخت کلمات واقعی');
      let words=[];
      if(exists(jsonFile)){const data=JSON.parse(fs.readFileSync(jsonFile,'utf8').replace(/^\uFEFF/,''));words=parseTokensFromJSON(data);}
      if(!words.length&&exists(srtFile))words=wordsFromSRT(parseSRT(fs.readFileSync(srtFile,'utf8')));
      if(!words.length)throw new Error('هیچ Word Timing معتبری از Whisper استخراج نشد.');
      if(settings.cleanArtifacts!==false){
        words=words.map(w=>Object.assign({},w,{text:cleanWhisperArtifactText(w.text)})).filter(w=>w.text);
      }
      if(settings.dropShortNumeric!==false){
        words=words.filter(w=>!suspiciousShortNumericWord(w));
      }
      const stretch=Number(source.stretch||100),compIn=Number(source.compIn||0);
      words=words.map((w,i)=>({id:i+1,text:w.text,start:compIn+(w.startMs/1000)*(stretch/100),end:compIn+(w.endMs/1000)*(stretch/100)})).filter(w=>w.end>w.start);
      progress(100,'آماده');return {words,modelPath:model,temp:{wav,jsonFile,srtFile}};
    } finally {
      api._activeChild=null;api._transcribing=false;
      if(!settings.keepTemp){for(const f of [wav,jsonFile,srtFile])try{if(exists(f))fs.unlinkSync(f);}catch(e){}}
    }
  };
  api.verifyInstrumental=async function(file,settings,onProgress){
    if(api._musicCheckChild||api._transcribing)throw Error('تشخیص گفتار دیگری در حال اجراست؛ بررسی بی‌کلام را پس از آن انجام بده.');
    const ffmpeg=settings.ffmpeg||api.defaults.ffmpeg,whisper=settings.whisper||api.defaults.whisper,model=settings.modelFile&&exists(settings.modelFile)?settings.modelFile:api.resolveModel(settings.model||api.defaults.models);
    if(!exists(ffmpeg)||!exists(whisper)||!model)throw Error('برای بررسی آواز، مسیرهای FFmpeg، Whisper و مدل تشخیص گفتار را در تنظیمات کامل کن.');
    const base=path.join(tmpRoot,'instrumental_'+uid()),wav=base+'.wav',jsonFile=base+'.json';api._musicCheckCancelled=false;api._verifyingMusic=true;
    const run=async(exe,args)=>{if(api._musicCheckCancelled)throw Error('بررسی موسیقی لغو شد.');const r=await api.spawn(exe,args,{timeout:600000,onSpawn:c=>api._musicCheckChild=c});api._musicCheckChild=null;if(api._musicCheckCancelled)throw Error('بررسی موسیقی لغو شد.');if(r.code!==0)throw Error('بررسی بی‌کلام ناموفق: '+String(r.stderr||'').slice(-500));return r;};
    try{if(onProgress)onProgress('بررسی نشانه‌های آواز و گفتار در موسیقی…');await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',file,'-vn','-ac','1','-ar','16000','-c:a','pcm_s16le',wav]);if(!api._whisperHelp){const h=await run(whisper,['-h']);api._whisperHelp=h.stdout+h.stderr;}
      const args=['-m',model,'-f',wav,'-l','auto','-t',String(Math.max(1,Math.min(8,cores()-1))),'-ojf','-of',base,'-bs','2','-bo','2'];if(/(?:-sns|--suppress-nst)/.test(api._whisperHelp))args.push('-sns');if(/--no-gpu|(?:^|\s)-ng(?:\s|,)/m.test(api._whisperHelp))args.push('-ng');await run(whisper,args);if(!exists(jsonFile))throw Error('گزارش بررسی آواز تولید نشد.');return shared('instrumental29').evidence(JSON.parse(fs.readFileSync(jsonFile,'utf8').replace(/^\uFEFF/,'')));
    }finally{api._musicCheckChild=null;api._verifyingMusic=false;for(const f of [wav,jsonFile])try{if(exists(f))fs.unlinkSync(f);}catch(e){}}
  };
  api.cancelInstrumentalCheck=function(){api._musicCheckCancelled=true;if(api._musicCheckChild)try{killTree(api._musicCheckChild);}catch(e){};};
  api.cancel=function(){api._cancelled=true;try{if(api._activeChild&&!api._activeChild.killed){killTree(api._activeChild);api._activeChild=null;return true;}}catch(e){}return false;};

  function requestJSON(urlStr,options={},body){
    return new Promise((resolve,reject)=>{
      let u;try{u=new URL(urlStr);}catch(e){reject(e);return;}
      const lib=u.protocol==='https:'?https:http;
      const req=lib.request({
        hostname:u.hostname,port:u.port||undefined,path:u.pathname+u.search,
        method:options.method||'GET',headers:options.headers||{},
        timeout:options.timeout||5000
      },res=>{
        let data='';res.setEncoding('utf8');res.on('data',d=>data+=d);
        res.on('end',()=>{
          if(res.statusCode<200||res.statusCode>=300){
            const er=new Error('HTTP '+res.statusCode+': '+data.slice(0,500));er.statusCode=res.statusCode;reject(er);return;
          }
          try{resolve(JSON.parse(data||'{}'));}catch(e){reject(new Error('JSON parse error: '+e.message+'\n'+data.slice(0,500)));}
        });
      });
      req.on('timeout',()=>req.destroy(new Error('Timeout')));
      req.on('error',reject);
      if(body)req.write(body);req.end();
    });
  }
  function authHeaders(apiKey, extra){
    const h=Object.assign({},extra||{});
    if(apiKey)h.Authorization='Bearer '+apiKey;
    return h;
  }
  function baseCandidates(base){
    base=String(base||'').replace(/\/$/,'');
    const out=[base];
    if(/^http:\/\/localhost(?=[:/]|$)/i.test(base)) out.push(base.replace(/^http:\/\/localhost/i,'http://127.0.0.1'));
    return [...new Set(out.filter(Boolean))];
  }
  async function firstJSON(bases,pathPart,opts,body){
    let last=null;
    for(const b of bases){
      try{return {base:b,data:await requestJSON(b+pathPart,opts,body)};}
      catch(e){last=e;}
    }
    throw last||new Error('Connection failed');
  }

  function findRecursive(root, matcher, maxDepth){
    if(!exists(root))return '';maxDepth=maxDepth==null?5:maxDepth;var hit='';
    function walk(d,depth){if(hit||depth>maxDepth)return;let list=[];try{list=fs.readdirSync(d,{withFileTypes:true});}catch(e){return;}for(const it of list){const f=path.join(d,it.name);if(it.isFile()&&matcher(it.name,f)){hit=f;return;}if(it.isDirectory())walk(f,depth+1);if(hit)return;}}
    try{if(fs.statSync(root).isFile())return matcher(path.basename(root),root)?root:'';}catch(e){return '';}walk(root,0);return hit;
  }
  function pickGGUF(folder, prefer){
    if(!exists(folder))return '';try{if(fs.statSync(folder).isFile()&&/\.gguf$/i.test(folder)&&!/mmproj/i.test(path.basename(folder)))return folder;}catch(e){}
    const all=[];function walk(d,depth){if(depth>6||all.length>400)return;let list=[];try{list=fs.readdirSync(d,{withFileTypes:true});}catch(e){return;}for(const it of list){const f=path.join(d,it.name);if(it.isDirectory())walk(f,depth+1);else if(/\.gguf$/i.test(it.name)&&!/mmproj/i.test(it.name))all.push(f);}}walk(folder,0);
    if(!all.length)return '';prefer=(prefer||[]).map(x=>String(x).toLowerCase());all.sort((a,b)=>{const na=path.basename(a).toLowerCase(),nb=path.basename(b).toLowerCase(),sa=prefer.reduce((n,x,i)=>n+(na.includes(x)?100-i:0),0),sb=prefer.reduce((n,x,i)=>n+(nb.includes(x)?100-i:0),0);return sb-sa||na.localeCompare(nb);});return all[0];
  }
  function under(file,folder){if(!file||!folder)return false;const rel=path.relative(path.resolve(folder),path.resolve(file));return rel===''||(!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel)&&rel!=='..');}
  function validModel(file){if(!exists(file)||!(/\.gguf$/i.test(file))||/mmproj/i.test(path.basename(file)))return false;try{return fs.statSync(file).isFile();}catch(e){return false;}}
  api.resolveLocalPaths=function(settings){
    const x=Object.assign({},api.defaultLocalAI||{},settings||{});x.root=x.root||'C:\\whisper.cpp';
    x.runtimeDir=x.runtimeDir||path.join(x.root,'llama-b11277-bin-win-cuda-12.4-x64');
    if(!exists(x.exe)||!under(x.exe,x.runtimeDir))x.exe=findRecursive(x.runtimeDir,n=>/^llama-server(?:\.exe)?$/i.test(n),4)||path.join(x.runtimeDir,'llama-server.exe');
    const roles={type:['q4_k_m','type','class'],text:['q4_k_m','qwen3.5'],translator:['q4_k_m','translategemma'],vision:['q4_k_m','qwen2.5','vl']};
    for(const role of Object.keys(roles)){const field=role+'Model',dir=x[role+'Dir'];if(!validModel(x[field])||!under(x[field],dir))x[field]=pickGGUF(dir,roles[role]);}
    const files=api.modelFiles?api.modelFiles(x.visionDir).filter(f=>f.mmproj):[];x.projectorError='';
    if(!x.mmproj||!exists(x.mmproj)||!under(x.mmproj,x.visionDir)){
      const near=files.filter(f=>x.visionModel&&path.dirname(f.path)===path.dirname(x.visionModel));
      if(near.length===1)x.mmproj=near[0].path;else if(files.length===1)x.mmproj=files[0].path;else{x.mmproj='';if(files.length>1)x.projectorError='چند mmproj پیدا شد؛ فایل سازگار با مدل Vision را انتخاب کنید.';}
    }
    return x;
  };
  api.checkLocalRoles=function(settings){const x=api.resolveLocalPaths(settings);return {paths:x,ready:{runtime:exists(x.exe),type:!!(x.typeModel||x.textModel),typeFallback:!x.typeModel&&!!x.textModel,text:!!x.textModel,translator:!!x.translatorModel,vision:!!x.visionModel,mmproj:!!x.mmproj},warnings:x.projectorError?[x.projectorError]:[]};};

  api.chat=async function(opts){
    const base=String(opts.base||'http://127.0.0.1:1235').replace(/\/$/,''),endpoint=base+'/v1/chat/completions';
    const payload={model:opts.model||'varna-local',temperature:opts.temperature==null?.1:opts.temperature,messages:opts.messages||[],chat_template_kwargs:{enable_thinking:false},max_tokens:opts.max_tokens||2048};
    const body=JSON.stringify(payload),headers=Object.assign(opts.apiKey?{Authorization:'Bearer '+opts.apiKey}:{},{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body)});
    const r=await requestJSON(endpoint,{method:'POST',headers,timeout:180000},body);
    const choice=(((r||{}).choices||[])[0]||{});if(choice.finish_reason==='length')throw Error('پاسخ مدل ناقص شد؛ Context یا Max Tokens را افزایش بده');const answer=String(choice.message?.content||'').replace(/<think>[\s\S]*?<\/think>/g,'').trim();if(!answer)throw Error('مدل محلی پاسخ متنی نداد');return answer;
  };
  api.chatVision=async function(opts){
    const images=(opts.images||[]).slice(0,24);
    const content=[{type:'text',text:opts.prompt||'Analyze these frames.'}];
    for(const img of images){
      let data=String(img.data||'');
      if(!data&&img.path&&exists(img.path)) data='data:image/png;base64,'+fs.readFileSync(img.path).toString('base64');
      if(data)content.push({type:'image_url',image_url:{url:data}});
    }
    return api.chat({base:opts.base,apiKey:opts.apiKey,model:opts.model||'varna-local',messages:[{role:'system',content:opts.system||'You are a precise video sound designer.'},{role:'user',content}],temperature:opts.temperature==null?.1:opts.temperature,max_tokens:opts.max_tokens});
  };

  api.detectSceneChanges=async function(file,ffmpeg,threshold=.34,max=80){
    if(!exists(file)||!exists(ffmpeg))return [];
    threshold=Math.max(.05,Math.min(.95,+threshold||.34));
    const vf=`select='gt(scene,${threshold})',showinfo`;
    const r=await api.spawn(ffmpeg,['-hide_banner','-i',file,'-vf',vf,'-an','-f','null','-'],{});
    const text=(r.stderr||'')+'\n'+(r.stdout||''),out=[];
    const rx=/pts_time:([0-9.]+)/g;let m;while((m=rx.exec(text))&&out.length<max){const t=+m[1];if(Number.isFinite(t))out.push(t);}
    return out;
  };

  api.suggestCorrections=async function(groups,opts,hooks={}){return api.withLocalAIJob(async()=>{
    const out=[];for(let i=0;i<groups.length;i++){
      hooks.onProgress&&hooks.onProgress(i+1,groups.length);
      const g=groups[i],messages=[{role:'system',content:'You are a meticulous subtitle editor. Follow the instruction exactly. Return ONLY the corrected subtitle text. Never explain.'},{role:'user',content:(opts.instruction||'فقط غلط‌های املایی و نگارشی را اصلاح کن و لحن را تغییر نده.')+'\n\nمتن:\n'+g.text}];
      const text=await api.chatRole('text',opts.localAI||opts,messages,.1,hooks.onStatus);if(text&&text!==g.text)out.push({groupId:g.id,original:g.text,suggestion:text});
    }return out;
  });};
  api.translate=async function(groups,opts,hooks={}){return api.withLocalAIJob(async()=>{
    const out=[];for(let i=0;i<groups.length;i++){
      hooks.onProgress&&hooks.onProgress(i+1,groups.length);const g=groups[i];
      const messages=[
        {role:'system',content:'You are a professional subtitle translator. Translate naturally and concisely. Preserve names, numbers, brand names and punctuation. Do not explain. Return ONLY the translated subtitle text.'},
        {role:'user',content:'Target language: '+opts.target+'\nSubtitle: '+g.text}
      ];
      const text=await api.chatRole('translator',opts.localAI||opts,messages,.2,hooks.onStatus);
      out.push({groupId:g.id,text:text});
    }return out;
  });};
  api.fileURL=p=>nodeRequire('url').pathToFileURL(p).href;
  api.makeMotionTemp=()=>{const root=path.join(dataDir,'previews');mkdir(root);const p=path.join(root,'motion_'+uid());fs.mkdirSync(p);return p;};
  api.readFrameURL=p=>'data:image/png;base64,'+fs.readFileSync(p).toString('base64');
  api.cleanMotionTemp=p=>{if(path.dirname(p)!==path.join(dataDir,'previews')||!path.basename(p).startsWith('motion_'))return;try{fs.readdirSync(p).forEach(n=>fs.unlinkSync(path.join(p,n)));fs.rmdirSync(p);}catch(e){}};
  api.saveMotionProject=(folder,x)=>{const p=path.join(folder,'GHAF_Project_'+uid()+'.json');fs.writeFileSync(p,JSON.stringify(x,null,2),'utf8');return p;};
  api.loadMotionProject=p=>{const x=JSON.parse(fs.readFileSync(p,'utf8'));if(x.version!==1||!Array.isArray(x.groups)||!Array.isArray(x.words)||!x.settings||x.groups.some(g=>!Number.isFinite(g.id)||!Array.isArray(g.wordIds)))throw Error('فایل پروژه GHAF معتبر نیست');return x;};
  // Durable user data lives outside the extension installation directory.
  const dataDir=path.join(process.env.APPDATA||path.join(os.homedir(),'.config'),'GHAFStudio');mkdir(dataDir);
  api.dataDir=dataDir;
  api.saveDiagnosticReport=x=>{const file=path.join(dataDir,'Varna_Diagnostics.json');fs.writeFileSync(file,JSON.stringify(x,null,2),'utf8');return file;};
  // R7 correction memory: durable phrase fixes + alternatives + timing-safe insertion.
  const globalCorrectionMemoryPath=path.join(dataDir,'correction-memory.json');let correctionMemoryPath=globalCorrectionMemoryPath,projectContext=null,memoryScope='global';
  api.setProjectContext=x=>{projectContext=x&&x.saved&&x.file?x:null;api.setMemoryScope(memoryScope);return projectContext;};
  api.setMemoryScope=scope=>{memoryScope=scope==='project'&&projectContext?'project':'global';correctionMemoryPath=memoryScope==='project'?projectContext.file+'.varna-corrections.json':globalCorrectionMemoryPath;return memoryScope;};
  api.memoryScope=()=>memoryScope;
  function readCorrectionMemory(){
    if(!exists(correctionMemoryPath))return {version:5,items:[],preferences:{}};
    try{const x=JSON.parse(fs.readFileSync(correctionMemoryPath,'utf8'));return C.database(x);}
    catch(e){return {version:5,items:[],preferences:{}};}
  }
  function effectiveCorrectionMemory(){
    const saved=correctionMemoryPath;correctionMemoryPath=globalCorrectionMemoryPath;const globalDb=readCorrectionMemory();
    if(!projectContext){correctionMemoryPath=saved;return globalDb;}
    correctionMemoryPath=projectContext.file+'.varna-corrections.json';const projectDb=readCorrectionMemory();correctionMemoryPath=saved;
    const shadow=new Set(projectDb.items.map(x=>correctionKey(x.wrong)));
    return {version:5,items:globalDb.items.filter(x=>!shadow.has(correctionKey(x.wrong))).concat(projectDb.items),preferences:Object.assign({},globalDb.preferences,projectDb.preferences)};
  }
  function writeCorrectionMemory(db){db=C.database(db);db.version=5;db.preferences=db.preferences||{};const tmp=correctionMemoryPath+'.'+uid()+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2),'utf8');fs.renameSync(tmp,correctionMemoryPath);return correctionMemoryPath;}
  api.loadCorrectionMemory=()=>readCorrectionMemory();
  api.clearCorrectionMemory=()=>{writeCorrectionMemory({version:5,items:[],preferences:{}});return true;};
  function correctionKey(x){return C.phrase(x);}
  api.learnCorrectionPairs=function(pairs,options){const db=C.learn(readCorrectionMemory(),pairs,options);writeCorrectionMemory(db);return db;};
  api.effectiveCorrectionMemory=()=>effectiveCorrectionMemory();
  api.restoreProjectCorrectionMemory=function(db){if(!projectContext||!db||!Array.isArray(db.items))return false;const prior=correctionMemoryPath;try{correctionMemoryPath=projectContext.file+'.varna-corrections.json';writeCorrectionMemory(db);return true;}finally{correctionMemoryPath=prior;}};
  api.correctionGroups=()=>C.groups(readCorrectionMemory());
  api.replaceCorrectionCanonical=function(oldRight,newRight){
    const selected=readCorrectionMemory().items.filter(x=>correctionKey(x.canonical||x.right)===correctionKey(oldRight));
    const oldParts=String(oldRight).trim().split(/\s+/),pairs=selected.map(x=>{
      if(!x.canonical)return {wrong:x.wrong,right:newRight,mode:x.mode,autoApply:x.autoApply};
      const parts=String(x.right).trim().split(/\s+/),at=parts.findIndex((part,i)=>i>0&&i+oldParts.length<parts.length&&oldParts.every((v,j)=>correctionKey(v)===correctionKey(parts[i+j])));
      if(at<0)throw Error('قانون زمینه‌دار قابل بازنویسی نیست؛ آن را جداگانه ویرایش کنید.');
      return {wrong:x.wrong,right:parts.slice(0,at).concat([newRight],parts.slice(at+oldParts.length)).join(' '),canonical:newRight,mode:'context',autoApply:x.autoApply};
    });
    pairs.push({wrong:oldRight,right:newRight});return api.learnCorrectionPairs(pairs,{replaceAlias:true,recanonicalize:true});
  };
  api.setCorrectionPreference=function(wrong,right){const db=readCorrectionMemory(),wk=correctionKey(wrong),rk=correctionKey(right);if(!wk||!rk)return false;db.preferences[wk]=rk;writeCorrectionMemory(db);return true;};
  api.deleteCorrectionPair=function(wrong,right){const db=readCorrectionMemory(),wk=correctionKey(wrong),rk=correctionKey(right);if(!wk||!rk)return false;const before=db.items.length;db.items=db.items.filter(x=>!((x.wrongKey||correctionKey(x.wrong))===wk&&(x.rightKey||correctionKey(x.right))===rk));if(db.preferences&&db.preferences[wk]===rk)delete db.preferences[wk];if(db.items.length!==before){writeCorrectionMemory(db);return true;}return false;};
  api.clearCorrectionPreference=function(wrong){const db=readCorrectionMemory(),wk=correctionKey(wrong);if(!wk)return false;delete db.preferences[wk];writeCorrectionMemory(db);return true;};
  api.exportCorrectionMemory=function(folder){if(!exists(folder)||!fs.statSync(folder).isDirectory())throw Error('پوشه مقصد پیدا نشد');const db=readCorrectionMemory(),file=path.join(folder,'Varna_Correction_Memory.json');fs.writeFileSync(file,JSON.stringify({format:'varna-correction-memory',version:5,exportedAt:new Date().toISOString(),items:db.items||[],preferences:db.preferences||{}},null,2),'utf8');return {file,count:(db.items||[]).length};};
  api.importCorrectionMemory=function(file){if(!exists(file)||!fs.statSync(file).isFile())throw Error('فایل حافظه پیدا نشد');let incoming;try{incoming=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){throw Error('JSON حافظه معتبر نیست');}if(!incoming||!Array.isArray(incoming.items))throw Error('فایل Varna Correction Memory معتبر نیست');const db=readCorrectionMemory(),before=(db.items||[]).length;for(const it of incoming.items){const wrong=String(it&&it.wrong||'').trim(),right=String(it&&it.right||'').trim();if(!wrong||!right)continue;const wk=correctionKey(wrong),rk=correctionKey(right);if(!wk||!rk||wk===rk)continue;const hit=db.items.find(x=>(x.wrongKey||correctionKey(x.wrong))===wk&&(x.rightKey||correctionKey(x.right))===rk);if(hit){hit.count=Math.max(+hit.count||1,+it.count||1);hit.updatedAt=it.updatedAt||hit.updatedAt||new Date().toISOString();if(typeof it.autoApply==='boolean')hit.autoApply=it.autoApply;if(it.mode)hit.mode=it.mode;if(it.canonical)hit.canonical=String(it.canonical);}else db.items.push({wrong,right,wrongKey:wk,rightKey:rk,count:Math.max(1,+it.count||1),updatedAt:it.updatedAt||new Date().toISOString(),autoApply:typeof it.autoApply==='boolean'?it.autoApply:C.inferredAuto(wrong,right),mode:it.mode||'imported',canonical:it.canonical||''});}const prefs=incoming.preferences&&typeof incoming.preferences==='object'?incoming.preferences:{};Object.keys(prefs).forEach(k=>{db.preferences[k]=prefs[k];});writeCorrectionMemory(db);return {before,after:db.items.length,imported:Math.max(0,db.items.length-before),total:db.items.length};};

  api.correctionAlternatives=function(wrong){const db=readCorrectionMemory(),wk=correctionKey(wrong);return (db.items||[]).filter(x=>(x.wrongKey||correctionKey(x.wrong))===wk).map(x=>({right:x.right,count:+x.count||1,rightKey:x.rightKey||correctionKey(x.right)}));};
  function correctionTokenKey(x){return correctionKey(String(x||'').replace(/^[«(\[{"']+|[،؛:,.!?؟…»\)\]}"']+$/g,''));}
  function correctionEditDistance(a,b){a=String(a||'');b=String(b||'');if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;var prev=Array(b.length+1),cur=Array(b.length+1);for(var j=0;j<=b.length;j++)prev[j]=j;for(var i=1;i<=a.length;i++){cur[0]=i;for(j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));var tmp=prev;prev=cur;cur=tmp;}return prev[b.length];}
  function replacementWithAnchors(seg,right,nextId,ruleKey){
    const timing=global.VarnaTiming||nodeRequire('./timing.js');
    const built=timing.alignWords(seg,right,{nextId});
    const phrase=seg.map(w=>w.editedText!=null?w.editedText:w.text).join(' '),id='memory_'+(+seg[0].id||0)+'_'+(+seg[0].start||0);
    built.words.forEach((w,i)=>{w._memoryLocked=true;w.memoryCorrected=true;w.memoryOriginal=seg.length===built.words.length?String(seg[i].editedText!=null?seg[i].editedText:seg[i].text):phrase;w.memoryOriginalPhrase=phrase;w.memoryCorrectionId=id;w.memoryRuleKey=ruleKey||'';});
    return {out:built.words,nextId:built.nextId};
  }
  api.applyCorrectionMemoryToWords=function(inputWords,opts){
    opts=opts||{};const db=opts.db?C.database(opts.db):effectiveCorrectionMemory(),ambiguities=[];
    const items=C.rules(db).filter(x=>x.autoApply!==false&&C.safeAuto(x.wrong,x.right,x.mode||'token')).map(x=>x.ambiguous?Object.assign({},x,{_ambiguous:x.ambiguous}):x);
    items.sort((a,b)=>String(b.wrong).trim().split(/\s+/).length-String(a.wrong).trim().split(/\s+/).length||((+b.count||0)-(+a.count||0)));
    const words=(inputWords||[]).map(w=>Object.assign({},w)),used=new Set();let hits=0,nextId=words.reduce((m,w)=>Math.max(m,+w.id||0),0)+1;
    const protectedIndexes=C.protectedMask(words,opts.protectedPhrases||[]);words.forEach((w,i)=>{if(protectedIndexes.has(i))w._entityLocked=true;});
    for(const item of items){const wrong=String(item.wrong||'').trim().split(/\s+/).filter(Boolean),wk=wrong.map(correctionTokenKey);if(!wrong.length||wk.some(x=>!x))continue;for(let i=0;i<=words.length-wrong.length;){let ok=true;for(let j=0;j<wrong.length;j++){const w=words[i+j];if(!w||w._memoryLocked||w._entityLocked||correctionTokenKey(w.editedText!=null?w.editedText:w.text)!==wk[j]){ok=false;break;}if(j<wrong.length-1){const following=words[i+j+1],raw=String(w.editedText!=null?w.editedText:w.text||'');if(/[،؛.!?؟][»”’\)\]}"']*$/.test(raw)||(following&&Number(following.start)-Number(w.end)>1.2)){ok=false;break;}}}if(!ok){i++;continue;}const seg=words.slice(i,i+wrong.length);if(item._ambiguous){ambiguities.push({wrong:item.wrong,start:+seg[0].start||0,end:+seg[seg.length-1].end||0,candidates:item._ambiguous.map(x=>({right:x.right,count:+x.count||1,rightKey:x.rightKey||correctionKey(x.right)}))});i+=wrong.length;continue;}const original=seg.map(w=>w.editedText!=null?w.editedText:w.text).join(' '),right=C.applyText(original,{items:[item]}).text.split(/\s+/).filter(Boolean);const built=replacementWithAnchors(seg,right,nextId,item.wrongKey);nextId=built.nextId;words.splice(i,wrong.length,...built.out);hits++;used.add(item.wrongKey||correctionKey(item.wrong));i+=built.out.length;}}
    // Conservative fuzzy pass for single-token misspellings learned by the user.
    // It never changes timing, never guesses across ambiguous corrections, and avoids touching already-known correct forms.
    let fuzzyHits=0;const correctForms=new Set((db.items||[]).map(x=>x.rightKey||correctionKey(x.right)).filter(Boolean));
    const fuzzyCandidates=items.filter(x=>!x._ambiguous&&String(x.wrong||'').trim().split(/\s+/).length===1&&String(x.right||'').trim().split(/\s+/).length===1).map(x=>({item:x,key:correctionTokenKey(x.wrong)})).filter(x=>x.key&&x.key.length>=4);
    for(const w of (opts.fuzzy===true?words:[])){if(w.memoryCorrected||w._entityLocked)continue;const original=String(w.editedText!=null?w.editedText:w.text||''),key=correctionTokenKey(original);if(!key||key.length<4||correctForms.has(key))continue;let best=null,bestD=99,tie=false;for(const c of fuzzyCandidates){if(Math.abs(c.key.length-key.length)>2)continue;if(c.key.charAt(0)!==key.charAt(0))continue;const d=correctionEditDistance(key,c.key),limit=Math.max(key.length,c.key.length)>=8?2:1;if(d>limit)continue;if(d<bestD){best=c;bestD=d;tie=false;}else if(d===bestD&&best&&correctionKey(best.item.right)!==correctionKey(c.item.right))tie=true;}if(best&&!tie){w.text=String(best.item.right);w.editedText=null;w.memoryCorrected=true;w.memoryFuzzy=true;fuzzyHits++;hits++;used.add(best.item.wrongKey||correctionKey(best.item.wrong));}}
    words.forEach(w=>{delete w._memoryLocked;delete w._entityLocked;});return {words,hits,fuzzyHits,itemsUsed:used.size,memoryCount:db.items.length,ambiguities};
  };
  api.applySingleCorrectionToWords=function(words,wrong,right){const db=C.learn({items:[],preferences:{}},[{wrong,right}]);return api.applyCorrectionMemoryToWords(words,{db});};
  const settingsProfilesPath=path.join(dataDir,'settings-profiles.json');
  function profilePath(folder){try{if(folder&&exists(folder)&&fs.statSync(folder).isDirectory())return path.join(folder,'.varna-profiles.json');}catch(e){}return settingsProfilesPath;}
  function readProfiles(folder){const p=profilePath(folder);if(!exists(p))return {version:1,items:[]};try{const x=JSON.parse(fs.readFileSync(p,'utf8'));return {version:1,items:Array.isArray(x.items)?x.items:[]};}catch(e){return {version:1,items:[]};}}
  function writeProfiles(x,folder){const p=profilePath(folder),tmp=p+'.'+uid()+'.tmp';fs.writeFileSync(tmp,JSON.stringify(x,null,2),'utf8');fs.renameSync(tmp,p);return p;}
  api.listSettingsProfiles=(folder)=>readProfiles(folder).items;
  api.saveSettingsProfile=(name,settings,folder)=>{name=String(name||'').trim();if(!name)throw Error('نام پروفایل خالی است');const db=readProfiles(folder),item={id:uid(),name,createdAt:new Date().toISOString(),settings};const i=db.items.findIndex(x=>String(x.name).toLowerCase()===name.toLowerCase());if(i>=0){item.id=db.items[i].id;db.items[i]=item;}else db.items.push(item);writeProfiles(db,folder);return item;};
  api.deleteSettingsProfile=(id,folder)=>{const db=readProfiles(folder);db.items=db.items.filter(x=>x.id!==id);writeProfiles(db,folder);return true;};
  api.exportSettingsProfile=(folder,name,settings)=>{if(!exists(folder))throw Error('پوشه مقصد پیدا نشد');const safe=String(name||'GHAF_Settings').replace(/[\/:*?"<>|]+/g,'_'),f=path.join(folder,safe+'.ghafsettings.json');fs.writeFileSync(f,JSON.stringify({version:1,name:safe,settings},null,2),'utf8');return f;};
  api.importSettingsProfile=file=>{if(!exists(file))throw Error('فایل تنظیمات پیدا نشد');const x=JSON.parse(fs.readFileSync(file,'utf8'));if(!x||!x.settings||typeof x.settings!=='object')throw Error('فایل تنظیمات GHAF معتبر نیست');return x;};
  const sfxCatalogPath=path.join(dataDir,'sfx-library.json');
  function blankSfxCatalog(){return {version:2,folders:[],items:[],preferences:{},learning:{accepted:[],rejected:[],replaced:[],eventCategory:{},fileScores:{}}};}
  api.loadSfxCatalog=()=>{if(!exists(sfxCatalogPath))return blankSfxCatalog();try{const x=JSON.parse(fs.readFileSync(sfxCatalogPath,'utf8')),b=blankSfxCatalog();return Object.assign(b,x,{learning:Object.assign(b.learning,x.learning||{})});}catch(e){return blankSfxCatalog();}};
  api.saveSfxCatalog=x=>{x=x||blankSfxCatalog();x.version=2;x.learning=Object.assign(blankSfxCatalog().learning,x.learning||{});const temp=sfxCatalogPath+'.'+uid()+'.tmp';fs.writeFileSync(temp,JSON.stringify(x,null,2),'utf8');fs.renameSync(temp,sfxCatalogPath);return sfxCatalogPath;};
  function soundTags(name,folder){const x=(String(name)+' '+String(folder)).toLowerCase(),tags=[];const add=(t,re)=>{if(re.test(x))tags.push(t);};
    add('short',/short|tiny|small|micro|soft/);add('heavy',/heavy|hard|big|massive|deep|slam|boom/);add('fast',/fast|quick|snap|zip/);add('smooth',/soft|smooth|air|gentle|light/);add('digital',/digital|tech|cyber|glitch|ui|interface/);add('organic',/organic|wood|cloth|paper|leaf|nature/);add('bright',/bright|high|sparkle|shimmer/);add('dark',/dark|low|deep|bass/);add('reverse',/reverse|backward/);add('long',/long|sustain|tail|extended/);return tags;}
  function classifySfx(name,folder){const x=(String(name)+' '+String(folder)).toLowerCase();
    if(/(^|[ _.-])(music|song|track|theme|beat|loop|melody|underscore|bed)([ _.-]|$)/.test(x))return 'music';
    if(/forest|jungle|birds?|wind in trees|nature/.test(x))return 'nature';
    if(/city|traffic|street|urban/.test(x))return 'city';
    if(/office|room tone|interior|indoor/.test(x))return 'room';
    if(/ambience|ambient|atmo|atmosphere|environment/.test(x))return 'ambience';
    if(/footstep|(?:^|[ _.-])steps?(?:$|[ _.-])|walking|running/.test(x))return 'foley';
    if(/riser|rise|build|uplift|swell|crescendo/.test(x))return 'riser';
    if(/downer|fall|descend|drop fx/.test(x))return 'downer';
    if(/hit|impact|slam|boom|punch|cinematic hit|thump/.test(x))return 'hit';
    if(/(?:^|[\s_./\\-])ui(?:$|[\s_./\\-])|interface|notification|menu|toggle|confirm|select/.test(x))return 'ui';
    if(/click|tap|button|mouse/.test(x))return 'click';
    if(/pop|pluck|bubble|tick/.test(x))return 'pop';
    if(/glitch|digital|error|zap|electric|static/.test(x))return 'glitch';
    if(/type|typing|keyboard|key stroke|keystroke/.test(x))return 'typing';
    if(/whoosh|woosh|swoosh|swish|sweep|transition|pass by|flyby|whip/.test(x))return 'whoosh';
    if(/mechanic|machine|motor|gear|servo/.test(x))return 'mechanical';
    if(/tone|bell|chime|ding|ping/.test(x))return 'tonal';
    return 'other';
  }
  api.scanAudioAssets=function(folder,max=8000){
    if(!exists(folder)||!fs.statSync(folder).isDirectory())throw Error('پوشه SFX پیدا نشد');
    const out=[];function walk(d,depth){if(depth>14||out.length>=max)return;let list=[];try{list=fs.readdirSync(d,{withFileTypes:true});}catch(e){return;}for(const it of list){if(out.length>=max)break;const f=path.join(d,it.name);if(it.isDirectory())walk(f,depth+1);else if(/\.(wav|mp3|aif|aiff|m4a|ogg|flac)$/i.test(it.name)){out.push({name:it.name,path:f,folder:path.relative(folder,d)||path.basename(folder),category:classifySfx(it.name,path.relative(folder,d)),tags:soundTags(it.name,path.relative(folder,d))});}}}walk(folder,0);out.forEach(x=>{try{if(/\.wav$/i.test(x.path)){const fd=fs.openSync(x.path,'r'),b=Buffer.alloc(65536);let count;try{count=fs.readSync(fd,b,0,b.length,0);}finally{fs.closeSync(fd);}let rate=0;for(let at=12;at+8<=count;){const id=b.toString('ascii',at,at+4),len=b.readUInt32LE(at+4);if(id==='fmt '&&at+20<=count)rate=b.readUInt32LE(at+16);if(id==='data'&&rate){x.duration=len/rate;break;}at+=8+len+(len%2);}}}catch(e){}});return out;
  };
  api.measureAudio=async function(file,ffmpeg){
    if(!exists(file))throw Error('فایل صوتی پیدا نشد: '+file);ffmpeg=ffmpeg||api.defaults.ffmpeg;if(!exists(ffmpeg))throw Error('FFmpeg پیدا نشد');
    const nul=process.platform==='win32'?'NUL':'/dev/null';const r=await api.spawn(ffmpeg,['-hide_banner','-nostats','-i',file,'-af','volumedetect','-f','null',nul]);const txt=(r.stderr||'')+'\n'+(r.stdout||'');
    const mean=/mean_volume:\s*(-?[0-9.]+)\s*dB/i.exec(txt),max=/max_volume:\s*(-?[0-9.]+)\s*dB/i.exec(txt);return {mean:mean?+mean[1]:null,max:max?+max[1]:null};
  };
  api.measureLoudness=async function(file,ffmpeg,range={}){
    if(!exists(file))throw Error('فایل صوتی پیدا نشد: '+file);ffmpeg=ffmpeg||api.defaults.ffmpeg;if(!exists(ffmpeg))throw Error('FFmpeg پیدا نشد');
    const nul=process.platform==='win32'?'NUL':'/dev/null',args=['-hide_banner','-nostats'].concat(Number.isFinite(range.start)&&range.start>0?['-ss',String(range.start)]:[],['-i',file],Number.isFinite(range.duration)&&range.duration>0?['-t',String(range.duration)]:[],['-af','loudnorm=I=-23:TP=-1:LRA=11:print_format=json','-f','null',nul]),r=await api.spawn(ffmpeg,args),txt=(r.stderr||'')+'\n'+(r.stdout||''),a=txt.lastIndexOf('{'),b=txt.lastIndexOf('}');if(a<0||b<a)return {integrated:null,truePeak:null,lra:null,threshold:null};let j={};try{j=JSON.parse(txt.slice(a,b+1));}catch(e){}return {integrated:Number.isFinite(+j.input_i)?+j.input_i:null,truePeak:Number.isFinite(+j.input_tp)?+j.input_tp:null,lra:Number.isFinite(+j.input_lra)?+j.input_lra:null,threshold:Number.isFinite(+j.input_thresh)?+j.input_thresh:null};
  };
  api.analyzeBeats=async function(file,ffmpeg,opts={}){
    if(!exists(file)||!exists(ffmpeg))return {beats:[],bpm:null,confidence:0};const rate=11025,maxSec=Math.max(10,Math.min(600,+opts.maxSec||300)),raw=path.join(tmpRoot,'beat_'+uid()+'.raw');
    try{const r=await api.spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',file,'-t',String(maxSec),'-vn','-ac','1','-ar',String(rate),'-f','s16le',raw]);if(r.code!==0||!exists(raw))return {beats:[],bpm:null,confidence:0};const buf=fs.readFileSync(raw),frame=512,ener=[];for(let o=0;o+frame*2<=buf.length;o+=frame*2){let sum=0;for(let i=0;i<frame;i++){const v=buf.readInt16LE(o+i*2)/32768;sum+=v*v;}ener.push(Math.sqrt(sum/frame));}if(ener.length<8)return {beats:[],bpm:null,confidence:0};const flux=ener.map((v,i)=>i?Math.max(0,v-ener[i-1]):0),beats=[];for(let i=4;i<flux.length-4;i++){let avg=0;for(let j=i-4;j<=i+4;j++)avg+=flux[j];avg/=9;const t=i*frame/rate;if(flux[i]>avg*1.65&&flux[i]>.004&&(beats.length===0||t-beats[beats.length-1]>.18)){beats.push(t);if(beats.length>=1200)break;}}let bpm=null,confidence=0;if(beats.length>=6){const ints=[];for(let i=1;i<beats.length;i++){let d=beats[i]-beats[i-1];while(d<.3)d*=2;while(d>1.0)d/=2;if(d>=.3&&d<=1.0)ints.push(d);}ints.sort((a,b)=>a-b);if(ints.length){const med=ints[Math.floor(ints.length/2)];bpm=Math.round(60/med);const close=ints.filter(x=>Math.abs(x-med)<.055).length;confidence=Math.round(close/ints.length*100);}}return {beats,bpm,confidence};}finally{try{if(exists(raw))fs.unlinkSync(raw);}catch(e){}}
  };
  api.learnSfxDecision=function(records){const db=api.loadSfxCatalog(),L=db.learning||(db.learning=blankSfxCatalog().learning),now=new Date().toISOString();for(const r of records||[]){const bucket=r.action==='reject'?L.rejected:(r.action==='replace'?L.replaced:L.accepted);bucket.push(Object.assign({at:now},r));if(bucket.length>1200)bucket.splice(0,bucket.length-1200);const sig=String(r.signature||''),cat=String(r.category||'');if(sig&&cat){const key=sig+'|'+cat;L.eventCategory[key]=(L.eventCategory[key]||0)+(r.action==='reject'?-1:1);}if(r.action==='replace'&&r.fromPath)L.fileScores[r.fromPath]=(L.fileScores[r.fromPath]||0)-2;if(r.action==='replace'&&sig&&r.fromCategory)L.eventCategory[sig+'|'+r.fromCategory]=(L.eventCategory[sig+'|'+r.fromCategory]||0)-2;if(r.path)L.fileScores[r.path]=(L.fileScores[r.path]||0)+(r.action==='reject'?-1:(r.action==='replace'?2:1));}api.saveSfxCatalog(db);return L;};
  api.resetSfxLearning=()=>{const db=api.loadSfxCatalog();db.learning=blankSfxCatalog().learning;api.saveSfxCatalog(db);return true;};
  api.exportSfxLearning=function(folder){if(!exists(folder)||!fs.statSync(folder).isDirectory())throw Error('پوشه مقصد پیدا نشد');const db=api.loadSfxCatalog(),f=path.join(folder,'Varna_SFX_Learning.json');fs.writeFileSync(f,JSON.stringify({format:'varna-sfx-learning',version:2,learning:db.learning},null,2),'utf8');return f;};
  api.importSfxLearning=function(file){if(!exists(file))throw Error('فایل یادگیری SFX پیدا نشد');const x=JSON.parse(fs.readFileSync(file,'utf8'));if(!x||x.format!=='varna-sfx-learning'||!x.learning)throw Error('فایل یادگیری SFX معتبر نیست');const db=api.loadSfxCatalog(),base=blankSfxCatalog().learning,cur=db.learning||base,src=x.learning||{};['accepted','rejected','replaced'].forEach(k=>{cur[k]=(cur[k]||[]).concat(src[k]||[]).slice(-1800);});for(const k in (src.eventCategory||{}))cur.eventCategory[k]=(cur.eventCategory[k]||0)+(+src.eventCategory[k]||0);for(const k in (src.fileScores||{}))cur.fileScores[k]=(cur.fileScores[k]||0)+(+src.fileScores[k]||0);db.learning=cur;api.saveSfxCatalog(db);return cur;};

  api.defaultLocalAI={root:'C:\\whisper.cpp',runtimeDir:'C:\\whisper.cpp\\llama-b11277-bin-win-cuda-12.4-x64',exe:'C:\\whisper.cpp\\llama-b11277-bin-win-cuda-12.4-x64\\llama-server.exe',typeDir:'C:\\whisper.cpp\\models\\Taype',textDir:'C:\\whisper.cpp\\models\\Text amendment\\Qwen3.5-9B-GGUF',translatorDir:'C:\\whisper.cpp\\models\\Translator\\translategemma-4b-it-GGUF',visionDir:'C:\\whisper.cpp\\models\\Vision\\Qwen2.5-VL-3B-Instruct-GGUF',typeModel:'',textModel:'',translatorModel:'',visionModel:'',mmproj:'',port:1235,gpuLayers:24,context:8192,profile:'balanced',batchSize:256,ubatchSize:128,maxTokens:2048,idleMinutes:0,releaseAfterJob:true,priority:'low',reserveRamGB:2};
  api.modelFiles=folder=>{if(!exists(folder))return [];const out=[];function walk(d,depth){if(depth>8||out.length>800)return;let list=[];try{list=fs.readdirSync(d,{withFileTypes:true});}catch(e){return;}for(const it of list){const f=path.join(d,it.name);if(it.isDirectory())walk(f,depth+1);else if(/\.gguf$/i.test(it.name))out.push({name:it.name,path:f,mmproj:/mmproj/i.test(it.name)});}}walk(folder,0);return out;};
  api.localModelInventory=folder=>{const all=api.modelFiles(folder),models=all.filter(x=>!x.mmproj),mmproj=all.filter(x=>x.mmproj);return {models,mmproj};};
  api.waitFrame=async function(p,cancelled){let size=0,stable=0;for(let i=0;i<100;i++){if(cancelled&&cancelled())throw Error('PREVIEW_CANCELLED');try{const data=fs.readFileSync(p);if(data.length>32&&data.readUInt32BE(0)===0x89504e47){stable=data.length===size?stable+1:0;size=data.length;if(stable>=1)return 'data:image/png;base64,'+data.toString('base64');}}catch(e){}await new Promise(r=>setTimeout(r,100));}throw Error('فریم PNG ساخته نشد. گزینه «Render Queue» پیش‌نمایش را امتحان کن. مسیر: '+p);};
  let lastFailure39=null,recovery39=null;
  let localProcess=null,localStarting=false,localError='',localLog='',localBase='',localRole='',localModelPath='',localKey='',localProjector='',localReady=false,localLimits=null,localSignature='',idleTimer=null;
  let roleQueue=Promise.resolve(),activeRoleJobs=0,queuedRoleJobs=0,cancelEpoch=0,localHoldJobs=0;
  function armIdle(){clearTimeout(idleTimer);if(!localProcess||activeRoleJobs||queuedRoleJobs||localHoldJobs)return;const release=localLimits&&localLimits.releaseAfterJob!==false,ms=release?35:Math.max(0,Number(localLimits&&localLimits.idleMinutes||0))*60000;if(release||ms>0){idleTimer=setTimeout(()=>{if(!activeRoleJobs&&!queuedRoleJobs&&!localHoldJobs)api.stopLocalAI({internal:true,releaseMemory:true});},ms);if(idleTimer&&idleTimer.unref)idleTimer.unref();}}
  function roleJob(fn){const epoch=cancelEpoch;queuedRoleJobs++;clearTimeout(idleTimer);const run=async()=>{queuedRoleJobs--;if(epoch!==cancelEpoch)throw Error('درخواست لغو شد');activeRoleJobs++;try{return await fn();}finally{activeRoleJobs--;armIdle();}};const job=roleQueue.then(run,run);roleQueue=job.catch(()=>{});return job;}
  api.stopLocalAI=options=>{options=options||{};clearTimeout(idleTimer);if(!options.internal)cancelEpoch++;const owned=localProcess,pid=owned&&owned.pid;localProcess=null;localReady=false;try{if(owned&&owned.stdout){owned.stdout.removeAllListeners();owned.stdout.destroy&&owned.stdout.destroy();}}catch(e){}try{if(owned&&owned.stderr){owned.stderr.removeAllListeners();owned.stderr.destroy&&owned.stderr.destroy();}}catch(e){}try{if(owned){owned.removeAllListeners();if(pid&&process.platform==='win32'){const killed=cp.spawnSync('taskkill',['/PID',String(pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});if(killed.error||killed.status!==0)owned.kill();}else owned.kill();}}catch(e){try{if(owned)owned.kill();}catch(ignore){}}localBase='';localRole='';localModelPath='';localProjector='';localKey='';localSignature='';localStarting=false;if(options.releaseMemory!==false){localLog='';localError='';localLimits=null;}return true;};
  api.localAIStatus=()=>({running:!!localProcess&&localReady,starting:localStarting,base:localBase,role:localRole,model:localModelPath,log:localLog,error:localError,limits:localLimits,busy:activeRoleJobs,queued:queuedRoleJobs,held:localHoldJobs,priorityWarning:api.priorityWarning||'',lastFailure39});
  api.beginLocalAIJob=function(){localHoldJobs++;clearTimeout(idleTimer);return localHoldJobs;};
  api.endLocalAIJob=function(){localHoldJobs=Math.max(0,localHoldJobs-1);armIdle();return localHoldJobs;};
  api.withLocalAIJob=async function(fn){api.beginLocalAIJob();try{return await fn();}finally{api.endLocalAIJob();}};
  async function waitServerDown(base){if(!base)return;for(let i=0;i<24;i++){try{await requestJSON(base+'/health',{timeout:180});await new Promise(r=>setTimeout(r,90));}catch(e){return;}}}
  api.startLocalAI=async function(opts,onStatus){
    opts=api.resolveLocalPaths(opts);const limits=R.normalize(opts,cores());if(api._transcribing)throw Error('Whisper در حال پردازش است');if(os.freemem()<limits.reserveRamGB*1073741824)throw Error('RAM آزاد کمتر از ذخیرهٔ تعیین‌شده است؛ برنامه‌های اضافی را ببند یا ذخیره RAM را تغییر بده');if(localStarting)throw Error('مدل در حال بارگذاری است');if(localProcess){const oldBase=localBase;api.stopLocalAI({internal:true});await waitServerDown(oldBase);}
    if(!exists(opts.exe)||!fs.statSync(opts.exe).isFile())throw Error('llama-server.exe پیدا نشد: '+opts.exe);if(!exists(opts.model)||!fs.statSync(opts.model).isFile()||!(/\.gguf$/i.test(opts.model)))throw Error('فایل مدل GGUF پیدا نشد');
    const fd=fs.openSync(opts.model,'r'),magic=Buffer.alloc(4);try{fs.readSync(fd,magic,0,4,0);}finally{fs.closeSync(fd);}if(magic.toString('ascii')!=='GGUF')throw Error('فایل مدل GGUF معتبر نیست');
    const port=Math.floor(+opts.port||1235);if(port<1024||port>65535)throw Error('پورت باید بین ۱۰۲۴ و ۶۵۵۳۵ باشد');
    await new Promise((resolve,reject)=>{const server=nodeRequire('net').createServer();server.once('error',()=>reject(Error('پورت مشغول است؛ پورت دیگری انتخاب کن')));server.listen(port,'127.0.0.1',()=>server.close(resolve));});
    localKey=nodeRequire('crypto').randomBytes(24).toString('hex');localReady=false;localProjector=opts.mmproj||'';const args=['--api-key',localKey,'--model',opts.model,'--alias','varna-local','--host','127.0.0.1','--port',String(port),...R.args(limits,cores()),'--jinja'];if(opts.mmproj){if(!exists(opts.mmproj)||!fs.statSync(opts.mmproj).isFile()||!(/\.gguf$/i.test(opts.mmproj)))throw Error('mmproj Vision پیدا نشد یا معتبر نیست');args.push('--mmproj',opts.mmproj);if(limits.gpuLayers===0)args.push('--no-mmproj-offload');}
    localLimits=limits;localSignature=R.signature(opts,cores());localStarting=true;localError='';localLog='';localBase='http://127.0.0.1:'+port;localRole=opts.role||'manual';localModelPath=opts.model;let child;try{child=trackChild(cp.spawn(opts.exe,args,{windowsHide:true,shell:false,cwd:path.dirname(opts.exe)}));}catch(e){localStarting=false;localError=e.message;throw e;}localProcess=child;lowerPriority(child,limits);const collect=d=>{localLog=(localLog+String(d)).slice(-10000);};child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');child.stdout.on('data',collect);child.stderr.on('data',collect);child.on('error',e=>{localError=e.message;});child.on('exit',code=>{if(localProcess===child){localProcess=null;localError=localError||'موتور متوقف شد: '+code;lastFailure39={message:localError,log:localLog,code,model:opts.model,exe:opts.exe,role:opts.role,at:new Date().toISOString()};}});
    try{for(let i=0;i<300;i++){if(localProcess!==child||localError)throw Error(localError||'بارگذاری لغو شد');try{const r=await requestJSON(localBase+'/health',{timeout:900});if(r.status==='ok'){const identity=await requestJSON(localBase+'/v1/models',{headers:{Authorization:'Bearer '+localKey},timeout:1500});if(!(identity.data||[]).some(m=>m.id==='varna-local'))throw Error('شناسهٔ موتور محلی تأیید نشد');localReady=true;armIdle();return {base:localBase,model:'varna-local',role:localRole,path:localModelPath,apiKey:localKey,limits};}}catch(e){}if(onStatus)onStatus('بارگذاری '+localRole+'… '+Math.round(i/2)+' ثانیه');await new Promise(r=>setTimeout(r,500));}throw Error('زمان بارگذاری مدل تمام شد');}catch(e){const log=localLog,code=lastFailure39&&lastFailure39.code;let advice='';if(/out of memory|failed to allocate|cudaMalloc|cublas|CUDA error|no CUDA|not enough.*memory/i.test(log))advice='حافظه یا راه‌اندازی GPU خطا داد؛ حالت CPU/حافظهٔ کمتر را امتحان کن.';else if(/unknown model architecture|unsupported.*architecture|unknown.*model|unsupported.*gguf/i.test(log))advice='Runtime فعلی از معماری این مدل پشتیبانی نمی‌کند؛ Runtime سازگار را در تنظیمات انتخاب کن.';else if(/unknown argument|invalid argument|unrecognized option/i.test(log))advice='گزینهٔ اجرا با نسخهٔ Runtime سازگار نیست؛ گزارش را بررسی کن.';else if(code===-1073741515||code===3221225781||/dll.*not found|missing.*dll/i.test(log))advice='یکی از DLLهای Runtime موجود نیست؛ کل پوشهٔ Runtime باید کنار فایل اجرایی باشد.';api.stopLocalAI({internal:true});const error=Error([e.message,advice,log.slice(-4000)].filter(Boolean).join('\n'));error.log39=log;error.code39=code;error.recoverGPU39=/out of memory|failed to allocate|cudaMalloc|cublas|CUDA error|no CUDA|not enough.*memory/i.test(log);lastFailure39={message:error.message,log,code,model:opts.model,exe:opts.exe,role:opts.role,at:new Date().toISOString()};localLog=log;localError=error.message;throw error;}finally{localStarting=false;}
  };
  api.ensureLocalRole=async function(role,settings,onStatus){let x=api.resolveLocalPaths(settings);const requested39=R.signature(x,cores())+'|'+String(x.textModel||'')+'|'+String(x.typeModel||'')+'|'+String(x.visionModel||'')+'|'+String(x.translatorModel||'')+'|'+String(x.exe||'')+'|'+String(x.mmproj||'')+'|'+String(role);if(recovery39&&recovery39.key===requested39)x=Object.assign({},x,recovery39.patch);else recovery39=null;const map={type:'typeModel',text:'textModel',translator:'translatorModel',vision:'visionModel'},key=map[role]||'textModel';let actualRole=role,model=x[key];/* Type/classification may intentionally share Qwen Text when Taype has no GGUF yet. */if(role==='type'&&!model){model=x.textModel;actualRole='text';}if(!model)throw Error('مدل نقش '+role+' پیدا نشد. پوشه مربوطه را در تنظیمات مشخص کن.');const mm=role==='vision'?x.mmproj:'';if(role==='vision'&&!mm)throw Error(x.projectorError||'mmproj سازگار با Vision را انتخاب کنید.');if(localProcess&&localReady&&localRole===actualRole&&localModelPath===model&&localProjector===mm&&localSignature===R.signature(x,cores())){localLimits=R.normalize(x,cores());armIdle();return {base:localBase,model:'varna-local',role:actualRole,path:model,apiKey:localKey,limits:localLimits};}try{return await api.startLocalAI(Object.assign({},x,{model,mmproj:mm,role:actualRole}),onStatus);}catch(e){if(!e.recoverGPU39||R.normalize(x,cores()).gpuLayers===0)throw e;const first=e.message,patch={gpuLayers:0,context:Math.min(4096,+x.context||4096),batchSize:Math.min(128,+x.batchSize||128),ubatchSize:Math.min(64,+x.ubatchSize||64)};if(onStatus)onStatus('راه‌اندازی GPU خطا داد؛ یک بار با CPU و حافظهٔ کمتر تلاش می‌شود…');try{const result=await api.startLocalAI(Object.assign({},x,patch,{model,mmproj:mm,role:actualRole}),onStatus);recovery39={key:requested39,patch};result.recovered39=true;if(onStatus)onStatus('مدل با CPU آماده شد؛ بازیابی از خطای GPU.');return result;}catch(cpu){cpu.message='اجرای GPU و CPU هر دو ناموفق بودند.\nGPU: '+first+'\nCPU: '+cpu.message;lastFailure39=Object.assign({},lastFailure39,{message:cpu.message});throw cpu;}}};
  api.prepareLocalRole=(role,settings,onStatus)=>roleJob(()=>api.ensureLocalRole(role,settings,onStatus));
  api.chatRole=function(role,settings,messages,temperature,onStatus){return roleJob(async()=>{const run=await api.ensureLocalRole(role,settings,onStatus);return api.chat({base:run.base,apiKey:run.apiKey,model:'varna-local',messages,temperature:temperature==null?.1:temperature,max_tokens:run.limits.maxTokens});});};
  api.chatVisionRole=function(settings,system,prompt,images,onStatus){return roleJob(async()=>{const run=await api.ensureLocalRole('vision',settings,onStatus);return api.chatVision({base:run.base,apiKey:run.apiKey,model:'varna-local',system,prompt,images,temperature:.1,max_tokens:run.limits.maxTokens});});};


  function srtTime(sec){sec=Math.max(0,Number(sec)||0);const ms=Math.round(sec*1000),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),ss=Math.floor(ms%60000/1000),mmm=ms%1000;return [h,m,ss].map(x=>String(x).padStart(2,'0')).join(':')+','+String(mmm).padStart(3,'0');}
  function parseSrtTime(x){const m=String(x||'').trim().replace('.',',').match(/^(\d+):(\d+):(\d+),(\d{1,3})$/);if(!m)return NaN;return +m[1]*3600 + +m[2]*60 + +m[3] + +(m[4].padEnd(3,'0'))/1000;}
  api.parseSrtFile=function(file){
    if(!exists(file))throw Error('فایل SRT پیدا نشد');
    let txt=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
    const blocks=txt.split(/\n{2,}/),out=[];
    for(const block of blocks){
      const lines=block.split('\n');let ti=lines.findIndex(x=>/-->/.test(x));if(ti<0)continue;
      const mm=lines[ti].match(/([^ ]+)\s*-->\s*([^ ]+)/);if(!mm)continue;
      const start=parseSrtTime(mm[1]),end=parseSrtTime(mm[2]);if(!Number.isFinite(start)||!Number.isFinite(end))continue;
      const text=lines.slice(ti+1).join('\n').trim();if(text)out.push({start,end:Math.max(start+.04,end),text});
    }
    if(!out.length)throw Error('هیچ کپشن معتبری در SRT پیدا نشد');return out;
  };
  api.exportSrtFile=function(folder,groups,name){
    if(!exists(folder)||!fs.statSync(folder).isDirectory())throw Error('پوشه مقصد پیدا نشد');
    const safe=String(name||'GHAF_Subtitles').replace(/[\\/:*?"<>|]+/g,'_'),file=path.join(folder,safe+'.srt');
    const body=(groups||[]).map((g,i)=>String(i+1)+'\r\n'+srtTime(g.start)+' --> '+srtTime(g.end)+'\r\n'+String(g.rawText==null?g.text:g.rawText).replace(/\r\n?/g,'\n').trim().replace(/\n/g,'\r\n')).join('\r\n\r\n');
    fs.writeFileSync(file,'\uFEFF'+body+'\r\n','utf8');return file;
  };
  api.exportSubtitleBundle=function(srtFile,state){const file=srtFile.replace(/\.srt$/i,'.varna.json'),checksum=crypto.createHash('sha256').update(fs.readFileSync(srtFile)).digest('hex');fs.writeFileSync(file,JSON.stringify({format:'varna-srt-companion',version:1,srtChecksum:checksum,state:api.packProjectState(state)}),'utf8');return file;};
  api.importSubtitleBundle=function(srtFile){const file=srtFile.replace(/\.srt$/i,'.varna.json');if(!exists(file))return null;const payload=JSON.parse(fs.readFileSync(file,'utf8'));if(payload.format!=='varna-srt-companion'||payload.version!==1||payload.srtChecksum!==crypto.createHash('sha256').update(fs.readFileSync(srtFile)).digest('hex'))throw Error('فایل پشتیبان با SRT فعلی یکسان نیست');return api.unpackProjectState(payload.state);};
  api.releaseIdleMemory=function(){if(!activeRoleJobs&&!queuedRoleJobs&&!localHoldJobs)try{api.stopLocalAI({internal:true,releaseMemory:true});}catch(e){}return true;};
  api.shutdown=function(){try{api._cancelled=true;}catch(e){}try{api.stopLocalAI({internal:true,releaseMemory:true});}catch(e){}for(const child of Array.from(ownedChildren))try{killTree(child);}catch(e){}ownedChildren.clear();api._activeChild=null;api._transcribing=false;return true;};
  global.GHAFNode=api;
})(window);
