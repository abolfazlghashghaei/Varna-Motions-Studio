// Reproducible screenshots of production controls. The bridge is explicitly mocked.
const fs=require('node:fs'),path=require('node:path');
const {launch,prepare,root}=require('./helpers/panel69.cjs');
(async()=>{const h=await launch(),images=[];try{const p=await h.browser.newPage({viewport:{width:620,height:900}});await prepare(p,h.url);
 const out=path.resolve(root,'../docs/ui77/gallery');fs.mkdirSync(out,{recursive:true});
 const names=await p.evaluate(()=>VarnaFlow77.pages);
 for(const theme of ['dark','light']){
  await p.evaluate(theme=>{const s=document.getElementById('uiTheme');s.value=theme;s.dispatchEvent(new Event('change',{bubbles:true}));},theme);
  for(const width of [250,400,620,1400]){await p.setViewportSize({width,height:900});
   for(const name of names){await p.evaluate(name=>VarnaUI.open(name),name);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const file=`after-${name}-${width}-${theme}.png`;await p.screenshot({path:path.join(out,file)});images.push({file,name,width,height:900,theme,language:'fa',profile:h.profile});
   }
  }
 }
 await p.setViewportSize({width:620,height:900});await p.evaluate(()=>VarnaUI.open('home'));
 for(const theme of ['dark','light']){await p.evaluate(theme=>{const s=document.getElementById('uiTheme');s.value=theme;s.dispatchEvent(new Event('change',{bubbles:true}));},theme);
  for(const name of ['original','ocean','mint','ember','noir','rose']){await p.evaluate(name=>{const s=document.getElementById('themePreset50');s.value=name;s.dispatchEvent(new Event('change',{bubbles:true}));},name);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const file=`palette-${name}-${theme}.png`;await p.screenshot({path:path.join(out,file)});images.push({file,name,width:620,height:900,theme,language:'fa',profile:h.profile});
  }
 }
 fs.writeFileSync(path.resolve(root,'../docs/ui77/screenshots.json'),JSON.stringify({browser:h.browser.version(),images,nativeAdobe:false},null,2)+'\n');
 console.log('Captured '+images.length+' UI77 screenshots (176 page views and 12 palettes).');
}finally{await h.close()}})().catch(e=>{console.error(e);process.exitCode=1});
