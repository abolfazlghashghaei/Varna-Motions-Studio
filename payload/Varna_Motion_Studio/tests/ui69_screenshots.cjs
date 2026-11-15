/* Reproducible UI evidence, not an assertion of native AE rendering.
   --before serves the six changed entry/controller files from the committed A baseline.
   All other files are unchanged dependencies. It never rewrites the working tree. */
const fs=require('node:fs'),path=require('node:path');const {launch,prepare,root}=require('./helpers/panel69.cjs');
const before=process.argv.includes('--before'),out=path.resolve(root,'../docs/ui-b69'),mode=before?'before':'after';
(async()=>{const h=await launch(before?{baseline:'b350500'}:{});try{const p=await h.browser.newPage({viewport:{width:620,height:700},deviceScaleFactor:1});await prepare(p,h.url);const manifest=[];
for(const language of ['fa','en'])for(const theme of ['dark','light']){
 await p.evaluate(({language,theme})=>{VarnaI18n52.set(language);const t=document.querySelector('#uiTheme');t.value=theme;t.dispatchEvent(new Event('change',{bubbles:true}));},{language,theme});
 for(const width of [250,400,620,1400]){await p.setViewportSize({width,height:700});for(const name of ['table','kinetic']){
  await p.evaluate(name=>{VarnaUI.open(name);if(name==='kinetic')VarnaStudio40.tab('scene');if(window.VarnaPilot69){VarnaPilot69.sync();for(const d of document.querySelectorAll('.page.active details'))d.open=d.dataset.defaultOpen69==='true';document.querySelectorAll('.page.active .mini-preview-toggle').forEach(d=>d.open=true);VarnaPilot69.preview[name].open=document.querySelector('.app-shell').dataset.panelBand69!=='compact';}document.querySelector('#workspace').scrollTop=0;},name);
  await p.waitForTimeout(250);const file=path.join(mode,language,theme,name+'-'+width+'.png');fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});await p.screenshot({path:path.join(out,file)});manifest.push({page:name,language,theme,width,height:700,scale:1,file});
 }}
}
fs.writeFileSync(path.join(out,'screenshots-'+mode+'.json'),JSON.stringify({baseline:before?'b350500':null,native:'Not exercised',screenshots:manifest},null,2)+'\n');console.log('Captured '+manifest.length+' '+mode+' screenshots');
}finally{await h.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
