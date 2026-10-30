(function (w) {
  "use strict";
  w.VarnaSpeech59 = function (api) {
    const { T, sheet, button, request, rpc, project, change, status } = api;
    function open() {
      if (!w.MobileNative?.speechState59) {
        status(
          T(
            "Local speech engine is available in the Android app",
            "موتور گفتار محلی در اپ اندروید در دسترس است",
          ),
        );
        return;
      }
      sheet(T("On-device captions", "زیرنویس روی خود گوشی"), (body) => {
        const state = rpc("speechState59"),
          note = document.createElement("p");
        note.className = "note";
        note.textContent = T(
          "whisper.cpp native CPU engine · multilingual base model, 142 MiB. No video/audio is uploaded. Word alignment still needs review.",
          "موتور بومی whisper.cpp روی CPU · مدل چندزبانهٔ base با حجم ۱۴۲ MiB. ویدیو و صدا ارسال نمی‌شوند. زمان‌بندی واژه‌ها همچنان نیاز به بررسی دارد.",
        );
        body.append(note);
        const out = document.createElement("p");
        out.className = "connection-status58";
        out.textContent = state.installed
          ? T("Verified model installed", "مدل نصب شده است")
          : T("Install the model before transcription", "ابتدا مدل را نصب کن");
        body.append(out);
        const task = async (method, ...args) => {
          const timer = setInterval(() => {
            try {
              const s = rpc("speechState59");
              out.textContent =
                s.phase === "downloading model"
                  ? `${(s.received / 1048576).toFixed(1)} / 141.1 MiB · ${Math.floor((s.received / s.bytes) * 100)}%`
                  : s.phase === "transcribing"
                    ? T("Transcribing · ", "تشخیص گفتار · ") + s.progress + "%"
                    : s.phase;
            } catch (e) {}
          }, 400);
          try {
            const result = await request(method, ...args);
            out.textContent = T("Completed", "انجام شد");
            return result;
          } catch (e) {
            out.textContent = e.message;
            throw e;
          } finally {
            clearInterval(timer);
          }
        };
        body.append(
          button(
            T("Download model · 142 MiB", "دانلود مدل · ۱۴۲ MiB"),
            async () => {
              await task("downloadModel59");
              open();
            },
          ),
          button(
            T("Import verified ggml-base.bin", "واردکردن فایل ggml-base.bin"),
            async () => {
              const file = await request("pick", "model");
              if (file) {
                await task("importModel59", file.id);
                open();
              }
            },
          ),
        );
        const run = button(
          T("Generate captions locally", "ساخت زیرنویس محلی"),
          async () => {
            const p = project(),
              selected = w.MobileApp.state().selected,
              c = p.clips.find((c) => c.id === selected) || p.clips[0],
              a = p.assets.find((a) => a.id === c?.assetId);
            if (!c || !a?.mobile56?.nativeId)
              throw Error(
                T(
                  "Select an audio/video clip on the phone first",
                  "ابتدا یک کلیپ صوتی/ویدیویی روی گوشی انتخاب کن",
                ),
              );
            w.MobileApp.pause();
            const text = p.name + ":" + JSON.stringify(p.clips),
              result = await task(
                "transcribe59",
                a.mobile56.nativeId,
                c.in,
                c.out,
                document.documentElement.lang,
              );
            body.append(
              button(
                T("Import generated captions", "ورود زیرنویس ساخته‌شده"),
                () => {
                  if (
                    project().name + ":" + JSON.stringify(project().clips) !==
                    text
                  )
                    throw Error(
                      T(
                        "Source project changed; return to the original project before importing",
                        "پروژهٔ منبع تغییر کرده؛ پیش از ورود به پروژهٔ اصلی برگرد",
                      ),
                    );
                  change((doc) => {
                    for (const row of result.segments) {
                      if (row.end <= row.start || row.start >= c.out-c.in || !row.text.trim()) continue;
                      doc.captions.push({
                        id: VarnaEdit51.id(),
                        start: c.start + row.start,
                        end: Math.min(
                          c.start + c.out - c.in,
                          c.start + row.end,
                        ),
                        text: row.text.trim(),
                        style: {
                          font: "Vazir",
                          size: 62,
                          color: "#ffffff",
                          x: 50,
                          y: 78,
                          entry: "fade",
                        },
                        words: [],
                        caption57: { mode: "sentence", timingSource: "asr" },
                      });
                    }
                  });
                  document.getElementById("sheet").close();
                },
                "primary",
              ),
            );
          },
        );
        run.disabled = !state.installed;
        body.append(
          run,
          button(T("Cancel processing", "لغو پردازش"), () =>
            MobileNative.cancelSpeech59(),
          ),
        );
      });
    }
    return { open };
  };
})(window);
