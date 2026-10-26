# Release verification — 4.5 RC47

Run `node tests/run-release.cjs` from the package root. Node.js and FFmpeg are development test dependencies; on Windows set VARNA_TEST_FFMPEG to ffmpeg.exe when needed. They are not prerequisites for installing the CEP panel itself.

The current release gate retains the 70 RC46 suites, adds eight focused RC47 suites, and promotes the engine-error and companion/shot checks into the gate. Models execute production code with constrained native primitives, event-driven DOM fixtures, mocked child processes and local HTTP/file streams. They do not run Adobe or render browser pixels. See TEST_REPORT_RC47.md for exact results.

The eight RC47 suites cover native template leaf properties and asset isolation; complete template UI; workspace toggles and sizes; CEP/project state/output receipts/preview cleanup; caption state and import history; independent backgrounds and typing; engine diagnostics and file failures; and app-level destinations and repair messages.

Historical tests r7, r8, r10, r11, r12, r13 and local_ai remain excluded because they expect superseded fuzzy correction defaults, version/marker/UI names or engine contracts. Historical music_duration_instrumental, rc14_regressions and rc20_broll_music_motion likewise retain superseded prompt/schema or fixture expectations. These archived tests are not counted as passing. rc23_boot_glass delegates to the already-counted rc24 suite.

`tests/rc45_browser.cjs` supplies browser interaction and viewport checks. It requires a separately installed Chromium/Playwright environment (VARNA_CHROMIUM points to the executable). No installed Chromium is available in the build environment; these checks are not counted as passed.

Native Windows installation, Adobe expression evaluation, real template import/render, font shaping, effect compatibility, GPU performance and actual inference remain separate verification requirements.
