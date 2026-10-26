# RC47 / Liquid48 validation

The plugin remains version `4.5.0-rc.47`; its native adapter is `rc47.2` so CEP reloads a previously loaded adapter.

## Executed checks

- All 83 release suites were covered successfully: 77 passed in the complete run, and all six outstanding checks passed focused rechecks after resolving test-runner resource contention and regenerating the final manifest. No assertions were removed. The minimal DOM test fixture now uses indexed ID lookup and linear traversal instead of repeatedly flattening the complete tree.
- Final installer verification passed all 3159 file sizes and SHA-256 hashes, installer entry points, ownership boundaries and rollback checks.
- The final Liquid48 Chromium suite passed: seven original SVG dashboard icons, no undefined SVG paths, five theme gradients, pointer movement, click scatter/return, idle rendering stop and reduced motion; six table composition alignments, margins, keyboard precision and batch cell alignment; independent word splitting/color/tracking/stroke/motion/background, save/read/export and AE preview payload; and clipping/overflow checks at widths 250, 320, 430, 680, 900 and 1480.
- The new native-host model passed 18 actual RTL/LTR table text placements, independent word style/background settings, spring expression plus outro, explicit color precedence, payload immutability and cleanup.
- Existing Production47 and Table47 Chromium suites passed during development. They exercise routes, correction approval, shared table surfaces, live update serialization and drag/resize behavior.
- Final dark, compact light and typography screenshots were visually inspected.

## Scope and limitations

The decorative material is a CEP web implementation inspired by Liquid Glass. It is not Apple's native platform renderer. The large V uses equivalents/transliterations from multiple supported writing systems; there is no claim that every language has a V character. Unsupported glyphs are filtered.

Native Windows installation, Adobe expression evaluation, actual font shaping, optical effects and CEP GPU performance still require testing inside After Effects. Chromium screenshots and constrained native-host models do not establish those outcomes. Installer checksum verification and the previously corrected Git LFS recovery helper remain enabled.
