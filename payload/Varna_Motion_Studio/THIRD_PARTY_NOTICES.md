# Third-party notices — Studio55 additions

Existing bundled effect, font, media and tool notices remain in their original folders and in the application's **Info & licenses** dialog (`js/credits47.js`). This file records the additional offline text engine dependencies; it does not replace those notices.

| Component | Version/source | License | Changes |
|---|---|---|---|
| nspell | 2.1.5, https://github.com/wooorm/nspell | MIT | Bundled/minified with the application adapter; source library unchanged. `assets/text55/nspell-LICENSE`. |
| is-buffer | 2.0.5, https://github.com/feross/is-buffer | MIT | Bundled dependency, unchanged. `assets/text55/is-buffer-LICENSE`. |
| Lilak Persian dictionary | https://github.com/b00f/lilak, distributed by wooorm/dictionaries commit 8cfea406b505e4d7df52d5a19bce525df98c54ab | Apache-2.0 | `.aff` and `.dic` copied without edits from pinned distribution. `assets/text55/fa-license`, `Apache-2.0.txt`, `fa-readme.md`. |
| English en_US Hunspell dictionary | https://github.com/wooorm/dictionaries, same commit | MIT AND BSD; constituent notices included | Dictionary files unchanged. Full `assets/text55/en-license` includes SCOWL, WordNet, Ispell and other source notices. |
| esbuild (build tool only) | 0.25.12, https://github.com/evanw/esbuild | MIT | Not required or shipped as a runtime dependency of the panel. See build lockfile. |

Generated bundle: `js/text55-core.js`. Build source, dependency integrity, reproducible commands and audit: `tooling53/text55-build/` at repository root. Dictionary download URLs and SHA-256 values: `assets/text55/sources.json`.

No Nevise, DadmaTools, fastText, SymSpell or other model weights are distributed by this addition. The Hunspell **native library** is not bundled: nspell is a JavaScript-compatible implementation. Original normalization/Finglish/ranking code is in `tooling53/text55-build/engine.cjs`.
