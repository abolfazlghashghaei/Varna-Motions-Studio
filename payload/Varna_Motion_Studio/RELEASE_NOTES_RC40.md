# Varna Motion Studio 4.5.0-rc.40

Adds an editable phrase scene: independent positions, zigzag/stairs/alignment/free layouts, cumulative or single-phrase holds, phrase entry/type, local color/scale/rotation, drag/keyboard placement, area/safe-zone bounds, mixed-caption range merge, normalized timing and one-step undo. Preview and ExtendScript share the ES3 geometry/timing implementation. The host builds one editable text layer per phrase in an owned precomp, a shared transform handle, and outer time-remap for duration changes.

Keywords, MOGRTs, kinetic typography and music have independent pages. MOGRTs default to full original projects; legacy implicit accent overrides no longer flatten separate color roles. Optional accent replacement requires explicit named control bindings and retains RGBA alpha. The template page has its own apply scope. Existing native/template/scene output can be replaced through a staged renderer conversion; failed staging retains the old block.

Bundled template assets and other RC39 assets are retained. Host bridge revision rc40.1 invalidates cached output signatures after the renderer change. Color correction remains removed.

Validation details are in TEST_REPORT_RC40.md. Adobe runtime validation remains separate from the automated Linux host-model and Chromium checks.
