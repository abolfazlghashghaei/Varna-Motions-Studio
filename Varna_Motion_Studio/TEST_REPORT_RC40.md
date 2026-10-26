# RC40 validation

Environment: Linux, Node 24, Chromium headless through Playwright. Adobe APIs are simulated by behavioral fixtures. This report distinguishes those checks from an actual Adobe runtime test.

## Release gate

Run `node tests/run-release.cjs`. The release gate contains 60 suites, including the retained regression tests, ES3 parsing of host scripts, package checksum/installer contracts, phrase-scene host model, and template palette/renderer conversion tests. The final bundle is generated only after this gate passes.

New host-model checks cover exact lossless phrase partition, protected multiword names, speech/cue/uniform timing, cumulative/single holds, six safe layouts, rotated bounds, editable full-source Text Layers, native type selectors, shared transform handle, trim retiming, filtering private compositions from automatic output selection, removal of unused owned compositions, and failed creation cleanup. Font sizing is shimmed in the host model; real font shaping and native raster output are not tested there.

Template checks preserve every source palette role by default, bind a selected role only, retain color alpha, leave source compositions untouched, convert native text to full template and back, and preserve existing output when replacement staging fails.

## Browser checks

Run the following with Playwright and `VARNA_CHROMIUM` pointing to Chromium:

- `tests/rc40_browser.cjs`: four-part sample, pointer/keyboard placement, saved/exported text and normalized timing, single Undo, rejection of incomplete manual partition, merging mixed manual/word-timed captions and Undo, retiming, per-caption automatic partition for all scope, real UI preview/output bridge payloads, full-template default, explicit color-role guard, independent page navigation, six widths (250–1480 px) including 450 px height, and no page script errors.
- `tests/rc39_browser.cjs`: model-free suggestions, manual preservation, model failure fallback, native word motion and emphasis, actual preview/refresh payloads, original/simple template modes and responsive text controls. Routes were updated for the independent pages.
- `tests/rc38_browser.cjs`: simulated semantic model calls, caching, invalid/stale response protection, reference thumbnails, template controls/alpha/scope, guide/command-search navigation and responsive layout. Routes were updated for the independent pages.
- `tests/rc37_browser.cjs`: numeric dragging/fine keyboard/cancel/manual input, complete looks, protected drafts, stack, composition-audio bridge, output update/cancel and responsive pages. Routes were updated for the independent pages.
- `tests/rc31_browser.cjs`: permanent font search, Persian name matching, actual style mutation, favorites, empty results, capsule controls, retained caption focus and immediate split shortcut.

## Not executed in this environment

After Effects on Windows, native preview frame export, opening/rendering the real AEP/MOGRT projects, installed third-party effect compatibility, actual font rendering, live GGUF engines, and live music services. Chromium preview uses approximate browser font measurement; AE scene layout measures the selected font in the host. The full original-template path can require the template's fonts/effects. Templates with unsupported dynamic composition dependencies report an error and preserve the existing output.

Installation package verification checks file integrity and installer contracts; it is not a claim that an interactive Windows installation was run here.
