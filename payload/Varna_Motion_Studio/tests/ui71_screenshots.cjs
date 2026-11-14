/* Same physical panel, fonts and reflow before/after the short-height fix.
   --before serves the three changed runtime entry/pilot files from 23a8f28;
   unchanged dependencies remain local. No source file is overwritten. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {launch,prepare,root}=require('./helpers/panel69.cjs');
const before=process.argv.includes('--before'),mode=before?'before':'after',out=path.resolve(root,'../docs/stage1-71');
(async()=>{const h=await launch({cep99:true});try{const context=await h.browser.newContext({deviceScaleFactor:2}),p=await context.newPage(),sources={};
for(const file of ['index.html','css/ui/pilot-b69.css','js/pilot-b69.js']){const data=before?execFileSync('git',['show','23a8f28:Varna_Motion_Studio/'+file],{cwd:root}):fs.readFileSync(path.join(root,file));sources[file]=crypto.createHash('sha256').update(data).digest('hex');if(before)await p.route('**/'+file,route=>route.fulfill({body:data,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript'}));}
await p.setViewportSize({width:125,height:200});await prepare(p,h.url,{cep99:true});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);const images=[];
for(const theme of ['light','dark']){await p.evaluate(theme=>{for(const [id,value]of [['uiTheme',theme],['uiSize44','xlarge']]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));}VarnaI18n52.set('fa');},theme);
 for(const width of [250,400,620,1400]){await p.setViewportSize({width:Math.round(width/2),height:200});for(const page of ['table','kinetic']){await p.evaluate(page=>{VarnaUI.open(page);if(page==='kinetic')VarnaStudio40.tab('scene');VarnaPilot69.sync();document.getElementById('workspace').scrollTop=0;},page);await p.waitForTimeout(250);const file=path.join(mode,theme,page+'-'+width+'-200.png');fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});await p.screenshot({path:path.join(out,file)});images.push({page,theme,width,height:400,zoom:2,size:'xlarge',language:'fa',file});}}
}
fs.writeFileSync(path.join(out,mode+'-screenshots.json'),JSON.stringify({baseline:before?'23a8f28':null,browser:await h.browser.version(),profile:h.profile,nativeCEF:false,sources,images},null,2)+'\n');console.log('Captured '+images.length+' '+mode+' screenshots: same physical dimensions, 200% reflow, 18px UI root.');await context.close();
}finally{await h.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
