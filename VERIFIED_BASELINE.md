# Confirmed working baseline

The user confirmed that Windows installation succeeded after using the complete corrected package. This is the baseline for subsequent work.

- Release: `v4.5.0-rc.47-liquid48-layout1`
- Payload commit: `af2c15aeafacbb5d246fd6e0e24fd517abbaa117`
- Plugin version: `4.5.0-rc.47`; native adapter: `rc47.2`
- Installer manifest: 3159 files
- Confirmation date: 2026-10-26
- Complete package: https://github.com/abolfazlghashghaei/Varna-Motions-Studio/archive/refs/tags/v4.5.0-rc.47-liquid48-layout1.zip
- Release page: https://github.com/abolfazlghashghaei/Varna-Motions-Studio/releases/tag/v4.5.0-rc.47-liquid48-layout1

The successful route was extracting the complete package into a new folder and running the top-level `INSTALL_WINDOWS.bat` beside `PREPARE_GITHUB_DOWNLOAD.ps1`. Earlier overlays and the layout-repair-only bundle did not resolve the differing vendor files in the user's old extracted package.

Continue from this released payload. Preserve the corrected installer layout, verified component restoration, package checksums, complete vendor assets and Liquid48 features. Do not replace or move the existing release tag when developing subsequent changes.

The confirmation establishes successful installation. It does not establish that all interface behavior, Adobe rendering, fonts, effects or GPU performance have been checked by the user.

On 2026-10-27 the user approved the appearance and logo of Finalize49 (`cfe3e65`, tag `v4.5.0-rc.47-finalize49`). Subsequent Production50 work keeps that appearance as the default and addresses the user's reported production issues. This visual approval does not certify the new native rendering or audio-generation changes.
