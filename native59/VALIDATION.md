# Native59 validation — 2026-10-30

APK: `releases/Varna-Mobile-0.4.0-native59.apk`, 9,102,558 bytes.
SHA-256: `720d7aa6b1504b922e4477cdd9acc0840cc5784f31b5182ea8f154e392873135`.
Version 0.4.0-native59 / code 5901, Android API 29–35, arm64-v8a and x86_64. Same dedicated preview signing identity as Mobile56–Connect58. Release is not debuggable. This is a focused corrective preview; full CapCut parity is not delivered.

| Gate | Result and scope |
| --- | --- |
| Desktop regression | 100/100 suites passed; native Adobe/Resolve/Windows execution remains separate. |
| Windows source package | 3,301 payload sizes/SHA-256 values verified; parser passed for all modified PowerShell scripts. |
| Downloader | Actual loopback HTTP 5 MiB transfer: resumed partial bytes, restarted when Range was ignored, exact size/SHA, measured speed/%/ETA. |
| Engine repair | Actual production function invoked against a controlled archive/extractor/health fixture: stale GHAF does not skip repair, old models preserved, failed stage not activated, verified download retained. Python/Torch/7zr-on-Windows are modeled, not executed. |
| Personal-server BAT | Actual filesystem orchestration against fixtures: service/core/FFmpeg layout, shared-runtime delegation, preserved token/model settings and reinstall backup. Windows shortcut COM and runtime installation are modeled. |
| Browser editor | Real H.264/AAC fixture import, split/Undo, independently toggled and explicitly accepted offline correction, word styling, table size keys, persistence, portrait/landscape and non-silent WebM export passed. |
| Native Android preview | Actual Android 10 x86_64 emulator, WebView 74, Media3/MediaCodec decoded a 320×240 H.264/AAC MP4. Visible decoded pixels, five burst seeks ending at 0.4 s, playback/pause, and cancellation while preparing playback passed. No HTML video decoder on this path. |
| Native Android export | Actual source MP4 -> shared Canvas -> MediaCodec/Muxer MP4 completed again after final playback changes. File extracted and ffprobe checked H.264 320×240 + AAC, 0.512 s. |
| Speech runtime | Actual JNI library loading succeeded in Android; model state correctly reported not installed. No weights/inference/ASR quality test passed: environment weight download returned HTTP 403. Verified model import/download are implemented, but real inference is still unvalidated. |
| APK integrity | Every web asset equals bundled build input; each JNI library equals its locked binary; v1/v2/v3 signatures verified, only INTERNET permission, no signing key in APK, no debuggable flag. ELF LOAD alignment 0x4000 and ZIP 16 KiB library alignment verified. |

The software emulator uses TCG/SwiftShader without KVM. Import/preview are slow there; those timings are **not Honor 90 performance measurements**. Physical Honor 90, longer exports, heat/battery, many concurrent tracks, other MP4 codecs, 16 KiB-page device execution and real Windows engine installation remain untested.

Preview still copies/compresses native pixels across the WebView bridge. It is not a zero-copy GPU compositor. Export remains foreground-only, at most 1080p/30 fps/180 seconds. Whisper base weights are optional 147,951,465 bytes, separately downloaded/imported and verified. Precise word forced alignment, native AEX equivalence, iOS and the complete CapCut feature set are not claimed.

The former RC18 static test required silently skipping installation whenever an uncertain engine directory existed. That conflicted with the requested repair. Its acceptance now verifies healthy-engine reuse, separate staging and health-before-activation. Production orchestration tests independently exercise that behavior; old user engines/models are preserved.

Harnesses are in `tests/`. Native harnesses require a test-only debuggable build, a real fixture in private app storage and the current WebView CDP socket forwarded to 9259. No test-debug APK is published. The final release differs from the tested debug build by disabled debugging and removal of native debug symbols; JNI exported code is retained.
