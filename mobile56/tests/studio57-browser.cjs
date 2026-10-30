const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const server = require("./server.cjs");
(async () => {
  await new Promise((r) => server.listen(8560, "127.0.0.1", r));
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    const p = await b.newPage({
        viewport: { width: 393, height: 852 },
        isMobile: true,
        hasTouch: true,
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.setDefaultTimeout(20000);
    await p.goto("http://127.0.0.1:8560");
    await p.waitForFunction(() => window.MobileApp);
    await p.locator("#language").click();
    await p
      .getByRole("button", { name: "+ Import media", exact: true })
      .click();
    await p
      .locator("#filePicker")
      .setInputFiles("/workspace/artifacts/mobile56-fixture.mp4");
    await p.waitForFunction(()=>MobileApp.project().clips.length===1);
    await p.locator(".waveform57").waitFor();
    assert.equal(
      await p.evaluate(() =>
        document
          .querySelector(".waveform57")
          .getContext("2d")
          .getImageData(0, 0, 150, 32)
          .data.some((x) => x > 0),
      ),
      true,
    );
    await p.locator("[data-tab=text]").click();
    await p.getByRole("button", { name: "+ Text", exact: true }).click();
    await p.getByLabel("Caption", { exact: true }).fill("سلام world");
    await p.getByLabel("Caption", { exact: true }).dispatchEvent("change");
    await p
      .getByLabel("Caption display", { exact: true })
      .selectOption("karaoke");
    const id = await p.evaluate(() => MobileApp.state().selected);
    await p.evaluate(() => {
      MobileApp.change((doc) => {
        doc.width = 320;
        doc.height = 240;
        doc.captions[0].end = 2.4;
        VarnaCaptions57.distribute(doc.captions[0]);
        doc.captions[0].style.size = 32;
        doc.captions[0].style.bg = null;
      });
    });
    await p.evaluate(() => MobileApp.seek(0.8));
    const first = await p.locator("#preview").evaluate((c) => c.toDataURL());
    await p.evaluate(() => MobileApp.seek(1.8));
    const second = await p.locator("#preview").evaluate((c) => c.toDataURL());
    assert.notEqual(first, second, "Karaoke must change the rendered pixels");
    await p.locator('[data-word="0"]').click();
    await p.getByLabel("Word end", { exact: true }).fill("1.1");
    await p.getByLabel("Word end", { exact: true }).dispatchEvent("change");
    assert.equal(
      await p.evaluate(() => MobileApp.project().captions[0].words[0].end),
      1.1,
    );
    await p
      .getByRole("button", { name: "Save this style", exact: true })
      .click();
    await p.getByLabel("Name", { exact: true }).fill("My glass karaoke");
    await p.getByLabel("Name", { exact: true }).dispatchEvent("change");
    await p.getByRole("button", { name: "Save", exact: true }).click();
    await p.getByRole("button", { name: "Styles", exact: true }).click();
    assert.equal(
      await p
        .getByRole("button", { name: "My glass karaoke", exact: true })
        .count(),
      1,
    );
    await p.locator("#sheetClose").click();
    await p.locator("#duplicate").click();
    assert.equal(
      await p.evaluate(() => MobileApp.project().captions.length),
      2,
    );
    assert.equal(
      await p.evaluate(() => MobileApp.project().captions[1].words[0].start),
      2.4,
    );
    await p.locator("#undo").click();
    await p.locator("#theme57").click();
    assert.equal(await p.locator("html").getAttribute("data-theme"), "light");
    assert.equal(
      await p.evaluate(() => document.body.scrollWidth <= innerWidth),
      true,
    );
    await p.screenshot({ path: "/workspace/artifacts/Mobile57_light.png" });
    await p.locator("#theme57").click();
    await p.locator("[data-tab=media]").click();
    await p
      .locator("#timelineScroll")
      .evaluate((e) => (e.scrollTop = e.scrollHeight));
    await p.locator(".track-settings57").filter({ hasText: "V1" }).click();
    await p.getByRole("button", { name: "Lock track", exact: true }).click();
    await p.evaluate(() => MobileApp.select(MobileApp.project().clips[0].id));
    await p.locator("#duplicate").click();
    assert.equal(await p.evaluate(() => MobileApp.project().clips.length), 1);
    assert((await p.locator("#status").textContent()).includes("Unlock"));
    await p.locator(".track-settings57").filter({ hasText: "V1" }).click();
    await p.getByRole("button", { name: "Unlock", exact: true }).click();
    const portable = await p.evaluate(() =>
      VarnaProject57.pack(MobileApp.project()),
    );
    assert.equal(portable.captions[0].words[0].endTicks, 792000);
    await p.locator("#projectMenu").click();
    const dl = p.waitForEvent("download");
    await p
      .getByRole("button", { name: "Save project file", exact: true })
      .click();
    const download = await dl;
    assert.equal(download.suggestedFilename(), "Project.varna");
    await download.saveAs("/workspace/artifacts/Mobile57_project.varna");
    assert.equal(
      JSON.parse(fs.readFileSync("/workspace/artifacts/Mobile57_project.varna"))
        .format,
      "varna-project",
    );
    await p.locator("#sheetClose").click();
    await p.evaluate((id) => {
      MobileApp.select(id);
      MobileApp.seek(0.8);
    }, id);
    await p.screenshot({ path: "/workspace/artifacts/Mobile57_caption.png" });
    // The Android bridge uses one in-flight frame and explicit acks; run the actual export UI with a modeled bridge.
    await p.addInitScript(() => {
      window.nativeTest57 = { active: 0, max: 0, frames: [], done: false };
      window.MobileNative = {
        beginExport57(id, w, h, fps, frames, audio) {
          nativeTest57.expected = frames;
          setTimeout(() => MobileReply(id, true, null), 0);
        },
        encodeFrame57(id, data, index) {
          nativeTest57.active++;
          nativeTest57.max = Math.max(nativeTest57.max, nativeTest57.active);
          setTimeout(() => {
            nativeTest57.frames.push({ index, png: data.startsWith("iVBOR") });
            nativeTest57.active--;
            MobileReply(id, true, null);
          }, 8);
        },
        finishExport(id) {
          setTimeout(() => {
            nativeTest57.done = true;
            MobileReply(id, "test.mp4", null);
          }, 10);
        },
        cancelExport() {
          nativeTest57.cancelled = true;
        },
        share(name) {
          nativeTest57.shared = name;
        },
      };
    });
    await p.reload();
    await p.getByRole("button",{name:"Continue previous project",exact:true}).click();
    await p.waitForFunction(() => window.MobileApp);
    await p.evaluate(() => {
      MobileApp.change((doc) => {
        doc.clips = [];
        doc.assets = [];
        doc.captions[0].end = 1;
        VarnaCaptions57.distribute(doc.captions[0]);
      });
    });
    await p.locator("#export").click();
    await p
      .getByRole("button", { name: "MP4 · H.264 / AAC", exact: true })
      .click();
    await p.waitForFunction(
      () => nativeTest57.done && !MobileApp.state().exporting,
    );
    const native = await p.evaluate(() => nativeTest57);
    assert.equal(native.max, 1);
    assert.equal(native.frames.length, native.expected);
    assert(native.frames.every((f, i) => f.index === i && f.png));
    assert.equal(native.shared, "test.mp4");
    assert.deepEqual(errors, []);
    console.log(
      "PASS57 UI: actual waveform, karaoke pixels, editable word timing, saved style, duplicate/Undo, .varna export, lock enforcement, light/dark responsive layout, and serialized asynchronous Android frame bridge (modeled bridge, not device execution).",
    );
  } finally {
    await b.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
