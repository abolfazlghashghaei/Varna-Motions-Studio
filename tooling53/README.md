# Development environment

Continue in the existing checkout; do not create a worktree unless explicitly requested. Production stays CEP with separate host bridges. Vite/TypeScript follow the UI/host separation encouraged by Bolt; this is not a React/UXP rewrite.

Development prerequisites: Node20.19+ (validated with24), npm, Python3, FFmpeg/ffprobe and Chromium at `/usr/bin/chromium`. Installing the AE panel does not require npm. Shared Resolve tools require Node18+; configured model executables/weights remain separate.

Run `npm ci --ignore-scripts`, `npm test`, `npm run typecheck`, `npm run test:release` and `npm run test:browser` from this directory. The browser runner resolves the pinned local Playwright dependency.

`npm run dev` starts UI-only Vite on loopback5173. For full local APIs use `node ../Varna_Motion_Studio/tools/editor51-server.cjs` on its own origin. The token/Origin boundary stays enabled. Resolve uses `--host resolve` on fixed port8795. Restart services in a new cloud task.

`npm run build:runtime` rebuilds the checked-in runtime-only bundle/notices. Run it when changing runtime dependencies; reopening a checkout does not require this tracked-file build step. Regenerate PACKAGE_MANIFEST.json after payload changes. Never weaken vendor checksum checks.

Optional independent OTIO validation: install requirements-dev.txt in an isolated Python target/venv and run otio-check.py. A SHA256-verified official portable PowerShell7.5.3 also parsed/exercised Resolve installation in temporary directories. Linux testing does not establish Windows registry/native-app activation.
