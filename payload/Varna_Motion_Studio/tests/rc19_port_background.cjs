const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../js/music-engine.js');
(async()=>{
 const checked=[];
 assert.equal(await M.selectLaunchPort(async port=>{checked.push(port);return port===17863;}),'17863');
 assert.deepEqual(checked,[17862,17863]);
 await assert.rejects(()=>M.selectLaunchPort(async()=>false),/17862 تا 17869/);
 const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'css/standardization-ui.css'),'utf8');
 assert(html.includes('id="bgModelHead"')&&html.includes('<option value="aeGlass">AE Glass</option>'));
 assert(html.includes('id="bgStyleGallery"')&&html.includes('id="aeGlassControls"'));
 assert(css.includes('body #page-bg .page-head{display:flex!important;')&&css.includes('body #page-bg #bgStyleGallery{display:grid!important;'));
 console.log('PASS RC19: occupied port fallback and visible AE background selection');
})().catch(e=>{console.error(e);process.exitCode=1;});
