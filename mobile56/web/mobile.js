(function (w) {
  "use strict";
  const C = VarnaEdit51,
    F = VarnaFX52,
    M = MobileCore56,
    Captions = VarnaCaptions57,
    Project = VarnaProject57,
    Timeline = VarnaTimeline57,
    $ = (s) => document.querySelector(s),
    native = !!w.MobileNative,
    media = new Map(),
    assets = new Map(),
    pending = new Map(),
    waveforms = new Map();
  let analysisChain = Promise.resolve();
  let project,
    selected = null,
    tab = "media",
    time = 0,
    playing = false,
    raf = 0,
    clock = 0,
    clockTime = 0,
    zoom = 65,
    exporting = false,
    cancelled = false,
    lang = localStorage.getItem("mobile56-language") || "fa",
    wordIndex = -1,
    db = null,
    audioContext = null,
    mix = null,
    snapping = true,
    seekRevision = 0;
  const T = (en, fa) => (lang === "en" ? en : fa);
  function status(text) {
    $("#status").textContent = text;
  }
  function safely(fn) {
    try {
      const result = fn();
      if (result?.catch) result.catch((e) => status(e.message));
      return result;
    } catch (e) {
      status(e.message);
    }
  }
  function rpc(method, ...args) {
    const parsed = JSON.parse(MobileNative[method](...args));
    if (!parsed.ok) throw Error(parsed.error);
    return parsed.value;
  }
  w.MobileReply = (id, result, error) => {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    clearTimeout(p.timer);
    error ? p.reject(Error(error)) : p.resolve(result);
  };
  function request(method, ...args) {
    return new Promise((resolve, reject) => {
      const id = C.id();
      const timer =
        method === "pick"
          ? null
          : setTimeout(
              () => {
                pending.delete(id);
                reject(
                  Error(
                    T(
                      "Native operation timed out. Try again.",
                      "مهلت عملیات بومی تمام شد؛ دوباره تلاش کن.",
                    ),
                  ),
                );
              },
              method === "finishExport" ? 300000 : 60000,
            );
      pending.set(id, { resolve, reject, timer });
      try {
        MobileNative[method](id, ...args);
      } catch (e) {
        clearTimeout(timer);
        pending.delete(id);
        reject(e);
      }
    });
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    for (const m of media.values()) m.el.pause?.();
    $("#play").textContent = "▶";
  }
  function save() {
    try {
      Project.save(localStorage, H.get(), M.validate);
    } catch (e) {
      status(
        T(
          "Storage is full. Export your project.",
          "حافظه پر است؛ فایل پروژه را ذخیره کن.",
        ),
      );
    }
  }
  let initial;
  try {
    initial = Project.recover(localStorage, M.validate)?.project || M.fresh();
  } catch (e) {
    initial = M.fresh();
  }
  const H = C.history(initial),
    p = () => H.get();
  function change(fn, redraw = true) {
    if (exporting) return;
    pause();
    H.change((doc) => {
      fn(doc);
      M.validate(doc);
    });
    save();
    status(T("Saved", "ذخیره شد"));
    pruneMedia();
    render();
    timeline();
    if (redraw) inspector();
  }
  function draw() {
    M.frame(p(), time, $("#preview").getContext("2d"), (c) => runtime(c)?.el);
    $("#empty").hidden = !!(
      p().clips.length ||
      p().captions.length ||
      p().layers52?.length
    );
    $("#time").textContent = C.time(time).replace(",", ".").slice(3);
    $("#duration").textContent = C.duration(p()).toFixed(1) + " s";
    $("#projectName").textContent = p().name;
    $("#formatBadge").textContent =
      p().width + " × " + p().height + " · " + p().fps;
    const head = $(".playhead");
    if (head) head.style.left = 55 + time * zoom + "px";
  }
  function render() {
    draw();
  }
  function pruneMedia() {
    const ids = new Set(p().clips.map((c) => c.id));
    for (const [id, m] of media) {
      const c = p().clips.find((c) => c.id === id);
      if (!ids.has(id) || (media.size > 8 && (!c || !active(c, time)))) {
        m.el.pause?.();
        m.source?.disconnect();
        m.gain?.disconnect();
        m.el.removeAttribute("src");
        m.el.load?.();
        media.delete(id);
      }
    }
  }
  function runtime(c) {
    let m = media.get(c.id);
    if (m) return m;
    const asset = p().assets.find((a) => a.id === c.assetId),
      cached = assets.get(c.assetId);
    if (!asset || !cached) return null;
    const el = document.createElement(
      asset.kind === "image" ? "img" : asset.kind,
    );
    el.src = cached.url;
    el.preload = "auto";
    el.playsInline = true;
    m = { el, kind: asset.kind, assetId: c.assetId };
    el.addEventListener(asset.kind === "image" ? "load" : "loadeddata", () => {
      if (!playing && !exporting) draw();
    });
    media.set(c.id, m);
    return m;
  }
  function sound() {
    if (audioContext) return;
    audioContext = new (w.AudioContext || w.webkitAudioContext)();
    mix = audioContext.createMediaStreamDestination();
  }
  function route(m) {
    if (m.kind === "image" || m.source) return;
    sound();
    m.source = audioContext.createMediaElementSource(m.el);
    m.gain = audioContext.createGain();
    m.source.connect(m.gain);
    m.gain.connect(audioContext.destination);
    m.gain.connect(mix);
  }
  function active(c, t) {
    return w.VarnaComposition57.active(p(), c, t);
  }
  async function seek(t) {
    const revision = ++seekRevision;
    pause();
    time = C.clamp(t, 0, C.duration(p()));
    const waits = [];
    for (const c of p().clips) {
      if (!active(c, time)) continue;
      const m = runtime(c);
      if (!m) continue;
      if (m.kind === "image") {
        if (!m.el.complete)
          waits.push(
            new Promise((resolve, reject) => {
              const finish = (e) => {
                clearTimeout(timer);
                m.el.removeEventListener("load", finish);
                m.el.removeEventListener("error", finish);
                e?.type === "error"
                  ? reject(Error("Image could not be decoded"))
                  : resolve();
              };
              const timer = setTimeout(() => finish({ type: "error" }), 8000);
              m.el.addEventListener("load", finish);
              m.el.addEventListener("error", finish);
            }),
          );
        continue;
      }
      const wanted = C.clamp(c.in + time - c.start, c.in, c.out - 0.001);
      if (Math.abs(m.el.currentTime - wanted) < 0.001 && m.el.readyState >= 2)
        continue;
      waits.push(
        new Promise((resolve, reject) => {
          const done = () => {
            clearTimeout(timer);
            m.el.removeEventListener("seeked", done);
            m.el.removeEventListener("loadeddata", done);
            resolve();
          };
          const timer = setTimeout(() => {
            m.el.removeEventListener("seeked", done);
            m.el.removeEventListener("loadeddata", done);
            exporting
              ? reject(
                  Error(
                    T(
                      "Video frame could not be decoded",
                      "فریم ویدیو قابل خواندن نیست",
                    ),
                  ),
                )
              : resolve();
          }, 8000);
          m.el.addEventListener("seeked", done);
          m.el.addEventListener("loadeddata", done);
          m.el.currentTime = wanted;
        }),
      );
    }
    await Promise.all(waits);
    if (revision !== seekRevision) return;
    pruneMedia();
    draw();
  }
  function sync() {
    for (const c of p().clips) {
      const m = active(c, time) ? runtime(c) : media.get(c.id);
      if (!m || m.kind === "image") continue;
      if (active(c, time)) {
        route(m);
        const wanted = c.in + time - c.start;
        if (Math.abs(m.el.currentTime - wanted) > 0.15)
          m.el.currentTime = wanted;
        const fade = Math.max(
          0,
          Math.min(
            1,
            c.fadeIn ? (time - c.start) / c.fadeIn : 1,
            c.fadeOut ? (C.end(c) - time) / c.fadeOut : 1,
          ),
        );
        m.gain.gain.value = c.gain * fade;
        if (m.el.paused) m.el.play().catch((e) => status(e.message));
      } else m.el.pause();
    }
    if (media.size > 8) pruneMedia();
  }
  async function play() {
    if (playing) return pause();
    if (time >= C.duration(p()) - 0.02) time = 0;
    await seek(time);
    sound();
    await audioContext.resume();
    playing = true;
    clock = performance.now();
    clockTime = time;
    $("#play").textContent = "Ⅱ";
    const loop = () => {
      if (!playing) return;
      time = clockTime + (performance.now() - clock) / 1000;
      if (time >= C.duration(p())) {
        time = C.duration(p());
        pause();
        draw();
        return;
      }
      sync();
      draw();
      const scroller = $("#timelineScroll"),
        head = 55 + time * zoom;
      if (head > scroller.scrollLeft + scroller.clientWidth - 24)
        scroller.scrollLeft = head - scroller.clientWidth * 0.3;
      raf = requestAnimationFrame(loop);
    };
    loop();
  }
  async function initDB() {
    return new Promise((resolve) => {
      const req = indexedDB.open("mobile56-media", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("files");
      req.onsuccess = () => {
        db = req.result;
        resolve();
      };
      req.onerror = () => resolve();
    });
  }
  async function cache(id, file) {
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, id);
      tx.oncomplete = resolve;
      tx.onerror = () => {
        status(
          T(
            "Media cache is full; relink after reopening",
            "حافظهٔ رسانه پر است؛ پس از بازکردن دوباره فایل را متصل کن",
          ),
        );
        resolve();
      };
    });
  }
  async function storedFile(id) {
    if (!db) return null;
    return new Promise((resolve) => {
      const req = db.transaction("files").objectStore("files").get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }
  async function metadata(info) {
    const type = info.type || "",
      kind = type.startsWith("image/")
        ? "image"
        : type.startsWith("audio/")
          ? "audio"
          : /\.(png|jpe?g|webp)$/i.test(info.name)
            ? "image"
            : /\.(wav|mp3|aac|m4a|ogg)$/i.test(info.name)
              ? "audio"
              : "video",
      el = document.createElement(kind === "image" ? "img" : kind);
    el.preload = "metadata";
    const data = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          finish(
            Error(
              T("Media format not supported", "فرمت رسانه قابل خواندن نیست"),
            ),
          ),
        15000,
      );
      function finish(err) {
        clearTimeout(timer);
        el.onload = el.onloadedmetadata = el.onerror = null;
        err
          ? reject(err)
          : resolve({
              kind,
              duration: kind === "image" ? 86400 : el.duration,
              width: el.videoWidth || el.naturalWidth || 0,
              height: el.videoHeight || el.naturalHeight || 0,
            });
      }
      el.onload = el.onloadedmetadata = () => finish();
      el.onerror = () =>
        finish(
          Error(T("Unsupported media codec", "کدک رسانه پشتیبانی نمی‌شود")),
        );
      el.src = info.url;
    });
    if (!Number.isFinite(data.duration) || data.duration <= 0)
      throw Error("Invalid media duration");
    return { ...info, ...data };
  }
  async function importMedia(info) {
    pause();
    const data = await metadata(info);
    const prior = p().assets.find(
        (a) =>
          a.name === data.name && a.bytes === data.bytes && !assets.has(a.id),
      ),
      id = prior?.id || data.id || C.id();
    assets.set(id, data);
    if (data.file) await cache(id, data.file);
    change((doc) => {
      if (prior) {
        prior.mobile56 = { url: data.url, nativeId: data.id };
      } else
        doc.assets.push({
          id,
          name: data.name,
          kind: data.kind,
          duration: data.duration,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
          mobile56: native ? { url: data.url, nativeId: data.id } : null,
        });
    });
    analysisChain = analysisChain.then(async () => {
      try {
        const wave = await w.VarnaMediaAnalysis57.waveform(data);
        if (wave) {
          waveforms.set(id, wave);
          const asset = p().assets.find((a) => a.id === id);
          if (asset) {
            asset.analysis57 = wave;
            save();
          }
          if (!exporting) timeline();
        }
      } catch (e) {
        /* Unsupported codecs leave the original media available. */
      }
    });
    status(
      T(
        "Media ready. Tap to add to the timeline.",
        "رسانه آماده است؛ برای افزودن به تایم‌لاین روی آن بزن.",
      ),
    );
  }
  async function pick(type) {
    if (exporting) return;
    if (native) {
      const info = await request("pick", type);
      if (!info) return;
      if (type === "media") return importMedia(info);
      const text = rpc("readText", info.id);
      return receiveText(type, text);
    }
    return new Promise((resolve) => {
      const input = $("#filePicker");
      input.accept =
        type === "media"
          ? "video/*,image/*,audio/*"
          : type === "srt"
            ? ".srt,.vtt,.txt"
            : ".json,.varna";
      input.onchange = async () => {
        try {
          const file = input.files[0];
          if (file) {
            if (type === "media")
              await importMedia({
                id: C.id(),
                name: file.name,
                type: file.type,
                url: URL.createObjectURL(file),
                bytes: file.size,
                file,
              });
            else await receiveText(type, await file.text());
          }
        } catch (e) {
          status(e.message);
        } finally {
          input.value = "";
          resolve();
        }
      };
      input.click();
    });
  }
  async function receiveText(type, text) {
    if (type === "srt") {
      const caps = Captions.parse(text, C.id);
      change((doc) => doc.captions.push(...caps));
      tab = "text";
      inspector();
    } else {
      const doc = Project.unpack(JSON.parse(text), M.validate);
      pause();
      for (const m of media.values()) {
        m.el.pause?.();
        m.source?.disconnect();
        m.gain?.disconnect();
      }
      media.clear();
      H.load(doc);
      selected = null;
      wordIndex = -1;
      time = 0;
      save();
      await restore();
      timeline();
      inspector();
    }
  }
  async function restore() {
    for (const a of p().assets) {
      if (a.analysis57) waveforms.set(a.id, a.analysis57);
      if (assets.has(a.id)) continue;
      try {
        const file = native ? null : await storedFile(a.id),
          info =
            native && a.mobile56?.url
              ? {
                  id: a.id,
                  url: a.mobile56.url,
                  name: a.name,
                  type: a.kind + "/unknown",
                  bytes: a.bytes,
                }
              : file
                ? {
                    id: a.id,
                    url: URL.createObjectURL(file),
                    name: a.name,
                    type: file.type,
                    bytes: file.size,
                    file,
                  }
                : null;
        if (info) {
          await metadata(info);
          assets.set(a.id, info);
        }
      } catch (e) {
        status(
          T("Relink missing media: ", "رسانه را دوباره متصل کن: ") + a.name,
        );
      }
    }
    render();
  }
  function addAsset(id) {
    const asset = p().assets.find((a) => a.id === id),
      track = p().tracks.find(
        (t) =>
          t.kind === (asset.kind === "audio" ? "audio" : "video") && !t.locked,
      );
    if (!track) throw Error("No unlocked matching track");
    change((doc) => {
      selected = C.add(doc, id, track.id, time).id;
    });
    tab = "style";
    inspector();
  }
  function addCaption() {
    change((doc) => {
      const c = {
        id: C.id(),
        start: time,
        end: time + 3,
        text: T("Your words", "متن شما"),
        style: {
          font: "Vazir",
          size: 62,
          color: "#ffffff",
          x: 50,
          y: 75,
          entry: "spring",
          bg: "#282037",
          bgOpacity: 0.8,
          round: 20,
        },
        words: [],
      };
      doc.captions.push(c);
      selected = c.id;
    });
    tab = "text";
    wordIndex = -1;
    inspector();
  }
  function addGraphic(kind) {
    change((doc) => {
      doc.layers52 = doc.layers52 || [];
      const l = F.layer(kind, C.id(), time);
      l.width = p().width * 0.75;
      l.height = kind === "table" ? p().height * 0.27 : 170;
      l.font = "Vazir";
      l.fontSize = kind === "table" ? 32 : 62;
      l.text = T("Your title", "عنوان شما");
      if (kind === "table")
        l.cells = [
          [T("Item", "عنوان"), T("Value", "مقدار")],
          [T("Design", "طراحی"), "01"],
          [T("Motion", "موشن"), "02"],
        ];
      doc.layers52.push(l);
      selected = l.id;
    });
    tab = "graphics";
    inspector();
  }
  function selectedItem() {
    return M.row(p(), selected);
  }
  function select(id) {
    selected = id;
    wordIndex = -1;
    tab =
      M.kind(p(), id) === "caption"
        ? "text"
        : M.kind(p(), id) === "graphic"
          ? "graphics"
          : "style";
    timeline();
    inspector();
  }
  function timeline() {
    const el = $("#timeline");
    el.replaceChildren();
    const duration = C.duration(p()),
      width = Math.max(
        $("#timelineScroll").clientWidth,
        55 + (duration + 2) * zoom,
      );
    el.style.width = width + "px";
    const ruler = document.createElement("div");
    ruler.className = "ruler";
    for (let t = 0; t < duration + 2; t += zoom < 50 ? 2 : 1) {
      const s = document.createElement("span");
      s.style.left = t * zoom + "px";
      s.textContent = t + "s";
      ruler.append(s);
    }
    ruler.onpointerdown = (e) => {
      if (exporting) return;
      e.preventDefault();
      pause();
      ruler.setPointerCapture(e.pointerId);
      const move = (e) =>
        safely(() =>
          seek((e.clientX - ruler.getBoundingClientRect().left) / zoom),
        );
      move(e);
      ruler.onpointermove = move;
      ruler.onpointerup = ruler.onpointercancel = () =>
        (ruler.onpointermove = null);
    };
    el.append(ruler);
    const tracks = [
      ...(p().captions.length
        ? [{ id: "titles", name: "T", kind: "title" }]
        : []),
      ...(p().layers52 || [])
        .slice()
        .reverse()
        .map((l, i) => ({
          id: "graphic:" + l.id,
          name: "G" + (i + 1),
          kind: "graphic",
          layerId: l.id,
        })),
      ...p().tracks,
    ];
    for (const tr of tracks) {
      const row = document.createElement("div");
      row.className = "track";
      const name = document.createElement("div");
      name.className = "track-name";
      name.textContent = "";
      if (["audio", "video"].includes(tr.kind)) {
        const label = button((tr.locked ? "▣ " : "") + tr.name, () =>
          UI57.tracks(tr),
        );
        label.className = "track-settings57";
        name.append(label);
        const mute = button(tr.muted ? "○" : "●", () =>
          change(
            (doc) => (doc.tracks.find((t) => t.id === tr.id).muted = !tr.muted),
          ),
        );
        mute.setAttribute("aria-label", T("Mute track", "بی‌صدا کردن ترک"));
        name.append(mute);
      } else name.textContent = tr.name;
      row.dataset.track = tr.id;
      row.classList.toggle("locked57", !!tr.locked);
      row.append(name);
      const items =
        tr.id === "titles"
          ? p().captions
          : tr.layerId
            ? p().layers52.filter((l) => l.id === tr.layerId)
            : p().clips.filter((c) => c.trackId === tr.id);
      for (const item of items) {
        const block = document.createElement("div");
        block.className =
          "clip " + tr.kind + (item.id === selected ? " selected" : "");
        block.dataset.clip = item.id;
        const end = item.end ?? C.end(item);
        block.style.left = 55 + item.start * zoom + "px";
        block.style.width = Math.max(14, (end - item.start) * zoom) + "px";
        const title =
          item.text ||
          item.name ||
          p().assets.find((a) => a.id === item.assetId)?.name ||
          "Layer";
        block.title = title;
        const label = document.createElement("span");
        label.className = "clip-name57";
        label.textContent = title;
        block.append(label);
        if (item.assetId && waveforms.has(item.assetId)) {
          const canvas = document.createElement("canvas");
          canvas.className = "waveform57";
          block.append(canvas);
          requestAnimationFrame(() =>
            w.VarnaMediaAnalysis57.paint(
              canvas,
              waveforms.get(item.assetId),
              item,
            ),
          );
        }
        for (const edge of ["left", "right"]) {
          const handle = document.createElement("span");
          handle.className = "trim " + edge;
          block.append(handle);
        }
        block.onpointerdown = (e) => dragItem(e, item, block, tr);
        row.append(block);
      }
      el.append(row);
    }
    const head = document.createElement("div");
    head.className = "playhead";
    head.style.left = 55 + time * zoom + "px";
    el.append(head);
  }
  function dragItem(e, item, block, tr) {
    if (exporting || tr.locked) return;
    e.preventDefault();
    pause();
    const startX = e.clientX,
      initial = C.clone(item),
      edge = e.target.classList.contains("trim")
        ? e.target.classList.contains("left")
          ? "left"
          : "right"
        : null;
    block.setPointerCapture(e.pointerId);
    let delta = 0;
    block.onpointermove = (ev) => {
      delta = (ev.clientX - startX) / zoom;
      if (!edge)
        block.style.left =
          55 + Math.max(0, initial.start + delta) * zoom + "px";
      else
        block.style.width =
          Math.max(
            14,
            ((initial.end ?? C.end(initial)) -
              initial.start +
              (edge === "left" ? -delta : delta)) *
              zoom,
          ) + "px";
    };
    block.onpointerup = () => {
      block.onpointermove = null;
      if (Math.abs(delta) > 0.01) {
        safely(() =>
          change((doc) => {
            const target = M.row(doc, item.id);
            if (edge) {
              if (M.kind(doc, item.id) === "clip")
                C.trim(
                  doc,
                  item.id,
                  edge,
                  Timeline.snap(
                    doc,
                    (edge === "left" ? initial.start : C.end(initial)) + delta,
                    item.id,
                    zoom,
                    snapping,
                  ),
                );
              else if (M.kind(doc, item.id) === "caption") {
                const from =
                    edge === "left"
                      ? Math.max(
                          0,
                          Math.min(initial.end - 0.04, initial.start + delta),
                        )
                      : initial.start,
                  to =
                    edge === "right"
                      ? Math.max(initial.start + 0.04, initial.end + delta)
                      : initial.end;
                Captions.retime(target, from, to);
              } else if (edge === "left")
                target.start = Math.max(
                  0,
                  Math.min(initial.end - 0.04, initial.start + delta),
                );
              else
                target.end = Math.max(
                  initial.start + 0.04,
                  initial.end + delta,
                );
            } else {
              const start = Timeline.snap(
                doc,
                initial.start + delta,
                item.id,
                zoom,
                snapping,
              );
              if (M.kind(doc, item.id) === "clip")
                C.move(doc, item.id, start, initial.trackId);
              else if (M.kind(doc, item.id) === "caption")
                Captions.retime(
                  target,
                  start,
                  start + initial.end - initial.start,
                );
              else {
                target.start = start;
                target.end = start + initial.end - initial.start;
              }
            }
          }),
        );
      }
      select(item.id);
    };
    block.onpointercancel = () => {
      block.onpointermove = null;
      timeline();
    };
  }
  function button(text, fn, cls) {
    const b = document.createElement("button");
    b.textContent = text;
    if (cls) b.className = cls;
    b.onclick = () => safely(fn);
    return b;
  }
  function field(
    parent,
    en,
    fa,
    value,
    apply,
    { type = "number", min, max, step = 1, options, wide = false } = {},
  ) {
    const label = document.createElement("label");
    label.className = "field" + (wide ? " wide" : "");
    const span = document.createElement("span");
    span.textContent = T(en, fa);
    const input = document.createElement(
      options ? "select" : type === "textarea" ? "textarea" : "input",
    );
    if (!options && type !== "textarea") input.type = type;
    input.value = value ?? "";
    input.setAttribute("aria-label", T(en, fa));
    if (min != null) input.min = min;
    if (max != null) input.max = max;
    input.step = step;
    if (options)
      for (const [v, text] of options) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = text;
        input.append(o);
      }
    input.value = value ?? "";
    input.onchange = () =>
      safely(() =>
        apply(
          type === "number" || type === "range" ? +input.value : input.value,
        ),
      );
    label.append(span, input);
    parent.append(label);
    return input;
  }
  const entries = () => [
    ["none", T("None", "بدون")],
    ["fade", T("Fade", "محو")],
    ["spring", T("Spring", "فنری")],
    ["rise", T("Rise", "بالارونده")],
    ["slide", T("Slide", "لغزش")],
    ["type", T("Typewriter", "تایپ")],
  ];
  function inspector() {
    const host = $("#inspector");
    host.replaceChildren();
    for (const b of document.querySelectorAll("[data-tab]"))
      b.classList.toggle("active", b.dataset.tab === tab);
    const item = selectedItem(),
      kind = M.kind(p(), selected),
      actions = document.createElement("div");
    actions.className = "actions";
    host.append(actions);
    const form = document.createElement("div");
    form.className = "form";
    const note = (text) => {
      const n = document.createElement("p");
      n.className = "note";
      n.textContent = text;
      host.append(n);
    };
    if (tab === "media") {
      actions.append(
        button(
          T("+ Import media", "+ ورود رسانه"),
          () => pick("media"),
          "primary",
        ),
        button(T("Import SRT", "ورود زیرنویس"), () => pick("srt")),
      );
      const grid = document.createElement("div");
      grid.className = "asset-grid";
      for (const a of p().assets) {
        const b = button(
            "",
            () => (assets.has(a.id) ? addAsset(a.id) : pick("media")),
            "asset",
          ),
          title = document.createElement("b"),
          small = document.createElement("small");
        title.textContent = a.name;
        small.textContent = assets.has(a.id)
          ? a.kind +
            " · " +
            (a.kind === "image" ? "▧" : a.duration.toFixed(1) + "s")
          : T("Relink required", "نیاز به اتصال");
        b.append(title, small);
        grid.append(b);
      }
      host.append(grid);
      if (!p().assets.length)
        note(
          T(
            "Files stay on your device. Tap an imported file to place it at the playhead.",
            "فایل‌ها روی دستگاه می‌مانند. با لمس هر رسانه، آن را در محل پلی‌هد قرار بده.",
          ),
        );
      return;
    }
    if (tab === "text") {
      actions.append(
        button(T("+ Text", "+ متن"), addCaption, "primary"),
        button(T("Import SRT", "ورود SRT"), () => pick("srt")),
      );
      if (kind !== "caption") {
        note(
          T(
            "Select a caption on the timeline or add a text layer.",
            "یک متن را در تایم‌لاین انتخاب کن یا متن جدید بساز.",
          ),
        );
        return;
      }
      const check = document.createElement("section");
      check.className = "text-check";
      check.id = "mobileTextCheck";
      const toggle = document.createElement("label");
      toggle.className = "switch";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = spellEnabled;
      input.onchange = () => toggleSpell(input.checked);
      const caption = document.createElement("span");
      caption.textContent = T("Offline word review", "بررسی آفلاین واژه‌ها");
      toggle.append(input, caption);
      const out = document.createElement("output");
      out.id = "spellStatus";
      out.textContent = spellEnabled
        ? T("Checking…", "در حال بررسی…")
        : T(
            "Off · previous approved edits are kept",
            "خاموش · اصلاح‌های تأییدشده حفظ می‌شوند",
          );
      check.append(toggle, out);
      host.append(check);
      field(
        form,
        "Caption",
        "متن",
        item.text,
        (value) =>
          change((doc) => {
            Captions.setText(M.row(doc, selected), value);
            wordIndex = -1;
          }),
        { type: "textarea", wide: true },
      );
      host.append(form);
      const words = document.createElement("div");
      words.className = "word-list";
      item.text
        .trim()
        .split(/\s+/)
        .forEach((word, i) => {
          const b = button(
            word,
            () => {
              wordIndex = wordIndex === i ? -1 : i;
              inspector();
            },
            wordIndex === i ? "selected" : "",
          );
          b.dataset.word = i;
          words.append(b);
        });
      host.append(words);
      const controls = document.createElement("div");
      controls.className = "form";
      host.append(controls);
      const style =
          wordIndex >= 0
            ? { ...item.style, ...item.words?.[wordIndex]?.style }
            : item.style,
        update = (key, value) =>
          change((doc) => {
            const c = M.row(doc, selected);
            if (wordIndex >= 0) {
              c.words = M.wordStyles(c);
              c.words[wordIndex].style[key] = value;
            } else {
              c.style = c.style || {};
              c.style[key] = value;
            }
          }, false);
      field(
        controls,
        "Color",
        "رنگ",
        style.color || "#ffffff",
        (v) => update("color", v),
        { type: "color" },
      );
      field(
        controls,
        "Size",
        "اندازه",
        style.size || 62,
        (v) => update("size", v),
        { min: 8, max: 500 },
      );
      field(
        controls,
        "Background",
        "زمینه",
        style.bg || "#282037",
        (v) => update("bg", v),
        { type: "color" },
      );
      field(
        controls,
        "Entry",
        "ورود",
        style.entry || "fade",
        (v) => update("entry", v),
        { type: "text", options: entries() },
      );
      field(
        controls,
        "Font",
        "فونت",
        style.font || "Vazir",
        (v) => update("font", v),
        {
          type: "text",
          options: [
            ["Vazir", "Vazirmatn"],
            ["sans-serif", "Sans"],
            ["serif", "Serif"],
            ["monospace", "Mono"],
          ],
        },
      );
      field(
        controls,
        "Y (%)",
        "ارتفاع (%)",
        style.y ?? 75,
        (v) => update("y", v),
        { min: 0, max: 100 },
      );
      field(
        controls,
        "Start",
        "شروع",
        item.start,
        (v) =>
          change((doc) => {
            const c = M.row(doc, selected);
            Captions.retime(c, v, c.end);
          }),
        { min: 0, step: 0.1 },
      );
      field(
        controls,
        "End",
        "پایان",
        item.end,
        (v) =>
          change((doc) => {
            const c = M.row(doc, selected);
            Captions.retime(c, c.start, v);
          }),
        { min: item.start + 0.05, step: 0.1 },
      );
      captionControls57(host, item);
      actions.append(button(T("Styles", "استایل‌ها"), textPresets));
      scheduleSpell();
      return;
    }
    if (tab === "graphics") {
      actions.append(
        button(T("+ Shape", "+ شکل"), () => addGraphic("shape")),
        button(T("+ Table", "+ جدول"), () => addGraphic("table"), "primary"),
        button(T("+ Title", "+ عنوان"), () => addGraphic("text")),
      );
      if (kind !== "graphic") {
        note(
          T(
            "Shapes, glass, tables and size keyframes render in the exported video.",
            "شکل، شیشه، جدول و کی‌فریم اندازه در خروجی ویدیو هم رندر می‌شوند.",
          ),
        );
        return;
      }
      host.append(form);
      const update = (key, value) =>
        change((doc) => (M.row(doc, selected)[key] = value), false);
      field(form, "Width", "عرض", item.width, (v) => update("width", v), {
        min: 1,
        max: 8000,
      });
      field(form, "Height", "ارتفاع", item.height, (v) => update("height", v), {
        min: 1,
        max: 8000,
      });
      field(
        form,
        "Material",
        "متریال",
        item.material,
        (v) => update("material", v),
        {
          type: "text",
          options: [
            ["glass", T("Glass", "شیشه")],
            ["solid", T("Solid", "سالید")],
          ],
        },
      );
      field(form, "Color", "رنگ", item.fill, (v) => update("fill", v), {
        type: "color",
      });
      field(form, "Corners", "گردی", item.round, (v) => update("round", v), {
        min: 0,
        max: 1000,
      });
      field(form, "Frost", "ماتی", item.blur, (v) => update("blur", v), {
        min: 0,
        max: 100,
      });
      field(form, "Entry", "ورود", item.entry, (v) => update("entry", v), {
        type: "text",
        options: [
          ...entries(),
          ["stretch", T("Stretch", "کششی")],
          ["float", T("Float", "شناور")],
        ],
      });
      field(
        form,
        "Opacity",
        "شفافیت",
        item.opacity,
        (v) => update("opacity", v),
        { min: 0, max: 1, step: 0.05 },
      );
      field(form, "Start", "شروع", item.start, (v) => update("start", v), {
        min: 0,
        step: 0.1,
      });
      field(form, "End", "پایان", item.end, (v) => update("end", v), {
        min: item.start + 0.05,
        step: 0.1,
      });
      if (item.kind === "table") {
        field(
          form,
          "Cells · tab separated",
          "خانه‌ها · جداکنندهٔ ستون: Tab",
          item.cells.map((r) => r.join("\t")).join("\n"),
          (value) =>
            change(
              (doc) =>
                (M.row(doc, selected).cells = value
                  .split("\n")
                  .slice(0, 50)
                  .map((r) => r.split("\t").slice(0, 30))),
            ),
          { type: "textarea", wide: true },
        );
        field(
          form,
          "Text align",
          "تراز افقی",
          item.align,
          (v) => update("align", v),
          {
            type: "text",
            options: [
              ["left", T("Left", "چپ")],
              ["center", T("Center", "وسط")],
              ["right", T("Right", "راست")],
            ],
          },
        );
        field(
          form,
          "Vertical align",
          "تراز عمودی",
          item.valign,
          (v) => update("valign", v),
          {
            type: "text",
            options: [
              ["top", T("Top", "بالا")],
              ["middle", T("Middle", "وسط")],
              ["bottom", T("Bottom", "پایین")],
            ],
          },
        );
        field(
          form,
          "Divider width",
          "ضخامت خطوط",
          item.lineWidth,
          (v) => update("lineWidth", v),
          { min: 0, max: 20 },
        );
        field(
          form,
          "Divider color",
          "رنگ خطوط",
          item.lineColor,
          (v) => update("lineColor", v),
          { type: "color" },
        );
      }
      if (item.kind === "text")
        field(form, "Title", "عنوان", item.text, (v) => update("text", v), {
          type: "textarea",
          wide: true,
        });
      actions.append(button("◇ " + T("Keyframe", "کی‌فریم"), keyframe));
      return;
    }
    if (tab === "audio") {
      actions.append(
        button(T("+ Audio", "+ صدا"), () => pick("media"), "primary"),
      );
      if (
        kind === "clip" &&
        p().assets.find((a) => a.id === item.assetId)?.kind !== "image"
      ) {
        host.append(form);
        for (const [key, en, fa, max] of [
          ["gain", "Gain", "بلندی صدا", 3],
          ["fadeIn", "Fade in", "فید ورود", 30],
          ["fadeOut", "Fade out", "فید خروج", 30],
        ])
          field(
            form,
            en,
            fa,
            item[key] || 0,
            (v) => change((doc) => (M.row(doc, selected)[key] = v), false),
            { min: 0, max, step: 0.1 },
          );
      } else
        note(
          T(
            "Select an audio or video clip to adjust its volume and fades.",
            "برای بلندی و فید صدا، کلیپ صوتی یا ویدیو را انتخاب کن.",
          ),
        );
      note(
        T(
          "Music generation models and speech transcription are not bundled in this Android preview.",
          "مدل ساخت موسیقی و تشخیص گفتار در این پیش‌نمایش اندروید قرار نگرفته‌اند.",
        ),
      );
      return;
    }
    if (!item) {
      note(
        T(
          "Select a clip or graphic in the timeline.",
          "یک کلیپ یا گرافیک را در تایم‌لاین انتخاب کن.",
        ),
      );
      return;
    }
    host.append(form);
    const update = (key, value) =>
      change((doc) => {
        Timeline.assertUnlocked(doc, selected);
        M.row(doc, selected)[key] = value;
      }, false);
    if (kind === "clip") {
      for (const [key, en, fa, min, max, step] of [
        ["x", "X (%)", "افقی (%)", -100, 100, 1],
        ["y", "Y (%)", "عمودی (%)", -100, 100, 1],
        ["scale", "Scale", "بزرگ‌نمایی", 1, 400, 1],
        ["opacity", "Opacity", "شفافیت", 0, 1, 0.05],
        ["brightness", "Brightness", "روشنایی", 0, 2, 0.05],
        ["contrast", "Contrast", "کنتراست", 0, 2, 0.05],
        ["saturation", "Saturation", "اشباع", 0, 2, 0.05],
        ["hue", "Hue", "فام", -180, 180, 1],
      ])
        field(form, en, fa, item[key] ?? 1, (v) => update(key, v), {
          min,
          max,
          step,
        });
      field(
        form,
        "Rotation",
        "چرخش",
        item.rotation || 0,
        (v) => update("rotation", v),
        { min: -360, max: 360 },
      );
      field(
        form,
        "Track",
        "لایه",
        item.trackId,
        (v) => change((doc) => C.move(doc, selected, item.start, v)),
        {
          type: "text",
          options: p()
            .tracks.filter(
              (t) =>
                t.kind ===
                  (p().assets.find((a) => a.id === item.assetId)?.kind ===
                  "audio"
                    ? "audio"
                    : "video") && !t.locked,
            )
            .map((t) => [t.id, t.name]),
        },
      );
      field(
        form,
        "Fit",
        "کادر",
        item.fit || "contain",
        (v) => update("fit", v),
        {
          type: "text",
          options: [
            ["contain", T("Fit", "کامل")],
            ["cover", T("Fill", "پُر")],
          ],
        },
      );
      field(form, "Source in", "ورود منبع", item.in, (v) => update("in", v), {
        min: 0,
        step: 0.1,
      });
      field(
        form,
        "Source out",
        "خروج منبع",
        item.out,
        (v) => update("out", v),
        { min: item.in + 0.05, step: 0.1 },
      );
      actions.append(button("◇ " + T("Keyframe", "کی‌فریم"), keyframe));
    } else if (kind === "graphic") {
      for (const [key, en, fa, min, max] of [
        ["x", "X (%)", "افقی (%)", -200, 200],
        ["y", "Y (%)", "عمودی (%)", -200, 200],
        ["rotation", "Rotation", "چرخش", -360, 360],
        ["scale", "Scale", "مقیاس", 1, 500],
      ])
        field(form, en, fa, item[key], (v) => update(key, v), { min, max });
    } else
      note(
        T(
          "Word styles are in the Text tab.",
          "استایل واژه‌ها در تب متن قرار دارد.",
        ),
      );
  }
  function sheet(title, build) {
    $("#sheetTitle").textContent = title;
    $("#sheetBody").replaceChildren();
    build($("#sheetBody"));
    $("#sheet").showModal();
  }
  $("#sheetClose").onclick = () => $("#sheet").close();
  function keyframe() {
    const item = selectedItem();
    if (!item || !["clip", "graphic"].includes(M.kind(p(), selected))) return;
    sheet(T("Add keyframe at playhead", "افزودن کی‌فریم در پلی‌هد"), (body) => {
      const form = document.createElement("div");
      form.className = "form";
      body.append(form);
      let prop = "x",
        value = F.evaluate(item, time).x,
        ease = "smooth";
      const opts =
        M.kind(p(), selected) === "graphic"
          ? [
              "x",
              "y",
              "width",
              "height",
              "scale",
              "rotation",
              "round",
              "opacity",
            ]
          : ["x", "y", "scale", "opacity", "brightness", "saturation"];
      const val = field(form, "Value", "مقدار", value, (v) => (value = v), {
        step: 0.1,
      });
      field(
        form,
        "Property",
        "ویژگی",
        prop,
        (v) => {
          prop = v;
          value = F.evaluate(item, time)[prop] ?? 0;
          val.value = value;
        },
        { type: "text", options: opts.map((x) => [x, x]) },
      );
      field(form, "Curve", "منحنی", ease, (v) => (ease = v), {
        type: "text",
        options: Object.keys(F.curves).map((x) => [x, x]),
      });
      body.append(
        button(
          T("Add / replace keyframe", "ثبت / جایگزینی کی‌فریم"),
          () => {
            change((doc) => {
              Timeline.assertUnlocked(doc, selected);
              F.key(
                M.row(doc, selected),
                prop,
                Math.max(0, time - item.start),
                value,
                ease,
              );
            });
            $("#sheet").close();
          },
          "primary",
        ),
      );
      UI57.keyframes(body, item);
    });
  }
  function textPresets() {
    UI57.presets();
  }
  function captionControls57(host, c) {
    UI57.caption(host, c);
  }
  let spellEnabled = localStorage.getItem("mobile56-spell") === "1",
    spellWorker = null,
    spellReady = null,
    spellGeneration = 0,
    spellTimer = null,
    spellRequests = new Map(),
    spellId = 0;
  function stopSpell() {
    spellGeneration++;
    clearTimeout(spellTimer);
    spellWorker?.terminate();
    spellWorker = null;
    spellReady = null;
    for (const x of spellRequests.values()) x.reject(Error("Cancelled"));
    spellRequests.clear();
    document
      .querySelectorAll(".alert-token")
      .forEach((e) => e.classList.remove("alert-token"));
  }
  function spellCall(method, data) {
    return new Promise((resolve, reject) => {
      const id = ++spellId;
      spellRequests.set(id, { resolve, reject });
      spellWorker.postMessage({ id, method, data });
    });
  }
  async function startSpell() {
    if (!spellEnabled) throw Error("Cancelled");
    if (spellReady) return spellReady;
    const epoch = spellGeneration;
    spellReady = (async () => {
      const values = await Promise.all(
        [
          "text55-core.js",
          "text55-worker.js",
          "fa.aff",
          "fa.dic",
          "en.aff",
          "en.dic",
        ].map(async (n) => {
          const r = await fetch("shared/" + n);
          if (!r.ok) throw Error("Offline dictionary missing");
          return r.text();
        }),
      );
      if (!spellEnabled || epoch !== spellGeneration) throw Error("Cancelled");
      const url = URL.createObjectURL(
        new Blob([values[0], "\n", values[1]], { type: "text/javascript" }),
      );
      spellWorker = new Worker(url);
      URL.revokeObjectURL(url);
      spellWorker.onmessage = (e) => {
        const q = spellRequests.get(e.data.id);
        if (!q) return;
        spellRequests.delete(e.data.id);
        e.data.error ? q.reject(Error(e.data.error)) : q.resolve(e.data.result);
      };
      spellWorker.onerror = (e) => {
        stopSpell();
        status(e.message || "Dictionary error");
      };
      let userWords = [];
      try {
        userWords = JSON.parse(
          localStorage.getItem("mobile56-personal") || "[]",
        );
      } catch (e) {}
      await spellCall("init", {
        fa: { aff: values[2], dic: values[3] },
        en: { aff: values[4], dic: values[5] },
        userWords,
      });
    })();
    try {
      await spellReady;
    } catch (e) {
      if (epoch === spellGeneration) spellReady = null;
      throw e;
    }
  }
  function toggleSpell(value) {
    spellEnabled = value;
    localStorage.setItem("mobile56-spell", value ? "1" : "0");
    if (!value) stopSpell();
    inspector();
  }
  function scheduleSpell() {
    clearTimeout(spellTimer);
    if (!spellEnabled || tab !== "text" || M.kind(p(), selected) !== "caption")
      return;
    const id = selected,
      text = selectedItem().text,
      epoch = spellGeneration;
    spellTimer = setTimeout(async () => {
      try {
        await startSpell();
        const rows = await spellCall("inspect", {
          text,
          options: {
            finglish: true,
            contextPairs: JSON.parse(
              localStorage.getItem("mobile56-corrections") || "[]",
            ),
          },
        });
        if (
          epoch !== spellGeneration ||
          !spellEnabled ||
          selected !== id ||
          selectedItem()?.text !== text
        )
          return;
        const indicator = $("#mobileTextCheck"),
          out = $("#spellStatus");
        indicator?.classList.toggle("found", rows.length > 0);
        if (out)
          out.textContent = rows.length
            ? T(
                rows.length + " words to review · tap the marked word",
                rows.length + " واژه برای بررسی · روی واژهٔ مشخص‌شده بزن",
              )
            : T("No suggestions", "پیشنهادی پیدا نشد");
        const tokens = [];
        let m;
        const re = /\S+/g;
        while ((m = re.exec(text)))
          tokens.push({ start: m.index, end: re.lastIndex });
        rows.forEach((row) => {
          const i = tokens.findIndex(
              (t) => row.start < t.end && row.end > t.start,
            ),
            b = document.querySelector('[data-word="' + i + '"]');
          if (b) {
            b.classList.add("alert-token");
            b.onclick = () => reviewWord(id, text, row);
          }
        });
      } catch (e) {
        if (e.message !== "Cancelled") status(e.message);
      }
    }, 350);
  }
  function reviewWord(id, original, row) {
    sheet(T("Review word", "بررسی واژه"), (body) => {
      const context = document.createElement("p");
      context.textContent = original;
      context.className = "note";
      body.append(context);
      for (const option of row.suggestions)
        body.append(
          button(
            row.token + " → " + option.text,
            () => {
              if (!spellEnabled || M.row(p(), id)?.text !== original)
                throw Error(
                  T(
                    "Text changed. Review again.",
                    "متن تغییر کرده؛ دوباره بررسی کن.",
                  ),
                );
              change((doc) => {
                const c = M.row(doc, id);
                Captions.setText(
                  c,
                  original.slice(0, row.start) +
                    option.text +
                    original.slice(row.end),
                );
              });
              const learned = JSON.parse(
                localStorage.getItem("mobile56-corrections") || "[]",
              );
              learned.push({ wrong: row.token, right: option.text });
              localStorage.setItem(
                "mobile56-corrections",
                JSON.stringify(learned.slice(-1000)),
              );
              $("#sheet").close();
            },
            "primary",
          ),
        );
      body.append(
        button(T("Remember this spelling", "این واژه درست است"), async () => {
          const words = [
            ...new Set([
              ...JSON.parse(localStorage.getItem("mobile56-personal") || "[]"),
              row.token,
            ]),
          ];
          localStorage.setItem("mobile56-personal", JSON.stringify(words));
          await spellCall("userWords", words);
          $("#sheet").close();
          scheduleSpell();
        }),
      );
      body.append(button(T("Cancel", "انصراف"), () => $("#sheet").close()));
    });
  }
  async function download(blob, name) {
    if (native) {
      if (blob.type === "image/png") {
        const data = await data64(blob);
        const file = rpc("saveImage", data);
        MobileNative.share(file);
      } else {
        const file = rpc("saveText", name, await blob.text());
        MobileNative.share(file);
      }
      return;
    }
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function data64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  function projectMenu() {
    sheet(T("Project", "پروژه"), (body) => {
      const form = document.createElement("div");
      form.className = "form";
      body.append(form);
      field(
        form,
        "Name",
        "نام",
        p().name,
        (v) => change((doc) => (doc.name = v)),
        { type: "text", wide: true },
      );
      field(
        form,
        "Format",
        "ابعاد",
        "",
        (v) => {
          const size = M.sizes[v];
          if (!size) return;
          change((doc) => {
            doc.width = size[0];
            doc.height = size[1];
          });
        },
        {
          type: "text",
          options: [
            ["", "—"],
            ...Object.entries(M.sizes).map(([k, v]) => [k, v.join(" × ")]),
          ],
          wide: true,
        },
      );
      field(
        form,
        "Frame rate",
        "فریم",
        p().fps,
        (v) => change((doc) => (doc.fps = v)),
        {
          type: "number",
          options: [
            [24, "24"],
            [25, "25"],
            [30, "30"],
          ],
        },
      );
      field(
        form,
        "Background",
        "رنگ زمینه",
        p().mobile56?.background || "#10101a",
        (v) =>
          change((doc) => {
            doc.mobile56 = { ...doc.mobile56, background: v };
          }),
        { type: "color" },
      );
      const actions = document.createElement("div");
      actions.className = "actions";
      body.append(actions);
      actions.append(
        button(T("Save project file", "ذخیرهٔ فایل پروژه"), () =>
          download(
            new Blob([JSON.stringify(Project.pack(p()), null, 2)], {
              type: "application/json",
            }),
            "Project.varna",
          ),
        ),
        button(T("Open project", "بازکردن پروژه"), async () => {
          await pick("project");
          $("#sheet").close();
        }),
        button(T("New project", "پروژهٔ جدید"), () => {
          sheet(T("Create a new project?", "پروژهٔ جدید بسازم؟"), (b) => {
            b.append(
              button(T("Save current project", "ذخیرهٔ پروژهٔ فعلی"), () =>
                download(
                  new Blob([JSON.stringify(Project.pack(p()))], {
                    type: "application/json",
                  }),
                  "Project.varna",
                ),
              ),
            );
            b.append(
              button(
                T("Create new · Undo available", "ساخت جدید · قابل بازگشت"),
                () => {
                  pause();
                  H.load(M.fresh());
                  time = 0;
                  selected = null;
                  save();
                  timeline();
                  inspector();
                  render();
                  $("#sheet").close();
                },
              ),
            );
          });
        }),
      );
      const note = document.createElement("p");
      note.className = "note";
      note.textContent = T(
        "Android preview 0.2 · Text, graphics and media are processed on device. Imported files are copied into app storage. Project files reference media; keep originals when transferring. Native AE plugins, AI music and speech models are not included.",
        "پیش‌نمایش اندروید ۰٫۲ · متن، گرافیک و رسانه روی دستگاه پردازش می‌شوند. فایل‌های واردشده در حافظهٔ اپ کپی می‌شوند. برای انتقال پروژه، فایل‌های اصلی را هم نگه دار. پلاگین‌های بومی افتر و مدل‌های ساخت موسیقی/تشخیص گفتار در این نسخه نیستند.",
      );
      body.append(note);
      body.append(
        button(T("Licenses", "مجوزها"), async () => {
          const text = await (await fetch("shared/NOTICES.txt")).text();
          sheet(T("Licenses", "مجوزها"), (b) => {
            const pre = document.createElement("pre");
            pre.style.whiteSpace = "pre-wrap";
            pre.style.fontSize = "10px";
            pre.textContent = text;
            b.append(pre);
          });
        }),
      );
    });
  }
  function exportMenu() {
    sheet(T("Export", "خروجی"), (body) => {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent = native
        ? T(
            "MP4 · H.264 + AAC, up to 1080p / 30 fps / 3 minutes in this preview. Keep the app open while rendering.",
            "MP4 با تصویر H.264 و صدای AAC؛ تا 1080p، ۳۰ فریم و ۳ دقیقه در این پیش‌نمایش. هنگام ساخت، اپ را باز نگه دار.",
          )
        : T(
            "Browser preview exports WebM. The Android app exports MP4 on device.",
            "پیش‌نمایش مرورگر WebM می‌سازد؛ اپ اندروید روی دستگاه MP4 می‌سازد.",
          );
      body.append(note);
      body.append(
        button("WebVTT", () =>
          download(
            new Blob([Captions.vtt(p().captions)], { type: "text/vtt" }),
            "Subtitles.vtt",
          ),
        ),
      );
      body.append(
        button(
          native ? "MP4 · H.264 / AAC" : "WebM · VP8 / Opus",
          () => exportVideo(),
          "primary",
        ),
        button("PNG", async () => {
          draw();
          await download(
            await new Promise((r) => $("#preview").toBlob(r, "image/png")),
            "Frame.png",
          );
        }),
        button("SRT", () =>
          download(
            new Blob([C.srt(p())], { type: "text/plain" }),
            "Subtitles.srt",
          ),
        ),
      );
    });
  }
  async function exportVideo() {
    if (exporting) return;
    if (!p().clips.length && !p().captions.length && !p().layers52?.length)
      throw Error(T("Timeline is empty", "تایم‌لاین خالی است"));
    for (const c of p().clips)
      if (!assets.has(c.assetId))
        throw Error(
          T("Relink missing media first", "ابتدا رسانه‌های گمشده را متصل کن"),
        );
    const duration = C.duration(p()),
      old = time;
    if (native && duration > 180)
      throw Error(
        T(
          "Android preview export limit is 3 minutes",
          "حد خروجی پیش‌نمایش اندروید ۳ دقیقه است",
        ),
      );
    pause();
    stopSpell();
    exporting = true;
    cancelled = false;
    $("#sheet").close();
    $("#renderDialog").showModal();
    const progress = $("#renderProgress"),
      out = $("#renderStatus");
    progress.value = 0;
    let recorder, stream;
    try {
      await document.fonts.ready;
      if (native) {
        const audio = M.audio(p()).map((c) => ({
          ...c,
          assetId:
            p().assets.find((a) => a.id === c.assetId)?.mobile56?.nativeId ||
            c.assetId,
        }));
        await request(
          "beginExport57",
          p().width,
          p().height,
          p().fps,
          Math.ceil(duration * p().fps),
          JSON.stringify(audio),
        );
        const frames = Math.ceil(duration * p().fps);
        for (let i = 0; i < frames; i++) {
          if (cancelled) throw Error(T("Export cancelled", "خروجی لغو شد"));
          await seek(i / p().fps);
          const png = await new Promise((resolve) =>
            $("#preview").toBlob(resolve, "image/png"),
          );
          if (!png) throw Error("Unable to render frame");
          await request("encodeFrame57", await data64(png), i);
          progress.value = (i + 1) / frames;
          out.textContent = i + 1 + " / " + frames;
          await new Promise((r) => setTimeout(r, 0));
        }
        out.textContent = T(
          "Mixing audio and finalizing MP4…",
          "میکس صدا و تکمیل MP4…",
        );
        const file = await request("finishExport");
        if (cancelled) throw Error("Export cancelled");
        status(
          T(
            "MP4 saved. Choose where to share it.",
            "MP4 ذخیره شد؛ محل ذخیره یا اشتراک را انتخاب کن.",
          ),
        );
        MobileNative.share(file);
      } else {
        if (!w.MediaRecorder || !$("#preview").captureStream)
          throw Error("MediaRecorder unavailable");
        sound();
        await audioContext.resume();
        await seek(0);
        stream = $("#preview").captureStream(p().fps);
        if (M.audio(p()).length)
          for (const track of mix.stream.getAudioTracks())
            stream.addTrack(track.clone());
        const type = ["video/webm;codecs=vp8,opus", "video/webm"].find((x) =>
          MediaRecorder.isTypeSupported(x),
        );
        if (!type) throw Error("WebM unavailable");
        const chunks = [];
        recorder = new MediaRecorder(stream, {
          mimeType: type,
          videoBitsPerSecond: 5000000,
        });
        let recordError;
        const complete = new Promise((resolve, reject) => {
          recorder.ondataavailable = (e) => {
            if (e.data.size) chunks.push(e.data);
          };
          recorder.onstop = resolve;
          recorder.onerror = (e) => {
            recordError = e.error || Error("Recorder failed");
            cancelled = true;
            pause();
            resolve();
          };
        });
        recorder.start(250);
        await play();
        while (playing && !cancelled) {
          progress.value = time / duration;
          out.textContent = Math.floor(progress.value * 100) + "%";
          await new Promise((r) => setTimeout(r, 40));
        }
        pause();
        recorder.stop();
        await complete;
        if (recordError) throw recordError;
        if (cancelled) throw Error("Export cancelled");
        if (!chunks.some((chunk) => chunk.size > 0))
          throw Error(
            T("Encoder produced no frames", "موتور خروجی هیچ فریمی نساخت"),
          );
        const raw = new Blob(chunks, { type }),
          blob = new Blob([C.webmDuration(await raw.arrayBuffer(), duration)], {
            type,
          });
        await download(blob, "Video.webm");
        status(T("Video exported", "ویدیو خروجی گرفته شد"));
      }
    } catch (e) {
      if (native) MobileNative.cancelExport();
      status(e.message);
    } finally {
      pause();
      if (recorder && recorder.state !== "inactive") recorder.stop();
      stream?.getTracks().forEach((t) => t.stop());
      exporting = false;
      $("#renderDialog").close();
      await seek(old);
      inspector();
    }
  }
  function cancelExport() {
    cancelled = true;
    pause();
    if (native) MobileNative.cancelExport();
  }
  $("#cancelRender").onclick = cancelExport;
  $("#renderDialog").addEventListener("cancel", (e) => {
    e.preventDefault();
    cancelExport();
  });
  function translate() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    for (const el of document.querySelectorAll("[data-i18n]")) {
      const [en, fa] = el.dataset.i18n.split("|");
      el.textContent = T(en, fa);
    }
    $("#language").textContent = lang === "fa" ? "EN" : "فا";
    inspector();
  }
  $("#language").onclick = () => {
    lang = lang === "fa" ? "en" : "fa";
    localStorage.setItem("mobile56-language", lang);
    translate();
  };
  $("#projectMenu").onclick = projectMenu;
  $("#formatBadge").onclick = projectMenu;
  $("#export").onclick = exportMenu;
  $("#play").onclick = () => safely(play);
  $("#begin").onclick = () => safely(() => seek(0));
  $("#undo").onclick = () => {
    if (exporting) return;
    pause();
    H.undo();
    save();
    render();
    timeline();
    inspector();
  };
  $("#redo").onclick = () => {
    if (exporting) return;
    H.redo();
    save();
    render();
    timeline();
    inspector();
  };
  $("#split").onclick = () =>
    safely(() =>
      change((doc) => {
        Timeline.assertUnlocked(doc, selected);
        selected = M.split(doc, selected, time);
      }),
    );
  $("#delete").onclick = () =>
    safely(() =>
      change((doc) => {
        Timeline.assertUnlocked(doc, selected);
        if (M.kind(doc, selected) === "clip") C.remove(doc, selected, false);
        else {
          doc.captions = doc.captions.filter((x) => x.id !== selected);
          doc.layers52 = (doc.layers52 || []).filter((x) => x.id !== selected);
        }
        selected = null;
      }),
    );
  $("#duplicate").onclick = () =>
    safely(() =>
      change((doc) => {
        const item = selectedItem();
        if (!item) return;
        Timeline.assertUnlocked(doc, selected);
        const next = C.clone(item),
          kind = M.kind(doc, selected);
        next.id = C.id();
        const after = item.end ?? C.end(item);
        if (kind === "caption")
          Captions.retime(next, after, after + item.end - item.start);
        else {
          next.start = after;
          if (kind !== "clip") next.end = next.start + item.end - item.start;
        }
        (kind === "clip"
          ? doc.clips
          : kind === "caption"
            ? doc.captions
            : doc.layers52
        ).push(next);
        selected = next.id;
      }),
    );
  $("#zoom").oninput = (e) => {
    zoom = +e.target.value;
    timeline();
  };
  $("#trackAdd").onclick = () =>
    sheet(T("Add track", "افزودن لایه"), (body) => {
      for (const kind of ["video", "audio"])
        body.append(
          button(
            kind === "video"
              ? T("Video track", "لایهٔ ویدیو")
              : T("Audio track", "لایهٔ صدا"),
            () => {
              change((doc) => {
                const t = {
                  id: C.id(),
                  kind,
                  name:
                    (kind === "video" ? "V" : "A") +
                    (doc.tracks.filter((t) => t.kind === kind).length + 1),
                  muted: false,
                  locked: false,
                };
                kind === "video" ? doc.tracks.unshift(t) : doc.tracks.push(t);
              });
              $("#sheet").close();
            },
          ),
        );
    });
  $("#tabs").onclick = (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) {
      tab = b.dataset.tab;
      inspector();
    }
  };
  $("#demo").onclick = () => {
    change((doc) => {
      const a = F.layer("shape", C.id(), 0);
      a.width = doc.width * 1.8;
      a.height = doc.height * 1.5;
      a.material = "solid";
      a.fill = "#6843a8";
      a.fill2 = "#163f52";
      a.entry = "none";
      a.end = 5;
      doc.layers52 = [a];
      const table = F.layer("table", C.id(), 0);
      table.width = doc.width * 0.82;
      table.height = doc.height * 0.27;
      table.y = 44;
      table.font = "Vazir";
      table.fontSize = 32;
      table.cells = [
        ["STUDIO", "56"],
        [T("Motion", "موشن"), "01"],
        [T("Glass", "شیشه"), "02"],
      ];
      table.end = 5;
      doc.layers52.push(table);
      doc.captions.push({
        id: C.id(),
        start: 0,
        end: 5,
        text: T("Make every word move", "هر واژه را به حرکت دربیار"),
        style: {
          font: "Vazir",
          size: 58,
          color: "#f3edff",
          x: 50,
          y: 76,
          entry: "spring",
        },
        words: [],
      });
    });
    seek(1);
  };
  $("#preview").onpointerdown = (e) => {
    if (exporting || !selectedItem()) return;
    const clip = p().clips.find((c) => c.id === selected);
    if (clip && p().tracks.find((t) => t.id === clip.trackId)?.locked) {
      status(T("Unlock the track before editing", "ابتدا قفل لایه را باز کن"));
      return;
    }
    pause();
    const selectedId = selected,
      draft = C.clone(p());
    const canvas = e.currentTarget,
      kind = M.kind(p(), selected),
      item = selectedItem(),
      rect = canvas.getBoundingClientRect(),
      start = { x: e.clientX, y: e.clientY },
      style = kind === "caption" ? item.style : item,
      x = style.x ?? 50,
      y = style.y ?? 50;
    canvas.setPointerCapture(e.pointerId);
    let dx = 0,
      dy = 0;
    const move = (ev) => {
      dx = ((ev.clientX - start.x) / rect.width) * 100;
      dy = ((ev.clientY - start.y) / rect.height) * 100;
      const target = M.row(draft, selectedId),
        value = kind === "caption" ? target.style : target;
      value.x = C.clamp(x + dx, kind === "caption" ? 0 : -100, 100);
      value.y = C.clamp(y + dy, kind === "caption" ? 0 : -100, 100);
      M.frame(draft, time, canvas.getContext("2d"), (c) => runtime(c)?.el);
    };
    canvas.onpointermove = move;
    canvas.onpointercancel = () => {
      canvas.onpointermove = null;
      draw();
    };
    canvas.onpointerup = () => {
      canvas.onpointermove = null;
      safely(() =>
        change((doc) => {
          const target = M.row(doc, selectedId),
            s = kind === "caption" ? target.style : target;
          s.x = C.clamp(x + dx, kind === "caption" ? 0 : -100, 100);
          s.y = C.clamp(y + dy, kind === "caption" ? 0 : -100, 100);
        }, false),
      );
    };
  };
  w.MobileApp = {
    project: () => C.clone(p()),
    history: H,
    importMedia,
    seek,
    play,
    pause,
    select,
    exportVideo,
    render,
    change,
    background() {
      pause();
      if (exporting) cancelExport();
      save();
    },
    back() {
      if ($("#renderDialog").open) {
        cancelExport();
        return;
      }
      if ($("#sheet").open) {
        $("#sheet").close();
        return;
      }
      projectMenu();
    },
    state: () => ({ time, selected, tab, exporting, playing, spellEnabled }),
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) MobileApp.background();
  });
  w.addEventListener("pagehide", () => {
    pause();
    save();
  });

  function install57() {
    const theme = localStorage.getItem("mobile57-theme") || "dark";
    document.documentElement.dataset.theme = theme;
    $("#theme57").onclick = () => {
      const next =
        document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("mobile57-theme", next);
    };
    $("#snap57").onclick = () => {
      snapping = !snapping;
      $("#snap57").setAttribute("aria-pressed", String(snapping));
    };
    $("#zoom").oninput = (e) => {
      const scroller = $("#timelineScroll"),
        at = (scroller.scrollLeft + scroller.clientWidth / 2 - 55) / zoom;
      zoom = +e.target.value;
      timeline();
      scroller.scrollLeft = 55 + at * zoom - scroller.clientWidth / 2;
    };
    w.addEventListener("resize", () => {
      if (!exporting) {
        timeline();
        draw();
      }
    });
  }

  const UI57 = w.VarnaMobileTools57({
    T,
    p,
    field,
    button,
    sheet,
    change,
    selected: () => selected,
    wordIndex: () => wordIndex,
    seek,
    time: () => time,
    select,
    Captions,
    F,
    Timeline,
    download,
    play,
  });
  install57();
  initDB()
    .then(restore)
    .then(() => {
      timeline();
      translate();
      draw();
    });
})(window);
