const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {create}=require('../js/user-library81-install.js');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'varna-library81-')),root=path.join(temp,'source'),dest=path.join(temp,'extensions','com.amanow.tools');
function entry(name,text){const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);return {path:name,bytes:Buffer.byteLength(text),sha256:crypto.createHash('sha256').update(text).digest('hex')};}
const files=[entry('atools-2.106/CSXS/manifest.xml','<ExtensionManifest ExtensionBundleId="com.amanow.tools" ExtensionBundleVersion="2.106"/>'),entry('atools-2.106/js/main.js','throw new Error("A vendor script must not execute during copying");')];
const manifest={format:'varna-private-library',version:1,files};
function save(value=manifest){fs.writeFileSync(path.join(root,'USER_LIBRARY81.json'),JSON.stringify(value));}
save();
(async()=>{try{
 const progress=[],api=create({destination:dest});const result=await api.installAtools(root,p=>progress.push(p));assert(result.installed);assert(result.restartAdobe);assert.equal(result.files,2);assert.equal(progress.at(-1).bytes,files.reduce((n,f)=>n+f.bytes,0));
 assert.equal(fs.readFileSync(path.join(dest,'js/main.js'),'utf8'),'throw new Error("A vendor script must not execute during copying");');
 const existing=await api.installAtools(root);assert(existing.existing&&!existing.installed);assert.equal(existing.version,'2.106');
 const untouched=path.join(temp,'foreign');fs.mkdirSync(path.join(untouched,'CSXS'),{recursive:true});fs.writeFileSync(path.join(untouched,'CSXS/manifest.xml'),'<ExtensionManifest ExtensionBundleId="another.owner"/>');await assert.rejects(create({destination:untouched}).installAtools(root),/Another extension/);assert(fs.readFileSync(path.join(untouched,'CSXS/manifest.xml'),'utf8').includes('another.owner'));
 const clean=path.join(temp,'clean');save({...manifest,files:[...files,{...files[1],path:'atools-2.106/../../escape'}]});await assert.rejects(create({destination:clean}).installAtools(root),/Unsafe/);assert(!fs.existsSync(clean));
 save({...manifest,files:[...files,{...files[1],path:'ATools-2.106/js/main.js'}]});await assert.rejects(create({destination:clean}).installAtools(root),/Invalid library/);save();
 const original=fs.readFileSync(path.join(root,files[1].path));fs.appendFileSync(path.join(root,files[1].path),'tampered');await assert.rejects(create({destination:clean}).installAtools(root),/checksum/);assert(!fs.existsSync(clean));assert(!fs.readdirSync(temp).some(n=>n.startsWith('.varna-atools81-')));fs.writeFileSync(path.join(root,files[1].path),original);
 const file=path.join(root,files[1].path),outside=path.join(temp,'outside');fs.writeFileSync(outside,original);fs.unlinkSync(file);fs.symlinkSync(outside,file);await assert.rejects(create({destination:clean}).installAtools(root),/links/);assert(!fs.existsSync(clean));fs.unlinkSync(file);fs.writeFileSync(file,original);
 const restored=await create({destination:clean}).installAtools(root);assert(restored.installed);assert.equal(fs.readFileSync(path.join(clean,'js/main.js'),'utf8'),original.toString());
 console.log('PASS UI81 private installer: checksums, progress, atomic publish, existing-owner preservation, bad paths/duplicate case/tampering/symlink rejection, no vendor execution and successful retry. Native Windows CEP registration remains untested.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1});
