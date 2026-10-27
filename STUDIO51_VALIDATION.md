# Studio51 implementation and validation

Base: Production50, commit `1b60f14`. Plugin version remains `4.5.0-rc.47`; primary AE adapter advances to `rc47.4` so an existing older host must reload. Prior accepted default appearance/logo is retained.

## Reported bugs

The Qwen3.5 text launch correctly cleared mmproj in `ensureLocalRole`, but the subsequent `startLocalAI -> resolveLocalPaths` discovered the Qwen2.5 Vision projector again. The final process boundary now attaches a projector only for explicit `role: vision`. A real loopback controlled-child test verifies the actual command arguments across text, classification, translation, Vision and manual launches, including Vision -> text switching. GPU recovery/resource policy is unchanged.

The two visible music cards are now one workspace. Existing engine handlers/settings keep their element identities; shared direction controls are moved into one disclosure and the canonical duplicate model/style/kind controls are hidden. The old automatic-video planner is a disclosure within that same workspace. Cue style and restored project style synchronize in both directions. Music model policy and no-vocal evidence checks from Production50 remain; this change does not claim YuE/MiniMax gained SFX capability or that GPU/audio quality was verified here.

## Editor architecture and supported behavior

- `editor51-core.js`: validated, serializable edit document, source in/out times, track references, bounded transactional history, split, trim, compatible cross-track moves, ripple-delete boundaries, SRT import/export, native caption transfer and seekable Chromium WebM duration metadata.
- `editor51.js` and `editor51.css`: shared panel/browser renderer and actual media timeline. Media library, monitor and timeline remain together. Inspector spaces change through bottom navigation with descriptions. Numeric controls have value scrubbing and adjacent sliders. The legacy numeric enhancer explicitly skips this workspace to avoid double-wrapping transport controls.
- Multiple image/video/audio tracks; same-track clip overlap has deterministic stacking but is not an automatic dissolve. Source clipping does not destructively alter media. Track locks, mute/hide, snapshots, transform, brightness/contrast/saturation/hue, gain and audio fades are functional.
- Browser subtitle text supports Persian/English, SRT, direct time/text editing, original twelve Varna defaults, per-word font/color/background/entry, outline and simple timing animations. Existing native kinetic data is resolved with the shared Kinetic40 geometry module. The browser renderer is not the native AE effects renderer. Native data is preserved on read/round-trip until text/style is edited into a supported standalone style.
- Media blobs persist in IndexedDB; metadata autosaves and flushes before closing/navigation or explicit save. JSON project files exclude source-media bytes and font binaries. Missing media relinks by name/size. Source files are never moved. Custom fonts need reinstall/reimport in a new session; no font bundling claim.
- Canvas + Web Audio + MediaRecorder exports real-time WebM with mixed audio; duration is inserted into the Chromium Info profile for seekability. All timeline edits are blocked while recording; cancellation or a hidden window rejects partial output. FFmpeg converts to H.264/AAC MP4 with even-dimension padding. This is not a frame-accurate offline GPU renderer or a mastering/long-project performance guarantee.
- `editor.html` opens without AE. `OPEN_VARNA_EDITOR_WINDOWS.bat` / payload launcher starts an optional Node 18+ local service for FFmpeg/Whisper and opens the browser. Editing/WebM do not require this service. Media codecs depend on the running Chromium version. Native codec availability is not inferred from ffmpeg support.
- The local service binds only loopback, verifies Host/Origin and a random session header token on binary processing requests, executes argument arrays without a shell, rejects concurrent jobs, removes owned temporary jobs and stops its own jobs on disconnect. Runtime binaries/model weights are external, user-configured; no automatic download.
- Inside CEP, configured GHAFNode FFmpeg/Whisper can be used directly. `buildEditTimeline51` preflights files then creates a new owned folder/composition with source trims, transforms, native color controls, gain/fades and caption layers. It reuses existing footage without moving it, and removes only newly created project items on failure. It does not rewrite the current composition. Color math/text metrics can differ between browser and AE.
- All current plugin tools remain accessible through regular mode and the professional workspace tool menu. This is a working independent edit core, not a claim to match all Premiere/Resolve features. Native AE plugins, original composition templates, native optical glass and every native animation/effect cannot be faithfully previewed/exported by the browser renderer.

## Checks

- `studio51_core.cjs`: source alignment, split/trim, overlapping vs subsequent ripple behavior, locked/incompatible edits, rollback, undo/redo, still-image start, Persian SRT, independent word conversion, retained native settings, invalid document rejection, exact embedded adapter synchronization.
- `studio51_engine.cjs`: actual process arguments and authenticated loopback readiness with a controlled llama child; isolates discovered Vision projector from every text route.
- `studio51_host.cjs`: complete primary adapter executed against the existing AE model. Checks new composition, source timing, contain transform/position, native user text, missing-file preflight, reused footage and failure rollback. Explicitly not Adobe runtime.
- `studio51_server.cjs`: real local HTTP and actual FFmpeg WebM -> H.264/AAC MP4, dimensions/duration; token/Origin/static boundaries and tool failure. Real audio extraction and a controlled Whisper fixture verify protocol/timing; no speech-recognition model-quality claim.
- `studio51_browser.cjs`: real Chromium decoding/rendering, split/undo/redo, sampled grayscale pixels, different per-word defaults, persisted gain, project download/reopen, IndexedDB media recovery; actual downloaded seekable WebM with non-silent Opus and actual MP4 conversion; responsive widths 280/380/680/1150/1600. Panel checks cover one audio card, canonical style sync, retained instrument controls, pro/regular switching, native caption data and legacy-wrapper isolation. AE calls/model generation are not represented as native/GPU passes.

The browser persistence test found and fixed an immediate-reload race: pending debounced metadata now flushes before closing/saving. Screenshot inspection found and fixed inherited CEP header layout and legacy numeric control wrapping. Existing regression gates and final manifest run after payload changes.

Actual Windows activation, the native Adobe runtime, local Qwen/Whisper inference and music-model outputs remain unexecuted here. Those limitations are separate from the real browser/media/FFmpeg checks above.

Final recorded results: **92/92 release suites passed**. Studio51 Chromium passed both standalone real-media/export checks and panel integration. The previous Finalize49 and Production50 Chromium suites also passed. The final source manifest verifies **3204 files**; all **20 native host files** pass the ES3 syntax gate. Evidence logs and screenshots are in `/workspace/artifacts/Studio51_*` in the execution workspace.

## Official repositories inspected

On 2026-10-27, the supplied official GitHub metadata/READMEs were read for OpenCut, OpenReelio, OpenScene and MLT. OpenCut's README describes its Rust rewrite and directs users to classic for today's app. OpenReelio describes React/TypeScript/Tauri/Rust and an early-stage prompt-driven editor; OpenScene metadata describes a local Electron-style editor. The three application repositories declare MIT; MLT declares LGPL-2.1. They were architectural references only: no application source or engine was copied/bundled, and no claims from the user's research were accepted as proof of runtime parity. Existing vendor notices/licenses stay in Info.

- https://github.com/OpenCut-app/OpenCut
- https://github.com/openreelio/openreelio
- https://github.com/Theorvane/openscene
- https://github.com/mltframework/mlt
