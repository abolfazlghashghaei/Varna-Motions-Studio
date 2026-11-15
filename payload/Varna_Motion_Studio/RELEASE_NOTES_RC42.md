# Varna Motion Studio 4.5.0-rc.42

Addresses the RC41 startup failure reported at host/ghaf_host.jsx line 2089. The exact line contains the RTL Latin/number isolation formatter and the host's only unescaped forward slash in a regular-expression literal. Replace that formatter with an ES3 character scanner and verify equivalence against its prior intended behavior. The old pattern is now rejected by a conservative host packaging guard, even though the general ES3 Acorn parser accepts it. The user screenshot is direct evidence of the native load failure; no claim is made that a complete Adobe parser has been reproduced here.

The manifest now preloads a passive boot42.jsx. CEP loads the full host in a caught path. Readiness is reset at the start of host initialization and published only at the final line. The loader validates the revision, readiness marker, dispatch and required methods; it stages a fresh host object and restores the previous object if loading fails. Successful initialization retains selected session/source caches. Regular calls and timeline polling reject an incomplete host, and a bootstrap error remains visible instead of being replaced by a timeout.

All RC41 assets/features and output pacing/recovery behavior are retained. Host revision rc42.1 refreshes stale adapters. Windows Adobe runtime and native renders remain separate, unexecuted validation steps. See TEST_REPORT_RC42.md.

Primary reference for the two supported JSX loading paths: Adobe CEP 12 Cookbook, https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_12.x/Documentation/CEP%2012%20HTML%20Extension%20Cookbook.md . The runtime issue itself is grounded in the supplied RC41 screenshots and the packaged source line.
