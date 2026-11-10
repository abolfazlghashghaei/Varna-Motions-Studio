# FFmpeg Binaries

Railcut bundles static ffmpeg binaries for waveform and thumbnail extraction. The binaries are too large for git (`bin/` is gitignored) — set them up manually on each build machine.

## Directory Structure

```
bin/
  win/ffmpeg.exe    — Windows x64 static build (~95 MB)
  mac/ffmpeg        — macOS universal (arm64 + x86_64) static build (~148 MB)
  README.md         — This file (tracked in git)
```

## Windows Setup

1. Download the **essentials** build from https://www.gyan.dev/ffmpeg/builds/
2. Extract `ffmpeg.exe` from the archive (`ffmpeg-*-essentials_build/bin/ffmpeg.exe`)
3. Place it at `bin/win/ffmpeg.exe`
4. Verify: `bin/win/ffmpeg.exe -version`

## macOS Setup

The macOS binary **must** be a universal binary (arm64 + x86_64) and ideally signed/notarized to avoid Gatekeeper issues.

1. Download **arm64** and **x86_64** static builds from https://ffmpeg.martin-riedl.de
   (these builds are signed and notarized — avoids Gatekeeper issues)
2. Create a universal binary:
   ```bash
   lipo -create ffmpeg-arm64 ffmpeg-x86_64 -output ffmpeg
   ```
3. Place it at `bin/mac/ffmpeg`
4. Verify: `file bin/mac/ffmpeg` should show `Mach-O universal binary with 2 architectures`

**Do not** use evermeet.cx or Homebrew builds — they are single-arch and unsigned, which causes Gatekeeper rejections on end-user machines.

## Copying Between Build Machines

If you already have the macOS binary on one machine (e.g., Mac Mini at `192.168.86.53`):

```bash
mkdir -p bin/mac
scp pluto@192.168.86.53:/path/to/railcut/bin/mac/ffmpeg bin/mac/ffmpeg
```

Or copy from a network share (e.g., `X:\.openclaw\projects\railcut\bin\mac\ffmpeg`).

## Build Integration

The Vite build copies `bin/` → `dist/bin/` automatically. The ZXP includes both platform binaries so a single ZXP works on Windows and macOS.

At runtime, Railcut picks the correct binary based on `os.platform()`:
- Windows: `<extension>/bin/win/ffmpeg.exe`
- macOS: `<extension>/bin/mac/ffmpeg`

If ffmpeg is missing, waveforms and thumbnails are disabled and a toast notification is shown. The extension still works for all other features.

## License

FFmpeg is licensed under the GNU GPL v2.0. See https://ffmpeg.org/legal.html for details. The "Open Source Licenses" item in Railcut's Settings menu provides the required GPL disclosure.
