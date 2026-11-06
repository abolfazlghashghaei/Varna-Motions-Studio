/* Real Android/EGL gate. Requires a debuggable APK, adb device and ffmpeg tools.
 * Fixtures and decoded pixels are inspected outside the app, not in its render path.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const WebSocket = require('ws');
const adb = process.env.ADB || '/workspace/shared/android56/platform-tools/adb';
const artifacts = process.env.GPU64_ARTIFACTS || '/workspace/artifacts/gpu64';
const run = (file,args,opts={}) => execFileSync(file,args,{timeout:60000,...opts});
const shell = (...args) => run(adb,['shell',...args],{encoding:'utf8'}).trim();
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
const ids = ['00000000-0000-0000-0000-000000000064','00000000-0000-0000-0000-000000000065'];
let socket;
(async()=>{
  fs.mkdirSync(artifacts,{recursive:true});
  assert.equal(shell('getprop','sys.boot_completed'),'1','Boot Android before running this gate');
  const patterns=[['red','drawbox=x=0:y=0:w=iw:h=60:color=yellow:t=fill'],['blue','drawbox=x=0:y=180:w=iw:h=60:color=cyan:t=fill']];
  shell('run-as','com.varnalabs.mobile','mkdir','-p','files/media');
  for(let i=0;i<patterns.length;i++){
    const file=path.join(artifacts,'fixture-'+i+'.mp4');
    run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i',`color=c=${patterns[i][0]}:s=160x240:r=24:d=1`,'-vf',patterns[i][1],'-an','-c:v','libx264','-pix_fmt','yuv420p',file]);
    run(adb,['push',file,'/data/local/tmp/gpu64-'+i+'.mp4']);
    shell('run-as','com.varnalabs.mobile','cp','/data/local/tmp/gpu64-'+i+'.mp4','files/media/'+ids[i]);
  }
  shell('am','start','-W','-n','com.varnalabs.mobile/.MainActivity');
  let pid,unix;
  for(let i=0;i<80;i++){
    try { pid=shell('pidof','com.varnalabs.mobile'); } catch(error) { if(error.status!==1)throw error; pid=''; }
    unix=shell('cat','/proc/net/unix');
    if(pid&&unix.includes('@webview_devtools_remote_'+pid))break;
    await delay(500);
  }
  assert(pid&&unix.includes('@webview_devtools_remote_'+pid),'No debug WebView socket');
  run(adb,['forward','tcp:9259','localabstract:webview_devtools_remote_'+pid]);
  const targets=await(await fetch('http://127.0.0.1:9259/json')).json();
  assert(targets.length>0);
  socket=new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
  let id=0;const pending=new Map();
  socket.on('message',raw=>{const m=JSON.parse(raw);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}});
  async function evaluate(expression){
    let timer;
    const result=await Promise.race([
      new Promise(resolve=>{const n=++id;pending.set(n,resolve);socket.send(JSON.stringify({id:n,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}));}),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Native GPU gate test timeout')),180000);})
    ]).finally(()=>clearTimeout(timer));
    if(result.error||result.result.exceptionDetails)throw Error(JSON.stringify(result.error||result.result.exceptionDetails));
    return result.result.result.value;
  }
  for(let i=0;i<120;i++){
    if(await evaluate('!!(window.MobileApp && MobileApp.ready)'))break;
    await delay(500);
  }
  assert.equal(await evaluate('typeof MobileNative.gpuGate64'),'function');
  await evaluate('MobileShell63.show("editor"); MobileApp.pause();');
  async function gate(scene,cancel=false){
    const request='gpu64-'+Date.now();
    return evaluate(`new Promise(function(resolve){var old=window.MobileReply,cancelTimer;window.MobileReply=function(id,value,error){if(id===${JSON.stringify(request)}){window.MobileReply=old;clearInterval(cancelTimer);resolve({value:value,error:error});}else if(old)old(id,value,error);};MobileNative.gpuGate64(${JSON.stringify(request)},${JSON.stringify(JSON.stringify(scene))});${cancel?'cancelTimer=setInterval(function(){if(MobileNative.gpuGateState64()==="rendering"){clearInterval(cancelTimer);MobileNative.cancelGpuGate64();}},10);':''}})`);
  }
  const scene={width:320,height:240,fps:24,frames:6,clips:[{mediaId:ids[0],rect:[0,0,.5,1]},{mediaId:ids[1],rect:[.5,0,.5,1]}]};
  console.log('Native GPU64: encode two independent video sources through EGL surfaces...');
  const output=await gate(scene);
  assert.equal(output.error,null,output.error);
  assert.equal(output.value.frames,6);assert.equal(output.value.layers,2);assert.equal(output.value.cpuReadbacks,0);assert.match(output.value.glesVersion,/OpenGL ES 3/);
  const file=path.join(artifacts,'Gpu64-two-layer.mp4');
  fs.writeFileSync(file,run(adb,['exec-out','run-as','com.varnalabs.mobile','cat','files/exports/'+output.value.file]));
  const probe=JSON.parse(run('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,nb_read_frames,r_frame_rate,color_space,color_transfer,color_primaries:format=duration','-of','json',file],{encoding:'utf8'}));
  const stream=probe.streams[0];
  assert.equal(stream.codec_name,'h264');assert.equal(stream.width,320);assert.equal(stream.height,240);assert.equal(+stream.nb_read_frames,6);assert.equal(stream.color_space,'smpte170m');
  assert(Math.abs(+probe.format.duration-.25)<.02);
  const rgb=run('ffmpeg',['-v','error','-i',file,'-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:2*1024*1024});
  function pixel(frame,x,y){const n=(frame*320*240+y*320+x)*3;return [...rgb.subarray(n,n+3)];}
  const samples={topLeft:pixel(0,80,30),middleLeft:pixel(0,80,120),topRight:pixel(0,240,30),bottomRight:pixel(0,240,210)};
  const near=(actual,expected)=>actual.every((v,i)=>Math.abs(v-expected[i])<15);
  for(const frame of [0,5]){
    assert(near(pixel(frame,80,30),[255,255,0]),'Left top/orientation: '+pixel(frame,80,30));
    assert(near(pixel(frame,80,120),[255,0,0]),'Left source missing: '+pixel(frame,80,120));
    assert(near(pixel(frame,240,30),[0,0,255]),'Right source missing: '+pixel(frame,240,30));
    assert(near(pixel(frame,240,210),[0,255,255]),'Right bottom/orientation: '+pixel(frame,240,210));
  }
  const invalid=await gate({...scene,width:321});assert.match(invalid.error,/Gate supports/);
  const missing=await gate({...scene,clips:[{mediaId:'ffffffff-ffff-ffff-ffff-ffffffffffff',rect:[0,0,1,1]}]});assert.match(missing.error,/Media missing/);
  const beforeCancel=shell('run-as','com.varnalabs.mobile','ls','files/exports');
  const cancelled=await gate({...scene,frames:240},true);assert.match(cancelled.error,/cancelled/i);
  assert.equal(shell('run-as','com.varnalabs.mobile','ls','files/exports'),beforeCancel,'Cancelled output was published or left behind');
  const repeat=await gate({...scene,frames:2});assert.equal(repeat.error,null,repeat.error);assert.equal(repeat.value.frames,2);
  const report={executionEnvironment:{androidApi:shell('getprop','ro.build.version.sdk'),device:shell('getprop','ro.product.model'),hardware:shell('getprop','ro.hardware'),benchmark:false},gate:output.value,probe,samples,validation:{invalidScene:true,missingMedia:true,cancellationDuringRender:true,cancelledFileRemoved:true,repeatedJob:true},limitations:['video-only debug gate','no production timeline integration','production BT.709 color conversion pending','no audio sync or Honor 90 benchmark']};
  fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('PASS native GPU64: 2 real video textures, preview and encoder EGL surfaces, 6 H.264 frames, orientation/color pixels, invalid scene, missing media, cancel and repeat. Not full phase 1.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{if(socket)socket.close();});
