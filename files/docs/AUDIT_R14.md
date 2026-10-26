# R14 — initial audit (historical)

For the delivered state and remaining gates, see RELEASE_REPORT_R14_FA.md.

Environment: Linux, no Adobe After Effects / Windows CEP / local user models.
Baseline: 10 legacy test files pass; 6 fail (old marker/version/alias assumptions). These are not AE runtime tests.

| Priority | Defect and cause | User effect | Planned safe fix |
|---|---|---|---|
| Critical | Host assumes JSON exists in ExtendScript; bridge has no capability inventory or timeout | Generic Host error / indefinite pending | ES3 JSON fallback, startup capability report, guarded serialized bridge |
| Critical | Typing click variables occur inside an unreachable return expression | No typing sound, error swallowed | Explicit declarations and error reporting |
| Critical | Preview and final captions use different construction paths | Different glass and animation output | One caption builder, managed guide layers, atomic preview replacement |
| Critical | Undo snapshots omit words | Corrected text/timing survives Undo | Snapshot word state and selection |
| Critical | Replacement memory overlaps all inserted tokens and sorts them by time | Wrong word sequence / unreliable timing | Shared local interval alignment, preserve later anchors |
| Critical | Caption/preview markers, disabled layers, zero-delta keys reach SFX engine | False events, repeated sound decisions | Tag roles and reject helper/caption events by default |
| Critical | SFX candidate fallback includes unrelated categories | Heavy sound for small movement | Compatible category allowlist, duration/strength bounds, no candidate means silence |
| Critical | Audio balance trusts its old comment and deletes any subsequent keys | User edits can be lost | Automation fingerprint; preserve changed keys and expressions |
| Major | Audio analysis measures entire source ignoring trims/gains; duck windows overlap | Incorrect gain, breathing artifacts | Visible-source interval and existing levels; merged speech windows |
| Major | Table playhead buttons use stale slider, zero replaced by old time | Wrong start/end | Query Host on explicit playhead actions |
| Major | Table grid uses minimum CSS tracks but proportional resize handles | Cursor/boundary mismatch | Physical pixel tracks and adjacent-track resize |
| Major | Mini preview applies opacity to text and stretches aspect ratio | Unreadable glass table | Separate fill alpha, fit one scale, independent text visibility |
| Major | Table preview layers are renderable; previous preview removed before validation | Preview leaks into export / lost review state | Guide layers and transactional replacement |
| Major | Model path changes retain earlier existing model/runtime | Wrong model is launched | Scope discovered files to chosen directory, projector ambiguity reporting |
| Major | Concurrent AI roles can kill one another; health endpoint not authenticated | Aborted or wrong request | Serialized role requests, per-process API key, model check |
| Major | Cancellation may start a fallback Whisper attempt | Cancel ignored | Cancellation state checked at every stage |
| Major | Background parent transform plus its own synced transform | Double movement / wrong reveal center | Single inherited transform; local envelope for per-word motion |
| Visual | Layered historical CSS rules and small-panel overflow | Inconsistent narrow layout | Targeted responsive rules; browser visual review remains pending |

All 818 proprietary item files and matching previews are inventoried by hash. Their binary metadata is not guessed. 43 native text motions are an independently implemented library, not an execution claim for those files. Audio files and original reference assets are retained unchanged.

Release gate: Requires real After Effects runtime verification.
