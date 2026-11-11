// The same strict oracle as the accepted pilot, extended to all 22 live pages.
// Device scale AND CSS viewport reflow are tested. This is not native Windows DPI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {launch, prepare, measure, root} = require('./helpers/panel69.cjs');
for (const file of ['css/ui/flow77.css','css/ui/pilot-b69.css']) {
  const stats={}; require('./helpers/cep70-profile.cjs').transform(fs.readFileSync(path.join(root,file),'utf8'),stats,file);
  assert.equal(stats.rules,0,file+': owned layout must not depend on post-99 rules');
  assert.equal(stats.declarations,0,file+': owned layout must not depend on post-99 declarations');
}
const quick = process.env.UI77_QUICK === '1';
const scales = process.env.UI77_SCALE ? [Number(process.env.UI77_SCALE)] : quick ? [1] : [1, 1.25, 1.5, 2];
const widths = quick ? [250, 400, 620, 1400] : [250, 320, 400, 620, 900, 1400];
const heights = quick ? [400] : [400, 700, 1000];
const output = process.env.UI77_REPORT || path.resolve(root, '../docs/ui77/layout.json');
const source = () => Object.fromEntries(['index.html','js/flow77.js','css/ui/flow77.css','js/pilot-b69.js','css/ui/pilot-b69.css','js/production47.js','js/studio40.js','js/production50.js','js/liquid48.js'].map(file => [file,require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
(async () => {
  const h = await launch();
  const report = {profile:h.profile, browser:h.browser.version(), quick, scales, widths, heights, cases:0, failures:[], failureCount:0, errors:[], minContentRatio:1,source:source()};
  try {
    const baseline = JSON.parse(fs.readFileSync(path.resolve(root, '../docs/ux-audit68/source-inventory.json')));
    for (const entry of ['index', 'premiere', 'resolve']) {
      const html = fs.readFileSync(path.join(root, entry + '.html'), 'utf8');
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
      assert.deepEqual(ids.sort(), baseline[entry].ids, entry + ': original 899 IDs');
    }
    for (const scale of scales) {
      const context = await h.browser.newContext({deviceScaleFactor:scale});
      const p = await context.newPage();
      p.on('pageerror', e => report.errors.push(e.stack));
      await prepare(p, h.url);
      const names = await p.evaluate(() => VarnaFlow77.pages);
      assert.equal(names.length, 22);
      for (const width of widths) for (const height of heights) {
        await p.setViewportSize({width:Math.round(width / scale), height:Math.round(height / scale)});
        for (const theme of ['dark', 'light']) {
          await p.evaluate(theme => { const el = document.getElementById('uiTheme'); el.value = theme; el.dispatchEvent(new Event('change', {bubbles:true})); }, theme);
          for (const lang of ['fa', 'en']) {
            await p.evaluate(lang => VarnaI18n52.set(lang), lang);
            for (const name of names) {
              await p.evaluate(name => VarnaUI.open(name), name);
              await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
              const metrics = await p.evaluate(measure);
              const ratio = await p.evaluate(() => {
                const el = document.getElementById('workspace'), s = getComputedStyle(el);
                return (el.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)) / innerHeight;
              });
              report.minContentRatio = Math.min(report.minContentRatio, ratio);
              const flags = ['small', 'clipped', 'overflow', 'touch', 'overlap'];
              const bad = metrics.documentOverflow || metrics.workspaceOverflow || !metrics.mainVisible || metrics.navigation.length > 2 || metrics.workspaceHeight <= 0 || flags.some(k => metrics[k].length);
              if (bad) {
                report.failureCount++;
                if (report.failures.length < 250) report.failures.push({name,width,height,scale,theme,lang,metrics});
              }
              report.cases++;
            }
          }
        }
      }
      await context.close();
    }
    assert.deepEqual(source(),report.source,'runtime source changed during the matrix');
    fs.mkdirSync(path.dirname(output), {recursive:true}); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    assert.deepEqual(report.errors, [], 'uncaught browser errors');
    assert.equal(report.failureCount, 0, report.failureCount + ' layout failures; details: ' + output);
    console.log(`PASS UI77 ${report.profile}: ${report.cases} live page cases; 899 IDs, no clipping/overlap/horizontal overflow, 12px text/32px targets, visible primary actions, <=2 navigation levels.`);
  } finally { await h.close(); }
})().catch(e => {console.error(e); process.exitCode = 1;});
