/* Incremental, transactional live preview. Unchanged groups keep their actual layer identities. */
GHAFHost._livePreviewRecords=GHAFHost._livePreviewRecords||{};
GHAFHost.updateLivePreview=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._outputComp36(p);if(!c)return GHAFHost._err('NO_COMP');if(p.compId!=null&&c.id!==Number(p.compId))return GHAFHost._err('Composition changed; previous preview preserved.');
 var groups=p.groups||[],old=GHAFHost._layerSet(c),previous=GHAFHost._previewLayers(c),records=GHAFHost._livePreviewRecords[String(c.id)]||[],next=[],keep=[],reused=0,changed=0,stamp=String(new Date().getTime());if(!groups.length&&p.group)groups=[p.group];
 function present(layer){for(var i=0;i<old.length;i++)if(old[i]===layer)return true;return false;}
 function retained(layer){for(var i=0;i<keep.length;i++)if(keep[i]===layer)return true;return false;}
 app.beginUndoGroup('Varna Preview');try{
  for(var i=0;i<groups.length;i++){var g=groups[i];g.anim=g.anim||{};g.anim.typeSound=false;var key=String(g.id==null?i:g.id),signature=GHAFJSON.stringify(g),record=null;
   for(var j=0;j<records.length;j++)if(records[j].key===key&&records[j].signature===signature){var valid=records[j].layers.length>0;for(var k=0;k<records[j].layers.length;k++)if(!present(records[j].layers[k]))valid=false;if(valid)record=records[j];break;}
   if(record){reused++;next.push(record);for(j=0;j<record.layers.length;j++)keep.push(record.layers[j]);continue;}
   var before=GHAFHost._layerSet(c);GHAFHost._createCaption(c,g,'__VARNA_LIVE_CAP_'+stamp+'_'+i);var fresh=GHAFHost._newLayers(c,before);
   for(j=0;j<fresh.length;j++){var layer=fresh[j];layer.locked=false;layer.enabled=true;layer.guideLayer=true;layer.shy=true;layer.comment=String(layer.comment||'')+'\nVARNA_LIVE_OWNER';keep.push(layer);}
   next.push({key:key,signature:signature,layers:fresh});changed++;
  }
  var stale=[];for(i=0;i<previous.length;i++)if(!retained(previous[i]))stale.push(previous[i]);GHAFHost._deleteLayers(stale);GHAFHost._livePreviewRecords[String(c.id)]=next;if(p.seekPreview45===true&&groups.length){var focus=groups[0],st=Math.max(0,Number(focus.start)||0),en=Math.min(c.duration,Number(focus.end)||st+c.frameDuration);c.time=Math.max(0,Math.min(c.duration-c.frameDuration,st+Math.min(.6,Math.max(c.frameDuration,(en-st)*.55))));}if(p.focusViewer!==false)c.openInViewer();return GHAFHost._ok({created:groups.length,changed:changed,reused:reused,followTimeline:true,compId:c.id});
 }catch(e){GHAFHost._deleteLayers(GHAFHost._newLayers(c,old));return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};

(function(){var base=GHAFHost._removeNativeBg;GHAFHost._removeNativeBg=function(layer){var c=layer.containingComp,owned=[],tag='VARNA_VENDOR_OWNER:'+layer.name;for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),lines=String(l.comment||'').split(/\r?\n/);for(var j=0;j<lines.length;j++)if(lines[j]===tag){owned.push(l);break;}}GHAFHost._deleteLayers(owned);return base(layer);};})();
