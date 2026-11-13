/* Varna production improvements. ES3; embedded in the primary adapter. */
(function () {
function valid(object) { try { if (!object) return false; if (typeof isValid === 'function' && !isValid(object)) return false; var name = object.name; return true; } catch (e) { return false; } }
GHAFHost._validNative50 = valid;
var preview = GHAFHost.updateLivePreview, remove = GHAFHost.removeLivePreview;
GHAFHost.updateLivePreview = function (encoded) {
  var records = GHAFHost._livePreviewRecords || {}, key, list, clean, i, j, good;
  for (key in records) if (records.hasOwnProperty(key)) {
    list = records[key]; clean = [];
    for (i = 0; i < list.length; i++) { good = !!(list[i].layers && list[i].layers.length); for (j = 0; good && j < list[i].layers.length; j++) if (!valid(list[i].layers[j])) good = false; if (good) clean.push(list[i]); }
    records[key] = clean;
  }
  return preview(encoded);
};
GHAFHost.removeLivePreview = function (encoded) {
  // Delete cached references before touching AE objects that the user may have deleted.
  var p = GHAFHost._parse(encoded), c = GHAFHost._activeComp();
  if (GHAFHost._livePreviewRecords) { if (p.compId != null) delete GHAFHost._livePreviewRecords[String(p.compId)]; else if (valid(c)) delete GHAFHost._livePreviewRecords[String(c.id)]; }
  return remove(encoded);
};
GHAFHost.importBrandLibrary50 = function (encoded) {
  var p = GHAFHost._parse(encoded), files = [], made = [], assets = p.assets || [], folder = null, imported = 0, reused = 0, i, a, f, item;
  try {
    for (i = 0; i < assets.length; i++) { a = assets[i]; if (a.enabled === false) continue; f = new File(String(a.path || '')); if (!f.exists) throw Error('فایل برند پیدا نشد: ' + a.name); if (/\.(png|jpe?g|webp|gif|psd|ai|eps|tiff?|bmp|exr|mp4|mov|m4v|avi|webm|wav|mp3|aif[f]?|m4a|aep)$/i.test(f.name)) files.push(f); }
    app.beginUndoGroup('Varna Brand Library');
    try {
      for (i = 1; i <= app.project.numItems; i++) { item = app.project.item(i); if (String(item.comment || '') === 'VARNA_BRAND_LIBRARY50:' + p.brandId) { folder = item; break; } }
      if (!folder && files.length) { folder = app.project.items.addFolder('Varna · ' + String(p.name || 'Brand')); folder.comment = 'VARNA_BRAND_LIBRARY50:' + p.brandId; made.push(folder); }
      for (i = 0; i < files.length; i++) { item = GHAFHost._findFootageByFile(files[i].fsName); if (item) { reused++; continue; } item = app.project.importFile(new ImportOptions(files[i])); made.push(item); if (folder) item.parentFolder = folder; imported++; }
      return GHAFHost._ok({imported:imported,reused:reused,placed:0,resources:0});
    } catch (e) { for (i = made.length - 1; i >= 0; i--) try { made[i].remove(); } catch (ignore) {} throw e; }
    finally { app.endUndoGroup(); }
  } catch (e) { return GHAFHost._err(String(e)); }
};
function number(v, low, high, name) { v = Number(v); if (!isFinite(v) || v < low || v > high) throw Error('مقدار نامعتبر: ' + name); return v; }
function shapeProps(group, out) { if (!group) return; for (var i = 1; i <= group.numProperties; i++) { var p = group.property(i); if (p.matchName === 'ADBE Vector Rect Size' || p.matchName === 'ADBE Vector Ellipse Size') out.push(p); else if (p.numProperties) shapeProps(p, out); } }
function snapshot(p) { var keys = []; for (var k = 1; k <= p.numKeys; k++) keys.push({t:p.keyTime(k),v:p.keyValue(k),i:p.keyInInterpolationType(k),o:p.keyOutInterpolationType(k),ie:p.keyInTemporalEase(k),oe:p.keyOutTemporalEase(k)}); return {p:p,value:p.value,keys:keys}; }
function restore(s) { var p = s.p, i; while (p.numKeys) p.removeKey(p.numKeys); if (!s.keys.length) p.setValue(s.value); for (i = 0; i < s.keys.length; i++) p.setValueAtTime(s.keys[i].t,s.keys[i].v); for (i = 0; i < s.keys.length; i++) { p.setInterpolationTypeAtKey(i+1,s.keys[i].i,s.keys[i].o); p.setTemporalEaseAtKey(i+1,s.keys[i].ie,s.keys[i].oe); } }
GHAFHost.animateShapeSize50 = function (encoded) {
  var p = GHAFHost._parse(encoded), c = GHAFHost._activeComp(), props = [], journal = [], changed = 0, i, j;
  try {
    if (!c) throw Error('کامپوزیشن را فعال کن.');
    var duration = number(p.duration,.05,20,'duration'), delay = number(p.delay || 0,0,60,'delay'), count = number(p.repeat || 1,1,8,'repeat'), curve = p.curve || {}, start = c.time + delay;
    count = Math.floor(count); var x1 = number(curve.x1,.001,.999,'x1'), x2 = number(curve.x2,.001,.999,'x2'), y1 = number(curve.y1,-2,3,'y1'), y2 = number(curve.y2,-2,3,'y2');
    var finish = [number(p.width,1,30000,'width'),number(p.height,1,30000,'height')];
    var gap=p.yoyo?0:c.frameDuration,total=duration*count+gap*(count-1);if (start + total > c.duration) throw Error('مدت حرکت از پایان کامپوزیشن عبور می‌کند.');
    for (i = 0; i < c.selectedLayers.length; i++) { if (c.selectedLayers[i].locked) throw Error('شیپ انتخابی قفل است.'); shapeProps(c.selectedLayers[i].property('ADBE Root Vectors Group'),props); }
    if (!props.length) throw Error('شیپ مستطیل یا بیضی را انتخاب کن؛ مسیرهای آزاد Size ندارند.');
    for (i = 0; i < props.length; i++) { if (props[i].expressionEnabled) throw Error('Size شیپ Expression دارد؛ ابتدا آن را بررسی کن.'); journal.push(snapshot(props[i])); }
    app.beginUndoGroup('Varna Shape Size');
    try {
      for (i = 0; i < props.length; i++) {
        var prop = props[i], from = p.fromCurrent !== false ? prop.valueAtTime(start,false) : [number(p.fromWidth,1,30000,'fromWidth'),number(p.fromHeight,1,30000,'fromHeight')];
        for (j=prop.numKeys;j>=1;j--)if(prop.keyTime(j)>=start&&prop.keyTime(j)<=start+total)prop.removeKey(j);for(j=0;j<count;j++){var cycle=start+j*(duration+gap),first=p.yoyo&&j%2?finish:from,last=p.yoyo&&j%2?from:finish;prop.setValueAtTime(cycle,first);prop.setValueAtTime(cycle+duration,last);}
        for (j = 0; j < count; j++) {
          var t1 = start + j * (duration+gap), t2 = t1 + duration, a = prop.nearestKeyIndex(t1), b = prop.nearestKeyIndex(t2), v1 = prop.keyValue(a), v2 = prop.keyValue(b), incoming = [], outgoing = [];
          for (var axis = 0; axis < 2; axis++) { var avg = (v2[axis]-v1[axis])/duration; outgoing.push(new KeyframeEase(y1/x1*avg,x1*100)); incoming.push(new KeyframeEase((1-y2)/(1-x2)*avg,(1-x2)*100)); }
          prop.setInterpolationTypeAtKey(a,prop.keyInInterpolationType(a),KeyframeInterpolationType.BEZIER); prop.setInterpolationTypeAtKey(b,KeyframeInterpolationType.BEZIER,prop.keyOutInterpolationType(b));
          prop.setTemporalEaseAtKey(a,prop.keyInTemporalEase(a),outgoing); prop.setTemporalEaseAtKey(b,incoming,prop.keyOutTemporalEase(b));
        }
        changed++;
      }
      return GHAFHost._ok({changed:changed,start:start,end:start+total,size:true});
    } catch (e) { for (i = journal.length-1; i >= 0; i--) try { restore(journal[i]); } catch (rollback) {} throw e; }
    finally { app.endUndoGroup(); }
  } catch (e) { return GHAFHost._err(String(e)); }
};
GHAFHost.renderTableFrame50 = function (encoded) {
  var p = GHAFHost._parse(encoded), c = GHAFHost._tableComp(p), saved = [], file, i;
  if (!c) return GHAFHost._err('NO_COMP');
  try {
    var folder = new Folder(p.folder); if (!folder.exists && !folder.create()) throw Error('پوشهٔ پیش‌نمایش ساخته نشد.');
    var time = number(p.time,0,Math.max(0,c.duration-c.frameDuration),'time');
    for (i = 1; i <= c.numLayers; i++) { var l = c.layer(i); if (String(l.name).indexOf('__VARNA_TABLE_PREVIEW__') !== 0) continue; saved.push({layer:l,enabled:l.enabled,guide:l.guideLayer}); if (p.mode === 'background') l.enabled = false; else l.guideLayer = false; }
    file = new File(folder.fsName+'/table50_'+new Date().getTime()+'.png'); c.saveFrameToPng(time,file);
    return GHAFHost._ok({path:file.fsName,time:time,compId:c.id,width:c.width,height:c.height,mode:p.mode});
  } catch (e) { return GHAFHost._err(String(e)); }
  finally { for (i = saved.length-1; i >= 0; i--) try { saved[i].layer.enabled=saved[i].enabled; saved[i].layer.guideLayer=saved[i].guide; } catch (ignore) {} }
};
GHAFHost.writeSoundCue50 = function (encoded) {
  var p = GHAFHost._parse(encoded), c = GHAFHost._outputComp36(p);
  try {
    if (!c) throw Error('کامپوزیشن را فعال کن.'); var start=number(p.start,0,c.duration,'start'),end=number(p.end,0,c.duration,'end'); if (end<=start) throw Error('پایان بازه باید بعد از شروع باشد.');
    if (!/^(music|sfx|ambience)$/.test(p.kind)) throw Error('نوع صدا معتبر نیست.');
    var mp=c.markerProperty,existing=mp.numKeys?mp.nearestKeyIndex(start):0;
    if(existing&&Math.abs(mp.keyTime(existing)-start)<c.frameDuration/4){var existingText=String(mp.keyValue(existing).comment||''),same=false;if(existingText.indexOf('VARNA_SOUND50:')===0)try{same=String(GHAFJSON.parse(existingText.substring(14)).id)===String(p.id);}catch(ignore){}if(!same)throw Error('در این نقطه مارکر دیگری وجود دارد؛ نقطهٔ شروع را تغییر بده.');}
    var mark=new MarkerValue('VARNA_SOUND50:'+GHAFJSON.stringify({id:String(p.id||start),kind:p.kind,prompt:String(p.prompt||'').slice(0,600),style:String(p.style||'minimal')})); mark.duration=end-start;
    app.beginUndoGroup('Varna Sound Cue');try{mp.setValueAtTime(start,mark);for(var oldIndex=mp.numKeys;oldIndex>=1;oldIndex--){if(Math.abs(mp.keyTime(oldIndex)-start)<c.frameDuration/4)continue;var text=String(mp.keyValue(oldIndex).comment||'');if(text.indexOf('VARNA_SOUND50:')===0){try{var oldCue=GHAFJSON.parse(text.substring(14));if(String(oldCue.id)===String(p.id))mp.removeKey(oldIndex);}catch(ignore){}}}}finally{app.endUndoGroup();}return GHAFHost._ok({compId:c.id,start:start,end:end});
  }catch(e){return GHAFHost._err(String(e));}
};
GHAFHost.readSoundCues50=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._outputComp36(p);if(!c)return GHAFHost._err('NO_COMP');var out=[],mp=c.markerProperty;for(var i=1;i<=mp.numKeys;i++){var m=mp.keyValue(i),text=String(m.comment||'');if(text.indexOf('VARNA_SOUND50:')!==0)continue;try{var cue=GHAFJSON.parse(text.substring(14));cue.start=mp.keyTime(i);cue.end=Math.min(c.duration,cue.start+Math.max(c.frameDuration,Number(m.duration)||0));cue.compId=c.id;out.push(cue);}catch(ignore){}}return GHAFHost._ok({cues:out,compId:c.id,duration:c.duration});};
// Translate legacy catalog looks to native text animators before any template importer runs.
var createCaption50=GHAFHost._createCaption;
GHAFHost._createCaption=function(c,g,name){
 if(g.anim&&g.anim.template38&&g.anim.template38.id){
  var copy=GHAFJSON.parse(GHAFJSON.stringify(g)),cfg=copy.anim.template38,spec=GHAFHost._templateSpec38(String(cfg.id)),controls=spec.controls||[],map={},i,p;
  for(i=0;i<controls.length;i++)map[controls[i].name]=controls[i].value;
  for(i=0;i<(cfg.parameters||[]).length;i++){p=cfg.parameters[i];map[p.effectName||p.name]=p.value;}
  function color(v){if(!(v instanceof Array)||v.length<3)return null;var out='#';for(var a=0;a<3;a++){var n=Math.max(0,Math.min(255,Math.round(Number(v[a])*255))),h=n.toString(16);out+=(h.length<2?'0':'')+h;}return out;}
  var fill=color(map['Base Text Color']||map['Text Color']||map['Base Fill Color']),active=color(map['Active Text Color']||map['Active Fill Color']),names='';for(var key in map)names+=key+' ';
  copy.style=copy.style||{};if(fill){copy.style.fill=fill;copy.style.fillMode='solid';}if(active){copy.highlight37=copy.highlight37||{};copy.highlight37.color=active;}
  var width=Number(map['Stroke Width']||map['Text Stroke Width']),stroke=color(map['Stroke Color']||map['Text Stroke Color']);if(stroke&&width>0){copy.style.stroke=true;copy.style.strokeHex=stroke;copy.style.strokeWidth=Math.min(20,width);}
  copy.anim.template38=null;copy.anim.kinetic40=null;copy.anim.smartTemplate=null;copy.anim.preset='none';copy.anim.word39={preset:/Type|Character/.test(names)?'type':/Bounce|Pop|Scale/.test(names)?'pop':/Rise|Lift|Cascade/.test(names)?'rise':'fade',order:'forward',timing:'speech',duration:.3,distance:45,colorMode:cfg.activeMode==='template'?'static':active?'active':'static',colorTarget:cfg.activeMode==='important'?'important':'all'};
  return createCaption50(c,copy,name);
 }
 return createCaption50(c,g,name);
};
GHAFHost._production50=1;
})();
