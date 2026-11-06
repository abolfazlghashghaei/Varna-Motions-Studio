/* Native media graph adapter. Existing caption/effect renderers remain available
   through an explicit compatibility path until their native parity gates pass. */
(function(w){
  'use strict';
  function compile(p,cache){
    const fail=reason=>({reason});
    if(p.captions.length||(p.layers52||[]).length)return fail('Text / graphics use the compatibility renderer');
    const duration=VarnaEdit51.duration(p);
    if(!p.clips.length)return fail('');
    if(duration>180)return fail('Native MVP limit: 3 minutes');
    const visual=[],audio=[],events=[];
    const tracks=p.tracks.filter(t=>t.kind==='video').slice().reverse().concat(p.tracks.filter(t=>t.kind==='audio'));
    for(const track of tracks){if(track.muted)continue;
      for(const c of p.clips.filter(c=>c.trackId===track.id)){
        const asset=p.assets.find(a=>a.id===c.assetId),cached=cache?.get(asset?.id);
        if(!asset||!asset.mobile56?.nativeId)return fail('Relink media before native playback');
        if(/\.(gif|svg)$/i.test(asset.name||''))return fail('Animated / vector images use the compatibility renderer');
        if((asset.rotation||cached?.rotation||0)!==0)return fail('Rotated sources use the compatibility renderer');
        if(Object.values(c.keys52||{}).some(a=>a.length)||
          ['rotation','exposure','blur','hue'].some(k=>Math.abs(c[k]||0)>1e-8)||
          ['brightness','contrast','saturation'].some(k=>Math.abs((c[k]??1)-1)>1e-8))return fail('Animated transforms / filters use the compatibility renderer');
        const row={id:c.id,mediaId:asset.mobile56.nativeId,kind:asset.kind,width:asset.width||0,height:asset.height||0,
          startUs:Math.round(c.start*1e6),inUs:Math.round(c.in*1e6),outUs:Math.round(c.out*1e6),
          x:c.x||0,y:c.y||0,scale:c.scale??100,opacity:c.opacity??1,fit:c.fit||'contain',gain:c.gain??1,fadeIn:c.fadeIn||0,fadeOut:c.fadeOut||0};
        (asset.kind==='audio'?audio:visual).push(row);
        const k=asset.kind==='video'?0:asset.kind==='image'?1:2;events.push([row.startUs,k,1],[row.startUs+row.outUs-row.inUs,k,-1]);
      }
    }
    const counts=[0,0,0];events.sort((a,b)=>a[0]-b[0]||a[2]-b[2]);
    for(const e of events){counts[e[1]]+=e[2];if(counts[0]>2||counts[1]>4||counts[0]+counts[2]>8)return fail('More layers than the native device budget; compatibility renderer');}
    return {scene:{format:'varna-native-scene',version:1,width:p.width,height:p.height,fps:p.fps,durationUs:Math.max(Math.round(duration*1e6),...visual.concat(audio).map(c=>c.startUs+c.outUs-c.inUs)),background:p.mobile56?.background||'#10101a',clips:visual.concat(audio)}};
  }
  w.VarnaNativeScene65={compile};
  w.VarnaNativeEditor65=function(ctx){
    const native=w.MobileNative,available=native&&typeof native.openPreview65==='function';
    let signature='',ready=null,session='',generation=0,active=false,blocked='',seeking=0,exporting=false,lastBounds='',preference=localStorage.getItem('mobile65-renderer')||'auto';
    const badge=()=>document.querySelector('#renderer65');
    function plan(){if(!available)return {reason:''};if(preference==='compatibility')return {reason:'Compatibility renderer selected'};const compiled=compile(ctx.project(),ctx.assets);if(compiled.scene&&JSON.stringify(compiled.scene)===blocked)return {reason:'Native renderer failed · compatibility mode'};return compiled;}
    function bounds(){const canvas=document.querySelector('#preview'),box=canvas.getBoundingClientRect(),p=ctx.project(),scale=Math.min(box.width/p.width,box.height/p.height),r={width:p.width*scale,height:p.height*scale,left:box.left+(box.width-p.width*scale)/2,top:box.top+(box.height-p.height*scale)/2};return JSON.stringify({x:Math.max(0,r.left/innerWidth),y:Math.max(0,r.top/innerHeight),w:Math.min(1,r.width/innerWidth),h:Math.min(1,r.height/innerHeight),visible:document.querySelector('#editor')?.classList.contains('active')&&!document.querySelector('dialog[open]')&&!document.hidden});}
    function layout(){if(available&&active){const next=bounds();if(next!==lastBounds){lastBounds=next;native.layoutPreview65(next);}}}
    function close(){if(available&&(active||ready))native.closePreview65();active=false;ready=null;signature='';session='';lastBounds='';generation++;}
    function showBadge(text){const el=badge();if(el){el.hidden=!text;el.textContent=text;el.title=text;}}
    function ensure(){const p=plan();if(!p.scene)return Promise.reject(Error(p.reason||'No native media scene'));const text=JSON.stringify(p.scene);
      if(text===signature&&ready)return ready;
      const version=++generation;signature=text;session='';active=true;ctx.status(ctx.label('Preparing media…','آماده‌سازی رسانه…'));
      ready=ctx.request('openPreview65',text,ctx.time(),bounds()).then(data=>{if(version!==generation)throw Error('Preview replaced');session=data.session;layout();ctx.status(ctx.label('Native preview ready','پیش‌نمایش بومی آماده است'));return data;}).catch(error=>{if(version===generation){blocked=text;close();ctx.status(error.message);ctx.draw();}throw error;});
      return ready;
    }
    function refresh(){if(!available)return false;if(!document.querySelector('#editor')?.classList.contains('active')){layout();return active;}if(exporting||ctx.exporting())return false;
      const p=plan();if(!p.scene){const previous=active;close();if(previous)ctx.recover(ctx.time());showBadge(p.reason?ctx.label('Compatible','سازگار'):'');if(badge())badge().title=p.reason||'';return false;}
      active=true;showBadge(ctx.label('Native','بومی'));ensure().catch(()=>{});return true;
    }
    w.MobileTimeline65=function(data){if(active&&data.session===session&&!seeking){if(data.error){blocked=signature;close();ctx.status(data.error);ctx.update({time:data.time,playing:false});ctx.recover(data.time);return;}ctx.update(data);}};
    w.MobileError65=message=>ctx.status(message);
    w.MobileProgress65=data=>{if(exporting)ctx.progress(data);};
    function pause(){if(available)native.pausePreview65();}
    async function seek(t){seeking++;try{await ensure();return await ctx.request('seekPreview65',t);}finally{seeking--;}}
    async function play(){await ensure();const data=await ctx.request('playPreview65');ctx.update(data);}
    async function renderExport(){const p=plan();if(!p.scene)throw Error(p.reason);exporting=true;close();try{return await ctx.request('exportScene65',JSON.stringify(p.scene));}finally{exporting=false;}}
    if(available){if(badge())badge().onclick=function(){ctx.pause();preference=preference==='auto'?'compatibility':'auto';localStorage.setItem('mobile65-renderer',preference);blocked='';close();ctx.status(preference==='auto'?ctx.label('Automatic native renderer','انتخاب خودکار رندر بومی'):ctx.label('Compatibility renderer selected','رندر سازگار انتخاب شد'));ctx.recover(ctx.time());};if(w.ResizeObserver)new ResizeObserver(layout).observe(document.querySelector('#preview'));new MutationObserver(layout).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','open']});w.addEventListener('resize',layout);document.addEventListener('visibilitychange',layout);}
    return {refresh,active:()=>active,eligible:()=>!!plan().scene,reason:()=>plan().reason,seek,play,pause,close,layout,export:renderExport};
  };
})(window);
