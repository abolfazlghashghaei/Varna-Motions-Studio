/**
 * Orb Reactor - aescripts licensing bootstrap.
 *
 * Loads the aescripts CEP licensing framework (UMD build) through Node's
 * require() - NOT a <script> tag, as aescripts recommends - starts it, and
 * exposes a tiny API to the rest of the panel as window.OrbLicense.
 *
 * Fails CLOSED: if the framework is missing or throws, exports stay locked.
 */
(function (global) {
  'use strict';

  // Keep in sync with ExtensionBundleVersion in CSXS/manifest.xml.
  var PRODUCT_VERSION = '1.0.0';

  // Path of the framework bundle, relative to <extension>/client/.
  // Rename this file (and this string) to something unremarkable before
  // shipping - see LICENSING.md.
  var FRAMEWORK_REL_PATH = ['lib', 'aesp.umd.js'];

  // Orbs available during the trial. Everything else needs a license.
  // Names come from OrbPresets.styleNames in presets.js.
  var FREE_STYLES = ['siri', 'voiceWave', 'particleRibbon', 'particlesOrb', 'blueDrop', 'violetEmber'];

  var status = { checked: false, valid: false, trial: false, type: 'none', error: null };
  var listeners = [];
  var aesp = null;
  var cs = null;

  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](status); } catch (e) { console.error(e); }
    }
  }

  // Called by the framework on startup, on activate/deactivate, and on beta expiry.
  function onLicenseCheck(isValidLicense, isTrial, licenseType) {
    status.checked = true;
    status.valid = !!isValidLicense;
    status.trial = !!isTrial;
    status.type = licenseType || 'none';
    status.error = null;
    emit();
  }

  function init() {
    try {
      cs = new CSInterface();
      var path = require('path');
      var root = cs.getSystemPath(SystemPath.EXTENSION);
      var mod = require(path.join.apply(path, [root, 'client'].concat(FRAMEWORK_REL_PATH)));
      var AESP = (mod && mod.default) ? mod.default : mod;

      aesp = new AESP({
        productVersion: PRODUCT_VERSION,
        aboutText:
          'Orb Reactor \u00b7 v' + PRODUCT_VERSION + '\n\n' +
          '[Product page](https://aescripts.com/orb-reactor/)',
        helpCallback: function () {
          cs.openURLInDefaultBrowser('https://aescripts.com/orb-reactor/');
        }
      }, onLicenseCheck);
    } catch (e) {
      status.checked = true;
      status.valid = false;
      status.error = (e && e.message) ? e.message : String(e);
      console.error('[OrbLicense] init failed:', e);
      emit();
    }
  }

  function describe(st) {
    st = st || status;
    if (st.error) return 'Licensing unavailable: ' + st.error;
    if (!st.checked) return 'Checking license\u2026';
    if (!st.valid) return st.trial ? 'Trial expired. Open License & Support to activate.' : 'No valid license.';
    if (st.trial) return 'Trial active.';
    return 'Licensed (' + st.type + ').';
  }

  // Small in-panel message (independent of the framework's status bar).
  function toast(msg, withButton) {
    try {
      var old = document.getElementById('orbLicToast');
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var box = document.createElement('div');
      box.id = 'orbLicToast';
      box.className = 'lic-toast';
      var span = document.createElement('span');
      span.textContent = msg;
      box.appendChild(span);
      if (withButton) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = 'Activate license';
        b.addEventListener('click', function () {
          api.openDialog('license');
          if (box.parentNode) box.parentNode.removeChild(box);
        });
        box.appendChild(b);
      }
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'lic-toast-x';
      x.textContent = '\u00d7';
      x.addEventListener('click', function () { if (box.parentNode) box.parentNode.removeChild(box); });
      box.appendChild(x);
      document.body.appendChild(box);
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 7000);
    } catch (e) { console.error(e); }
  }

  var api = {
    /** Latest status snapshot (read-only use). */
    getStatus: function () { return status; },

    /** True only for a real (non-trial) license. Unlocks trial-restricted features. */
    isFull: function () { return status.checked && status.valid && !status.trial; },

    /** Is this orb usable right now? Free orbs always; the rest need a full license. */
    isStyleFree: function (name) { return api.isFull() || FREE_STYLES.indexOf(name) !== -1; },

    /** Tell the user a feature is locked in trial mode. */
    notifyLocked: function (featureName) {
      if (!status.checked) return;
      if (status.error) { toast('Licensing unavailable: ' + status.error, false); return; }
      toast(featureName + ' is locked in trial mode. Activate a license to unlock it.', true);
    },

    /** True when a license or an active trial is present. */
    isAllowed: function () { return status.checked && status.valid; },

    /**
     * Gate for protected actions. Returns true if allowed; otherwise tells the
     * user why and (when appropriate) opens the license dialog, returns false.
     */
    requireLicense: function () {
      if (api.isAllowed()) return true;
      if (!status.checked) {
        alert('Still checking your license - try again in a moment.');
      } else if (status.error) {
        alert('Orb Reactor could not start its licensing module.\n\n' + status.error);
      } else {
        api.openDialog('license');
      }
      return false;
    },

    openDialog: function (page, subpage) {
      if (aesp) { try { aesp.openDialogOnPage(page || 'license', subpage); } catch (e) { console.error(e); } }
    },

    /** Subscribe to status changes; fires immediately if already checked. */
    onChange: function (fn) {
      listeners.push(fn);
      if (status.checked) { try { fn(status); } catch (e) { console.error(e); } }
    },

    describe: describe
  };

  global.OrbLicense = api;
  init();
})(window);
