/* Installs only the explicitly requested, verified original CEP bundle.
   No vendor script, binary, PowerShell file or activation code is executed. */
(function(w){'use strict';
function create(req,options={}){
 const fs=req('fs'),path=req('path'),crypto=req('crypto'),os=req('os'),runtime=req('process');
 const destination=options.destination||(runtime.platform==='win32'?runtime.env.APPDATA?path.join(runtime.env.APPDATA,'Adobe','CEP','extensions','com.amanow.tools'):null:path.join(os.homedir(),'Library','Application Support','Adobe','CEP','extensions','com.amanow.tools'));
 function relative(value){if(typeof value!=='string'||!value||/[\x00-\x1f:]/.test(value)||path.isAbsolute(value)||value.replace(/\\/g,'/').split('/').some(p=>p==='..'||!p))throw Error('Unsafe library path');return value.replace(/\\/g,'/');}
 async function digest(file){return new Promise((resolve,reject)=>{const hash=crypto.createHash('sha256'),stream=fs.createReadStream(file);stream.on('data',data=>hash.update(data));stream.on('error',reject);stream.on('end',()=>resolve(hash.digest('hex')));});}
 async function checked(root,entry){
  const name=relative(entry.path),parts=name.split('/');let file=root;
  for(const part of parts){file=path.join(file,part);const stat=await fs.promises.lstat(file);if(stat.isSymbolicLink())throw Error('Library links are not installed');}
  const stat=await fs.promises.stat(file);if(!stat.isFile()||stat.size!==entry.bytes||await digest(file)!==entry.sha256)throw Error('Library checksum mismatch: '+name);return file;
 }
 async function registry(root){const stat=await fs.promises.lstat(root);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Choose a real library folder');const manifest=path.join(root,'USER_LIBRARY81.json');if((await fs.promises.lstat(manifest)).isSymbolicLink())throw Error('Manifest links are not accepted');const data=JSON.parse(await fs.promises.readFile(manifest,'utf8'));if(data.format!=='varna-private-library'||data.version!==1||!Array.isArray(data.files))throw Error('Unsupported private library');const seen=new Set();for(const e of data.files){const p=relative(e.path),key=p.toLowerCase();if(seen.has(key)||!Number.isSafeInteger(e.bytes)||e.bytes<0||!/^[a-f0-9]{64}$/.test(e.sha256))throw Error('Invalid library manifest');seen.add(key);}return data;}
 async function installAtools(root,progress=()=>{}){
  if(!destination)throw Error('User application-data folder is unavailable');
  const manifest=await registry(root),entries=manifest.files.filter(e=>e.path.startsWith('atools-2.106/'));
  if(!entries.length)throw Error('AmanowTools is not included in this private library');
  const xml=entries.find(e=>e.path==='atools-2.106/CSXS/manifest.xml');if(!xml)throw Error('Missing CEP manifest');
  const sourceManifest=await checked(root,xml),sourceText=await fs.promises.readFile(sourceManifest,'utf8');
  if(!/ExtensionBundleId="com\.amanow\.tools"/.test(sourceText)||!/ExtensionBundleVersion="2\.106"/.test(sourceText))throw Error('Unexpected AmanowTools bundle identity');
  try{const exists=await fs.promises.lstat(destination);if(exists.isSymbolicLink()||!exists.isDirectory())throw Error('Existing tool path is not a regular folder');const current=await fs.promises.readFile(path.join(destination,'CSXS','manifest.xml'),'utf8');if(!/ExtensionBundleId="com\.amanow\.tools"/.test(current))throw Error('Another extension owns this folder');return {installed:false,existing:true,destination,version:(current.match(/ExtensionBundleVersion="([^"]+)"/)||[])[1]||'unknown'};}catch(error){if(error.code!=='ENOENT')throw error;}
  const parent=path.dirname(destination);await fs.promises.mkdir(parent,{recursive:true});const stage=await fs.promises.mkdtemp(path.join(parent,'.varna-atools81-'));let published=false,bytes=0;
  const total=entries.reduce((n,e)=>n+e.bytes,0),started=Date.now();
  try{
   for(let i=0;i<entries.length;i++){
    const e=entries[i],source=await checked(root,e),local=e.path.slice('atools-2.106/'.length),target=path.join(stage,relative(local));await fs.promises.mkdir(path.dirname(target),{recursive:true});await fs.promises.copyFile(source,target);
    if(await digest(target)!==e.sha256)throw Error('Copied tool checksum mismatch');bytes+=e.bytes;progress({files:i+1,totalFiles:entries.length,bytes,totalBytes:total,bytesPerSecond:bytes/Math.max(.001,(Date.now()-started)/1000)});
   }
   await fs.promises.writeFile(path.join(stage,'.varna-library81-install.json'),JSON.stringify({owner:'VarnaLibrary81',bundle:'com.amanow.tools',version:'2.106',files:entries},null,2));
   try{await fs.promises.lstat(destination);throw Error('Tool destination appeared during installation; nothing was replaced');}catch(error){if(error.code!=='ENOENT')throw error;}
   await fs.promises.rename(stage,destination);published=true;return {installed:true,destination,files:entries.length,bytes,restartAdobe:true};
  }finally{if(!published){if(fs.promises.rm)await fs.promises.rm(stage,{recursive:true,force:true});else await fs.promises.rmdir(stage,{recursive:true});}}
 }
 return {installAtools,registry};
}
if(typeof module==='object'&&module.exports)module.exports={create:options=>create(require,options)};
if(w)w.VarnaUserLibraryInstaller81=w.require?create(w.require):null;
})(typeof window==='undefined'?null:window);
