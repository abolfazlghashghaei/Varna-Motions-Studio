# RC46 verification

Environment: Linux, Node.js; no Windows / Adobe After Effects runtime or Chromium executable.

## Executed

- Release gate: 70/70 code suites, including all 68 RC45 suites and two new focused RC46 regressions.
- `tests/rc46_host.cjs`: a constrained AE model rejects the legacy sequence that enables Time Remap, deletes every key, then assigns an expression. It also rejects blank-expression writes to hidden 3D-only channels on a 2D layer even when canSetExpression is true.
- The same test executes the complete production host and real typography construction, text styling, motion reset, per-phrase layout, independent background construction and live-preview coordinator. Rendering functions are not stubbed out. The fixture models property/layer operations; it does not render fonts or pixels.
- Checks cover null and unsupported transform properties, separated Position followers, native cue start/duration, preservation of caller input, previous-preview retention after a failed replacement, successful subsequent replacement, owned-comp cleanup, and method/line diagnostics for uncaught dispatch errors.
- `tests/rc46_scene.cjs`: executes the complete production scene editor with real state/geometry modules and an event-driven DOM fixture. Free mode retains manual coordinates; automatic patterns clear only coordinates; actual right/left positions change. Font, color, scale, rotation, background and motion survive save/export. The local readiness message identifies panel layout.
- Existing ES3 host parsing, embedded-source consistency, atomic CEP loading, 64 individually serialized captions, rollback, templates and installer checks remain in the release gate. The older RC40 remap-specific assertion now verifies the actual cue duration/start/stretch without remapping.
- Packaging compares original file paths and asset bytes against RC43 and the previous delivered RC45. No original file is removed; all 2850 RC43 assets are byte-identical. Final ZIP CRC and each installer-manifest hash are verified.

## Limits

These are code/model tests. Native After Effects expressions, font shaping, final rendered geometry, Windows installation, GPU/effect compatibility, performance and browser visual layout have not been verified in this environment. `tests/rc45_browser.cjs` remains available but unexecuted.

The two new screenshots identify the hidden-property preview failure and retained old composition state. The separate partially visible null-object dispatch message cannot be traced conclusively from the screenshot alone; RC46 adds method and native line context for future reproduction. Do not interpret this release as proof that every possible native error is resolved.
