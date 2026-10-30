(function (w) {
  "use strict";
  const C = w.VarnaEdit51,
    F = w.VarnaFX52;
  const sizes = {
    portrait: [720, 1280],
    landscape: [1280, 720],
    square: [1080, 1080],
    feed: [864, 1080],
    story1080: [1080, 1920],
    hd: [1920, 1080],
  };
  function fresh() {
    const p = C.fresh();
    p.width = 720;
    p.height = 1280;
    p.name = "Untitled";
    p.layers52 = [];
    p.tracks = p.tracks.filter((t) => t.id === "v1" || t.id === "a1");
    p.mobile56 = { background: "#10101a" };
    return p;
  }
  function unsupported(p) {
    const names = new Set();
    for (const c of p.captions || [])
      for (const e of c.native?.style?.vendorEffects || [])
        names.add(e.name || e.id || "Native AE effect");
    for (const l of p.layers52 || [])
      if (l.vendorEffect || l.nativeOnly) names.add(l.name || "Native effect");
    return [...names];
  }
  function validate(p) {
    p = C.validate(p);
    if (
      !Number.isInteger(p.width) ||
      !Number.isInteger(p.height) ||
      p.width % 2 ||
      p.height % 2 ||
      !Number.isInteger(p.fps) ||
      p.width * p.height > 2073600 ||
      p.fps > 30
    )
      throw Error("Mobile preview supports up to 1080p / 30 fps");
    if (
      p.clips.length > 256 ||
      p.captions.length > 2000 ||
      (p.layers52 || []).length > 100
    )
      throw Error("Mobile document limit exceeded");
    for (const c of p.captions) {
      if (
        !c.caption57 &&
        c.words?.length &&
        c.words.some((x) => !Number.isFinite(x.end))
      )
        c.words = w.VarnaCaptions57.words(c);
      w.VarnaCaptions57.validate(c);
    }
    for (const a of p.assets)
      if (
        a.analysis57 &&
        (!Array.isArray(a.analysis57.peaks) ||
          a.analysis57.peaks.length > 512 ||
          !Number.isFinite(a.analysis57.duration) ||
          a.analysis57.duration <= 0 ||
          a.analysis57.peaks.some((v) => !Number.isFinite(v) || v < 0 || v > 1))
      )
        throw Error("Invalid waveform cache");
    const unsupportedNames = unsupported(p);
    if (unsupportedNames.length)
      throw Error(
        "Native AE effects require conversion: " + unsupportedNames.join(", "),
      );
    return p;
  }
  function row(p, id) {
    return (
      p.clips.find((c) => c.id === id) ||
      p.captions.find((c) => c.id === id) ||
      (p.layers52 || []).find((l) => l.id === id)
    );
  }
  function kind(p, id) {
    return p.clips.some((c) => c.id === id)
      ? "clip"
      : p.captions.some((c) => c.id === id)
        ? "caption"
        : (p.layers52 || []).some((c) => c.id === id)
          ? "graphic"
          : null;
  }
  function split(p, id, t) {
    const type = kind(p, id);
    if (type === "clip") return C.split(p, id, t).id;
    if (type === "caption") {
      const next = w.VarnaCaptions57.split(row(p, id), t, C.id());
      p.captions.push(next);
      return next.id;
    }
    const item = row(p, id);
    if (!item || t <= item.start + 0.02 || t >= item.end - 0.02)
      throw Error("Move the playhead inside the item");
    const next = C.clone(item);
    next.id = C.id();
    next.start = t;
    const offset = t - item.start;
    for (const [prop, keys] of Object.entries(item.keys52 || {})) {
      const value = F.evaluate(item, t)[prop];
      next.keys52[prop] = [
        { time: 0, value, ease: "linear" },
        ...keys
          .filter((k) => k.time > offset)
          .map((k) => ({ ...k, time: k.time - offset })),
      ];
      item.keys52[prop] = [
        ...keys.filter((k) => k.time < offset),
        { time: offset, value, ease: "linear" },
      ];
    }
    if (type === "caption") {
      item.words = [];
      next.words = [];
    }
    item.end = t;
    (type === "caption" ? p.captions : p.layers52).push(next);
    return next.id;
  }
  function audio(p) {
    return p.clips
      .filter(
        (c) =>
          p.assets.find((a) => a.id === c.assetId)?.kind !== "image" &&
          !p.tracks.find((t) => t.id === c.trackId)?.muted &&
          c.gain > 0,
      )
      .map((c) => ({
        assetId: c.assetId,
        start: c.start,
        in: c.in,
        out: c.out,
        gain: c.gain,
        fadeIn: c.fadeIn || 0,
        fadeOut: c.fadeOut || 0,
      }));
  }
  function wordStyles(c) {
    return w.VarnaCaptions57.words(c);
  }
  function frame(p, t, ctx, media) {
    if (ctx.canvas.width !== p.width) ctx.canvas.width = p.width;
    if (ctx.canvas.height !== p.height) ctx.canvas.height = p.height;
    ctx.clearRect(0, 0, p.width, p.height);
    ctx.fillStyle = p.mobile56?.background || "#09090e";
    ctx.fillRect(0, 0, p.width, p.height);
    const plan = w.VarnaComposition57.frame(p, t);
    for (const { clip: raw } of plan.video) {
      const c = F.evaluate(raw, t),
        el = media(raw),
        ww = el?.videoWidth || el?.naturalWidth,
        hh = el?.videoHeight || el?.naturalHeight;
      if (!ww || !hh) continue;
      const fit = c.fit === "cover" ? Math.max : Math.min,
        scale = (fit(p.width / ww, p.height / hh) * c.scale) / 100;
      ctx.save();
      ctx.translate(
        p.width / 2 + (c.x * p.width) / 100,
        p.height / 2 + (c.y * p.height) / 100,
      );
      ctx.rotate(((c.rotation || 0) * Math.PI) / 180);
      ctx.globalAlpha = c.opacity;
      ctx.filter =
        "brightness(" +
        c.brightness * Math.pow(2, c.exposure || 0) +
        ") contrast(" +
        c.contrast +
        ") saturate(" +
        c.saturation +
        ") hue-rotate(" +
        c.hue +
        "deg) blur(" +
        (c.blur || 0) +
        "px)";
      ctx.drawImage(
        el,
        (-ww * scale) / 2,
        (-hh * scale) / 2,
        ww * scale,
        hh * scale,
      );
      ctx.restore();
    }
    F.render(ctx, ctx.canvas, { ...p, layers52: plan.graphics }, t);
    w.VarnaTitles53.render(
      ctx,
      p,
      t,
      w.VarnaCaptions57.renderRows(plan.captions, t),
    );
  }
  w.MobileCore56 = {
    sizes,
    fresh,
    validate,
    row,
    kind,
    split,
    audio,
    wordStyles,
    frame,
  };
})(window);
