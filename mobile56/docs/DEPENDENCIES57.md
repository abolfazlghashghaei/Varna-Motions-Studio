# Dependency review — Mobile57

Upstream metadata and license files were read on 2026-10-30. These pins are **evaluation candidates**, not an integrated/compatible SDK lockfile. Full source commit and license-blob evidence: `upstream-audit57.json`. Model weights and transitive dependencies require their own audit before distribution.

| Source | Candidate ref | Commit | Upstream license metadata | Role |
|---|---|---|---|---|
| [flutter/flutter](https://github.com/flutter/flutter) | `3.47.9` | `c197ca5199e9` | BSD-3-Clause | Target UI; not built |
| [dart-lang/sdk](https://github.com/dart-lang/sdk) | `main` | `5babfd06df55` | BSD-3-Clause | Use Dart bundled with selected Flutter; do not independently install main |
| [rust-lang/rust](https://github.com/rust-lang/rust) | `1.99.1` | `58cf8f9c35b3` | Apache-2.0 | Target portable core; not built |
| [fzyzcjy/flutter_rust_bridge](https://github.com/fzyzcjy/flutter_rust_bridge) | `v2.13.0` | `8631db91a90c` | MIT | Target FFI; not integrated |
| [androidx/media](https://github.com/androidx/media) | `1.11.1` | `8c6678b657ed` | Apache-2.0 | Native media prototype candidate |
| [gfx-rs/wgpu](https://github.com/gfx-rs/wgpu) | `v30.0.1` | `40f4a34ebaf5` | Apache-2.0 | GPU interoperability prototype candidate |
| [google/skia](https://github.com/google/skia) | `main` | `0789f2ab93b8` | BSD-3-Clause | Text/graphics; coordinate with Flutter-pinned Skia |
| [harfbuzz/harfbuzz](https://github.com/harfbuzz/harfbuzz) | `15.0.0` | `35f656a1a2ba` | NOASSERTION | Text shaping; inspect COPYING, metadata alone is insufficient |
| [unicode-org/icu](https://github.com/unicode-org/icu) | `release-79.1` | `ddc6b66926bf` | NOASSERTION | BiDi/Unicode; inspect LICENSE |
| [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) | `n8.0` | `140fd653aed8` | NOASSERTION | Optional media utility; LGPL/GPL depends on exact configuration |
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | `v1.9.5` | `d1be6fde11ac` | MIT | Android local ASR candidate; model manifest separate |
| [argmaxinc/WhisperKit](https://github.com/argmaxinc/WhisperKit) | `v1.1.1` | `1bbc57cb7fe6` | MIT | iOS local ASR candidate; models/features separate |
| [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime) | `v1.30.1` | `411c70686dda` | MIT | Optional VAD/model runtime |
| [snakers4/silero-vad](https://github.com/snakers4/silero-vad) | `v6.2.3` | `5cd7945676eb` | MIT | VAD model candidate; record exact weights |
| [xiph/rnnoise](https://github.com/xiph/rnnoise) | `v0.2` | `904a876dce1f` | BSD-3-Clause | Later denoising module |
| [google/oboe](https://github.com/google/oboe) | `1.11.0` | `b115f4759396` | Apache-2.0 | Later low-latency playback; not a video mixer |
| [airbnb/lottie-android](https://github.com/airbnb/lottie-android) | `v6.7.1` | `c8addcb776f6` | Apache-2.0 | Optional animation assets; export adapter required |
| [airbnb/lottie-ios](https://github.com/airbnb/lottie-ios) | `4.6.1` | `f4db77d7feac` | Apache-2.0 | Optional iOS animation assets |
| [AcademySoftwareFoundation/OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO) | `main` | `4524367491df` | Apache-2.0 | Interchange/reference model; does not render |
| [openreelio/openreelio](https://github.com/openreelio/openreelio) | `v0.1.13` | `a8dccebb90fb` | MIT | Architecture reference; not mobile runtime |
| [LeGoffMael/video_editor](https://github.com/LeGoffMael/video_editor) | `v3.0.0` | `e333ccc43ec0` | MIT | Gesture/UI reference; not a complete export engine |

NOASSERTION does not mean permission to redistribute. The actual license files are retained in the audit. Rust/wgpu metadata showing one license does not summarize all dual-license files. `main` pins are exact research snapshots and are not selected production releases.

## Actually packaged

- Varna shared JS project/graphics/title renderer: repository source, exact hashes in APK `assets/shared/shared-manifest.json`.
- nspell 2.1.5 and is-buffer 2.0.5 (MIT), bundled worker; dictionary files pinned by source SHA-256.
- Persian Lilak-derived and English Hunspell dictionaries from wooorm/dictionaries commit `8cfea406b505e4d7df52d5a19bce525df98c54ab`; see each dictionary license, not just the wrapper repository license.
- Vazirmatn font, SIL OFL notice included.
- Android platform APIs (API 29 minimum, compiled against SDK35/build-tools35); system WebView/MediaCodec supplied by the device.
- No Flutter, Rust, Media3, FFmpeg, neural model weights, commercial assets or native Adobe plugin binaries are in this APK.

## Development only

Playwright 1.62.1, system Chromium, Node test runner, FFmpeg/ffprobe fixtures, Android build tools, Python3 and Java21. Prettier 3.6.2 is a development formatter outside the app; it is not packaged. Original text-worker dependency lockfiles live in `tooling53/text55-build`.
