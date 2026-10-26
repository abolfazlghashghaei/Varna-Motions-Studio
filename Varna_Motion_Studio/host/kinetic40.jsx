/* Avoid a RegExp literal here: the reported native loader stopped on this line. */
GHAFHost._rtlText40=function(text,rtl){
 if(!rtl)return text;var value=String(text),out='',i=0,start,c;
 function word(ch){var n=ch.charCodeAt(0);return (n>=48&&n<=57)||(n>=65&&n<=90)||(n>=97&&n<=122)||(n>=1776&&n<=1785)||(n>=1632&&n<=1641);}
 while(i<value.length){if(!word(value.charAt(i))){out+=value.charAt(i++);continue;}start=i;
  while(i<value.length){if(word(value.charAt(i))){i++;continue;}c=value.charAt(i);if('._:/%+-'.indexOf(c)>=0&&i+1<value.length&&word(value.charAt(i+1))){i++;continue;}break;}
  out+='\u2066'+value.substring(start,i)+'\u2069';
 }return out;
};
GHAFHost._isOwnedCaptionSource40=function(s){return typeof CompItem!=='undefined'&&s instanceof CompItem&&/^(VARNA_KINETIC40_INSTANCE:|VARNA_TEMPLATE38_INSTANCE:|VARNA_SMART_CAPTION)/.test(String(s.comment||''));};
GHAFHost._createKinetic40=function(c,g,name){
 var scene=VarnaKinetic40.resolve(g,g.anim.kinetic40,g.protected40||[]),span=Number(g.end)-Number(g.start),copy=null,layer=null,i;
 if(!isFinite(Number(g.start))||span<=0||Number(g.start)>=c.duration)throw Error('CAPTION_OUTSIDE_COMP');
 if(g.safeBox&&Math.abs(c.width/c.height/Number(g.safeBox.ratio)-1)>.05)throw Error('SAFE_ZONE_ASPECT_MISMATCH');
 try{
  copy=app.project.items.addComp('__VARNA_SCENE40_'+g.id+'_'+new Date().getTime(),c.width,c.height,c.pixelAspect||1,Math.max(c.frameDuration,span),c.frameRate);copy.comment='VARNA_KINETIC40_INSTANCE:'+g.id;
  var texts=[],data=[],measures=[],backgrounds=[],base=GHAFJSON.parse(GHAFJSON.stringify(g.style||{})),selected=g.highlight37&&(g.highlight37.rawIndices38||g.highlight37.indices)||[];
  for(i=0;i<scene.pieces.length;i++){
   var p=scene.pieces[i],st=GHAFJSON.parse(GHAFJSON.stringify(base)),bg=VarnaKinetic40.pieceBackground(g.bg||{},p);backgrounds.push(bg);
   st.justifyMode='none';st.align=0;st.maxLines=0;st.fitWidthPct=100;st.boxWidthPct=100;st.rtl=/[\u0600-\u06ff]/.test(p.text);if(p.fontPS)st.fontPS=p.fontPS;if(p.look48.tracking!=null)st.tracking=p.look48.tracking;if(p.look48.stroke!=='inherit'){st.stroke=p.look48.stroke==='on';st.strokeHex=p.look48.strokeHex;st.strokeWidth=p.look48.strokeWidth;}if(p.color){st.fill=p.color;st.fillMode='solid';}
   // Measure complete native text first; create its background once after final placement.
   var d={id:String(g.id)+'_'+i,text:GHAFHost._rtlText40(p.text,st.rtl),rawText:p.text,start:0,end:copy.duration,style:st,bg:{enabled:false},anim:{mode:'simple',preset:'none',outPreset:'none',typeSound:false,syncMode:'separate'},highlight37:null},l=GHAFHost._createTextLayer(copy,d,'قطعه '+(i+1)+' · '+p.text),r=l.sourceRectAtTime(0,false);
   texts.push(l);data.push(d);var factor=1,pad=bg.enabled?Math.max(0,Number(bg.padding)||0)*2:0;
   if(scene.config.useKeywords)for(var hi=0;hi<selected.length;hi++)if(Number(selected[hi])>=p.from&&Number(selected[hi])<p.to)factor=Math.max(1,Math.min(1.4,Number(g.highlight37.scale||100)/100));
   measures.push({width:Math.max(1,r.width)*factor+pad,height:Math.max(Number(st.size)||72,r.height)*factor+pad});
  }
  var plan=VarnaKinetic40.layout(scene,c.width,c.height,measures,g.safeBox),handle=copy.layers.addNull();handle.name='کنترل کل صحنه · جابه‌جایی و اندازه';handle.comment='VARNA_KINETIC40_HANDLE';handle.inPoint=0;handle.outPoint=copy.duration;handle.property('ADBE Transform Group').property('ADBE Anchor Point').setValue([0,0]);handle.property('ADBE Transform Group').property('ADBE Position').setValue([0,0]);
  for(i=0;i<texts.length;i++){
   var p=scene.pieces[i],l=texts[i],d=data[i],pos=plan.items[i],motion=p.motion45,kind=motion.entry==='inherit'?scene.config.entry:motion.entry;
   var available=Math.max(copy.frameDuration,(p.end-p.start)*span),next=i+1<scene.pieces.length?scene.pieces[i+1].start:1;
   var pacing=Math.max(copy.frameDuration,Math.min(available,Math.max(copy.frameDuration,(next-p.start)*span)));
   var reveal=Math.max(.03,Math.min(motion.duration*Math.max(1,(p.to-p.from)*.65),pacing*.85));
   d.start=p.start*span;d.end=Math.max(d.start+copy.frameDuration,Math.min(copy.duration,p.end*span));
   d.style.size=Math.max(1,(Number(base.size)||72)*pos.scale);if(d.style.stroke)d.style.strokeWidth=(Number(d.style.strokeWidth)||2)*pos.scale;if(Number(base.leading)>0)d.style.leading=Number(base.leading)*pos.scale;
   d.style.x=pos.x/c.width*100;d.style.y=pos.y/c.height*100;d.bg=GHAFJSON.parse(GHAFJSON.stringify(backgrounds[i]));if(d.bg.enabled&&d.bg.padding!=null)d.bg.padding=Number(d.bg.padding)*pos.scale;if(d.bg.enabled&&d.bg.round!=null)d.bg.round=Number(d.bg.round)*pos.scale;
   l.inPoint=d.start;l.outPoint=d.end;GHAFHost._resetCaptionMotion(l,d);GHAFHost._applyTextStyle(l,d.style,d.text);
   var rr=l.sourceRectAtTime(d.start,false),tr=l.property('ADBE Transform Group');tr.property('ADBE Anchor Point').setValue([rr.left+rr.width/2,rr.top+rr.height/2]);tr.property('ADBE Rotate Z').setValue(pos.rotation);
   d.anim={mode:'simple',preset:kind==='type'?'none':kind,outPreset:motion.out==='none'?'none':'mirror:'+motion.out,inDur:reveal,outDur:Math.min(motion.outDuration,available*.4),strength:Math.max(12,d.style.size*.5),typeSound:false,syncMode:'separate',word39:{preset:kind==='type'?'type':'none',order:'forward',timing:'even',duration:reveal,distance:30,colorMode:'static',colorTarget:'important'}};
   GHAFHost._addAnimMarkers(l,d,d.anim);GHAFHost._animTransform(l,d,d.anim);GHAFHost._applyOutro(l,d,d.anim);
   if(kind==='spring'){var springExpr=GHAFHost._markerProgressExpr('IN','IN',d.start,d.start+reveal,false)+"var u=q>=1?1:1-Math.exp(-7*q)*Math.cos(12*q);var sf=.88+.12*u;";if(motion.out==='pop')springExpr+=GHAFHost._markerProgressExpr('OUT','OUT',Math.max(d.start,d.end-d.anim.outDur),d.end,false)+'sf*=1-.14*q;';tr.property('ADBE Scale').expression=springExpr+'[value[0]*sf,value[1]*sf];';}
   var local=[];if(scene.config.useKeywords)for(var j=0;j<selected.length;j++)if(Number(selected[j])>=p.from&&Number(selected[j])<p.to)local.push(Number(selected[j])-p.from);
   d.highlight37={indices:local,color:p.color||g.highlight37&&g.highlight37.color||'#F8CB67',scale:g.highlight37&&g.highlight37.scale||100};GHAFHost._highlight37(l,d.highlight37,d);
   if(!GHAFHost._applyBg(l,d.bg))throw Error('BACKGROUND_APPLY_FAILED');GHAFHost._applyBgVendorEffects(l,d.bg);l.parent=handle;
   GHAFHost._finalizeBackground27(l,d.bg,d);
   // Independent backgrounds keep design rotation and follow the scene handle.
   for(var bi=1;bi<=copy.numLayers;bi++){var bgLayer=copy.layer(bi);if(String(bgLayer.comment||'')==='VARNA_BG_ANCHOR:'+l.name){var locked=bgLayer.locked;bgLayer.locked=false;bgLayer.parent=handle;bgLayer.property('ADBE Transform Group').property('ADBE Rotate Z').setValue(pos.rotation);bgLayer.locked=locked;}}
  }
  GHAFHost._validateTemplate38(copy,'تایپوگرافی');layer=c.layers.add(copy);layer.name=name;layer.comment='VARNA_CAPTION_ID:'+g.id+'\nVARNA_KINETIC40:'+g.id;layer.startTime=Number(g.start);layer.inPoint=Number(g.start);layer.outPoint=Math.min(c.duration,Number(g.end));
  var t=layer.property('ADBE Transform Group');t.property('ADBE Anchor Point').setValue([c.width/2,c.height/2]);t.property('ADBE Position').setValue([c.width/2,c.height/2]);t.property('ADBE Scale').setValue([100,100]);layer.stretch=100;/* The child duration already equals the cue span; native playback needs no Time Remap. */GHAFHost._kineticDestination40=c;return layer;
 }catch(e){if(layer)try{layer.remove();}catch(ignore){}if(copy)try{if(copy.usedIn.length===0)copy.remove();}catch(ignore2){}throw e;}
};
GHAFHost._captionBlock40=function(c,root){var out=[root],meta=GHAFHost._buildMeta37?GHAFHost._buildMeta37(root):null;for(var i=1;i<=c.numLayers;i++){var l=c.layer(i);if(l===root)continue;var m=GHAFHost._buildMeta37?GHAFHost._buildMeta37(l):null;if(meta&&m&&meta.block===m.block){out.push(l);continue;}if(/^__GHAF_NATIVE_BG__|^__GHAF_GLASS_BLUR__|^__GHAF_TEMPLATE_BG__|^__GHAF_TYPE_MEASURE__|^__VARNA_BG_ANCHOR__/.test(String(l.name||''))&&(l.parent===root||String(l.name).slice(-String(root.name).length)===String(root.name)))out.push(l);}return out;};
GHAFHost.openKineticCaption40=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._outputComp36(p);if(!c)return GHAFHost._err('NO_COMP');for(var i=1;i<=c.numLayers;i++){var l=c.layer(i);if(String(l.comment||'').split('\n')[0]==='VARNA_CAPTION_ID:'+p.id&&l.source instanceof CompItem&&String(l.source.comment||'').indexOf('VARNA_KINETIC40_INSTANCE:')===0){l.source.openInViewer();return GHAFHost._ok({name:l.source.name,opened:true});}}return GHAFHost._err('ابتدا خروجی این صحنه را بساز.');};
(function(){var create=GHAFHost._createCaption,remove=GHAFHost._deleteLayers,refresh=GHAFHost.refreshCaptionStyles,target=GHAFHost._outputComp36,list=GHAFHost.getOutputComps36;
GHAFHost._createCaption=function(c,g,name){if(g.anim&&g.anim.kinetic40&&g.anim.kinetic40.enabled!==false)return GHAFHost._createKinetic40(c,g,name);return create(c,g,name);};
GHAFHost._deleteLayers=function(layers){var comps=[],i;for(i=0;i<layers.length;i++)try{if(layers[i].source instanceof CompItem&&String(layers[i].source.comment||'').indexOf('VARNA_KINETIC40_INSTANCE:')===0)comps.push(layers[i].source);}catch(ignore){}remove(layers);for(i=0;i<comps.length;i++)try{if(comps[i].usedIn.length===0)comps[i].remove();}catch(ignore2){}};
GHAFHost._outputComp36=function(p){var c=target(p);if(p.compId!=null||!c||String(c.comment||'').indexOf('VARNA_KINETIC40_INSTANCE:')!==0)return c;for(var i=1;i<=app.project.numItems;i++){var candidate=app.project.item(i);if(candidate instanceof CompItem&&!/^(VARNA_KINETIC40_INSTANCE:|VARNA_TEMPLATE38_)/.test(String(candidate.comment||''))&&((p.fallbackCompId!=null&&candidate.id===Number(p.fallbackCompId))||(p.fallbackCompId==null&&p.fallbackCompName&&candidate.name===p.fallbackCompName)||candidate===GHAFHost._kineticDestination40))return candidate;}return null;};
GHAFHost.getOutputComps36=function(encoded){var r=GHAFJSON.parse(list(encoded));if(!r.ok)return GHAFJSON.stringify(r);var hidden={},keep=[],i;for(i=1;i<=app.project.numItems;i++){var c=app.project.item(i);if(String(c.comment||'').indexOf('VARNA_KINETIC40_INSTANCE:')===0)hidden['c'+c.id]=true;}for(i=0;i<(r.data.items||[]).length;i++)if(!hidden['c'+r.data.items[i].id])keep.push(r.data.items[i]);r.data.items=keep;return GHAFJSON.stringify(r);};
GHAFHost.refreshCaptionStyles=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return refresh(encoded);var normal=[],rebuild=[],before=GHAFHost._layerSet(c),old=[],i,j;for(i=0;i<(p.groups||[]).length;i++){var g=p.groups[i],roots=[];for(j=1;j<=c.numLayers;j++){var l=c.layer(j);if(String(l.comment||'').split('\n')[0]==='VARNA_CAPTION_ID:'+g.id)roots.push(l);}var complex=!!(g.anim&&(g.anim.kinetic40&&g.anim.kinetic40.enabled!==false||g.anim.template38&&g.anim.template38.id));for(j=0;j<roots.length;j++)if(GHAFHost._isOwnedCaptionSource40(roots[j].source))complex=true;if(complex){for(j=0;j<roots.length;j++)rebuild.push({g:g,root:roots[j]});}else normal.push(g);}
var input={};for(var k in p)input[k]=p[k];input.groups=normal;if(!rebuild.length)return refresh(encodeURIComponent(GHAFJSON.stringify(input)));app.beginUndoGroup('Varna Replace Caption Renderer');try{for(i=0;i<rebuild.length;i++){var item=rebuild[i],prior=GHAFHost._layerSet(c),made=GHAFHost._createCaption(c,item.g,item.root.name),block=GHAFHost._newLayers(c,prior);made.comment='VARNA_CAPTION_ID:'+item.g.id+'\n'+String(made.comment||'').replace(/^VARNA_CAPTION_ID:[^\n]*\n?/,'');GHAFHost._finishOutputBlock35(c,block,item.g,null);made.moveBefore(item.root);if(item.root.parent)made.parent=item.root.parent;made.locked=item.root.locked;old=old.concat(GHAFHost._captionBlock40(c,item.root));}var result=GHAFJSON.parse(refresh(encodeURIComponent(GHAFJSON.stringify(input))));if(!result.ok)throw Error(result.error);GHAFHost._deleteLayers(old);result.data.updated=Number(result.data.updated||0)+rebuild.length;return GHAFJSON.stringify(result);}catch(e){GHAFHost._deleteLayers(GHAFHost._newLayers(c,before));return GHAFHost._err(String(e));}finally{app.endUndoGroup();}};
})();
