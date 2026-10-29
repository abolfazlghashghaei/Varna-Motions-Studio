# Mobile56 validation — 2026-10-29

## Passed

- Java compilation, Android resource linking, D8 dexing, alignment and APK v3 signature verification (Android minimum API 29).
- Every packaged HTML/JS/CSS/dictionary/font/notice checked byte-for-byte against the final bundle. No signing keys or network/storage/microphone permissions in the APK.
- Chromium/Playwright, 393×852 touch portrait and 852×393 landscape: no horizontal document overflow, Persian/English switching, real 320×240 H.264/AAC video import, source timing, split and Undo.
- Optional offline review remains off initially, identifies `helo`, waits for approval, accepts `hello`, preserves text with review off; per-word color remains in the project.
- Table size and a width keyframe saved in the shared document, avoiding layer-scale changes for this control.
- Real 2.4-second browser WebM with VP8/Opus; ffprobe verified duration, dimensions and audio stream; decoded PCM has a non-silent RMS level. Exported graphics and text use the same compositor as preview.
- Autosaved project and browser-local media recovered after reload. No external network requests during the browser workflow.

## Not run

- APK installation, launch or MediaCodec MP4 export on Android hardware/emulator. Native encoding, codec quirks, long audio mixes, device memory/performance, thermal behavior and platform share sheet need phone validation.
- iOS build; full desktop feature parity; AI model inference; native AE/Premiere/Resolve integration from the phone.

Artifact: `releases/Varna-Mobile-0.1.0-preview.apk`.
SHA-256: `d75c5686a78656a2592716f4c3e63b4a51e140c8358575d056a31d01687e9dc3`.
This is an explicitly labeled early preview, not a production-readiness claim.
