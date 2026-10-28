# Studio54 validation

Base: Studio53 `492a2a5`. Package version4.5.0-rc.47, AE bridge revision **rc47.7**. Existing immutable releases and the established Liquid48 layout/LFS checksum restoration are retained.

Executed on 2026-10-28:

- **99/99 release suites passed**: existing host models, audio/Comfy job fixtures, package ownership/checksums, plus Studio54 caption/table/curve/command/Premiere SDK-model and real filesystem Resolve mailbox checks.
- **34/34 Vitest tests passed** and TypeScript contracts passed typecheck. The established source bounds, rollback, OTIO, 10,000-clip/128-track query, host-scope and profile checks remain.
- **Five actual Chromium suites passed**. Existing decoded media/edit/color/word/audio/export/recovery regressions, actual mouse ruler/playhead/Razor operations, fullscreen and detached-window handoff, all inspector sections, responsive layouts and no NLE in other hosts remain covered.
- New browser acceptance moves every registered original page/control into the editor and restores it; checks an actual Alt+J quick-style dialog, stable caption IDs, style changes without losing unchanged review metadata, correct sorted caption mapping, delete/Undo synchronization, four accelerated-shuttle open/close cycles and real click-through to the main panel. New brand resets raw appearance with Undo while preserving content and word timing. Audio cues round-trip through editor markers.
- Full Premiere canonical UI runs against an explicitly intercepted native transport: proper sequence size/FPS/fonts and original review/style/motion/table/brand controls; no AE scripts or NLE sent to Premiere. Actual shared text/gradient/glass/table pixels were encoded/probed as alpha ProRes. Assistant shape application and Undo were checked. Actual ProRes source import uses FFmpeg compatibility media and survives IndexedDB reload in the full standalone UI.
- Actual video export exposed a recording preroll/work-area overrun. Recording now skips redundant seek after preparation, playback stops at the work-area end, and converted outputs receive a validated explicit FFmpeg duration. The original measured H264 work-area test passed after the fix; its duration assertion was not relaxed.
- Official PowerShell7.5.3 executed the real staged installers for **Resolve, Premiere and Editor** in isolated filesystem user roots. Verified official Electron ZIP extraction/cache, repair of a removed runtime file, full tools/fonts/notices/configuration, Lua entry without BOM, no NLE installation in the other hosts, reinstall backup, corrupt-source rejection and corrupt-runtime rejection all passed. Windows registry/application activation was not exercised by this Linux filesystem test.
- The official Electron45.1.0 Windows x64 ZIP was downloaded, SHA256/size verified, ZIP-tested and inspected for its Windows executable. Each installed runtime file is recorded/checked on reinstall. The Windows executable itself was not run.
- The actual Lua connector executed with Lupa against a constrained Resolve SDK model. Timer/dispatcher/heartbeat/mailbox, source offsets/timecode, exact frame placement, overlap isolation, owned-output deletion, wrong-project/script rejection and sound-marker ownership/move behavior passed. The real Node mailbox used real files and exercised stale/disconnected sessions, identity checks, timeout, cleanup, whitelist and no automatic duplicate operations.
- Browser production and host screenshots were inspected; source whitespace and exact package checksums were checked. The generated full Premiere/Resolve/standalone entries share canonical controls. MIT JSON source and runtime notices are retained.

Native After Effects, Premiere Pro and DaVinci Resolve execution, Windows activation, real GPU/model inference and MiniMax/YuE audio quality remain **unrun**. SDK models are not substitutes for those application tests. This is a prerelease for native validation, not a declaration of complete NLE/native-effect parity. See `STUDIO54_SECTIONS.md` for specific compatibility boundaries and `Varna_Motion_Studio/STUDIO54_FA.md` for installation.

Reproducible checks:

```sh
npm --prefix tooling53 ci
npm --prefix tooling53 test
npm --prefix tooling53 run typecheck
node Varna_Motion_Studio/tests/run-release.cjs
npm --prefix tooling53 run test:browser
# Optional development tools; not end-user Python/Node requirements:
PYTHONPATH=/path/to/lupa python tooling53/resolve54-check.py
VARNA_PWSH=/path/to/pwsh VARNA_RUNTIME_ZIP54=/path/to/verified-electron.zip python tooling53/installer54-check.py
```

Run browser/network fixtures in an environment permitting loopback sockets and child processes. Rebuild canonical host entries with `node tooling53/build-host-ui.mjs`; regenerate `PACKAGE_MANIFEST.json` after payload edits with `python Varna_Motion_Studio/tools/build_manifest.py`.
