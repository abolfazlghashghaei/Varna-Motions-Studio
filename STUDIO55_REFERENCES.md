# Studio55 dependency and architecture audit

Reviewed on 2026-10-29. Repository metadata is saved in `tooling53/text55-build/repository-audit.json`. A GitHub license label is a discovery aid, not permission for every dataset, model or dependency. No neural weights were added.

The shipping application is a vanilla JavaScript Adobe CEP panel, with a Node-backed local browser/Electron workspace and separate Premiere/Resolve bridges. It is not a .NET application or a Flutter application. Existing timeline and production-page DOM nodes must retain their event handlers and state.

## Included

| Source | Exact material | License / decision |
|---|---|---|
| [nspell](https://github.com/wooorm/nspell) | npm 2.1.5, bundled JavaScript, is-buffer 2.0.5 | MIT. Hunspell-compatible implementation; **not the native Hunspell library**. Avoids a different native ABI binary for each CEP/Electron runtime. Last repository push reported 2021; compatibility is covered by our pinned regression tests. |
| [Lilak](https://github.com/b00f/lilak), via [wooorm/dictionaries](https://github.com/wooorm/dictionaries) | Full Persian `.aff` / `.dic`, dictionary repository commit `8cfea406b505e4d7df52d5a19bce525df98c54ab` | Dictionary Apache-2.0, its notice and complete license included. Upstream readme identifies Lilak; do not confuse its latest source commit with the version of the generated dictionary. |
| [English en_US dictionary](https://github.com/wooorm/dictionaries/tree/8cfea406b505e4d7df52d5a19bce525df98c54ab/dictionaries/en) | Full `.aff` / `.dic` at the same immutable commit | MIT AND BSD, with additional constituent notices preserved in `assets/text55/en-license`, not just the packaging repository's MIT license. |
| Original application modules | Persian character normalization, conservative ZWNJ suggestions, personal dictionary, limited Finglish lexicon, reviewed context ranking, worker lifecycle, dock workspace | Authored for this repository. No Python NLP code or unverified dictionary copied. |

Exact asset URLs, byte sizes and SHA-256 values are in `assets/text55/sources.json`; npm dependency integrity values are in `tooling53/text55-build/package-lock.json`. Full third-party notices are available in the panel Info dialog and `Varna_Motion_Studio/THIRD_PARTY_NOTICES.md`.

## Evaluated, not bundled

| Source | Findings / reason |
|---|---|
| [Hunspell](https://github.com/hunspell/hunspell) | Native C++ implementation with LGPL/GPL/MPL choices; existing runtimes have different native-module ABIs. Selected nspell for the initial offline engine. No claim of full native Hunspell feature parity. |
| [SymSpell](https://github.com/wolfgarbe/SymSpell) | MIT, C#. Useful deletion-index approach, but its frequency corpus is a separate dependency and Persian inflection coverage must be measured. No .NET service or frequency corpus shipped; no head-to-head benchmark claimed. |
| [persian-text-utils](https://github.com/AliAkrami1375/persian-text-utils) | MIT, Python, lightweight; adding a Python runtime solely for character normalization is unnecessary in this CEP panel. Implemented narrow, tested JavaScript normalization. |
| [Nevise](https://github.com/Dadmatech/Nevise) | No license detected in repository metadata; checkpoint/data distribution permissions not verified. BERT runtime and weights not bundled. |
| [DadmaTools](https://github.com/Dadmatech/DadmaTools) | Apache-2.0 code; model/checkpoint/data terms and offline resource discovery need separate review. Optional later context backend, not installed automatically. |
| [Persian-Spell-checker](https://github.com/reza1615/Persian-Spell-checker) | No license detected; old repository. Do not infer redistribution rights from a third-party LGPL label. Not copied. |
| [Finglish-Farsi-Translator](https://github.com/FrameworkPython/Finglish-Farsi-Translator) | MIT; Python/Tkinter does not fit current UI. A finite, original lexicon with explicit review is used instead of adopting its GUI or assuming complete transliteration quality. |
| [finglify](https://github.com/ammont/finglify) | No license detected; Persian-to-Latin direction alone cannot solve ambiguous Latin-to-Persian conversion. Not copied. |
| [fastText](https://github.com/facebookresearch/fastText) | MIT library, repository archived. Language-ID model has separate terms; does not establish Finglish detection. No model bundled. |
| [JamSpell](https://github.com/bakwc/JamSpell) | MIT code; no verified Persian model included. Native runtime and model corpus would need separate packaging and evaluation. |
| [pyspellchecker](https://github.com/barrust/pyspellchecker) | MIT, Python; duplicates initial spelling engine and adds runtime requirements. |
| [filyp/autocorrect](https://github.com/filyp/autocorrect) | LGPL-3.0, Python, no verified built-in Persian corpus. Not included. |
| [LanguageTool](https://github.com/languagetool-org/languagetool) | LGPL-2.1, Java; future optional local English grammar service. This release does not claim grammar correction. |
| [nodehun](https://github.com/Wulf/nodehun) | `wooorm/nodehun` returns 404; `nathanjsweet/nodehun` redirects to Wulf. MIT binding, native Hunspell remains separately licensed. ABI/Windows builds not evaluated here. |

## Editing workspace references

[OpenCut](https://github.com/OpenCut-app/OpenCut) and [OpenReelio](https://github.com/openreelio/openreelio) were checked as modern editing references (MIT metadata; OpenReelio identifies itself as pre-alpha). Their application runtimes were not transplanted into a mature CEP document. Source/program monitors, a project bin, inspector and timeline now occupy movable dock slots, using the existing application controllers.

[Shotcut](https://github.com/mltframework/shotcut) and [Kdenlive](https://github.com/KDE/kdenlive) report GPL-3.0; they were not copied. [MLT](https://github.com/mltframework/mlt) reports LGPL-2.1 and is a native media framework, not a drop-in JavaScript timeline. [Bolt CEP](https://github.com/hyperbrew/bolt-cep) is an MIT development scaffold; replacing this production application's architecture with a starter would not itself add editing functionality. Existing FFmpeg/export code remains in use.

No upstream editor code is represented as integrated merely because the repository was researched. A complete equivalence to Premiere, Resolve, After Effects, or a mobile GPU renderer is not a result of this release.
