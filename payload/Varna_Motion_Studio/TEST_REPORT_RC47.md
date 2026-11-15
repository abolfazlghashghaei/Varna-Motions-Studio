# RC47 audit and verification

Environment: Linux / Node.js. Windows, native After Effects and an installed Chromium executable are unavailable. This report distinguishes code/model verification from native rendering.

## Release gate

80/80 code suites passed: all70 RC46 suites retained; eight new RC47 regressions; engine startup-error and companion/shot checks promoted into the gate. Final ZIP CRC, every package-manifest SHA-256, original paths and unchanged asset bytes are verified during packaging.

## Coordinated audit and corrections

| Area | Demonstrated failure and correction | Evidence |
|---|---|---|
| Template/MOGRT properties | Empty structural groups and compositing entries reached setValue; only writable leaf controls are exposed, routes/identities are validated, legacy structural snapshot extras are skipped and active-word automation targets primary numeric controls | Complete production host with strict groups lacking setValue; negative control reproduces the previous error; typed inputs, animation and rollback checks |
| Template isolation | Same-named external comps could resolve to another imported asset; lookup now requires the owning asset tag. Expression-only private dependencies are retained with any remaining output and removed after the last output is deleted | Foreign-first/correct-second fixture, preserved source expressions, retained duplicate output, last-output cleanup and missing-own-dependency rollback |
| Template interface | Readonly rows looked editable, failed imports retained stale data, deselected color roles could reappear after filtering, direct apply bypassed validation and empty projects reported success | Complete studio38/39/40 and vendor UI handlers, real state modules, event-driven DOM fixture; selected/all/reset, alpha/typed values, stale async imports and saved-role restoration |
| CEP and output receipts | Valid JSON null could throw after clearing the response timer and leave the queue unresolved. Malformed commit replies now inspect the existing session receipt | Asynchronous native callback model; invalid envelopes settle, subsequent commands run; real host commit with damaged reply recovers without retry/abort |
| Project persistence | Array.some is unavailable in the ES3 host and skips sparse holes; an explicit bounded indexed check now rejects missing/duplicate/out-of-range parts | Production getProjectState with Array.prototype.some removed, sparse parts0+2/count3, malformed metadata and legacy zero-count packet |
| Preview destination and lifecycle | Live/frame preview depended on current panel focus; explicit resolved destination is used. Frame preview now deletes its owned caption graph before removing the temporary comp | Production live preview after null/folder focus; real typography frame creation/end repeated without leaked private comps; stage-creation failure rollback |
| Caption state/history | Disabled typography still altered fitting/stacking; stale partitions broke preview after text edits; import undo left the wrong reset baseline | Real state/geometry modules, disabled-scene parity, nonmutating invalid-partition repair, exact phrase decoration mapping, protected phrases and import undo/redo/reset |
| Background and typing | Explicit background-off left previous owned surfaces; repeated finalization/typing could create hidden helpers; a refused background application could claim success | Actual production styling/background/typing with constrained AE primitives, repeated apply/off, idempotent anchors, owned cleanup, native refusal and preserved user shape |
| Motion controls and sizing | Disabled motion components left ignored numeric fields editable | Complete workspace handlers: dependent fields preserve values, keyword/preflight gates, five sizes/auto breakpoints/preferences, spacing reset, narrow popover calculations and Escape focus |
| Local music adapter | Unclassified startup stderr was hidden from the short error; final audio-file rename failure could throw asynchronously and never settle | Complete adapter with mock process primitives and real loopback HTTP/file streams: cause/banner filtering, failed rename rejection/partial cleanup and next job success |
| App integration | Frame preview now pins the shared resolved destination; partition-repair notes are visible; disabled typography no longer blocks ordinary marker output | Complete app closure with real state/geometry: payloads, statuses, no temp allocation for missing destination, marker output |

Existing regression coverage also includes RC43 atomic loading/_err recovery, 64 serialized individual-caption requests, cancellation/rollback, text/timing/correction memory, safe zones, brand asset ownership, tables, B-roll/shot support, music planning, audio and installer boundaries.

## Static and package checks

- All48 production JavaScript files pass Node syntax checks.
- All17 host JSX files pass ES3 parsing; modified standalone modules are embedded consistently in the production host.
- All66 statically named host calls resolve to defined host methods.
- All78 local resources linked from index.html exist.
- All120 template catalog entries have their bundled referenced assets verified. This is file/metadata verification, not120 native imports or rendered previews.
- No RC46 original path is removed. All2851 baseline asset files remain byte-identical. RC46 itself retained the2850 original RC43 assets unchanged; the RC43-derived asset set is preserved.

## Archived checks

Older excluded suites retain obsolete version/UI/marker expectations, superseded unsafe fuzzy correction defaults or old model/prompt schemas. They are preserved as history and are not counted as passing. The current gate covers the replacement contracts; see tests/README.md. The formerly failing engine-error check now passes and is included.

## Native verification boundary

No code/model suite establishes real Windows installation, AEP/MOGRT import/render, font shaping, expression evaluation, native third-party effect APIs, GPU performance or actual inference quality. Browser pixels, viewport overflow and all120 templates have not been rendered in this environment. Supplied browser checks remain unexecuted. The release addresses demonstrated code defects and retains original assets; it is not proof that every possible native failure is eliminated.
