/* User-supplied AEP/MOGRT adapters. Original assets are never edited in place. */
GHAFHost._templateCatalog38=function(){
 if(GHAFHost._catalog38)return GHAFHost._catalog38;
 var f=new File(File(GHAFHost._filePath).parent.parent.fsName+'/assets/templates38/catalog.json');f.encoding='UTF-8';
 if(!f.open('r'))throw Error('کتابخانهٔ قالب‌ها نصب نیست؛ بستهٔ کامل RC43 را نصب کن.');try{GHAFHost._catalog38=GHAFJSON.parse(f.read());}finally{f.close();}return GHAFHost._catalog38;
};
GHAFHost._templateSpec38=function(id){var list=GHAFHost._templateCatalog38();for(var i=0;i<list.length;i++)if(list[i].id===id)return list[i];throw Error('شناسهٔ قالب معتبر نیست.');};
GHAFHost._templateComp38=function(spec){
 GHAFHost._sourceTemplates38=GHAFHost._sourceTemplates38||{};var cacheKey=spec.assetKey+'|'+spec.compName,cached=GHAFHost._sourceTemplates38[cacheKey];if(cached)try{if(app.project.itemByID&&app.project.itemByID(cached.id)===cached)return cached;}catch(cacheError){}
 var prefix='VARNA_TEMPLATE38_ASSET:'+spec.assetKey+'\n',i,item,found=null,before={},added=[];
 for(i=1;i<=app.project.numItems;i++){item=app.project.item(i);before[item.id]=true;if(item instanceof CompItem&&String(item.comment||'').indexOf(prefix)===0&&item.name===spec.compName)found=item;}
 if(found){GHAFHost._sourceTemplates38[cacheKey]=found;return found;}
 var f=new File(File(GHAFHost._filePath).parent.parent.fsName+'/assets/templates38/'+spec.asset);if(!f.exists)throw Error('فایل قالب پیدا نشد: '+spec.label);
 try{app.project.importFile(new ImportOptions(f));for(i=1;i<=app.project.numItems;i++){item=app.project.item(i);if(!before[item.id]){added.push(item);if(item instanceof CompItem){item.comment=prefix+String(item.comment||'');if(item.name===spec.compName)found=item;}}}if(!found)throw Error('کامپوزیشن '+spec.compName+' در فایل قالب پیدا نشد.');GHAFHost._sourceTemplates38[cacheKey]=found;return found;}
 catch(e){added=[];for(i=1;i<=app.project.numItems;i++){item=app.project.item(i);if(!before[item.id])added.push(item);}for(i=added.length-1;i>=0;i--)try{added[i].remove();}catch(ignore){}throw e;}
};
/* Only writable leaf properties belong in the template inspector. AE also exposes
 * empty structural groups and built-in compositing groups in every effect. */
