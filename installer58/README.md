# Windows EXE bootstrap build

Build with NSIS 3.11 or later and Python3. Download the immutable source archive for a full reviewed commit, then run:

```
python installer58/build.py --commit FULL_40_HEX_COMMIT --archive downloaded.zip --compiler /path/to/makensis
```

`release.nsh` is generated and ignored. The EXE embeds Install58.ps1 plus the exact archive URL/size/SHA-256; it does not trust a moving branch. Output and payload metadata are in build/. The nonempty-archive guard rejects placeholder builds. This is an online bootstrapper, not an offline 200+ MB installer. NSIS runtime is not bundled as a separate dependency. The resulting EXE is not commercially Authenticode-signed.

Application/runtime is a required shared component. AE, Premiere, Resolve, personal server and extended AE/local-AI components are selections. Extended AE/local-AI implies AE. Host backups and runtime verification reuse the existing tested installers. There is no all-components atomic rollback. Local-AI installation is the existing official NVIDIA portable path and checks existing health instead of silently accepting an invalid engine.

The personal server and optional internet-tunnel shortcuts are written only when that component is chosen. Existing pairing/configuration is retained. Source package and verified downloads remain in the user profile for repair/reuse. See ../connect58/README_FA.md.

Published EXE payload is pinned in payload-lock58.json. It intentionally downloads that reviewed PC source commit; the Android APK can receive independent client fixes in a later release commit without changing the server protocol.
