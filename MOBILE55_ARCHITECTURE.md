> Historical Studio55 research note. For the current Android release and migration specification, see [Mobile57](mobile56/docs/ARCHITECTURE57_FA.md) and [mobile README](mobile56/README.md).

# Mobile and shared effect architecture — research boundary

Studio55 adds desktop offline text and workspace docking. It does **not** contain a tested Android APK, iOS IPA, native mobile renderer, or a mobile AE Glass implementation. The mobile platform priority has not been confirmed. These are engineering decisions and acceptance gates for that separate build, not shipped features.

The existing CEP/ExtendScript code calls desktop host APIs. A mobile UI cannot run those APIs. Keep project/timeline data and effect specifications portable; write adapters for preview, media decoding, frame composition, and export. A glass widget that looks attractive in the interface does not imply that its effect is present in exported video.

* Android: evaluate Media3 Transformer/Composition for media decode, composition and export; Kotlin adapter. The androidx/media repository declares Apache-2.0.
* iOS: AVFoundation/VideoToolbox for media, Metal for effect passes. These are platform APIs, not a shipped cross-platform open-source editor.
* Flutter is an optional shared UI; it still needs native media bridges. Skia (BSD-3-Clause metadata) can handle graphics, but text shaping, bidi, glyph metrics and deterministic frame rendering need explicit tests.
* libpag can render exported PAG templates and substitute text/images; it cannot execute arbitrary AEP/MOGRT/AEX code. Its full license/dependency terms must be read before incorporating binaries; GitHub metadata is NOASSERTION.
* FFmpeg licensing depends on configuration and dependencies. Do not repeat the unverified claim that a project called “FFmpegKitNext” is the official continuation of FFmpegKit. Verify its exact repository, maintainer provenance, binary build flags, security updates and licenses first.
* UI liquid-glass packages and HTML/WebGPU demos are algorithm references until the same compositor is connected to decoded frames and encoded output. No exact repositories/versions for the pasted widget names have been pinned in this release.

## First visual parity fixture

Use a 10-second moving video with Persian and English text, a transparent logo and a merged-cell table, two overlapping glass surfaces and animated controls. Render 30 fps at 1080x1920 and 1920x1080. Compare preview and exported frames at exact timestamps; include a scaled project and text near frame edges.

The effect specification should include mask source, light angle/intensity, refraction/depth, dispersion, frost, distortion shape, magnification/falloff, effect/rim scale, tint and tint amount. Parameters require defined units, interpolation, bounds and version migration. Similar control names are not proof of visual equivalence to a proprietary AE effect.

Measure decode, render and encode frame times separately, GPU memory, thermal throttling, audio sync, crash recovery and export cancellation on physical Android and iOS devices. An iOS signing setup and Android target hardware are required before claiming packaging or playback support. No mobile/GPU performance numbers were measured here.
