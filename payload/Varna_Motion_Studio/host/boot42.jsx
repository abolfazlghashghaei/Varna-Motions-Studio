/* The manifest preloads definitions only. Heavy host loading is caught by CEP. */
var VarnaBoot42={revision:'rc42.1',lastError:null};
VarnaBoot42.load=function(path){
 var previous=typeof GHAFHost!=='undefined'?GHAFHost:null,required=['ping','capabilities','getProjectLocation','getSelectionInfo','getTimelineInfo','buildOutput','checkOutput','removeLivePreview','updateLivePreview','beginOutputSession','commitOutputSession','abortOutputSession','getOutputSession41','renderCompositionAudio'],i;
 if(previous&&previous._bridgeRevision==='rc42.1'&&previous._bootReady42===true&&typeof previous.dispatch==='function')return previous;
 try{
  GHAFHost={};if(previous){var carry=['_aeSessionId','_lastComp36','_sourceTemplates38','_templateDestination38','_kineticDestination40'];for(i=0;i<carry.length;i++)if(previous[carry[i]]!=null)GHAFHost[carry[i]]=previous[carry[i]];}
  $.evalFile(new File(path));
  if(typeof GHAFHost==='undefined'||GHAFHost._bridgeRevision!=='rc42.1'||GHAFHost._bootReady42!==true||typeof GHAFHost.dispatch!=='function')throw Error('HOST_INITIALIZATION_INCOMPLETE');
  for(i=0;i<required.length;i++)if(typeof GHAFHost[required[i]]!=='function')throw Error('HOST_METHOD_NOT_READY: '+required[i]);
  GHAFHost._filePath=new File(path).fsName;VarnaBoot42.lastError=null;return GHAFHost;
 }catch(e){VarnaBoot42.lastError={message:String(e),line:e.line||null,file:e.fileName||String(path)};GHAFHost=previous||{};throw e;}
};
