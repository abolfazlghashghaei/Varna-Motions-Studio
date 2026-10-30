(function (root) {
  "use strict";
  function snap(p, value, exclude, zoom, enabled = true) {
    let t = Math.max(0, Math.round(value * p.fps) / p.fps);
    if (!enabled) return t;
    const edges = [
      0,
      ...p.clips
        .filter((c) => c.id !== exclude)
        .flatMap((c) => [c.start, c.start + c.out - c.in]),
      ...p.captions
        .filter((c) => c.id !== exclude)
        .flatMap((c) => [c.start, c.end]),
      ...(p.layers52 || [])
        .filter((c) => c.id !== exclude)
        .flatMap((c) => [c.start, c.end]),
    ];
    let dist = 8 / zoom;
    for (const edge of edges)
      if (Math.abs(value - edge) < dist) {
        t = edge;
        dist = Math.abs(value - edge);
      }
    return Math.max(0, t);
  }
  function trackOrder(p, id, delta) {
    const index = p.tracks.findIndex((t) => t.id === id),
      other = index + delta;
    if (index < 0 || other < 0 || other >= p.tracks.length) return;
    [p.tracks[index], p.tracks[other]] = [p.tracks[other], p.tracks[index]];
  }
  function assertUnlocked(p, id) {
    const c = p.clips.find((c) => c.id === id);
    if (c && p.tracks.find((t) => t.id === c.trackId)?.locked)
      throw Error("Unlock the track before editing");
  }
  const api = { snap, trackOrder, assertUnlocked };
  root.VarnaTimeline57 = api;
  if (typeof module === "object") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
