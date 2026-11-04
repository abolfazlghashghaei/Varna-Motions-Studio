# Setup61 validation — 2026-11-04

This release builds a real Windows NSIS EXE and embeds a dedicated Persian/English Windows Forms setup/maintenance interface. It is an online bootstrapper; the desktop payload is pinned independently from the GUI binary.

- EXE: `releases/Varna-Studio-Setup-61.exe`, 199,185 bytes.
- EXE SHA-256: `3fa8b86645c869b1f701e7d0c87a965ca5971821a7eb88a11bf57d0a3f23133d`.
- Installation source commit: `8fc043acb151d57383391dcab6c836d29be9cb35`.
- Archive: 212,343,020 bytes; SHA-256 `fbaae2a43388fe377b92e7359b6105b8f3bfa4ef067e90065d4f0cb14668de72`.
- NSIS 3.11-1 compiled the release with warnings treated as errors; no warnings remained. PE header and embedded file-input hashes verified. `release61.json` records every embedded input hash.
- Real HTTP tests passed: cancellation during stalled headers and body, retained partial bytes, resumed exact size/hash and oversized-partial quarantine/recovery. Progress is measured, not simulated.
- Actual backend subprocess tests passed with controlled GPU/host scripts: inventory; missing restoration-helper rejection; cached pinned archive verification/extraction; child installer argument paths containing spaces and failure exit codes; incremental per-host receipts; owned-panel recovery; foreign/linked-panel preservation; manager-only removal; cancellation before changes.
- Atomic status/receipt replacement and cancellation checkpoints passed against real temporary files.
- Existing desktop regression gate: 100/100 suites passed after fixing the LFS manifest generator. The prior run exposed a Mac fixture/manifest mismatch; the generator now records the LFS object's real size/hash instead of hashing its pointer. The Windows installer excludes this Mac-only binary, so no extra 147 MiB Mac restoration download is performed.
- The actual published payload archive was downloaded and checked: ZIP CRC, 3,303 manifest identities (one valid recoverable LFS pointer), packaged restoration modules, and matching downloader bytes.

## Limits

The Windows Forms UI, actual Windows registry/shortcut activation, UAC behavior, native Adobe/Resolve installation, Windows file-lock/ACL semantics and Windows junction execution have NOT run on a real Windows machine in this environment. Backend filesystem/network tests run on Linux/.NET; Adobe host operations and GPU inventory are explicitly controlled fixtures. No native Windows completion or visual approval is claimed.

The EXE is not commercially Authenticode-signed. User models and settings are kept by default; selected engine/model deletion is permanent and explicitly confirmed. Shared external files without verifiable ownership are preserved. Per-component recovery is implemented; all-host atomic rollback is not claimed. Extraction/activation/deletion cancellation waits for a safe checkpoint. Legacy Resolve external hooks without a Setup61 ownership receipt are preserved. Recovery copies/logs remain until the user removes them.

A source-pinned installer payload and the current embedded GUI are separate build inputs. NSIS packaging now stages the GUI in its temporary directory, then persists the maintenance manager only after successful or partially completed host changes. The embedded current UI/backend source is in this release tag; the older independently pinned payload only supplies the host installers/assets.
