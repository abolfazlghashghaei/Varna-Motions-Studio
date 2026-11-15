/* User assets stay private. All paths come from the fixed catalog, never code
   supplied by the UI. Originals are imported once; placed graphs are isolated. */
GHAFHost._libraryRevision81=1;
GHAFHost._libraryRoot81=function(){
 var bundled=new Folder(File(GHAFHost._filePath).parent.parent.fsName+'/assets/user-library81');
 if(new File(bundled.fsName+'/USER_LIBRARY81.json').exists)return bundled;
 return new Folder(Folder.userData.fsName+'/VarnaMotionStudio/Library81');
};
GHAFHost._libraryFile81=function(spec){
 if(!spec||!spec.entry||/^(?:[\\\/]|[A-Za-z]:)/.test(spec.entry)||/(^|[\\\/])\.\.([\\\/]|$)/.test(spec.entry))throw Error('مسیر فایل کتابخانه معتبر نیست.');
 var root=GHAFHost._libraryRoot81(),file=new File(root.fsName+'/'+spec.entry);
 if(!file.exists)throw Error('این فایل کتابخانه نصب نشده؛ بستهٔ شخصی را نصب یا مسیر آن را بررسی کن.');return file;
};
GHAFHost.library81Status=function(){try{
 var root=GHAFHost._libraryRoot81(),packs=VarnaUserLibrary81.packs(),out=[];
 for(var i=0;i<packs.length;i++){var p=packs[i],entry=p.kind==='lower'?VarnaUserLibrary81.asset('lower-001').entry:p.entry;out.push({id:p.id,available:new File(root.fsName+'/'+entry).exists});}
 return GHAFHost._ok({root:root.fsName,privateLibrary:new File(root.fsName+'/USER_LIBRARY81.json').exists,packs:out});
}catch(e){return GHAFHost._err(String(e));}};
GHAFHost._libraryTag81=function(id){return 'VARNA_TEMPLATE38_ASSET:user81:'+id;};
GHAFHost._libraryComp81=function(id,compId){
 var tag=GHAFHost._libraryTag81(id);for(var i=1;i<=app.project.numItems;i++){var item=app.project.item(i);if(item instanceof CompItem&&Number(item.id)===Number(compId)&&String(item.comment||'').split('\n')[0]===tag)return item;}
 throw Error('قالب انتخاب‌شده در پروژه پیدا نشد؛ آن را دوباره از کتابخانه وارد کن.');
};
GHAFHost.library81Import=function(encoded){
 var p=GHAFHost._parse(encoded),spec=VarnaUserLibrary81.asset(String(p.id||''));
 if(!spec||spec.kind!=='project')return GHAFHost._err('قالب ثبت‌شده‌ای انتخاب کن.');
 var before={},created=[],tag=GHAFHost._libraryTag81(spec.id),existing=[],destination=GHAFHost._activeComp();
 if(destination&&String(destination.comment||'').indexOf('VARNA_TEMPLATE38_ASSET:')!==0)GHAFHost._libraryDestination81=destination;
 for(var i=1;i<=app.project.numItems;i++){var item=app.project.item(i);before['I'+item.id]=true;if(item instanceof CompItem&&String(item.comment||'').split('\n')[0]===tag)existing.push(item);}
 app.beginUndoGroup('Varna Import User Library');try{
  if(!existing.length){var file=GHAFHost._libraryFile81(spec);app.project.importFile(new ImportOptions(file));
   for(i=1;i<=app.project.numItems;i++){item=app.project.item(i);if(before['I'+item.id])continue;created.push(item);item.comment=tag+'\nVARNA_USER_LIBRARY81:'+spec.id;if(item instanceof CompItem)existing.push(item);}
   if(!existing.length)throw Error('کامپوزیشن قابل استفاده‌ای در این فایل پیدا نشد.');
  }
  var list=[];for(i=0;i<existing.length;i++){item=existing[i];list.push({id:item.id,name:item.name,width:item.width,height:item.height,duration:item.duration});}
  list.sort(function(a,b){var am=/^(hook|lower third|gradient|instagram|social)/i.test(a.name)?0:1,bm=/^(hook|lower third|gradient|instagram|social)/i.test(b.name)?0:1;return am-bm||a.name.localeCompare(b.name);});
  return GHAFHost._ok({asset:spec.id,comps:list,destinationId:GHAFHost._libraryDestination81?GHAFHost._libraryDestination81.id:null});
 }catch(e){for(var pass=0;pass<3;pass++)for(i=created.length-1;i>=0;i--)try{if(created[i]&&(!(created[i] instanceof CompItem)||created[i].usedIn.length===0)){created[i].remove();created[i]=null;}}catch(ignore){}return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost.library81Describe=function(encoded){try{var p=GHAFHost._parse(encoded),comp=GHAFHost._libraryComp81(String(p.id),p.compId),info=GHAFHost._templateInventory38(comp);return GHAFHost._ok({compId:comp.id,name:comp.name,width:comp.width,height:comp.height,duration:comp.duration,slots:info.slots,controls:info.controls});}catch(e){return GHAFHost._err(String(e));}};
GHAFHost._libraryTarget81=function(){var c=GHAFHost._activeComp();if(c&&String(c.comment||'').indexOf('VARNA_TEMPLATE38_ASSET:')!==0&&String(c.comment||'').indexOf('VARNA_LIBRARY81_INSTANCE:')!==0)return c;return GHAFHost._libraryDestination81||null;};
GHAFHost.library81Place=function(encoded){
 var p=GHAFHost._parse(encoded),created=[],layer=null,c=GHAFHost._libraryTarget81();if(!c&&!p.previewOnly)return GHAFHost._err('ابتدا کامپوزیشن مقصد را در افتر فعال کن.');
 app.beginUndoGroup('Varna Place User Design');try{
  var source=GHAFHost._libraryComp81(String(p.id),p.compId),copy=GHAFHost._cloneTemplate38(source,'user81',created),slots=p.slots||[],settings=p.controls||[];
  if(slots.length>240||settings.length>400)throw Error('تعداد تغییرات قالب بیش از حد است.');
  for(var i=0;i<slots.length;i++){
   var row=slots[i],text=GHAFHost._templateLayer38(copy,row.path),tp=text.property('ADBE Text Properties');if(!tp)throw Error('مسیر متن قالب تغییر کرده؛ تنظیمات را دوباره بخوان.');
   var prop=tp.property('ADBE Text Document'),doc=prop.value;if(String(row.text).length>10000)throw Error('متن قالب بیش از حد طولانی است.');
   prop.expression='';while(prop.numKeys>0)prop.removeKey(1);doc.text=String(row.text);GHAFHost._rtl(doc,/[\u0600-\u06FF]/.test(doc.text));if(p.fontPS)GHAFHost._font(doc,String(p.fontPS));prop.setValue(doc);
  }
  for(i=0;i<settings.length;i++){var target=GHAFHost._templateProperty38(copy,settings[i]);GHAFHost._templateValue47(target,settings[i].value,false);}
  GHAFHost._validateTemplate38(copy,source.name);
  for(i=0;i<created.length;i++)created[i].comment='VARNA_LIBRARY81_INSTANCE:'+String(copy.id);
  if(p.previewOnly){var preview=GHAFJSON.parse(GHAFHost.renderTableFrame50(encodeURIComponent(GHAFJSON.stringify({compId:copy.id,time:Math.max(0,Math.min(copy.duration-copy.frameDuration,Number(p.time)||copy.duration*.4)),folder:p.folder,mode:'full'}))));if(!preview.ok)throw Error(preview.error);GHAFHost._cleanTemplateCopies38(created);return GHAFHost._ok(preview.data);}
  var start=Math.max(0,Number(c.time)||0),duration=Number(p.duration)||copy.duration;if(!isFinite(duration)||duration<=0||start>=c.duration)throw Error('زمان طرح خارج از کامپوزیشن مقصد است.');duration=Math.min(duration,c.duration-start);
  layer=c.layers.add(copy);layer.name='VARNA DESIGN · '+source.name;layer.comment='VARNA_LIBRARY81_LAYER:'+String(p.id);layer.startTime=start;layer.stretch=duration/copy.duration*100;layer.inPoint=start;layer.outPoint=start+duration;
  var tr=layer.property('ADBE Transform Group'),scale=Math.min(c.width/copy.width,c.height/copy.height)*100;tr.property('ADBE Scale').setValue([scale,scale]);tr.property('ADBE Position').setValue([c.width/2,c.height/2]);
  return GHAFHost._ok({layer:layer.name,compId:c.id,editableCompId:copy.id,duration:duration,isolated:true});
 }catch(e){if(layer)try{layer.remove();}catch(ignore){}GHAFHost._cleanTemplateCopies38(created);return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost.library81Preview=function(encoded){var p=GHAFHost._parse(encoded);p.previewOnly=true;return GHAFHost.library81Place(encodeURIComponent(GHAFJSON.stringify(p)));};
GHAFHost.library81NativeTitle=function(encoded){
 var p=GHAFHost._parse(encoded),spec=VarnaUserLibrary81.title(String(p.preset)),c=GHAFHost._activeComp(),made=[],layer=null;
 if(!c)return GHAFHost._err('ابتدا کامپوزیشن مقصد را فعال کن.');if(!spec)return GHAFHost._err('یک طرح بومی معتبر انتخاب کن.');
 if(!String(p.text||'').replace(/\s/g,''))return GHAFHost._err('متن عنوان را وارد کن.');
 app.beginUndoGroup('Varna Native Title');try{
  var start=Math.max(0,Number(c.time)||0),duration=Math.max(.2,Math.min(30,Number(p.duration)||5));duration=Math.min(duration,c.duration-start);if(duration<=0)throw Error('هد زمان را داخل کامپوزیشن قرار بده.');
  var copy=app.project.items.addComp('VARNA '+spec.en,c.width,c.height,c.pixelAspect||1,duration,c.frameRate);made.push(copy);copy.comment='VARNA_LIBRARY81_NATIVE:'+spec.id;
  var st=p.style||{},style={fontPS:String(st.fontPS||'ArialMT'),fill:st.fill||'#FFFFFF',size:Math.max(20,Math.min(180,Number(st.size)||c.height*.065)),x:spec.id==='lower-left'?28:spec.id==='lower-right'?72:50,y:spec.role==='lower'?84:spec.role==='social'?72:50,align:0,rtl:/[\u0600-\u06FF]/.test(String(p.text)),maxLines:2,boxWidthPct:spec.role==='lower'?46:80};
  var bg=VarnaBackgroundMotion81.applyPreset({enabled:true,engine:'native',style:'solid',hex:spec.role==='social'?'#6F3CBA':'#132B4C',opacity:94,round:spec.role==='social'?10000:18,padding:18,gradientEnabled:false,borderOpacity:0,independentMotion:true},spec.bgMotion);
  var anim={mode:'simple',preset:spec.textMotion,inDur:.4,outPreset:'fade',outDur:.3,typeSound:false},g={id:'native81',text:String(p.text).slice(0,2000),rawText:String(p.text).slice(0,2000),start:0,end:duration,style:style,anim:anim,bg:bg};
  GHAFHost._createTextLayer(copy,g,'VARNA TITLE');
  if(String(p.subtitle||'').replace(/\s/g,'')){var small=GHAFJSON.parse(GHAFJSON.stringify(g));small.id='native81-sub';small.text=String(p.subtitle).slice(0,2000);small.rawText=small.text;small.style.size=Math.max(16,style.size*.52);small.style.y=Math.min(96,style.y+9);small.style.fill=st.fill||'#E4EFFF';small.bg={enabled:false};GHAFHost._createTextLayer(copy,small,'VARNA SUBTITLE');}
  layer=c.layers.add(copy);layer.name='VARNA '+spec.en;layer.comment='VARNA_LIBRARY81_LAYER:native:'+spec.id;layer.startTime=start;layer.inPoint=start;layer.outPoint=start+duration;return GHAFHost._ok({layer:layer.name,editableCompId:copy.id,duration:duration});
 }catch(e){if(layer)try{layer.remove();}catch(ignore){}GHAFHost._cleanTemplateCopies38(made);return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost.library81Gradient=function(encoded){
 var p=GHAFHost._parse(encoded),palette=VarnaUserLibrary81.palette(String(p.palette)),c=GHAFHost._activeComp(),made=[],items=[],old=[];
 if(!c)return GHAFHost._err('ابتدا کامپوزیشن مقصد را فعال کن.');if(!palette)return GHAFHost._err('یک گرادیان بومی معتبر انتخاب کن.');
 app.beginUndoGroup('Varna Native Gradient');try{
  for(var i=1;i<=c.numLayers;i++)if(String(c.layer(i).comment||'').indexOf('VARNA_GRADIENT81:')===0)old.push(c.layer(i));
  var speed=Math.max(.05,Math.min(3,Number(p.speed)||.3));
  for(i=0;i<2;i++){
   var l=c.layers.addSolid(GHAFHost._hex(palette.colors[i]),'VARNA '+palette.en+' '+(i+1),c.width,c.height,c.pixelAspect||1,c.duration);made.push(l);if(l.source)items.push(l.source);l.comment='VARNA_GRADIENT81:'+palette.id;l.inPoint=0;l.outPoint=c.duration;
   var ramp=l.property('ADBE Effect Parade').addProperty('ADBE Ramp');ramp.name='VARNA Native Gradient';ramp.property(2).setValue(GHAFHost._hex(palette.colors[i]));ramp.property(4).setValue(GHAFHost._hex(palette.colors[i+1]));
   ramp.property(1).expression='var s='+speed+',p='+i+';[thisComp.width*(.25+.2*Math.sin(time*s+p)),thisComp.height*(.25+.2*Math.cos(time*s*.8+p))];';
   ramp.property(3).expression='var s='+speed+',p='+i+';[thisComp.width*(.75+.2*Math.cos(time*s*.7+p)),thisComp.height*(.75+.2*Math.sin(time*s+p))];';
   l.property('ADBE Transform Group').property('ADBE Opacity').setValue(i?38:100);if(i===0)l.moveToEnd();else l.moveBefore(made[0]);
  }
  GHAFHost._deleteLayers(old);return GHAFHost._ok({created:made.length,palette:palette.id,editable:true});
 }catch(e){GHAFHost._deleteLayers(made);for(var n=0;n<items.length;n++)try{if(items[n].usedIn.length===0)items[n].remove();}catch(ignore){}return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost.library81Highlight=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp(),selected=c?c.selectedLayers:[],texts=[];
 for(var i=0;i<selected.length;i++)if(selected[i].property('ADBE Text Properties'))texts.push(selected[i]);if(!texts.length)return GHAFHost._err('یک یا چند لایهٔ متن را در افتر انتخاب کن.');
 var mode=/^(box|marker|underline)$/.test(p.mode)?p.mode:'marker',color=/^#[0-9a-f]{6}$/i.test(p.color||'')?p.color:'#FFE082';
 app.beginUndoGroup('Varna Native Highlight');try{
  for(i=0;i<texts.length;i++){
   var text=texts[i],bg={enabled:true,engine:'native',style:'solid',hex:color,opacity:mode==='box'?85:100,padding:mode==='box'?14:5,round:mode==='box'?12:2,gradientEnabled:false,borderOpacity:0,motion:'none',independentMotion:true};
   if(!GHAFHost._applyBg(text,bg))throw Error('هایلایت ساخته نشد.');
   if(mode!=='box'){var sh=GHAFHost._nativeBgFor(text),path=sh.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group').property(1).property('ADBE Vector Shape');
    path.expression='var r=thisLayer.parent.sourceRectAtTime(time,false),p=5,h='+(mode==='underline'?'Math.max(3,r.height*.07)':'Math.max(5,r.height*.35)')+',x=r.left-p,y=r.top+r.height-'+(mode==='underline'?'0':'h*.5')+';createPath([[x,y],[x+r.width+2*p,y],[x+r.width+2*p,y+h],[x,y+h]],[],[],true);';
   }
  }return GHAFHost._ok({updated:texts.length,mode:mode});
 }catch(e){return GHAFHost._err(String(e)+' · Undo in After Effects restores the previous highlight.');}finally{app.endUndoGroup();}
};
(function(){
 var load=GHAFHost.loadEmbeddedHost,init=GHAFHost.initScriptTool;
 GHAFHost.loadEmbeddedHost=function(encoded){var p=GHAFHost._parse(encoded);if(p.tool!=='atools81')return load(encoded);try{GHAFHost._embeddedLoaded=GHAFHost._embeddedLoaded||{};if(!GHAFHost._embeddedLoaded.atools81){var spec=VarnaUserLibrary81.pack('atools-2.106');$.evalFile(GHAFHost._libraryFile81({entry:spec.host}));GHAFHost._embeddedLoaded.atools81=true;}return GHAFHost._ok({loaded:true});}catch(e){return GHAFHost._err(String(e));}};
 GHAFHost.initScriptTool=function(encoded){var p=GHAFHost._parse(encoded);if(p.tool!=='highlighter81')return init(encoded);try{
  var root=GHAFHost._scriptUIs.highlighter81;if(!root){var result=$.evalFile(GHAFHost._libraryFile81(VarnaUserLibrary81.pack('highlighter-2')));if(result&&result.children)root=result;
   var names=['Highlighter','Highlighter v2.0','Highlighter 2.0','Highlighter - v2.0'];for(var i=0;i<names.length&&!root;i++)root=Window.find('palette',names[i]);
   if(!root||!root.children)return GHAFHost._ok({tool:'highlighter81',controls:[],external:true,note:'پنجرهٔ اصلی Highlighter اجرا شد؛ کنترل قابل اتصال پیدا نشد. پنجرهٔ ابزار را در افتر بررسی کن.'});
   root.hide();GHAFHost._scriptUIs.highlighter81=root;
  }return GHAFHost._ok(GHAFHost._scriptUITree('highlighter81',root));
 }catch(e){return GHAFHost._err(String(e));}};
})();
