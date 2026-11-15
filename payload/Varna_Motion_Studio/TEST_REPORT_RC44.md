# RC44 validation

Environment: Linux, Node.js 24. After Effects and Windows are unavailable.

- Release gate: **66/66 suites passed**. The original 65 suites remain, plus RC44 feature-control coverage. Historical RC43 reports are retained as historical evidence, not represented as new browser executions.
- RC44 state tests exercise actual state/export code: emphasis-only payload changes, unchanged source selections/text/timing, exact restoration on reenable, persistent off state, reset defaults, undo and redo.
- RC44 coordinator test executes the production keyword coordinator with DOM/model fixtures: disabled features schedule no analysis, start no model, reject an in-flight response after off, and accept explicit suggestions again after reenable.
- Existing host regression tests continue to cover RC43 cold/manifest startup, missing _err repair, original adapters, 64 captions, individual caption creation, serialized requests, rollback and user-layer preservation. These use an AE API model.
- Syntax validation passed for changed JavaScript files and the new browser test source.
- Source comparison against the user-supplied RC43 archive: **2,850 asset files** and **19 host/CEP bridge files** are byte-identical. No original packaged file was removed.
- Installer manifest regenerated for 4.5.0-rc.44; per-file size and SHA-256 verification passed. The final archive is also checked for CRC/readability and manifest hashes during packaging.

## Unexecuted checks

The new `tests/rc44_browser.cjs` is included but **was not executed**. Chromium was not installed, and browser downloads did not yield usable archives in this environment. Therefore, visual layout, measured font-size progression, popover geometry, keyboard behavior and overflow across monitor sizes have not been verified in a real browser for RC44. The CSS/DOM behavior should be checked in the installed panel.

The browser test is intended to check 6 viewport widths × 5 size choices × 5 pages, popover bounds/Escape, size and switch persistence, conditional controls, SVG icons and page script errors. Its scenarios are not counted in the 66 passing suites.

Real Windows installation, Adobe startup, native previews/exports, GPU compatibility and performance remain unverified. No claim of visual or native runtime success is made.
