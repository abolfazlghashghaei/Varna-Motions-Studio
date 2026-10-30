# Connect58 Android validation

VersionCode 5801, same application ID and signing key as 0.1/0.2. APK SHA-256: 31a3803428f65c0faaa6836b8bdbadd51f9367fae3a5c028173eea227435bccf.

Player: an actual H.264/AAC fixture was imported directly into the timeline; its decoder was attached to the DOM, play advanced time and changed preview pixels, pause and seek worked. On reload the project remained unopened until explicit Continue; New opened an empty project. The existing editing/audio-output and advanced caption suites passed.

Native: Android compilation, exact asset bytes, signature, and permission inventory passed. Java byte-range parser was executed for whole/open-ended/suffix/bounds/rejection cases. INTERNET is now requested for explicitly selected personal-server operations. The Android bridge permits public HTTPS or private-address HTTP and never follows redirects with the pairing key. APK execution and public networking on Honor 90 have not been run here.

Personal server: actual authenticated HTTP upload/FFmpeg proxy/result passed, including invalid auth/path/operation rejection. Actual local bus and production CEP bridge were exercised with one modeled whitelisted AE call and explicit enable/disable. Actual AE/whisper model execution and a public tunnel were not run. The main-server mode remains unconfigured.

See ../connect58/VALIDATION.md and README_FA.md for setup and limitations. Native code/dependency validation is not evidence of device playback, end-to-end installation or full CapCut/every-plugin parity.

Remote processing results are stored as pending imports and require an explicit import action, so completing a job does not silently modify a project the user switched to. This behavior passed a browser UI test with a modeled network adapter.