GHAFHost._templateStructural47=function(prop){var name=String(prop&&prop.matchName||'');return name==='ADBE Effect Built In Params'||name==='ADBE Group End'||name==='ADBE Effect Compositing Group'||name==='ADBE Effect Mask Parade';};
GHAFHost._templateInventory38=function(root){
 var slots=[],controls=[],seen={},layers=[];
 function scan(comp,path,depth){
  if(depth>16||seen[comp.id])return;seen[comp.id]=true;
  for(var i=1;i<=comp.numLayers;i++){
   var layer=comp.layer(i),route=path.concat([i]),text=layer.property('ADBE Text Properties');layers.push({path:route,name:layer.name});
   if(text){var source=text.property('ADBE Text Document');if(source){var value=source.value;if(value&&(!source.expression||/EDIT TEXT HERE/i.test(layer.name)))slots.push({path:route,name:comp.name+' / '+layer.name,text:String(value.text||''),preferred:/EDIT TEXT HERE/i.test(layer.name)?100:(!layer.guideLayer&&!/measure/i.test(layer.name)?10:0)});}}
   var effects=layer.property('ADBE Effect Parade');
   if(effects)for(var j=1;j<=effects.numProperties;j++){
    var effect=effects.property(j),props=GHAFHost._vendorProps(effect);
    for(var k=0;k<props.length;k++){
     var item=props[k];item.layerPath=route;item.effectIndex=j;item.effectName=effect.name;item.effectMatchName=String(effect.matchName||'');
     var target=GHAFHost._templateProperty38(root,item,true);if(!target)continue;
     if(item.kind==='readonly'){var raw=target.value;if(Object.prototype.toString.call(raw)==='[object Array]'&&raw.length){var valid=true;for(var vi=0;vi<raw.length;vi++)if(typeof raw[vi]!=='number'||!isFinite(raw[vi]))valid=false;if(valid){item.kind='vector';item.value=raw;}}if(item.kind==='readonly')continue;}
     item.matchName=String(target.matchName||'');item.group=layer.name+' · '+effect.name;controls.push(item);
    }
   }
   if(layer.source instanceof CompItem)scan(layer.source,route,depth+1);
  }
 }
 scan(root,[],0);slots.sort(function(a,b){return b.preferred-a.preferred||a.name.localeCompare(b.name);});return {slots:slots,controls:controls,layers:layers};
};
GHAFHost.prepareTemplate38=function(encoded){
 var p=GHAFHost._parse(encoded),destination=GHAFHost._activeComp();if(destination&&String(destination.comment||'').indexOf('VARNA_TEMPLATE38_')!==0)GHAFHost._templateDestination38=destination;app.beginUndoGroup('Varna Import Caption Template');try{var spec=GHAFHost._templateSpec38(String(p.id)),comp=GHAFHost._templateComp38(spec),info=GHAFHost._templateInventory38(comp);if(!info.slots.length)throw Error('متن قابل ویرایشی در قالب پیدا نشد.');return GHAFHost._ok({id:spec.id,compId:comp.id,name:comp.name,duration:comp.duration,width:comp.width,height:comp.height,slots:info.slots,controls:info.controls,fonts:spec.fonts||[]});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost._templateLayer38=function(comp,path){
 if(!path||typeof path==='string'||!path.length||path.length>17)throw Error('مسیر کنترل قالب معتبر نیست.');var layer;
 for(var i=0;i<path.length;i++){var n=Number(path[i]);if(!comp||!isFinite(n)||n<1||n!==Math.floor(n)||n>comp.numLayers)throw Error('لایهٔ قالب تغییر کرده؛ تنظیمات را دوباره بخوان.');layer=comp.layer(n);if(!layer)throw Error('لایهٔ قالب پیدا نشد.');if(i<path.length-1){comp=layer.source;if(!(comp instanceof CompItem))throw Error('پیش‌کامپ قالب پیدا نشد.');}}
 return layer;
};
GHAFHost._templateProperty38=function(comp,p,allowUnsupported){
 if(!p||!p.path||typeof p.path==='string'||!p.path.length||p.path.length>28)throw Error('مسیر ویژگی قالب معتبر نیست.');
 var layer=GHAFHost._templateLayer38(comp,p.layerPath),effects=layer.property('ADBE Effect Parade'),index=Number(p.effectIndex);
 if(!effects||!isFinite(index)||index<1||index!==Math.floor(index)||index>effects.numProperties)throw Error('کنترل قالب تغییر کرده؛ دوباره بخوان.');
 var effect=effects.property(index);if(!effect||(p.effectName&&effect.name!==p.effectName)||(p.effectMatchName&&effect.matchName!==p.effectMatchName))throw Error('کنترل قالب تغییر کرده؛ دوباره بخوان.');
 var prop=effect;
 for(var i=0;i<p.path.length;i++){
  var n=Number(p.path[i]);if(!prop||!isFinite(n)||n!==Math.floor(n)||n<1||n>prop.numProperties)throw Error('مسیر ویژگی قالب تغییر کرده.');prop=prop.property(n);
  if(GHAFHost._templateStructural47(prop)){if(allowUnsupported)return null;throw Error('این گروه ساختاری، کنترل قابل ویرایش قالب نیست.');}
 }
 if(!prop||(p.matchName&&String(prop.matchName||'')!==p.matchName))throw Error('ویژگی قالب تغییر کرده؛ تنظیمات را دوباره بخوان.');
 if(prop.numProperties>0||typeof prop.setValue!=='function'){if(allowUnsupported)return null;throw Error('این گروه، کنترل قابل ویرایش قالب نیست.');}
 return prop;
};
GHAFHost._templateValue47=function(prop,value,replaceAnimation){
 var old=prop.value,v,i,isArray=function(x){return Object.prototype.toString.call(x)==='[object Array]';};
 if(typeof old==='number'){
  v=Number(value);if(!isFinite(v))throw Error('مقدار عددی کنترل قالب معتبر نیست.');
  if(prop.hasMin&&v<prop.minValue||prop.hasMax&&v>prop.maxValue)throw Error('مقدار کنترل قالب خارج از بازه است.');
 }else if(isArray(old)&&isArray(value)&&old.length===value.length){v=[];for(i=0;i<value.length;i++){var number=Number(value[i]);if(!isFinite(number))throw Error('مقدار رنگ یا بردار قالب معتبر نیست.');v.push(number);}}
 else throw Error('نوع مقدار کنترل قالب معتبر نیست.');
 if(replaceAnimation){if(prop.canSetExpression!==false&&prop.expression)prop.expression='';while(prop.numKeys>0)prop.removeKey(1);}
 if(prop.numKeys>0)prop.setValueAtTime(0,v);else prop.setValue(v);
};
GHAFHost._templateWalk38=function(comp,callback){var seen={};function walk(c){if(seen[c.id])return;seen[c.id]=true;callback(c);for(var i=1;i<=c.numLayers;i++)if(c.layer(i).source instanceof CompItem)walk(c.layer(i).source);}walk(comp);};
GHAFHost._cloneTemplate38=function(source,owner,created){
 var map={},pairs=[],names={},serial=String(new Date().getTime())+'_'+Math.floor(Math.random()*1000000),assetTag=String(source.comment||'').split('\n')[0];if(assetTag.indexOf('VARNA_TEMPLATE38_ASSET:')!==0)assetTag='';
 function clone(c){if(map[c.id])return map[c.id];if(pairs.length>=240)throw Error('تعداد پیش‌کامپ‌های قالب از حد پشتیبانی بیشتر است.');var copy=c.duplicate();created.push(copy);map[c.id]=copy;copy.name='__VARNA_TEMPLATE38_'+serial+'_'+owner+'_'+c.id;copy.comment='VARNA_TEMPLATE38_INSTANCE:'+serial;names[c.name]=copy.name;pairs.push({source:c,copy:copy});for(var i=1;i<=copy.numLayers;i++){var l=copy.layer(i);if(l.source instanceof CompItem)l.replaceSource(clone(l.source),false);}return copy;}
 var root=clone(source);
 // Redirect literal comp("name") links to this caption's private dependency graph.
 function visit(group,fn,depth){if(!group||depth>28)return;for(var i=1;i<=group.numProperties;i++){var p=group.property(i);if(p.numProperties)visit(p,fn,depth+1);else if(p.canSetExpression&&p.expression)fn(p);}}
 for(var i=0;i<pairs.length;i++)for(var j=1;j<=pairs[i].copy.numLayers;j++)visit(pairs[i].copy.layer(j),function(p){var ex=String(p.expression);if(/(?:^|[^\w.])comp\(\s*[^\s"']/.test(ex))throw Error('قالب پیوند پویای کامپوزیشن دارد؛ برای جداسازی این پیوند باید در AE تنظیم شود.');ex.replace(/(?:^|[^\w.])comp\(\s*(["'])([^"']+)\1\s*\)/g,function(all,quote,name){if(!names[name]){var found=false;for(var n=1;n<=app.project.numItems;n++){var candidate=app.project.item(n),tag=String(candidate.comment||'').split('\n')[0];if(candidate instanceof CompItem&&candidate.name===name&&(assetTag?tag===assetTag:tag.indexOf('VARNA_TEMPLATE38_ASSET:')===0)){clone(candidate);found=true;break;}}if(!found&&assetTag)throw Error('پیش‌کامپ وابستهٔ قالب در همین دارایی پیدا نشد: '+name);}return all;});},0);
 for(i=0;i<pairs.length;i++)for(j=1;j<=pairs[i].copy.numLayers;j++)visit(pairs[i].copy.layer(j),function(p){p.expression=String(p.expression).replace(/(^|[^\w.])comp\(\s*(["'])([^"']+)\2\s*\)/g,function(all,lead,quote,name){return names[name]?lead+'comp('+GHAFJSON.stringify(names[name])+')':all;});},0);
 return root;
};
GHAFHost._cleanTemplateCopies38=function(items){for(var pass=0;pass<items.length+1;pass++){var changed=false;for(var i=items.length-1;i>=0;i--)try{if(items[i]&&items[i].usedIn.length===0){items[i].remove();items[i]=null;changed=true;}}catch(ignore){}if(!changed)break;}};
GHAFHost._templateRaw38=function(g){return String(g.rawText!=null?g.rawText:g.text||'').replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g,'').replace(/\s+/g,' ').replace(/^\s+|\s+$/g,'');};
GHAFHost._templateActive38=function(root,g,cfg,inventory){
 if(cfg.activeMode==='template')return;var raw=GHAFHost._templateRaw38(g),total=raw?raw.split(/\s+/).length:0,timing=g.timing38||[],duration=Number(g.end)-Number(g.start),mode=cfg.activeMode||'speech',indices=[],seen={},i,j;
 if(!total||!(duration>0))return;
 if(mode==='important'&&g.highlight37&&(g.highlight37.rawIndices38||g.highlight37.indices)){var selected=g.highlight37.rawIndices38||g.highlight37.indices;for(i=0;i<selected.length;i++){var index=Number(selected[i]);if(isFinite(index)&&index===Math.floor(index)&&index>=0&&index<total&&!seen['w'+index]){seen['w'+index]=true;indices.push(index);}}indices.sort(function(a,b){return a-b;});}
 if(!indices.length)for(i=0;i<total;i++)indices.push(i);
 var active=[],auto=[],wordDur=[],delay=[];
 for(i=0;i<inventory.controls.length;i++){
  var p=inventory.controls[i];/* Expression-control primary value only; exclude compositing parameters. */
  if(!p.path||p.path.length!==1||Number(p.path[0])!==1||p.kind!=='number')continue;
  var target=GHAFHost._templateProperty38(root,p,true);if(!target||typeof target.value!=='number')continue;
  if(p.effectName==='Active Word')active.push(target);if(p.effectName==='Auto Animate')auto.push(target);if(p.effectName==='Word Duration')wordDur.push(target);if(p.effectName==='Start Delay')delay.push(target);
 }
 for(i=0;i<auto.length;i++)GHAFHost._templateValue47(auto[i],0,true);
 for(i=0;i<wordDur.length;i++)GHAFHost._templateValue47(wordDur[i],root.duration/Math.max(1,total),true);
 for(i=0;i<delay.length;i++)GHAFHost._templateValue47(delay[i],0,true);
 for(i=0;i<active.length;i++){
  var prop=active[i];if(prop.canSetExpression!==false&&prop.expression)prop.expression='';while(prop.numKeys)prop.removeKey(1);
  for(j=0;j<indices.length;j++){var index=indices[j],when=j===0?0:((timing.length===total&&timing[index]&&isFinite(Number(timing[index].start)))?(Number(timing[index].start)-Number(g.start))/duration*root.duration:index/Math.max(1,total)*root.duration);when=Math.max(0,Math.min(root.duration-root.frameDuration,when));prop.setValueAtTime(when,index+1);}
  for(j=1;j<=prop.numKeys;j++)prop.setInterpolationTypeAtKey(j,KeyframeInterpolationType.HOLD,KeyframeInterpolationType.HOLD);
 }
};
GHAFHost._validateTemplate38=function(root,label){
 GHAFHost._templateWalk38(root,function(c){var times=[0,Math.min(c.duration-c.frameDuration,c.duration*.5),Math.max(0,c.duration-c.frameDuration)];function scan(group,layer,depth){if(!group||depth>28)return;for(var i=1;i<=group.numProperties;i++){var p=group.property(i);if(p.numProperties)scan(p,layer,depth+1);else if(p.canSetExpression&&p.expressionEnabled&&p.expression){for(var n=0;n<times.length;n++){p.valueAtTime(times[n],false);if(p.expressionError)throw Error('قالب '+label+' / '+layer.name+' / '+p.name+': '+p.expressionError);}}}}for(var i=1;i<=c.numLayers;i++)scan(c.layer(i),c.layer(i),0);});
};
GHAFHost._createTemplate38=function(comp,g,name){
 var cfg=g.anim.template38,spec=GHAFHost._templateSpec38(String(cfg.id)),source=GHAFHost._templateComp38(spec),created=[],copy=null,layer=null;
 if(!isFinite(Number(g.start))||!isFinite(Number(g.end))||Number(g.end)<=Number(g.start)||Number(g.start)>=comp.duration)throw Error('CAPTION_OUTSIDE_COMP');
 if(cfg.colorPolicy40==='override'&&cfg.emphasisColor&&!(cfg.emphasisTargets40&&cfg.emphasisTargets40.length))throw Error('نقش رنگ را صریحاً انتخاب کن.');var raw=GHAFHost._templateRaw38(g),words=raw?raw.split(/\s+/):[];if(spec.family==='creative'&&words.length>150)throw Error('این قالب حداکثر ۱۵۰ واژه دارد؛ کپشن را کوتاه‌تر کن.');
 try{
  copy=GHAFHost._cloneTemplate38(source,String(g.id||0),created);var info=GHAFHost._templateInventory38(copy),slots=cfg.slots&&cfg.slots.length?cfg.slots:(spec.family==='creative'&&info.slots.length?[info.slots[0].path]:[]),i,j;
  if(!slots.length){for(i=0;i<info.slots.length;i++)if(info.slots[i].preferred>0)slots.push(info.slots[i].path);if(!slots.length&&info.slots.length)slots.push(info.slots[0].path);}
  if(!slots.length)throw Error('جایگاه متن قالب انتخاب نشده.');
  for(i=0;i<slots.length;i++){var text=GHAFHost._templateLayer38(copy,slots[i]),textProps=text.property('ADBE Text Properties');if(!textProps)throw Error('جایگاه انتخاب‌شده، لایهٔ متن نیست.');var prop=textProps.property('ADBE Text Document');if(!prop||!prop.value)throw Error('متن قابل ویرایش قالب پیدا نشد.');var doc=prop.value;prop.expression='';while(prop.numKeys>0)prop.removeKey(1);var from=Math.floor(i*words.length/slots.length),to=Math.floor((i+1)*words.length/slots.length);doc.text=slots.length===1?raw:words.slice(from,to).join(' ');GHAFHost._rtl(doc,!!(g.style&&g.style.rtl));if(cfg.panelFont&&g.style)GHAFHost._font(doc,g.style.fontPS);prop.setValue(doc);}
  if(cfg.panelFont&&g.style)GHAFHost._templateWalk38(copy,function(c){for(var n=1;n<=c.numLayers;n++){var tp=c.layer(n).property('ADBE Text Properties');if(tp){var pr=tp.property('ADBE Text Document'),d=pr.value;GHAFHost._font(d,g.style.fontPS);GHAFHost._rtl(d,!!g.style.rtl);if(pr.numKeys===0)pr.setValue(d);}}});
  for(i=0;i<(cfg.parameters||[]).length;i++){var setting=cfg.parameters[i],target=GHAFHost._templateProperty38(copy,setting,true);/* RC46 snapshots may contain unsupported empty/compositing groups. */if(target)GHAFHost._templateValue47(target,setting.value,false);}
  GHAFHost._templateActive38(copy,g,cfg,info);
  if(cfg.colorPolicy40==='override'&&cfg.emphasisColor&&g.highlight37){var bindings=cfg.emphasisTargets40||[];for(i=0;i<info.controls.length;i++){var linked=false;for(var bc=0;bc<bindings.length;bc++)if(GHAFJSON.stringify(bindings[bc].layerPath)===GHAFJSON.stringify(info.controls[i].layerPath)&&Number(bindings[bc].effectIndex)===Number(info.controls[i].effectIndex)&&GHAFJSON.stringify(bindings[bc].path)===GHAFJSON.stringify(info.controls[i].path))linked=true;if(linked&&info.controls[i].kind==='color'){var colorProp=GHAFHost._templateProperty38(copy,info.controls[i]),rgb=GHAFHost._hex(g.highlight37.color),oldColor=colorProp.value;GHAFHost._templateValue47(colorProp,oldColor&&oldColor.length===4?rgb.concat([oldColor[3]]):rgb,true);}}}
  GHAFHost._validateTemplate38(copy,spec.label);
  layer=comp.layers.add(copy);layer.name=name;layer.comment='VARNA_CAPTION_ID:'+String(g.id||0)+'\nVARNA_TEMPLATE38:'+spec.id;layer.startTime=Number(g.start);layer.stretch=(Number(g.end)-Number(g.start))/copy.duration*100;layer.inPoint=Number(g.start);layer.outPoint=Math.min(comp.duration,Number(g.end));
  var tr=layer.property('ADBE Transform Group'),scale=Math.min(comp.width/copy.width,comp.height/copy.height)*100,x=comp.width*Number(g.style&&g.style.x!=null?g.style.x:50)/100,y=comp.height*Number(g.style&&g.style.y!=null?g.style.y:50)/100;
  if(g.safeBox){var b=g.safeBox;if(Math.abs((comp.width/comp.height)/Number(b.ratio)-1)>.05)throw Error('SAFE_ZONE_ASPECT_MISMATCH');scale=Math.min(comp.width*(b.x2-b.x1)/copy.width,comp.height*(b.y2-b.y1)/copy.height)*100;x=comp.width*(b.x1+b.x2)/2;y=comp.height*(b.y1+b.y2)/2;}
  tr.property('ADBE Anchor Point').setValue([copy.width/2,copy.height/2]);tr.property('ADBE Position').setValue([x,y]);tr.property('ADBE Scale').setValue([scale,scale]);return layer;
 }catch(e){if(layer)try{layer.remove();}catch(ignore){}GHAFHost._cleanTemplateCopies38(created);throw e;}
};
(function(){var create=GHAFHost._createCaption,remove=GHAFHost._deleteLayers,refresh=GHAFHost.refreshCaptionStyles,target=GHAFHost._outputComp36,list=GHAFHost.getOutputComps36;
 GHAFHost._outputComp36=function(p){var c=target(p);if(p.compId!=null||!c||String(c.comment||'').indexOf('VARNA_TEMPLATE38_')!==0)return c;for(var f=1;f<=app.project.numItems;f++){var candidate=app.project.item(f);if(candidate instanceof CompItem&&String(candidate.comment||'').indexOf('VARNA_TEMPLATE38_')!==0&&((p.fallbackCompId!=null&&candidate.id===Number(p.fallbackCompId))||(p.fallbackCompId==null&&p.fallbackCompName&&candidate.name===p.fallbackCompName)))return candidate;}var previous=GHAFHost._templateDestination38;if(previous)for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i)===previous)return previous;return null;};
 GHAFHost.getOutputComps36=function(encoded){var reply=GHAFJSON.parse(list(encoded));if(!reply.ok)return GHAFJSON.stringify(reply);var keep=[],all=reply.data.items||[],hidden={};for(var j=1;j<=app.project.numItems;j++){var item=app.project.item(j);if(String(item.comment||'').indexOf('VARNA_TEMPLATE38_')===0)hidden['id'+item.id]=true;}for(var i=0;i<all.length;i++)if(!hidden['id'+all[i].id])keep.push(all[i]);reply.data.items=keep;return GHAFJSON.stringify(reply);};
 GHAFHost._createCaption=function(c,g,name){if(g.anim&&g.anim.template38&&g.anim.template38.id)return GHAFHost._createTemplate38(c,g,name);return create(c,g,name);};
 GHAFHost.refreshCaptionStyles=function(encoded){var p=GHAFHost._parse(encoded),normal=[],templated=[],i,j,c=GHAFHost._activeComp();for(i=0;i<(p.groups||[]).length;i++){var g=p.groups[i];if(g.anim&&g.anim.template38&&g.anim.template38.id)templated.push(g);else normal.push(g);}if(!templated.length)return refresh(encoded);if(!c)return GHAFHost._err('NO_COMP');var input={};for(var k in p)input[k]=p[k];input.groups=normal;var reply=GHAFJSON.parse(refresh(encodeURIComponent(GHAFJSON.stringify(input))));if(!reply.ok)return GHAFJSON.stringify(reply);var old=[],fresh=[];app.beginUndoGroup('Varna Update Imported Caption Templates');try{for(i=0;i<templated.length;i++)for(j=1;j<=c.numLayers;j++){var candidate=c.layer(j);if(String(candidate.comment||'').split('\n')[0]==='VARNA_CAPTION_ID:'+templated[i].id&&candidate.source instanceof CompItem&&String(candidate.source.comment||'').indexOf('VARNA_TEMPLATE38_INSTANCE:')===0)old.push({layer:candidate,g:templated[i]});}for(i=0;i<old.length;i++){var layer=GHAFHost._createTemplate38(c,old[i].g,old[i].layer.name);fresh.push(layer);layer.moveBefore(old[i].layer);if(old[i].layer.parent)layer.parent=old[i].layer.parent;}var removeOld=[];for(i=0;i<old.length;i++)removeOld.push(old[i].layer);GHAFHost._deleteLayers(removeOld);reply.data.updated+=fresh.length;reply.data.skipped=Math.max(0,Number(reply.data.skipped||0)-fresh.length);return GHAFJSON.stringify(reply);}catch(e){GHAFHost._deleteLayers(fresh);return GHAFHost._err(String(e));}finally{app.endUndoGroup();}};
 GHAFHost._deleteLayers=function(layers){
  var tags=[],owned=[],i,j,k;
  for(i=0;i<layers.length;i++)try{var source=layers[i].source,tag=String(source&&source.comment||'');if(source instanceof CompItem&&tag.indexOf('VARNA_TEMPLATE38_INSTANCE:')===0){var known=false;for(j=0;j<tags.length;j++)if(tags[j]===tag)known=true;if(!known)tags.push(tag);}}catch(ignore){}
  remove(layers);
  /* Literal comp() peers are not layer.source descendants. Retain the whole
   * private graph while any peer is still used by an outside composition. */
  for(i=0;i<tags.length;i++){
   var peers=[],retained=false;
   for(j=1;j<=app.project.numItems;j++){var candidate=app.project.item(j);if(candidate instanceof CompItem&&String(candidate.comment||'')===tags[i])peers.push(candidate);}
   for(j=0;j<peers.length;j++){var users=peers[j].usedIn;for(k=0;k<users.length;k++)if(String(users[k].comment||'')!==tags[i])retained=true;}
   if(!retained)for(j=0;j<peers.length;j++)owned.push(peers[j]);
  }
  GHAFHost._cleanTemplateCopies38(owned);
 };
})();
