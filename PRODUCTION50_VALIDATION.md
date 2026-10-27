# Production50

Base: Finalize49 (`cfe3e65`), whose appearance and logo the user approved. Internal package version remains RC47; the primary native adapter revision advances to `rc47.3` so an old host cannot silently serve the new panel. The accepted original appearance remains the default.

## Implementation and boundaries

- Twelve curve presets and an actual rectangle/ellipse Size animator. Width/height animate separately from layer Scale and corner roundness. Keyframes outside the requested interval remain; expression-driven and locked targets are rejected before mutation. Snapshots provide rollback on failure.
- Twelve original Persian/English word looks with installed-font selection and existing independent word renderer fields. Native template UI uses real text animators and backgrounds. Legacy template state is translated before the original composition-import renderer; user text/font/size are retained. This transfers supported color/motion roles and does not promise pixel parity with arbitrary imported compositions.
- Invalid native-layer references are purged before incremental preview reuse. Off/on clears signatures, removes stale records and reconnects a blocked bridge. The startup's DOMContentLoaded handler no longer makes a panel inert after an earlier successful boot; asynchronous brand selection also guards concurrent choices.
- Starting-brand footage import targets the AE Project panel, works without an active composition, reuses existing footage and rolls back new imports on failure. Existing private durable asset caching is retained; no claim is made that large footage becomes embedded in portable `.brand` exports.
- Table frame capture builds the preview and renders PNG pixels at the chosen composition time. A background mode temporarily hides preview-table layers; a full mode temporarily renders their guide layers. Native flags are restored even if rendering fails. This is a manually refreshed native frame, not continuous video streaming. Local design remains interactive. Existing cell alignment plus per-cell padding/tracking travel to native text placement.
- Five additional palettes and persisted custom base/end/accent/material opacity. Original themes can be restored; text/control colors adapt to the selected base.
- A separate local AI audio cue board creates duration markers, stores per-range directions, builds real model requests, stages audible files and inserts them at the specified time. Existing and cue-based generation reject measurable silence, insufficient duration and detected vocal evidence; cue output is not auto-inserted. Repeated insertion replaces only the layer owned by that cue.
- Music settings are shared, with explicit model-specific guidance mapping and native lyric conventions (YuE instrumental tag, MiniMax empty lyric text). Required semantic inputs cannot be silently stripped by schema adaptation. Genre selection no longer inherits an inactive stale instrument field; the instrument override checkbox now restores with the project.
- Music-only YuE/MiniMax/ACE routes refuse SFX/ambience. Stable Audio Open is the actual new local effects/ambience graph. Its model/T5 weights are detected and registered but are **not bundled or downloaded automatically**. Missing capabilities cause an explicit failure rather than music fallback. Automatic voice evidence cannot establish a strict no-human-voice guarantee or semantic/audio quality; audition remains necessary.

## Checks

- `production50_core.cjs`: real native adapter code for shape Size, guardrails, unchanged Scale/roundness, invalid-record purging, brand import preflight, frame failure restoration and native legacy-template conversion. Actual shared audio policy covers both music models, deterministic seeds, role routing and semantic schema validation.
- `production50_preview.cjs`: actual complete primary caption renderer after user deletion and AE-invalid object references; three delete/off/on cycles, recreation without toggling, reuse and unrelated-layer preservation.
- `production50_audio.cjs`: actual local HTTP, inventory, schema adaptation, prompt/history and atomic WAV download against a fixture server. It checks both installed music-model payloads, per-model guidance and refusal to submit ambience to a music model, then automatic Stable Audio routing. Fixture WAV bytes are explicitly not a model-quality result.
- `production50_browser.cjs`: real panel controllers for native styles on unchanged text, different word presets saved/read independently, 12 curves, shape payload, full/background/design frame modes, cell spacing payloads, custom palettes, playhead cue markers, rejected-vocal retry, explicit insertion, brand import at startup and four panel widths. Host/media-generation boundaries are intercepted.
- Existing release, startup/glass, table/per-word typography and production regressions remain separate checks. Native adapter files are parsed as ES3 and package checksums regenerated after source changes.

Native Windows activation, actual Adobe pixels/expressions, GPU generation and subjective audio quality are not executed in this Linux environment.

Recorded results on 2026-10-27: **88/88 release suites passed**, including the real primary-renderer deletion/recreation regression and local HTTP audio-adapter checks. Production50 Chromium passed the new workflows, startup brand-file import and four responsive widths. The previous Finalize49 and Liquid48 browser suites also passed. The package manifest verifies **3189 files**. Retained imported-template asset tests explicitly opt into the retained legacy renderer; the new default native path is separately exercised through the complete primary caption renderer and must not import a project. No existing asset-integrity assertions were removed.

## Official implementation references inspected on 2026-10-27

- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_yue2.py (guidance 1 disables CFG; style, lyrics and duration inputs)
- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_minimax_music.py
- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy/ldm/minimax_music/prompt.py (native lyric normalization)
- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_audio.py
- https://github.com/Comfy-Org/workflow_templates/blob/main/templates/audio_stable_audio_example.json
- https://github.com/Stability-AI/stable-audio-tools
