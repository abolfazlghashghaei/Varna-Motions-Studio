# Mobile57 validation — 2026-10-30

Artifact: `releases/Varna-Mobile-0.2.0-preview.apk`.
SHA-256: `db3ca786accf4cb001f96dea01deebf3f80b91c29508704f85a689861ab0510f`.

Passed: Android Java/resource/D8 compilation, APK alignment/signature and exact packaged-asset verification. Application ID and signing certificate match Mobile56, with versionCode 5701. No INTERNET/storage/microphone permissions requested.

Passed: existing Playwright workflow with actual video/audio import, split/Undo, optional approved offline review, per-word style, table size keyframe, measured non-silent WebM, autosave/media reload and portrait/landscape.

Passed: new caption timing, karaoke pixels, saved caption style, timed-caption duplicate/Undo, real waveform, layer lock enforcement, .varna file download and light/dark responsive UI. Android begin/frame/finish request sequence was tested with a modeled bridge: one frame in flight and sequential acknowledgements. This does not execute Android MediaCodec.

Passed: caption retime/split, multilingual text, 1000 integer-clock project round trips, schema rejection, corrupted-current-save recovery, VTT/SRT and snap rules. An actual exported .varna document passed its formal JSON Schema.

Text-only browser export was fixed to omit an unused audio track; zero-byte encoder output is rejected. Preview/WebM Persian-English karaoke frames at 0.25/0.75 seconds had mean RGB absolute error 0.560/0.593 out of 255 after honoring the WebM container's full-range BT.709 metadata. FFmpeg's VP8 decoded-frame defaults disagree with those container tags; generic decoder color parity is not claimed. Native Android encoder now explicitly declares its limited-range BT.601 conversion.

Not run: installation/launch of Mobile57 or native MP4 export on an Android device/emulator. Honor 90 is the user's target, but its Android/MagicOS/RAM and measured frame rate, memory, thermal behavior and A/V synchronization remain unknown. No iOS build or Flutter/Rust/Media3/wgpu/ASR integration is claimed. These targets, upstream version/license evidence and next acceptance gates are documented in docs/ARCHITECTURE57_FA.md.
