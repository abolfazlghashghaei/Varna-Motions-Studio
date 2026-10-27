/* ES3. Build a new owned composition; never rewrite the user's current timeline. */
(function () {
function num(v,lo,hi,label){v=Number(v);if(!isFinite(v)||v<lo||v>hi)throw Error('مقدار نامعتبر: '+label);return v;}
GHAFHost.buildEditTimeline51=function(encoded){
 var p=GHAFHost._parse(encoded),made=[],comp=null,folder=null,i,j,a,c,t,item,layer,files={},sources={},tracks={},duration=.1,ordered=[],captions=p.captions||[];
 try{
  if(p.format!=='varna-edit'||Number(p.version)!==1)throw Error('فرمت پروژه معتبر نیست.');
  var width=num(p.width,160,3840,'width'),height=num(p.height,90,3840,'height'),fps=num(p.fps,12,60,'fps');
  if(!p.assets||!p.tracks||!p.clips||p.clips.length>10000||captions.length>10000)throw Error('ساختار پروژه معتبر نیست.');
  for(i=0;i<p.tracks.length;i++){t=p.tracks[i];tracks[String(t.id)]=t;}
  for(i=0;i<p.assets.length;i++){a=p.assets[i];files[String(a.id)]=a;}
  for(i=0;i<p.clips.length;i++){c=p.clips[i];a=files[String(c.assetId)];t=tracks[String(c.trackId)];if(!a||!t)throw Error('مرجع رسانه یا ترک پیدا نشد.');if(!a.localPath||!(new File(String(a.localPath))).exists)throw Error('فایل رسانه پیدا نشد: '+a.name);var start=num(c.start,0,86400,'start'),ci=num(c['in'],0,86400,'in'),co=num(c.out,ci+.019,86400,'out');duration=Math.max(duration,start+co-ci);num(c.gain,0,3,'gain');num(c.scale,1,400,'scale');num(c.opacity,0,1,'opacity');num(c.x,-100,100,'x');num(c.y,-100,100,'y');num(c.brightness,0,2,'brightness');num(c.contrast,0,2,'contrast');num(c.saturation,0,2,'saturation');num(c.hue,-180,180,'hue');}
  for(i=0;i<captions.length;i++){num(captions[i].start,0,86400,'caption start');duration=Math.max(duration,num(captions[i].end,Number(captions[i].start)+.019,86400,'caption end'));}
  num(duration,.02,86400,'duration');
  app.beginUndoGroup('Varna Edit Studio');
  try{
   folder=app.project.items.addFolder('Varna Edit · '+String(p.name||'Project'));made.push(folder);folder.comment='VARNA_EDIT51';
   comp=app.project.items.addComp('Varna Edit · '+String(p.name||'Project'),Math.round(width),Math.round(height),1,duration,fps);made.push(comp);comp.parentFolder=folder;comp.comment='VARNA_EDIT51';
   // AE adds at the top. Build lower visual tracks first, and captions last.
   for(i=p.tracks.length-1;i>=0;i--)for(j=0;j<p.clips.length;j++)if(String(p.clips[j].trackId)===String(p.tracks[i].id))ordered.push(p.clips[j]);
   for(i=0;i<ordered.length;i++){
    c=ordered[i];a=files[String(c.assetId)];t=tracks[String(c.trackId)];item=sources[String(a.id)];if(!item){item=GHAFHost._findFootageByFile(String(a.localPath));if(!item){item=app.project.importFile(new ImportOptions(new File(String(a.localPath))));made.push(item);item.parentFolder=folder;}sources[String(a.id)]=item;}
    if(a.kind!=='image'&&Number(item.duration)+.02<Number(c.out))throw Error('منبع از بازهٔ کلیپ کوتاه‌تر است: '+a.name);
    layer=comp.layers.add(item);layer.name=String(a.name||'Clip');layer.comment='VARNA_EDIT_CLIP51:'+String(c.id);layer.startTime=Number(c.start)-Number(c['in']);layer.inPoint=Number(c.start);layer.outPoint=Number(c.start)+Number(c.out)-Number(c['in']);layer.enabled=!t.muted;
    var tr=layer.property('ADBE Transform Group'),ratio=(c.fit==='cover'?Math.max(width/item.width,height/item.height):Math.min(width/item.width,height/item.height))*Number(c.scale);
    if(a.kind!=='audio'){tr.property('ADBE Scale').setValue([ratio,ratio]);tr.property('ADBE Position').setValue([width/2+Number(c.x)*width/100,height/2+Number(c.y)*height/100]);tr.property('ADBE Opacity').setValue(Number(c.opacity)*100);
     if(Number(c.brightness)!==1||Number(c.contrast)!==1){var bc=layer.property('ADBE Effect Parade').addProperty('ADBE Brightness & Contrast 2');bc.property(1).setValue((Number(c.brightness)-1)*100);bc.property(2).setValue((Number(c.contrast)-1)*100);}
     if(Number(c.saturation)!==1||Number(c.hue)!==0){var hs=layer.property('ADBE Effect Parade').addProperty('ADBE HUE SATURATION');hs.property('ADBE HUE SATURATION-0004').setValue((Number(c.saturation)-1)*100);hs.property('ADBE HUE SATURATION-0003').setValue(Number(c.hue));}
    }
    if(layer.hasAudio){var audio=layer.property('ADBE Audio Group').property('ADBE Audio Levels'),db=Number(c.gain)>0?20*Math.log(Number(c.gain))/Math.LN10:-192;layer.audioEnabled=!t.muted&&Number(c.gain)>0;audio.setValue([db,db]);var fi=Math.min(Number(c.fadeIn)||0,(layer.outPoint-layer.inPoint)/2),fo=Math.min(Number(c.fadeOut)||0,(layer.outPoint-layer.inPoint)/2);if(fi>0){audio.setValueAtTime(layer.inPoint,[-60,-60]);audio.setValueAtTime(layer.inPoint+fi,[db,db]);}if(fo>0){audio.setValueAtTime(layer.outPoint-fo,[db,db]);audio.setValueAtTime(layer.outPoint,[-60,-60]);}}
    layer.locked=!!t.locked;
   }
   for(i=0;i<captions.length;i++){
    c=captions[i];var g;if(c.native){g=GHAFJSON.parse(GHAFJSON.stringify(c.native));g.start=Number(c.start);g.end=Number(c.end);g.rawText=String(c.text);g.text=String(c.text);}else{var s=c.style||{};g={id:String(c.id),text:String(c.text),rawText:String(c.text),start:Number(c.start),end:Number(c.end),style:{fontPS:String(s.font||'Tahoma'),size:Number(s.size)||60,fill:s.color||'#FFFFFF',x:s.x==null?50:Number(s.x),y:s.y==null?82:Number(s.y),rtl:/[\u0600-\u06ff]/.test(c.text),stroke:!!s.stroke,strokeHex:s.stroke||'#000000',strokeWidth:Number(s.strokeWidth)||2},bg:{enabled:!!s.bg,engine:'native',style:'solid',hex:s.bg||'#172A39',opacity:(s.bgOpacity==null?.9:Number(s.bgOpacity))*100,round:Number(s.round)||12,padding:16},anim:{mode:'simple',preset:'none',typeSound:false,word39:{enabled:true,preset:s.entry||'fade',duration:.35,timing:'speech',order:'forward'}}};}
    GHAFHost._createCaption(comp,g,'Varna Text · '+String(c.id));
   }
   comp.openInViewer();return GHAFHost._ok({compId:comp.id,name:comp.name,clips:ordered.length,captions:captions.length,duration:duration});
  }catch(e){for(i=made.length-1;i>=0;i--)try{made[i].remove();}catch(ignore){}throw e;}finally{app.endUndoGroup();}
 }catch(e){return GHAFHost._err(String(e));}
};
})();
