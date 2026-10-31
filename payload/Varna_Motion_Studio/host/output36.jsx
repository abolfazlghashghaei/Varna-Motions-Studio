/* Resolve an explicit output target without relying on panel/project focus. */
GHAFHost._outputComp36=function(p){
 p=p||{};var active=GHAFHost._activeComp(),i,item;
 function find(id){if(active&&active.id===Number(id))return active;for(var j=1;app.project&&j<=app.project.numItems;j++){var it=app.project.item(j);if(it instanceof CompItem&&it.id===Number(id))return it;}return null;}
 if(p.compId!=null)return find(p.compId);
 if(active)return active;
 if(p.fallbackCompId!=null){item=find(p.fallbackCompId);if(item&&(!p.fallbackCompName||item.name===String(p.fallbackCompName)))return item;}
 var remembered=GHAFHost._lastComp36;if(remembered){try{item=find(remembered.id);if(item===remembered)return item;}catch(stale){}}
 var selected=app.project&&app.project.selection||[],found=null;
 for(i=0;i<selected.length;i++)if(selected[i] instanceof CompItem){if(found)return null;found=selected[i];}
 return found;
};
GHAFHost.getOutputComps36=function(){try{var active=GHAFHost._activeComp(),items=[];for(var i=1;i<=app.project.numItems;i++){var c=app.project.item(i);if(c instanceof CompItem)items.push({id:c.id,name:c.name,width:c.width,height:c.height,duration:c.duration});}return GHAFHost._ok({activeId:active?active.id:null,items:items});}catch(e){return GHAFHost._err(String(e));}};
