# Offline text55 build

The installed panel needs no npm, Python, Java, .NET, downloads, or model server to correct text. It loads the committed JavaScript bundle and four committed dictionary files into a worker only after the user enables **Offline text correction**.

## Reproduce the JavaScript bundle

Development tools: Node 18+ (validated on Node 24), npm. Run from repository root:

```
npm ci --prefix tooling53/text55-build --cache /path/to/npm-cache
node tooling53/text55-build/build.cjs
node Varna_Motion_Studio/tests/text55_core.cjs
node --expose-gc tooling53/text55-build/benchmark.cjs
```

The first command provisions the exact dependencies in the lockfile. To provision an air-gapped development machine, cache these packages on a machine with the **same operating system/architecture** (esbuild has a platform-specific binary), then transfer that cache and the source repository. On the offline machine:

```
npm ci --offline --prefix tooling53/text55-build --cache /path/to/npm-cache
node tooling53/text55-build/build.cjs
```

A clean empty npm cache cannot build offline. The installed Windows package is already built and has no such prerequisite. Dicts are committed; rebuilding does not download them. Verify their SHA-256 hashes against `assets/text55/sources.json` before updating. Do not silently replace pinned upstream data.

## API and lifetime

`VarnaText55.create({fa:{aff,dic},en:{aff,dic},userWords})` creates an engine. `suggest(token,options)` and `inspect(caption,options)` return suggestions with original UTF-16 offsets; they never mutate the input. Options include `finglish`, `language`, `protectedPhrases` and reviewed `contextPairs`. `setUserWords` updates the persistent dictionary's in-memory view. `applyEdit` validates a span and maps a selection through an edit.

The browser UI loads only its own local packaged assets (same-origin HTTP, or fs for file-based CEP/Electron). It never invokes the model/ComfyUI/llama services. HTTP in browser tests refers to the loopback static server, not an internet correction service. A generation counter, AbortController and worker termination reject outstanding requests when disabled. Settings and personal words remain in local storage for the next launch.

All spelling and Finglish suggestions need approval. Optional autocorrection is limited to unambiguous Persian Unicode letter normalization for recognized words; spelling/context/spacing changes do not apply unattended. Context preferences come only from accepted suggestions and are stored locally. No general Persian BERT or English grammar model is claimed. Initial full-dictionary expansion uses substantial memory; see benchmark report. Turning the feature off releases the worker rather than retaining its dictionary heap.

## Packaging and tests

Run `node tooling53/build-host-ui.mjs`, then `python Varna_Motion_Studio/tools/build_manifest.py` after release files are final. The AE installer copies the manifest payload; cross-host installers explicitly verify/copy `assets/text55`, the worker and bundle. Main offline switch exists in all full production UIs; NLE/layout55 is excluded from Premiere and Resolve.

`studio55_browser.cjs` exercises actual workers, cancellation, reload persistence, approval, stale text, Undo/Redo, layout pointer dragging/resizing and responsive panes. `text55_file_browser.cjs` models the CEP filesystem adapter using a file base URL, because managed Chromium blocks direct file navigation; it tests actual workers, auto-normalization and caret retention. `installer54-check.py` executes staged PowerShell installation against the actual payload and verified Windows Electron archive, including checksum rejection. That filesystem test on Linux is not evidence that Adobe/Resolve or Windows activation was run.
