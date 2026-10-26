# RC42 validation

Environment: Linux, Node 24, Chromium/Playwright and modelled Adobe APIs. No actual After Effects executable is available in this environment. The release gate includes the retained 63 suites plus rc42_boot.cjs (64 total). Packaging proceeds after the gate passes.

New checks in tests/rc42_boot.cjs:

- Parse all host files as ES3 and reject raw forward-slash delimiters inside regexp literal patterns. The exact old RC41 source fragment is detected by this guard while remaining acceptable to Acorn; this demonstrates the gap in the former static check, not a full Adobe parser emulation.
- The rewritten scanner preserves intended RTL isolation behavior for representative mixed Persian/Latin text and 1,200 deterministic generated inputs, including Persian/Arabic-Indic digits, punctuation, decimal separators, URLs and slash-delimited numbers.
- The manifest preloader performs no main-host evaluation, project mutation or alert.
- The readiness flag occurs after all adapters at the end of the full host and is false during partial loading.
- Simulated syntax/load errors and partial hosts restore the previous host object, retain original error details, and never dispatch through the partially loaded object.
- An empty project boots normally; actual operations still return the normal no-comp result when appropriate.
- Reconnect after a simulated bootstrap failure loads the complete host, clears the blocked/error state, and subsequent calls reuse that initialized host without evaluating files again.

Retained host tests verify original templates, kinetic text, per-caption output, rollback, safe zones, music/engine contracts, fonts/UI actions and installer file integrity. Browser checks cover the RC40 typography/template workflows and RC41 output with 64 simulated captions. These are API/DOM simulations, not native renderer benchmarks.

Not executed: interactive installation on Windows, parsing by the actual ExtendScript engine, native preview/render, loading the user's AEP, real third-party effect initialization, local AI engines or remote music services. The exact source line was removed/replaced and compatibility guards were strengthened, but final confirmation on the user's Adobe runtime remains necessary.
