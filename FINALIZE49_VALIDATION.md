# Finalize49 validation

Base: user-confirmed Windows installation of `v4.5.0-rc.47-liquid48-layout1`; internal plugin version remains `4.5.0-rc.47`, adapter `rc47.2`. The immutable baseline and its tag remain unchanged.

## Changes

- Initial HTML loader with progress animation, failure/retry handling and keyboard isolation, including CEP builds without `inert`. Brand choice opens only after UI initialization and the initial host/project restoration settle.
- Persistent brand library choice or unsaved New workflow. Selecting a starting brand changes defaults for new work without rewriting existing captions. The actual transcription reset preserves creative settings in that workflow.
- Original borderless metallic V logo; seven glyph columns per V arm instead of four; fresh random particle destinations, curl and rotation on every click; 800 ms scatter followed by a 5000 ms damped return. Canvas drawing stops at rest, pauses when hidden and respects reduced motion. Duplicate synthetic resize events do not cancel a burst.
- Translucent materials in five themes with a detailed background visible through cards. Backdrop effects use CSS with a solid fallback and reduced-transparency override. This is a web/CEP material, not the native Apple renderer.
- Fixed 210 × 34 background-model select (responsive at narrow widths); compact preset browser; common label/control spacing and vertically paired position controls. Existing nodes and handlers are retained.
- Varna curve editor over a pinned MIT Rebound subset: native ease read/apply on selected keyframes, input validation, Hold preservation and undo groups.
- Varna script assistant over a pinned MIT AE Conjure subset: three provider clients, editable model ID, optional composition context, generated-code draft, separate execution, native Undo and local script library. Keys remain in the session and are excluded from library, brands and project state. No automatic script execution or retry. Provider credentials and live external services are not exercised here.
- Attributed engines and licenses are included in Info. Source commits and changes are recorded beside each vendor subset. Shared UI dependencies are included at every installation level; optional vendor packs still require Max.

## Checks

`tests/finalize49_core.cjs` executes the real state, transcription-reset routine, additional host, borrowed engine dependencies and three AI provider clients. AE primitives and HTTP responses are constrained fixtures. It checks unchanged existing captions, persistence, ease/readback, Hold preservation, invalid inputs, private namespaces, composition context, script execution/error/undo and provider request/code parsing.

`tests/finalize49_browser.cjs` exercises real Chromium: loader to brand choice, New without saving, saved-brand reload, randomized trajectories, return duration and idle stop, five glass themes, reduced motion, curve controls and native payloads, assistant draft/execution/context/Undo/library and exclusion of API keys from storage. Layout checks cover 280/380/680/1100 px; select dimensions and vertical position grouping are measured. Tool host calls and external AI replies are intercepted at their boundaries.

The existing Liquid48 browser regression checks the table payload, live-preview interface, cell/composition alignment and independent per-word typography at six panel widths. Existing production and numeric-control browser regressions also remain relevant. The release runner includes the new core suite. PowerShell checks exercise dependency selection at Core/Studio/Max and parse installer scripts; existing restoration/layout tests guard the proven download and staging behavior.

Results on 2026-10-27: the complete release gate passed **84/84 suites**. Finalize49, Liquid48, Production47 and UI47 numeric-control Chromium suites passed. Portable PowerShell passed Core/Studio/Max dependency checks, installer parsing, all six component-restoration scenarios and all eight layout-recovery scenarios. All six added vendor host scripts also parse as ES3. The final package manifest verifies 3179 files. The legacy startup test was updated to accept the added boot-error variable while retaining its delayed lightweight-handshake assertion. Chromium fixtures enter through the real new startup choice before exercising the existing production controls; the coordinate-based scrub test first confirms its input can receive the pointer.

## Limits

Windows installation of this new release, CEP GPU performance, actual Adobe rendering, font availability and real provider credentials have not been checked here. The user's previous confirmation applies to the recorded Liquid48 installation baseline. Browser screenshots and modeled host results do not establish native Adobe rendering correctness.
