#!/usr/bin/env sh
set -eu
mkdir -p /workspace/artifacts
ffmpeg -hide_banner -loglevel error -y -f lavfi -i testsrc2=size=320x240:rate=24 -f lavfi -i sine=frequency=440:sample_rate=48000 -t 2.4 -c:v libx264 -pix_fmt yuv420p -c:a aac /workspace/artifacts/mobile56-fixture.mp4
