/* UI81: native background motion. Original text animation stays in panel state. */
GHAFHost._backgroundRevision81=1;
GHAFHost._reflowCache81={values:{},keys:[],hits:0,misses:0};
GHAFHost._reflowMeasured81=function(key){var cache=GHAFHost._reflowCache81,value=cache.values['K'+key];if(value){cache.hits++;return value.slice(0);}cache.misses++;return null;};
GHAFHost._reflowRemember81=function(key,bounds){var cache=GHAFHost._reflowCache81,id='K'+key;if(!cache.values[id])cache.keys.push(id);cache.values[id]=bounds.slice(0);while(cache.keys.length>1024)delete cache.values[cache.keys.shift()];};
GHAFHost._backgroundMotion81=function(shape,bg){
 var parent=shape.parent;if(!parent)throw Error('BACKGROUND_MOTION_REQUIRES_ANCHOR');
 var force=bg._reflowBoundary81===true,cfg=VarnaBackgroundMotion81.resolve(bg),tr=shape.property('ADBE Transform Group');
 var size=force?'parent.effect("VARNA_REFLOW_SIZE67")(1)':'(function(){var r=parent.sourceRectAtTime(time,false);return [r.width,r.height];})()';
 var pre='var b='+size+';var a='+VarnaBackgroundMotion81.expression(cfg,'time,parent.inPoint,parent.outPoint,b[0]+'+(2*Number(bg.padding||0))+',b[1]+'+(2*Number(bg.padding||0))+','+(force?'true':'false'),GHAFJSON.stringify)+';';
 var names=['ADBE Opacity','ADBE Scale','ADBE Position','ADBE Rotate Z'];
 for(var i=0;i<names.length;i++){var prop=tr.property(names[i]);while(prop.numKeys>0)prop.removeKey(1);prop.expression='';}
 tr.property('ADBE Opacity').setValue(100);tr.property('ADBE Opacity').expression=pre+'a.opacity;';
 tr.property('ADBE Scale').setValue([100,100]);tr.property('ADBE Scale').expression=pre+'[a.scaleX,a.scaleY];';
 tr.property('ADBE Rotate Z').setValue(0);tr.property('ADBE Rotate Z').expression=pre+'a.rotation;';
 tr.property('ADBE Position').expression=pre+'[value[0]+a.x,value[1]+a.y];';
};
(function(){
 var original=GHAFHost._backgroundMotion27,finalize=GHAFHost._finalizeBackground27;
 GHAFHost._backgroundMotion27=function(shape,bg){if(bg&&(bg.motion81||bg._reflowBoundary81))return GHAFHost._backgroundMotion81(shape,bg);return original(shape,bg);};
 GHAFHost._finalizeBackground27=function(text,bg,g){
  finalize(text,bg,g);if(!bg||!bg.enabled||!bg.motion81)return;
  var surface=GHAFHost._nativeBgFor(text);if(!surface)return;
  var c=text.containingComp;for(var i=1;i<=c.numLayers;i++){var layer=c.layer(i);if(layer!==surface&&layer.matchName==='ADBE Vector Layer'&&GHAFHost._bgOwned27(layer,text)){var locked=layer.locked;layer.locked=false;layer.property('ADBE Transform Group').property('ADBE Rotate Z').expression='thisComp.layer('+GHAFJSON.stringify(surface.name)+').transform.rotation;';layer.locked=locked;}}
 };
})();
