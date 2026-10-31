# Adding aescripts licensing to Orb Reactor

Files in this folder mirror the paths in your `orb-panel/` project. Copy them over yours.

| File | Change |
|---|---|
| `CSXS/manifest.xml` | CSXS runtime 9.0 -> **11.0**, added `--v=0` (`--enable-nodejs` / `--mixed-context` were already there) |
| `client/js/license.js` | **New.** Loads the framework with `require()`, exposes `window.OrbLicense` |
| `client/index.html` | Loads `license.js` before `app.js`; adds a "License" block in Settings |
| `client/js/app.js` | Export button is gated by `OrbLicense.requireLicense()`; Settings hooks |
| `package.json` | **New.** Needed so the aescripts installer can find your project root |
| `scripts/copy-license.js` | **New.** Copies the configured bundle into `client/lib/` |

## Steps

1. Get GitHub access (username on your author profile, then ask via your product submission).
2. In the `orb-panel/` folder, run the official command, as ONE command:

   ```
   yarn add git+https://github.com/aescripts/aescripts-CEP-licensing-framework \
       --productName="Orb Reactor" \
       --sku="DKMORRE" \
       --privNum="96255608" \
       --licenseType="licensed" \
       --offerTrial=true \
       --url="https://aescripts.com/orb-reactor/" \
       --trialDays=10
   ```
   (`--trialDays` was not in your command; set it to your intended trial length.)
3. `node scripts/copy-license.js` -> creates `client/lib/aesp.umd.js`
   (it refuses to copy if the product parameters were not applied).
4. Restart After Effects, open the panel, and test. Generate a test license at
   https://author.aescripts.com/timed-beta-license/create

## Before you ship

- Rename `client/lib/aesp.umd.js` to something unremarkable and update
  `FRAMEWORK_REL_PATH` in `license.js` to match; obfuscate `license.js`.
- Keep `node_modules/`, `.env`, `.debug` and `package.json` OUT of the ZXP.
- Keep `PRODUCT_VERSION` in `license.js` equal to the manifest version.
- Sign the ZXP, then zip it with a PDF of install instructions: `orb_reactor_v1.0.zip`.

## Behavior

- Valid license or active trial -> export works. Expired/invalid -> the license dialog opens.
- Preview and controls stay free; only export is gated (change in `app.js` if you want otherwise).
- If the framework can't load, export stays locked and the reason is shown (fails closed).
