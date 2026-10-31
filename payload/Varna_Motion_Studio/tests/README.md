# Release verification — 4.5 RC47

Run `node tests/run-release.cjs` from the package root. Node.js and FFmpeg are development test dependencies; on Windows set VARNA_TEST_FFMPEG to ffmpeg.exe when needed. They are not prerequisites for installing the CEP panel itself.

The current release gate retains the 70 RC46 suites, adds eight focused RC47 suites, and promotes the engine-error and companion/shot checks into the gate. Models execute production code with constrained native primitives, event-driven DOM fixtures, mocked child processes and local HTTP/file streams. They do not run Adobe or render browser pixels. See TEST_REPORT_RC47.md for exact results.

The eight RC47 suites cover native template leaf properties and asset isolation; complete template UI; workspace toggles and sizes; CEP/project state/output receipts/preview cleanup; caption state and import history; independent backgrounds and typing; engine diagnostics and file failures; and app-level destinations and repair messages.

Historical tests r7, r8, r10, r11, r12, r13 and local_ai remain excluded because they expect superseded fuzzy correction defaults, version/marker/UI names or engine contracts. Historical music_duration_instrumental, rc14_regressions and rc20_broll_music_motion likewise retain superseded prompt/schema or fixture expectations. These archived tests are not counted as passing. rc23_boot_glass delegates to the already-counted rc24 suite.

`tests/rc45_browser.cjs` supplies browser interaction and viewport checks. It requires a separately installed Chromium/Playwright environment (VARNA_CHROMIUM points to the executable). No installed Chromium is available in the build environment; these checks are not counted as passed.

Native Windows installation, Adobe expression evaluation, real template import/render, font shaping, effect compatibility, GPU performance and actual inference remain separate verification requirements.

Table47 adds `table47_host.cjs` to the release gate. Run `node tests/table47_browser.cjs` separately with Playwright and Chromium (`VARNA_CHROMIUM`) for actual DOM, layout and drag/resize/live queue interaction. CEP is mocked; native Adobe rendering is separate. See TABLE47_README_FA.md.

UI47 Fluent Glass: run `node tests/ui47_controls_browser.cjs` with Playwright/Chromium for actual numeric drag/type/slider/keyboard/cancel/bounds/disabled/dynamic-field and theme/viewport checks. Original specialized timeline/gradient handles remain intact. Adobe/CEP native execution is a separate validation boundary. See UI47_README_FA.md.

Production47: `production47_core.cjs` is included in the release gate. `node tests/production47_browser.cjs` exercises every production route, staged background controls, review-only learning, actual right-click menus, explicit batch approval/cancel/stale rejection, undo/redo, protected words, sentence-edge one-to-many learning, license viewing and responsive layouts. Chromium is real; Adobe remains untested. Set VARNA_SCREENSHOT_DIR for browser screenshots. The R6 app expectation was updated from automatic pre-caption mutation to proposal-only review; its legacy explicit memory API and timing assertions remain.

Studio53: current gate97 suites, plus34 Vitest tests in root tooling53. Run npm --prefix tooling53 run test:browser from the repository root for the three real Chromium editor/host-boundary suites. The Studio53 validation report supersedes older statements above about Chromium availability/current host scope. Optional official OTIO and isolated PowerShell installer checks are documented in tooling53/README.md. Native hosts and actual model inference remain separate gates.
