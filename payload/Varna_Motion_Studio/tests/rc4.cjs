const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const ctx={window:{},globalThis:{},console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/corrections.js'),'utf8'),ctx);const C=ctx.window.VarnaCorrections||ctx.VarnaCorrections;
// Legacy dangerous rules from older releases must become manual-only automatically.
let legacy=C.database({items:[{wrong:'و',right:'9'},{wrong:'بوش',right:'Bosch Pro 5'},{wrong:'منصوعي',right:'مصنوعی'}]});
assert.equal(C.applyText('و بوش منصوعي',legacy).text,'و بوش منصوعي');
assert(legacy.items.find(x=>x.wrongKey==='و').autoApply===false);
assert(legacy.items.find(x=>x.wrongKey==='بوش').autoApply===false);
// Contextual expansion is allowed when the surrounding phrase is explicit.
let db=C.learn({},[{wrong:'گفتم بوش کار',right:'گفتم Bosch Pro 5 کار',mode:'context',autoApply:true}]);
assert.equal(C.applyText('اینجا بوش هست',db).text,'اینجا بوش هست');
assert.equal(C.applyText('گفتم بوش کار خوبه',db).text,'گفتم Bosch Pro 5 کار خوبه');
// Common short tokens can still be retained in memory, but never auto-applied when marked manual.
db=C.learn(db,[{wrong:'و',right:'9',mode:'token',autoApply:false}]);
assert.equal(C.applyText('و گفتم بوش کار',db).text,'و گفتم Bosch Pro 5 کار');
const bridge=fs.readFileSync(path.join(root,'js/cep-bridge.js'),'utf8');
assert(!bridge.includes("if(api.blocked&&method!='capabilities'"));
assert(bridge.includes('api.reconnect=async function'));
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
assert(app.includes('window.VarnaOutput35.build'));
assert(!app.includes('function outputBatchSize(groups)'));
assert(app.includes("mode:anchors>=2?'context':'manual',autoApply:anchors>=2&&C.safeAuto(cw,cr,'context'),canonical:r"));
const host=fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8');
assert(host.includes("recovered:true,mode:'safe-text'"));
assert(/version:'4\.5\.0-rc\.(?:[6-9]|[1-9]\d+)'/.test(host));
console.log('PASS RC4: self-healing host, long-output batching/fallback, safe contextual correction memory');
