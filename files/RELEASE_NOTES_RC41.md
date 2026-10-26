# Varna Motion Studio 4.5.0-rc.41

Fixes output preflight instantiating a temporary text layer and TextBox effect. Preflight and effect availability checks are now read-only. Output suspends live preview, future rendered-preview frames, project-context polls and autosave traffic. The existing per-caption output transaction now yields between commands, exposes progress, pins preview cleanup to the output target, and offers an explicit lightweight native-text profile without changing editor settings. New AI analysis at output is opt-in.

The CEP bridge tracks physical native execution beyond soft timeouts. Late replies release the execution gate; no concurrent reconnect or repeated mutation is issued while the previous operation remains outstanding. Output sessions have client request IDs and completion receipts so late begin/build replies can be safely aborted while retaining previous output, and a late successful commit can be recognized. Unknown or incomplete cleanup remains reported as unconfirmed.

Layer difference detection uses layer IDs when available, with an object-reference fallback. Host revision rc41.1 invalidates renderer/output signatures for the changed execution path. Bundled assets and RC40 features are retained.

Validation uses Linux host-model, ES3 and Chromium fixtures; actual Windows Adobe runtime, native effect performance and renders remain untested here. See TEST_REPORT_RC41.md and RC41_README_FA.md.
