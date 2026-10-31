# RC41 validation

Environment: Linux, Node 24, Chromium headless/Playwright; Adobe APIs are simulated. The final package is generated after `node tests/run-release.cjs` passes. The gate has 63 suites, retaining the prior 60 and adding RC41 bridge, output and app behavior tests.

New checks:

- Preflight succeeds with text creation and effect probing disabled, leaves layer count unchanged, and reads installed-effect metadata.
- Physically one native call remains outstanding across a soft timeout and a late callback. No parallel retry, reconnect, vendor script or time poll is sent. Pending time reads drain before mutations. Idle waiting has an explicit expiry.
- Output begin/build/commit replies arriving late are tested end to end through the real bridge and host model. Late begin/build are aborted after settlement, retaining old output. A late successful commit is recovered through a receipt, with no duplicate creation or erroneous rollback.
- Lightweight preparation preserves text, font, timing and emphasis without mutating source settings. Expensive template/scene/motion/background/vendor effects are excluded only in the explicit profile.
- Indexed layer detection and ID-less object fallback both retain correct results.
- The actual application output handler pauses preview before preflight, cleans the pinned destination, uses one caption per request, does not wait for model analysis by default, releases buttons/gates after errors, and displays the original timeout instead of a false missing-target error.

`tests/rc41_browser.cjs` exercises 64 captions in first-to-last order with simulated delayed Host replies, one-caption payloads, light mode, cancellation, original error visibility, control recovery, and six widths (250–1480px, including 450px height) without overflow or page errors.

The existing RC37 and RC40 browser suites are also run against this release to check output cancellation/update behavior and typography/template workflows after the changes. Font-search and other retained regression checks remain in the earlier release validation records.

Not executed: interactive Windows installation, actual Adobe rendering, real third-party effect initialization or GPU/RAM benchmarks, or the user's AEP project. This is not a promise that full MOGRT/Glass workloads run on every low-end computer. If the native callback never returns, the operation cannot be confirmed complete or forcibly interrupted through this bridge; the panel reports that uncertainty without sending overlapping scripts.
