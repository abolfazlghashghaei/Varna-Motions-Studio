# Workbench67 — inspector design and shared caption surfaces

This batch continues Workbench66 on desktop RC47. It responds to the UI review by preserving the actual controls and their native handlers while changing their presentation. Android Native65 and the removed video editor are unchanged. This is reviewable source, not a Windows installer certified on a clean machine.

## Inspector design

- A common task-section controller replaces arbitrary numbered table pages and categorizes the other inspectors. Font, position, color, material, effects, content and timing have named destinations. Wide panels use icon tabs; narrow panels use a category selector. Previous/next pages are used only within a category when its controls exceed the panel height.
- Pagination measures each section after making its own controls visible. Navigation height is reserved before packing. Scroll anchoring is disabled so switching sections cannot corrupt measurements.
- The existing control IDs, values, event handlers, scope selectors and underlying project state remain. Deep links and search reveal their destination. Selected tabs support direction-aware arrow keys, Home and End.
- Font selection uses a compact trigger and a modal containing the existing font search, preview, favorites and selection implementation. Escape closes the picker without changing the production stage. User font names are excluded from localization.
- Working cards use more opaque palette-aware surfaces. Decorative glyphs are subdued. The header, stage controls, numeric controls and labels have tighter spacing. Orphan gradient and empty preview surfaces belong to their actual category rather than remaining visible everywhere.
- The table composition preview stays above the controls. Primary brand saving remains accessible across brand stages. Entering word editing reveals the word selector; scene Apply actions remain outside the paged settings. The main motion Apply action is beside its scope/mode controls.
- Oversized lists retain bounded internal scrolling. Large/expanded advanced cards can still need workspace scrolling, particularly at very short heights. Content is never clipped with `overflow:hidden` to claim a passing layout. Full removal of this fallback remains a documented follow-up.

## Continuous native caption background

`bg.reflow67` is an opt-in configuration for a shared surface across adjacent native-text captions. It has duration, maximum connecting gap and smooth, elastic or linear transitions.

- Native text bounds are measured with the actual text/font/layout pipeline. Compatible material runs share a background carrier. Shape geometry changes; the plane is not resized through Scale, preserving corner radii.
- ES3 geometry in `js/reflow67-core.js` is embedded in the AE host and in its expressions. Preview and final output use the same interpolation. `tools/sync_reflow67.py --check` verifies source synchronization.
- Material changes, overlaps or large gaps split runs. Unsupported scene/template renderers fail explicitly. A disabled configuration retains the previous per-caption path.
- Output sessions stage the complete shared graph before emitting captions. Failure/abort removes newly staged layers and retains prior output. Incremental preview reuses unchanged text roots, replaces its owned surface and cleans up on removal. Fast preview includes adjacent captions while seeking the selected caption.
- Selected style refreshes include the complete caption graph so resizing a selected caption can rebuild its shared run. Rapid UI edits coalesce behind the existing serialized CEP bridge.
- Material inspection has an explicit AE-frame capture. The animated panel canvas is a motion reference, not a promise of matching native optics.

## Reversible sentence grouping

An independent, optional cross-caption mode joins adjacent compatible automatic captions before applying punctuation, pause and word-count boundaries. It preserves timed words, selection and original/edited branches. Manual text, explicit timing anchors, editorial differences and incompatible timing prevent merging. Invalid word timing fails before mutation.

Sentence branches are immutable shared references in Undo snapshots until changed. This avoids copying both transcript branches into every ordinary history entry. The actual project save/reload path still needs native AE testing. This is boundary grouping, not a contextual Persian grammar model.

## Verification scope

New tests cover section/control reachability, keyboard navigation, the real font dialog, shared-background UI/CEP payloads, native staging in the AE model, cross-caption grouping and immutable history. Existing correction, typography, table, host and installer-package regressions are retained. Browser tests run real Chromium; native calls are intercepted or modeled.

The table layout test checks all five stages at 900×700, 700×620 and 760×520 with the preview visible. The broader workspace test checks every production route for control reachability and horizontal overflow at 1000×800 and 760×520, and writes vertical fallback measurements to `/tmp/workspace67-overflow.json`. It does not assert that every advanced screen fits without scrolling.

No After Effects process, Windows installation or native vendor optics/audio QA is available here. A passing host fixture does not certify native render quality. See TODO_WORKBENCH67.md before release.
