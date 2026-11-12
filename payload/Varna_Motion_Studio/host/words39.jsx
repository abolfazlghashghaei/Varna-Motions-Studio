/* RC43: word-index selection; full-source native word motion and color timing. ES3. */
GHAFHost._wordSelector39=function(anim,index){
 var sel=anim.property('ADBE Text Selectors').addProperty('ADBE Text Selector'),adv=sel.property('ADBE Text Range Advanced');
 adv.property('ADBE Text Range Units').setValue(2);adv.property('ADBE Text Range Type2').setValue(3);adv.property('ADBE Text Selector Smoothness').setValue(0);
 sel.property('ADBE Text Index Start').setValue(index);sel.property('ADBE Text Index End').setValue(index+1);return sel;
};
GHAFHost._wordTimes39=function(g){
 var data=g.word39&&g.word39.times,raw=String(g.rawText!=null?g.rawText:g.text||'').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/^\s+|\s+$/g,''),n=raw?raw.split(/\s+/).length:0,out=[],timing=g.timing38||[],cfg=g.anim&&g.anim.word39||{},duration=Math.max(.001,Number(g.end)-Number(g.start)),valid=cfg.timing!=='even'&&timing.length===n,i;
 for(i=0;i<n;i++)if(valid&&(!isFinite(Number(timing[i].start))||!isFinite(Number(timing[i].end))||Number(timing[i].end)<=Number(timing[i].start)||(i>0&&Number(timing[i].start)<Number(timing[i-1].start))))valid=false;
 for(i=0;i<n;i++){
  var a=valid?(Number(timing[i].start)-Number(g.start))/duration:i/Math.max(1,n),b=valid?(Number(timing[i].end)-Number(g.start))/duration:(i+1)/Math.max(1,n);
  out.push([Math.max(0,Math.min(1,a)),Math.max(0,Math.min(1,b))]);
 }
 if(cfg.order==='reverse')out.reverse();
 if(data&&data.length===n){for(i=0;i<n;i++)if(!data[i]||!isFinite(Number(data[i][0]))||!isFinite(Number(data[i][1]))||Number(data[i][1])<Number(data[i][0]))throw Error('WORD_TIMING_INVALID');else out[i]=[Math.max(0,Math.min(1,Number(data[i][0]))),Math.max(0,Math.min(1,Number(data[i][1])))];}
 return out;
};
GHAFHost._wordProgress39=function(g,index){
 var times=GHAFHost._wordTimes39(g),cfg=g.anim&&g.anim.word39||{},window=times[index]||[0,1],span=Math.max(.001,Number(g.end)-Number(g.start)),transition=Math.max(.001,Math.min(Math.max(.03,Number(cfg.duration)||.22)/span,Math.max(.001,(window[1]-window[0])*.85)));
 return 'var r=(time-inPoint)/Math.max(.001,outPoint-inPoint),q=ease(r,'+window[0]+','+Math.min(1,window[0]+transition)+',0,1);';
};
GHAFHost._wordMotion39=function(layer,g){
 var cfg=g.anim&&g.anim.word39||{},kind=String(cfg.preset||'none');if(kind==='none')return;
 var text=layer.property('ADBE Text Properties'),animators=text.property('ADBE Text Animators'),times=GHAFHost._wordTimes39(g),distance=Math.max(0,Math.min(500,Number(cfg.distance)||0)),i;
 if(times.length>300)throw Error('حرکت کلمه‌ای برای هر کپشن حداکثر ۳۰۰ واژه دارد؛ کپشن را تقسیم کن.');
 if(kind==='type'){
  var an=animators.addProperty('ADBE Text Animator');an.name='VARNA WORD39 type';an.property('ADBE Text Animator Properties').addProperty('ADBE Text Opacity').setValue(0);
  var sel=an.property('ADBE Text Selectors').addProperty('ADBE Text Selector'),adv=sel.property('ADBE Text Range Advanced');adv.property('ADBE Text Range Units').setValue(1);adv.property('ADBE Text Range Type2').setValue(1);adv.property('ADBE Text Selector Smoothness').setValue(0);
  var str=String(g.text||'').replace(/[\r\n\u200e\u200f\u202a-\u202e\u2066-\u2069\u064b-\u065f\u0670]/g,''),count=Math.max(1,str.length),dur=Math.max(.03,Math.min(Number(cfg.duration)||.22,Math.max(.03,Number(g.end)-Number(g.start)))),fraction=Math.min(1,dur/Math.max(.001,Number(g.end)-Number(g.start))),expr='var q=Math.max(0,Math.min(1,(time-inPoint)/Math.max(.001,(outPoint-inPoint)*'+fraction+'))),p=Math.floor(q*'+count+')/'+count+'*100;';
  if(cfg.order==='reverse'){sel.property('ADBE Text Percent Start').setValue(0);sel.property('ADBE Text Percent End').expression=expr+'100-p;';}else{sel.property('ADBE Text Percent End').setValue(100);sel.property('ADBE Text Percent Start').expression=expr+'p;';}return;
 }
 for(i=0;i<times.length;i++){
  var a=animators.addProperty('ADBE Text Animator');a.name='VARNA WORD39 '+i;var props=a.property('ADBE Text Animator Properties'),progress=GHAFHost._wordProgress39(g,i);
  props.addProperty('ADBE Text Opacity').expression=progress+'q*100;';
  if(kind==='drop'||kind==='rise'||kind==='left'||kind==='right'){var x=kind==='left'?-distance:kind==='right'?distance:0,y=kind==='drop'?-distance:kind==='rise'?distance:0;props.addProperty('ADBE Text Position 3D').expression=progress+'['+x+'*(1-q),'+y+'*(1-q),0];';}
  if(kind==='pop')props.addProperty('ADBE Text Scale 3D').expression=progress+'var s=q<.75?linear(q,0,.75,65,108):linear(q,.75,1,108,100);[s,s,100];';
  GHAFHost._wordSelector39(a,i);
 }
};
GHAFHost._wordHighlight39=function(layer,h,g){
 var text=layer.property('ADBE Text Properties'),animators=text.property('ADBE Text Animators'),cfg=g&&g.anim&&g.anim.word39||{},indices=h&&h.indices||[],mode=String(cfg.colorMode||'static'),i;
 for(i=animators.numProperties;i>=1;i--){var name=String(animators.property(i).name);if(name.indexOf('VARNA EMPHASIS37 ')===0||name.indexOf('VARNA EMPHASIS39 ')===0)animators.property(i).remove();}
 if(mode==='none')return;
 if(cfg.colorTarget==='all'&&g){indices=[];var all=GHAFHost._wordTimes39(g);for(i=0;i<all.length;i++)indices.push(i);}
 var seen={},times=g?GHAFHost._wordTimes39(g):null,color=GHAFHost._hex(h&&h.color||cfg.color||'#F8CB67'),base=GHAFHost._hex(g&&g.style&&g.style.fill||'#FFFFFF'),scale=Math.max(80,Math.min(140,Number(h&&h.scale||100)));
 for(i=0;i<indices.length;i++){
  var index=Number(indices[i]);if(!isFinite(index)||index<0||index!==Math.floor(index)||times&&index>=times.length)throw Error('HIGHLIGHT_WORD_INDEX_INVALID');if(seen['w'+index])continue;seen['w'+index]=true;
  var an=animators.addProperty('ADBE Text Animator');an.name='VARNA EMPHASIS39 '+index;var props=an.property('ADBE Text Animator Properties'),p=props.addProperty('ADBE Text Fill Color'),when=times&&times[index],cond='true';
  if(when&&(mode==='active'||mode==='spoken'))cond='r>='+when[0]+(mode==='active'?'&&r<'+when[1]:'');
  var expression='var r=(time-inPoint)/Math.max(.001,outPoint-inPoint),on=('+cond+');';if(mode==='active'||mode==='spoken')p.expression=expression+'on?'+GHAFJSON.stringify(color)+':'+GHAFJSON.stringify(base)+';';else p.setValue(color);
  if(scale!==100){var sp=props.addProperty('ADBE Text Scale 3D');if(mode==='active'||mode==='spoken')sp.expression=expression+'var s=on?'+scale+':100;[s,s,100];';else sp.setValue([scale,scale,100]);}
  GHAFHost._wordSelector39(an,index);
 }
};
(function(){var motion=GHAFHost._animTransform,refresh=GHAFHost.refreshCaptionStyles;
 GHAFHost._animTransform=function(layer,g,a){if(a&&a.word39&&a.word39.preset&&a.word39.preset!=='none')return GHAFHost._wordMotion39(layer,g);return motion(layer,g,a);};
 /* Style updates use the same word schedule as new output, without depending on global preview state. */
 GHAFHost.refreshCaptionStyles=function(encoded){var p=GHAFHost._parse(encoded);for(var i=0;i<(p.groups||[]).length;i++)if(p.groups[i].anim&&p.groups[i].anim.word39)p.updateMotion=true;return refresh(encodeURIComponent(GHAFJSON.stringify(p)));};
})();

/* Old preview signatures do not encode renderer behavior; rebuild once after upgrade. */
if(GHAFHost._livePreviewRevision39!==GHAFHost._bridgeRevision){GHAFHost._livePreviewRecords={};GHAFHost._livePreviewRevision39=GHAFHost._bridgeRevision;}
