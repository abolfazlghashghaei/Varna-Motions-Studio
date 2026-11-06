# Native GPU64 — first phase-1 rendering gate

Status: internal acceptance-gate implementation. Not the completed MVP and not a public app release.

## What is implemented

`NativeGpuGate64.java` decodes one or two real app-private video assets with Android MediaExtractor/MediaCodec into SurfaceTexture external textures. A dedicated thread owns the EGL context and renders one immutable scene to a native TextureView surface and a MediaCodec encoder input surface. The encoder produces an actual H.264 MP4. There is no Bitmap capture, JPEG/PNG frame encoding, Base64 frame transfer or glReadPixels in this path.

The gate requires a recordable EGL config and an OpenGL ES 3 context. It uses an external-OES shader compatible with the existing texture path. Unsupported configuration or shader compilation is an explicit failure; it does not silently switch to the old Canvas bridge.

The same drawing function renders preview and export. Sources have explicit normalized rectangles, validated bounds and deterministic target timestamps. This narrowly proves the surface/texture/encoder architecture. It does not implement the production composition graph, arbitrary clip timing, source rotation/pixel-aspect policy, audio clock, effects, text or timeline gestures.

The native preview overlays the current Activity only during the debug gate. It is removed during cleanup. It is not integrated into the editor's actual preview bounds, inspector overlays or pointer interaction yet.

## Gate bridge and safety

`MainActivity.Bridge.gpuGate64(requestId, sceneJson)` is guarded by FLAG_DEBUGGABLE. Production builds reject it. The gate is not exposed as a user feature. One gate may run at a time. Activity pause/destroy cancels it. Cancellation is checked in decode, frame waiting and encoder draining. Failed/cancelled outputs are deleted. Codec, extractor, surface, texture, EGL and view ownership is released before reporting the result.

Related debug methods: `gpuGateState64()` and `cancelGpuGate64()`. Existing project playback, exports and UI controls keep their current path; this change does not claim to replace those production paths yet.

Scene input example:

```json
{
  "width": 320,
  "height": 240,
  "fps": 24,
  "frames": 6,
  "clips": [
    { "mediaId": "00000000-0000-0000-0000-000000000064", "rect": [0, 0, 0.5, 1] },
    { "mediaId": "00000000-0000-0000-0000-000000000065", "rect": [0.5, 0, 0.5, 1] }
  ]
}
```

Inputs are limited to two video sources, 720p, 30fps, 10 seconds and a 64KiB scene. These are acceptance-gate limits, not the final product limits. There is no audio in this gate.

## Color finding

The first encoder test requested BT.709. The Android 10 software encoder tagged the file BT.709, but decoded primary colors had approximately 15–26 RGB levels of cross-channel error. A successful encoder configuration call alone did not prove correct color conversion.

This gate uses SDR BT.601 test fixtures/output and checks primary-color pixels tightly after decoding the actual MP4. Production SDR BT.709 color conversion remains a separate phase-1 export gate. HDR sources with PQ/HLG metadata are rejected. Untagged/HDR detection, full color management and other codec implementations are not validated here.

## Reproduction

1. Prepare the existing Android SDK/Java dependencies and signing environment described in `mobile56/README.md`. Keep credentials outside the repository.
2. Build an internal APK with `VARNA_DEBUG59=1 python mobile56/tools/build-apk.py`, with the documented ANDROID56_SDK and MOBILE56 signing variables supplied.
3. Install that test APK in a booted Android emulator/device. Do not distribute a debuggable APK as a release.
4. Run `NODE_PATH=tooling53/node_modules node mobile56/tests/android-gpu64.cjs`. `ADB` and `GPU64_ARTIFACTS` can override the tool/artifact locations.

The test generates its fixtures with host FFmpeg. FFmpeg is a test tool, not a newly bundled Android dependency. It imports the fixtures into the test app's private storage, drives its real native bridge over WebView CDP, pulls the MP4 and inspects it with ffprobe/FFmpeg outside the app. The test also checks invalid bounds, missing media, cancellation and a successful job after failures.

## Open acceptance work

- Integrate the renderer with the revisioned production composition graph and actual preview layout.
- Verify visible preview pixels independently, including overlays, touch and Activity rotation; encoder pixel checks alone do not certify the screen output.
- Add changing-frame fixtures and compare frame timing, rather than only solid-color layers.
- Add image/text layers, aspect ratio/rotation, alpha blending and seek scheduling.
- Add the streaming audio graph/master clock and AAC muxing.
- Validate production BT.709 color conversion and codecs on physical hardware.
- Benchmark Honor 90; the CPU-emulated Android test is not a realtime performance measurement.
- Keep the old renderer until the new graph passes all parity and lifecycle gates. Do not advertise full phase-1 completion from this result.

## Recorded execution

Android API 29, x86_64 software emulator, OpenGL ES 3.0 SwiftShader. The final gate passed decoded two-layer color/orientation checks with a per-channel tolerance of 15, six frames at 320x240/24fps (0.25 seconds), invalid rectangle dimensions, missing media, cancellation during rendering with no leftover output, and a subsequent successful job. This is a tiny functional fixture, not a throughput or long-duration stability benchmark.

The actual probe, pixel samples and environment are recorded in `mobile56/tests/results/gpu64-android29.json`; its SHA-256 references the captured `gpu64-two-layer.mp4`. Existing engines57, shell63 browser UI and native59 Android player regressions also passed. No public APK release or CapCut-parity claim is made from this gate.
