# Follow-up from the 2026-11-08 desktop request

This file records incomplete requirements explicitly. Workbench66 is one implementation batch; see WORKBENCH66.md for working behavior and verification scope.

- [x] Global/per-cell table font inheritance in real host payloads.
- [x] Read composition dimensions without first building a preview; refresh on composition changes.
- [x] Center/edge magnets with Alt bypass; retain precise native alignment.
- [x] Four keyed table entrance bundles, four curve choices and optional keyed exits.
- [x] Independent commit/idle text-preview preferences and serialized table updates.
- [x] Persistent table preview and paginated table settings; deep-link access and compact-panel checks.
- [x] Compact header, search icon, filled favorites, separate appearance stage, unified stock/custom motion category, descriptive labels/icons.
- [x] 102 original/existing native style combinations, four-card paging, language filters and per-word category selection.
- [x] Fix typing engine precedence and await apply before AE preview.
- [x] Original entry cues, independent toggles/levels and real owned audio layers in final output; include cues in Core installation.
- [x] Clear native/combined material actions with schema preflight and failure preservation.
- [x] Independent, reversible offline sentence grouping, preserved edited branch and Undo/Redo.

## Unfinished requirements

Progress continues in [TODO_WORKBENCH67.md](TODO_WORKBENCH67.md). This list records the Workbench66 baseline; shared backgrounds, cross-caption boundaries and history sharing have since been implemented with the limits described there.

- [ ] Native AE QA: inspect every font/preset, shared glass optics, continuous dividers, comp switching, deleted-preview recreation and audio mix. Reason: After Effects/Windows is unavailable in this environment; modeled API tests cannot establish these results.
- [ ] General table keyframe/property editor with handles, repeated/bidirectional cycles, sectional entry/exit and editable curves. Reason: this batch exposes authored native animation combinations and fixed curve families, not a general keyframe engine.
- [ ] Paginate every remaining panel at short/narrow CEP sizes and keep their contextual previews accessible. Reason: this batch fully pages table settings and the native style library, and categorizes word controls; other large panels still scroll. Do not hide inaccessible controls with overflow:hidden. Extreme small sizes/expanded advanced table disclosures also need further layout QA.
- [ ] Full typing-tool/native per-word workflow audit, including Arabic/Persian shaping, imported text layers, Undo, renderer switching and custom fonts. Reason: known precedence/race defects are fixed and focused tests pass, but native execution is not available.
- [ ] Audit all 102 looks for distinct editorial usefulness, font availability and native preview/export appearance. Reason: catalog uniqueness and payload tests are not 102 native renders.
- [ ] Continuous horizontal background reflow between captions of different word counts, with elastic size changes that preserve corner radius and text alignment. Reason: existing per-caption/typing bounds are not a shared cross-caption surface. A continuous owner/timing model and preview/output comparison are required.
- [ ] Full material browser redesign, consistent icon set for every subpanel, continuous motion thumbnails, and direct AE frame reference for each material. Reason: categorical shortcuts and composition modes are implemented; CSS swatches still approximate native glass.
- [ ] Contextual Persian sentence/grammar correction and cross-caption semantic grouping. Reason: current grouping uses existing timed words and punctuation/pauses; it does not infer grammar or reconstruct entire sentences across existing caption boundaries. Evaluate real Persian/informal/mixed corpora and model/checkpoint licenses before bundling any heavier NLP engine.
- [ ] Large-project memory/history and sentence-branch persistence/recovery across real AE project reloads. Reason: branch snapshots include transcript copies; project save uses the existing project-brain path, which still needs native reload/stress testing.
- [ ] Kinetic phrase/word-specific sound entry timing, level normalization and auditory QA on long projects. Reason: word-motion/speech timing and uniform fallback are supported; complex scene phrase-delay timing and perceived mix quality still need a dedicated pass.
- [ ] Build and verify a complete Windows installer from the finalized package. Reason: Core file-selection and package hashes are updated, but no clean Windows installation has been performed. Do not distribute a partial patch ZIP as a verified full installer or ask users to overwrite arbitrary older versions.
