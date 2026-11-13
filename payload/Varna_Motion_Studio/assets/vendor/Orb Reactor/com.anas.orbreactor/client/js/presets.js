/* Ported from the original React/WebGPU app's src/presets.ts and src/orb-states.ts.
 * Pure data + pure functions, no rendering here. */
(function (global) {
  'use strict';

  const styleFlowIndexes = {
    siri: 9, voiceWave: 19, aurora: 10, plasma: 11, chrome: 12, opal: 13,
    spectrum: 14, frost: 15, blueDrop: 20, violetEmber: 21,
    refractiveBlob: 23, particleRibbon: 24, chromaticMetal: 22, particlesOrb: 25,
  };

  const styleNames = [
    'siri', 'voiceWave', 'particleRibbon', 'particlesOrb', 'blueDrop', 'violetEmber',
    'refractiveBlob', 'chromaticMetal', 'aurora', 'frost', 'chrome',
    'opal', 'spectrum', 'plasma',
  ];

  const basePreset = {
    glassEnabled: true, speed: 1, radius: 0.72, contourDeform: 0, bandDensity: 2,
    chromaticShift: 0.42, metalScale: 0.77, metalStretch: 0.23, metalAngle: 65,
    metalOffset: 0, metalPhase: 0, metalEvolution: 1, metalRoughness: 0.22,
    metalDepth: 0.25, particleCount: 720, particleDensity: 0.72, ribbonCount: 5, ribbonWidth: 0.42,
    ribbonTwist: 1.25, ribbonFold: 0.55, ribbonBreath: 0.3, particleSize: 1.2,
    particleBloom: 0.7, zoom: 0.3, warp: 3, ridgeAmt: 0.5, sharp: 2.2, shade: 0.3,
    sheen: 0.36, gloss: 0.28, glassOpacity: 0.42, shellMidAlpha: 0.2,
    shellEdgeAlpha: 0.22, exposure: 1, edgeSoftness: 0.005, edgeGlow: 0,
    colorA: '#F7FBFF', colorB: '#D6E8F7', colorC: '#A8C8F0', colorD: '#6F9EE8',
    highlightColor: '#FFFFFF', shellInner: '#FFFFFF', shellMid: '#D6E8F7',
    shellEdge: '#6F9EE8', sheenColor: '#EAF4FF', specColor: '#DCEAFF',
    canvasColor: '#000000', glowColor: '#6F9EE8',
  };

  function ext(overrides) { return Object.assign({}, basePreset, overrides); }

  const stylePresets = {
    siri: ext({ speed: 0.82, zoom: 0.36, warp: 3.2, ridgeAmt: 0.5, sharp: 2.2,
      shade: 0.12, sheen: 0.28, gloss: 0.24, glassOpacity: 0.44, shellMidAlpha: 0.18,
      shellEdgeAlpha: 0.18, exposure: 2, colorA: '#FFD86B', colorB: '#82F4FF',
      colorC: '#FF7BD5', colorD: '#8E6CFF', shellMid: '#9BF4FF', shellEdge: '#C5A9FF',
      canvasColor: '#030409', glowColor: '#956CFF' }),
    voiceWave: ext({ speed: 0.95, radius: 0.7, contourDeform: 0.1, zoom: 0.36,
      warp: 2.6, ridgeAmt: 0.46, shade: 0.08, sheen: 0.22, gloss: 0.36,
      glassOpacity: 0.48, shellMidAlpha: 0.18, shellEdgeAlpha: 0.2, exposure: 1.35,
      colorA: '#09030E', colorB: '#CE2CCB', colorC: '#FF5C71', colorD: '#7B53FF',
      highlightColor: '#FFD9F0', shellMid: '#E48BFF', shellEdge: '#FF7890',
      sheenColor: '#FFF1FA', specColor: '#E7D9FF', canvasColor: '#020105',
      glowColor: '#CE2CCB' }),
    aurora: ext({ speed: 3, contourDeform: 0.08, zoom: 0.4, warp: 4.2, ridgeAmt: 0.62,
      sharp: 2.1, shade: 0.18, exposure: 1.18, colorA: '#030816', colorB: '#20F0B6',
      colorC: '#32A8FF', colorD: '#A34BFF', shellMid: '#32A8FF', shellEdge: '#20F0B6',
      canvasColor: '#010207', glowColor: '#20F0B6' }),
    plasma: ext({ speed: 1.32, contourDeform: 0.05, zoom: 0.55, warp: 5.4,
      ridgeAmt: 0.78, sharp: 4.2, shade: 0.16, exposure: 1.25, colorA: '#06020E',
      colorB: '#0099FF', colorC: '#258BFF', colorD: '#1375FF', shellInner: '#FFFFFF',
      shellMid: '#1951C2', shellEdge: '#00E9FF', sheenColor: '#EAF4FF',
      specColor: '#DCEAFF', canvasColor: '#020105', glowColor: '#0099FF' }),
    chrome: ext({ speed: 2, zoom: 0.36, warp: 3.8, ridgeAmt: 0.44, sharp: 5.2,
      shade: 0.58, exposure: 1.08, colorA: '#FFFFFF', colorB: '#B9C0CA',
      colorC: '#343A43', colorD: '#030405', shellMid: '#B9C0CA', shellEdge: '#FFFFFF',
      canvasColor: '#050608', glowColor: '#FFFFFF' }),
    opal: ext({ speed: 1.5, zoom: 0.3, warp: 2.8, ridgeAmt: 0.36, sharp: 2, shade: 0.1,
      sheen: 0.3, gloss: 0.26, glassOpacity: 0.38, shellMidAlpha: 0.2,
      shellEdgeAlpha: 0.2, exposure: 1.12, colorA: '#FFF6E8', colorB: '#6EF2CF',
      colorC: '#FF91D8', colorD: '#756BFF', shellMid: '#CDE5FF', shellEdge: '#D9C8FF',
      canvasColor: '#07080D', glowColor: '#9E8CFF' }),
    spectrum: ext({ speed: 1.8, contourDeform: 0.03, zoom: 0.46, warp: 4.4,
      ridgeAmt: 0.72, shade: 0.06, sheen: 0.26, gloss: 0.24, glassOpacity: 0.4,
      shellMidAlpha: 0.18, shellEdgeAlpha: 0.18, exposure: 1.5, colorA: '#FFFFFF',
      colorB: '#1677FF', colorC: '#F249A0', colorD: '#35E6B2', shellMid: '#66E8FF',
      shellEdge: '#D26CFF', canvasColor: '#03040A', glowColor: '#1677FF' }),
    frost: ext({ speed: 2.22, contourDeform: 0.04, zoom: 0.36, warp: 3.7,
      ridgeAmt: 0.45, sharp: 2.05, shade: 0.3, sheen: 0.34, gloss: 0.28,
      glassOpacity: 0.42, shellMidAlpha: 0.2, shellEdgeAlpha: 0.22, exposure: 1,
      colorA: '#F7FBFF', colorB: '#D6E8F7', colorC: '#A8C8F0', colorD: '#6F9EE8',
      shellMid: '#D6E8F7', shellEdge: '#6F9EE8', canvasColor: '#000000',
      glowColor: '#6F9EE8' }),
    blueDrop: ext({ speed: 0.9, radius: 0.74, contourDeform: 0.08, zoom: 0.48,
      warp: 2.65, ridgeAmt: 0.42, sharp: 2.4, shade: 0.16, sheen: 0.22, gloss: 0.42,
      glassOpacity: 0.66, shellMidAlpha: 0.32, shellEdgeAlpha: 0.24, exposure: 1.24,
      colorA: '#020B1D', colorB: '#0756B8', colorC: '#1EC8FF', colorD: '#DDFBFF',
      highlightColor: '#EAFBFF', shellInner: '#F6FDFF', shellMid: '#4FD7FF',
      shellEdge: '#466DFF', sheenColor: '#DDFBFF', specColor: '#A8D9FF',
      canvasColor: '#010207', glowColor: '#168DFF' }),
    violetEmber: ext({ speed: 1.12, radius: 0.72, contourDeform: 0.04, zoom: 0.58,
      warp: 4.7, ridgeAmt: 0.73, sharp: 3.3, shade: 0.18, sheen: 0.2, gloss: 0.34,
      glassOpacity: 0.62, shellMidAlpha: 0.28, shellEdgeAlpha: 0.24, exposure: 1.28,
      colorA: '#100016', colorB: '#4A0E8F', colorC: '#A52EFF', colorD: '#F1A7FF',
      highlightColor: '#FFD6FF', shellInner: '#FCF5FF', shellMid: '#C257FF',
      shellEdge: '#6C2DFF', sheenColor: '#F8E6FF', specColor: '#D4B7FF',
      canvasColor: '#030006', glowColor: '#A52EFF' }),
    particlesOrb: ext({ speed: 0.75, radius: 0.90, particleCount: 720, particleDensity: 0.92,
      particleSize: 1.25, particleBloom: 0.9, edgeGlow: 0.65, exposure: 1.0,
      colorA: '#F0ABFC', colorB: '#818CF8', colorC: '#818CF8', colorD: '#F0ABFC',
      highlightColor: '#FFFFFF', glowColor: '#A78BFA', canvasColor: '#000000' }),
    refractiveBlob: ext({ speed: 0.76, radius: 0.73, contourDeform: 0.16, zoom: 0.46,
      warp: 3.65, ridgeAmt: 0.58, sharp: 2.7, shade: 0.14, sheen: 0.14, gloss: 0.52,
      glassOpacity: 0.82, shellMidAlpha: 0.42, shellEdgeAlpha: 0.2, exposure: 1.2,
      colorA: '#1B102B', colorB: '#7056A8', colorC: '#BFA5F5', colorD: '#F1E8FF',
      highlightColor: '#FFFFFF', shellInner: '#F6F0FF', shellMid: '#D9C7FF',
      shellEdge: '#B59AE8', sheenColor: '#FFFFFF', specColor: '#E9DEFF',
      canvasColor: '#050208', glowColor: '#B18CFF' }),
    particleRibbon: ext({ glassEnabled: true, speed: 0.72, radius: 0.66,
      particleDensity: 1, ribbonCount: 4, ribbonWidth: 0.48, ribbonTwist: 1.15,
      ribbonFold: 0.6, ribbonBreath: 0.38, particleSize: 1.12, particleBloom: 1.22,
      shade: 0.12, sheen: 0.28, gloss: 0.24, glassOpacity: 0.44, shellMidAlpha: 0.18,
      shellEdgeAlpha: 0.18, exposure: 1.48, colorA: '#63F1FF', colorB: '#4A9DFF',
      colorC: '#8566FF', colorD: '#F15DE1', highlightColor: '#F5FBFF',
      shellInner: '#FFFFFF', shellMid: '#9BF4FF', shellEdge: '#C5A9FF',
      sheenColor: '#EAF4FF', specColor: '#DCEAFF', canvasColor: '#010208',
      glowColor: '#765CFF' }),
    chromaticMetal: ext({ speed: 1.12, radius: 0.72, bandDensity: 2,
      chromaticShift: 0.42, metalScale: 0.77, metalStretch: 0.23, metalAngle: 65,
      metalOffset: 0, metalPhase: 0, metalEvolution: 1, metalRoughness: 0.16,
      metalDepth: 0.38, shade: 0.1, sheen: 0.14, gloss: 0.46, glassOpacity: 0.54,
      shellMidAlpha: 0.2, shellEdgeAlpha: 0.16, exposure: 1.08, colorA: '#FBFCFB',
      colorB: '#7F8683', colorC: '#D6DAD8', colorD: '#33373A',
      highlightColor: '#FFFFFF', shellInner: '#F7FCFF', shellMid: '#6EDCFF',
      shellEdge: '#FF806D', sheenColor: '#F7FCFF', specColor: '#D9F3FF',
      canvasColor: '#050606', glowColor: '#BDEFFF' }),
  };

  // ---- idle-state (subdued) derivations, keyed by style ----------------
  const idleProfilesByStyle = {
    siri: { numeric: { radius: 0.85, speed: 0.3, contourDeform: 0.3, zoom: 0.94, warp: 0.52, ridgeAmt: 0.48, sharp: 0.9, exposure: 0.68 },
      colors: { colorA: '#B5A674', colorB: '#5E8794', colorC: '#9A648A', colorD: '#635B8A', highlightColor: '#B6C4D2', glowColor: '#6C688F' } },
    voiceWave: { numeric: { radius: 0.85, speed: 0.28, contourDeform: 0.3, zoom: 0.92, warp: 0.46, ridgeAmt: 0.42, exposure: 0.62 },
      colors: { colorA: '#08050B', colorB: '#6A2F69', colorC: '#8C4652', colorD: '#55467F', highlightColor: '#B58AA5', glowColor: '#6C3E72' } },
    blueDrop: { numeric: { radius: 0.85, speed: 0.3, contourDeform: 0.35, zoom: 0.93, warp: 0.5, ridgeAmt: 0.46, sharp: 0.82, exposure: 0.66 },
      colors: { colorA: '#020812', colorB: '#0A2C5A', colorC: '#24678A', colorD: '#A4C3CA', highlightColor: '#9FC8D5', glowColor: '#1F5076' } },
    violetEmber: { numeric: { radius: 0.85, speed: 0.28, contourDeform: 0.3, zoom: 0.92, warp: 0.46, ridgeAmt: 0.42, sharp: 0.78, exposure: 0.64 },
      colors: { colorA: '#0B0310', colorB: '#2B1748', colorC: '#593078', colorD: '#9B78A8', highlightColor: '#BCA6C2', glowColor: '#593273' } },
    particlesOrb: { numeric: { radius: 0.90, speed: 0.36, particleDensity: 0.88, particleSize: 0.92, particleBloom: 0.35, exposure: 0.72 },
      colors: { colorA: '#4D3852', colorB: '#3B4B86', colorC: '#4D3852', colorD: '#3B4B86', highlightColor: '#AFA4C0', glowColor: '#554C78' } },
    refractiveBlob: { numeric: { radius: 0.85, speed: 0.3, contourDeform: 0.32, zoom: 0.94, warp: 0.5, ridgeAmt: 0.44, sharp: 0.82, exposure: 0.68 },
      colors: { colorA: '#0F0B16', colorB: '#403552', colorC: '#776990', colorD: '#AEA4BD', highlightColor: '#C9C4D1', glowColor: '#6E6185' } },
    particleRibbon: { numeric: { radius: 0.85, speed: 0.28, ribbonWidth: 0.62, ribbonTwist: 0.42, ribbonFold: 0.35, ribbonBreath: 0.18, exposure: 0.68 },
      colors: { colorA: '#3A6068', colorB: '#375D78', colorC: '#594E83', colorD: '#854C7A', highlightColor: '#B9CCD1', glowColor: '#514C78' } },
    chromaticMetal: { numeric: { radius: 0.85, speed: 0.3, bandDensity: 0.62, chromaticShift: 0.35, metalStretch: 0.48, metalEvolution: 0.32, metalRoughness: 1.35, metalDepth: 0.55, exposure: 0.72 },
      colors: { colorA: '#B8BCBA', colorB: '#666B69', colorC: '#9EA3A1', colorD: '#282B2D', highlightColor: '#D1D5D3', glowColor: '#78898F' } },
    aurora: { numeric: { radius: 0.85, speed: 0.22, contourDeform: 0.3, zoom: 0.92, warp: 0.42, ridgeAmt: 0.38, sharp: 0.85, exposure: 0.62 },
      colors: { colorA: '#02050C', colorB: '#1D6659', colorC: '#285D78', colorD: '#533E75', highlightColor: '#92B6B3', glowColor: '#286A62' } },
    frost: { numeric: { radius: 0.85, speed: 0.26, contourDeform: 0.28, zoom: 0.94, warp: 0.5, ridgeAmt: 0.46, sharp: 0.78, exposure: 0.72 },
      colors: { colorA: '#C3CDD5', colorB: '#9AABB8', colorC: '#768D9E', colorD: '#536985', highlightColor: '#D6DEE5', glowColor: '#697D91' } },
    chrome: { numeric: { radius: 0.85, speed: 0.28, contourDeform: 0.35, zoom: 0.92, warp: 0.48, sharp: 0.74, exposure: 0.72 },
      colors: { colorA: '#A7AAA9', colorB: '#6E7273', colorC: '#363A3D', colorD: '#101213', highlightColor: '#CBCFCE', glowColor: '#747A7B' } },
    opal: { numeric: { radius: 0.85, speed: 0.3, contourDeform: 0.32, zoom: 0.94, warp: 0.52, ridgeAmt: 0.48, exposure: 0.68 },
      colors: { colorA: '#C9C3BC', colorB: '#6E9E91', colorC: '#A17496', colorD: '#68608E', highlightColor: '#E1DCD5', glowColor: '#82799B' } },
    spectrum: { numeric: { radius: 0.85, speed: 0.27, contourDeform: 0.3, zoom: 0.92, warp: 0.44, ridgeAmt: 0.38, exposure: 0.62 },
      colors: { colorA: '#B4BBC2', colorB: '#285D8F', colorC: '#91506F', colorD: '#3F8873', highlightColor: '#D8DDE1', glowColor: '#386789' } },
    plasma: { numeric: { radius: 0.85, speed: 0.26, contourDeform: 0.28, zoom: 0.9, warp: 0.42, ridgeAmt: 0.36, sharp: 0.68, exposure: 0.6 },
      colors: { colorA: '#04020A', colorB: '#084772', colorC: '#1C5790', colorD: '#174B84', highlightColor: '#A5BBD0', glowColor: '#14577F' } },
  };

  const numericProfileKeys = ['speed', 'radius', 'contourDeform', 'bandDensity', 'chromaticShift',
    'metalStretch', 'metalEvolution', 'metalRoughness', 'metalDepth', 'ribbonWidth',
    'ribbonTwist', 'ribbonFold', 'ribbonBreath', 'zoom', 'warp', 'ridgeAmt', 'sharp',
    'shade', 'exposure', 'edgeGlow'];
  const colorProfileKeys = ['colorA', 'colorB', 'colorC', 'colorD', 'highlightColor', 'glowColor'];

  function createIdleParams(style, thinkingParams) {
    const idle = Object.assign({}, thinkingParams);
    const profile = idleProfilesByStyle[style];
    if (!profile) return idle;
    for (const key of numericProfileKeys) {
      if (profile.numeric[key] !== undefined) {
        idle[key] = thinkingParams[key] * profile.numeric[key];
      }
    }
    for (const key of colorProfileKeys) {
      if (profile.colors[key] !== undefined) idle[key] = profile.colors[key];
    }
    return idle;
  }

  function parseHexColor(hex) {
    return [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
    ];
  }
  function srgbToLinear(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function linearToSrgb(v) { return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; }
  function mixHexColor(from, to, progress) {
    if (progress <= 0) return from;
    if (progress >= 1) return to;
    const a = parseHexColor(from), b = parseHexColor(to);
    const mixed = a.map((c, i) => {
      const lin = srgbToLinear(c) + (srgbToLinear(b[i]) - srgbToLinear(c)) * progress;
      return Math.min(255, Math.max(0, Math.round(linearToSrgb(lin) * 255)));
    });
    return '#' + mixed.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  function smoothProgress(p) { const c = Math.min(1, Math.max(0, p)); return c * c * (3 - 2 * c); }
  function activeProgress(p) { const c = Math.min(1, Math.max(0, p)); return 1 - Math.pow(1 - c, 3); }

  function interpolateParams(from, to, progress) {
    const c = Math.min(1, Math.max(0, progress));
    if (c <= 0) return Object.assign({}, from);
    if (c >= 1) return Object.assign({}, to);
    const result = Object.assign({}, to);
    for (const key of numericProfileKeys) result[key] = from[key] + (to[key] - from[key]) * c;
    for (const key of colorProfileKeys) result[key] = mixHexColor(from[key], to[key], c);
    return result;
  }

  // A small state machine mirroring createOrbTransitionController from orb-states.ts,
  // driven either by manual idle/thinking toggling or by the audio envelope.
  function createTransitionController(style, thinkingParams, activationDuration, transitionDuration) {
    const idleParams = createIdleParams(style, thinkingParams);
    let state = 'idle';
    let from = Object.assign({}, idleParams);
    let target = Object.assign({}, idleParams);
    let targetState = 'idle';
    let startedAt = 0;
    let duration = 0;

    function currentParams(nowSec) {
      if (duration === 0) return Object.assign({}, target);
      const elapsed = Math.max(0, nowSec - startedAt);
      const raw = elapsed / duration;
      const progress = targetState === 'thinking' ? activeProgress(raw) : smoothProgress(raw);
      return interpolateParams(from, target, progress);
    }

    return {
      setState(nextState, nowSec) {
        if (nextState !== state) {
          from = currentParams(nowSec);
          target = nextState === 'thinking' ? thinkingParams : idleParams;
          targetState = nextState;
          startedAt = nowSec;
          duration = Math.max(0, nextState === 'thinking' ? activationDuration : transitionDuration);
          state = nextState;
        }
      },
      sample(nowSec) { return currentParams(nowSec); },
      get state() { return state; },
    };
  }

  global.OrbPresets = {
    styleFlowIndexes, styleNames, basePreset, stylePresets, idleProfilesByStyle,
    numericProfileKeys, colorProfileKeys,
    createIdleParams, interpolateParams, createTransitionController,
    smoothProgress, activeProgress,
  };
})(window);
