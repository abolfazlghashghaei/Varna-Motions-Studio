# 4.5 RC44

Based on the supplied complete RC43 package. All host modules, CEP boot/bridge and bundled assets are byte-identical to RC43.

- Gear menu: Auto + Compact / Standard / Large / Extra Large. Independent spacing uses the existing density preference. Viewport-aware Auto; preferences persist locally. Display changes do not transform the document, preview geometry or exported captions.
- Fixed, scrollable settings popover, bounded to the CEP viewport; outside click and Escape dismissal.
- Keyword master switch: non-destructive, persisted and undoable. Off prevents suggestion scheduling/model work, rejects in-flight results, removes emphasis from serialized preview/export data and updates the panel previews. Existing layers update only by explicit action.
- Explicit update action reuses the existing refreshCaptionStyles API for all current captions, with style and motion refresh. Full-template colors and independent all-word color animation remain separate features.
- Native disabled fieldsets for dependent stroke/glow, stacking, kashida, type sound and gradient settings. Manual suggestion provider disables the automatic-suggestion control while retaining its saved preference.
- Matching SVG icons in navigation, search, section titles and new launcher cards.
- Existing RC43 native host contract/revision remains unchanged intentionally. The UI/package identifies as RC44.
