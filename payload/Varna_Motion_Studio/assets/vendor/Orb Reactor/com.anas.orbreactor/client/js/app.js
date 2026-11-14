(function () {
  'use strict';

  // Give CEP/Chromium one real paint before doing heavy WebGL/ExtendScript
  // initialization, so the loading shell can animate instead of freezing.
  function bootOrbReactor() {

  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const csInterface = new CSInterface();
  const extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION);

  function readFile(relPath) {
    return fs.readFileSync(path.join(extensionRoot, 'client', relPath), 'utf8');
  }

  function evalHost(fn) {
    return new Promise((resolve) => {
      const script = window.VARNA_EMBEDDED_TOOL === 'orb' ? '$.global.VarnaOrbHost.' + fn : fn;
      csInterface.evalScript(script, (result) => {
        try { resolve(JSON.parse(result)); }
        catch (e) { resolve({ ok: false, error: 'Bad response from host: ' + result }); }
      });
    });
  }

  // Persistent FFmpeg path: stored in Documents so it survives CEP cache clears.
  // No auto-detect, no bundled binary — user pastes path only.
  function ffmpegConfigDir() {
    const home = os.homedir();
    return path.join(home, 'Documents', 'OrbReactor');
  }
  function ffmpegConfigPath() {
    return path.join(ffmpegConfigDir(), 'ffmpeg-path.txt');
  }
  function loadPersistedFfmpegPath() {
    try {
      const p = ffmpegConfigPath();
      if (fs.existsSync(p)) {
        let s = fs.readFileSync(p, 'utf8').trim();
        s = s.replace(/^["']|["']$/g, '').trim(); // strip accidental quotes
        if (s) return s;
      }
    } catch (e) { /* ignore */ }
    // Migrate from older localStorage key once.
    try {
      const old = localStorage.getItem('orbFfmpegPath');
      if (old) {
        const cleaned = String(old).replace(/^["']|["']$/g, '').trim();
        if (cleaned) {
          savePersistedFfmpegPath(cleaned);
          try { localStorage.removeItem('orbFfmpegPath'); } catch (e2) {}
          return cleaned;
        }
      }
    } catch (e) { /* ignore */ }
    return '';
  }
  function savePersistedFfmpegPath(p) {
    try {
      const dir = ffmpegConfigDir();
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const cleaned = String(p || '').replace(/^["']|["']$/g, '').trim();
      if (cleaned) fs.writeFileSync(ffmpegConfigPath(), cleaned, 'utf8');
      else {
        try { fs.unlinkSync(ffmpegConfigPath()); } catch (eU) {}
      }
      return cleaned;
    } catch (e) {
      console.error('[OrbReactor] Could not persist ffmpeg path:', e);
      return String(p || '').replace(/^["']|["']$/g, '').trim();
    }
  }

  /** A file existing on disk doesn't mean it can actually run here (wrong
   *  OS/architecture, corrupted, etc.) - actually try to execute it. */
  function isFfmpegExecutable(p) {
    if (!p) return false;
    try {
      const normalized = path.normalize(String(p).replace(/^["']|["']$/g, ''));
      if (!fs.existsSync(normalized) || !fs.statSync(normalized).isFile()) return false;
      const { execFileSync } = require('child_process');
      execFileSync(normalized, ['-version'], {
        timeout: 6000,
        stdio: ['ignore', 'ignore', 'ignore'],
        windowsHide: true,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Only the path the user set in Settings. No bundled binary, no PATH scan. */
  function resolveFfmpegPath() {
    const candidate = (state.ffmpegPath || '').trim().replace(/^["']|["']$/g, '');
    if (candidate && isFfmpegExecutable(candidate)) return path.normalize(candidate);
    return '';
  }

  // ---------------------------------------------------------------------
  // Shader sources: one lean fragment shader per preset (read once, cheap -
  // actual GPU compilation happens lazily via renderer.ensureStyle()).
  // ---------------------------------------------------------------------
  const orbLibByStyle = {};
  for (const name of OrbPresets.styleNames) {
    orbLibByStyle[name] = readFile('shader/presets/orb-lib.' + name + '.frag');
  }
  const shaderSources = {
    fullscreenVert: readFile('shader/fullscreen.vert'),
    orbLibByStyle,
    ribbonVert: readFile('shader/ribbon.vert'),
    ribbonFrag: readFile('shader/ribbon.frag'),
    particlesOrbVert: readFile('shader/particlesOrb.vert'),
    particlesOrbFrag: readFile('shader/particlesOrb.frag'),
  };

  // Toggle-button helper: preserves the original boolean control behavior.
  function setToggleButton(el, on) {
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
    el.textContent = on ? 'ON' : 'OFF';
    el.classList.toggle('active', on);
  }
  function toggleButtonOn(el) {
    return el.getAttribute('aria-pressed') === 'true';
  }
  function bindToggleButton(el, initial, onChange) {
    setToggleButton(el, initial);
    el.addEventListener('click', () => {
      const on = !toggleButtonOn(el);
      setToggleButton(el, on);
      if (onChange) onChange(on);
    });
  }

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const state = {
    style: 'siri',
    params: Object.assign({ style: 'siri' }, OrbPresets.stylePresets.siri),
    defaults: Object.assign({ style: 'siri' }, OrbPresets.stylePresets.siri),
    playing: true,
    simulateTalking: false,
    reactiveEnabled: false,
    audioAnalyzer: null,
    audioLoadedFrom: null,
    audioSourceType: null, // 'timeline' | 'file'
    audioTrimStart: 0,     // seconds into the source file where playback should start
    audioEffectiveDuration: 0, // the (possibly trimmed) duration to actually use
    ffmpegPath: '', // loaded from Documents after state is created
    compInfo: null,
    exportRunning: false,
    exportFormat: 'sequence',
    ribbonRotation: { x: 0, y: 0 },
    host: 'aftereffects', // 'aftereffects' | 'premierepro'
    // When audio came from a timeline selection, place the export at that range
    // instead of the CTI. null = use CTI / top of stack.
    placement: null, // { startTime, endTime, anchorLayerIndex, fromSelection }
  };
  state.ffmpegPath = loadPersistedFfmpegPath();

  function withRotation(params) {
    if (state.style === 'particleRibbon' || state.style === 'particlesOrb') {
      params.ribbonUserRotX = state.ribbonRotation.x;
      params.ribbonUserRotY = state.ribbonRotation.y;
    }
    // Always pad from the design (slider) edge glow / bloom so voice-reactive
    // idle→talk radius scaling is not cancelled by the glow-fit shrink.
    params.designEdgeGlow = state.params.edgeGlow;
    params.designParticleBloom = state.params.particleBloom;
    return params;
  }

  // ---------------------------------------------------------------------
  // Live preview
  // ---------------------------------------------------------------------
  const previewCanvas = document.getElementById('previewCanvas');
  const previewWrap = document.querySelector('.preview-wrap');
  // CSS display size (draggable); internal buffer stays higher for sharpness.
  let previewCssSize = 300;
  try {
    const saved = parseInt(localStorage.getItem('orbPreviewSize'), 10);
    if (saved >= 160 && saved <= 480) previewCssSize = saved;
  } catch (e) { /* ignore */ }
  let previewBufferDirty = false;
  function applyPreviewCssSize(px, commitBuffer) {
    previewCssSize = Math.max(160, Math.min(480, px));
    if (previewWrap) previewWrap.style.setProperty('--preview-size', Math.round(previewCssSize) + 'px');
    if (commitBuffer) {
      const buf = Math.max(256, Math.min(768, Math.round(previewCssSize * 2)));
      if (previewCanvas.width !== buf) {
        previewCanvas.width = buf;
        previewCanvas.height = buf;
      }
      try { localStorage.setItem('orbPreviewSize', String(Math.round(previewCssSize))); } catch (e) { /* ignore */ }
      previewBufferDirty = false;
    } else {
      previewBufferDirty = true;
    }
  }
  applyPreviewCssSize(previewCssSize, true);

  const previewResizeHandle = document.getElementById('previewResizeHandle');
  if (previewResizeHandle) {
    let dragStartY = 0;
    let dragStartSize = 300;
    let dragging = false;
    let rafPending = false;
    let latestY = 0;
    function onMove(e) {
      if (!dragging) return;
      latestY = e.clientY;
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (!dragging) return;
        applyPreviewCssSize(dragStartSize + (latestY - dragStartY), false);
      });
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      previewResizeHandle.classList.remove('is-dragging');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      applyPreviewCssSize(previewCssSize, true);
    }
    previewResizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragging = true;
      dragStartY = e.clientY;
      latestY = e.clientY;
      dragStartSize = previewCssSize;
      previewResizeHandle.classList.add('is-dragging');
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  const previewRenderer = new OrbRenderer(previewCanvas, shaderSources);

  // Compile only what's needed to show the very first frame right away
  // (this is the one shader compile that actually blocks start-up now that
  // each preset is its own lean shader instead of one giant one). Everything
  // else compiles quietly in the background once the panel is already usable.
  previewRenderer.ensureStyle(state.style);

  // No eager multi-preset warm-up — compile only the active style at boot.
  // Other styles compile on first select so the panel opens instantly.
  const previewMotion = new MotionClock();
  let previewController = OrbPresets.createTransitionController(state.style, state.params, 0.22, 0.65);
  let previewEnvelope = null;
  const previewStart = performance.now();
  let lastFrameMs = null;
  let lastRenderedParams = state.params;

  function audioLevelAt(tWithinEffectiveRange) {
    return state.audioAnalyzer.level(tWithinEffectiveRange + state.audioTrimStart);
  }

  function currentActivationDuration() { return parseFloat(document.getElementById('activationDuration').value); }
  function currentTransitionDuration() { return parseFloat(document.getElementById('transitionDuration').value); }

  function rebuildController() {
    previewController = OrbPresets.createTransitionController(
      state.style, state.params, currentActivationDuration(), currentTransitionDuration(),
    );
    previewEnvelope = new VoiceEnvelope(
      state.style, state.params,
      Math.min(currentActivationDuration(), 0.15),
      Math.min(currentTransitionDuration(), 0.45),
    );
  }
  rebuildController();

  function previewLoop(nowMs) {
    requestAnimationFrame(previewLoop);
    const dtReal = lastFrameMs === null ? 0 : Math.min(0.1, Math.max(0, (nowMs - lastFrameMs) / 1000));
    lastFrameMs = nowMs;

    const label = document.getElementById('stateLabel');

    if (!state.playing) {
      // Frozen: keep showing the last rendered frame, do not advance time.
      previewRenderer.renderFrame(previewCanvas.width, previewCanvas.height,
        previewMotion.phase / Math.max(lastRenderedParams.speed, 0.001), withRotation(lastRenderedParams));
      label.textContent = 'paused';
      label.className = 'state-label';
      return;
    }

    const nowSec = (nowMs - previewStart) / 1000;
    let sampled;

    if (state.reactiveEnabled && state.audioAnalyzer && window.OrbLicense && window.OrbLicense.isFull()) {
      const dur = Math.max(0.1, state.audioEffectiveDuration);
      const t = nowSec % dur;
      const threshold = parseFloat(document.getElementById('voiceThreshold').value);
      const level = audioLevelAt(t);
      const target = levelToTarget(level, threshold);
      previewEnvelope.setTimings(currentActivationDuration(), currentTransitionDuration());
      const smoothed = previewEnvelope.step(target, dtReal || 1 / 60);
      sampled = previewEnvelope.sample();
      if (toggleButtonOn(document.getElementById('reactiveExposure'))) {
        sampled.exposure = sampled.exposure * (1 + Math.min(1.5, level) * 0.35);
      }
      label.textContent = smoothed > 0.5 ? 'talking' : (smoothed > 0.05 ? 'rising' : 'idle');
      label.className = 'state-label' + (smoothed > 0.5 ? ' thinking' : '');
    } else if (state.simulateTalking) {
      // The button now previews the *idle* (resting/silent) look on demand -
      // the default view always matches your sliders exactly, which is also
      // exactly what a plain export renders (no surprise mismatch).
      previewController.setState('idle', nowSec);
      sampled = previewController.sample(nowSec);
      label.textContent = 'idle preview';
      label.className = 'state-label';
    } else {
      sampled = state.params;
      label.textContent = '';
      label.className = 'state-label';
    }

    const shaderTime = previewMotion.step(dtReal, sampled.speed);
    lastRenderedParams = sampled;
    previewRenderer.renderFrame(previewCanvas.width, previewCanvas.height, shaderTime, withRotation(sampled));
  }
  requestAnimationFrame(previewLoop);

  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnPlayPauseIcon = btnPlayPause.querySelector('use');
  btnPlayPause.addEventListener('click', () => {
    state.playing = !state.playing;
    btnPlayPauseIcon.setAttribute('href', state.playing ? '#i-pause' : '#i-play');
    btnPlayPause.title = state.playing ? 'Pause the preview' : 'Resume the preview';
    btnPlayPause.classList.toggle('active', !state.playing);
  });

  // ---------------------------------------------------------------------
  // 3D orbit control for the particleRibbon preset (top-left dial)
  // ---------------------------------------------------------------------
  (function setupRotator() {
    const rotator = document.getElementById('ribbonRotator');
    const dot = rotator.querySelector('.rotator-dot');
    let dragging = false;
    let lastX = 0, lastY = 0;

    function updateDot() {
      const maxOffset = 15;
      const nx = Math.max(-1, Math.min(1, state.ribbonRotation.y / 3.14));
      const ny = Math.max(-1, Math.min(1, state.ribbonRotation.x / 1.4));
      dot.style.transform = 'translate(' + (nx * maxOffset) + 'px, ' + (ny * maxOffset) + 'px)';
    }

    rotator.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      rotator.setPointerCapture(e.pointerId);
    });
    rotator.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      state.ribbonRotation.y += dx * 0.012;
      state.ribbonRotation.x = Math.max(-1.4, Math.min(1.4, state.ribbonRotation.x + dy * 0.012));
      updateDot();
    });
    rotator.addEventListener('pointerup', (e) => {
      dragging = false;
      try { rotator.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    rotator.addEventListener('dblclick', () => {
      state.ribbonRotation.x = 0;
      state.ribbonRotation.y = 0;
      updateDot();
    });
  })();

  // ---------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tabpanel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'voice' && window.OrbLicense && !window.OrbLicense.isFull()) {
        window.OrbLicense.notifyLocked('Voice Reactivity');
      }
    });
  });

  // About / settings gear
  const aboutOverlay = document.getElementById('aboutOverlay');
  const openAbout = () => aboutOverlay && aboutOverlay.classList.remove('hidden');
  const closeAbout = () => aboutOverlay && aboutOverlay.classList.add('hidden');
  document.getElementById('btnAbout').addEventListener('click', openAbout);
  document.getElementById('btnCloseAbout').addEventListener('click', closeAbout);
  aboutOverlay.addEventListener('click', (e) => { if (e.target === aboutOverlay) closeAbout(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAbout(); });

  // License & Support dialog + live status line in Settings
  const btnLicense = document.getElementById('btnLicense');
  const licenseStatusEl = document.getElementById('licenseStatus');
  if (btnLicense) btnLicense.addEventListener('click', () => {
    if (window.OrbLicense) window.OrbLicense.openDialog('license');
  });
  if (window.OrbLicense) {
    window.OrbLicense.onChange((st) => {
      if (licenseStatusEl) licenseStatusEl.textContent = window.OrbLicense.describe(st);
    });
  }

  // ---------------------------------------------------------------------
  // Preset grid (starts as gradients; upgraded to real rendered thumbnails
  // lazily after first paint so panel start-up isn't blocked on 13 draws).
  // ---------------------------------------------------------------------
  const presetGrid = document.getElementById('presetGrid');
  const swatchEls = {};
  const prettyStyleName = (name) => name === 'particlesOrb' ? 'Particles Orb' : name;
  OrbPresets.styleNames.forEach((name) => {
    const preset = OrbPresets.stylePresets[name];
    const card = document.createElement('div');
    card.className = 'preset-card' + (name === state.style ? ' active' : '');
    card.dataset.style = name;
    card.innerHTML =
      '<div class="preset-swatch pending" style="background-image:linear-gradient(135deg, ' +
      preset.colorA + ', ' + preset.colorB + ', ' + preset.colorC + ', ' + preset.colorD +
      ')"></div><div class="name">' + prettyStyleName(name) + '</div>';
    card.addEventListener('click', () => {
      // Trial: only the free orbs can be selected.
      if (window.OrbLicense && !window.OrbLicense.isStyleFree(name)) {
        window.OrbLicense.notifyLocked(prettyStyleName(name) + ' orb');
        return;
      }
      selectStyle(name);
    });
    presetGrid.appendChild(card);
    swatchEls[name] = card.querySelector('.preset-swatch');
  });

  function renderPresetThumbnails() {
    // High-quality thumbs: sharp 256px PNG, enough settle frames for particles
    // to match the real look. One style at a time with a short yield so the
    // live preview (and reactivity) stay responsive.
    if (state.reactiveEnabled) {
      setTimeout(function () {
        if (!state.reactiveEnabled) renderPresetThumbnails();
      }, 2500);
      return;
    }
    const THUMB = 256;
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = THUMB; thumbCanvas.height = THUMB;
    let thumbRenderer;
    try { thumbRenderer = new OrbRenderer(thumbCanvas, shaderSources); }
    catch (e) { return; }
    const motion = new MotionClock();
    let i = 0;
    function renderNext() {
      if (state.reactiveEnabled) {
        setTimeout(function tryResume() {
          if (!state.reactiveEnabled) renderNext();
          else setTimeout(tryResume, 2000);
        }, 2000);
        return;
      }
      if (i >= OrbPresets.styleNames.length) {
        try { thumbRenderer.dispose(); } catch (eD) {}
        return;
      }
      const name = OrbPresets.styleNames[i++];
      const params = Object.assign({ style: name }, OrbPresets.stylePresets[name]);

      // Match the look users see in the live preview for particle styles.
      if (name === 'particleRibbon') {
        try { thumbRenderer._ensureRibbonProgram(); } catch (e) { /* ignore */ }
        params.ribbonUserRotX = 0.35;
        params.ribbonUserRotY = 0.55;
        params.exposure = Math.max(params.exposure || 1, 1.35);
        params.particleSize = Math.max(params.particleSize || 1, 1.4);
        params.particleBloom = Math.max(params.particleBloom || 0.5, 0.85);
      }
      if (name === 'particlesOrb') {
        try { thumbRenderer._ensureParticlesOrbProgram(); } catch (e) { /* ignore */ }
        params.ribbonUserRotX = 0.25;
        params.ribbonUserRotY = 0.4;
        params.exposure = Math.max(params.exposure || 1, 1.25);
        params.particleSize = Math.max(params.particleSize || 1, 1.5);
        params.particleBloom = Math.max(params.particleBloom || 0.5, 1.0);
        params.particleDensity = Math.max(params.particleDensity || 0.7, 0.95);
      }

      const settle = (name === 'particleRibbon' || name === 'particlesOrb') ? 48 : 28;
      for (let f = 0; f < settle; f++) motion.step(1 / 30, params.speed);
      try {
        thumbRenderer.renderFrame(THUMB, THUMB, motion.phase / Math.max(params.speed, 0.001), params);
        const url = thumbCanvas.toDataURL('image/png');
        if (swatchEls[name]) {
          swatchEls[name].style.backgroundImage = 'url(' + url + ')';
          swatchEls[name].classList.remove('pending');
        }
      } catch (eR) { /* skip broken style */ }
      setTimeout(renderNext, 24);
    }
    renderNext();
  }
  // Defer until after first paint so boot stays fast; quality is full once ready.
  setTimeout(function () {
    (window.requestIdleCallback || function (fn) { setTimeout(fn, 500); })
      (renderPresetThumbnails, { timeout: 2500 });
  }, 400);

  function selectStyle(name) {
    state.style = name;
    state.params = Object.assign({ style: name }, OrbPresets.stylePresets[name]);
    state.defaults = Object.assign({ style: name }, OrbPresets.stylePresets[name]);
    document.querySelectorAll('.preset-card').forEach((c) => {
      c.classList.toggle('active', c.dataset.style === name);
    });
    document.getElementById('groupMetal').classList.toggle('hidden', name !== 'chromaticMetal');
    document.getElementById('groupRibbon').classList.toggle('hidden', name !== 'particleRibbon' && name !== 'particlesOrb');
    document.getElementById('ribbonRotator').classList.toggle('hidden', name !== 'particleRibbon' && name !== 'particlesOrb');
    rebuildController();
    buildParamGroups();
    buildColorGroup();
  }

  // ---------------------------------------------------------------------
  // Parameter sliders, each with a reset-to-preset-default icon
  // ---------------------------------------------------------------------
  const SLIDER_SPECS = {
    Motion: [['speed', 0, 4, 0.01]],
    Shape: [
      ['radius', 0.3, 0.95, 0.01], ['zoom', 0, 1, 0.01], ['warp', 0, 8, 0.05],
      ['ridgeAmt', 0, 1, 0.01], ['sharp', 0.2, 6, 0.05], ['contourDeform', 0, 1, 0.01],
    ],
    Look: [
      ['shade', 0, 1, 0.01], ['sheen', 0, 1, 0.01], ['gloss', 0, 2, 0.01],
      ['exposure', 0, 3, 0.01], ['edgeSoftness', 0, 0.05, 0.001], ['edgeGlow', 0, 2, 0.01],
      ['glassOpacity', 0, 1, 0.01], ['shellMidAlpha', 0, 1, 0.01], ['shellEdgeAlpha', 0, 1, 0.01],
    ],
    Metal: [
      ['bandDensity', 1, 8, 0.1], ['chromaticShift', 0, 1, 0.01], ['metalScale', 0.1, 2, 0.01],
      ['metalStretch', 0, 1, 0.01], ['metalAngle', 0, 180, 1], ['metalOffset', 0, 1, 0.01],
      ['metalPhase', 0, 1, 0.01], ['metalEvolution', 0, 2, 0.01], ['metalRoughness', 0, 1, 0.01],
      ['metalDepth', 0, 1, 0.01],
    ],
    Ribbon: [
      ['particleCount', 100, 1200, 10],
      ['particleDensity', 0.2, 1, 0.01], ['ribbonCount', 2, 6, 1], ['ribbonWidth', 0.05, 1, 0.01],
      ['ribbonTwist', 0, 3, 0.01], ['ribbonFold', 0, 1.2, 0.01], ['ribbonBreath', 0, 1, 0.01],
      ['particleSize', 0.2, 3, 0.01], ['particleBloom', 0, 2, 0.01],
    ],
  };
  const GROUP_ELEMENT_IDS = {
    Motion: 'groupMotion', Shape: 'groupShape', Look: 'groupLook',
    Metal: 'groupMetal', Ribbon: 'groupRibbon',
  };

  function buildParamGroups() {
    for (const groupName of Object.keys(SLIDER_SPECS)) {
      const el = document.getElementById(GROUP_ELEMENT_IDS[groupName]);
      el.innerHTML = '';
      if (groupName === 'Look') {
        const glassRow = document.createElement('label');
        glassRow.className = 'row';
        glassRow.innerHTML = '<span>Glass shell</span><button type="button" class="toggle-btn" aria-pressed="' +
          (state.params.glassEnabled ? 'true' : 'false') + '">' +
          (state.params.glassEnabled ? 'ON' : 'OFF') + '</button>';
        const glassToggle = glassRow.querySelector('.toggle-btn');
        bindToggleButton(glassToggle, !!state.params.glassEnabled, (on) => {
          state.params.glassEnabled = on;
        });
        el.appendChild(glassRow);
      }
      let specs = SLIDER_SPECS[groupName];
      if (groupName === 'Ribbon') {
        specs = state.style === 'particlesOrb'
          ? [
              ['particleCount', 100, 1200, 10],
              ['particleDensity', 0.2, 1, 0.01],
              ['particleSize', 0.2, 3, 0.01],
              ['particleBloom', 0, 2, 0.01],
            ]
          : [
              ['particleDensity', 0.2, 1, 0.01], ['ribbonCount', 2, 6, 1], ['ribbonWidth', 0.05, 1, 0.01],
              ['ribbonTwist', 0, 3, 0.01], ['ribbonFold', 0, 1.2, 0.01], ['ribbonBreath', 0, 1, 0.01],
              ['particleSize', 0.2, 3, 0.01], ['particleBloom', 0, 2, 0.01],
            ];
      }
      if (groupName === 'Shape' && state.style === 'particlesOrb') {
        // Wider range so Orb Size can approach the frame; glow is kept inside
        // via shader padding rather than by capping the slider low.
        specs = [['radius', 0.25, 1.0, 0.01]];
      }
      if (groupName === 'Look' && state.style === 'particlesOrb') {
        // Particles Orb only needs exposure + edge glow in Look.
        specs = [
          ['exposure', 0, 3, 0.01],
          ['edgeGlow', 0, 2, 0.01],
        ];
      }
      for (const spec of specs) {
        el.appendChild(buildSlider(spec[0], spec[1], spec[2], spec[3]));
        // Place Edge Glow Color immediately beside the Edge Glow slider.
        if (spec[0] === 'edgeGlow') {
          el.appendChild(buildInlineColorRow('glowColor', 'Edge Glow Color'));
        }
      }
    }
  }

  function buildInlineColorRow(key, labelText) {
    const row = document.createElement('div');
    row.className = 'color-row color-row-inline edge-glow-color';
    const label = document.createElement('label');
    label.textContent = labelText || key;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = state.params[key] || '#A78BFA';
    input.addEventListener('input', () => { state.params[key] = input.value; });
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'reset-btn';
    resetBtn.title = 'Reset to preset default';
    resetBtn.innerHTML = '<svg class="icon icon-sm"><use href="#i-refresh"/></svg>';
    resetBtn.addEventListener('click', () => {
      const def = state.defaults[key];
      state.params[key] = def;
      input.value = def;
    });
    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(resetBtn);
    return row;
  }

  function buildSlider(key, min, max, step) {
    const wrap = document.createElement('div');
    wrap.className = 'slider-row';
    const label = document.createElement('label');
    const particleLabels = {
      particleCount: 'Particle Count', particleDensity: 'Particle Density',
      particleSize: 'Particle Size', particleBloom: 'Particle Glow', edgeGlow: 'Edge Glow',
      radius: 'Orb Size',
    };
    label.textContent = particleLabels[key] || key;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = step;
    input.value = state.params[key];
    const val = document.createElement('span');
    val.className = 'val';
    val.textContent = Number(state.params[key]).toFixed(3);
    input.addEventListener('input', () => {
      state.params[key] = parseFloat(input.value);
      val.textContent = Number(input.value).toFixed(3);
    });
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'reset-btn';
    resetBtn.title = 'Reset to preset default';
    resetBtn.innerHTML = '<svg class="icon icon-sm"><use href="#i-refresh"/></svg>';
    resetBtn.addEventListener('click', () => {
      const def = state.defaults[key];
      state.params[key] = def;
      input.value = def;
      val.textContent = Number(def).toFixed(3);
    });
    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(val);
    wrap.appendChild(resetBtn);
    return wrap;
  }

  const COLOR_KEYS = [
    'colorA', 'colorB', 'colorC', 'colorD', 'highlightColor', 'glowColor',
    'shellInner', 'shellMid', 'shellEdge', 'sheenColor', 'specColor', 'canvasColor',
  ];

  function buildColorGroup() {
    const el = document.getElementById('groupColors');
    el.innerHTML = '';
    // Edge Glow Color lives next to the Edge Glow slider (Style tab) for
    // particlesOrb; keep the rest of the palette here.
    const keys = state.style === 'particlesOrb'
      ? ['colorA', 'colorB']
      : COLOR_KEYS.filter((k) => k !== 'glowColor');
    for (const key of keys) {
      const row = document.createElement('div');
      row.className = 'color-row';
      const label = document.createElement('label');
      const colorLabels = state.style === 'particlesOrb'
        ? { colorA: 'Color From', colorB: 'Color To' }
        : {};
      label.textContent = colorLabels[key] || key;
      const input = document.createElement('input');
      input.type = 'color';
      input.value = state.params[key];
      input.addEventListener('input', () => { state.params[key] = input.value; });
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'reset-btn';
      resetBtn.title = 'Reset to preset default';
      resetBtn.innerHTML = '<svg class="icon icon-sm"><use href="#i-refresh"/></svg>';
      resetBtn.addEventListener('click', () => {
        state.params[key] = state.defaults[key];
        input.value = state.defaults[key];
      });
      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(resetBtn);
      el.appendChild(row);
    }
  }

  selectStyle(state.style);

  document.getElementById('activationDuration').addEventListener('input', rebuildController);
  document.getElementById('transitionDuration').addEventListener('input', rebuildController);

  // ---------------------------------------------------------------------
  // Manual idle-look preview (default view always matches your sliders)
  // ---------------------------------------------------------------------
  const btnToggleTalk = document.getElementById('btnToggleTalk');
  btnToggleTalk.textContent = 'Idle preview';
  btnToggleTalk.addEventListener('click', () => {
    state.simulateTalking = !state.simulateTalking;
    btnToggleTalk.textContent = state.simulateTalking ? 'Back to design' : 'Idle preview';
    btnToggleTalk.classList.toggle('active', state.simulateTalking);
  });

  // ---------------------------------------------------------------------
  // Voice reactivity: source loading
  // ---------------------------------------------------------------------
  const reactiveEnabledEl = document.getElementById('reactiveEnabled');
  bindToggleButton(reactiveEnabledEl, false, (on) => {
    state.reactiveEnabled = on;
    // Voice reactivity drives its own idle<->talking blend from the audio;
    // the manual "simulate talking" toggle would just fight with it, and the
    // global Pause button already freezes reactive playback too. One clear
    // control per mode instead of a button that silently does nothing.
    btnToggleTalk.classList.toggle('hidden', state.reactiveEnabled);
    if (state.reactiveEnabled) {
      state.simulateTalking = false;
      btnToggleTalk.textContent = 'Idle preview';
      btnToggleTalk.classList.remove('active');
    }
  });

  const audioStatus = document.getElementById('audioStatus');
  const placeAudioRow = document.getElementById('placeAudioRow');
  const btnClearAudio = document.getElementById('btnClearAudio');
  // Was never wired — button showed ON but clicks did nothing.
  const placeAudioBtn = document.getElementById('placeAudioOnTimeline');
  if (placeAudioBtn) {
    bindToggleButton(placeAudioBtn, true, () => { /* state read live via toggleButtonOn */ });
  }

  function setAudioClearVisible(on) {
    if (btnClearAudio) btnClearAudio.classList.toggle('hidden', !on);
  }

  function clearLoadedAudio() {
    state.audioAnalyzer = null;
    state.audioLoadedFrom = null;
    state.audioSourceType = null;
    state.audioTrimStart = 0;
    state.audioEffectiveDuration = 0;
    state.placement = null;
    if (audioStatus) audioStatus.textContent = 'No audio loaded yet.';
    if (placeAudioRow) placeAudioRow.style.display = 'none';
    setAudioClearVisible(false);
    try {
      const fileInput = document.getElementById('audioFileInput');
      if (fileInput) fileInput.value = '';
    } catch (e) { /* ignore */ }
  }

  if (btnClearAudio) {
    btnClearAudio.addEventListener('click', () => {
      clearLoadedAudio();
    });
  }

  async function loadAudioFromPath(filePath, label, sourceType, trim) {
    audioStatus.textContent = 'Decoding ' + label + '\u2026';
    setAudioClearVisible(false);
    try {
      // Prefer the user-set path; fall back to whatever resolve finds.
      const ff = resolveFfmpegPath() || state.ffmpegPath || '';
      state.audioAnalyzer = new AudioAnalyzer();
      const result = await state.audioAnalyzer.loadFromPath(filePath, ff, os.tmpdir());
      state.audioLoadedFrom = filePath;
      state.audioSourceType = sourceType;
      if (trim) {
        state.audioTrimStart = Math.max(0, trim.inSeconds);
        state.audioEffectiveDuration = Math.max(0.05, trim.outSeconds - trim.inSeconds);
      } else {
        state.audioTrimStart = 0;
        state.audioEffectiveDuration = state.audioAnalyzer.duration;
      }
      // When audio comes from the timeline, default export duration to that length
      // so PNG / MP4 length matches the selection (including gaps).
      if (sourceType === 'timeline') {
        try {
          const durSel = document.getElementById('durationSource');
          if (durSel) {
            durSel.value = 'audio';
            document.getElementById('customDuration').classList.add('hidden');
          }
        } catch (eDur) { /* ignore */ }
      }
      // File browse is not tied to a timeline selection → place at CTI.
      if (sourceType === 'file') state.placement = null;
      audioStatus.textContent = trim
        ? 'Loaded ' + label + ' (' + state.audioEffectiveDuration.toFixed(2) +
          's of its in/out range, via ' + result.method + ').'
        : 'Loaded ' + label + ' (' + state.audioAnalyzer.duration.toFixed(2) + 's, via ' + result.method + ').';
      setAudioClearVisible(true);
    } catch (e) {
      state.audioAnalyzer = null;
      state.audioSourceType = null;
      state.audioTrimStart = 0;
      state.audioEffectiveDuration = 0;
      state.placement = null;
      audioStatus.textContent = 'Could not load audio: ' + e.message;
      placeAudioRow.style.display = 'none';
      setAudioClearVisible(false);
      return;
    }
    placeAudioRow.style.display = sourceType === 'file' ? 'flex' : 'none';
  }

  function rememberTimelinePlacement(info) {
    const start = (info.placeStart != null) ? Number(info.placeStart)
      : (info.clips && info.clips[0] ? Number(info.clips[0].timelineIn) : null);
    const end = (info.placeEnd != null) ? Number(info.placeEnd)
      : (info.clips && info.clips[0] ? Number(info.clips[0].timelineOut) : null);
    state.placement = {
      startTime: (start != null && isFinite(start)) ? start : null,
      endTime: (end != null && isFinite(end)) ? end : null,
      anchorLayerIndex: (info.anchorLayerIndex != null) ? Number(info.anchorLayerIndex) : null,
      fromSelection: true,
    };
  }

  /**
   * Stitch selected timeline clips into one continuous analysis WAV that
   * matches the timeline span (including silence for gaps between clips).
   * Requires a user-set ffmpeg path when more than one segment is involved
   * or when gaps must be filled.
   */
  async function mergeClipsWithGaps(clips, label) {
    const ffmpegPath = resolveFfmpegPath();
    if (!ffmpegPath) {
      throw new Error(
        'Multiple clips / gaps need ffmpeg. Set the path in Settings, or select a single continuous clip.',
      );
    }
    const { execFileSync } = require('child_process');
    const tmp = os.tmpdir();
    const stamp = Date.now();
    const parts = [];
    const listFile = path.join(tmp, 'orb-concat-' + stamp + '.txt');
    try {
      let cursor = clips[0].timelineIn;
      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        const gap = (c.timelineIn || 0) - cursor;
        // Insert silence for any gap on the timeline between selected clips.
        if (gap > 0.02) {
          const silPath = path.join(tmp, 'orb-sil-' + stamp + '-' + i + '.wav');
          execFileSync(ffmpegPath, [
            '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
            '-t', String(gap), '-c:a', 'pcm_s16le', silPath,
          ], { stdio: 'ignore', windowsHide: true, timeout: 60000 });
          parts.push(silPath);
        }
        if (!c.filePath) {
          throw new Error('Clip "' + (c.name || i) + '" has no media file path (nested sequence / precomp without extractable audio).');
        }
        const outWav = path.join(tmp, 'orb-clip-' + stamp + '-' + i + '.wav');
        const ss = Math.max(0, Number(c.sourceIn) || 0);
        const to = Math.max(ss + 0.05, Number(c.sourceOut) || (ss + 0.05));
        // Prefer exact timeline duration when source times look wrong (common in Premiere).
        const tlDur = Math.max(0.05, (Number(c.timelineOut) || 0) - (Number(c.timelineIn) || 0));
        const srcDur = to - ss;
        const useDuration = (Math.abs(srcDur - tlDur) > 0.15) ? tlDur : null;
        const args = ['-y', '-ss', String(ss)];
        if (useDuration != null) {
          args.push('-t', String(useDuration));
        } else {
          args.push('-to', String(to));
        }
        args.push('-i', c.filePath, '-vn', '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', outWav);
        execFileSync(ffmpegPath, args, { stdio: 'ignore', windowsHide: true, timeout: 120000 });
        parts.push(outWav);
        cursor = Math.max(cursor, Number(c.timelineOut) || cursor);
      }
      const listBody = parts.map((p) => {
        const safe = p.replace(/\\/g, '/').replace(/'/g, "'\\''");
        return "file '" + safe + "'";
      }).join('\n');
      fs.writeFileSync(listFile, listBody);
      const concatOut = path.join(tmp, 'orb-merged-' + stamp + '.wav');
      execFileSync(ffmpegPath, [
        '-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', concatOut,
      ], { stdio: 'ignore', windowsHide: true, timeout: 120000 });
      await loadAudioFromPath(concatOut, label || (clips.length + ' clips (merged)'), 'timeline', null);
      // Effective duration must match the full timeline span (first in → last out).
      const span = Math.max(
        0.05,
        (Number(clips[clips.length - 1].timelineOut) || 0) - (Number(clips[0].timelineIn) || 0),
      );
      if (state.audioAnalyzer && Math.abs(state.audioEffectiveDuration - span) > 0.05) {
        state.audioEffectiveDuration = span;
      }
    } finally {
      parts.forEach((p) => { try { fs.unlinkSync(p); } catch (e) {} });
      try { fs.unlinkSync(listFile); } catch (e) {}
    }
  }

  /** Build a single analysis range from one or more selected timeline clips.
   *  Multi-select is always one continuous timeline range; gaps become silence. */
  async function loadTimelineSelection(info) {
    rememberTimelinePlacement(info);
    const clips = (info.clips && info.clips.length) ? info.clips.slice() : null;
    if (!clips || clips.length === 0) {
      // Fallback for precomp / nested / single-layer responses without clips[].
      if (info.filePath) {
        const inSeconds = (info.sourceIn != null)
          ? Math.max(0, info.sourceIn)
          : Math.max(0, (info.inPoint != null && info.startTime != null) ? (info.inPoint - info.startTime) : 0);
        const outSeconds = (info.sourceOut != null)
          ? Math.max(inSeconds + 0.05, info.sourceOut)
          : Math.max(inSeconds + 0.05, (info.outPoint != null && info.startTime != null)
            ? (info.outPoint - info.startTime) : (inSeconds + 0.05));
        await loadAudioFromPath(info.filePath, info.layerName || 'selection', 'timeline', { inSeconds, outSeconds });
        // Prefer timeline span when host reported placeStart/placeEnd.
        if (info.placeStart != null && info.placeEnd != null) {
          const span = Math.max(0.05, Number(info.placeEnd) - Number(info.placeStart));
          if (state.audioAnalyzer) state.audioEffectiveDuration = span;
        }
        return;
      }
      audioStatus.textContent = info.error || 'No usable audio in the selection.';
      return;
    }

    // Sort by timeline so multi-select plays as one continuous sequence.
    clips.sort((a, b) => (a.timelineIn || 0) - (b.timelineIn || 0));

    // Single clip: load the trimmed media range; duration follows the timeline length.
    if (clips.length === 1) {
      const c = clips[0];
      const tlDur = Math.max(0.05, (Number(c.timelineOut) || 0) - (Number(c.timelineIn) || 0));
      let srcIn = Math.max(0, Number(c.sourceIn) || 0);
      let srcOut = Math.max(srcIn + 0.05, Number(c.sourceOut) || (srcIn + tlDur));
      // If reported source duration is wildly different from timeline duration
      // (common Premiere quirk), trust timeline length from sourceIn.
      if (Math.abs((srcOut - srcIn) - tlDur) > 0.15) {
        srcOut = srcIn + tlDur;
      }
      await loadAudioFromPath(c.filePath, c.name, 'timeline', {
        inSeconds: srcIn,
        outSeconds: srcOut,
      });
      if (state.audioAnalyzer) state.audioEffectiveDuration = tlDur;
      return;
    }

    // Multi-clip: always stitch in timeline order and fill gaps with silence.
    // Same-file adjacent pieces without gaps can still go through the merger
    // so gap handling stays consistent in AE and Premiere.
    audioStatus.textContent = 'Building continuous audio from ' + clips.length + ' selected clips\u2026';
    try {
      await mergeClipsWithGaps(clips, clips.length + ' clips (merged)');
    } catch (e) {
      audioStatus.textContent = 'Could not merge selected clips: ' + (e.message || e);
    }
  }

  document.getElementById('btnUseTimelineAudio').addEventListener('click', async () => {
    const info = await evalHost('aeGetSelectedAudioLayerInfo()');
    if (!info.ok) { audioStatus.textContent = info.error; return; }
    await loadTimelineSelection(info);
  });

  const audioFileInput = document.getElementById('audioFileInput');
  document.getElementById('btnBrowseAudio').addEventListener('click', () => audioFileInput.click());
  audioFileInput.addEventListener('change', async () => {
    const file = audioFileInput.files[0];
    if (!file) return;
    await loadAudioFromPath(file.path, file.name, 'file');
  });

  // ---------------------------------------------------------------------
  // Connection to After Effects + comp info
  // ---------------------------------------------------------------------
  const connStatus = document.getElementById('connStatus');
  const compInfoEl = document.getElementById('compInfo');

  function applyHostUiConstraints() {
    const isPpro = state.host === 'premierepro';
    const workOpt = document.querySelector('#durationSource option[value="workarea"]');
    if (workOpt) workOpt.textContent = isPpro ? 'Match sequence in/out' : 'Match comp work area';
    const resOpt = document.querySelector('#resolutionSource option[value="comp"]');
    if (resOpt) resOpt.textContent = isPpro ? 'Match active sequence' : 'Match active comp';
    const frOpt = document.querySelector('#frameRateSource option[value="comp"]');
    if (frOpt) frOpt.textContent = isPpro ? 'Match active sequence' : 'Match active comp';
    updateExportFormatUi();
  }

  /** PNG sequence is always available. H.264 MP4 is enabled only when a working
   *  user-set ffmpeg path exists. Default remains PNG sequence. */
  function updateExportFormatUi() {
    const ffmpegOk = !!resolveFfmpegPath();
    const seqBtn = document.querySelector('#exportFormatSeg .seg-btn[data-format="sequence"]');
    const mp4Btn = document.querySelector('#exportFormatSeg .seg-btn[data-format="mp4"]');
    if (seqBtn) seqBtn.classList.remove('hidden');
    if (mp4Btn) {
      mp4Btn.disabled = !ffmpegOk;
      mp4Btn.classList.toggle('disabled', !ffmpegOk);
      mp4Btn.title = ffmpegOk
        ? 'Raw frames piped straight into ffmpeg as H.264 - much faster, but no transparency.'
        : 'Set ffmpeg path in Settings to enable H.264 MP4 export.';
      if (!ffmpegOk && state.exportFormat === 'mp4') {
        state.exportFormat = 'sequence';
        document.querySelectorAll('#exportFormatSeg .seg-btn').forEach((b) => b.classList.remove('active'));
        if (seqBtn) seqBtn.classList.add('active');
      }
    }
    const bg = document.getElementById('mp4BgRow');
    if (bg) bg.classList.toggle('hidden', state.exportFormat !== 'mp4');
    const hint = document.getElementById('mp4DisabledHint');
    if (hint) hint.classList.toggle('hidden', ffmpegOk || state.exportFormat !== 'mp4');
  }

  async function refreshCompInfo() {
    const info = await evalHost('aeGetActiveCompInfo()');
    if (info.ok) {
      state.compInfo = info;
      if (info.host) state.host = info.host;
      else {
        try {
          const env = JSON.parse(csInterface.getHostEnvironment());
          const id = (env && (env.appId || env.appName)) || '';
          state.host = /PPRO|premiere/i.test(String(id)) ? 'premierepro' : 'aftereffects';
        } catch (e) { /* keep previous */ }
      }
      const hostLabel = state.host === 'premierepro' ? 'Premiere Pro' : 'After Effects';
      connStatus.textContent = 'Connected to ' + hostLabel;
      connStatus.className = 'conn-status ok';
      compInfoEl.textContent =
        info.name + ' \u2014 ' + info.width + '\u00d7' + info.height + ' @ ' +
        Number(info.frameRate).toFixed(2) + 'fps, ' + Number(info.duration).toFixed(2) + 's';
      applyHostUiConstraints();
    } else {
      connStatus.textContent = info.error || 'Not connected';
      connStatus.className = 'conn-status err';
      compInfoEl.textContent = 'not connected yet';
    }
  }
  refreshCompInfo();
  setInterval(refreshCompInfo, 2500);

  // ---------------------------------------------------------------------
  // Export tab wiring
  // ---------------------------------------------------------------------
  document.getElementById('durationSource').addEventListener('change', (e) => {
    document.getElementById('customDuration').classList.toggle('hidden', e.target.value !== 'custom');
  });
  document.getElementById('resolutionSource').addEventListener('change', (e) => {
    document.getElementById('customResolutionRow').classList.toggle('hidden', e.target.value !== 'custom');
  });
  document.getElementById('frameRateSource').addEventListener('change', (e) => {
    document.getElementById('customFrameRate').classList.toggle('hidden', e.target.value !== 'custom');
  });

  document.querySelectorAll('#exportFormatSeg .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.format === 'mp4' && !resolveFfmpegPath()) {
        // Keep disabled look; nudge user to Settings.
        const status = document.getElementById('exportStatus');
        if (status) status.textContent = 'Set ffmpeg path in Settings to enable H.264 MP4.';
        return;
      }
      document.querySelectorAll('#exportFormatSeg .seg-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.exportFormat = btn.dataset.format;
      document.getElementById('mp4BgRow').classList.toggle('hidden', state.exportFormat !== 'mp4');
      const hint = document.getElementById('mp4DisabledHint');
      if (hint) hint.classList.add('hidden');
    });
  });

  // Folder picker with no PowerShell window.
  // 1) Adobe CEP native "choose directory" dialog (same modern Explorer UI).
  // 2) Chromium <input webkitdirectory> as fallback.
  function firstExistingPath(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const p = firstExistingPath(value[i]);
        if (p) return p;
      }
      return null;
    }
    if (typeof value !== 'string') return null;
    let s = value.trim().replace(/^["']|["']$/g, '');
    if (!s) return null;
    try {
      if (fs.existsSync(s) && fs.statSync(s).isFile()) s = path.dirname(s);
      if (fs.existsSync(s) && fs.statSync(s).isDirectory()) return s;
    } catch (e) { /* ignore */ }
    return s || null;
  }

  function parseCepDialogResult(raw) {
    if (!raw) return null;
    if (Array.isArray(raw)) return firstExistingPath(raw);
    if (typeof raw === 'object') {
      if (raw.data) return firstExistingPath(raw.data);
      if (raw.path) return firstExistingPath(raw.path);
    }
    if (typeof raw === 'string') {
      try { return firstExistingPath(JSON.parse(raw)); } catch (e) { /* not JSON */ }
      return firstExistingPath(raw);
    }
    return null;
  }

  function pickFolderCep() {
    const start = (document.getElementById('outputFolder') && document.getElementById('outputFolder').value) || '';
    const title = 'Select export folder';
    // Returns { path, shown } — shown=true means a dialog appeared (cancel keeps path null).
    function shown(path) { return { path: path || null, shown: true }; }
    function notShown() { return { path: null, shown: false }; }

    try {
      if (window.cep && window.cep.fs && typeof window.cep.fs.showOpenDialog === 'function') {
        const result = window.cep.fs.showOpenDialog(false, true, title, start, []);
        return shown(parseCepDialogResult(result));
      }
    } catch (e) { /* try next */ }
    try {
      if (window.__adobe_cep__ && typeof window.__adobe_cep__.showOpenDialogEx === 'function') {
        const raw = window.__adobe_cep__.showOpenDialogEx(false, true, title, start, []);
        return shown(parseCepDialogResult(raw));
      }
    } catch (e) { /* try next */ }
    try {
      if (window.__adobe_cep__ && typeof window.__adobe_cep__.showOpenDialog === 'function') {
        const raw = window.__adobe_cep__.showOpenDialog(false, true, title, start, []);
        return shown(parseCepDialogResult(raw));
      }
    } catch (e) { /* try next */ }

    // macOS Finder folder picker when CEP dialog APIs are missing.
    if (os.platform() === 'darwin') {
      try {
        const { execFileSync } = require('child_process');
        const out = execFileSync(
          'osascript',
          ['-e', 'POSIX path of (choose folder with prompt "' + title + '")'],
          { encoding: 'utf8', timeout: 180000 }
        ).toString().trim().replace(/\/$/, '');
        if (out && fs.existsSync(out)) return shown(out);
        return shown(null);
      } catch (eOs) {
        // User canceled (−128) or dialog error: dialog was shown.
        return shown(null);
      }
    }
    return notShown();
  }

  const folderPickerInput = document.createElement('input');
  folderPickerInput.type = 'file';
  folderPickerInput.style.display = 'none';
  folderPickerInput.setAttribute('webkitdirectory', '');
  folderPickerInput.setAttribute('directory', '');
  folderPickerInput.setAttribute('nwdirectory', '');
  document.body.appendChild(folderPickerInput);
  folderPickerInput.addEventListener('change', () => {
    const files = folderPickerInput.files;
    if (!files || !files.length) return;
    const file = files[0];
    let folder = file.path ? path.dirname(file.path) : '';
    // If Chromium gave a directory entry directly:
    if (file.path && fs.existsSync(file.path) && fs.statSync(file.path).isDirectory()) {
      folder = file.path;
    }
    if (folder) document.getElementById('outputFolder').value = folder;
  });

  document.getElementById('btnChooseFolder').addEventListener('click', () => {
    const result = pickFolderCep();
    if (result.path) {
      document.getElementById('outputFolder').value = result.path;
      return;
    }
    if (result.shown) {
      // User cancelled — keep current folder, do not open another dialog.
      return;
    }
    // No native folder API available: Chromium directory picker only.
    folderPickerInput.value = '';
    folderPickerInput.click();
  });

  // Default export location = user's Downloads folder (Windows + macOS).
  function defaultDownloadsPath() {
    const home = os.homedir();
    const candidates = [
      path.join(home, 'Downloads'),
      path.join(home, 'Download'),
      process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Downloads') : null,
      process.env.HOME ? path.join(process.env.HOME, 'Downloads') : null,
      // macOS sometimes uses localized folder names; Desktop as last resort.
      path.join(home, 'Desktop'),
    ].filter(Boolean);
    for (const p of candidates) {
      try { if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p; } catch (e) { /* keep looking */ }
    }
    return path.join(home, 'Downloads');
  }
  const outputFolderInput = document.getElementById('outputFolder');
  if (outputFolderInput && !outputFolderInput.value) {
    outputFolderInput.value = defaultDownloadsPath();
  }

  function resolveExportSettings() {
    const durationMode = document.getElementById('durationSource').value;
    let durationSeconds;
    if (durationMode === 'audio' && state.audioAnalyzer) {
      durationSeconds = state.audioEffectiveDuration;
      // Prefer the exact timeline selection span when available (handles gaps).
      if (state.placement && state.placement.fromSelection &&
          state.placement.startTime != null && state.placement.endTime != null) {
        const span = Number(state.placement.endTime) - Number(state.placement.startTime);
        if (isFinite(span) && span > 0.05) durationSeconds = span;
      }
    } else if (durationMode === 'workarea' && state.compInfo) {
      durationSeconds = state.compInfo.workAreaDuration;
    } else {
      durationSeconds = parseFloat(document.getElementById('customDuration').value) || 3;
    }

    const resMode = document.getElementById('resolutionSource').value;
    let width, height;
    if (resMode === 'comp' && state.compInfo) { width = state.compInfo.width; height = state.compInfo.height; }
    else {
      width = parseInt(document.getElementById('customWidth').value, 10) || 1024;
      height = parseInt(document.getElementById('customHeight').value, 10) || 1024;
    }

    const frMode = document.getElementById('frameRateSource').value;
    let frameRate;
    if (frMode === 'comp' && state.compInfo) frameRate = state.compInfo.frameRate;
    else frameRate = parseFloat(document.getElementById('customFrameRate').value) || 30;

    return { durationSeconds, width, height, frameRate };
  }

  function hexToRgbTriple(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  const btnExport = document.getElementById('btnExport');
  const btnCancelExport = document.getElementById('btnCancelExport');
  const progressWrap = document.getElementById('exportProgressWrap');
  const progressBar = document.getElementById('exportProgressBar');
  const exportStatus = document.getElementById('exportStatus');

  // Reused across exports in this session so we're not recompiling shaders
  // (and reallocating a big canvas) on every single click.
  let sharedExportRenderer = null;
  let sharedExportCanvas = null;
  function getExportRenderer(width, height) {
    if (!sharedExportCanvas) {
      sharedExportCanvas = document.createElement('canvas');
    }
    if (sharedExportCanvas.width !== width || sharedExportCanvas.height !== height) {
      sharedExportCanvas.width = width;
      sharedExportCanvas.height = height;
    }
    if (!sharedExportRenderer) {
      sharedExportRenderer = new OrbRenderer(sharedExportCanvas, shaderSources);
    }
    return { renderer: sharedExportRenderer, canvas: sharedExportCanvas };
  }

  let exportCancelRequested = false;

  /** Fully resets the export section back to its ready state - used after a
   *  successful export, a failure, or a cancellation, so the panel is always
   *  immediately ready to export again without any leftover stuck state. */
  function resetExportSection(finalMessage) {
    state.exportRunning = false;
    exportCancelRequested = false;
    btnExport.disabled = false;
    btnExport.classList.remove('hidden');
    btnCancelExport.classList.add('hidden');
    progressBar.style.width = '0%';
    if (finalMessage !== undefined) exportStatus.textContent = finalMessage;
  }

  btnCancelExport.addEventListener('click', () => {
    exportCancelRequested = true;
    exportStatus.textContent = 'Cancelling\u2026';
  });

  btnExport.addEventListener('click', async () => {
    if (state.exportRunning) return;
    // Licensing gate: exporting needs a valid license or an active trial.
    if (!window.OrbLicense || !window.OrbLicense.requireLicense()) return;
    const outputFolder = document.getElementById('outputFolder').value;
    if (!outputFolder) { alert('Choose an output folder first.'); return; }
    if (!state.compInfo) {
      alert(state.host === 'premierepro'
        ? 'Could not read the active sequence. Open a sequence in Premiere Pro.'
        : 'Could not read the active composition. Open a comp in After Effects.');
      return;
    }
    const settings = resolveExportSettings();
    const totalFrames = Math.max(1, Math.round(settings.durationSeconds * settings.frameRate));
    const layerName = document.getElementById('layerName').value || 'Liquid Orb';
    const filePrefix = 'orb_';

    // Always re-check: MP4 needs a working user-set ffmpeg path.
    if (state.exportFormat === 'mp4' && !resolveFfmpegPath()) {
      alert('H.264 MP4 requires a working ffmpeg path. Set it in Settings, or switch to PNG sequence.');
      updateExportFormatUi();
      return;
    }

    state.exportRunning = true;
    exportCancelRequested = false;
    btnExport.classList.add('hidden');
    btnCancelExport.classList.remove('hidden');
    progressWrap.classList.remove('hidden');
    progressBar.style.width = '0%';
    exportStatus.textContent = 'Rendering 0 / ' + totalFrames + ' frames\u2026';

    const { renderer: exportRenderer, canvas: exportCanvas } =
      getExportRenderer(settings.width, settings.height);

    // Audio reactivity on export mirrors the live preview whenever voice
    // reactivity is enabled and a full license is present. This must work for
    // both PNG sequence and MP4, and in both AE and Premiere.
    const audioOptions = (state.reactiveEnabled && state.audioAnalyzer && window.OrbLicense && window.OrbLicense.isFull()) ? {
      analyzer: state.audioAnalyzer,
      threshold: parseFloat(document.getElementById('voiceThreshold').value),
      reactiveExposure: toggleButtonOn(document.getElementById('reactiveExposure')),
      trimStart: state.audioTrimStart,
    } : null;

    const ribbonRotation = (state.style === 'particleRibbon' || state.style === 'particlesOrb')
      ? { x: state.ribbonRotation.x, y: state.ribbonRotation.y } : null;

    // Seed export with the exact phase the preview was showing so ribbon
    // orientation / particle colors match what was on screen.
    const startPhase = previewMotion.phase;

    const shouldPlaceAudio = state.audioAnalyzer && state.audioSourceType === 'file' &&
      toggleButtonOn(document.getElementById('placeAudioOnTimeline'));

    const isCancelled = () => exportCancelRequested;

    try {
      const outFolder = path.join(outputFolder, 'liquid-orb-' + Date.now());
      let orbOutputPath;
      let isSequence;

      if (state.exportFormat === 'mp4') {
        const ffmpegPath = resolveFfmpegPath();
        if (!ffmpegPath) throw new Error(
          'No working ffmpeg binary at the path set in Settings. Use PNG sequence export instead, or set a valid ffmpeg path.',
        );
        orbOutputPath = await OrbExport.exportMp4({
          renderer: exportRenderer,
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          totalFrames,
          outputDir: outFolder,
          filePrefix,
          ffmpegPath,
          backgroundColor: hexToRgbTriple(document.getElementById('mp4BgColor').value),
          style: state.style,
          thinkingParams: Object.assign({}, state.params, {
            designEdgeGlow: state.params.edgeGlow,
            designParticleBloom: state.params.particleBloom,
          }),
          audio: audioOptions,
          ribbonRotation,
          startPhase,
          startActive: true,
          activationDuration: Math.min(currentActivationDuration(), 0.15),
          transitionDuration: Math.min(currentTransitionDuration(), 0.45),
          isCancelled,
          onProgress: (done, total) => {
            progressBar.style.width = (100 * done / total).toFixed(1) + '%';
            exportStatus.textContent = 'Encoding ' + done + ' / ' + total + ' frames\u2026';
          },
        });
        isSequence = false;
      } else {
        const paths = await OrbExport.exportPngSequence({
          renderer: exportRenderer,
          canvas: exportCanvas,
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          totalFrames,
          outputDir: outFolder,
          filePrefix,
          style: state.style,
          thinkingParams: Object.assign({}, state.params, {
            designEdgeGlow: state.params.edgeGlow,
            designParticleBloom: state.params.particleBloom,
          }),
          audio: audioOptions,
          ribbonRotation,
          startPhase,
          startActive: true,
          activationDuration: Math.min(currentActivationDuration(), 0.15),
          transitionDuration: Math.min(currentTransitionDuration(), 0.45),
          isCancelled,
          onProgress: (done, total) => {
            progressBar.style.width = (100 * done / total).toFixed(1) + '%';
            exportStatus.textContent = 'Rendering ' + done + ' / ' + total + ' frames\u2026';
          },
        });
        orbOutputPath = (exportCancelRequested || paths.length < totalFrames) ? null : paths[0];
        isSequence = true;
      }

      if (exportCancelRequested || !orbOutputPath) {
        resetExportSection('Export cancelled.');
        return;
      }

      exportStatus.textContent = state.host === 'premierepro'
        ? 'Importing into Premiere Pro\u2026'
        : 'Importing into After Effects\u2026';
      const placeStart = (state.placement && state.placement.fromSelection && state.placement.startTime != null)
        ? state.placement.startTime
        : null;
      const placeEnd = (state.placement && state.placement.fromSelection && state.placement.endTime != null)
        ? state.placement.endTime
        : null;
      const anchorIdx = (state.placement && state.placement.anchorLayerIndex != null)
        ? state.placement.anchorLayerIndex
        : null;
      // Pass exact export duration so Premiere can force the sequence clip
      // length to match the audio / selection (PNG sequences often import short).
      const importResult = await evalHost(
        'aeImportOrbAndAudioAtCTI(' +
        JSON.stringify(orbOutputPath) + ', ' + JSON.stringify(isSequence) + ', ' + settings.frameRate + ', ' +
        JSON.stringify(layerName) + ', ' +
        JSON.stringify(shouldPlaceAudio ? state.audioLoadedFrom : null) + ', ' +
        JSON.stringify(shouldPlaceAudio ? 'Orb Audio' : null) + ', ' +
        JSON.stringify(placeStart) + ', ' +
        JSON.stringify(anchorIdx) + ', ' +
        JSON.stringify(settings.width) + ', ' +
        JSON.stringify(settings.height) + ', ' +
        JSON.stringify(placeEnd) + ', ' +
        JSON.stringify(settings.durationSeconds) +
        ')',
      );
      if (!importResult.ok) throw new Error(importResult.error);
      const where = (placeStart != null)
        ? ('at the selected clip in-point (' + Number(placeStart).toFixed(2) + 's)')
        : 'at the CTI';
      const doneMessage = importResult.audioLayerName
        ? 'Done \u2014 placed "' + importResult.orbLayerName + '" (above) and "' + importResult.audioLayerName +
          '" (below) ' + where + '.'
        : 'Done \u2014 placed "' + importResult.orbLayerName + '" on the timeline ' + where + '.';
      resetExportSection(doneMessage);
    } catch (e) {
      resetExportSection('Export failed: ' + e.message);
    }
  });

  // ffmpeg path lives in Settings. Manual only; persisted under Documents/OrbReactor.
  function syncFfmpegUi() {
    const input = document.getElementById('ffmpegPathInput');
    const status = document.getElementById('ffmpegStatus');
    const found = resolveFfmpegPath();
    if (input) {
      input.value = state.ffmpegPath || '';
      const isWin = os.platform() === 'win32';
      input.placeholder = isWin
        ? 'e.g. C:\\ffmpeg\\bin\\ffmpeg.exe'
        : 'e.g. /usr/local/bin/ffmpeg or /opt/homebrew/bin/ffmpeg';
    }
    if (status) {
      if (found) {
        status.textContent = 'Using: ' + found;
        status.style.color = '';
      } else if (state.ffmpegPath) {
        status.textContent = 'This path does not run as ffmpeg. Check the path and try again.';
        status.style.color = 'var(--danger)';
      } else {
        status.textContent = 'Not set — H.264 export disabled until you paste a valid ffmpeg path.';
        status.style.color = 'var(--danger)';
      }
    }
    updateExportFormatUi();
  }
  setTimeout(function () {
    try { syncFfmpegUi(); } catch (e) { /* ignore */ }
  }, 200);
  const ffmpegInput = document.getElementById('ffmpegPathInput');
  if (ffmpegInput) {
    const commitPath = () => {
      const cleaned = savePersistedFfmpegPath(ffmpegInput.value);
      state.ffmpegPath = cleaned;
      ffmpegInput.value = cleaned;
      syncFfmpegUi();
    };
    ffmpegInput.addEventListener('change', commitPath);
    ffmpegInput.addEventListener('blur', commitPath);
  }
  const btnClearFfmpeg = document.getElementById('btnClearFfmpeg');
  if (btnClearFfmpeg) {
    btnClearFfmpeg.addEventListener('click', () => {
      state.ffmpegPath = '';
      savePersistedFfmpegPath('');
      syncFfmpegUi();
    });
  }
  const btnFfmpegHelp = document.getElementById('btnFfmpegHelp');
  const ffmpegHelpPanel = document.getElementById('ffmpegHelpPanel');
  if (btnFfmpegHelp && ffmpegHelpPanel) {
    btnFfmpegHelp.addEventListener('click', () => {
      ffmpegHelpPanel.classList.toggle('hidden');
    });
  }

    const loadingShell = document.getElementById('orbLoading');
    if (loadingShell) {
      loadingShell.classList.add('is-hidden');
      setTimeout(() => {
        if (loadingShell.parentNode) loadingShell.parentNode.removeChild(loadingShell);
      }, 120);
    }
  }

  // ---------------------------------------------------------------------
  // Trial locks: re-applied whenever the license status changes
  // (startup, key activated, key deactivated).
  // ---------------------------------------------------------------------
  function refreshTrialLocks() {
    const L = window.OrbLicense;
    if (!L) return;
    document.querySelectorAll('.preset-card').forEach((c) => {
      c.classList.toggle('lic-locked', !L.isStyleFree(c.dataset.style));
    });
    if (!L.isStyleFree(state.style)) selectStyle('siri');

    const voiceLocked = !L.isFull();
    const voiceSection = document.getElementById('tab-voice');
    const banner = document.getElementById('voiceLockBanner');
    if (banner) banner.classList.toggle('hidden', !voiceLocked);
    voiceSection.classList.toggle('lic-section-locked', voiceLocked);
    // If the license goes away while voice reactivity is on, switch it off.
    if (voiceLocked && state.reactiveEnabled) {
      reactiveEnabledEl.disabled = false;
      reactiveEnabledEl.click();
    }
    voiceSection.querySelectorAll('button, input, select, textarea').forEach((el) => {
      if (el.closest('#voiceLockBanner')) return;
      if (voiceLocked) {
        if (!el.disabled) { el.disabled = true; el.dataset.licDis = '1'; }
      } else if (el.dataset.licDis) {
        el.disabled = false;
        delete el.dataset.licDis;
      }
    });
  }
  const btnVoiceUnlock = document.getElementById('btnVoiceUnlock');
  if (btnVoiceUnlock) btnVoiceUnlock.addEventListener('click', () => {
    if (window.OrbLicense) window.OrbLicense.openDialog('license');
  });
  if (window.OrbLicense) window.OrbLicense.onChange(refreshTrialLocks);

  requestAnimationFrame(function () {
    bootOrbReactor();
  });
})();
