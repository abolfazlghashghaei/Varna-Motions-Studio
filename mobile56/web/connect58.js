(function (w) {
  "use strict";
  w.VarnaConnect58 = {
    open(api) {
      const {
        T,
        sheet,
        field,
        button,
        request,
        native,
        project,
        assets,
        status,
        receiveText,
      } = api;
      let cfg;
      try {
        cfg = JSON.parse(localStorage.getItem("personal-server58") || "{}");
      } catch (e) {
        cfg = {};
      }
      const call = (method, route, body = "") => {
        if (!native)
          throw Error(
            T(
              "Use the Android app to connect",
              "اتصال را از اپ اندروید انجام بده",
            ),
          );
        return request(
          "server58",
          cfg.url,
          cfg.token,
          method,
          route,
          typeof body === "string" ? body : JSON.stringify(body),
        );
      };
      async function upload(a) {
        if (!a.mobile56?.nativeId)
          throw Error("Relink media on this phone before uploading");
        return (await call("POST", "/v1/uploads", a.mobile56.nativeId)).mediaId;
      }
      async function job(operation) {
        let stopped = false,
          id;
        sheet(T("Personal processing", "پردازش روی سیستم شخصی"), (body) => {
          const out = document.createElement("p");
          out.className = "connection-status58";
          out.textContent = T(
            "Uploading selected media…",
            "در حال ارسال رسانه…",
          );
          body.append(
            out,
            button(T("Cancel", "لغو"), async () => {
              stopped = true;
              w.MobileNative?.cancelServer58?.();
              if (id) await call("DELETE", "/v1/jobs/" + id);
              out.textContent = T(
                "Cancelled. Check AE before retrying a host operation.",
                "لغو شد؛ پیش از تکرار عملیات افتر، وضعیت خود افتر را بررسی کن.",
              );
            }),
          );
          (async () => {
            try {
              let input = { operation };
              if (operation === "ae.build") {
                input.project = JSON.parse(JSON.stringify(project()));
                for (const a of input.project.assets) {
                  if (stopped) return;
                  a.serverId58 = await upload(a);
                  delete a.localPath;
                }
              } else {
                const p = project(),
                  selected = w.MobileApp.state().selected,
                  c = p.clips.find((c) => c.id === selected) || p.clips[0],
                  a = p.assets.find((a) => a.id === c?.assetId);
                if (!a)
                  throw Error(
                    T("Select a source clip first", "ابتدا یک کلیپ انتخاب کن"),
                  );
                input.mediaId = await upload(a);
                input.language =
                  document.documentElement.lang === "en" ? "en" : "fa";
              }
              if (stopped) return;
              id = (await call("POST", "/v1/jobs", input)).id;
              while (!stopped) {
                const j = await call("GET", "/v1/jobs/" + id);
                out.textContent = T("Server job: ", "وضعیت پردازش: ") + j.state;
                if (j.state === "failed" || j.state === "cancelled")
                  throw Error(j.error || j.state);
                if (j.state === "completed") {
                  const result = await call(
                    "GET",
                    "/v1/jobs/" + id + "/result",
                  );
                  if (operation === "proxy")
                    await w.MobileApp.importMedia(result);
                  else if (operation === "transcribe")
                    await receiveText(
                      "srt",
                      JSON.parse(MobileNative.readText(result.id)).value,
                    );
                  out.textContent =
                    operation === "ae.build"
                      ? T(
                          "Project created as a new AE composition",
                          "پروژه در یک کامپوزیشن جدید افتر ساخته شد",
                        )
                      : T("Result imported", "نتیجه وارد شد");
                  return;
                }
                await new Promise((r) => setTimeout(r, 1000));
              }
            } catch (e) {
              out.textContent = e.message;
              status(e.message);
            }
          })();
        });
      }
      sheet(T("Processing & connection", "پردازش و اتصال"), (body) => {
        const cloud = document.createElement("p");
        cloud.className = "note";
        cloud.textContent = T(
          "Main server · not configured yet",
          "سرور اصلی · اطلاعات اتصال هنوز تنظیم نشده",
        );
        body.append(cloud);
        const title = document.createElement("h3");
        title.textContent = T("Personal computer", "سیستم شخصی");
        body.append(title);
        const form = document.createElement("div");
        form.className = "form";
        body.append(form);
        field(
          form,
          "Server address",
          "آدرس سرور",
          cfg.url || "",
          (v) => (cfg.url = v.replace(/\/$/, "")),
          { type: "text", wide: true },
        );
        field(
          form,
          "Pairing key",
          "کلید اتصال",
          cfg.token || "",
          (v) => (cfg.token = v.trim()),
          { type: "password", wide: true },
        );
        const out = document.createElement("p");
        out.className = "connection-status58";
        body.append(
          out,
          button(
            T("Connect", "اتصال"),
            async () => {
              out.textContent = T("Connecting…", "در حال اتصال…");
              const cap = await call("GET", "/v1/status");
              localStorage.setItem("personal-server58", JSON.stringify(cfg));
              out.textContent = T("Connected to ", "متصل به ") + cap.name;
              for (const [label, fa, operation, key] of [
                [
                  "Make compatible video",
                  "ساخت ویدیوی سازگار",
                  "proxy",
                  "proxy",
                ],
                [
                  "Generate subtitles",
                  "ساخت زیرنویس",
                  "transcribe",
                  "transcribe",
                ],
                [
                  "Send project to After Effects",
                  "ارسال پروژه به افتر",
                  "ae.build",
                  "aeBuild",
                ],
              ]) {
                const b = button(T(label, fa), () => job(operation));
                b.disabled = !cap.operations[key];
                body.append(b);
              }
              const note = document.createElement("p");
              note.className = "note";
              note.textContent = T(
                "Unavailable tools need configuration on your PC. Only the operation you choose uploads media.",
                "ابزارهای غیرفعال به تنظیم روی کامپیوتر نیاز دارند. فایل فقط با انتخاب عملیات ارسال می‌شود.",
              );
              body.append(note);
            },
            "primary",
          ),
        );
      });
    },
  };
})(window);
