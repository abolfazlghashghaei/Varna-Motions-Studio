(function (w) {
  "use strict";
  w.VarnaMobileTools57 = function (api) {
    const {
      T,
      p,
      field,
      button,
      sheet,
      change,
      selected,
      wordIndex,
      seek,
      time,
      select,
      Captions,
      F,
      Timeline,
      download,
    } = api;
    const presetsKey = "mobile57-caption-presets";
    function caption(host, c) {
      const form = document.createElement("div");
      form.className = "form caption-studio57";
      host.append(form);
      field(
        form,
        "Caption display",
        "نمایش کپشن",
        c.caption57?.mode || "sentence",
        (mode) =>
          change((doc) => {
            const x = doc.captions.find((x) => x.id === selected());
            x.caption57 = { ...x.caption57, mode };
            if (mode !== "sentence" && !x.words?.length) Captions.distribute(x);
          }),
        {
          type: "text",
          options: [
            ["sentence", T("Full sentence", "جملهٔ کامل")],
            ["karaoke", T("Active word highlight", "هایلایت کلمهٔ فعال")],
            ["reveal", T("Word by word", "ورود کلمه‌به‌کلمه")],
            ["single", T("One word at a time", "یک واژه در هر لحظه")],
          ],
          wide: true,
        },
      );
      field(
        form,
        "Active word color",
        "رنگ واژهٔ فعال",
        c.caption57?.activeColor || "#d8ff73",
        (value) =>
          change((doc) => {
            const x = doc.captions.find((x) => x.id === selected());
            x.caption57 = { ...x.caption57, activeColor: value };
          }, false),
        { type: "color" },
      );
      field(
        form,
        "Outline",
        "دورخط",
        c.style.stroke || "#181221",
        (v) =>
          change(
            (doc) =>
              (doc.captions.find((x) => x.id === selected()).style.stroke = v),
            false,
          ),
        { type: "color" },
      );
      field(
        form,
        "Outline width",
        "ضخامت دورخط",
        c.style.strokeWidth || 0,
        (v) =>
          change(
            (doc) =>
              (doc.captions.find((x) => x.id === selected()).style.strokeWidth =
                v),
            false,
          ),
        { min: 0, max: 20 },
      );
      field(
        form,
        "Line spacing",
        "فاصلهٔ خطوط",
        c.style.leading || 1.35,
        (v) =>
          change(
            (doc) =>
              (doc.captions.find((x) => x.id === selected()).style.leading = v),
            false,
          ),
        { min: 0.8, max: 3, step: 0.05 },
      );
      const note = document.createElement("p");
      note.className = "note timing-note57";
      note.textContent =
        c.caption57?.timingSource === "manual"
          ? T("Word times edited manually", "زمان واژه‌ها دستی تنظیم شده")
          : c.caption57?.timingSource === "asr"
            ? T(
                "Imported model timing · review accuracy",
                "زمان واردشده از مدل · دقت را بررسی کن",
              )
            : T(
                "Distributed word times are estimates. Refine them while listening; speech recognition is not installed.",
                "زمان توزیع‌شده تخمینی است؛ هنگام شنیدن صدا تنظیمش کن. تشخیص گفتار نصب نشده است.",
              );
      host.append(note);
      const idx = wordIndex();
      if (idx >= 0) {
        const word = Captions.words(c)[idx],
          box = document.createElement("div");
        box.className = "form word-time57";
        host.append(box);
        const update = (start, end) =>
          change((doc) =>
            Captions.setWord(
              doc.captions.find((x) => x.id === selected()),
              idx,
              start,
              end,
            ),
          );
        field(
          box,
          "Word start",
          "شروع واژه",
          +word.start.toFixed(3),
          (v) => update(v, word.end),
          { min: c.start, max: word.end - 0.01, step: 0.01 },
        );
        field(
          box,
          "Word end",
          "پایان واژه",
          +word.end.toFixed(3),
          (v) => update(word.start, v),
          { min: word.start + 0.01, max: c.end, step: 0.01 },
        );
        box.append(
          button(T("Start at playhead", "شروع از پلی‌هد"), () =>
            update(time(), word.end),
          ),
          button(T("End at playhead", "پایان در پلی‌هد"), () =>
            update(word.start, time()),
          ),
          button(T("Listen from word", "پخش از این واژه"), async () => {
            await seek(word.start);
            api.play();
          }),
        );
      }
      const actions = document.createElement("div");
      actions.className = "actions";
      actions.append(
        button(T("Word timing", "زمان‌بندی واژه‌ها"), () => wordTimes(c)),
        button(T("Save this style", "ذخیرهٔ این استایل"), () => savePreset(c)),
      );
      host.append(actions);
    }
    function wordTimes(c) {
      sheet(T("Word timing", "زمان‌بندی واژه‌ها"), (body) => {
        const note = document.createElement("p");
        note.className = "note";
        note.textContent = T(
          "Times are in seconds. Word ranges must stay inside the caption and must not overlap.",
          "زمان‌ها ثانیه هستند؛ بازه‌ها باید داخل کپشن و بدون هم‌پوشانی باشند.",
        );
        body.append(note);
        const rows = Captions.words(c),
          draft = rows.map((x) => ({ ...x }));
        rows.forEach((word, i) => {
          const row = document.createElement("div");
          row.className = "word-time-row57";
          const title = document.createElement("b");
          title.textContent = word.text;
          row.append(title);
          field(
            row,
            "Start " + (i + 1),
            "شروع " + (i + 1),
            +word.start.toFixed(3),
            (v) => (draft[i].start = v),
            { step: 0.01 },
          );
          field(
            row,
            "End " + (i + 1),
            "پایان " + (i + 1),
            +word.end.toFixed(3),
            (v) => (draft[i].end = v),
            { step: 0.01 },
          );
          body.append(row);
        });
        body.append(
          button(
            T("Apply timing", "اعمال زمان‌ها"),
            () => {
              change((doc) => {
                const x = doc.captions.find((x) => x.id === c.id);
                if (x.text !== c.text) throw Error("Caption changed");
                x.words = draft;
                x.caption57 = { ...x.caption57, timingSource: "manual" };
                Captions.validate(x);
              });
              document.querySelector("#sheet").close();
            },
            "primary",
          ),
        );
      });
    }
    function saved() {
      try {
        const rows = JSON.parse(localStorage.getItem(presetsKey) || "[]");
        return Array.isArray(rows) ? rows.slice(0, 50) : [];
      } catch (e) {
        return [];
      }
    }
    function savePreset(c) {
      sheet(T("Save caption style", "ذخیرهٔ استایل کپشن"), (body) => {
        let name = T("My caption style", "استایل من");
        const form = document.createElement("div");
        form.className = "form";
        body.append(form);
        field(form, "Name", "نام", name, (v) => (name = v), {
          type: "text",
          wide: true,
        });
        body.append(
          button(
            T("Save", "ذخیره"),
            () => {
              const rows = saved();
              rows.push({
                id: "user-" + Date.now(),
                name: name.slice(0, 60),
                fa: name.slice(0, 60),
                style: JSON.parse(JSON.stringify(c.style)),
                caption57: JSON.parse(
                  JSON.stringify(c.caption57 || { mode: "sentence" }),
                ),
              });
              localStorage.setItem(presetsKey, JSON.stringify(rows.slice(-50)));
              document.querySelector("#sheet").close();
            },
            "primary",
          ),
        );
      });
    }
    function presets() {
      const c = p().captions.find((c) => c.id === selected());
      if (!c) return;
      sheet(T("Caption styles", "استایل‌های کپشن"), (body) => {
        const grid = document.createElement("div");
        grid.className = "preset-grid57";
        body.append(grid);
        for (const preset of [...Captions.presets, ...saved()]) {
          const b = button(
            T(preset.name, preset.fa),
            () => {
              change((doc) => {
                const x = doc.captions.find((c) => c.id === selected());
                Object.assign(
                  x.style,
                  JSON.parse(JSON.stringify(preset.style)),
                );
                x.caption57 = { ...x.caption57, ...preset.caption57 };
                if (x.caption57.mode !== "sentence" && !x.words?.length)
                  Captions.distribute(x);
              });
              document.querySelector("#sheet").close();
            },
            "preset57",
          );
          b.style.setProperty("--preset-color", preset.style.color || "#fff");
          grid.append(b);
        }
      });
    }
    function tracks(tr) {
      sheet(T("Track settings", "تنظیمات لایه"), (body) => {
        const form = document.createElement("div");
        form.className = "form";
        body.append(form);
        field(
          form,
          "Name",
          "نام",
          tr.name,
          (v) =>
            change(
              (doc) =>
                (doc.tracks.find((t) => t.id === tr.id).name = v.slice(0, 40)),
            ),
          { type: "text", wide: true },
        );
        body.append(
          button(
            tr.locked
              ? T("Unlock", "بازکردن قفل")
              : T("Lock track", "قفل لایه"),
            () => {
              change(
                (doc) =>
                  (doc.tracks.find((t) => t.id === tr.id).locked = !tr.locked),
              );
              document.querySelector("#sheet").close();
            },
          ),
          button(T("Move up", "انتقال به بالا"), () => {
            change((doc) => Timeline.trackOrder(doc, tr.id, -1));
            document.querySelector("#sheet").close();
          }),
          button(T("Move down", "انتقال به پایین"), () => {
            change((doc) => Timeline.trackOrder(doc, tr.id, 1));
            document.querySelector("#sheet").close();
          }),
        );
      });
    }
    function keyframes(body, item) {
      const list = document.createElement("div");
      list.className = "key-list57";
      body.append(list);
      for (const [property, keys] of Object.entries(item.keys52 || {}))
        for (const key of keys) {
          const row = document.createElement("div");
          row.className = "key-row57";
          const name = document.createElement("span");
          name.textContent =
            property + " · " + key.time.toFixed(3) + " s → " + key.value;
          row.append(
            name,
            button("▶", () => seek(item.start + key.time)),
            button("×", () => {
              change((doc) => {
                Timeline.assertUnlocked(doc, item.id);
                const x =
                  doc.clips.find((x) => x.id === item.id) ||
                  (doc.layers52 || []).find((x) => x.id === item.id);
                x.keys52[property] = x.keys52[property].filter(
                  (k) => k.time !== key.time,
                );
              });
              row.remove();
            }),
          );
          list.append(row);
        }
    }
    return { caption, presets, tracks, keyframes };
  };
})(window);
