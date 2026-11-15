# UI81 — Background motion and private user libraries

Scope: After Effects background-motion workspace, continuous caption surfaces,
original native presets, and adapters for the user's uploaded assets. Existing
text editor, 899 static IDs, numeric controls, themes and V remain intact.

## Background engine

- An ES3 shared core owns 24 motion families × six timing/strength profiles
  (144 useful presets), configurable duration/delay/strength/loop and up to 500
  locally saved presets. Browser animation is a motion reference, not AE glass.
- Existing `bg.motionDur/outDur/motionDelay` remain the timing source;
  `bg.motion81` stores preset/strength/loop. Legacy presets retain their renderer.
- `reflow67` keeps geometric size interpolation and constant corner radius.
  Opening/closing is applied once at the first/last caption of each connected
  run. The surface is exactly zero at its boundaries, with short-span clamping.
- Enabling continuous surfaces freezes only the effective rendered text
  animation. Stored text motion remains unchanged and returns when disabled.
  Refresh explicitly resets old source expressions, animators and transform keys.
- Fast preview keeps its limited caption roots and sends the complete shared
  geometry context separately, so run endpoints match output. Bounds measurements
  are cached by composition geometry and static text/style/safe-area inputs.
- Canonical ES3 host adapters are embedded into `ghaf_host.jsx`; byte-equality
  checks prevent the separately loaded and embedded implementations diverging.

## UI

Background keeps its existing navigation destination. One internal row separates
Appearance and Animation. Existing control nodes move into the animation panel;
scope is shared, primary preview remains sticky, settings are grouped. The one
motion-reference canvas stops when hidden, reduced-motion or user-disabled.

## Uploaded assets

Seven archives were safely inventoried/extracted without executing scripts:
25 hook titles, Highlighter 2, 100 lower thirds, 20 SaaS gradients, Instagram UI
100, 100 hooks, and ATools 2.106 (manifest ID `com.amanow.tools`). The last is
AmanowTools 2.106; it must not create a second installation under another name.

Prefer original native functionality. Exact AEP designs use a private local
library: import once, enumerate compositions, preview the actual AE frame and
place a duplicate with editable text. Lower thirds use the supplied 100 posters
and clips. Compiled Highlighter and Amanow host code are not decompiled or
license-patched; their original UI is connected only through explicit actions.

Original third-party assets stay outside the public source tree under
`/workspace/library-files/ui81-private`. The private Windows package ships the audited library under the installed
plugin's assets/user-library81 directory. A separate explicit action stages,
checks and registers the unchanged Amanow CEP bundle, retaining an existing
installation. The alternate local Varna library directory remains supported. Public distribution of these originals is not authorized by the UI80
publication approval. Native code and catalog metadata are separate.

## Gates and limitations

Real-browser interactions, model-based host expressions, endpoints, cache,
transactions, original control identity, preview/export parity of shared math,
asset path validation and package integrity are automated. Actual AE rendering,
compiled vendor UI compatibility, installed fonts and Windows installation
require a real AE/Windows machine; they are never reported as executed here.

Five uploads exceed the transfer tool's 32 MiB limit: Neon DJ Subtitle,
Light Leaks, Paper Burn, Holographic Foil, and AmanowTools_2.106. Their actual
contents cannot be claimed as inspected or installed. A split upload is needed.
