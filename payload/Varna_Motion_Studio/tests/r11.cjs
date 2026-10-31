const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),app=read('js/app.js'),host=read('host/ghaf_host.jsx'),table=read('js/table-designer.js'),css=read('css/varna-ui.css');
assert(html.includes('4.3 R11 · VarnaLabs'));
// Optical liquid glass: actual two colors, draggable handles, ramp, refraction, specular/depth.
for(const id of ['bgGradientColor2','bgGradientHandleA','bgGradientHandleB','bgRimColor1','bgRimColor2','bgLensing','bgEdgeWave'])assert(html.includes(`id="${id}"`),id+' missing');
assert(app.includes('function bindGradientHandles()')&&app.includes('gradientX1')&&app.includes('gradientX2'));
for(const token of ['ADBE Ramp','ADBE Turbulent Displace','ADBE Bevel Alpha','VARNA R11 Specular','VARNA R11 Two Tint'])assert(host.includes(token),token+' missing');
assert(host.includes('GHAFHost._applyBgMarkerMotion')&&host.includes("thisLayer.parent.marker"),'background marker sync missing');
// Full OUT parity is generated from every visible IN card, with reverse preview and marker-driven runtime.
const intro=[...html.matchAll(/data-preset="([^"]+)"/g)].map(m=>m[1]);assert(intro.length>=45,'intro library unexpectedly small');
assert(app.includes("b.dataset.outPreset='mirror:'+p")&&app.includes('is-outro-preview'));
assert(host.includes("kind.indexOf('mirror:')===0")&&host.includes('GHAFHost._applyNativeOutroAnimator')&&host.includes('GHAFHost._isMarkerTransformPreset'));
// Table: clean one-column workflow, outer corner semantics, optical material controls and host payload.
assert(css.includes('.r8-table-layout{grid-template-columns:1fr!important'));
for(const id of ['tableGlassTint2','tableGlassAngle','tableGlassBalance','tableGlassRim1','tableGlassRim2','tableGlassLensing'])assert(html.includes(`id="${id}"`),id+' missing');
assert(table.includes("roundMode:q('tableRoundMode')?.value||'outerCorners'")&&table.includes('glassTint2:st.glassTint2'));
assert(host.includes("leftCell=direction==='rtl'?(j+cs===nc):(j===0)")&&host.includes("rightCell=direction==='rtl'?(j===0):(j+cs===nc)"));
// Color selector uses native browser/CEP control; no click hijack.
assert(!app.includes("await host('pickColor')"));
console.log('PASS R11 optical liquid glass, table recovery, full IN/OUT parity and marker sync');
