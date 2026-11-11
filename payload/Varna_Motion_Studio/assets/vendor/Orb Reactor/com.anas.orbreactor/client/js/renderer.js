/* WebGL2 port of the WebGPU orb renderer (src/orb-renderer.ts).
 *
 * Each preset gets its OWN small fragment shader program (see
 * client/shader/presets/orb-lib.<style>.frag), compiled lazily the first time
 * it's actually needed, instead of one giant shader containing all 13
 * presets' code. That mega-shader was the main cause of very slow panel
 * start-up (large branchy shaders are expensive to compile/optimize) - a
 * lean, single-preset shader compiles far faster.
 *
 * particleRibbon renders in two passes onto the same framebuffer: first the
 * normal orb program (which, for that style, intentionally paints only the
 * glass shell/rim - no fill color, see glsPresetFluid in that variant),
 * then the instanced particle pass blended on top. Previously these were
 * mutually exclusive, which is why that preset had no visible glass shell. */
(function (global) {
  'use strict';

  const UNIFORM_FLOAT_FIELDS = [
    'time', 'speed', 'radius', 'zoom', 'warp', 'ridgeAmt', 'sharp', 'shade',
    'sheen', 'gloss', 'shellMidAlpha', 'shellEdgeAlpha', 'exposure', 'style',
    'edgeSoftness', 'edgeGlow', 'paletteCount', 'glassEnabled', 'glassOpacity',
    'contourDeform', 'bandDensity', 'chromaticShift', 'metalScale', 'metalStretch',
    'metalAngle', 'metalOffset', 'metalPhase', 'metalEvolution', 'metalRoughness',
    'metalDepth', 'particleDensity', 'ribbonCount', 'ribbonWidth', 'ribbonTwist',
    'ribbonFold', 'ribbonBreath', 'particleSize', 'particleBloom',
  ];
  const UNIFORM_VEC4_FIELDS = [
    'colorA', 'colorB', 'colorC', 'colorD', 'highlightColor', 'shellInner',
    'shellMid', 'shellEdge', 'sheenColor', 'specColor', 'canvasColor', 'glowColor',
  ];

  function hexToRgba(hex) {
    return [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
      1,
    ];
  }

  /**
   * Edge glow (and particle bloom) extend past the core radius. Treat that
   * halo as part of the orb's total footprint: shrink the core so the full
   * glow always fits inside the framebuffer at any output resolution.
   *
   * Pad from the *design* edge glow (slider value), not the live reactive
   * interpolated edgeGlow. Voice reactivity drives edgeGlow near 0 at silence
   * and full while talking — padding from the live value would grow the pad
   * only during talking and cancel the idle→talk radius scale reaction.
   */
  function effectiveRadius(params) {
    const r = Math.max(0.05, params.radius != null ? params.radius : 0.72);
    const glow = Math.max(0,
      params.designEdgeGlow != null ? params.designEdgeGlow : (params.edgeGlow || 0));
    const bloom = Math.max(0,
      params.designParticleBloom != null ? params.designParticleBloom : (params.particleBloom || 0));
    // edgeGlow 0→2 ≈ up to ~18% shrink; bloom adds a little more for particles.
    const pad = Math.min(0.28, glow * 0.09 + bloom * 0.035);
    return r * (1 - pad);
  }

  function compileShader(gl, type, source, label) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile error (' + label + '):\n' + log);
    }
    return shader;
  }

  function linkProgram(gl, vertexShader, fsSource, label) {
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource, label + ' fragment');
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      throw new Error('Program link error (' + label + '):\n' + log);
    }
    gl.deleteShader(fs);
    return program;
  }

  class OrbRenderer {
    constructor(canvas, sources) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        preserveDrawingBuffer: true,
      });
      if (!gl) throw new Error('WebGL2 is not available in this build of CEP.');
      this.gl = gl;
      this._sources = sources;

      this.sharedVertexShader = compileShader(gl, gl.VERTEX_SHADER, sources.fullscreenVert, 'fullscreen');

      // One lean program per preset, compiled lazily. See ensureStyle().
      this.orbPrograms = {};
      this.orbUniformLocations = {};

      this.ribbonProgram = null;
      this.ribbonUniformLocations = null;
      this._ribbonFailed = false;

      this.particlesOrbProgram = null;
      this.particlesOrbUniformLocations = null;
      this._particlesOrbFailed = false;

      this.vao = gl.createVertexArray();

      // Particle budget: reduced from the source app's 384x96x(up to 6 layers).
      this.uSegments = 176;
      this.vSegments = 44;
    }

    /** Compiles the program for one preset if it isn't already, synchronously.
     *  Safe to call ahead of time to "warm up" a preset before it's selected. */
    ensureStyle(styleName) {
      // particlesOrb is rendered by its instanced particle program, not the
      // regular fullscreen fluid shader.
      if (styleName === 'particlesOrb') return;
      if (this.orbPrograms[styleName]) return;
      const src = this._sources.orbLibByStyle[styleName];
      if (!src) throw new Error('No shader source registered for style: ' + styleName);
      const program = linkProgram(this.gl, this.sharedVertexShader, src, styleName);
      this.orbPrograms[styleName] = program;
      this.orbUniformLocations[styleName] = this._locateUniforms(program);
    }

    _ensureRibbonProgram() {
      if (this.ribbonProgram || this._ribbonFailed) return;
      try {
        const vs = compileShader(this.gl, this.gl.VERTEX_SHADER, this._sources.ribbonVert, 'ribbon vertex');
        this.ribbonProgram = linkProgram(this.gl, vs, this._sources.ribbonFrag, 'ribbon');
        this.gl.deleteShader(vs);
        this.ribbonUniformLocations = this._locateRibbonUniforms(this.ribbonProgram);
      } catch (e) {
        console.error('Particle ribbon shader failed to build; particles will be skipped.', e);
        this._ribbonFailed = true;
      }
    }

    _locateUniforms(program) {
      const gl = this.gl;
      const loc = {};
      loc.size = gl.getUniformLocation(program, 'u.size');
      for (const f of UNIFORM_FLOAT_FIELDS) loc[f] = gl.getUniformLocation(program, 'u.' + f);
      for (const f of UNIFORM_VEC4_FIELDS) loc[f] = gl.getUniformLocation(program, 'u.' + f);
      loc.paletteStops = [];
      for (let i = 0; i < 12; i++) {
        loc.paletteStops.push(gl.getUniformLocation(program, 'u.paletteStop' + i));
      }
      return loc;
    }

    _ensureParticlesOrbProgram() {
      if (this.particlesOrbProgram || this._particlesOrbFailed) return;
      try {
        const vs = compileShader(this.gl, this.gl.VERTEX_SHADER, this._sources.particlesOrbVert, 'particles orb vertex');
        this.particlesOrbProgram = linkProgram(this.gl, vs, this._sources.particlesOrbFrag, 'particles orb');
        this.gl.deleteShader(vs);
        const gl = this.gl;
        this.particlesOrbUniformLocations = {
          size: gl.getUniformLocation(this.particlesOrbProgram, 'uSize'),
          time: gl.getUniformLocation(this.particlesOrbProgram, 'uTime'),
          speed: gl.getUniformLocation(this.particlesOrbProgram, 'uSpeed'),
          radius: gl.getUniformLocation(this.particlesOrbProgram, 'uRadius'),
          particleCount: gl.getUniformLocation(this.particlesOrbProgram, 'uParticleCount'),
          particleDensity: gl.getUniformLocation(this.particlesOrbProgram, 'uParticleDensity'),
          particleSize: gl.getUniformLocation(this.particlesOrbProgram, 'uParticleSize'),
          particleBloom: gl.getUniformLocation(this.particlesOrbProgram, 'uParticleBloom'),
          exposure: gl.getUniformLocation(this.particlesOrbProgram, 'uExposure'),
          colorA: gl.getUniformLocation(this.particlesOrbProgram, 'uColorA'),
          colorB: gl.getUniformLocation(this.particlesOrbProgram, 'uColorB'),
          edgeGlow: gl.getUniformLocation(this.particlesOrbProgram, 'uEdgeGlow'),
          glowColor: gl.getUniformLocation(this.particlesOrbProgram, 'uGlowColor'),
          userRotX: gl.getUniformLocation(this.particlesOrbProgram, 'uUserRotX'),
          userRotY: gl.getUniformLocation(this.particlesOrbProgram, 'uUserRotY'),
        };
      } catch (e) {
        console.error('Particles Orb shader failed to build; particles will be skipped.', e);
        this._particlesOrbFailed = true;
      }
    }

    _drawParticlesOrb(width, height, shaderTime, params) {
      this._ensureParticlesOrbProgram();
      if (!this.particlesOrbProgram) return;
      const gl = this.gl;
      const loc = this.particlesOrbUniformLocations;
      gl.useProgram(this.particlesOrbProgram);
      gl.uniform2f(loc.size, width, height);
      gl.uniform1f(loc.time, shaderTime);
      gl.uniform1f(loc.speed, params.speed);
      gl.uniform1f(loc.radius, effectiveRadius(params));
      gl.uniform1f(loc.particleCount, Math.min(1200, Math.max(100, Math.round(params.particleCount || 720))));
      gl.uniform1f(loc.particleDensity, params.particleDensity);
      gl.uniform1f(loc.particleSize, params.particleSize);
      gl.uniform1f(loc.particleBloom, params.particleBloom);
      gl.uniform1f(loc.exposure, params.exposure);
      gl.uniform4fv(loc.colorA, hexToRgba(params.colorA));
      gl.uniform4fv(loc.colorB, hexToRgba(params.colorB));
      gl.uniform1f(loc.edgeGlow, params.edgeGlow);
      const glow = hexToRgba(params.glowColor);
      gl.uniform4fv(loc.glowColor, glow);
      gl.uniform1f(loc.userRotX, params.ribbonUserRotX || 0);
      gl.uniform1f(loc.userRotY, params.ribbonUserRotY || 0);

      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, Math.min(1200, Math.max(100, Math.round(params.particleCount || 720))));
      gl.disable(gl.BLEND);
    }

    _locateRibbonUniforms(program) {
      const gl = this.gl;
      return {
        size: gl.getUniformLocation(program, 'u.size'),
        time: gl.getUniformLocation(program, 'u.time'),
        speed: gl.getUniformLocation(program, 'u.speed'),
        radius: gl.getUniformLocation(program, 'u.radius'),
        ribbonWidth: gl.getUniformLocation(program, 'u.ribbonWidth'),
        ribbonTwist: gl.getUniformLocation(program, 'u.ribbonTwist'),
        ribbonFold: gl.getUniformLocation(program, 'u.ribbonFold'),
        ribbonBreath: gl.getUniformLocation(program, 'u.ribbonBreath'),
        particleSize: gl.getUniformLocation(program, 'u.particleSize'),
        particleBloom: gl.getUniformLocation(program, 'u.particleBloom'),
        particleDensity: gl.getUniformLocation(program, 'u.particleDensity'),
        shade: gl.getUniformLocation(program, 'u.shade'),
        colorA: gl.getUniformLocation(program, 'u.colorA'),
        colorB: gl.getUniformLocation(program, 'u.colorB'),
        colorC: gl.getUniformLocation(program, 'u.colorC'),
        colorD: gl.getUniformLocation(program, 'u.colorD'),
        highlightColor: gl.getUniformLocation(program, 'u.highlightColor'),
        layerCount: gl.getUniformLocation(program, 'uLayerCount'),
        uSegments: gl.getUniformLocation(program, 'uUSegments'),
        vSegments: gl.getUniformLocation(program, 'uVSegments'),
        userRotX: gl.getUniformLocation(program, 'uUserRotX'),
        userRotY: gl.getUniformLocation(program, 'uUserRotY'),
        exposure: gl.getUniformLocation(program, 'uExposure'),
        particleBloomF: gl.getUniformLocation(program, 'uParticleBloom'),
        edgeGlow: gl.getUniformLocation(program, 'uEdgeGlow'),
        glowColor: gl.getUniformLocation(program, 'uGlowColor'),
      };
    }

    resize(width, height) {
      const canvas = this.canvas;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    _applyOrbUniforms(loc, width, height, shaderTime, params) {
      const gl = this.gl;
      gl.uniform2f(loc.size, width, height);
      gl.uniform1f(loc.time, shaderTime);
      gl.uniform1f(loc.speed, params.speed);
      gl.uniform1f(loc.radius, effectiveRadius(params));
      gl.uniform1f(loc.zoom, params.zoom);
      gl.uniform1f(loc.warp, params.warp);
      gl.uniform1f(loc.ridgeAmt, params.ridgeAmt);
      gl.uniform1f(loc.sharp, params.sharp);
      gl.uniform1f(loc.shade, params.shade);
      gl.uniform1f(loc.sheen, params.sheen);
      gl.uniform1f(loc.gloss, params.gloss);
      gl.uniform1f(loc.shellMidAlpha, params.shellMidAlpha);
      gl.uniform1f(loc.shellEdgeAlpha, params.shellEdgeAlpha);
      gl.uniform1f(loc.exposure, params.exposure);
      gl.uniform1f(loc.style, global.OrbPresets.styleFlowIndexes[params.style]);
      gl.uniform1f(loc.edgeSoftness, params.edgeSoftness);
      gl.uniform1f(loc.edgeGlow, params.edgeGlow);
      gl.uniform1f(loc.paletteCount, params.paletteCount || 0);
      gl.uniform1f(loc.glassEnabled, params.glassEnabled ? 1 : 0);
      gl.uniform1f(loc.glassOpacity, params.glassOpacity);
      gl.uniform1f(loc.contourDeform, params.contourDeform);
      gl.uniform1f(loc.bandDensity, params.bandDensity);
      gl.uniform1f(loc.chromaticShift, params.chromaticShift);
      gl.uniform1f(loc.metalScale, params.metalScale);
      gl.uniform1f(loc.metalStretch, params.metalStretch);
      gl.uniform1f(loc.metalAngle, params.metalAngle);
      gl.uniform1f(loc.metalOffset, params.metalOffset);
      gl.uniform1f(loc.metalPhase, params.metalPhase);
      gl.uniform1f(loc.metalEvolution, params.metalEvolution);
      gl.uniform1f(loc.metalRoughness, params.metalRoughness);
      gl.uniform1f(loc.metalDepth, params.metalDepth);
      gl.uniform1f(loc.particleDensity, params.particleDensity);
      gl.uniform1f(loc.ribbonCount, params.ribbonCount);
      gl.uniform1f(loc.ribbonWidth, params.ribbonWidth);
      gl.uniform1f(loc.ribbonTwist, params.ribbonTwist);
      gl.uniform1f(loc.ribbonFold, params.ribbonFold);
      gl.uniform1f(loc.ribbonBreath, params.ribbonBreath);
      gl.uniform1f(loc.particleSize, params.particleSize);
      gl.uniform1f(loc.particleBloom, params.particleBloom);

      for (const f of UNIFORM_VEC4_FIELDS) {
        gl.uniform4fv(loc[f], hexToRgba(params[f]));
      }
      const stops = params.paletteStops || [];
      for (let i = 0; i < 12; i++) {
        gl.uniform4fv(loc.paletteStops[i], hexToRgba(stops[i] || '#6F9EE8'));
      }
    }

    /** Renders exactly one frame at the given shaderTime/params. Deterministic;
     *  safe to call repeatedly with arbitrary times for offline export. */
    renderFrame(width, height, shaderTime, params) {
      const gl = this.gl;
      this.resize(width, height);
      gl.viewport(0, 0, width, height);
      gl.bindVertexArray(this.vao);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (params.style === 'particlesOrb') {
        this._drawParticlesOrb(width, height, shaderTime, params);
        return;
      }

      this.ensureStyle(params.style);

      // Base pass: fluid fill + glass shell for every preset. For
      // particleRibbon this variant's glsPresetFluid deliberately returns
      // black/zero fill, so only the shell/rim shows through here - the
      // particles get composited on top right after.
      gl.disable(gl.BLEND);
      gl.useProgram(this.orbPrograms[params.style]);
      this._applyOrbUniforms(this.orbUniformLocations[params.style], width, height, shaderTime, params);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (params.style === 'particleRibbon') {
        this._ensureRibbonProgram();
        if (this.ribbonProgram) {
          this._drawRibbonOverlay(width, height, shaderTime, params);
        }
      }
    }

    _drawRibbonOverlay(width, height, shaderTime, params) {
      const gl = this.gl;
      gl.useProgram(this.ribbonProgram);
      const loc = this.ribbonUniformLocations;
      gl.uniform2f(loc.size, width, height);
      gl.uniform1f(loc.time, shaderTime);
      gl.uniform1f(loc.speed, params.speed);
      gl.uniform1f(loc.radius, effectiveRadius(params));
      gl.uniform1f(loc.ribbonWidth, params.ribbonWidth);
      gl.uniform1f(loc.ribbonTwist, params.ribbonTwist);
      gl.uniform1f(loc.ribbonFold, params.ribbonFold);
      gl.uniform1f(loc.ribbonBreath, params.ribbonBreath);
      gl.uniform1f(loc.particleSize, params.particleSize);
      gl.uniform1f(loc.particleBloom, params.particleBloom);
      gl.uniform1f(loc.particleDensity, params.particleDensity);
      gl.uniform1f(loc.shade, params.shade);
      gl.uniform4fv(loc.colorA, hexToRgba(params.colorA));
      gl.uniform4fv(loc.colorB, hexToRgba(params.colorB));
      gl.uniform4fv(loc.colorC, hexToRgba(params.colorC));
      gl.uniform4fv(loc.colorD, hexToRgba(params.colorD));
      gl.uniform4fv(loc.highlightColor, hexToRgba(params.highlightColor));
      gl.uniform1f(loc.layerCount, Math.min(6, Math.max(2, Math.round(params.ribbonCount))));
      gl.uniform1f(loc.uSegments, this.uSegments);
      gl.uniform1f(loc.vSegments, this.vSegments);
      gl.uniform1f(loc.userRotX, params.ribbonUserRotX || 0);
      gl.uniform1f(loc.userRotY, params.ribbonUserRotY || 0);
      gl.uniform1f(loc.exposure, params.exposure);
      gl.uniform1f(loc.particleBloomF, params.particleBloom);
      gl.uniform1f(loc.edgeGlow, params.edgeGlow);
      const glow = hexToRgba(params.glowColor);
      gl.uniform3f(loc.glowColor, glow[0], glow[1], glow[2]);

      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const layers = Math.min(6, Math.max(2, Math.round(params.ribbonCount)));
      const instanceCount = layers * this.uSegments * this.vSegments;
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, instanceCount);
      gl.disable(gl.BLEND);
    }

    dispose() {
      const gl = this.gl;
      for (const key of Object.keys(this.orbPrograms)) gl.deleteProgram(this.orbPrograms[key]);
      if (this.ribbonProgram) gl.deleteProgram(this.ribbonProgram);
      if (this.particlesOrbProgram) gl.deleteProgram(this.particlesOrbProgram);
      gl.deleteShader(this.sharedVertexShader);
      gl.deleteVertexArray(this.vao);
    }
  }

  global.OrbRenderer = OrbRenderer;
})(window);
