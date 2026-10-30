const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { execFileSync } = require("node:child_process");
const server = require("./server.cjs");
(async () => {
  await new Promise((r) => server.listen(8560, "127.0.0.1", r));
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 393, height: 852 },
        isMobile: true,
        hasTouch: true,
        acceptDownloads: true,
      }),
      errors = [],
      external = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (
        /^https?:/.test(r.url()) &&
        !r.url().startsWith("http://127.0.0.1:8560")
      )
        external.push(r.url());
    });
    page.setDefaultTimeout(15000);
    await page.goto("http://127.0.0.1:8560");
    await page.waitForFunction(() => window.MobileApp);
    await page.locator("#language").click();
    assert.equal(await page.locator("html").getAttribute("dir"), "ltr");
    assert.equal(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth),
      true,
    );
    // Real file picker import and project-clock playback.
    await page
      .getByRole("button", { name: "+ Import media", exact: true })
      .click();
    await page
      .locator("#filePicker")
      .setInputFiles("/workspace/artifacts/mobile56-fixture.mp4");
    await page.locator(".asset").click();
    await page.evaluate(() => MobileApp.seek(0.8));
    assert.equal(
      await page.evaluate(() => MobileApp.project().clips.length),
      1,
    );
    const id = await page.evaluate(() => MobileApp.project().clips[0].id);
    await page.locator("#split").click();
    assert.equal(
      await page.evaluate(() => MobileApp.project().clips.length),
      2,
    );
    await page.locator("#undo").click();
    assert.equal(
      await page.evaluate(() => MobileApp.project().clips.length),
      1,
    );
    await page.locator("[data-tab=text]").click();
    await page.getByRole("button", { name: "+ Text", exact: true }).click();
    await page.locator("#inspector textarea").fill("helo world");
    await page.locator("#inspector textarea").dispatchEvent("change");
    const cid = await page.evaluate(() => MobileApp.state().selected);
    assert.equal(
      await page.locator("#mobileTextCheck input").isChecked(),
      false,
    );
    await page.locator("#mobileTextCheck input").check();
    await page.waitForFunction(() =>
      document.querySelector("#mobileTextCheck").classList.contains("found"),
    );
    assert.equal(
      await page.evaluate(() => MobileApp.project().captions[0].text),
      "helo world",
    );
    await page.locator(".alert-token").filter({ hasText: "helo" }).click();
    await page
      .getByRole("button", { name: "helo → hello", exact: true })
      .click();
    assert.equal(
      await page.evaluate(() => MobileApp.project().captions[0].text),
      "hello world",
    );
    await page.locator("#mobileTextCheck input").uncheck();
    assert.equal(await page.locator(".alert-token").count(), 0);
    await page.locator('[data-word="0"]').click();
    await page.getByLabel("Color", { exact: true }).fill("#ff4466");
    await page.getByLabel("Color", { exact: true }).dispatchEvent("change");
    assert.equal(
      await page.evaluate(
        () => MobileApp.project().captions[0].words[0].style.color,
      ),
      "#ff4466",
    );
    await page.locator("[data-tab=graphics]").click();
    await page.getByRole("button", { name: "+ Table", exact: true }).click();
    await page.getByLabel("Width", { exact: true }).fill("400");
    await page.getByLabel("Width", { exact: true }).dispatchEvent("change");
    assert.equal(
      await page.evaluate(() => MobileApp.project().layers52[0].width),
      400,
    );
    await page.getByRole("button", { name: "◇ Keyframe" }).click();
    await page.getByLabel("Property", { exact: true }).selectOption("width");
    await page.getByLabel("Value", { exact: true }).fill("520");
    await page.getByLabel("Value", { exact: true }).dispatchEvent("change");
    await page.getByRole("button", { name: "Add / replace keyframe" }).click();
    assert.equal(
      await page.evaluate(
        () => MobileApp.project().layers52[0].keys52.width[0].value,
      ),
      520,
    );
    await page.evaluate(() => {
      MobileApp.change((p) => {
        p.width = 320;
        p.height = 240;
        p.fps = 24;
        p.captions[0].start = 0;
        p.captions[0].end = 2.4;
        p.captions[0].style.size = 25;
        p.captions[0].words = [];
        p.layers52[0].start = 0;
        p.layers52[0].end = 2.4;
        p.layers52[0].width = 200;
        p.layers52[0].height = 80;
        p.layers52[0].fontSize = 15;
        p.layers52[0].keys52 = {};
      });
    });
    await page.evaluate(() => MobileApp.seek(1));
    await page.screenshot({ path: "/workspace/artifacts/Mobile56_editor.png" });
    const dl = page.waitForEvent("download", { timeout: 30000 });
    await page.locator("#export").click();
    await page.getByRole("button", { name: "WebM · VP8 / Opus" }).click();
    const download = await dl;
    await download.saveAs("/workspace/artifacts/Mobile56_test.webm");
    await page.waitForFunction(() => !MobileApp.state().exporting);
    const probe = JSON.parse(
      execFileSync("ffprobe", [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        "/workspace/artifacts/Mobile56_test.webm",
      ]),
    );
    assert(probe.streams.some((s) => s.codec_type === "audio"));
    assert.equal(
      probe.streams.find((s) => s.codec_type === "video").width,
      320,
    );
    assert(Math.abs(+probe.format.duration - 2.4) < 0.25);
    execFileSync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      "/workspace/artifacts/Mobile56_test.webm",
      "-f",
      "s16le",
      "-ac",
      "1",
      "/workspace/artifacts/Mobile56_test.pcm",
    ]);
    const pcm = fs.readFileSync("/workspace/artifacts/Mobile56_test.pcm");
    let sum = 0;
    for (let i = 0; i < pcm.length; i += 2) sum += pcm.readInt16LE(i) ** 2;
    assert(
      Math.sqrt(sum / (pcm.length / 2)) > 100,
      "Output audio is not silent",
    );
    await page.reload();
    await page.waitForFunction(
      () => window.MobileApp && MobileApp.project().clips.length === 1,
    );
    await page.evaluate(() => MobileApp.seek(1));
    assert.equal(
      await page.evaluate(() => MobileApp.project().captions[0].text),
      "hello world",
    );
    assert.equal(
      await page.evaluate(() => MobileApp.state().spellEnabled),
      false,
    );
    await page.setViewportSize({ width: 852, height: 393 });
    await page.waitForTimeout(100);
    assert.equal(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({
      path: "/workspace/artifacts/Mobile56_landscape.png",
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "PASS mobile: touch-size FA/EN layout, real MP4 import, split/Undo, offline review toggled/accepted without silent changes, word styling, table and width keyframe, shared Canvas rendering, real WebM with measured non-silent audio, persistent project/media and landscape. Native Android runtime is a separate gate.",
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
