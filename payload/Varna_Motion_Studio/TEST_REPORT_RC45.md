# RC45 verification

Environment: Linux, Node.js 24. Windows / Adobe After Effects unavailable.

## Executed

- 68/68 code suites: the prior 66 retained, plus RC45 production-host and app-closure regressions.
- Reproduced the reported scoping failure. Loaded the actual complete host inside a function-scoped evaluation, removed/replaced the public geometry-engine global, and created typography through the real caption renderer. Private engine binding remains usable.
- Actual typography routing and serialization with independently configured phrase fonts, entry/exit, delays, visible lifetimes, solid/gradient backgrounds and separate background timing. Style/background hooks use AE model fixtures; Adobe font shaping and pixels are not emulated.
- Verified caller payloads remain unchanged, per-phrase private comps/handles are created, failed creation rolls back, and preview/scene deletion removes owned graphs.
- Real live-preview coordinator: explicit preview seeks inside the cue; automatic updates preserve time; identical groups reuse existing layers.
- Actual app closure: common destination resolution, selected template/typography preserved in frame preview when the generic scope is All, genuine draft preview remains noncommitting, and design build selects the faithful paced renderer.
- Protected multiword phrase across a grouping boundary, plus existing math/timing/layout and caption-word retention tests.
- Existing RC43 boot, _err repair, 64 individual captions, queue serialization, cancellation, rollback, output reuse, full-template dependency isolation/color preservation and installer suites remain in the release gate.
- Changed JavaScript syntax and host ES3/conservative-regex checks passed. Embedded shared engine and standalone typography renderer stay synchronized with the combined host.
- Bundled asset byte comparison and final ZIP CRC / installer manifest SHA-256 verification are performed during packaging.

## Not executed

Chromium is unavailable. `tests/rc45_browser.cjs` is supplied for browser interaction/layout testing; it is not counted as passed. It covers asynchronous navigation after old-tab changes, smaller size progression, actual UI repartition, per-phrase controls and serialization, scene/template direct preview and visible errors, plus viewport/size/page combinations. The earlier RC40 browser fixture is updated for direct preview but was not rerun here.

No visual claim is made for the new UI. Native Windows installation, Adobe rendering, real fonts, GPU/effect compatibility and performance remain unverified. The four user screenshots were inspected to identify the visible ReferenceError, preview and navigation problems; they are evidence of RC44 behavior, not validation of RC45.
