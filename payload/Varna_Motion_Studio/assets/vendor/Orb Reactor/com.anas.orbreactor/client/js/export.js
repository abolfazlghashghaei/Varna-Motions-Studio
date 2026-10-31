/* Renders the exact same procedural animation the live preview shows, frame
 * by frame, at whatever frame rate the target AE composition uses.
 * Deterministic: uses idealized per-frame dt instead of real elapsed time, so
 * the result matches the live preview played back at that frame rate - not
 * whatever the panel happened to manage in real time.
 *
 * Two output modes:
 *  - 'sequence': one PNG per frame (straight alpha), via canvas.toBlob.
 *  - 'mp4': raw RGBA frames are piped straight into ffmpeg's stdin (no PNG
 *    encode/decode round-trip at all - this is what makes it fast), and
 *    ffmpeg encodes H.264 directly. H.264 has no alpha channel, so frames are
 *    composited onto a solid background color first. */
(function (global) {
  'use strict';

  function pad(n, width) { return String(n).padStart(width, '0'); }

  async function canvasToPngBuffer(canvas) {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    });
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /** Reads the WebGL2 canvas's drawing buffer straight into a Uint8Array,
   *  flips it top-to-bottom (GL rows are bottom-up), and composites it onto
   *  a solid background. The framebuffer stores *premultiplied* alpha
   *  (shaders write `vec4(color * a, a)` and additive particle passes blend
   *  with ONE/ONE), so the correct over-operator is:
   *    out = src.rgb + bg * (1 - src.a)
   *  The previous straight-alpha formula (`src * a + bg * (1-a)`) double-
   *  multiplied RGB and crushed brightness/glow on particleRibbon / particlesOrb
   *  H.264 exports while PNG (which keeps the raw buffer) still looked right. */
  function readCompositedRgba(gl, width, height, bgColor) {
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    const out = new Uint8Array(width * height * 4);
    const br = bgColor[0], bgc = bgColor[1], bb = bgColor[2];
    const rowBytes = width * 4;
    for (let y = 0; y < height; y++) {
      const srcRow = (height - 1 - y) * rowBytes; // flip vertically
      const dstRow = y * rowBytes;
      for (let x = 0; x < width; x++) {
        const si = srcRow + x * 4;
        const di = dstRow + x * 4;
        const a = pixels[si + 3] / 255;
        const inv = 1 - a;
        // Clamp: additive blending can push RGB past 255 relative to alpha.
        out[di]     = Math.min(255, Math.round(pixels[si]     + br * inv));
        out[di + 1] = Math.min(255, Math.round(pixels[si + 1] + bgc * inv));
        out[di + 2] = Math.min(255, Math.round(pixels[si + 2] + bb * inv));
        out[di + 3] = 255;
      }
    }
    return out;
  }

  /** Builds a function that returns the params for frame time t, given
   *  either continuous audio reactivity (VoiceEnvelope) or a static
   *  idle/thinking hold. Shared between both export modes. */
  function makeParamSampler(options) {
    const applyRotation = (params) => {
      if (options.ribbonRotation) {
        params.ribbonUserRotX = options.ribbonRotation.x;
        params.ribbonUserRotY = options.ribbonRotation.y;
      }
      // Keep design edge-glow pad stable across reactive idle↔talk samples.
      if (options.thinkingParams) {
        if (options.thinkingParams.designEdgeGlow != null) {
          params.designEdgeGlow = options.thinkingParams.designEdgeGlow;
        }
        if (options.thinkingParams.designParticleBloom != null) {
          params.designParticleBloom = options.thinkingParams.designParticleBloom;
        }
      }
      return params;
    };
    if (options.audio) {
      const envelope = new global.VoiceEnvelope(
        options.style, options.thinkingParams,
        options.activationDuration != null ? options.activationDuration : 0.12,
        options.transitionDuration != null ? options.transitionDuration : 0.35,
      );
      const threshold = options.audio.threshold || 0.14;
      const trimStart = options.audio.trimStart || 0;
      let lastT = 0;
      return function sample(t) {
        const dt = Math.max(0, t - lastT);
        lastT = t;
        const level = options.audio.analyzer.level(t + trimStart);
        const target = global.levelToTarget(level, threshold);
        envelope.step(target, dt || 1 / 60);
        const params = envelope.sample();
        if (options.audio.reactiveExposure) {
          params.exposure = params.exposure * (1 + Math.min(1.5, level) * 0.35);
        }
        return applyRotation(params);
      };
    }
    const params = options.startActive === false
      ? global.OrbPresets.createIdleParams(options.style, options.thinkingParams)
      : options.thinkingParams;
    return function sample() { return applyRotation(Object.assign({}, params)); };
  }

  async function exportPngSequence(options) {
    const fs = require('fs');
    const path = require('path');
    if (!fs.existsSync(options.outputDir)) fs.mkdirSync(options.outputDir, { recursive: true });

    const motion = new global.MotionClock();
    if (options.startPhase) motion.phase = options.startPhase;
    const sampleParams = makeParamSampler(options);
    const dt = 1 / options.frameRate;

    const paths = [];
    for (let i = 0; i < options.totalFrames; i++) {
      if (options.isCancelled && options.isCancelled()) break;
      const t = i * dt;
      const sampled = sampleParams(t);
      const shaderTime = motion.step(dt, sampled.speed);
      options.renderer.renderFrame(options.width, options.height, shaderTime, sampled);
      const buffer = await canvasToPngBuffer(options.canvas);
      const filePath = path.join(options.outputDir, options.filePrefix + pad(i, 5) + '.png');
      fs.writeFileSync(filePath, buffer);
      paths.push(filePath);
      if (options.onProgress) options.onProgress(i + 1, options.totalFrames);
      // Yield occasionally so the panel UI stays responsive, without paying
      // a macrotask round-trip on every single frame.
      if (i % 20 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    return paths;
  }

  /** Renders directly to an H.264 mp4 by piping raw RGBA frames into ffmpeg -
   *  no per-frame PNG encode, no thousands of files on disk. Fails fast (and
   *  clearly) if ffmpeg can't actually run, instead of hanging on a dead pipe.
   *  Also aborts (kills ffmpeg) promptly if options.isCancelled() goes true,
   *  rather than waiting for a graceful finish. */
  async function exportMp4(options) {
    const fs = require('fs');
    const path = require('path');
    const { spawn } = require('child_process');
    if (!fs.existsSync(options.outputDir)) fs.mkdirSync(options.outputDir, { recursive: true });
    if (!options.ffmpegPath || !fs.existsSync(options.ffmpegPath)) {
      throw new Error('No working ffmpeg binary at the path set in Settings. ' +
        'Use PNG sequence export instead, or set a valid ffmpeg path in Settings.');
    }

    const outputPath = path.join(options.outputDir, options.filePrefix + '.mp4');
    const bg = options.backgroundColor || [0, 0, 0];

    const args = [
      '-y',
      '-f', 'rawvideo', '-pix_fmt', 'rgba',
      '-s', options.width + 'x' + options.height,
      '-r', String(options.frameRate),
      '-i', '-',
      '-an',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
      '-preset', 'veryfast', '-crf', '18',
      '-movflags', '+faststart',
      outputPath,
    ];
    const proc = spawn(options.ffmpegPath, args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderrTail = '';
    let processDied = false;
    let dieReason = null;
    proc.stderr.on('data', (d) => { stderrTail = (stderrTail + d.toString()).slice(-4000); });
    proc.stdin.on('error', (e) => { processDied = true; dieReason = e; });
    proc.on('error', (e) => { processDied = true; dieReason = e; });

    // Confirm ffmpeg actually launched (or failed) before we spend any time
    // rendering frames - this is what turns a silent multi-minute hang into
    // an immediate, clear error.
    const spawnResult = await new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => { finish({ ok: true }); }, 300); // Node <15 fallback: no 'spawn' event
      function finish(result) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        proc.removeListener('spawn', onSpawn);
        proc.removeListener('error', onError);
        proc.removeListener('close', onEarlyClose);
        resolve(result);
      }
      function onSpawn() { finish({ ok: true }); }
      function onError(e) { finish({ ok: false, error: e }); }
      function onEarlyClose(code) {
        finish({ ok: false, error: new Error('ffmpeg exited immediately with code ' + code + '\n' + stderrTail) });
      }
      proc.once('spawn', onSpawn);
      proc.once('error', onError);
      proc.once('close', onEarlyClose);
    });
    if (!spawnResult.ok) {
      throw new Error('Could not start ffmpeg (' + options.ffmpegPath + '): ' +
        (spawnResult.error ? spawnResult.error.message : 'unknown error') +
        (stderrTail ? '\n' + stderrTail : ''));
    }

    const done = new Promise((resolve, reject) => {
      proc.on('error', reject);
      proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(
        'ffmpeg exited with code ' + code + '\n' + stderrTail,
      ))));
    });

    const motion = new global.MotionClock();
    if (options.startPhase) motion.phase = options.startPhase;
    const sampleParams = makeParamSampler(options);
    const dt = 1 / options.frameRate;
    const gl = options.renderer.gl;

    for (let i = 0; i < options.totalFrames; i++) {
      if (options.isCancelled && options.isCancelled()) {
        try { proc.kill(); } catch (e) { /* already dead */ }
        return null;
      }
      if (processDied) {
        throw new Error('ffmpeg stopped unexpectedly during export: ' +
          (dieReason ? dieReason.message : 'unknown error') + (stderrTail ? '\n' + stderrTail : ''));
      }
      const t = i * dt;
      const sampled = sampleParams(t);
      const shaderTime = motion.step(dt, sampled.speed);
      options.renderer.renderFrame(options.width, options.height, shaderTime, sampled);
      const frame = readCompositedRgba(gl, options.width, options.height, bg);

      const canWrite = proc.stdin.write(Buffer.from(frame.buffer));
      if (!canWrite && !processDied) {
        await Promise.race([
          new Promise((r) => proc.stdin.once('drain', r)),
          new Promise((r) => proc.once('close', r)),
          new Promise((r) => proc.once('error', r)),
        ]);
      }

      if (options.onProgress) options.onProgress(i + 1, options.totalFrames);
      if (i % 20 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    try { proc.stdin.end(); } catch (e) { /* already closed if ffmpeg died */ }
    await done;
    return outputPath;
  }

  global.OrbExport = { exportPngSequence, exportMp4 };
})(window);
