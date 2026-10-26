/* Loads an audio (or audio+video) file, decodes it to PCM via the Web Audio
 * API, and exposes a simple level(t) query used to drive the idle/thinking
 * state machine, similar to how Siri's orb reacts to speech. */
(function (global) {
  'use strict';

  class AudioAnalyzer {
    constructor() {
      this.buffer = null;      // decoded AudioBuffer
      this.channelData = null; // Float32Array, mixed to mono
      this.sampleRate = 44100;
      this.peakRms = 0.0001;
      this.duration = 0;
    }

    /** path: absolute filesystem path. ffmpegPath: optional path to a bundled
     *  ffmpeg binary, used as a fallback when the file can't be decoded directly
     *  (e.g. it's a video container Chromium's decoder rejects for decodeAudioData). */
    async loadFromPath(path, ffmpegPath, tempDir) {
      const fs = require('fs');
      const arrayBuffer = await this._tryDirectDecode(fs.readFileSync(path).buffer);
      if (arrayBuffer) {
        this._ingest(arrayBuffer);
        return { method: 'direct' };
      }

      if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
        throw new Error(
          "Couldn't decode audio directly from this file, and no ffmpeg binary " +
          'was found to extract it. Point Settings -> ffmpeg path at an ffmpeg ' +
          'executable, or choose a plain .wav/.mp3/.aac file instead.',
        );
      }

      const path_ = require('path');
      const { execFileSync } = require('child_process');
      const outWav = path_.join(tempDir, `orb-audio-${Date.now()}.wav`);
      execFileSync(ffmpegPath, [
        '-y', '-i', path, '-vn', '-ac', '1', '-ar', '44100', outWav,
      ], { stdio: 'ignore' });
      const decoded = await this._tryDirectDecode(fs.readFileSync(outWav).buffer);
      try { fs.unlinkSync(outWav); } catch (e) { /* ignore */ }
      if (!decoded) throw new Error('ffmpeg extracted audio, but it still failed to decode.');
      this._ingest(decoded);
      return { method: 'ffmpeg' };
    }

    async _tryDirectDecode(arrayBuffer) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = await ctx.decodeAudioData(arrayBuffer.slice(0));
        await ctx.close();
        return buf;
      } catch (e) {
        return null;
      }
    }

    _ingest(audioBuffer) {
      this.buffer = audioBuffer;
      this.sampleRate = audioBuffer.sampleRate;
      this.duration = audioBuffer.duration;
      const channels = audioBuffer.numberOfChannels;
      const len = audioBuffer.length;
      const mono = new Float32Array(len);
      for (let c = 0; c < channels; c++) {
        const data = audioBuffer.getChannelData(c);
        for (let i = 0; i < len; i++) mono[i] += data[i] / channels;
      }
      this.channelData = mono;

      // Reference peak: 95th percentile of short-window RMS, so a few loud
      // transients don't crush the whole normalization.
      const windowSize = Math.max(1, Math.floor(this.sampleRate * 0.05));
      const rmsSamples = [];
      for (let i = 0; i < len; i += windowSize) {
        let sum = 0;
        const end = Math.min(len, i + windowSize);
        for (let j = i; j < end; j++) sum += mono[j] * mono[j];
        rmsSamples.push(Math.sqrt(sum / Math.max(1, end - i)));
      }
      rmsSamples.sort((a, b) => a - b);
      const idx = Math.floor(rmsSamples.length * 0.95);
      this.peakRms = Math.max(0.0001, rmsSamples[Math.min(idx, rmsSamples.length - 1)] || 0.0001);
    }

    /** RMS level at time t (seconds), normalized ~0..1 (can exceed 1 on peaks). */
    level(t, windowSeconds) {
      if (!this.channelData) return 0;
      windowSeconds = windowSeconds || 0.05;
      const start = Math.max(0, Math.floor((t - windowSeconds / 2) * this.sampleRate));
      const end = Math.min(this.channelData.length, Math.floor((t + windowSeconds / 2) * this.sampleRate));
      if (end <= start) return 0;
      let sum = 0;
      for (let i = start; i < end; i++) sum += this.channelData[i] * this.channelData[i];
      const rms = Math.sqrt(sum / (end - start));
      return rms / this.peakRms;
    }

    /** A faster-responding "transient" signal (short window) useful for jitter. */
    transient(t) {
      return this.level(t, 0.02);
    }
  }

  global.AudioAnalyzer = AudioAnalyzer;
})(window);
