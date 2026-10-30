/* Versioned .varna envelope. Portable integer clock, independent of UI and codec. */
(function (root) {
  "use strict";
  const RATE = 720000,
    clone = (x) => JSON.parse(JSON.stringify(x));
  const ticks = (seconds) => {
    const n = Math.round(seconds * RATE);
    if (!Number.isSafeInteger(n) || Math.abs(n) > RATE * 86400)
      throw Error("Time exceeds project clock");
    return n;
  };
  function timed(item, encode) {
    const x = clone(item);
    for (const k of ["start", "end", "in", "out"]) {
      const from = encode ? k : k + "Ticks",
        to = encode ? k + "Ticks" : k;
      if (from in x) {
        if (
          !Number.isFinite(x[from]) ||
          (!encode && !Number.isSafeInteger(x[from]))
        )
          throw Error("Invalid project time");
        x[to] = encode ? ticks(x[from]) : x[from] / RATE;
        delete x[from];
      }
    }
    if (x.words) x.words = x.words.map((w) => timed(w, encode));
    for (const keys of Object.values(x.keys52 || {}))
      for (const k of keys) {
        const from = encode ? "time" : "timeTicks",
          to = encode ? "timeTicks" : "time";
        if (
          !Number.isFinite(k[from]) ||
          (!encode && !Number.isSafeInteger(k[from]))
        )
          throw Error("Invalid key time");
        k[to] = encode ? ticks(k[from]) : k[from] / RATE;
        delete k[from];
      }
    return x;
  }
  function pack(doc) {
    const p = clone(doc),
      tracks = p.tracks,
      assets = p.assets,
      clips = p.clips.map((x) => timed(x, true)),
      captions = p.captions.map((x) => timed(x, true)),
      layers = (p.layers52 || []).map((x) => timed(x, true));
    for (const k of [
      "format",
      "version",
      "tracks",
      "assets",
      "clips",
      "captions",
      "layers52",
    ])
      delete p[k];
    p.frameRate = { numerator: p.fps, denominator: 1 };
    delete p.fps;
    return {
      format: "varna-project",
      version: 1,
      timebase: { numerator: 1, denominator: RATE },
      project: p,
      tracks,
      assets,
      clips,
      captions,
      layers,
    };
  }
  function unpack(data, validate) {
    if (data?.format === "varna-edit") return validate(data);
    if (
      data?.format !== "varna-project" ||
      data.version !== 1 ||
      data.timebase?.numerator !== 1 ||
      data.timebase?.denominator !== RATE
    )
      throw Error("Unsupported Varna project schema or clock");
    for (const k of ["tracks", "assets", "clips", "captions", "layers"])
      if (!Array.isArray(data[k]) || data[k].length > 10000)
        throw Error("Invalid project collection");
    const p = clone(data.project);
    if (
      !p ||
      p.frameRate?.denominator !== 1 ||
      !Number.isInteger(p.frameRate.numerator)
    )
      throw Error("This mobile renderer requires an integer frame rate");
    p.fps = p.frameRate.numerator;
    delete p.frameRate;
    return validate({
      ...p,
      format: "varna-edit",
      version: 1,
      tracks: clone(data.tracks),
      assets: clone(data.assets),
      clips: data.clips.map((x) => timed(x, false)),
      captions: data.captions.map((x) => timed(x, false)),
      layers52: data.layers.map((x) => timed(x, false)),
    });
  }
  function recover(store, validate) {
    for (const key of [
      "mobile57-project",
      "mobile57-backup",
      "mobile56-project",
    ])
      try {
        const raw = store.getItem(key);
        if (raw)
          return { project: unpack(JSON.parse(raw), validate), source: key };
      } catch (e) {}
    return null;
  }
  function save(store, doc, validate) {
    validate(doc);
    const data = JSON.stringify(pack(doc)),
      old = store.getItem("mobile57-project");
    if (old) {
      try {
        unpack(JSON.parse(old), validate);
        store.setItem("mobile57-backup", old);
      } catch (e) {}
    }
    store.setItem("mobile57-project", data);
  }
  const api = { RATE, ticks, pack, unpack, recover, save };
  root.VarnaProject57 = api;
  if (typeof module === "object") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
