/* Output blocks stay ordered independently of AE's add-at-top behavior. */
GHAFHost._outputLayers=function(c){var out=[],a=GHAFHost._layerSet(c);for(var i=0;i<a.length;i++){var n=String(a[i].name||'');if(/^GHAF_CAP_|^GHAF_MARKER_CAPTIONS|^GHAF_TYPE_CLICK_/.test(n)||(/^__GHAF_NATIVE_BG__|^__GHAF_GLASS_BLUR__|^__GHAF_TEMPLATE_BG__|^__GHAF_TYPE_MEASURE__|^__VARNA_BG_ANCHOR__/.test(n)&&/GHAF_CAP_|GHAF_MARKER_CAPTIONS/.test(n)))out.push(a[i]);}return out;};
GHAFHost._finishOutputBlock35=function(c,layers,g,previousTail){
 var solo=false,i,j;for(i=1;i<=c.numLayers;i++)if(c.layer(i).solo)solo=true;
 var samples=[Number(g.start)+.001,(Number(g.start)+Math.min(c.duration,Number(g.end)))/2,Math.min(c.duration,Number(g.end))-.001];
 function scan(group,layer,depth){if(!group||depth>24)return;for(var k=1;k<=group.numProperties;k++){var p=group.property(k);if(!p)continue;if(p.numProperties)scan(p,layer,depth+1);else if(p.canSetExpression&&p.expressionEnabled&&p.expression){for(var t=0;t<samples.length;t++){p.valueAtTime(samples[t],false);if(p.expressionError)throw Error(layer.name+' / '+p.name+': '+p.expressionError);}}}}
 for(i=0;i<layers.length;i++){var l=layers[i],locked=l.locked,measurement=/^__GHAF_TYPE_MEASURE__|^__VARNA_BG_ANCHOR__/.test(String(l.name||''));try{l.locked=false;if(!measurement){l.guideLayer=false;l.enabled=true;if(solo)l.solo=true;}scan(l,l,0);}finally{l.locked=locked;}}
 if(previousTail){var tail=previousTail;for(i=0;i<layers.length;i++){var item=layers[i],wasLocked=item.locked;try{item.locked=false;item.moveAfter(tail);tail=item;}finally{item.locked=wasLocked;}}}
 return layers.length?layers[layers.length-1]:previousTail;
};
