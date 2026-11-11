# Varna social-guide assets

Two bitmap assets were made with the built-in image generation tool and copied into this project:

- `assets/safe-guides/varna-social-cover.png` — portrait sample and default profile artwork.
- `assets/safe-guides/varna-social-wide.png` — landscape sample; the complete V is preserved in frame.

The project uses these assets in editable SVG platform guides. The PNG examples and small previews in the same directory are rasterizations of that SVG renderer. The safe-zone geometry is computed from the selected preset and manual margins, not inferred from the generated artwork. `catalog.json` lists 14 platform layouts and 28 PNG examples.

## Portrait prompt

Use case: ads-marketing. Project asset: a reusable Varna Studio social media profile photo and sample video cover, for a safe-zone guide in an After Effects plugin. Create one clean portrait 9:16 image, frontal cinematic photograph of a sophisticated translucent liquid-glass V sculpture in a dark navy creative studio, subtle cyan and violet reflections, realistic soft lighting, premium technology brand mood. Keep sculpture fully in central 55% width and central 55% height so editable social network chrome can be composited around it later. No social-media UI, no text, no phone frame, no watermark, no extraneous logos. This image will be used as sample content in multiple editable Instagram, TikTok and YouTube interface guides for a Varna page.

## Landscape edit prompt

Use case: compositing. Project asset for Varna Studio safe-zone social-media guide, landscape YouTube and TV sample cover. Change the canvas to a wide 16:9 cinematic landscape composition by expanding the dark navy creative studio background. Preserve the same complete translucent cyan/violet liquid glass V sculpture, with unchanged identity, realistic highlights and soft reflection. Reframe so the entire sculpture sits in the center and is roughly 55% of image height and 27% of image width, with broad uncluttered dark space on both sides for editable social-media interface controls. Keep the entire V and its reflection visible; do not crop its top or bottom. No text, no UI, no phone, no new objects, no logos, no watermark.

Interface inspiration supplied by the user: [Guideify for Premiere Pro](https://dodashviliguga.gumroad.com/l/guideify). This package contains Varna's own renderer rather than Guideify binaries.
