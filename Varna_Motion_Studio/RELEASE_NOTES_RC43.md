# 4.5.0-rc.43

Reported RC42 failure: preview and output stop with `ReferenceError: Function GHAFHost._err is undefined`. The delivered RC36 archive was retrieved and compared against RC42, including host initialization, CEP loading, output orchestration and destination resolution.

Restored the RC36 direct ScriptPath and direct CEP evalFile path. Removed the active dependency on boot42.jsx. The old file remains an unreferenced historical resource. Host initialization now occurs in a private ES3 closure; methods capture their adapter and serializer rather than resolving a replaceable global GHAFHost. Explicit publication through $.global happens only after all required methods, including error/dispatch helpers, validate. Failed initialization cannot expose an incomplete new adapter or modify the previous adapter. CEP validates the published version/readiness/helpers before dispatching. A changed legacy alias does not invalidate the private implementation. Same-revision live-preview records are retained; upgraded renderer records are invalidated.

Retained RC36 destination resolution and one-caption sequential output, plus later paced yields, physical-call serialization across late callbacks, exclusive output gates, read-only preflight, receipts/rollback, optional AI analysis and the explicit light output profile. No unrelated feature or asset removal.

Added full generated-bridge-to-host integration coverage including global and function-scoped evalFile models, manifest preload, cold start, incomplete/error-helper failures, empty project, alias replacement, native text preview before/after 64-cue outputs in both directions, exact one-cue payloads and no overlapping calls. Adapted cache-upgrade tests to atomic publication. Existing syntax/delimiter and feature checks remain.

No Adobe ExtendScript execution, actual font rendering or hardware performance claim is made. Node API models and Chromium UI tests do not reproduce all native Adobe behavior.
