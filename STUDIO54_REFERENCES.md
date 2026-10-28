# Studio54 source decisions

The earlier 47-project evaluation remains in `STUDIO53_REFERENCES.md`; alternatives were not embedded simply because they were named. The following additions address actual failures in this release.

| Source | Actual use | License / distribution |
|---|---|---|
| [Electron](https://github.com/electron/electron/releases/tag/v45.1.0) | Windows x64 Node-capable companion for Resolve and detached AE editing; avoids user Python/Node PATH dependence | Official v45.1.0 ZIP pinned to 158224448 bytes / SHA256 `55eaba17abff7b5bba6c3bbc85068967379024fe742fe9c7fdba9118922ccbe2`; installer verifies before extracting; upstream LICENSE and Chromium notices retained |
| [rxi/json.lua](https://github.com/rxi/json.lua) | Unmodified JSON encoder/decoder for the actual Lua Resolve connector | MIT; exact source revision and original LICENSE in `integrations/resolve/lib/UPSTREAM.md` and `LICENSE` |
| [Premiere scripting guide](https://github.com/docsforadobe/premiere-scripting-guide) | Sequence settings, media/ticks, TrackItem placement/removal API reference | Documentation reference; no application code copied |
| Resolve bundled scripting API and UIManager examples | Native timeline/media insertion plus UI timer/dispatcher behavior | API reference only; no GPL editor/application source copied |
| FFmpeg | Actual source compatibility transcode and persistent ProRes4444 graphics | User-selected existing binary; license depends on build; not replaced by a decorative export label |
| Existing Playwright / Vitest / Lua / PowerShell | Real browser/media/installer regressions and constrained host SDK models | Dev tools only; no Python/Lupa requirement for end-user Resolve launch |

The previous statement that no Electron companion exists is superseded in Studio54. electron-builder and Tauri Updater are still unused: this installer deploys a checksum-pinned official runtime and the existing shared application directly. No remote error telemetry is added.
