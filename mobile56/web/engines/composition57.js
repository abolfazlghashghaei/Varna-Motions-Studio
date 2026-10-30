/* A renderer-independent frame plan shared by the current preview and export compositor. */
(function (root) {
  "use strict";
  function active(project, clip, time) {
    return (
      time >= clip.start &&
      time < clip.start + clip.out - clip.in &&
      !project.tracks.find((t) => t.id === clip.trackId)?.muted
    );
  }
  function frame(project, time) {
    const video = [];
    for (const track of project.tracks
      .filter((t) => t.kind === "video")
      .slice()
      .reverse()) {
      if (track.muted) continue;
      for (const clip of project.clips)
        if (clip.trackId === track.id && active(project, clip, time))
          video.push({ clip, sourceTime: clip.in + time - clip.start });
    }
    return {
      time,
      video,
      graphics: (project.layers52 || []).filter(
        (l) => time >= l.start && time < l.end,
      ),
      captions: project.captions.filter((c) => time >= c.start && time < c.end),
    };
  }
  const api = { active, frame };
  root.VarnaComposition57 = api;
  if (typeof module === "object") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
