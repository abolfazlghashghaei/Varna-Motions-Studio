# Workbench66 — After Effects panel

Scope: desktop RC47 plugin. Android Native65 and the removed video editor are unchanged. This is a tested implementation batch, not completion of every item in the 2026-11-08 request or a certified Windows installer release.

## Table

- A global font selector uses the existing installed-font list. Per-cell font search/overrides remain. Panel preview and actual host output inherit `cell.fontPS > payload.fontPS > ArialMT`.
- Composition dimensions are read on entering the table and on focus. Follow-playhead polling detects composition identity/dimension changes. No first preview build is needed. A stationary playhead no longer rebuilds the preview DOM every polling interval, avoiding interrupted handle interaction.
- Drag magnets snap the table to composition center/edges; Alt bypasses magnets. Existing exact alignment and keyboard nudging remain.
- Four authored entrance bundles combine native surface/cell keyframes, stagger and duration: spring, cascade, float and stretch. Curve choices are smooth, gentle, snappy and linear. Optional keyed fade, shrink and drop exits apply to the shared controller or independent layers; exit duration is bounded by each layer's lifetime. These are mobile-inspired combinations, not iOS/Android APIs or a general property/curve editor.
- The composition stays above paginated settings. Structure and content are separate stages. Previous/next and a named page selector expose the actual inputs without cloning handlers. Deep links open the right control page. Long spreadsheets retain their own bounded scrolling area; narrow/short panels may apply modest control scaling (down to 85%). Advanced frame/options disclosure and extreme viewport sizes can still require fallback workspace scrolling.
- Caption text and table cell text default to committing after leaving the field. An independent preference on each screen permits idle updates instead: 1100ms for caption typing, 800ms for table changes. Non-text table changes still coalesce at 800ms. Live AE updates remain serialized and require the live switch to be on.

## Text, motion and materials

- Appearance is a separate production step from motion. Stock motion and the custom motion builder share the motion category. The Tools destination has a grid icon; the About icon is corrected. Primary Tracking/Leading labels are descriptive Persian, with English localization retained.
- Search and display density controls move into the compact header. Subpanel selection replaces the large wrapped route list. Favorite stars have a filled luminous state.
- Existing 12 native looks plus 90 original language/palette/motion combinations give 102 entries. The style library is paged four cards at a time, with Persian/English filters. These are authored combinations, not 102 separately verified AE renders. Existing font fallbacks are used; no proprietary font files are added.
- Per-word scene editing is easier to reach, and its appearance, spacing, motion and background controls use one category at a time. Existing per-word fonts/backgrounds/motions remain the native implementation, with preservation verified in the browser fixture.
- Typing now awaits apply before preview. It clears competing kinetic/template/word engines; those could previously take precedence over the typewriter. Preview uses the AE composition. Selected native AE text is handled directly rather than starting a caption frame renderer without a caption.
- Material shortcuts expose native glass, solid color, background motion and Cosmic + glass. Combined mode reads the actual installed effect schema before changing state; an unavailable effect leaves material settings untouched. This exposes the existing native layered material implementation; it does not certify that a CSS swatch matches AE optics.

## Entry audio

Four original procedural PCM cues (Soft, Pop, Air and Chime) are included, with on/off, level and sample audition. Typing clicks remain independent. Text can use a cue once per caption or per word (maximum 64). Word-motion timing takes precedence when available, then speech timing; absent timings use an explicitly approximate uniform distribution. Table text uses one cue per visible cell.

Final output, including marker-caption output, creates bounded audio layers linked to their owner. Refresh replaces owned cues even after build metadata is appended; disabling removes them. Caption replacement includes its cues while preserving table audio. Automatic visual previews stay silent. The four cues are included in Core installations too. They contain no third-party recordings or voices; see `assets/sfx/entry66/README.md` and the reproducible Python generator.

## Reversible offline sentence grouping

The independent switch sits beside the text editor and indicates its active state. It splits timed, unmodified groups on punctuation, pauses or a word cap. Manual/overridden groups are preserved. It does not rewrite vocabulary, infer missing punctuation or perform neural grammar correction. English abbreviation/initial heuristics are included.

Original and processed branches preserve words, timings and styles. Turning off restores the original branch and retains processed-branch edits. Re-enabling restores that edited branch; if the original changed while disabled, explicit rebuild is required. Undo/Redo snapshots include the branch; transcript replacement/reset clears it. Branch state belongs to the project brain, not global settings.

## Resource review

GitHub repository metadata was queried on 2026-11-08:

| Resource | Declared repository license | Decision |
| --- | --- | --- |
| https://github.com/Tessmore/sbd | MIT | English boundary reference; not a Persian grammar engine. No code copied. |
| https://github.com/winkjs/wink-nlp | MIT | Framework reference; language/model coverage needs separate evaluation. No dependency added. |
| https://github.com/Dadmatech/DadmaTools | Apache-2.0 | Persian candidate; model/checkpoint/data licensing and packaging remain to be evaluated. No model bundled. |

This is metadata review, not a full model/source audit or a language-quality benchmark. Existing Lucide/Fuse/font/curve packages are retained. The new grouping and sound generation are original code and run locally without runtime network calls.

## Validation and release boundary

- `sentence66_core.cjs`: boundaries, pauses, preservation, edited branches, stale-source guard/rollback and 102 unique preset payloads.
- `entry66_host.cjs`: PCM assets, word/reverse-motion timing, levels, bounded durations, ownership, replacement, invalid-preset preservation, silent previews and table output cues.
- `table47_host.cjs`: actual host code against the modeled AE API, including font inheritance, shared surface, divider geometry, entry/exit keys and invalid-setting preservation.
- `workbench66_browser.cjs`: real controls, sentence edit/off/on/Undo, fonts, motion bundle, typing precedence, entry audio, atomic material setup and English labels.
- `table66_pages_browser.cjs`: every table stage/page at 900×700, 700×620 and 760×520 with the preview visible and controls in the workspace.
- `table47_browser.cjs`: aspect ratio, drag/resize payload, queued/coalesced live calls, clear cancellation and failure stop.
- `production47_browser.cjs` and `production50_browser.cjs`: correction review, navigation, responsive layout, original-text preservation, independent word presets and existing frame/material/theme workflows.
- Existing RC24/RC39/RC40/RC43/RC45/RC47/Liquid48 host tests and offline spelling checks cover related regressions.

Host revision and CEP revision checks both use `rc47.8-workbench66`, so a previously loaded host is refreshed. The embedded kinetic source is synchronized. Package hashes must be regenerated after source changes.

Actual After Effects execution, installed font rendering, optical parity, Windows installation and audible mix quality remain unverified on this Linux machine. Modeled host tests and Chromium do not replace native visual/audio QA. No complete installable Workbench66 ZIP is being represented as validated. Remaining work is listed in TODO_WORKBENCH66.md.
