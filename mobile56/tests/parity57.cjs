const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { execFileSync } = require("node:child_process"),
  server = require("./server.cjs");
(async () => {
  await new Promise((r) => server.listen(8560, "127.0.0.1", r));
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    const p = await b.newPage({
      viewport: { width: 393, height: 852 },
      acceptDownloads: true,
    });
    await p.goto("http://127.0.0.1:8560");
    await p.waitForFunction(() => window.MobileApp);
    await p.evaluate(() => {
      MobileApp.change((doc) => {
        doc.width = 320;
        doc.height = 240;
        doc.fps = 24;
        doc.captions = [
          {
            id: "parity",
            start: 0,
            end: 1,
            text: "سلام world",
            style: {
              font: "Vazir",
              size: 34,
              color: "#ffffff",
              x: 50,
              y: 50,
              entry: "none",
              shadow: false,
            },
            caption57: { mode: "karaoke", activeColor: "#00ff66" },
            words: [
              { text: "سلام", start: 0, end: 0.5, style: {} },
              { text: "world", start: 0.5, end: 1, style: {} },
            ],
          },
        ];
      });
    });
    await p.evaluate(() => document.fonts.ready);
    for (const [label, time] of [
      ["a", 0.25],
      ["b", 0.75],
    ]) {
      await p.evaluate((t) => MobileApp.seek(t), time);
      const data = await p
        .locator("#preview")
        .evaluate((c) => c.toDataURL().split(",")[1]);
      fs.writeFileSync(
        "/workspace/artifacts/Mobile57_preview_" + label + ".png",
        Buffer.from(data, "base64"),
      );
    }
    const dl = p.waitForEvent("download");
    await p.locator("#export").click();
    await p.getByRole("button", { name: "WebM · VP8 / Opus" }).click();
    await (await dl).saveAs("/workspace/artifacts/Mobile57_parity.webm");
    for (const [label, time] of [
      ["a", "0.25"],
      ["b", "0.75"],
    ])
      execFileSync("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-ss",
        time,
        "-i",
        "/workspace/artifacts/Mobile57_parity.webm",
        "-vf",
        "scale=in_range=pc:out_range=pc:in_color_matrix=bt709",
        "-frames:v",
        "1",
        "/workspace/artifacts/Mobile57_export_" + label + ".png",
      ]);
    const result = execFileSync(
      "python",
      [
        "-c",
        `from PIL import Image, ImageChops, ImageStat
for label in ['a','b']:
 a=Image.open('/workspace/artifacts/Mobile57_preview_'+label+'.png').convert('RGB');b=Image.open('/workspace/artifacts/Mobile57_export_'+label+'.png').convert('RGB');error=sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3
 print(label,round(error,3));assert error<4,error
`,
      ],
      { encoding: "utf8" },
    );
    console.log(
      "PASS57 shared render preview/WebM frame parity, 320x240 Persian/English karaoke, mean RGB absolute error <4/255 after honoring WebM full-range BT.709 container metadata:\n" +
        result,
    );
  } finally {
    await b.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
