# Studio55 validation and limits

Changes: cancellable offline text correction with an independent persistent master switch; bundled full Persian/English dictionaries, local personal dictionary and reviewed context preferences; conservative normalization and Finglish suggestions; movable/resizable editor panes, compact workspace tabs and saved/reset arrangements. The original production controls and host separation are retained.

## Verified in this workspace

* Full release gate: **100/100 suites** passed. Timeline Vitest: **34 tests** passed. TypeScript contracts passed typechecking.
* Existing browser regression gate passed: real media decode/export, timeline/source/ruler edits, detached/fullscreen behavior, word styles, color/graphic pixels, work-area export, original production dialogs, caption identity/Undo, repeated editor open/close, and native-adapter models.
* New Studio55 browser regression passed: no dictionary reads while disabled; actual worker startup; explicit spelling/Finglish approval; unchanged caption timing; Undo/Redo; stale-source rejection; disabling closes dialogs, terminates the worker and rejects pending operations; persistence across reload; enable/disable/re-enable race; local dictionary saving; actual pointer drag and divider resize; responsive panels, compact tab label separation, production tools and reset. External HTTP requests were intercepted: none were made in this scenario.
* A separate file-asset-adapter browser test passed with actual Blob workers and a simulated CEP `fs` bridge: Persian normalization, typed trailing-space/caret retention, independent suggestions/Finglish switches, and disabled autocorrection. The managed browser prohibits `file://` navigation, so the test uses a file base URL in a served page. This is a transport model, not native CEP execution.
* Actual PowerShell executed the staged installers for Resolve, Premiere and the standalone workspace in isolated filesystem user roots. New dictionaries/bundle/worker and existing assets are copied and checked. Verified Electron runtime, backup/reinstall, corrupt-source rejection and corrupt-runtime rejection passed. Native editor modules remain excluded from Premiere/Resolve.
* Package manifest validates every payload file by byte count and SHA-256. Dictionary source hashes, npm lockfile integrity values and original notices are retained. Desktop and compact workspace screenshots were inspected; a compressed-label overlap was fixed.

No After Effects/Premiere/Resolve binaries, Windows application activation, iOS/Android app, neural correction model or GPU mobile compositor was executed in this cloud environment. This is a prerelease for validation on the user's device, not a claim of full parity with a commercial NLE.

## Fixed corpus measurements

`STUDIO55_BENCHMARK.json` records the environment, corpus hash, memory and every missed case. On Node 24 / Linux / AMD EPYC 9V74:

| Measure | Observed result |
|---|---|
| Spelling corpus | 61 authored samples: 23 errors, 38 valid controls |
| Detection | 22 true positives, 1 false negative, 0 false positives in this small corpus |
| Correct suggestion Top-1 / Top-5 | 91.3% / 91.3% of error samples |
| Finglish Top-1 / Top-5 | 73.3% / 86.7%, 15 samples including unsupported transliterations |
| First lookup p95 / maximum | approximately 3.05 / 10.20 ms after dictionary initialization |
| Dictionary initialization | approximately 1.74 seconds |
| Additional Node heap after initialization | approximately 171.9 MiB; process RSS approximately 284 MiB |

These are development-regression measurements, **not** an independent benchmark, Windows latency promise, memory requirement for every host or production accuracy estimate. Lookup timing excludes browser/worker message transport and dictionary startup. The engine has been developed against this corpus, so the figures must not be marketed as held-out accuracy. The corpus and benchmark script are committed for reproducibility.

Known misses include a dictionary-accepted Persian spelling (`دووست`), ranking of `موسقی`, and unseen Finglish such as `dostet`/`kojaei`. Exact valid English words stay English unless explicitly reviewed as Finglish. Formalizing colloquial Persian, generic transliteration, real-word contextual errors, grammar, and neural Persian inference remain future work. No SymSpell/other-engine comparative benchmark was performed.

## Reproduction

```
node tooling53/build-host-ui.mjs
node tooling53/text55-build/build.cjs
node --expose-gc tooling53/text55-build/benchmark.cjs
python Varna_Motion_Studio/tools/build_manifest.py
node Varna_Motion_Studio/tests/run-release.cjs
npm --prefix tooling53 test
npm --prefix tooling53 run typecheck
npm --prefix tooling53 run test:browser
VARNA_PWSH=/path/to/pwsh VARNA_RUNTIME_ZIP54=/path/to/verified-electron.zip python tooling53/installer54-check.py
```

Offline provisioning/build instructions: `tooling53/text55-build/README.md`. Installation/user controls: `Varna_Motion_Studio/STUDIO55_FA.md`. Dependency selection/audit: `STUDIO55_REFERENCES.md`. Mobile work remains explicitly separated in `MOBILE55_ARCHITECTURE.md`.
