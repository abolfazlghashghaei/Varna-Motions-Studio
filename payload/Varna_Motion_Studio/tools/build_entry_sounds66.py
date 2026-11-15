"""Generate original, reproducible UI entry sounds; no third-party recordings."""
import math
import random
import struct
import wave
from pathlib import Path

DEST = Path(__file__).resolve().parents[1] / 'assets/sfx/entry66'
RATE = 44100
SPECS = {'soft': .16, 'pop': .12, 'air': .28, 'chime': .32}


def sample(kind, t, length, rng):
    x = t / length
    envelope = min(1, x * 35) * (1 - x) ** 2
    if kind == 'soft':
        return .42 * math.sin(2 * math.pi * 720 * t) * math.exp(-32 * t) * envelope
    if kind == 'pop':
        return .48 * math.sin(2 * math.pi * (510 * t - 1200 * t * t)) * envelope
    if kind == 'air':
        return .17 * (rng.random() * 2 - 1) * math.sin(math.pi * x) ** 2
    return .24 * (math.sin(2 * math.pi * 1100 * t) + .4 * math.sin(2 * math.pi * 1650 * t)) * envelope


def build():
    DEST.mkdir(parents=True, exist_ok=True)
    for kind, length in SPECS.items():
        rng = random.Random(66)
        data = [round(max(-.98, min(.98, sample(kind, i / RATE, length, rng))) * 32767) for i in range(round(RATE * length))]
        with wave.open(str(DEST / (kind + '.wav')), 'wb') as output:
            output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
            output.writeframes(struct.pack('<' + 'h' * len(data), *data))


if __name__ == '__main__':
    build()
