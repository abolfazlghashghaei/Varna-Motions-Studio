/* Reuse complete, matching native caption blocks; replace changed blocks at commit. */
GHAFHost._buildMeta37=function(l){var m=String(l.comment||'').match(/\nVARNA_BUILD37:([^\n]+)/);if(!m)return null;try{return GHAFJSON.parse(m[1]);}catch(e){return null;}};
GHAFHost._restoreOrder37=function(s){if(!s||!s.orderChanged37)return;for(var i=s.beginOrder37.length-1;i>=0;i--){var l=s.beginOrder37[i],locked=l.locked;try{l.locked=false;l.moveToBeginning();}catch(e){}finally{try{l.locked=locked;}catch(ignore){}}}};
(function(){var begin=GHAFHost.beginOutputSession,build=GHAFHost.buildOutput,commit=GHAFHost.commitOutputSession,abort=GHAFHost.abortOutputSession;
 GHAFHost.beginOutputSession=function(encoded){var p=GHAFHost._parse(encoded);if(p.update37)p.clearOld=true;var result=begin(encodeURIComponent(GHAFJSON.stringify(p))),r=GHAFJSON.parse(result);if(r.ok){var s=GHAFHost._outputSession;s.update37=p.update37===true;s.reused37=[];s.blocks37=[];s.beginOrder37=GHAFHost._layerSet(s.comp);}return result;};
 GHAFHost.buildOutput=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession;if(!s||!s.update37||!p.sessionToken||p.sessionToken!==s.token||p.done!==s.count||(p.compId!=null&&p.compId!==s.comp.id)||!p.groups||p.groups.length!==1)return build(encoded);
  var g=p.groups[0],signature=GHAFJSON.stringify({group:g,comp:[s.comp.width,s.comp.height,s.comp.duration,s.comp.frameRate,s.comp.pixelAspect],revision:GHAFHost._bridgeRevision}),i,j,meta,block=[],matched=null;
  // Shared stacks are rebuilt as a set, retaining their common parent and timing.
  if(!g.stack37)for(i=0;i<s.previous.length;i++){meta=GHAFHost._buildMeta37(s.previous[i]);if(meta&&meta.id===g.id&&meta.signature===signature){matched=meta;break;}}
  if(matched){for(i=0;i<s.previous.length;i++){meta=GHAFHost._buildMeta37(s.previous[i]);if(meta&&meta.block===matched.block&&meta.signature===signature)block.push(s.previous[i]);}if(block.length!==matched.count)block=[];}
  if(block.length){s.reused37=s.reused37.concat(block);s.blocks37.push({layers:block,g:g});s.count++;return GHAFHost._ok({created:1,reused37:1,errors:[]});}
  var before=s.created.length,result=build(encoded),r=GHAFJSON.parse(result);if(!r.ok)return result;block=s.created.slice(before);var tag={id:g.id,signature:signature,block:s.token+'_'+s.count,count:block.length};
  for(i=0;i<block.length;i++){var l=block[i],locked=l.locked;try{l.locked=false;l.comment=String(l.comment||'')+'\nVARNA_BUILD37:'+GHAFJSON.stringify(tag);}finally{l.locked=locked;}}
  s.blocks37.push({layers:block,g:g});return result;
 };
 GHAFHost.commitOutputSession=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession;if(!s||!s.update37||p.token!==s.token||s.count!==s.expected)return commit(encoded);
  app.beginUndoGroup('Varna Update Caption Blocks');try{var tail=null,i,j;for(i=0;i<s.blocks37.length;i++){var block=s.blocks37[i].layers;for(j=0;j<block.length;j++){var l=block[j],locked=l.locked;try{l.locked=false;s.orderChanged37=true;if(tail)l.moveAfter(tail);else l.moveToBeginning();tail=l;}finally{l.locked=locked;}}}
   var previous=[];for(i=0;i<s.previous.length;i++){var keep=false;for(j=0;j<s.reused37.length;j++)if(s.previous[i]===s.reused37[j]){keep=true;break;}if(!keep)previous.push(s.previous[i]);}s.previous=previous;
  }catch(e){GHAFHost._restoreOrder37(s);return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
  return commit(encoded);
 };
 GHAFHost.abortOutputSession=function(encoded){var s=GHAFHost._outputSession,result=abort(encoded),r=GHAFJSON.parse(result);if(r.ok)GHAFHost._restoreOrder37(s);return result;};
})();
