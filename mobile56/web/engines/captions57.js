/* Portable caption model. No DOM, network, inference or UI dependencies. */
(function (root) {
  "use strict";
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const modes = ["sentence", "karaoke", "reveal", "single"];
  const tokenize = (text) => String(text).match(/\S+/gu) || [];
  function words(c) {
    const tokens = tokenize(c.text),
      span = c.end - c.start;
    return tokens.map((text, i) => {
      const old = c.words?.[i];
      return {
        text,
        start:
          old?.text === text && Number.isFinite(old.start)
            ? old.start
            : c.start + (span * i) / tokens.length,
        end:
          old?.text === text && Number.isFinite(old.end)
            ? old.end
            : old?.text === text && Number.isFinite(c.words?.[i + 1]?.start)
              ? c.words[i + 1].start
              : c.start + (span * (i + 1)) / tokens.length,
        style: old?.text === text ? copy(old.style || {}) : {},
      };
    });
  }
  function validate(c) {
    if (c.caption57?.mode && !modes.includes(c.caption57.mode))
      throw Error("Invalid caption mode");
    if (
      c.caption57?.timingSource &&
      !["manual", "estimated", "imported", "asr"].includes(
        c.caption57.timingSource,
      )
    )
      throw Error("Invalid caption timing source");
    if (
      c.caption57?.activeColor &&
      !/^#[0-9a-f]{6}$/i.test(c.caption57.activeColor)
    )
      throw Error("Invalid active word color");
    if (!c.words?.length) return;
    const tokens = tokenize(c.text);
    if (c.words.length !== tokens.length)
      throw Error("Word count and text do not match");
    let last = c.start;
    for (let i = 0; i < c.words.length; i++) {
      const w = c.words[i];
      if (
        w.text !== tokens[i] ||
        !Number.isFinite(w.start) ||
        !Number.isFinite(w.end) ||
        w.start < c.start - 1e-6 ||
        w.end > c.end + 1e-6 ||
        w.start < last - 1e-6 ||
        w.end <= w.start
      )
        throw Error("Word times must be ordered inside the caption");
      last = w.end;
    }
  }
  function distribute(c) {
    c.words = words({ ...c, words: [] });
    c.caption57 = { ...c.caption57, timingSource: "estimated" };
    return c;
  }
  function setText(c, text) {
    const old = tokenize(c.text),
      next = tokenize(text);
    c.text = text;
    if (old.length === next.length && c.words?.length === old.length)
      c.words.forEach((w, i) => (w.text = next[i]));
    else {
      c.words = [];
      if (c.caption57?.mode && c.caption57.mode !== "sentence") distribute(c);
    }
    return c;
  }
  function retime(c, start, end) {
    if (end - start < 0.02 || start < 0) throw Error("Invalid caption timing");
    const oldStart = c.start,
      span = c.end - oldStart;
    for (const w of c.words || []) {
      w.start = start + ((w.start - oldStart) / span) * (end - start);
      w.end = start + ((w.end - oldStart) / span) * (end - start);
    }
    c.start = start;
    c.end = end;
    return c;
  }
  function setWord(c, index, start, end) {
    c.words = words(c);
    const w = c.words[index];
    if (!w) throw Error("Select a word");
    const lo = index ? c.words[index - 1].end : c.start,
      hi = index + 1 < c.words.length ? c.words[index + 1].start : c.end;
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < lo - 1e-6 ||
      end > hi + 1e-6 ||
      end - start < 0.01
    )
      throw Error("Word range overlaps its neighbour or caption boundary");
    w.start = start;
    w.end = end;
    c.caption57 = { ...c.caption57, timingSource: "manual" };
    return c;
  }
  function renderRows(captions, time) {
    return captions.map((raw) => {
      const mode = raw.caption57?.mode || "sentence";
      if (mode === "sentence") return raw;
      const c = copy(raw),
        timed = words(c),
        active = timed.findIndex((w) => time >= w.start && time < w.end),
        color = c.caption57.activeColor || "#d8ff73";
      if (mode === "single") {
        if (active < 0) return { ...c, text: "", words: [] };
        const w = timed[active];
        return {
          ...c,
          text: w.text,
          start: w.start,
          end: w.end,
          style: { ...c.style, ...w.style },
          words: [],
        };
      }
      c.words = timed.map((w, i) => ({
        ...w,
        start: mode === "karaoke" ? c.start : w.start,
        style: {
          ...w.style,
          color:
            mode === "karaoke" && i === active
              ? color
              : w.style.color || c.style.color || "#ffffff",
        },
      }));
      return c;
    });
  }
  function vtt(captions) {
    const time = (s) => {
      const ms = Math.round(s * 1000),
        h = Math.floor(ms / 3600000),
        m = Math.floor(ms / 60000) % 60,
        ss = Math.floor(ms / 1000) % 60;
      return (
        [h, m, ss].map((x) => String(x).padStart(2, "0")).join(":") +
        "." +
        String(ms % 1000).padStart(3, "0")
      );
    };
    return (
      "WEBVTT\n\n" +
      captions
        .map(
          (c, i) =>
            i +
            1 +
            "\n" +
            time(c.start) +
            " --> " +
            time(c.end) +
            "\n" +
            c.text,
        )
        .join("\n\n") +
      "\n"
    );
  }
  function parse(text, id) {
    text = String(text)
      .replace(/^\uFEFF/, "")
      .replace(/\r/g, "");
    const stamp = (s) => {
      const p = s.trim().replace(",", ".").split(":").map(Number);
      if (p.length === 2) p.unshift(0);
      return p.length === 3 && p.every(Number.isFinite)
        ? p[0] * 3600 + p[1] * 60 + p[2]
        : NaN;
    };
    const rows = [];
    for (const block of text.split(/\n\s*\n/)) {
      const lines = block.split("\n"),
        i = lines.findIndex((l) => l.includes("-->"));
      if (i < 0) continue;
      const parts = lines[i].split("-->"),
        start = stamp(parts[0]),
        end = stamp(parts[1].trim().split(/\s/)[0]),
        value = lines
          .slice(i + 1)
          .join("\n")
          .replace(/<[^>]*>/g, "");
      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start ||
        start < 0
      )
        throw Error("Invalid subtitle timestamps");
      if (value)
        rows.push({
          id: id(),
          start,
          end,
          text: value,
          words: [],
          style: {
            font: "Vazir",
            size: 62,
            color: "#ffffff",
            x: 50,
            y: 78,
            entry: "fade",
          },
          caption57: { mode: "sentence", timingSource: "imported" },
        });
    }
    if (!rows.length)
      throw Error("No timed subtitles found; import SRT or WebVTT");
    return rows;
  }
  function split(c, t, id) {
    if (t <= c.start + 0.02 || t >= c.end - 0.02)
      throw Error("Move the playhead inside the caption");
    const next = copy(c);
    next.id = id;
    next.start = t;
    const oldEnd = c.end;
    c.end = t;
    if (c.words?.length) {
      const left = [],
        right = [];
      for (const w of c.words) {
        if (w.start < t) left.push({ ...copy(w), end: Math.min(w.end, t) });
        if (w.end > t) right.push({ ...copy(w), start: Math.max(w.start, t) });
      }
      if (left.length && right.length) {
        c.words = left;
        c.text = left.map((w) => w.text).join(" ");
        next.words = right;
        next.text = right.map((w) => w.text).join(" ");
      } else {
        c.end = oldEnd;
        throw Error("Split timed captions between visible words");
      }
    }
    return next;
  }
  const presets = [
    {
      id: "clean",
      name: "Clean",
      fa: "ساده",
      style: {
        font: "Vazir",
        size: 62,
        color: "#ffffff",
        bg: null,
        entry: "fade",
        stroke: "#16131e",
        strokeWidth: 3,
      },
      caption57: { mode: "sentence", activeColor: "#d8ff73" },
    },
    {
      id: "karaoke",
      name: "Karaoke",
      fa: "کارائوکه",
      style: {
        font: "Vazir",
        size: 64,
        color: "#ffffff",
        bg: "#20182b",
        bgOpacity: 0.72,
        round: 18,
        entry: "none",
      },
      caption57: { mode: "karaoke", activeColor: "#d8ff73" },
    },
    {
      id: "pop",
      name: "Word pop",
      fa: "پاپ کلمه‌ای",
      style: {
        font: "Vazir",
        size: 84,
        color: "#e7d4ff",
        bg: null,
        bold: true,
        entry: "spring",
        stroke: "#271c38",
        strokeWidth: 3,
      },
      caption57: { mode: "single", activeColor: "#bd9bff" },
    },
    {
      id: "reveal",
      name: "Word reveal",
      fa: "ورود واژه‌ها",
      style: {
        font: "Vazir",
        size: 62,
        color: "#ffffff",
        bg: null,
        entry: "rise",
      },
      caption57: { mode: "reveal", activeColor: "#97efd9" },
    },
    {
      id: "editorial",
      name: "Editorial",
      fa: "تحریریه",
      style: {
        font: "serif",
        size: 72,
        color: "#ffe7b6",
        bg: null,
        entry: "fade",
      },
      caption57: { mode: "sentence" },
    },
    {
      id: "type",
      name: "Typewriter",
      fa: "ماشین تحریر",
      style: {
        font: "monospace",
        size: 58,
        color: "#ffffff",
        bg: "#41305e",
        round: 8,
        entry: "type",
      },
      caption57: { mode: "sentence" },
    },
  ];
  const api = {
    words,
    validate,
    distribute,
    setText,
    retime,
    setWord,
    renderRows,
    vtt,
    parse,
    split,
    presets,
    modes,
  };
  root.VarnaCaptions57 = api;
  if (typeof module === "object") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
