/* Native audio mix: the source composition remains intact; only an owned staging comp/queue item is removed. */
GHAFHost.getCompositionSource=function(encoded){try{var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)throw Error('ابتدا Composition را فعال کن.');if(c.hasAudio===false)throw Error('کامپوزیشن فعال صدا ندارد.');var start=p.range==='workArea'?Math.max(0,c.workAreaStart):0,end=p.range==='workArea'?Math.min(c.duration,start+c.workAreaDuration):c.duration;if(end<=start)throw Error('محدودهٔ صوتی کامپوزیشن خالی است.');return GHAFHost._ok({kind:'composition',comp:c.name,compId:c.id,compWidth:c.width,compHeight:c.height,compDuration:c.duration,frameRate:c.frameRate,layer:c.name,layerType:'composition',range:p.range==='workArea'?'workArea':'full',path:'',compIn:start,compOut:end,sourceStart:0,sourceDuration:end-start,stretch:100});}catch(e){return GHAFHost._err(String(e));}};
GHAFHost.renderCompositionAudio=function(encoded){
 var p=GHAFHost._parse(encoded),rq=app.project.renderQueue,c=null,stage=null,item=null,old=[],folder=null,result=null,error=null,i;
 try{
  if(rq.rendering)throw Error('صف رندر در حال اجراست؛ پس از پایان آن تحلیل صدا را اجرا کن.');
  for(i=1;i<=app.project.numItems;i++){var it=app.project.item(i);if(it instanceof CompItem&&it.id===Number(p.compId)){c=it;break;}}
  if(!c)throw Error('کامپوزیشن منبع دیگر وجود ندارد؛ منبع را دوباره بخوان.');if(c.hasAudio===false)throw Error('کامپوزیشن صدا ندارد.');
  var start=p.range==='workArea'?Math.max(0,c.workAreaStart):0,end=p.range==='workArea'?Math.min(c.duration,start+c.workAreaDuration):c.duration;if(end<=start)throw Error('محدودهٔ تحلیل خالی است.');
  folder=new Folder(String(p.folder||''));if(!p.folder||!folder.exists)throw Error('پوشهٔ موقت صدا آماده نیست.');
  // A tiny staging picture avoids rendering the video. Audio is evaluated by AE, including nested comps, audio effects, solo/mute and time mapping.
  stage=app.project.items.addComp('__VARNA_AUDIO_MIX_'+new Date().getTime(),4,4,1,c.duration,c.frameRate);var sourceLayer=stage.layers.add(c);sourceLayer.startTime=0;sourceLayer.inPoint=0;sourceLayer.outPoint=c.duration;sourceLayer.audioEnabled=true;sourceLayer.enabled=false;
  for(i=1;i<=rq.numItems;i++){var q=rq.item(i);if(q.render){old.push(q);q.render=false;}}
  item=rq.items.add(stage);item.timeSpanStart=start;item.timeSpanDuration=end-start;
  var templates=item.outputModule(1).templates||[],chosen='',priority=[/\bwave?\b|\.wav\b/i,/aiff/i,/audio.*only|only.*audio/i,/lossless|無損|بدون.*افت/i];
  for(var k=0;k<priority.length&&!chosen;k++)for(i=0;i<templates.length;i++)if(priority[k].test(String(templates[i]))){chosen=String(templates[i]);break;}
  if(chosen)item.outputModule(1).applyTemplate(chosen);
  var om=item.outputModule(1),settings=om.getSettings(GetSettingsFormat.STRING_SETTABLE),audioKey=null;
  for(var key in settings)if(/^(output audio|audio output)$/i.test(key))audioKey=key;
  if(audioKey){var audioSettings={};audioSettings[audioKey]='On';om.setSettings(audioSettings);om=item.outputModule(1);}
  var actual=om.getSettings(GetSettingsFormat.STRING),format=String(actual.Format||''),audioState=String(actual[audioKey||'Output Audio']||actual['Audio Output']||'');
  if(/^(off|false|0)$/i.test(audioState))throw Error('Audio Output قالب رندر خاموش است. یک قالب Audio Only / WAV / AIFF با صدای روشن در Output Module ذخیره کن.');
  var audioOnly=/wav|wave|aiff|audio.*only/i.test(format+' '+chosen),movie=/avi|quicktime|mov|mxf/i.test(format+' '+chosen);
  if(!audioOnly&&!movie)throw Error('قالب خروجی صدا در این نصب آماده نیست. در Render Queue یک Output Module با فرمت WAV یا AIFF و صدای روشن ذخیره کن؛ سپس دوباره اجرا کن.');
  var extension=/aiff/i.test(format+' '+chosen)?'.aif':/wav|wave/i.test(format+' '+chosen)?'.wav':/avi/i.test(format)?'.avi':'.mov';
  om.file=new File(folder.fsName+'/composition_mix'+extension);item.render=true;rq.render();
  if(item.status!==RQItemStatus.DONE)throw Error('رندر صدای کامپوزیشن کامل نشد یا لغو شد.');
  var rendered=item.outputModule(1).file;if(!rendered||!rendered.exists||rendered.length<=44)throw Error('فایل صدای کامپوزیشن تولید نشد.');
  result={kind:'composition',comp:c.name,compId:c.id,compWidth:c.width,compHeight:c.height,compDuration:c.duration,frameRate:c.frameRate,layer:c.name,layerType:'composition',path:rendered.fsName,compIn:start,compOut:end,sourceStart:0,sourceDuration:end-start,stretch:100,range:p.range||'full',temporary:true,template:chosen||format};
 }catch(e){error=String(e);}finally{
  if(item)try{item.remove();}catch(cleanItem){}if(stage)try{stage.remove();}catch(cleanComp){}
  for(i=0;i<old.length;i++)try{old[i].render=true;}catch(restoreQueue){}
  if(c)try{c.openInViewer();}catch(viewer){}
 }
 return error?GHAFHost._err(error):GHAFHost._ok(result);
};
