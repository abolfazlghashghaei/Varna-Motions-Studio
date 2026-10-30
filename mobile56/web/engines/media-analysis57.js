/* Optional, bounded local waveform analysis. No inference and no network service. */
(function (w) {
  "use strict";
  async function waveform(info) {
    if (
      info.kind === "image" ||
      info.bytes > 20 * 1024 * 1024 ||
      info.duration > 120
    )
      return null;
    const bytes = info.file
      ? await info.file.arrayBuffer()
      : await (await fetch(info.url)).arrayBuffer();
    if (bytes.byteLength > 20 * 1024 * 1024) return null;
    const Decoder = w.OfflineAudioContext || w.webkitOfflineAudioContext;
    if (!Decoder) return null;
    const decoder = new Decoder(1, 1, 8000),
      buffer = await decoder.decodeAudioData(bytes),
      bins = 512,
      peaks = Array(bins).fill(0);
    for (
      let channel = 0;
      channel < Math.min(2, buffer.numberOfChannels);
      channel++
    ) {
      const samples = buffer.getChannelData(channel),
        block = Math.max(1, Math.ceil(samples.length / bins));
      for (let b = 0; b < bins; b++) {
        let peak = 0;
        for (
          let i = b * block;
          i < Math.min(samples.length, (b + 1) * block);
          i++
        )
          peak = Math.max(peak, Math.abs(samples[i]));
        peaks[b] = Math.max(
          peaks[b],
          Math.min(1, Math.round(peak * 1000) / 1000),
        );
        if (b % 64 === 0) await new Promise((r) => setTimeout(r, 0));
      }
    }
    return { peaks, duration: buffer.duration };
  }
  function paint(canvas, analysis, clip) {
    if (!analysis?.peaks?.length) return;
    const ctx = canvas.getContext("2d"),
      bins = analysis.peaks.length;
    canvas.width = Math.min(
      1000,
      Math.max(30, Math.round(canvas.clientWidth || 150)),
    );
    canvas.height = 32;
    ctx.fillStyle = "#bcf5e0";
    for (let x = 0; x < canvas.width; x++) {
      const t = clip.in + ((clip.out - clip.in) * x) / canvas.width,
        index = Math.min(
          bins - 1,
          Math.max(0, Math.floor((t / analysis.duration) * bins)),
        ),
        h = Math.max(1, analysis.peaks[index] * 27);
      ctx.fillRect(x, (32 - h) / 2, 1, h);
    }
  }
  w.VarnaMediaAnalysis57 = { waveform, paint };
})(window);
