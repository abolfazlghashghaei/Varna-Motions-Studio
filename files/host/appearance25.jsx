GHAFHost._defaultTextGlass=function(){return {lightAngle:45,lightIntensity:100,refraction:100,depth:70,dispersion:50,frost:0,splay:0,magnify:0,effectScale:2,rimScale:.5};};
/* Owned helper layers preserve one background geometry, with separate color and optical passes. */
GHAFHost._prepareTypingBounds=function(text,g,bg){
 if(bg._typingExpand)delete bg._typingExpand;if(!bg.enabled||String((g.anim||{}).preset)!=='typewriter')return null;
 var measure={off:Math.max(0,Number(g.anim.startOffset)||0),grow:bg.followTyping!==false,name:text.name};
 if(measure.grow){bg._typingExpand=true;return measure;}
 var full=text.duplicate();full.name='__GHAF_TYPE_MEASURE__'+text.name;full.comment='VARNA_TYPE_MEASUREMENT';full.enabled=false;full.guideLayer=true;full.shy=true;full.locked=false;
 var source=full.property('ADBE Text Properties').property('ADBE Text Document');source.expression='';while(source.numKeys>0)source.removeKey(1);GHAFHost._clearAnimators(full);measure.name=full.name;full.locked=true;return measure;
};
GHAFHost._typingBoundsExpression=function(expr,measure){
 var pattern=/((?:thisLayer\.)?parent|t)\.sourceRectAtTime\(time,\s*false\)/g;if(!pattern.test(expr)||expr.indexOf('function varnaRect(')>=0)return expr;
 var fn=measure.grow?'function varnaRect(t){var a=t.sourceRectAtTime(time,false);if(time<=t.inPoint+'+measure.off+')return a;var s=[a,t.sourceRectAtTime(Math.max(t.inPoint+'+measure.off+',time-.025),false),t.sourceRectAtTime(Math.max(t.inPoint+'+measure.off+',time-.05),false)];var r={left:0,top:0,width:0,height:0};for(var j=0;j<3;j++){r.left+=s[j].left/3;r.top+=s[j].top/3;r.width+=s[j].width/3;r.height+=s[j].height/3;}return r;}': 'function varnaRect(t){return thisComp.layer('+GHAFJSON.stringify(measure.name)+').sourceRectAtTime(time,false);}';
 return fn+'\n'+expr.replace(pattern,'varnaRect($1)');
};
GHAFHost._linkTypingBounds=function(text,measure){
 if(!measure)return;var c=text.containingComp;
 function scan(group,depth){if(!group||depth>12)return;for(var j=1;j<=group.numProperties;j++){var prop=group.property(j);if(prop.numProperties)scan(prop,depth+1);else if(prop.canSetExpression&&prop.expression&&String(prop.expression).indexOf('Glassary')<0)prop.expression=GHAFHost._typingBoundsExpression(prop.expression,measure);}}
 for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),nm=String(l.name||'');if((l.parent===text&&nm.indexOf(GHAFHost._nativeBgPrefix)===0&&nm.indexOf(GHAFHost._nativeBgPrefix+'AE_TEXT_')!==0)||nm===GHAFHost._glassBlurName(text)||nm===GHAFHost._glassBlurName(text)+'_EDGE'){
 var locked=l.locked;l.locked=false;scan(l,0);
 // Layer-name lookup also works for the unparented, comp-sized optical blur pass.
 if(measure.grow&&nm.indexOf(GHAFHost._nativeBgPrefix+'COSMIC_COLOR_')!==0)l.property('ADBE Transform Group').property('ADBE Opacity').expression='time < thisComp.layer('+GHAFJSON.stringify(text.name)+').inPoint+'+measure.off+' ? 0 : 100';l.locked=locked;
 }}
};
GHAFHost._vendorPassFill=function(shape,opacity){var root=shape.property('ADBE Root Vectors Group');function scan(g,d){if(!g||d>8)return;for(var i=1;i<=g.numProperties;i++){var p=g.property(i);if(p.matchName==='ADBE Vector Graphic - Fill')p.property('ADBE Vector Fill Opacity').setValue(opacity);else if(p.numProperties)scan(p,d+1);}}scan(root,0);};
GHAFHost._applyBgVendorEffects=function(text,bg){
 if(!bg||!bg.enabled||!(bg.vendorEffects||[]).length)return;var shape=GHAFHost._nativeBgFor(text);if(!shape)throw Error('افکت بک‌گراند به Shape نیاز دارد.');
 if(bg.vendorMode!=='combined'){var locked=shape.locked;shape.locked=false;try{GHAFHost._syncPersistedVendorEffects(shape,bg.vendorEffects);}finally{shape.locked=locked;}return;}
 for(var i=0;i<bg.vendorEffects.length;i++){var item=bg.vendorEffects[i],glass=item.effect==='glassary',pass=GHAFHost._glassHelper(text,bg,glass?'VENDOR_OPTICS':'COSMIC_COLOR',true);if(!pass)throw Error('ساخت لایهٔ ترکیبی ناموفق بود.');pass.name=GHAFHost._nativeBgPrefix+(glass?'VENDOR_OPTICS_':'COSMIC_COLOR_')+text.name;pass.comment='VARNA_MATERIAL_PASS';pass.locked=false;
 GHAFHost._vendorPassFill(pass,100);GHAFHost._syncPersistedVendorEffects(pass,[item]);
 var tr=pass.property('ADBE Transform Group');if(glass){pass.moveAfter(text);tr.property('ADBE Opacity').expression='100';}else{pass.moveAfter(shape);var alpha=Math.max(0,Math.min(100,Number(bg.vendorBlendOpacity==null?70:bg.vendorBlendOpacity)));tr.property('ADBE Opacity').expression='thisComp.layer('+GHAFJSON.stringify(shape.name)+').transform.opacity*'+alpha+'/100';}pass.locked=true;
 }
};
/* Clear only active transform channels. Hidden 3D/follower properties can reject even an empty expression. */
GHAFHost._clearTransformExpressions46=function(layer){
 var tr=layer.property('ADBE Transform Group');if(!tr||typeof tr.property!=='function')return;
 function clear(p){if(p&&p.canSetExpression!==false&&p.expression)p.expression='';}
 var names=['ADBE Anchor Point','ADBE Scale','ADBE Rotate Z','ADBE Opacity'],i,position=tr.property('ADBE Position');
 if(layer.threeDLayer){names.push('ADBE Orientation');names.push('ADBE Rotate X');names.push('ADBE Rotate Y');}
 for(i=0;i<names.length;i++)clear(tr.property(names[i]));
 if(position&&position.dimensionsSeparated&&typeof position.getSeparationFollower==='function'){
  for(i=0;i<(layer.threeDLayer?3:2);i++)clear(position.getSeparationFollower(i));
 }else clear(position);
};
GHAFHost._resetCaptionMotion=function(layer,g){
 var c=layer.containingComp;for(var i=c.numLayers;i>=1;i--)if(String(c.layer(i).name).indexOf('GHAF_TYPE_CLICK_'+String(g.id)+'_')===0){var click=c.layer(i);click.locked=false;click.remove();}
 var source=layer.property('ADBE Text Properties').property('ADBE Text Document');source.expression='';GHAFHost._clearAnimators(layer);GHAFHost._clearTransformKeys(layer);GHAFHost._clearTransformExpressions46(layer);
};
