const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),table=read('js/table-designer.js'),app=read('js/app.js'),host=read('host/ghaf_host.jsx'),css=read('css/varna-ui.css');
assert(!html.includes('tableColsEditor')&&!html.includes('tableRowsEditor'),'legacy numeric row/col weight editors must be gone');
assert(!html.includes('color-pick')&&!app.includes("'.color-pick'")&&!app.includes('".color-pick"'),'duplicate eyedropper action must be gone');
for(const id of ['tableStartRange','tableEndRange','tableRangeFill','tableStartLabel','tableEndLabel','tableRangeSummary'])assert(html.includes(`id="${id}"`),`missing ${id}`);
assert(table.includes("const physicalCols=tableDirection()==='rtl'?[...model.cols].reverse():model.cols"),'RTL preview/editor physical columns must reverse');
assert(!table.includes("*(rtl ? -1 : 1)")&&!table.includes("*(rtl?-1:1)"),'RTL mouse delta must not be inverted');
assert(table.includes("q('tableStartRange')?.addEventListener('input'")&&table.includes("q('tableEndRange')?.addEventListener('input'"),'dual-range timing listeners missing');
assert(html.includes('value="outerCorners"')&&html.includes('فقط ۴ گوشه بیرونی جدول'),'outer-corner semantics missing');
assert(host.includes("leftCell=direction==='rtl'?(j+cs===nc):(j===0)")&&host.includes("rightCell=direction==='rtl'?(j===0):(j+cs===nc)"),'host physical RTL corner mapping missing');
assert(host.includes('GHAFHost._varnaCellShape')&&host.includes("mode!=='outerCorners'"),'custom outer-corner path missing');
for(const preset of ['acSmoothRise','acSoftSlide','acScaleEase','acElasticSoft','acBlurFloat','acTrackingFlow','acWordCascade','acLineSweep']){assert(html.includes(`data-preset="${preset}"`),`missing composer preset ${preset}`);assert(host.includes(preset),`host missing ${preset}`);}
assert(html.includes('motion-phase-tabs')&&html.includes('data-motion-phase="intro"')&&html.includes('data-motion-phase="outro"'),'IN/OUT phase UI missing');
assert(app.includes('function buildOutroLibrary()')&&app.includes("b.dataset.outPreset='mirror:'+p"),'full IN/OUT parity builder missing');
assert(host.includes('GHAFHost._addAnimMarkers')&&host.includes('VARNA IN')&&host.includes('VARNA OUT'),'IN/OUT AE markers missing');
assert(host.includes("sync!=='separate'")&&host.includes('bg.motionDur=')&&host.includes('bg.outDur='),'text/background timing sync missing');
assert(app.includes('function ensureBundledSfx()')&&app.includes("assets/sfx/misterhorse"),'bundled SFX auto-registration missing');
assert(css.includes('R8 Product System'),'R8 design system override missing');
const manifest=JSON.parse(read('assets/packs/animation-composer/manifest.json'));
assert.equal(manifest.counts.items_2_mhcitem+manifest.counts.items_3_mhcitem,818,'unexpected .mhcitem count');
assert.equal(manifest.counts.items_2_preview+manifest.counts.items_3_preview,818,'unexpected preview count');
function countExt(dir,ext){let n=0;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())n+=countExt(p,ext);else if(e.name.toLowerCase().endsWith(ext))n++;}return n;}
assert.equal(countExt(path.join(root,'assets/sfx/misterhorse'),'.wav'),66,'expected 66 user supplied SFX WAV files');
console.log('PASS R8 table repair, native color flow, composer-style IN/OUT + markers, bundled user assets, R8 product system');
