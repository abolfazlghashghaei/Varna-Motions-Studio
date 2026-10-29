# Varna Mobile — Android preview 0.1

An installable Android application with a dedicated touch editor. This is the first Android preview, not a port of every desktop feature. iOS is not built in this release.

## Install

Android 10 or later, with an up-to-date Android System WebView (Chromium 110+ recommended). Download `Varna-Mobile-0.1.0-preview.apk` from this release, open it on the phone and permit installation from the browser/file manager if Android asks. No After Effects, Windows installer, account or running server is required. The APK is signed with a dedicated preview certificate; no signing key is included in the source or APK.

## Included

- Persian/English touch layout in portrait and landscape.
- Local video, image and audio import through the system document picker. Imported files are copied to app-private storage.
- Multiple video/audio tracks, draggable playhead and clips, trim handles, split, duplicate, delete, mute, Undo/Redo, zoom, source trim, transform and basic color controls.
- Text and SRT import/export, built-in Persian font, per-word styles and animations, reusable typography presets.
- Animated shapes, titles, unified glass tables, continuous separators/alignment and size keyframes. Preview and exported pixels use the same shared Canvas compositor.
- Optional offline word review beside text: bundled Persian/English dictionaries, amber suggestions, explicit approval, personal words and locally learned accepted pairs. Turning it off terminates the worker. It does not silently replace spelling or Finglish.
- Autosaved project and portable project JSON; external media must be relinked when moving between devices.
- Native local H.264/AAC MP4 export, PNG frame and SRT. Preview export limits: up to 1080p, 30 fps and 180 seconds. Export cancellation removes incomplete output. Android share/save sheet receives the completed file.

## Scope and limits

Native MediaCodec export is implemented and compiled, but **this APK has not yet been executed on a physical Android device or Android emulator**. Device codec support, audio synchronization, performance and thermal behavior still need device validation. Browser tests verify the shared compositor and a real WebM export, not the Android MP4 codec.

There are no Whisper/LLM/music-generation model weights, native Adobe AEX/AE Glass binaries, desktop host controls, ComfyUI service, or full desktop template catalog in this preview. Canvas glass is its own renderer. Desktop project import is limited to supported shared features; it is not a guarantee of native AE effect equivalence. Export runs in the foreground and cancels if the app is backgrounded. Decoded audio is mixed in memory (up to 64 source clips); long/high-resolution projects can be slow on phones. Imported copies remain in app storage; uninstalling/clearing data removes them. Save exported files and project/media backups first. Custom fonts, proxy generation, project-media cleanup, background rendering and iOS are later work.

## Offline architecture

`android/` is a Java Android shell, local WebView asset/media service, document picker, H.264 frame encoder, PCM audio mixer/AAC encoder and read-only export content provider. `web/` is the phone UI and shared-document adapter. The app declares **no INTERNET, broad storage or microphone permission**. Assets and dictionary workers load from a private intercepted HTTPS origin. Only user-selected media is imported. No telemetry or runtime downloads are used.

Shared renderers and dictionary assets are copied by `tools/bundle.py` from `../Varna_Motion_Studio`; hashes are recorded in the generated `shared/shared-manifest.json`. All dictionary, nspell and font notices are included in Settings → Licenses. Original upstream dictionary/engine sources and reproducible bundle inputs are in `assets/text55/sources.json` and `tooling53/text55-build` in the repository. No native Hunspell, neural language model, GPL multimedia framework or external editor is added by this mobile shell.

## Reproducible offline build

Prepare Python 3, a JDK 17+ with `jdk.compiler`, and the official Linux Android SDK packages. This release was compiled with Java 21, Android platform 35 revision 2 and Build Tools 35.0.0:

- `https://dl.google.com/android/repository/platform-35_r02.zip` — 64,273,788 bytes, SDK-repository SHA1 `0bb560a90a7a2cbd0dd8348224d518b638fe7949`
- `https://dl.google.com/android/repository/build-tools_r35_linux.zip` — 61,958,799 bytes, SDK-repository SHA1 `2cfaa0bbb2336e9ec18ed3ecea84fa2e2af607bc`

Extract into an SDK directory containing `android-35/android.jar` and `android-15/aapt2` (the archive's actual directory name). Set `ANDROID56_SDK`, `MOBILE56_KEYSTORE`, `MOBILE56_STORE_PASS` and optionally `MOBILE56_KEY_ALIAS` (default `varna-mobile-preview`). Use your own keystore outside the repository. Then run:

```sh
python mobile56/tools/build-apk.py
```

The build makes no network requests and uses no Gradle dependency resolution. Output is `mobile56/build/Varna-Mobile-0.1.0-preview.apk`; build outputs and signing keys are ignored. Signing by a different key requires uninstalling the preview before installing your own build. Build ZIP timestamps and signatures are not claimed byte-reproducible; bundled source/asset hashes are independently checked.

## Validation

`tests/browser.cjs` uses Playwright and system Chromium from the existing development toolchain. Prepare a 2.4-second 320×240 H.264/AAC fixture at `/workspace/artifacts/mobile56-fixture.mp4` (see `tests/prepare-fixture.sh`), run `python mobile56/tools/bundle.py`, then:

```sh
NODE_PATH=tooling53/node_modules node mobile56/tests/browser.cjs
```

It runs a local-only test server, imports the real video, verifies split/Undo, approved/offline review, per-word style, table width keyframes, project/media reload, portrait/landscape layout and a measured non-silent WebM export. `tools/verify-apk.py` verifies every packaged web file against the build input, permission absence and native bytecode presence. Use `apksigner verify --verbose` for the signature. `VALIDATION.md` records tested and untested boundaries.
