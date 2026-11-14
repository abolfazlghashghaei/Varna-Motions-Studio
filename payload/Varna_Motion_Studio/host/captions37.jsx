/* Native emphasis and shared stack handles. ES3 / CEP host only. */
GHAFHost._highlight37=function(layer,h,g){
 if(GHAFHost._wordHighlight39&&((h&&h.indices)||g))return GHAFHost._wordHighlight39(layer,h,g);
 var text=layer.property('ADBE Text Properties');if(!text){if(h&&h.ranges&&h.ranges.length)throw Error('HIGHLIGHT_NEEDS_NATIVE_TEXT');return;}var animators=text.property('ADBE Text Animators'),i;
 for(i=animators.numProperties;i>=1;i--)if(String(animators.property(i).name).indexOf('VARNA EMPHASIS37 ')===0)animators.property(i).remove();
 if(!h||!h.ranges||!h.ranges.length)return;
 for(i=0;i<h.ranges.length;i++){
  var index=Number(h.ranges[i].start),end=Number(h.ranges[i].end);if(!isFinite(index)||index<0||index!==Math.floor(index)||!isFinite(end)||end<=index)throw Error('HIGHLIGHT_WORD_INDEX_INVALID');
  var an=animators.addProperty('ADBE Text Animator');an.name='VARNA EMPHASIS37 '+index;
  var props=an.property('ADBE Text Animator Properties');props.addProperty('ADBE Text Fill Color').setValue(GHAFHost._hex(h.color||'#F8CB67'));
  if(Number(h.scale||100)!==100){var size=Math.max(80,Math.min(140,Number(h.scale)));props.addProperty('ADBE Text Scale 3D').setValue([size,size,100]);}
  var selector=an.property('ADBE Text Selectors').addProperty('ADBE Text Selector'),advanced=selector.property('ADBE Text Range Advanced');
  advanced.property('ADBE Text Range Units').setValue(2);advanced.property('ADBE Text Range Type2').setValue(1);
  advanced.property('ADBE Text Selector Smoothness').setValue(0);
  selector.property('ADBE Text Index Start').setValue(index);selector.property('ADBE Text Index End').setValue(end);
 }
};
GHAFHost._finishStacks37=function(s){
 if(s.stacksFinished37)return;var groups={},order=[],i,j;
 for(i=0;i<s.created.length;i++){var layer=s.created[i],m=String(layer.comment||'').match(/\nVARNA_STACK37:(\{[^\n]+\})/);if(!m)continue;var data=GHAFJSON.parse(m[1]),key=String(data.id);if(!groups[key]){groups[key]={data:data,layers:[]};order.push(key);}groups[key].layers.push(layer);}
 for(i=0;i<order.length;i++){
  var group=groups[order[i]],items=group.layers,anchor=s.comp.layers.addNull();s.created.push(anchor);anchor.name='GHAF_STACK37_'+s.token+'_'+order[i];anchor.comment='VARNA_STACK_HANDLE37';
  var tr=anchor.property('ADBE Transform Group');tr.property('ADBE Anchor Point').setValue([0,0]);tr.property('ADBE Position').setValue([Number(group.data.x),Number(group.data.y)]);
  var start=s.comp.duration,end=0,solo=false;for(j=0;j<items.length;j++){start=Math.min(start,items[j].inPoint);end=Math.max(end,items[j].outPoint);if(items[j].solo)solo=true;}
  anchor.inPoint=Math.max(0,start);anchor.outPoint=Math.min(s.comp.duration,end);anchor.guideLayer=false;anchor.solo=solo;
  for(j=0;j<items.length;j++){var l=items[j],locked=l.locked;try{l.locked=false;if(!l.parent&&!/^GHAF_TYPE_CLICK_/.test(l.name))l.parent=anchor;}finally{l.locked=locked;}}
 }
 s.stacksFinished37=true;
};
(function(){
 var create=GHAFHost._createTextLayer,refresh=GHAFHost.refreshCaptionStyles,finish=GHAFHost._finishOutputBlock35,outputs=GHAFHost._outputLayers,commit=GHAFHost.commitOutputSession;
 GHAFHost._createTextLayer=function(c,g,name){var layer=create(c,g,name);GHAFHost._highlight37(layer,g.highlight37,g);return layer;};
 GHAFHost.refreshCaptionStyles=function(encoded){var result=refresh(encoded),r=GHAFJSON.parse(result);if(!r.ok)return result;var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return result;app.beginUndoGroup('Varna Refresh Caption Emphasis');try{for(var i=0;i<(p.groups||[]).length;i++){var g=p.groups[i];for(var j=1;j<=c.numLayers;j++){var l=c.layer(j);if(String(l.comment||'').split('\n')[0]==='VARNA_CAPTION_ID:'+String(g.id)){var locked=l.locked;try{l.locked=false;GHAFHost._highlight37(l,g.highlight37,g);}finally{l.locked=locked;}}}}}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}return result;};
 GHAFHost._finishOutputBlock35=function(c,layers,g,tail){var result=finish(c,layers,g,tail);if(g.stack37)for(var i=0;i<layers.length;i++){var l=layers[i],locked=l.locked;try{l.locked=false;l.comment=String(l.comment||'')+'\nVARNA_STACK37:'+GHAFJSON.stringify(g.stack37);}finally{l.locked=locked;}}return result;};
 GHAFHost._outputLayers=function(c){var result=outputs(c);for(var i=1;i<=c.numLayers;i++)if(/^GHAF_STACK37_/.test(c.layer(i).name))result.push(c.layer(i));return result;};
 GHAFHost.commitOutputSession=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession;if(!s||p.token!==s.token||s.count!==s.expected)return commit(encoded);app.beginUndoGroup('Varna Caption Stack Handles');try{GHAFHost._finishStacks37(s);}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}return commit(encoded);};
})();
