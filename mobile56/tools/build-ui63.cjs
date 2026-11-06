/* Reproduce scoped runtime CSS. Keep home prototype selectors away from engine controls.
   Expanded selectors support Android 10's Chrome 74 (:is/:where are unavailable). */
const fs=require('fs'),path=require('path'),postcss=require('postcss');
const outputDir=path.resolve(__dirname,'../web'),inputDir=path.resolve(__dirname,'ui63');
for(const [input,output,scope] of [['editor.source.css','mobile.css','#editorRuntime'],['shell.source.css','shell63.css','#shell63']]){
  const root=postcss.parse(fs.readFileSync(path.join(inputDir,input),'utf8'));
  root.walkRules(rule=>{
    if(rule.parent.type==='atrule'&&/keyframes/.test(rule.parent.name))return;
    rule.selectors=rule.selectors.flatMap(selector=>{
      const s=selector.trim();
      if(scope==='#editorRuntime'){
        if(/^(html|body)$/.test(s))return scope;
        if(s.startsWith('html[')){
          const m=s.match(/^(html\[[^\]]+\])(?: body)?(.*)$/);
          return m[1]+' '+scope+m[2];
        }
        return scope+' '+s;
      }
      if(/^(body|:root)$/.test(s))return scope;
      if(s==='.view'||s==='.view.active')return scope+' > '+s;
      return ['home','projects','servers'].map(id=>scope+' #'+id+' '+s);
    });
  });
  fs.writeFileSync(path.join(outputDir,output),root.toString());
}
fs.appendFileSync(path.join(outputDir,'shell63.css'),fs.readFileSync(path.join(inputDir,'runtime.css'),'utf8'));
