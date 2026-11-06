# Android Native65 — media-editor MVP

Release target: 0.6.0-native65 / versionCode 6501 / Android API 29+.
This is the media-editor MVP checkpoint, not completion of all four phases or CapCut parity.

## Integrated production paths

- Imports videos, still images and audio through the existing Android document picker and app-private media service. Image metadata and JPEG EXIF orientation are handled natively. Existing file/project workflows remain available.
- Overlapping imports get separate, visible timeline tracks above existing layers. Nonoverlapping clips can reuse an unlocked track. Split preserves compositing order rather than moving the new half above unrelated clips.
- Plain-media projects automatically use native Media3 TextureViews and native image views. No video bitmaps cross the WebView bridge during this preview. The view rectangles use the same immutable `Scene65` graph, fit calculation, clip source times and opacity as native export.
- Native video surfaces let touches reach the editor canvas. Dragging a selected clip updates its native position while the finger moves; committing the gesture updates the project/Undo history.
- Native MP4 export uses external video textures, GLES 3, encoder input Surface, H.264 and AAC. It evaluates a fixed project snapshot. Progress reports actual preparation/frames/audio samples, cancellation removes unfinished outputs, and final files are published only after successful muxing.
- Audio uses trimmed PCM caches on disk and block mixing at 48 kHz. The same mixer supplies AudioTrack preview and AAC export, including gain, mute, gaps and fades. It does not allocate an array for the whole project duration.
- AAC encoder priming is measured with a short calibration signal per codec/process; complete priming frames are removed without dropping actual source audio. The remaining sub-frame delay is bounded by one AAC frame. There is no hardcoded Honor/Google encoder delay.
- PNG capture remains available. It intentionally reads surfaces once for that explicit operation; that is separate from the continuous preview/export paths.
- Native and compatible renderer selection is available from the footer. Text, tables, graphics, keyed transforms, filters, animated/vector images and rotated video sources currently use the compatible renderer automatically. Those existing features are retained. Compatible exports now share the streaming audio/AAC path, and the legacy video deck preserves source aspect ratio.
- Offline spelling review keeps its independent switch and accepted-correction dictionary. The UI63 design, Persian/English layout, personal-server flow and optional native speech/model tools are retained.

## Current limits

- Up to 1080p, integer 12–30 fps, 3-minute Android export limit.
- Automatic native scene budget: two simultaneously visible video clips, four images and eight audible clips. Longer metadata timelines and more layers can use the existing compatible path within its own limits. The compatible offline audio exporter accepts up to 64 clips.
- SDR BT.601 output is intentional for this release. Production BT.709/HDR conversion and device-specific encoder/color validation are still open. Known HDR export is rejected rather than silently tagged as correct.
- Preview uses Android's native hardware compositor; export uses EGL/GLES. They share validated scene evaluation and geometry, not one identical shader implementation. Pixel and timing parity must be measured for every newly ported effect. Advanced effects have not been declared native by this change.
- PCM caches are disposable and can consume disk space. Old unreferenced caches are trimmed above 256 MiB; caches referenced by the current graph are preserved and preparation fails clearly if space is insufficient. Source files are never deleted by cache cleanup.
- Audio resampling is the current linear-time nearest-sample implementation; professional DSP, pitch preservation and noise reduction are not part of this MVP.
- Physical Honor 90 frame rate, thermal behavior, speaker/display latency, large projects and broad codec coverage are not validated by a software emulator.
- Whisper model inference/quality and model download are separate from these media acceptance tests. Model weights are optional and not padded into the APK.

## Source and reproduction

Native implementation: `Scene65.java`, `Preview65.java`, `Editor65.java`, `Export65.java`, `Audio65.java`, `Aac65.java` under `mobile56/android/src/com/varnalabs/mobile`.
UI adapter: `mobile56/web/native-editor65.js`. The native scene is a validated versioned microsecond graph; saved `.varna` files retain the existing v1/720000-tick contract. Schema-v2 storage and full catalog/history migration remain phase-4 work.

Build with the existing reproducible SDK/signing environment:

    python mobile56/tools/bundle.py
    python mobile56/tools/build-apk.py

`ANDROID56_SDK`, `MOBILE56_KEYSTORE` and `MOBILE56_STORE_PASS` are supplied externally. An internal native test build uses `VARNA_DEBUG59=1`; public release builds must omit that variable. The app ID and signing identity remain compatible with earlier mobile releases.

Tests:

    node mobile56/tests/engines57.cjs
    node mobile56/tests/native-scene65.cjs
    NODE_PATH=tooling53/node_modules node mobile56/tests/browser.cjs
    NODE_PATH=tooling53/node_modules node mobile56/tests/studio57-browser.cjs
    NODE_PATH=tooling53/node_modules node mobile56/tests/shell63-browser.cjs
    NODE_PATH=tooling53/node_modules node mobile56/tests/parity57.cjs
    NODE_PATH=tooling53/node_modules node mobile56/tests/android-editor65.cjs

The Android test requires a booted device/emulator, a debug APK, adb and host FFmpeg. It generates its own media, drives the real app, uses an actual Android screenshot for preview pixels, inspects MP4 pixels/codecs/timestamps, and compares an encoded flash with an audio beep. Host FFmpeg is a test tool; it is not bundled into the app.

The final report and captured media are stored under `mobile56/tests/results/native65/` after acceptance. Software-emulator timing is not a phone benchmark. An unrelated System UI ANR on the software emulator must be identified as an environment warning rather than silently counted as a successful phone run.

## Engineering choices for this checkpoint

The existing Java/JavaScript toolchain and pinned Android libraries were preserved. No React, Flutter, Rust, GPL media engine or unreviewed model dependency was added. TypeScript migration, Gradle/AAB packaging, full schema-v2 storage, one unified effect rasterizer, proxy generation and broad physical-device acceptance remain explicitly tracked in root TODO.md. A working signed APK does not imply those follow-up gates passed.

## Recorded acceptance result

The installed Android 10 x86_64 build passed `android-editor65.cjs`: video/image/audio import, two video layers plus image, zero continuous video-frame bridge calls, burst seek, AudioTrack clock, screenshot pixels, real Android touch movement and Undo, split/Undo, native PNG, actual native H.264/AAC export, caption-compatible MP4 and repeated home/editor navigation. The encoded flash starts at 0.25s; audio onset was 0.250104s and offset 0.499896s. This measures this short exported fixture, not arbitrary clips or physical speaker/display latency.

Final report: `mobile56/tests/results/native65/report.json`. Existing engine, browser import/edit/spelling/project/export, Studio57 and UI63 navigation tests and caption preview/WebM parity checks passed. Release signature and non-debug manifest were verified; the non-debug APK installed as an update and launched in Android. Physical Honor 90 qualification remains open.

Startup navigation now queues an early Edit tap until storage initialization completes instead of silently discarding it. A browser regression delays IndexedDB readiness and verifies the queued action.
