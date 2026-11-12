/* Varna workflow adapters. Original vendor files and licensing are unchanged. */
GHAFHost._typingExpression=function(a){
 a=a||{};var off=Math.max(0,Number(a.startOffset)||0),dur=Math.max(.03,Number(a.inDur)||.42),direction=String(a.typingDirection||'auto'),variance=Math.max(0,Math.min(1,Number(a.typingVariance)||0)),pause=Math.max(0,Math.min(5,Number(a.typingPause)||0));
 return "var s=value.toString(),u=[],w=[],sum=0,pending='';for(var i=0;i<s.length;i++){var ch=s.charAt(i),n=s.charCodeAt(i);if(n>=55296&&n<=56319&&i+1<s.length)ch+=s.charAt(++i);if(/[\\u0300-\\u036f\\u064b-\\u065f\\u0670\\ufe00-\\ufe0f\\u200c\\u200d\\u200e\\u200f\\u2066-\\u2069]/.test(ch)){if(u.length)u[u.length-1]+=ch;else pending+=ch;}else if(u.length&&u[u.length-1].charAt(u[u.length-1].length-1)==='\\u200d')u[u.length-1]+=ch;else{u.push(pending+ch);pending='';}}for(i=0;i<u.length;i++){var v=1+"+variance+"*((i*17+13)%11)/10;if(/[.,;:!?،؛؟]/.test(u[i]))v+="+pause+";sum+=v;w.push(sum);}if(u.length>1)sum=w[u.length-2];function mt(n,f){for(var k=1;k<=marker.numKeys;k++)if(marker.key(k).comment==n)return marker.key(k).time;return f;}var a=inPoint+"+off+",b=Math.max(a+.001,mt('IN',Math.min(outPoint,a+"+dur+"))),q=Math.max(0,Math.min(1,(time-a)/(b-a))),n=0;if(time>=a&&u.length){n=1;while(n<u.length&&w[n-1]/Math.max(.001,sum)<=q)n++;}var out='';"+(direction==='reverse'?"for(i=Math.max(0,u.length-n);i<u.length;i++)out+=u[i];":"for(i=0;i<n;i++)out+=u[i];")+"out;";
};
GHAFHost._removeTextSolidOpacity=function(text){try{var group=text.property('ADBE Text Properties').property('ADBE Text Animators');for(var i=group.numProperties;i>=1;i--)if(group.property(i).name==='VARNA · Text Solid Opacity')group.property(i).remove();}catch(e){}};
GHAFHost._setTextSolidOpacity=function(text,opacity){
 GHAFHost._removeTextSolidOpacity(text);var group=text.property('ADBE Text Properties').property('ADBE Text Animators'),anim=group.addProperty('ADBE Text Animator');anim.name='VARNA · Text Solid Opacity';anim.property('ADBE Text Animator Properties').addProperty('ADBE Text Opacity').setValue(Math.max(0,Math.min(100,Number(opacity))));
 var range=anim.property('ADBE Text Selectors').addProperty('ADBE Text Selector');range.property('ADBE Text Percent Start').setValue(0);range.property('ADBE Text Percent End').setValue(100);
};
GHAFHost._ensureScriptTool=function(tool){
 if(GHAFHost._scriptUIs[tool])return GHAFHost._scriptUIs[tool];
 var result=GHAFJSON.parse(GHAFHost.initScriptTool(encodeURIComponent(GHAFJSON.stringify({tool:tool}))));if(!result.ok)throw Error(result.error);return GHAFHost._scriptUIs[tool];
};
GHAFHost._scriptControl=function(root,path){var c=root;for(var i=0;i<path.length;i++)c=c.children[path[i]];return c;};
GHAFHost._originalScriptButton=function(tool,pattern){
 var root=GHAFHost._ensureScriptTool(tool),controls=GHAFHost._scriptUITree(tool,root).controls,icons=[];
 for(var i=0;i<controls.length;i++){var p=controls[i];if(p.type==='iconbutton')icons.push(p);if((p.type==='button'||p.type==='iconbutton')&&pattern.test(p.label+' '+p.text))return GHAFHost._scriptControl(root,p.path);}
 var candidates=[];for(i=0;i<controls.length;i++){var row=controls[i];if((row.type==='button'||row.type==='iconbutton')&&pattern.test(row.context||''))candidates.push(row);}if(candidates.length===1)return GHAFHost._scriptControl(root,candidates[0].path);if(tool==='glassary'&&icons.length===6)return GHAFHost._scriptControl(root,icons[5].path);
 throw Error('فرمان اصلی '+tool+' در پنل پیدا نشد؛ از تنظیمات کامل ابزار استفاده کن.');
};
GHAFHost._convertGlassaryShape=function(shape){
 var c=shape.containingComp,selected=c.selectedLayers||[],oldName=shape.name,locked=shape.locked;GHAFHost._repairGlassaryName(shape);
 try{for(var i=0;i<selected.length;i++)selected[i].selected=false;shape.locked=false;shape.selected=true;
  var beforeGlassary=GHAFHost._layerSet(c);var command=GHAFHost._originalScriptButton('glassary',/apply.*(shape|select)|selected.*shape|اعمال به Shape/i);command.notify('onClick');var createdGlassary=GHAFHost._newLayers(c,beforeGlassary),owner=shape.parent&&String(shape.name).indexOf(GHAFHost._nativeBgPrefix)===0?shape.parent.name:shape.name;for(var gi=0;gi<createdGlassary.length;gi++)createdGlassary[gi].comment=String(createdGlassary[gi].comment||'')+'\nVARNA_VENDOR_OWNER:'+owner;
  var root=GHAFHost._scriptUIs.glassary;if(root)root.hide();var fx=shape.property('ADBE Effect Parade'),match=GHAFHost._vendorMatch('glassary'),effect=null;
  for(i=1;i<=fx.numProperties;i++)if(fx.property(i).matchName===match||String(fx.property(i).name)==='Glassary')effect=fx.property(i);
  if(!effect)throw Error('فرمان Glassary اجرا شد، اما افکت روی Shape دنبال‌کننده ساخته نشد.');shape.name=oldName;return effect;
 }finally{try{shape.selected=false;shape.locked=locked;}catch(e){}for(var j=0;j<selected.length;j++)try{selected[j].selected=true;}catch(ignore){} }
};
GHAFHost.applyGlassarySelection=function(){
 var c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');var selection=c.selectedLayers||[],shapes=[];
 for(var i=0;i<selection.length;i++){var l=selection[i],shape=l.matchName==='ADBE Vector Layer'?l:GHAFHost._nativeBgFor(l);if(shape)shapes.push(shape);}
 if(!shapes.length)return GHAFHost._err('یک Shape یا متن دارای بک‌گراند را در AE انتخاب کن.');
 app.beginUndoGroup('Varna · Glassary selected shapes');try{for(i=0;i<shapes.length;i++){var effect=GHAFHost._convertGlassaryShape(shapes[i]);shapes[i].comment=String(shapes[i].comment||'')+'\nVARNA_GLASSARY_MANAGED';}return GHAFHost._ok({updated:shapes.length});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost._chooseScriptOption=function(tool,pattern,choice){
 var root=GHAFHost._ensureScriptTool(tool),rows=GHAFHost._scriptUITree(tool,root).controls;
 for(var i=0;i<rows.length;i++){var p=rows[i],control=GHAFHost._scriptControl(root,p.path);
  if(p.items){for(var j=0;j<p.items.length;j++)if(pattern.test(p.items[j])){control.selection=j;control.notify('onChange');return true;}}
  if(pattern.test(p.label+' '+p.text)&&(p.type==='checkbox'||p.type==='radiobutton')){control.value=!!choice;control.notify('onClick');return true;}
 }return false;
};
GHAFHost.scriptToolPreset=function(encoded){
 var p=GHAFHost._parse(encoded),tool=p.tool,c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');if(tool!=='writetyper'&&tool!=='cuttana')return GHAFHost._err('Unknown script');
 try{
  var selection=c.selectedLayers||[];if((tool==='writetyper'||p.preset==='automatic')&&(selection.length!==1||selection[0].matchName!=='ADBE Text Layer'))throw Error('یک لایهٔ متن را در تایم‌لاین AE انتخاب کن.');
  var before=GHAFHost._layerSet(c),clip={start:selection.length?selection[0].inPoint:0,end:selection.length?selection[0].outPoint:c.duration},directionApplied=false;
  var root=GHAFHost._ensureScriptTool(tool),pattern;
  if(tool==='writetyper'){
   if(!GHAFHost._chooseScriptOption(tool,p.rig==='dynamic'?/\bdynamic\b/i:/\bstable\b/i,true))throw Error('گزینهٔ '+(p.rig==='dynamic'?'Dynamic':'Stable')+' در پنل اصلی پیدا نشد.');
   pattern=/create.*(rig|typ)|apply.*(rig|typ)|make.*rig|ساخت تایپ/i;
  }else{
   var patterns={automatic:/full\s*auto(?:matic)?|fully\s*automatic/i,writeon:/make animations?|create animations?/i,trail:/animated trail|create.*trail|\btrail\b/i};pattern=patterns[p.preset];if(!pattern)throw Error('Unknown Cuttana preset');
   if(p.direction==='rtl')directionApplied=GHAFHost._chooseScriptOption(tool,/right.?to.?left|\brtl\b/i,true);else if(p.direction==='ltr')directionApplied=GHAFHost._chooseScriptOption(tool,/left.?to.?right|\bltr\b/i,true);
  }
  var button;if(p.path){button=GHAFHost._scriptControl(root,p.path);if(!button||!/^button$|^iconbutton$/.test(String(button.type)))throw Error('فرمان انتخابی معتبر نیست.');}else button=GHAFHost._originalScriptButton(tool,pattern);if(button.enabled===false)throw Error('فرمان اصلی غیرفعال است؛ لایهٔ متن را در AE انتخاب کن.');button.notify('onClick');root.hide();if(tool==='cuttana'&&!directionApplied)directionApplied=GHAFHost._orderNewWriteOnLayers(c,before,p.direction,clip);return GHAFHost._ok({tool:tool,preset:p.preset||p.rig,directionApplied:tool==='cuttana'?directionApplied:null});
 }catch(e){return GHAFHost._err(String(e));}
};
GHAFHost.activateVarnaWorkspace=function(encoded){
 var p=GHAFHost._parse(encoded),profile=String(p.profile||''),names={text:'Varna - Text',motion:'Varna - Motion',edit:'Varna - Edit'};if(!names[profile])return GHAFHost._err('Unknown workflow');
 var name=String(p.name||names[profile]);if(name.length>120||/[\r\n]/.test(name))return GHAFHost._err('Invalid workspace name');
 try{var command=app.findMenuCommandId(name),switched=false;if(command>0){app.executeCommand(command);switched=true;}var c=GHAFHost._activeComp();if(c&&profile!=='text')c.openInViewer();return GHAFHost._ok({profile:profile,name:name,switched:switched});}catch(e){return GHAFHost._err(String(e));}
};
GHAFHost.expressionIssues=function(){
 var c=GHAFHost._activeComp(),issues=[];if(!c)return GHAFHost._err('NO_COMP');
 function scan(group,layer,depth){if(!group||depth>12||issues.length>=25)return;for(var i=1;i<=group.numProperties;i++){var p=group.property(i);if(p.numProperties)scan(p,layer,depth+1);else try{if(p.canSetExpression&&p.expressionEnabled){p.valueAtTime(c.time,false);if(p.expressionError)issues.push({layer:layer.name,property:p.name,error:String(p.expressionError)});}}catch(e){issues.push({layer:layer.name,property:p.name,error:String(e)});}}}
 for(var j=1;j<=c.numLayers;j++)scan(c.layer(j),c.layer(j),0);return GHAFHost._ok({issues:issues});
};
GHAFHost.applyVendorValues=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');app.beginUndoGroup('Varna material');try{var l=GHAFHost._vendorTarget(c,p.target==='background'?'background':'text'),locked=l.locked;l.locked=false;try{GHAFHost._applyPersistedVendorEffects(l,[{effect:p.effect,parameters:p.parameters||[]}]);}finally{l.locked=locked;}return GHAFHost._ok({layer:l.name});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost.applyTextGlassSelection=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');app.beginUndoGroup('Varna glass text');try{var text=GHAFHost._vendorTarget(c,'text');for(var i=c.numLayers;i>=1;i--)if(c.layer(i).name===GHAFHost._nativeBgPrefix+'AE_TEXT_'+text.name){var l=c.layer(i);l.locked=false;l.remove();}text.enabled=true;GHAFHost._removeTextSolidOpacity(text);if(p.removeCosmic)GHAFHost._removeNamedEffect(text,'VARNA · Cosmic');if(p.enabled)GHAFHost._applyAEGlassText(text,{aeGlass:p.aeGlass||{}},{textSolidOpacity:p.opacity,textAEGlass:p.aeGlass||{}});return GHAFHost._ok({layer:text.name});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost._orderNewWriteOnLayers=function(c,before,direction,clip){
 var created=GHAFHost._newLayers(c,before),rows=[],slots=[];
 function onset(group,depth,min){if(!group||depth>12)return min;for(var j=1;j<=group.numProperties;j++){var p=group.property(j);if(p.numProperties)min=onset(p,depth+1,min);else try{if(p.numKeys>1)min=Math.min(min,p.keyTime(1));}catch(e){}}return min;}
 for(var i=0;i<created.length;i++){var l=created[i];if(l.matchName!=='ADBE Vector Layer'||l.guideLayer)continue;try{var tr=l.property('ADBE Transform Group'),position=tr.property('ADBE Position').value,scale=tr.property('ADBE Scale').value,anchor=tr.property('ADBE Anchor Point').value,r=l.sourceRectAtTime(Math.max(l.inPoint,l.outPoint-.001),false),time=onset(l,0,Infinity);if(!isFinite(time))continue;rows.push({layer:l,x:position[0]+(r.left+r.width/2-anchor[0])*scale[0]/100,time:time});slots.push(time);}catch(eBounds){}}
 if(rows.length<2)return false;slots.sort(function(a,b){return a-b;});if(slots[slots.length-1]-slots[0]<.001)return false;
 rows.sort(function(a,b){return direction==='rtl'?b.x-a.x:a.x-b.x;});
 for(i=0;i<rows.length;i++){l=rows[i].layer;var delta=slots[i]-rows[i].time,start=l.startTime,ip=l.inPoint,op=l.outPoint;var ni=Math.max(clip.start,ip+delta),no=Math.min(clip.end,op+delta);if(no<=ni)continue;l.startTime=start+delta;l.inPoint=ni;l.outPoint=no;}
 return true;
};

GHAFHost.scriptToolCommands=function(encoded){var p=GHAFHost._parse(encoded);try{var root=GHAFHost._ensureScriptTool(p.tool),rows=GHAFHost._scriptUITree(p.tool,root).controls,commands=[];for(var i=0;i<rows.length;i++){var r=rows[i];if(r.type==='button'||r.type==='iconbutton')commands.push({path:r.path,label:(r.context?r.context+' · ':'')+(r.label||r.text),enabled:r.enabled});}return GHAFHost._ok({commands:commands});}catch(e){return GHAFHost._err(String(e));}};
