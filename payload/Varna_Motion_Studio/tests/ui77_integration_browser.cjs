// No Adobe execution is claimed: GHAFBridge is explicitly mocked by prepare().
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {launch, prepare, root} = require('./helpers/panel69.cjs');
(async () => {
  const h = await launch();
  try {
    const context = await h.browser.newContext();
    const p = await context.newPage({viewport:{width:620,height:900}}), errors = [];
    p.on('pageerror', e => errors.push(e.stack));
    // Capture original nodes before the presentation adapter executes. None of
    // the stable ID controls may be replaced by prototype/sample controls.
    await p.route('**/js/flow77.js', async route => {
      const capture = 'window.beforeUI77=new Map([...document.querySelectorAll("[id]")].map(n=>[n.id,n]));\n';
      await route.fulfill({contentType:'text/javascript', body:capture + fs.readFileSync(path.join(root,'js/flow77.js'),'utf8')});
    });
    await prepare(p, h.url);
    const ids = JSON.parse(fs.readFileSync(path.resolve(root,'../docs/ux-audit68/source-inventory.json'))).index.ids;
    assert.deepEqual(await p.evaluate(ids => ids.filter(id => beforeUI77.get(id) !== document.getElementById(id)), ids), [], 'original static controls retain identity');
    assert.equal(await p.locator('[data-task77]').count(), 5);
    await p.click('[data-task77="table"]');
    assert.equal(await p.evaluate(() => VarnaUI.current()), 'table');
    assert(await p.locator('.flat-actions69 #tableBuild').isVisible());
    await p.evaluate(() => VarnaUI.open('output'));
    await p.waitForFunction(() => document.querySelector('[data-proxy77]')?.dataset.target77 === 'btnBuildOutput');
    // The real action retains its own ancestry and handler; the footer forwards
    // exactly one click. Block the native host action here, not in production.
    await p.evaluate(() => {
      window.forwarded77=0;
      document.getElementById('btnBuildOutput').addEventListener('click', e => {window.forwarded77++;e.preventDefault();e.stopImmediatePropagation();}, true);
    });
    await p.click('[data-proxy77]'); assert.equal(await p.evaluate(() => forwarded77), 1);
    await p.evaluate(() => { document.getElementById('btnBuildOutput').disabled=true; });
    await p.waitForFunction(() => document.querySelector('[data-proxy77]').disabled);
    await p.evaluate(() => { document.getElementById('btnBuildOutput').disabled=false; });
    await p.waitForFunction(() => !document.querySelector('[data-proxy77]').disabled);
    for (const name of await p.evaluate(() => VarnaFlow77.pages)) {
      await p.evaluate(name => VarnaUI.open(name), name);
      await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      assert.equal(await p.evaluate(() => VarnaUI.current()), name);
      const target = await p.evaluate(() => document.querySelector('[data-proxy77]')?.dataset.target77 || null);
      if (!['home','table','kinetic','tools','settings'].includes(name)) assert(target, name + ': real primary target');
    }
    await p.evaluate(() => VarnaUI.open('home'));
    await p.click('#headerOptions>summary');
    const before = await p.evaluate(() => JSON.stringify(GHAFState.exportGroups()));
    for (const name of ['original','ocean','mint','ember','noir','rose']) {
      await p.click('[data-palette77="'+name+'"]');
      assert.equal(await p.locator('#themePreset50').inputValue(), name);
      assert.equal(await p.locator('[data-palette77="'+name+'"]').getAttribute('aria-pressed'), 'true');
    }
    await p.click('[data-palette77="mint"]');
    await p.selectOption('#uiTheme','light');
    assert.equal(await p.locator('#themePreset50').inputValue(), 'mint', 'brightness must preserve the palette');
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('VARNA_THEME50')).name), 'mint');
    assert(await p.evaluate(() => {
      const expected=getComputedStyle(document.body).getPropertyValue('--flow-base77').replace(/\s/g,'');
      return expected&&getComputedStyle(document.getElementById('varnaAtmosphere48')).backgroundImage.replace(/\s/g,'').includes(expected);
    }), 'the actual V background must render the selected light palette');
    await p.selectOption('#uiTheme','dark');
    assert.equal(await p.locator('#themePreset50').inputValue(), 'mint');
    await p.evaluate(() => {const e=document.querySelector('[data-blur77]');e.value='11';e.dispatchEvent(new Event('input',{bubbles:true}));});
    assert.equal(await p.evaluate(() => VarnaFlow77.preferences().blur), 11);
    // The existing transition reaches its computed end on the next paint, even
    // with reduced motion. Wait for that exact value; keep the assertion strict.
    await p.waitForFunction(() => getComputedStyle(document.getElementById('varnaAtmosphere48')).filter === 'blur(11px)');
    assert.equal(await p.evaluate(() => getComputedStyle(document.getElementById('varnaAtmosphere48')).filter), 'blur(11px)');
    assert.equal(await p.evaluate(() => JSON.stringify(GHAFState.exportGroups())), before, 'UI appearance must not alter caption payload');
    await p.click('#headerOptions>summary');
    await p.click('[data-more69]');
    assert.equal(await p.locator('[data-destination69]').count(),22);
    await p.click('[data-pin77="kinetic"]');
    assert.equal(await p.locator('[data-pin77="kinetic"]').getAttribute('aria-pressed'),'true');
    assert(await p.locator('[data-page69="kinetic"]').isVisible());
    await p.fill('[data-catalog-search77]','ترجمه');
    assert(await p.locator('[data-destination69="translate"]').isVisible());
    assert(!(await p.locator('[data-destination69="motion"]').isVisible()));
    await p.keyboard.press('Escape');
    assert.equal(await p.locator('.flat-chooser69[open]').count(),0);
    assert(await p.locator('[data-more69]').evaluate(n => n === document.activeElement));
    await p.evaluate(() => VarnaFlow77.openCatalog(true));
    await p.click('[data-side77="right"]');
    assert.equal(await p.locator('.app-shell').getAttribute('data-dock-side77'),'right');
    const sourceRow=p.locator('[data-pin-row77="kinetic"]'),targetRow=p.locator('[data-pin-row77="audio"]');
    const sourceBox=await sourceRow.boundingBox(),targetBox=await targetRow.boundingBox();
    await sourceRow.dragTo(targetRow,{sourcePosition:{x:sourceBox.width-18,y:sourceBox.height/2},targetPosition:{x:targetBox.width-18,y:targetBox.height/2}});
    assert.equal(await p.evaluate(()=>VarnaFlow77.preferences().pins[0]),'kinetic','real drag reorders saved shortcuts');
    await p.click('[data-reset-dock77]');
    assert.deepEqual(await p.evaluate(()=>VarnaFlow77.preferences().pins),['audio','text','motion','bg','table']);
    assert.equal(await p.locator('.app-shell').getAttribute('data-dock-side77'),'left');
    await p.click('[data-pin77="kinetic"]');await p.click('[data-side77="right"]');
    await p.keyboard.press('Escape');
    await p.evaluate(() => {window.styleBefore77=GHAFState.settings.style.fontSize;GHAFState.pushUndo();GHAFState.settings.style.fontSize=88;VarnaActions.refresh();});
    await p.click('[data-undo77]');
    assert(await p.evaluate(() => GHAFState.settings.style.fontSize === styleBefore77));
    await p.evaluate(() => VarnaI18n52.set('en'));
    assert.equal(await p.locator('html').getAttribute('dir'),'ltr');
    await p.evaluate(() => VarnaFlow77.openCatalog()); await p.fill('[data-catalog-search77]','caption');
    assert(await p.locator('[data-destination69="audio"]').isVisible()); await p.keyboard.press('Escape');
    await p.reload(); await p.waitForFunction(() => !!window.VarnaFlow77);
    assert.equal(await p.evaluate(() => VarnaFlow77.preferences().side),'right');
    assert.equal(await p.evaluate(() => VarnaFlow77.preferences().blur),11);
    assert(await p.evaluate(() => VarnaFlow77.preferences().pins.includes('kinetic')));
    // Old V behavior is reused, with actual canvas activity, randomness and return.
    if (await p.locator('#brandWelcome49[open]').count()) await p.click('#startupNewBrand49');
    await p.emulateMedia({reducedMotion:'no-preference'});
    await p.click('[data-flow-logo77]');
    const first = await p.evaluate(() => VarnaLiquid48.status());
    await p.click('[data-flow-logo77]');
    const second = await p.evaluate(() => VarnaLiquid48.status());
    assert(first.particles > 300); assert.equal(second.returnDuration,5000);
    assert(second.bursts > first.bursts); assert.notEqual(second.burstSignature,first.burstSignature);
    await p.waitForTimeout(6200);
    assert.equal(await p.evaluate(() => VarnaLiquid48.status().displacement),0);
    assert.deepEqual(errors,[]);
    console.log('PASS UI77 integration: original live controls/899 IDs, 22 real routes, single forwarded/disabled-aware host action, 6 palettes, brightness retention, UI-only blur, pinned shortcuts, search/focus/Escape, real Undo, English/RTL, persisted preferences and original random V with 5-second return. Native Adobe execution untested.');
    await context.close();
  } finally {await h.close();}
})().catch(e => {console.error(e);process.exitCode=1;});
