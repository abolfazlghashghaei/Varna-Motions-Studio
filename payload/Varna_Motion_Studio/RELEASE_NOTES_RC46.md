# 4.5 RC46

Typography preview could stop with an After Effects hidden-property expression error and retain the previous plain caption. The renderer no longer enables Time Remap, removes all its keys, then writes to the disabled property. Its private scene duration already matches the cue; normal 100% playback preserves the local timing and final frame.

Motion cleanup now addresses active transform channels only, including separated Position followers. Empty expressions are not assigned to hidden 3D channels on 2D layers. The same cleanup is used for independent background anchors. Unexpected dispatch errors identify the method and available native line.

Choosing an automatic phrase layout after a manual drag clears only the manual coordinates. Free layout retains them. Per-phrase font, color, background and motion are preserved.

Host revision rc46.1 invalidates the cached RC45 adapter. RC43 atomic loading, serialized individual caption construction and original assets remain intact. See TEST_REPORT_RC46.md for executed checks and native-runtime limitations.
