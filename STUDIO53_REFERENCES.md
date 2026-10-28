# Studio53 — source decisions

Checked against official repository metadata and READMEs on 2026-10-28. "Reference" means a design/architecture comparison, not a claim that source code or all upstream functionality was integrated. Runtime npm versions are pinned in tooling53/package-lock.json and bundled notices ship in tools/vendor/LICENSES53.txt. Existing vendor attributions remain in Info.

| Project | Verified metadata license | Decision | Concrete use / reason |
|---|---|---|---|
| [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) | NOASSERTION | Runtime external tool | Actual proxy, scene cuts, encoders, alpha and audio conversion. User-selected binary; its build controls codec licenses. |
| [AcademySoftwareFoundation/OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO) | Apache-2.0 | Interchange + validation | OTIO JSON adapter; official Python0.18.1 validates both directions. Python is a dev check, not a shipped user requirement. |
| [GStreamer/gstreamer](https://github.com/GStreamer/gstreamer) | NOASSERTION | Deferred alternative engine | Duplicates the current FFmpeg media path; no C++/GStreamer renderer is bundled. |
| [mltframework/mlt](https://github.com/mltframework/mlt) | LGPL-2.1 | Deferred alternative engine | Studied multi-track renderer boundary; integrating native preview/MLT requires a separately built/licensed companion. |
| [mifi/editly](https://github.com/mifi/editly) | MIT | Architecture reference | Declarative render/source timing; no second competing Node rendering engine introduced. |
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | MIT | Existing runtime adapter | Speech transcription and instrumental speech checks; user-supplied executable/model. |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | MIT | Optional ASR provider reference | Current shipped adapter remains whisper.cpp; faster-whisper is not installed or falsely exposed as ready. |
| [m-bain/whisperX](https://github.com/m-bain/whisperX) | BSD-2-Clause | Optional alignment reference | Word alignment/diarization needs Python/models; existing timed-word path retained. |
| [tmarsup/auto-subs](https://github.com/tmarsup/auto-subs) | not verified / 404 | Unresolved identity | Supplied name did not identify a usable official repository; no code imported. |
| [Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect) | BSD-3-Clause | Feature reference / optional provider | Scene-boundary workflow is implemented through existing FFmpeg to avoid mandatory Python model dependencies; PySceneDetect itself is not bundled. |
| [PeterL1n/RobustVideoMatting](https://github.com/PeterL1n/RobustVideoMatting) | GPL-3.0 | Deferred GPL provider | No RVM code/weights integrated. Matting requires explicit model/runtime integration and license compliance. |
| [facebookresearch/sam2](https://github.com/facebookresearch/sam2) | Apache-2.0 | Optional segmentation provider | Not bundled; no nonfunctional object-tracking button exposed. |
| [nadermx/backgroundremover](https://github.com/nadermx/backgroundremover) | MIT | Optional background provider | No mandatory Python background service added. |
| [Anjok07/ultimatevocalremovergui](https://github.com/Anjok07/ultimatevocalremovergui) | MIT | Optional separation provider | Studied separation workflow; not substituted for actual no-vocal verification or claimed to be installed. |
| [facebookresearch/demucs](https://github.com/facebookresearch/demucs) | MIT | Deferred archived provider | Official repo archived; no mandatory archived runtime added. |
| [alibaba-damo-academy/FunClip](https://github.com/alibaba-damo-academy/FunClip) | MIT | Workflow reference | Speech-first editing/review path; not copied as a competing Gradio application. |
| [octimot/StoryToolkitAI](https://github.com/octimot/StoryToolkitAI) | GPL-3.0 | Workflow reference only | Transcript-driven operations; GPL implementation not copied. |
| [opencv/opencv](https://github.com/opencv/opencv) | Apache-2.0 | Optional image-analysis provider | No native Python/CV dependency needed for current Canvas/FFmpeg path. |
| [huggingface/transformers](https://github.com/huggingface/transformers) | Apache-2.0 | Optional model-provider infrastructure | No duplicate model runtime imported into CEP. |
| [diffusionstudio/core](https://github.com/diffusionstudio/core) | MPL-2.0 | Deferred alternative renderer | Reviewed browser rendering boundary; no MPL renderer bundled. |
| [openreelio/openreelio](https://github.com/openreelio/openreelio) | MIT | Architecture reference | Compared project/bin/monitor/timeline and command boundaries; Rust/Tauri engine is not a drop-in CEP runtime. |
| [Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources) | not established | Host API reference | Separate CEP manifest, PPRO bridge, AE ExtendScript; no claim CEP and UXP are interchangeable. |
| [hyperbrew/bolt-cep](https://github.com/hyperbrew/bolt-cep) | MIT | Architecture reference | Preserved mature CEP; added Vite developer UI, TypeScript host/job contracts and separate host entrypoints. Did not insert an incompatible React rewrite. |
| [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | GPL-3.0 | External API integration | /prompt client_id, WebSocket, history, queue and current per-job cancel; GPL server is not copied into this new code. |
| [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | MIT | Pinned development dependency | 34 transaction/interchange/limits/host/profile tests. |
| [microsoft/playwright](https://github.com/microsoft/playwright) | Apache-2.0 | Pinned development dependency | Mouse interaction, media/render/export, responsive and host-boundary regression. |
| [pinojs/pino](https://github.com/pinojs/pino) | MIT | Bundled runtime dependency | Structured local operation log; no graph/prompt/token logging. |
| [tauri-apps/tauri](https://github.com/tauri-apps/tauri) | Apache-2.0 | Deferred companion framework | No Tauri application exists in this package; its updater would not update CEP automatically. |
| [linpengishero/VideoFreeStudio](https://github.com/linpengishero/VideoFreeStudio) | AGPL-3.0 | Architecture reference only | Persistent IDs/recovery concept implemented independently; AGPL application code is not bundled. |
| [echem-labs/local-cut-ai](https://github.com/echem-labs/local-cut-ai) | Apache-2.0 | Architecture reference | UI/engine/API separation and FFmpeg workflow; no whole Electron/Python application copied. |
| [colinhacks/zod](https://github.com/colinhacks/zod) | MIT | Bundled runtime dependency | Graph and loopback endpoint validation. |
| [TanStack/query](https://github.com/TanStack/query) | MIT | Deferred framework-specific dependency | Current panel is not React; existing request state kept rather than installing an unused hook library. |
| [sindresorhus/p-queue](https://github.com/sindresorhus/p-queue) | MIT | Bundled runtime dependency | Limits simultaneous Comfy requests; not presented as a durable GPU queue. |
| [electron-userland/electron-builder](https://github.com/electron-userland/electron-builder) | MIT | Not used for this target | No Electron application/installer to build. |
| [getsentry/sentry](https://github.com/getsentry/sentry) | NOASSERTION | Not used for local-first target | Local redacted Pino log used; no unsolicited remote telemetry service. |
| [open-telemetry/opentelemetry-js](https://github.com/open-telemetry/opentelemetry-js) | Apache-2.0 | Observability reference | Operation/node/progress/time fields retained locally; no collector stack added. |
| [VelornLabs/velorn](https://github.com/VelornLabs/velorn) | GPL-3.0 | Architecture reference only | Official repository currently declares GPL3, not MIT. No code bundled. |
| [0xsline/OpenChatCut](https://github.com/0xsline/OpenChatCut) | AGPL-3.0 | Architecture reference only | Official repository currently declares AGPL3. Remotion/render licenses also require separate review; no code bundled. |
| [OpenCut-app/OpenCut](https://github.com/OpenCut-app/OpenCut) | MIT | UI architecture reference | Reviewed media/program/timeline organization; no whole application embedded. |
| [Theorvane/openscene](https://github.com/Theorvane/openscene) | MIT | Architecture reference | Compared local assistant/history/FFmpeg boundaries; no parallel Electron app. |
| [1mrnewton/cutlass](https://github.com/1mrnewton/cutlass) | Apache-2.0 | Engine reference | Native timeline/commands; current official metadata Apache2, different Slint/Rust UI. |
| [mltframework/shotcut](https://github.com/mltframework/shotcut) | GPL-3.0 | Feature reference only | Track/cut/output workflow studied; GPL code not copied. |
| [KDE/kdenlive](https://github.com/KDE/kdenlive) | GPL-3.0 | Feature reference only | Project/proxy/markers/ASR workflow studied; GPL code not copied. |
| [OpenShot/libopenshot](https://github.com/OpenShot/libopenshot) | LGPL-3.0 | Deferred native engine | Official metadata LGPL3; not silently treated as a browser library. |
| [kudlav/videoeditor](https://github.com/kudlav/videoeditor) | Apache-2.0 | Architecture reference | Old web/native renderer boundary; not a modern complete replacement. |
| [meszmate/rebound](https://github.com/meszmate/rebound) | NOASSERTION | Existing limited vendored integration | Preserved the earlier vendor snapshot and its LICENSE/UPSTREAM. Current GitHub metadata is NOASSERTION; do not infer all upstream files are uniformly MIT. |
| [2b3pro/ae-conjure](https://github.com/2b3pro/ae-conjure) | MIT | Existing limited vendored integration | Preserved source/credit; current scoped local assistant implementation remains separate. |

Additional supplied names: **AutoSubs** was not uniquely identified (the candidate tmarsup/auto-subs returned404). **AutoClip** has several unrelated repositories; none was selected without an exact URL. **UXP Developer Tool / UXP guides** were considered as host API references: the existing product is CEP, so UDT cannot debug this panel directly. **Tauri Updater** is inapplicable without a Tauri companion. **OpenCut Classic** is historical; no old fork was substituted for current OpenCut. **OpenShot Qt** is a full desktop UI, not a CEP plugin.

No claim is made that optional SAM2, WhisperX, matting, separation, MLT, GStreamer or alternative-editor runtimes are installed. They remain explicit future integrations rather than decorative ready buttons. Model-weight terms must be checked independently of code licenses.
