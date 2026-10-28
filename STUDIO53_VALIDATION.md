# Studio53 validation

Base: Studio52.1 `7104c61`. Package4.5.0-rc.47, AE adapter revision rc47.6. The established Liquid48 layout/checksum restoration remains intact. This prerelease corrects the host scope: NLE only in AE; shared tools in Premiere and Resolve.

Executed on 2026-10-28:

- Release gate: **97/97 suites passed**, including actual local HTTP/WebSocket job progress, reconnect/history, foreign-job isolation, safe per-job cancellation, lost-job handling, graph/loopback validation, file rename recovery, ES3 host models and exact package verification.
- Vitest: **34/34 tests passed** covering edits/rollback, source bounds, OTIO, work area, all size presets, 10,000 clips across128 tracks, host policy and export profile contracts. TypeScript contracts passed typecheck.
- Three Chromium suites passed: existing Studio51/52 media/word/color/mix/graphics/keyframes/alpha/JSON/recovery regressions; source In/Out/Insert/Append; actual mouse ruler/playhead/razor; undo/redo; proxy create/toggle; inspector sections; work-area H264 export; shared Premiere/Resolve title/word/table tools with no NLE code; responsive widths380/680/1150/1660. Native fonts/CEP/GPU remain separate.
- Actual FFmpeg encodes + ffprobe passed: H264, H265, ProRes422HQ, PCM24, MP3 and AAC. Real proxy and red/blue scene-cut detection passed. Alpha regression measured transparent and opaque pixels in encoded ProRes4444.
- Official OpenTimelineIO0.18.1 read/serialization/import passed for tracks, gaps, source trims and total duration. Export uses compatible Clip.1 schema; import also accepts the official serializer's Clip.2 media_references representation. It rejects unsupported nesting/transitions/effects instead of silently losing them.
- Official PowerShell7.5.3, verified against upstream SHA256, parsed and ran the actual Resolve installer in isolated user roots. First install, reinstall/backup, fonts/launcher paths and absence of NLE files passed. A deliberately corrupted source failed before changing the current installation. This Linux filesystem check is not Windows registry/Adobe/Resolve activation testing.
- Python launcher syntax checked; saved pinned npm setup and startup instructions; source diff whitespace checked. No native model weights installed and no paid service keys required for these development tests.

Runtime dependencies actually used: ws, Zod, PQueue and Pino with pinned transitive lockfile and runtime-only bundle/notices. Vite/TypeScript/Vitest/Playwright remain development tooling, outside the installed payload. No unused React query hooks, Electron installer, Tauri updater or copied GPL editor runtime was added.

The existing rename-recovery fixture now provides an actual file-based CEP window.location so it loads the new client the same way the product does; all original failure/retry assertions remain. The audio HTTP fixture uses statusCode instead of writeHead-before-setHeader so it can reject WebSocket upgrades correctly. Tests were not disabled to obtain the pass.

Limits and unimplemented product features are recorded section by section in STUDIO53_SECTIONS.md. Source decisions and official metadata corrections are in STUDIO53_REFERENCES.md. Browser export remains real-time, accelerated shuttle is seek-based/muted, proxies are session-local, Resolve Text+ needs duration trim, shared brands do not yet perform full native asset-pack import, and native AE plugin effects cannot execute in other hosts or Canvas. Actual MiniMax/YuE output quality, GPU inference, host rendering and Windows activation are **unrun**.

Cloud environment draft: install_script and start_skill saved without changing network/credential configuration. Saving the draft does not publish a new cloud-environment snapshot.
