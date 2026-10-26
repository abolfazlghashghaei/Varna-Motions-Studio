/**
 * Railcut - ExtendScript Backend
 *
 * This file runs in After Effects' ExtendScript environment (ES3).
 * It provides functions callable from the CEP panel via CSInterface.evalScript()
 *
 * IMPORTANT: This is ES3 JavaScript (1999). No const, let, arrow functions,
 * template literals, or modern array methods.
 */

// ============================================
// JSON Polyfill (ExtendScript has no native JSON)
// ============================================

if (typeof JSON === "undefined") {
    JSON = {};
}

// Always install our polyfill — AE's native JSON.stringify can produce garbled
// output in some versions/configurations (e.g. empty keys and values when the
// extension path contains non-ASCII characters). Overwrite unconditionally.
// This implementation properly escapes Unicode characters in strings.
(function() {
    var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var meta = {'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};

    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string)
            ? '"' + string.replace(escapable, function(a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"'
            : '"' + string + '"';
    }

    function str(key, holder) {
        var value = holder[key];
        var type = typeof value;
        if (type === 'string') return quote(value);
        if (type === 'number') return isFinite(value) ? String(value) : 'null';
        if (type === 'boolean' || value === null) return String(value);
        if (type === 'object') {
            if (!value) return 'null';
            var partial = [];
            if (value instanceof Array) {
                for (var i = 0; i < value.length; i++) {
                    partial.push(str(i, value) || 'null');
                }
                return '[' + partial.join(',') + ']';
            }
            for (var k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    var v = str(k, value);
                    if (v) partial.push(quote(k) + ':' + v);
                }
            }
            return '{' + partial.join(',') + '}';
        }
        return undefined;
    }

    JSON.stringify = function(value) {
        return str('', {'': value});
    };

    // Recursive-descent JSON parser (adapted from Crockford's json2.js).
    // The eval-based parser would execute arbitrary JS hidden inside layer
    // comments / XMP packets / project metadata of an opened .aep file —
    // i.e. opening a tampered project could RCE the panel. This parser
    // treats input strictly as data.
    var at, ch, text;
    var escapee = { '"':'"', '\\':'\\', '/':'/', b:'\b', f:'\f', n:'\n', r:'\r', t:'\t' };
    function pError(m) { throw new SyntaxError('JSON.parse: ' + m + ' at ' + at); }
    function pNext(c) {
        if (c && c !== ch) pError("expected '" + c + "' got '" + ch + "'");
        ch = text.charAt(at);
        at += 1;
        return ch;
    }
    function pWhite() { while (ch && ch <= ' ') pNext(); }
    function pNumber() {
        var s = '';
        if (ch === '-') { s = '-'; pNext('-'); }
        while (ch >= '0' && ch <= '9') { s += ch; pNext(); }
        if (ch === '.') {
            s += '.';
            while (pNext() && ch >= '0' && ch <= '9') s += ch;
        }
        if (ch === 'e' || ch === 'E') {
            s += ch; pNext();
            if (ch === '-' || ch === '+') { s += ch; pNext(); }
            while (ch >= '0' && ch <= '9') { s += ch; pNext(); }
        }
        var n = +s;
        if (!isFinite(n)) pError('bad number');
        return n;
    }
    function pString() {
        var s = '', hex, i, u;
        if (ch === '"') {
            while (pNext()) {
                if (ch === '"') { pNext(); return s; }
                if (ch === '\\') {
                    pNext();
                    if (ch === 'u') {
                        u = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(pNext(), 16);
                            if (!isFinite(hex)) break;
                            u = u * 16 + hex;
                        }
                        s += String.fromCharCode(u);
                    } else if (typeof escapee[ch] === 'string') {
                        s += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    s += ch;
                }
            }
        }
        pError('bad string');
    }
    function pWord() {
        if (ch === 't') { pNext('t'); pNext('r'); pNext('u'); pNext('e'); return true; }
        if (ch === 'f') { pNext('f'); pNext('a'); pNext('l'); pNext('s'); pNext('e'); return false; }
        if (ch === 'n') { pNext('n'); pNext('u'); pNext('l'); pNext('l'); return null; }
        pError("unexpected '" + ch + "'");
    }
    function pArray() {
        var a = [];
        if (ch === '[') {
            pNext('['); pWhite();
            if (ch === ']') { pNext(']'); return a; }
            while (ch) {
                a.push(pValue()); pWhite();
                if (ch === ']') { pNext(']'); return a; }
                pNext(','); pWhite();
            }
        }
        pError('bad array');
    }
    function pObject() {
        var key, o = {};
        if (ch === '{') {
            pNext('{'); pWhite();
            if (ch === '}') { pNext('}'); return o; }
            while (ch) {
                key = pString(); pWhite();
                pNext(':');
                o[key] = pValue(); pWhite();
                if (ch === '}') { pNext('}'); return o; }
                pNext(','); pWhite();
            }
        }
        pError('bad object');
    }
    function pValue() {
        pWhite();
        if (ch === '{') return pObject();
        if (ch === '[') return pArray();
        if (ch === '"') return pString();
        if (ch === '-') return pNumber();
        return (ch >= '0' && ch <= '9') ? pNumber() : pWord();
    }

    JSON.parse = function(source) {
        text = String(source);
        at = 0;
        ch = ' ';
        var result = pValue();
        pWhite();
        if (ch) pError('trailing garbage');
        return result;
    };
})();

// ============================================
// Helper Functions
// ============================================

/**
 * Get the source type string for a layer
 * @param {Layer} layer - An AE layer
 * @returns {string} - Source type identifier
 */
function getLayerSourceType(layer) {
    // Use multiple detection methods for reliability across AE versions

    // 1. Check instanceof first (most reliable for special layer types)
    // TextLayer and ShapeLayer are subclasses with specific behaviors
    try {
        if (layer instanceof TextLayer) return "text";
    } catch (e) {}

    try {
        if (layer instanceof ShapeLayer) return "shape";
    } catch (e) {}

    try {
        if (layer instanceof CameraLayer) return "camera";
    } catch (e) {}

    try {
        if (layer instanceof LightLayer) return "light";
    } catch (e) {}

    // 2. Check boolean properties (for AVLayer subtypes)
    // Adjustment layer check - works on any AVLayer with adjustmentLayer=true
    try {
        if (layer.adjustmentLayer === true) return "adjustment";
    } catch (e) {}

    // Null layer check
    try {
        if (layer.nullLayer === true) return "null";
    } catch (e) {}

    // 3. Check matchName as backup
    var matchName = layer.matchName;
    if (matchName === "ADBE Camera Layer") return "camera";
    if (matchName === "ADBE Light Layer") return "light";
    if (matchName === "ADBE Text Layer") return "text";
    if (matchName === "ADBE Vector Layer") return "shape";

    // 4. Check if it's an AV layer
    if (!(layer instanceof AVLayer)) {
        return "null";
    }

    // 5. Check for null object (null objects have no source)
    if (layer.nullLayer) return "null";

    // Check source type
    var source = layer.source;
    if (!source) return "null";

    if (source instanceof CompItem) return "precomp";

    if (source instanceof FootageItem) {
        var mainSource = source.mainSource;
        if (mainSource instanceof SolidSource) return "solid";
        if (mainSource instanceof PlaceholderSource) return "footage";
        // Distinguish still images from video footage
        if (mainSource.isStill) return "still";
        return "footage";
    }

    return "footage";
}

/**
 * Check if a layer is a full-frame clip (covers the comp dimensions)
 * @param {Layer} layer - An AE layer
 * @param {CompItem} comp - The containing composition
 * @returns {boolean}
 */
/**
 * Create a result object for operations
 * @param {boolean} success
 * @param {string} [error]
 * @returns {string} JSON string
 */
function makeResult(success, error) {
    var result = { success: success };
    if (error) {
        result.error = error;
    }
    return JSON.stringify(result);
}

/**
 * Snap a time value to the nearest whole frame boundary
 * This prevents sub-frame edit points and ensures clean cuts
 * @param {number} time - Time in seconds
 * @param {number} frameRate - Composition frame rate
 * @returns {number} Time snapped to nearest frame
 */
function snapToFrame(time, frameRate) {
    return Math.round(time * frameRate) / frameRate;
}

/**
 * Last known comp ID — used as fallback when activeItem is null
 * (happens when a CEP panel has focus instead of a comp viewer).
 */
var _lastCompId = 0;
var _viewerActivationAttempts = 0;

/**
 * Temporary pin: when set (> 0), getActiveComp() uses _lastCompId instead of
 * app.project.activeItem.  This prevents drag-and-drop from the Project Panel
 * from hijacking the active comp (AE sets activeItem to the dragged item).
 * The pin expires after a short window so normal comp-switching still works.
 */
var _compPinExpiry = 0;
/**
 * Viewer verification state: when activeItem returns a comp that isn't in
 * the viewer (Project panel selection), we reject it and cache the ID + time
 * so we don't call viewer.setActive() on every poll (it steals focus).
 * The rejection expires after REJECTION_EXPIRY_MS so genuine comp opens
 * (double-click) are detected on the next poll after expiry.
 */
var _rejectedCompId = 0;
var _rejectedCompTime = 0;
var REJECTION_EXPIRY_MS = 3000;

/**
 * Get the active composition, or null if none.
 * On the very first call, uses viewer.setActive() to ensure activeItem
 * returns the comp displayed in the viewer (not the Project panel selection).
 * When activeItem changes to a different comp, verifies via viewer.setActive()
 * that the comp is actually open in a viewer (not just selected in the
 * Project panel). Rejected selections are cached to avoid repeated focus theft.
 * @returns {CompItem|null}
 */
function getActiveComp() {
    // Viewer activation: call viewer.setActive() to ensure activeItem reflects
    // the comp displayed in the viewer (not the Project panel selection).
    // We retry this whenever we haven't found a comp yet (_lastCompId === 0),
    // because the first attempt may fail if the script loads before a viewer
    // exists (e.g. Unicode path fallback loading). Once a comp is detected,
    // we stop retrying to avoid stealing focus from the CEP panel.
    // Cap retries at 10 and only attempt when a project with comps exists.
    if (_lastCompId === 0 && _viewerActivationAttempts < 10) {
        _viewerActivationAttempts++;
        try {
            if (app.project && app.project.numItems > 0) {
                var viewer = app.activeViewer;
                if (viewer) {
                    viewer.setActive();
                }
            }
        } catch (e) { /* viewer may not exist yet */ }
    }

    // While pinned, skip activeItem check (it may point to a dragged project item)
    var now = new Date().getTime();
    var pinned = _compPinExpiry > 0 && now < _compPinExpiry;
    if (pinned && _lastCompId > 0) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.id === _lastCompId) return item;
        }
    }
    // Clear expired pin
    if (_compPinExpiry > 0 && !pinned) {
        _compPinExpiry = 0;
    }

    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        // Same comp as before — no verification needed
        if (comp.id === _lastCompId) {
            _rejectedCompId = 0;
            return comp;
        }

        // Different comp detected. Verify it's actually open in a viewer,
        // not just selected in the Project panel.
        // Skip verification if we already rejected this comp recently.
        if (comp.id === _rejectedCompId && (now - _rejectedCompTime) < REJECTION_EXPIRY_MS) {
            // Still rejected — fall through to _lastCompId fallback
        } else {
            // Verify: viewer.setActive() makes activeItem reflect the viewer's comp.
            // If the viewer shows a different comp than what activeItem reported,
            // the user just clicked in the Project panel.
            try {
                var viewer = app.activeViewer;
                if (viewer) {
                    viewer.setActive();
                    var verified = app.project.activeItem;
                    if (verified && verified instanceof CompItem) {
                        _lastCompId = verified.id;
                        if (verified.id !== comp.id) {
                            // Viewer shows the old comp — reject the Project panel selection
                            _rejectedCompId = comp.id;
                            _rejectedCompTime = now;
                        } else {
                            // Viewer confirms the new comp — genuine comp switch
                            _rejectedCompId = 0;
                        }
                        return verified;
                    }
                }
            } catch (e) { /* fall through */ }
            // viewer.setActive() failed — reject this comp to be safe
            _rejectedCompId = comp.id;
            _rejectedCompTime = now;
        }
    }
    // Fallback: try last known comp by ID
    if (_lastCompId > 0) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.id === _lastCompId) return item;
        }
    }
    return null;
}

/**
 * Get a layer by index from the active comp with standard validation.
 * @param {CompItem} comp
 * @param {number} layerIndex
 * @param {boolean} [checkLocked=false]
 * @returns {{layer: AVLayer}|{error: string}}
 */
function getLayerChecked(comp, layerIndex, checkLocked) {
    var layer = comp.layer(layerIndex);
    if (!layer) return { error: "Layer not found: " + layerIndex };
    if (checkLocked && layer.locked) return { error: "Layer is locked" };
    return { layer: layer };
}

/**
 * Check if a value exists in an array (ES3-compatible indexOf replacement).
 * @param {Array} arr
 * @param {*} val
 * @returns {boolean}
 */
function isInArray(arr, val) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === val) return true;
    }
    return false;
}

/**
 * Get the Audio Levels property for a layer with standard validation.
 * @param {number} layerIndex - 1-based AE layer index
 * @returns {{comp: CompItem, layer: AVLayer, audioLevels: Property}|{error: string}}
 */
function getAudioLevelsProperty(layerIndex) {
    var comp = getActiveComp();
    if (!comp) return { error: "No active composition" };
    var layer = comp.layer(layerIndex);
    if (!layer || !layer.hasAudio) return { error: "Layer " + layerIndex + " has no audio" };
    var audioLevels = layer.property("ADBE Audio Group").property("ADBE Audio Levels");
    if (!audioLevels) return { error: "Cannot access audio levels property" };
    return { comp: comp, layer: layer, audioLevels: audioLevels };
}

/**
 * Get the Opacity property for a given layer.
 * Returns {comp, layer, opacity} or {error}.
 * @param {number} layerIndex - 1-based AE layer index
 */
function getOpacityProperty(layerIndex) {
    var comp = getActiveComp();
    if (!comp) return { error: "No active composition" };
    var layer = comp.layer(layerIndex);
    if (!layer) return { error: "Layer " + layerIndex + " not found" };
    var transformGroup = layer.property("ADBE Transform Group");
    if (!transformGroup) return { error: "Layer " + layerIndex + " has no transform group" };
    var opacity = transformGroup.property("ADBE Opacity");
    if (!opacity) return { error: "Cannot access opacity property" };
    return { comp: comp, layer: layer, opacity: opacity };
}

/**
 * Clone a MarkerValue with optional overrides for comment, duration, and label.
 * @param {MarkerValue} original - The marker value to clone
 * @param {object} overrides - Optional overrides: {comment, duration, label}
 * @returns {MarkerValue}
 */
function cloneMarkerValue(original, overrides) {
    var mv = new MarkerValue(overrides.comment !== undefined ? overrides.comment : original.comment);
    mv.duration = overrides.duration !== undefined ? overrides.duration : original.duration;
    mv.chapter = original.chapter;
    mv.url = original.url;
    mv.frameTarget = original.frameTarget;
    mv.cuePointName = original.cuePointName;
    if (original.eventCuePoint !== undefined) mv.eventCuePoint = original.eventCuePoint;
    if (original.protectedRegion !== undefined) mv.protectedRegion = original.protectedRegion;
    mv.label = overrides.label !== undefined ? overrides.label : original.label;
    return mv;
}

/**
 * Check if a layer can participate in overwrite and other edit operations.
 * All layers in a comp display on the Railcut timeline, so all are editable.
 * @param {Layer} layer - An AE layer
 * @returns {boolean}
 */
function isEditableLayer(layer) {
    return true;
}

/**
 * Map between BlendingMode enum values and stable string keys.
 * The TS side identifies modes by these keys (e.g. "MULTIPLY", "OVERLAY") so
 * the API surface doesn't depend on the enum's underlying numeric values.
 *
 * Keys are restricted to those that are reliably available across AE versions
 * we support; any unrecognized mode falls through to "NORMAL" / null.
 */
function blendingModeFromKey(key) {
    switch (key) {
        case "NORMAL": return BlendingMode.NORMAL;
        case "DISSOLVE": return BlendingMode.DISSOLVE;
        case "DANCING_DISSOLVE": return BlendingMode.DANCING_DISSOLVE;
        case "DARKEN": return BlendingMode.DARKEN;
        case "MULTIPLY": return BlendingMode.MULTIPLY;
        case "COLOR_BURN": return BlendingMode.COLOR_BURN;
        case "CLASSIC_COLOR_BURN": return BlendingMode.CLASSIC_COLOR_BURN;
        case "LINEAR_BURN": return BlendingMode.LINEAR_BURN;
        case "DARKER_COLOR": return BlendingMode.DARKER_COLOR;
        case "ADD": return BlendingMode.ADD;
        case "LIGHTEN": return BlendingMode.LIGHTEN;
        case "SCREEN": return BlendingMode.SCREEN;
        case "COLOR_DODGE": return BlendingMode.COLOR_DODGE;
        case "CLASSIC_COLOR_DODGE": return BlendingMode.CLASSIC_COLOR_DODGE;
        case "LINEAR_DODGE": return BlendingMode.LINEAR_DODGE;
        case "LIGHTER_COLOR": return BlendingMode.LIGHTER_COLOR;
        case "OVERLAY": return BlendingMode.OVERLAY;
        case "SOFT_LIGHT": return BlendingMode.SOFT_LIGHT;
        case "HARD_LIGHT": return BlendingMode.HARD_LIGHT;
        case "LINEAR_LIGHT": return BlendingMode.LINEAR_LIGHT;
        case "VIVID_LIGHT": return BlendingMode.VIVID_LIGHT;
        case "PIN_LIGHT": return BlendingMode.PIN_LIGHT;
        case "HARD_MIX": return BlendingMode.HARD_MIX;
        case "DIFFERENCE": return BlendingMode.DIFFERENCE;
        case "CLASSIC_DIFFERENCE": return BlendingMode.CLASSIC_DIFFERENCE;
        case "EXCLUSION": return BlendingMode.EXCLUSION;
        case "SUBTRACT": return BlendingMode.SUBTRACT;
        case "DIVIDE": return BlendingMode.DIVIDE;
        case "HUE": return BlendingMode.HUE;
        case "SATURATION": return BlendingMode.SATURATION;
        case "COLOR": return BlendingMode.COLOR;
        case "LUMINOSITY": return BlendingMode.LUMINOSITY;
        case "STENCIL_ALPHA": return BlendingMode.STENCIL_ALPHA;
        case "STENCIL_LUMA": return BlendingMode.STENCIL_LUMA;
        case "SILHOUETE_ALPHA": return BlendingMode.SILHOUETE_ALPHA;
        case "SILHOUETTE_LUMA": return BlendingMode.SILHOUETTE_LUMA;
        case "ALPHA_ADD": return BlendingMode.ALPHA_ADD;
        case "LUMINESCENT_PREMUL": return BlendingMode.LUMINESCENT_PREMUL;
        default: return null;
    }
}

function blendingModeToKey(mode) {
    if (mode === BlendingMode.NORMAL) return "NORMAL";
    if (mode === BlendingMode.DISSOLVE) return "DISSOLVE";
    if (mode === BlendingMode.DANCING_DISSOLVE) return "DANCING_DISSOLVE";
    if (mode === BlendingMode.DARKEN) return "DARKEN";
    if (mode === BlendingMode.MULTIPLY) return "MULTIPLY";
    if (mode === BlendingMode.COLOR_BURN) return "COLOR_BURN";
    if (mode === BlendingMode.CLASSIC_COLOR_BURN) return "CLASSIC_COLOR_BURN";
    if (mode === BlendingMode.LINEAR_BURN) return "LINEAR_BURN";
    if (mode === BlendingMode.DARKER_COLOR) return "DARKER_COLOR";
    if (mode === BlendingMode.ADD) return "ADD";
    if (mode === BlendingMode.LIGHTEN) return "LIGHTEN";
    if (mode === BlendingMode.SCREEN) return "SCREEN";
    if (mode === BlendingMode.COLOR_DODGE) return "COLOR_DODGE";
    if (mode === BlendingMode.CLASSIC_COLOR_DODGE) return "CLASSIC_COLOR_DODGE";
    if (mode === BlendingMode.LINEAR_DODGE) return "LINEAR_DODGE";
    if (mode === BlendingMode.LIGHTER_COLOR) return "LIGHTER_COLOR";
    if (mode === BlendingMode.OVERLAY) return "OVERLAY";
    if (mode === BlendingMode.SOFT_LIGHT) return "SOFT_LIGHT";
    if (mode === BlendingMode.HARD_LIGHT) return "HARD_LIGHT";
    if (mode === BlendingMode.LINEAR_LIGHT) return "LINEAR_LIGHT";
    if (mode === BlendingMode.VIVID_LIGHT) return "VIVID_LIGHT";
    if (mode === BlendingMode.PIN_LIGHT) return "PIN_LIGHT";
    if (mode === BlendingMode.HARD_MIX) return "HARD_MIX";
    if (mode === BlendingMode.DIFFERENCE) return "DIFFERENCE";
    if (mode === BlendingMode.CLASSIC_DIFFERENCE) return "CLASSIC_DIFFERENCE";
    if (mode === BlendingMode.EXCLUSION) return "EXCLUSION";
    if (mode === BlendingMode.SUBTRACT) return "SUBTRACT";
    if (mode === BlendingMode.DIVIDE) return "DIVIDE";
    if (mode === BlendingMode.HUE) return "HUE";
    if (mode === BlendingMode.SATURATION) return "SATURATION";
    if (mode === BlendingMode.COLOR) return "COLOR";
    if (mode === BlendingMode.LUMINOSITY) return "LUMINOSITY";
    if (mode === BlendingMode.STENCIL_ALPHA) return "STENCIL_ALPHA";
    if (mode === BlendingMode.STENCIL_LUMA) return "STENCIL_LUMA";
    if (mode === BlendingMode.SILHOUETE_ALPHA) return "SILHOUETE_ALPHA";
    if (mode === BlendingMode.SILHOUETTE_LUMA) return "SILHOUETTE_LUMA";
    if (mode === BlendingMode.ALPHA_ADD) return "ALPHA_ADD";
    if (mode === BlendingMode.LUMINESCENT_PREMUL) return "LUMINESCENT_PREMUL";
    return "NORMAL";
}

// ============================================
// Layer Identity — rc_id in layer.comment
// ============================================

/**
 * Generate a UUID v4 (ES3-compatible, Math.random-based).
 * @returns {string} e.g. "550e8400-e29b-41d4-a716-446655440000"
 */
function generateRcId() {
    var hex = "0123456789abcdef";
    var r = "";
    for (var i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
            r += "-";
        } else if (i === 14) {
            r += "4";
        } else if (i === 19) {
            r += hex.charAt((Math.random() * 4 | 0) + 8);
        } else {
            r += hex.charAt(Math.random() * 16 | 0);
        }
    }
    return r;
}

/**
 * Regex to match [RC:<uuid>] tag in layer comments.
 * Full UUIDv4 validation: 8-4-4-4-12 hex characters.
 */
var RC_TAG_RE = /\[RC:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/i;

/**
 * Extract rc_id UUID from a layer comment string.
 * @param {string} comment
 * @returns {string} UUID or empty string
 */
function parseRcId(comment) {
    if (!comment) return "";
    var match = comment.match(RC_TAG_RE);
    return match ? match[1] : "";
}

/**
 * Append or replace [RC:uuid] tag in a comment string.
 * Preserves all other comment content.
 * @param {string} comment - Existing comment (may be empty)
 * @param {string} rcId - UUID to write
 * @returns {string} Updated comment
 */
function appendRcId(comment, rcId) {
    var tag = "[RC:" + rcId + "]";
    if (!comment) return tag;
    // Replace existing tag if present
    if (RC_TAG_RE.test(comment)) {
        return comment.replace(RC_TAG_RE, tag);
    }
    // Append on new line
    return comment + "\n" + tag;
}

/**
 * Remove [RC:uuid] tag (and its preceding newline) from a comment.
 * @param {string} comment
 * @returns {string} Comment without RC tag
 */
function stripRcId(comment) {
    if (!comment) return "";
    // Remove the tag and any preceding newline
    return comment.replace(/\r?\n?\[RC:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\]/i, "");
}

/**
 * Add a [V] or [A] suffix to a layer name for J/L cut identification.
 * Removes any existing [V] or [A] suffix first.
 * @param {string} name - Current layer name
 * @param {string} role - "video" or "audio"
 * @returns {string} Name with suffix
 */
/**
 * Find the linked partner of a layer in a J/L cut pair.
 * Returns the partner layer or null if not linked.
 */
function findLinkedPartner(comp, layer) {
    try {
        var ld = parseLinkData(layer.comment);
        if (!ld || !ld.rc_link) return null;
        for (var i = 1; i <= comp.numLayers; i++) {
            var other = comp.layer(i);
            if (other.index === layer.index) continue;
            try {
                var od = parseLinkData(other.comment);
                if (od && od.rc_link === ld.rc_link) return other;
            } catch (e2) {}
        }
    } catch (e) {}
    return null;
}

function addRoleSuffix(name, role) {
    var cleaned = name.replace(/ \[[VA]\]$/, "");
    return cleaned + (role === "video" ? " [V]" : " [A]");
}

/**
 * Remove [V] or [A] suffix from a layer name (for unlinking).
 * @param {string} name - Current layer name
 * @returns {string} Name without suffix
 */
function removeRoleSuffix(name) {
    return name.replace(/ \[[VA]\]$/, "");
}

/**
 * Orphan a linked layer: clear its rc_link / rc_role JSON from the comment
 * while preserving any [RC:uuid] tag, and strip the [V]/[A] name suffix.
 * Used whenever a layer loses its partner (overwrite deletes it, offset
 * region blade, Alt+blade promotes then unlinks, etc.). After this call
 * the layer is a plain independent clip again.
 *
 * @param {Layer} layer
 */
function orphanLinkedLayer(layer) {
    var rcTag = parseRcId(layer.comment);
    var rcGroup = parseLayerGroup(layer.comment);
    var meta = rcGroup ? JSON.stringify({ rc_group: rcGroup }) : "";
    var newComment = meta;
    if (rcTag) newComment += (newComment ? "\n" : "") + "[RC:" + rcTag + "]";
    layer.comment = newComment;
    layer.name = removeRoleSuffix(layer.name);
}

/**
 * Like orphanLinkedLayer, but assigns a fresh rcId instead of preserving
 * the existing one. Use for layers that came from a recent layer.duplicate()
 * call — AE copies the [RC:] tag verbatim, so without refreshing, the
 * duplicate would share its origin's rcId and trip the dedup pass.
 *
 * @param {Layer} layer
 */
function orphanDuplicatedLayer(layer) {
    var rcGroup = parseLayerGroup(layer.comment);
    var meta = rcGroup ? JSON.stringify({ rc_group: rcGroup }) + "\n" : "";
    layer.comment = meta + "[RC:" + generateRcId() + "]";
    layer.name = removeRoleSuffix(layer.name);
}

/**
 * Like orphanDuplicatedLayer, but preserves the layer's existing linkRole
 * (with a fresh, unique linkId so it has no actual partner). Use this for
 * Alt+blade (and partial-lock blade) "right half" of an A/V split, where the
 * orphan should appear as video-only or audio-only — not a full A/V.
 * getCompData's linkRole override flips hasVideo/hasAudio accordingly so the
 * orphan is excluded from the opposite section's packing.
 *
 * @param {Layer} layer
 */
function orphanDuplicatedLayerKeepRole(layer) {
    var ld = parseLinkData(layer.comment);
    var role = ld && ld.rc_role ? ld.rc_role : null;
    var rcGroup = parseLayerGroup(layer.comment);
    var freshRcId = generateRcId();
    if (role === "video" || role === "audio") {
        var freshLinkId = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 6);
        var meta = { rc_link: freshLinkId, rc_role: role };
        if (rcGroup) meta.rc_group = rcGroup;
        layer.comment = JSON.stringify(meta) + "\n[RC:" + freshRcId + "]";
    } else {
        var groupMeta = rcGroup ? JSON.stringify({ rc_group: rcGroup }) + "\n" : "";
        layer.comment = groupMeta + "[RC:" + freshRcId + "]";
        layer.name = removeRoleSuffix(layer.name);
    }
}

/**
 * Promote a single live A/V layer into a linked pair. The original layer
 * becomes one role (default: video) and a duplicate is created as the other
 * role. Both halves share a new rc_link id; the original preserves its
 * existing [RC:] tag, the duplicate gets a fresh one (or `opts.dupRcId` if
 * provided — must match RC_TAG_RE). Caller must confirm the layer is
 * actually a live A/V before calling (AVLayer with hasVideo && hasAudio &&
 * enabled && audioEnabled, no prior rc_link). Used by overlap resolution,
 * paste pre-split, drop-overlay pre-split, Alt+blade, and Alt+trim J/L cut
 * creation.
 *
 * Stack ordering follows the "video above audio" convention:
 *   - opts.originalRole = "video" (default): duplicate placed AFTER layer
 *   - opts.originalRole = "audio": duplicate placed BEFORE layer (video
 *     half lands on the lower AE index, above the audio half)
 *
 * @param {AVLayer} layer - live A/V layer to promote
 * @param {Object} [opts]
 * @param {"video"|"audio"} [opts.originalRole="video"] - role the original takes
 * @param {string} [opts.dupRcId] - UUID for the duplicate's [RC:] tag
 * @returns {Object} { videoRole, audioRole, linkId }
 */
function promoteAVLayerToLinkedPair(layer, opts) {
    var originalRole = (opts && opts.originalRole === "audio") ? "audio" : "video";
    var duplicateRole = originalRole === "video" ? "audio" : "video";
    var dupRcId = (opts && opts.dupRcId) || generateRcId();

    var origRcTag = parseRcId(layer.comment);
    var origGroup = parseLayerGroup(layer.comment);
    var origName = layer.name;
    var linkId = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 6);

    var dup = layer.duplicate();
    if (originalRole === "video") {
        dup.moveAfter(layer);
    } else {
        // Video dup should sit above (lower AE index than) the audio original.
        dup.moveBefore(layer);
    }

    // Original → originalRole
    if (originalRole === "video") {
        layer.audioEnabled = false;
    } else {
        layer.enabled = false;
    }
    layer.name = addRoleSuffix(origName, originalRole);
    var origMeta = { rc_link: linkId, rc_role: originalRole };
    if (origGroup) origMeta.rc_group = origGroup;
    var origCmt = JSON.stringify(origMeta);
    if (origRcTag) origCmt += "\n[RC:" + origRcTag + "]";
    layer.comment = origCmt;

    // Duplicate → duplicateRole
    if (duplicateRole === "video") {
        dup.audioEnabled = false;
    } else {
        dup.enabled = false;
    }
    dup.name = addRoleSuffix(origName, duplicateRole);
    var dupMeta = { rc_link: linkId, rc_role: duplicateRole };
    if (origGroup) dupMeta.rc_group = origGroup;
    dup.comment = JSON.stringify(dupMeta) + "\n[RC:" + dupRcId + "]";

    return {
        videoRole: originalRole === "video" ? layer : dup,
        audioRole: originalRole === "audio" ? layer : dup,
        linkId: linkId,
    };
}

/**
 * Extract link metadata (rc_link, rc_role) from a comment that may also
 * contain an [RC:uuid] tag. Tries first line as JSON, then full comment.
 * @param {string} comment
 * @returns {Object|null} {rc_link, rc_role} or null
 */
function parseLinkData(comment) {
    if (!comment) return null;
    // Try first line as JSON (comment may have [RC:] tag on subsequent line)
    var lines = comment.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.charAt(0) === "{") {
            try {
                var obj = JSON.parse(line);
                if (obj && obj.rc_link) return obj;
            } catch (e) { /* not JSON */ }
        }
    }
    // Fallback: try full comment as JSON (old format, no RC tag)
    try {
        var obj2 = JSON.parse(comment);
        if (obj2 && obj2.rc_link) return obj2;
    } catch (e2) { /* ignore */ }
    return null;
}

/**
 * Read the JSON metadata object from a layer comment, regardless of which
 * rc_* keys it contains. Used by group/role parsers that need to inspect any
 * field, not just rc_link. Returns the parsed object or null.
 * @param {string} comment
 * @returns {Object|null}
 */
function parseLayerMetaJson(comment) {
    if (!comment) return null;
    var lines = comment.split(/\r?\n/);
    for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        if (line.charAt(0) === "{") {
            try {
                var obj = JSON.parse(line);
                if (obj && typeof obj === "object") return obj;
            } catch (e) { /* not JSON */ }
        }
    }
    // Fallback: full comment as JSON (very old format, no [RC:] tag).
    try {
        var obj2 = JSON.parse(comment);
        if (obj2 && typeof obj2 === "object") return obj2;
    } catch (e2) { /* ignore */ }
    return null;
}

/**
 * Read the group id from a layer comment (rc_group field), if any. Groups
 * are independent of rc_link / rc_role — a layer can be in a group without
 * being half of a linked pair, and vice versa.
 * @param {string} comment
 * @returns {string|null}
 */
function parseLayerGroup(comment) {
    var meta = parseLayerMetaJson(comment);
    if (meta && typeof meta.rc_group === "string" && meta.rc_group) return meta.rc_group;
    return null;
}

/**
 * Set or clear a layer's group id. Preserves rc_link / rc_role / [RC:uuid]
 * exactly. Pass null or "" to remove the group from the comment.
 * @param {Layer} layer
 * @param {string|null} groupId
 */
function setLayerGroup(layer, groupId) {
    var rcTag = parseRcId(layer.comment);
    var meta = parseLayerMetaJson(layer.comment);
    if (groupId) {
        if (!meta) meta = {};
        meta.rc_group = groupId;
    } else if (meta && meta.rc_group) {
        delete meta.rc_group;
    } else {
        return; // nothing to change
    }
    var hasMeta = meta && (meta.rc_link || meta.rc_role || meta.rc_group);
    var newComment = hasMeta ? JSON.stringify(meta) : "";
    if (rcTag) newComment += (newComment ? "\n" : "") + "[RC:" + rcTag + "]";
    layer.comment = newComment;
}

/**
 * Copy a source layer's rc_group onto a newly-created layer. Used by every
 * ES path that splits / duplicates a managed layer (blade, JL split,
 * promoteAVLayerToLinkedPair, etc.) so a clip that was in a group keeps
 * each of its halves in that same group.
 * @param {Layer} srcLayer
 * @param {Layer} newLayer
 */
function inheritGroupToLayer(srcLayer, newLayer) {
    try {
        var gid = parseLayerGroup(srcLayer.comment);
        if (gid) setLayerGroup(newLayer, gid);
    } catch (e) { /* best effort */ }
}

/**
 * Generate a fresh rc_group id (timestamp + 6 random base36 chars).
 * @returns {string}
 */
function generateRcGroupId() {
    return "rcg_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 6);
}

/**
 * Apply (or clear) a group id across a list of layer indices in one undo
 * group. Pass empty / null groupId to ungroup; otherwise every requested
 * layer takes that id. Locked layers are skipped silently — the AE-side
 * lock semantics override Railcut's group identity.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @param {string|null} groupId - rc_group id to apply, or null to clear
 * @returns {string} JSON {success, error?}
 */
function groupLayers(layerIndicesJson, groupId) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var indices = JSON.parse(layerIndicesJson);
        if (!indices || !indices.length) return makeResult(true);

        var label = groupId ? "Railcut: Group Clips" : "Railcut: Ungroup Clips";
        app.beginUndoGroup(label);
        try {
            for (var i = 0; i < indices.length; i++) {
                var idx = indices[i];
                if (idx < 1 || idx > comp.numLayers) continue;
                var layer = comp.layer(idx);
                if (!layer || layer.locked) continue;
                setLayerGroup(layer, groupId || null);
            }
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Parse just the role string from a layer comment (rc_role field), independent
 * of whether rc_link is present. Returns "video", "audio", or null. Used by
 * getCompData to honor rc_role for hasVideo/hasAudio overrides on layers that
 * have been "intrinsically marked" as one role with no partner — e.g. after
 * Unlink, where each half should still be excluded from the opposite section.
 * @param {string} comment
 * @returns {string|null}
 */
function parseLayerRole(comment) {
    if (!comment) return null;
    var lines = comment.split(/\r?\n/);
    for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        if (line.charAt(0) === "{") {
            try {
                var obj = JSON.parse(line);
                if (obj && (obj.rc_role === "video" || obj.rc_role === "audio")) return obj.rc_role;
            } catch (e) { /* not JSON */ }
        }
    }
    return null;
}

/**
 * Like orphanLinkedLayer, but preserves rc_role (without rc_link) so the panel
 * still excludes the layer from the opposite section's packing. Use after
 * Unlink (Ctrl+L) so each half stays role-restricted with no partner — no
 * phantom dimmed entry on the opposite section.
 * @param {Layer} layer
 */
function unlinkButKeepRole(layer) {
    var rcTag = parseRcId(layer.comment);
    var ld = parseLinkData(layer.comment);
    var role = ld && ld.rc_role ? ld.rc_role : null;
    var rcGroup = parseLayerGroup(layer.comment);
    var meta = {};
    if (role === "video" || role === "audio") meta.rc_role = role;
    if (rcGroup) meta.rc_group = rcGroup;
    var hasMeta = meta.rc_role || meta.rc_group;
    var cmt = hasMeta ? JSON.stringify(meta) : "";
    if (rcTag) cmt += (cmt ? "\n" : "") + "[RC:" + rcTag + "]";
    layer.comment = cmt;
    layer.name = removeRoleSuffix(layer.name);
}

/**
 * Find a layer by its rc_id (scans all layer comments).
 * @param {CompItem} comp
 * @param {string} rcId - UUID to find
 * @returns {AVLayer|null}
 */
function findLayerByRcId(comp, rcId) {
    var tag = "[RC:" + rcId + "]";
    for (var i = 1; i <= comp.numLayers; i++) {
        try {
            if (comp.layer(i).comment.indexOf(tag) >= 0) {
                return comp.layer(i);
            }
        } catch (e) { /* some layer types may not support comment */ }
    }
    return null;
}

/**
 * Apply a JSON-encoded visibility / audibility payload to layers in the given
 * comp. Called from inside move functions before their endUndoGroup so the
 * enabled / audioEnabled flips are part of the same undo step as the move.
 * Silently no-ops on empty / malformed input.
 *
 * Payload shape:
 *   { enable: [rcId,...], disable: [rcId,...],
 *     audioEnable: [rcId,...], audioDisable: [rcId,...] }
 *
 * `enable` / `disable` flip `layer.enabled` (video visibility).
 * `audioEnable` / `audioDisable` flip `layer.audioEnabled` (audio mute).
 *
 * @param {CompItem} comp
 * @param {string|undefined} visibilityJson
 */
function applyVisibilityChanges(comp, visibilityJson) {
    if (typeof visibilityJson !== "string" || !visibilityJson) return;
    try {
        var vis = JSON.parse(visibilityJson);
        if (vis.enable) {
            for (var i = 0; i < vis.enable.length; i++) {
                var enLayer = findLayerByRcId(comp, vis.enable[i]);
                if (enLayer) enLayer.enabled = true;
            }
        }
        if (vis.disable) {
            for (var j = 0; j < vis.disable.length; j++) {
                var disLayer = findLayerByRcId(comp, vis.disable[j]);
                if (disLayer) disLayer.enabled = false;
            }
        }
        if (vis.audioEnable) {
            for (var k = 0; k < vis.audioEnable.length; k++) {
                var aeLayer = findLayerByRcId(comp, vis.audioEnable[k]);
                if (aeLayer && aeLayer instanceof AVLayer && aeLayer.hasAudio) aeLayer.audioEnabled = true;
            }
        }
        if (vis.audioDisable) {
            for (var m = 0; m < vis.audioDisable.length; m++) {
                var adLayer = findLayerByRcId(comp, vis.audioDisable[m]);
                if (adLayer && adLayer instanceof AVLayer && adLayer.hasAudio) adLayer.audioEnabled = false;
            }
        }
    } catch (e) { /* ignore malformed input */ }
}

/**
 * Build a reverse index of rcId → layer index for all layers with rc_ids.
 * Use for batch operations (one scan, many lookups).
 * @param {CompItem} comp
 * @returns {Object} map of rcId → 1-based layer index
 */
function buildRcIdIndex(comp) {
    var map = {};
    var seen = {}; // track duplicate detection
    for (var i = 1; i <= comp.numLayers; i++) {
        try {
            var rcId = parseRcId(comp.layer(i).comment);
            if (rcId) {
                if (seen[rcId]) {
                    // Duplicate — higher index (this one) is the duplicate, skip it.
                    // Lower index (already seen) keeps the id. Duplicate gets new id on next op.
                } else {
                    map[rcId] = i;
                    seen[rcId] = true;
                }
            }
        } catch (e) { /* ignore */ }
    }
    return map;
}

/**
 * Ensure rc_ids exist on specified layers. Assigns UUIDs to layers that
 * don't have one yet (skips locked layers). Wraps comment writes in a
 * named undo group so the assignment is one labelled entry the user can
 * undo intentionally, instead of a stream of unnamed "Comment Change"
 * entries that pollute the undo history. The group is empty (no entry
 * created) when every requested layer already has a unique rcId.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @returns {string} JSON map of {layerIndex: rcId} for all requested layers
 */
function ensureRcIds(layerIndicesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({});
        var indices = JSON.parse(layerIndicesJson);
        var result = {};
        var seen = {}; // detect duplicate rcIds (from AE layer duplication)

        app.beginUndoGroup("Railcut: Assign Layer IDs");
        try {
            for (var i = 0; i < indices.length; i++) {
                var idx = indices[i];
                var layer = comp.layer(idx);
                if (!layer) continue;
                try {
                    var existing = parseRcId(layer.comment);
                    if (existing && !seen[existing]) {
                        // First occurrence of this rcId — keep it
                        seen[existing] = true;
                        result[String(idx)] = existing;
                    } else if (!layer.locked) {
                        // No rcId, or duplicate rcId from AE duplication — assign a new one
                        var newId = generateRcId();
                        layer.comment = appendRcId(layer.comment, newId);
                        seen[newId] = true;
                        result[String(idx)] = newId;
                    }
                    // Locked layers without rcId: omit — caller uses fingerprint fallback
                } catch (e) { /* skip problematic layers */ }
            }
        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify(result);
    } catch (e) {
        return JSON.stringify({});
    }
}

/**
 * Reorder managed layers in-place so higher tracks sit above lower tracks
 * in the AE layer stack, and within a track later clips are higher.
 * Returns an indexMap (originalIndex → newIndex).  Expects to be called
 * INSIDE an existing undo group.
 *
 * @param {CompItem} comp
 * @param {string}   trackAssignmentsJson - JSON object mapping layer indices to track numbers
 * @returns {Object|null} indexMap, or null if nothing to reorder
 */
function reorderLayersInPlace(comp, trackAssignmentsJson) {
    var trackAssignments = JSON.parse(trackAssignmentsJson);

    var managedLayers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var trackNum = trackAssignments[String(i)];
        if (trackNum !== undefined) {
            managedLayers.push({
                layer: layer,
                originalIndex: i,
                track: trackNum,
                inPoint: layer.inPoint
            });
        }
    }

    if (managedLayers.length === 0) return {};

    managedLayers.sort(function(a, b) {
        if (a.track !== b.track) return b.track - a.track;
        return b.inPoint - a.inPoint;
    });

    for (var m = 0; m < managedLayers.length; m++) {
        var info = managedLayers[m];
        var desiredIndex = m + 1;
        if (info.layer.index !== desiredIndex && !info.layer.locked) {
            if (desiredIndex < info.layer.index) {
                info.layer.moveBefore(comp.layer(desiredIndex));
            } else {
                info.layer.moveAfter(comp.layer(desiredIndex));
            }
        }
    }

    var indexMap = {};
    for (var j = 0; j < managedLayers.length; j++) {
        indexMap[String(managedLayers[j].originalIndex)] = managedLayers[j].layer.index;
    }
    return indexMap;
}

/**
 * Windows-1252 character lookup table for reading label colors from preferences.
 * The prefs file stores colors in CP1252 encoding, but ExtendScript reads as UTF-8,
 * so characters > 254 need to be mapped back to their byte values.
 */
var table1252 = {
    "â‚¬":128, "â€š":130, "Æ’":131, "â€ž":132, "â€¦":133, "â€ ":134, "â€¡":135,
    "Ë†":136, "â€°":137, "Å ":138, "â€¹":139, "Å’":140, "Å½":142, "'":145,
    "'":146, """:147, """:148, "â€¢":149, "â€“":150, "â€”":151, "Ëœ":152,
    "â„¢":153, "Å¡":154, "â€º":155, "Å“":156, "Å¾":158, "Å¸":159, "Â¡":161,
    "Â¢":162, "Â£":163, "Â¤":164, "Â¥":165, "Â¦":166, "Â§":167, "Â¨":168,
    "Â©":169, "Âª":170, "Â«":171, "Â¬":172, "Â®":174, "Â¯":175, "Â°":176,
    "Â±":177, "Â²":178, "Â³":179, "Â´":180, "Âµ":181, "Â¶":182, "Â·":183,
    "Â¸":184, "Â¹":185, "Âº":186, "Â»":187, "Â¼":188, "Â½":189, "Â¾":190,
    "Â¿":191, "Ã€":192, "Ã":193, "Ã‚":194, "Ãƒ":195, "Ã„":196, "Ã…":197,
    "Ã†":198, "Ã‡":199, "Ãˆ":200, "Ã‰":201, "ÃŠ":202, "Ã‹":203, "ÃŒ":204,
    "Ã":205, "ÃŽ":206, "Ã":207, "Ã":208, "Ã‘":209, "Ã’":210, "Ã“":211,
    "Ã”":212, "Ã•":213, "Ã–":214, "Ã—":215, "Ã˜":216, "Ã™":217, "Ãš":218,
    "Ã›":219, "Ãœ":220, "Ã":221, "Ãž":222, "ÃŸ":223, "Ã ":224, "Ã¡":225,
    "Ã¢":226, "Ã£":227, "Ã¤":228, "Ã¥":229, "Ã¦":230, "Ã§":231, "Ã¨":232,
    "Ã©":233, "Ãª":234, "Ã«":235, "Ã¬":236, "Ã­":237, "Ã®":238, "Ã¯":239,
    "Ã°":240, "Ã±":241, "Ã²":242, "Ã³":243, "Ã´":244, "Ãµ":245, "Ã¶":246,
    "Ã·":247, "Ã¸":248, "Ã¹":249, "Ãº":250, "Ã»":251, "Ã¼":252, "Ã½":253,
    "Ã¾":254, "Ã¿":255
};

/**
 * Get the user's label colors from AE preferences.
 * Returns an array of 16 hex color strings (without # prefix).
 * @returns {string} JSON with success and colors array
 */
function getLabelColors() {
    try {
        $.appEncoding = "CP1252";
        var sectionName = "Label Preference Color Section 5";
        var prefFile = PREFType.PREF_Type_MACHINE_INDEPENDENT;
        var colors = [];

        for (var i = 1; i <= 16; i++) {
            var keyName = "Label Color ID 2 # " + i.toString();
            var mypref = app.preferences.getPrefAsString(sectionName, keyName, prefFile);
            var hexColor = "";

            // Skip first character (alpha), convert remaining 3 chars to RGB hex
            for (var j = 1; j < mypref.length; j++) {
                var charCode = mypref.charCodeAt(j);
                // Handle Windows-1252 extended characters
                if (charCode > 254) {
                    charCode = table1252[mypref[j]];
                }
                var hexByte = charCode.toString(16).toUpperCase();
                if (hexByte.length === 1) {
                    hexByte = "0" + hexByte;
                }
                hexColor += hexByte;
            }
            colors.push(hexColor);
        }

        return JSON.stringify({ success: true, colors: colors });
    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

// ============================================
// License Persistence (shared across AE versions)
// ============================================

/** Get the license file path (cross-platform via ExtendScript) */
function getLicenseFilePath() {
    // Folder.appData = ProgramData (system-wide), NOT the per-user Roaming folder.
    // Use environment variable to get the correct per-user AppData/Roaming path.
    var roaming = $.getenv("APPDATA");
    if (!roaming) {
        // macOS fallback: ~/Library/Application Support
        roaming = Folder.userData.fullName + "/Library/Application Support";
    }
    var dir = new Folder(roaming + "/JakeInMotion/Railcut");
    if (!dir.exists) dir.create();
    return new File(dir.fullName + "/license.json");
}

/** Read stored license key from disk */
function readLicenseFromDisk() {
    try {
        var f = getLicenseFilePath();
        if (!f.exists) return JSON.stringify({ success: true, data: null });
        f.open("r");
        var contents = f.read();
        f.close();
        var data = JSON.parse(contents);
        return JSON.stringify({ success: true, data: data });
    } catch (e) {
        return JSON.stringify({ success: true, data: null });
    }
}

/** Write license key to disk after successful activation */
function writeLicenseToDisk(licenseKey, instanceId) {
    try {
        var f = getLicenseFilePath();
        // Build JSON string before opening file, so any error doesn't leave an empty file
        var now = new Date();
        var ts = now.getFullYear() + "-" +
            ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
            ("0" + now.getDate()).slice(-2) + "T" +
            ("0" + now.getHours()).slice(-2) + ":" +
            ("0" + now.getMinutes()).slice(-2) + ":" +
            ("0" + now.getSeconds()).slice(-2) + "Z";
        var json = JSON.stringify({
            licenseKey: licenseKey,
            activatedAt: ts,
            instanceId: instanceId || ""
        });
        f.open("w");
        f.write(json);
        f.close();
        return JSON.stringify({ success: true });
    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/** Remove license file (used on deactivation) */
function deleteLicenseFromDisk() {
    try {
        var f = getLicenseFilePath();
        if (f.exists) f.remove();
        return JSON.stringify({ success: true });
    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

// ============================================
// Main API Functions (called from CEP panel)
// ============================================

/**
 * Get all relevant data from the active composition
 * @returns {string} JSON string of CompData or null
 */
function getCompData() {
    try {
        var comp = getActiveComp();

        // Check if we have an active composition
        if (!comp) {
            return "null";
        }

        var compData = {
            id: comp.id,
            name: comp.name,
            duration: comp.duration,
            frameRate: comp.frameRate,
            width: comp.width,
            height: comp.height,
            currentTime: comp.time,
            workAreaStart: comp.workAreaStart,
            workAreaDuration: comp.workAreaDuration,
            comment: comp.comment || "",
            layers: []
        };

        // Iterate through all layers
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            var layerData = {
                index: layer.index,
                name: layer.name,
                inPoint: layer.inPoint,
                outPoint: layer.outPoint,
                startTime: layer.startTime,
                duration: 0,
                sourceWidth: 0,
                sourceHeight: 0,
                sourceType: getLayerSourceType(layer),
                sourceName: "",
                isVisible: layer.enabled,
                isLocked: layer.locked,
                isShy: layer.shy,
                label: layer.label,
                hasAudio: false,
                hasVideo: false,
                isAudioOnly: false,
                audioEnabled: true,
                selected: layer.selected
            };

            // Parse Railcut metadata from layer comment (rc_id + link data)
            try {
                var layerComment = layer.comment;
                if (layerComment) {
                    // Extract stable identity tag [RC:uuid]
                    var extractedRcId = parseRcId(layerComment);
                    if (extractedRcId) {
                        layerData.rcId = extractedRcId;
                    }
                    // Extract link metadata (JSON portion of comment)
                    var linkObj = parseLinkData(layerComment);
                    if (linkObj) {
                        layerData.linkId = linkObj.rc_link;
                        layerData.linkRole = linkObj.rc_role || "";
                    }
                    // Standalone rc_role (no rc_link): the layer was Unlinked
                    // but kept its role metadata so the opposite section's
                    // packing still excludes it. linkId stays undefined so
                    // partner search and the link icon aren't triggered.
                    if (!layerData.linkRole) {
                        var soloRole = parseLayerRole(layerComment);
                        if (soloRole) layerData.linkRole = soloRole;
                    }
                    // Group membership (independent of rc_link / rc_role).
                    var groupId = parseLayerGroup(layerComment);
                    if (groupId) layerData.groupId = groupId;
                }
            } catch (eComment) {
                // Not parseable — ignore
            }

            // Get source info based on layer type
            var sourceType = layerData.sourceType;
            var isSourcedLayer = (sourceType === "footage" || sourceType === "precomp" ||
                                  sourceType === "solid" || sourceType === "still");
            var isVisualLayer = (sourceType === "text" || sourceType === "shape" ||
                                 sourceType === "adjustment" || isSourcedLayer);

            if (isSourcedLayer && layer.source) {
                // Solids and still images can extend to any length, use comp duration
                if (sourceType === "solid" || sourceType === "still") {
                    layerData.duration = comp.duration;
                } else {
                    layerData.duration = layer.source.duration;
                }
                layerData.sourceWidth = layer.source.width;
                layerData.sourceHeight = layer.source.height;
                layerData.sourceName = layer.source.name;
                layerData.sourceItemId = layer.source.id;
                // Extract source file path for waveform generation
                if (layer.source instanceof FootageItem && layer.source.file) {
                    try { layerData.sourcePath = layer.source.file.fsName; } catch (e) {}
                }
                // Check if layer has audio/video
                layerData.hasAudio = layer.hasAudio;
                layerData.hasVideo = layer.hasVideo;
                // Skip data file layers (csv, json, txt, etc.) — no visual or audio output
                if (!layerData.hasAudio && !layerData.hasVideo) continue;
                layerData.isAudioOnly = layerData.hasAudio && !layerData.hasVideo;
                // Audio enabled state
                layerData.audioEnabled = layerData.hasAudio ? layer.audioEnabled : true;
                // Get time stretch percentage
                layerData.stretch = layer.stretch;
            } else if (sourceType === "text" || sourceType === "shape") {
                // Text and Shape layers - they render visually but have no source
                // Use comp duration as max since they can extend to any length
                layerData.hasVideo = true;
                layerData.hasAudio = false;
                layerData.duration = comp.duration;
                layerData.sourceWidth = comp.width;
                layerData.sourceHeight = comp.height;
                layerData.sourceName = layer.name;
                layerData.stretch = layer.stretch;
            } else if (sourceType === "adjustment") {
                // Adjustment layers affect layers below but have no source
                // Use comp duration as max since they can extend to any length
                layerData.hasVideo = true;
                layerData.hasAudio = false;
                layerData.duration = comp.duration;
                layerData.sourceWidth = comp.width;
                layerData.sourceHeight = comp.height;
                layerData.sourceName = layer.name;
                layerData.stretch = layer.stretch;
            } else if (sourceType === "camera") {
                // Camera layers - no visual content but affect the view
                layerData.hasVideo = false;
                layerData.hasAudio = false;
                layerData.duration = comp.duration;
                layerData.sourceWidth = 0;
                layerData.sourceHeight = 0;
                layerData.sourceName = layer.name;
                layerData.stretch = 100;
            } else if (sourceType === "light") {
                // Light layers - no visual content but affect lighting
                layerData.hasVideo = false;
                layerData.hasAudio = false;
                layerData.duration = comp.duration;
                layerData.sourceWidth = 0;
                layerData.sourceHeight = 0;
                layerData.sourceName = layer.name;
                layerData.stretch = 100;
            } else if (sourceType === "null") {
                // Null objects - invisible but used for parenting/expressions
                layerData.hasVideo = false;
                layerData.hasAudio = false;
                layerData.duration = comp.duration;
                layerData.sourceWidth = 0;
                layerData.sourceHeight = 0;
                layerData.sourceName = layer.name;
                layerData.stretch = 100;
            }

            // Override hasVideo/hasAudio based on link role. When an A/V layer is
            // split for J/L cuts, the audio-role layer still reports hasVideo=true in AE
            // (it's a footage layer). We override here so Railcut treats it as audio-only.
            if (layerData.linkRole === "video") {
                layerData.hasAudio = false;
                layerData.audioEnabled = true;
                layerData.isAudioOnly = false;
            } else if (layerData.linkRole === "audio") {
                layerData.hasVideo = false;
                layerData.isAudioOnly = true;
            }

            // Normalize timing for time-reversed layers (negative stretch).
            // AE reports swapped inPoint/outPoint when stretch is negative.
            if (layerData.inPoint > layerData.outPoint) {
                var tmpIn = layerData.inPoint;
                layerData.inPoint = layerData.outPoint;
                layerData.outPoint = tmpIn;
            }

            // Read blending mode (AVLayer property). Stored as the string key
            // (e.g. "NORMAL", "MULTIPLY") so the TS side stays decoupled from the
            // BlendingMode enum's numeric values.
            try {
                if (layer instanceof AVLayer) {
                    layerData.blendingMode = blendingModeToKey(layer.blendingMode);
                }
            } catch (eBlend) {}

            // Read layer markers for all layers (not just visual)
            var isTimelineLayer = (isVisualLayer || sourceType === "camera" ||
                                   sourceType === "light" || sourceType === "null");
            if (isTimelineLayer) {
                var layerMarkerProp = layer.property("Marker");
                if (layerMarkerProp && layerMarkerProp.numKeys > 0) {
                    var layerMarkers = [];
                    for (var lm = 1; lm <= layerMarkerProp.numKeys; lm++) {
                        var lmTime = layerMarkerProp.keyTime(lm);
                        var lmVal = layerMarkerProp.keyValue(lm);
                        layerMarkers.push({
                            index: lm,
                            time: lmTime,
                            comment: lmVal.comment,
                            duration: lmVal.duration,
                            label: lmVal.label
                        });
                    }
                    layerData.markers = layerMarkers;
                }

                // Read audio level keyframes for layers with audio
                if (layerData.hasAudio) {
                    var audioGroup = layer.property("ADBE Audio Group");
                    if (audioGroup) {
                        var audioLevels = audioGroup.property("ADBE Audio Levels");
                        if (audioLevels) {
                            if (audioLevels.numKeys === 0) {
                                // Static value
                                var val = audioLevels.value;
                                layerData.audioLevels = {
                                    isStatic: true,
                                    staticLevel: (val[0] + val[1]) / 2,
                                    keyframes: []
                                };
                            } else {
                                var kfs = [];
                                for (var k = 1; k <= audioLevels.numKeys; k++) {
                                    var kTime = audioLevels.keyTime(k);
                                    var kVal = audioLevels.keyValue(k);
                                    var outInterp = audioLevels.keyOutInterpolationType(k);
                                    var inInterp = audioLevels.keyInInterpolationType(k);

                                    var outInterpStr = "linear";
                                    if (outInterp === KeyframeInterpolationType.HOLD) {
                                        outInterpStr = "hold";
                                    } else if (outInterp === KeyframeInterpolationType.BEZIER) {
                                        outInterpStr = "bezier";
                                    }

                                    var inInterpStr = "linear";
                                    if (inInterp === KeyframeInterpolationType.HOLD) {
                                        inInterpStr = "hold";
                                    } else if (inInterp === KeyframeInterpolationType.BEZIER) {
                                        inInterpStr = "bezier";
                                    }

                                    var kfData = {
                                        time: kTime,
                                        leftDB: kVal[0],
                                        rightDB: kVal[1],
                                        interpType: outInterpStr,
                                        inInterpType: inInterpStr,
                                        outInterpType: outInterpStr
                                    };

                                    // Read temporal ease and flags for bezier keyframes
                                    if (outInterpStr === "bezier" || inInterpStr === "bezier") {
                                        try {
                                            if (outInterpStr === "bezier") {
                                                var outEase = audioLevels.keyOutTemporalEase(k);
                                                kfData.outTemporalEase = {
                                                    speed: outEase[0].speed,
                                                    influence: outEase[0].influence
                                                };
                                            }
                                            if (inInterpStr === "bezier") {
                                                var inEase = audioLevels.keyInTemporalEase(k);
                                                kfData.inTemporalEase = {
                                                    speed: inEase[0].speed,
                                                    influence: inEase[0].influence
                                                };
                                            }
                                            kfData.temporalAutoBezier = audioLevels.keyTemporalAutoBezier(k);
                                            kfData.temporalContinuous = audioLevels.keyTemporalContinuous(k);
                                        } catch (easeErr) {
                                            // Graceful fallback if ease reading fails
                                        }
                                    }

                                    kfs.push(kfData);
                                }
                                layerData.audioLevels = {
                                    isStatic: false,
                                    staticLevel: 0,
                                    keyframes: kfs
                                };

                            }
                        }
                    }
                }
            }

                // Read opacity keyframe data for layers with video
                if (layerData.hasVideo) {
                    var transformGroup = layer.property("ADBE Transform Group");
                    if (transformGroup) {
                        var opacityProp = transformGroup.property("ADBE Opacity");
                        if (opacityProp) {
                            if (opacityProp.numKeys === 0) {
                                // Static value
                                layerData.opacityData = {
                                    isStatic: true,
                                    staticLevel: opacityProp.value,
                                    keyframes: []
                                };
                            } else {
                                var opKfs = [];
                                for (var ok = 1; ok <= opacityProp.numKeys; ok++) {
                                    var opTime = opacityProp.keyTime(ok);
                                    var opVal = opacityProp.keyValue(ok);
                                    var opOutInterp = opacityProp.keyOutInterpolationType(ok);
                                    var opInInterp = opacityProp.keyInInterpolationType(ok);

                                    var opOutInterpStr = "linear";
                                    if (opOutInterp === KeyframeInterpolationType.HOLD) {
                                        opOutInterpStr = "hold";
                                    } else if (opOutInterp === KeyframeInterpolationType.BEZIER) {
                                        opOutInterpStr = "bezier";
                                    }

                                    var opInInterpStr = "linear";
                                    if (opInInterp === KeyframeInterpolationType.HOLD) {
                                        opInInterpStr = "hold";
                                    } else if (opInInterp === KeyframeInterpolationType.BEZIER) {
                                        opInInterpStr = "bezier";
                                    }

                                    var opKfData = {
                                        time: opTime,
                                        value: opVal,
                                        interpType: opOutInterpStr,
                                        inInterpType: opInInterpStr,
                                        outInterpType: opOutInterpStr
                                    };

                                    // Read temporal ease and flags for bezier keyframes
                                    if (opOutInterpStr === "bezier" || opInInterpStr === "bezier") {
                                        try {
                                            if (opOutInterpStr === "bezier") {
                                                var opOutEase = opacityProp.keyOutTemporalEase(ok);
                                                opKfData.outTemporalEase = {
                                                    speed: opOutEase[0].speed,
                                                    influence: opOutEase[0].influence
                                                };
                                            }
                                            if (opInInterpStr === "bezier") {
                                                var opInEase = opacityProp.keyInTemporalEase(ok);
                                                opKfData.inTemporalEase = {
                                                    speed: opInEase[0].speed,
                                                    influence: opInEase[0].influence
                                                };
                                            }
                                            opKfData.temporalAutoBezier = opacityProp.keyTemporalAutoBezier(ok);
                                            opKfData.temporalContinuous = opacityProp.keyTemporalContinuous(ok);
                                        } catch (opEaseErr) {
                                            // Graceful fallback if ease reading fails
                                        }
                                    }

                                    opKfs.push(opKfData);
                                }
                                layerData.opacityData = {
                                    isStatic: false,
                                    staticLevel: 100,
                                    keyframes: opKfs
                                };
                            }
                        }
                    }
                }

            compData.layers.push(layerData);
        }

        // Read composition markers
        var markers = [];
        var markerProp = comp.markerProperty;
        for (var m = 1; m <= markerProp.numKeys; m++) {
            var mTime = markerProp.keyTime(m);
            var mVal = markerProp.keyValue(m);
            markers.push({
                index: m,
                time: mTime,
                comment: mVal.comment,
                duration: mVal.duration,
                label: mVal.label
            });
        }
        compData.markers = markers;

        return JSON.stringify(compData);

    } catch (e) {
        return "null";
    }
}

/**
 * Set layer in/out points (for trimming)
 * @param {number} layerIndex - 1-based layer index
 * @param {number} inPoint - New in point in seconds
 * @param {number} outPoint - New out point in seconds
 * @returns {string} JSON result
 */
function setLayerInOut(layerIndex, inPoint, outPoint) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        app.beginUndoGroup("Railcut: Trim Layer");

        try {
            // Snap to frame boundaries to prevent sub-frame edit points
            var frameRate = comp.frameRate;
            layer.inPoint = snapToFrame(inPoint, frameRate);
            layer.outPoint = snapToFrame(outPoint, frameRate);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set in/out points for two linked layers in a single undo group.
 * @param {number} layerIndex1 - 1-based index of first layer
 * @param {number} inPoint1 - New in point for first layer
 * @param {number} outPoint1 - New out point for first layer
 * @param {number} layerIndex2 - 1-based index of second layer
 * @param {number} inPoint2 - New in point for second layer
 * @param {number} outPoint2 - New out point for second layer
 * @returns {string} JSON result
 */
function setLayerInOutLinked(layerIndex1, inPoint1, outPoint1, layerIndex2, inPoint2, outPoint2) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check1 = getLayerChecked(comp, layerIndex1, true);
        if (check1.error) return makeResult(false, check1.error);
        var check2 = getLayerChecked(comp, layerIndex2, true);
        if (check2.error) return makeResult(false, check2.error);

        app.beginUndoGroup("Railcut: Trim Linked Pair");
        try {
            var frameRate = comp.frameRate;
            check1.layer.inPoint = snapToFrame(inPoint1, frameRate);
            check1.layer.outPoint = snapToFrame(outPoint1, frameRate);
            check2.layer.inPoint = snapToFrame(inPoint2, frameRate);
            check2.layer.outPoint = snapToFrame(outPoint2, frameRate);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Move a layer in time (shifts the entire layer, preserving duration)
 * @param {number} layerIndex - 1-based layer index
 * @param {number} timeOffset - Amount to shift in seconds (positive = later, negative = earlier)
 * @returns {string} JSON result
 */
function moveLayer(layerIndex, timeOffset, trackAssignmentsJson, visibilityJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        app.beginUndoGroup("Railcut: Move Layer");

        try {
            var frameRate = comp.frameRate;

            // To move a layer in time, we shift startTime, inPoint, and outPoint together
            // Snap the offset to frame boundary first
            var snappedOffset = snapToFrame(timeOffset, frameRate);
            var newStartTime = layer.startTime + snappedOffset;
            var newInPoint = layer.inPoint + snappedOffset;
            var newOutPoint = layer.outPoint + snappedOffset;

            // Clamp to not go before 0
            if (newInPoint < 0) {
                var adjustment = -newInPoint;
                newStartTime += adjustment;
                newInPoint = 0;
                newOutPoint += adjustment;
            }

            // Apply changes - order matters!
            // Set startTime first, then adjust in/out
            // Snap all values to frame boundaries
            layer.startTime = snapToFrame(newStartTime, frameRate);
            layer.inPoint = snapToFrame(newInPoint, frameRate);
            layer.outPoint = snapToFrame(newOutPoint, frameRate);

            // Optional: reorder layers by track & time within the same undo group
            var indexMap = null;
            if (trackAssignmentsJson) {
                indexMap = reorderLayersInPlace(comp, trackAssignmentsJson);
            }

            // Optional: track-visibility sync (same undo step as the move)
            applyVisibilityChanges(comp, visibilityJson);
        } finally {
            app.endUndoGroup();
        }

        if (indexMap) {
            return JSON.stringify({ success: true, indexMap: indexMap });
        }
        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set layer start time (legacy - use moveLayer instead for sliding clips)
 * @param {number} layerIndex - 1-based layer index
 * @param {number} newStartTime - New start time in seconds
 * @returns {string} JSON result
 */
function setLayerStartTime(layerIndex, newStartTime) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        app.beginUndoGroup("Railcut: Set Start Time");

        try {
            layer.startTime = newStartTime;
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Delete a layer (lift operation - removes layer, leaves gap)
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON result
 */
function deleteLayer(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        app.beginUndoGroup("Railcut: Lift");

        try {
            layer.remove();
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Ripple delete a layer (delete and shift subsequent layers to close gap)
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON result
 */
function rippleDelete(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        app.beginUndoGroup("Railcut: Ripple Delete");

        try {
            // Get the duration of the gap to close
            var deletedIn = layer.inPoint;
            var deletedOut = layer.outPoint;
            var gapDuration = deletedOut - deletedIn;

            // Find layers that start after the deleted layer's in point
            var layersToShift = [];
            for (var i = 1; i <= comp.numLayers; i++) {
                var otherLayer = comp.layer(i);
                if (otherLayer.index !== layerIndex && !otherLayer.locked) {
                    // Shift layers that start at or after the deleted layer's outPoint
                    if (otherLayer.inPoint >= deletedOut) {
                        layersToShift.push({
                            layer: otherLayer,
                            newStartTime: otherLayer.startTime - gapDuration
                        });
                    }
                }
            }

            // Delete the layer first
            layer.remove();

            // Shift subsequent layers
            for (var j = 0; j < layersToShift.length; j++) {
                var item = layersToShift[j];
                item.layer.startTime = item.newStartTime;
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Get current time indicator position
 * @returns {number} CTI position in seconds, or 0 if no comp
 */
function getCurrentTime() {
    try {
        var comp = getActiveComp();
        if (comp) return comp.time;
        return 0;
    } catch (e) {
        return 0;
    }
}

/**
 * Get current time + a lightweight fingerprint of the comp state.
 * Used for polling: when fingerprint changes, a full reload is triggered.
 * Fingerprint = numLayers:sumInPoints:sumOutPoints (catches add/remove/timing changes)
 */
function getCompPollState() {
    try {
        var comp = getActiveComp();
        if (comp) {
            var numLayers = comp.numLayers;
            var sumIn = 0;
            var sumOut = 0;
            var sumFlags = 0; // enabled + audioEnabled + locked + label
            var sumStretch = 0;
            var sumLayerMarkers = 0;
            var nameHash = 0;
            var selectionHash = 0;
            var orderHash = 0; // order-dependent hash to detect layer reordering
            for (var i = 1; i <= numLayers; i++) {
                var layer = comp.layer(i);
                sumIn += layer.inPoint;
                sumOut += layer.outPoint;
                // Mix index position with timing to create an order-dependent value.
                // Same layers in different order produce different hashes.
                orderHash = ((orderHash << 5) - orderHash + (i * 7 + Math.round(layer.inPoint * 1000))) | 0;
                sumFlags += (layer.enabled ? 1 : 0) + (layer.audioEnabled ? 2 : 0) + (layer.locked ? 4 : 0) + layer.label + (layer.shy ? 8 : 0);
                if (layer.selected) selectionHash += i;
                sumStretch += layer.stretch;
                sumLayerMarkers += layer.property("ADBE Marker").numKeys;
                // Simple string hash for layer names + comments (link metadata)
                var n = layer.name;
                for (var c = 0; c < n.length; c++) {
                    nameHash = ((nameHash << 5) - nameHash + n.charCodeAt(c)) | 0;
                }
                try {
                    var cmnt = layer.comment;
                    for (var cc = 0; cc < cmnt.length; cc++) {
                        nameHash = ((nameHash << 5) - nameHash + cmnt.charCodeAt(cc)) | 0;
                    }
                } catch (ecc) { /* some layer types may not support comment */ }
            }
            // Hash comp comment (includes [RCV:N] version counter from reorder operations)
            var compCmnt = comp.comment || "";
            for (var ccc = 0; ccc < compCmnt.length; ccc++) {
                nameHash = ((nameHash << 5) - nameHash + compCmnt.charCodeAt(ccc)) | 0;
            }
            // Sum comp marker positions to detect moves (not just add/delete)
            var compMarkers = comp.markerProperty;
            var numMarkers = compMarkers.numKeys;
            var sumMarkerTimes = 0;
            for (var m = 1; m <= numMarkers; m++) {
                sumMarkerTimes += compMarkers.keyTime(m);
            }
            return JSON.stringify({
                time: comp.time,
                fingerprint: comp.id + ":" + numLayers + ":" + sumIn.toFixed(4) + ":" + sumOut.toFixed(4) + ":" + numMarkers + ":" + comp.workAreaStart.toFixed(4) + ":" + comp.workAreaDuration.toFixed(4) + ":" + sumFlags + ":" + sumStretch.toFixed(4) + ":" + sumLayerMarkers + ":" + sumMarkerTimes.toFixed(4) + ":" + nameHash + ":" + selectionHash + ":" + orderHash
            });
        }
        return JSON.stringify({ time: 0, fingerprint: "" });
    } catch (e) {
        return JSON.stringify({ time: 0, fingerprint: "" });
    }
}

/**
 * Set current time indicator position
 * @param {number} timeInSeconds
 */
function setCurrentTime(timeInSeconds) {
    try {
        var comp = getActiveComp();
        if (comp) {
            comp.time = timeInSeconds;
        }
    } catch (e) {
        // Silent fail
    }
}

/**
 * Set layer selection in the comp to match Railcut's selection
 * @param {string} layerIndicesJSON - JSON array of 1-based layer indices to select
 * @returns {string} JSON result
 */
function setLayerSelection(layerIndicesJSON) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var indices = JSON.parse(layerIndicesJSON);
        // No undo group — selection changes are not undoable edits
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).selected = isInArray(indices, i);
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Toggle layer visibility (enabled property)
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON result with new visibility state
 */
function toggleLayerVisibility(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        app.beginUndoGroup("Railcut: Toggle Visibility");

        try {
            layer.enabled = !layer.enabled;
        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify({ success: true, enabled: layer.enabled });

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Toggle layer audio enabled state
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON result with new audioEnabled state
 */
function toggleLayerAudioEnabled(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;
        if (!(layer instanceof AVLayer) || !layer.hasAudio) {
            return makeResult(false, "Layer has no audio: " + layerIndex);
        }

        app.beginUndoGroup("Railcut: Toggle Audio");

        try {
            layer.audioEnabled = !layer.audioEnabled;
        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify({ success: true, audioEnabled: layer.audioEnabled });

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set audio enabled state for multiple layers
 * @param {string} indicesJson - JSON array of layer indices
 * @param {boolean} enabled - Whether to enable or disable audio
 * @returns {string} JSON result
 */
function setLayersAudioEnabled(indicesJson, enabled) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        app.beginUndoGroup("Railcut: Set Audio Enabled");

        try {
            var indices = JSON.parse(indicesJson);
            for (var i = 0; i < indices.length; i++) {
                var layer = comp.layer(indices[i]);
                if (layer && layer instanceof AVLayer && layer.hasAudio) {
                    layer.audioEnabled = enabled;
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Toggle layer lock state
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON result with new lock state
 */
function toggleLayerLock(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        app.beginUndoGroup("Railcut: Toggle Lock");

        try {
            layer.locked = !layer.locked;
        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify({ success: true, locked: layer.locked });

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set the label color of a layer
 * @param {number} layerIndex - 1-based layer index
 * @param {number} labelIndex - Label color index (0-16)
 * @returns {string} JSON result with success status
 */
function setLayerLabel(layerIndex, labelIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        app.beginUndoGroup("Railcut: Set Layer Color");

        try {
            layer.label = labelIndex;
        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify({ success: true, label: layer.label });

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set the label color of multiple layers (single undo group)
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @param {number} labelIndex - Label color index (0-16)
 * @returns {string} JSON result with success status
 */
function setLayersLabel(layerIndicesJson, labelIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) {
            return makeResult(false, "No layers specified");
        }

        app.beginUndoGroup("Railcut: Set Layer Colors");

        try {
            for (var i = 0; i < layerIndices.length; i++) {
                var layer = comp.layer(layerIndices[i]);
                if (layer) {
                    layer.label = labelIndex;
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set visibility for multiple layers at once (single undo group)
 * @param {string} layerIndicesJson - JSON array of layer indices
 * @param {boolean} visible - Target visibility state
 * @returns {string} JSON result
 */
function setLayersVisibility(layerIndicesJson, visible) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);

        app.beginUndoGroup("Railcut: Set Track Visibility");

        try {
            for (var i = 0; i < layerIndices.length; i++) {
                var layer = comp.layer(layerIndices[i]);
                if (layer) {
                    layer.enabled = visible;
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set visibility for multiple layers, addressed by stable rcId. Use after
 * operations that may reorder AE layer indices (e.g., cross-track moves) so
 * the visibility change targets the right layers post-reorder.
 * @param {string} rcIdsJson - JSON array of rcId strings
 * @param {boolean} visible - Target visibility state
 * @returns {string} JSON result
 */
function setLayersVisibilityByRcId(rcIdsJson, visible) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var rcIds = JSON.parse(rcIdsJson);

        app.beginUndoGroup("Railcut: Set Track Visibility");

        try {
            for (var i = 0; i < rcIds.length; i++) {
                var layer = findLayerByRcId(comp, rcIds[i]);
                if (layer) {
                    layer.enabled = visible;
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set lock state for multiple layers at once (single undo group)
 * @param {string} layerIndicesJson - JSON array of layer indices
 * @param {boolean} locked - Target lock state
 * @returns {string} JSON result
 */
function setLayersLock(layerIndicesJson, locked) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);

        app.beginUndoGroup("Railcut: Set Track Lock");

        try {
            for (var i = 0; i < layerIndices.length; i++) {
                var layer = comp.layer(layerIndices[i]);
                if (layer) {
                    layer.locked = locked;
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

// ============================================
// Playback & Navigation Functions
// ============================================

/**
 * Toggle RAM preview playback via scheduleTask (fire-and-forget).
 * Command 10314 (PlayPreview) is a toggle — starts if stopped, stops if playing.
 * NOTE: AE's API provides no way to detect playback state from CEP context.
 * comp.time is frozen during RAM preview from evalScript, and no events exist.
 * State must be tracked client-side.
 * @returns {string} JSON result
 */
function startPlayback() {
    try {
        app.scheduleTask("app.executeCommand(10314)", 50, false);
        return makeResult(true);
    } catch (e) {
        return makeResult(false, "Playback command failed: " + e.toString());
    }
}

/**
 * Stop playback (same toggle command as startPlayback).
 * @returns {string} JSON result
 */
function stopPlayback() {
    try {
        app.scheduleTask("app.executeCommand(10314)", 50, false);
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Execute undo (Edit > Undo)
 * Command ID 16 = Edit > Undo
 * @returns {string} JSON result
 */
function undoCommand() {
    try {
        app.executeCommand(16);
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Execute redo (Edit > Redo)
 * Command ID 2035 = Edit > Redo
 * @returns {string} JSON result
 */
function redoCommand() {
    try {
        app.executeCommand(2035);
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Forward a keyboard command to AE by executing its menu command ID.
 * Used on Mac where the hidden input captures all keys.
 * @param {number} commandId - AE menu command ID
 * @returns {string} JSON result
 */
function forwardKeyToAE(commandId) {
    try {
        app.executeCommand(commandId);
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Open a precomp layer's source composition in the viewer
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON result
 */
/**
 * Precompose selected layers into a new composition.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @param {string} compName - Name for the new precomp
 * @returns {string} JSON with { success, compName?, error? }
 */
/**
 * Precompose selected layers into a new composition.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @param {string} compName - Name for the new precomp
 * @param {boolean} trimToClips - If true, trim the new comp duration to the selected clips' time span
 * @returns {string} JSON with { success, compName?, error? }
 */
function precomposeLayers(layerIndicesJson, compName, trimToClips) {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ success: false, error: "No active composition" });
        var indices = JSON.parse(layerIndicesJson);
        if (!indices || indices.length === 0) return JSON.stringify({ success: false, error: "No layers selected" });

        // Validate all indices exist and are unlocked
        for (var i = 0; i < indices.length; i++) {
            var check = getLayerChecked(comp, indices[i], true);
            if (check.error) return JSON.stringify({ success: false, error: check.error });
        }

        // Generate unique name if needed
        var name = compName || "Pre-comp";
        var existingNames = {};
        for (var p = 1; p <= app.project.numItems; p++) {
            existingNames[app.project.item(p).name] = true;
        }
        if (existingNames[name]) {
            var counter = 2;
            while (existingNames[name + " " + counter]) counter++;
            name = name + " " + counter;
        }

        // Record the time span of selected clips BEFORE precomposing
        var earliestIn = comp.duration;
        var latestOut = 0;
        for (var ei = 0; ei < indices.length; ei++) {
            var srcLayer = comp.layer(indices[ei]);
            if (srcLayer.inPoint < earliestIn) earliestIn = srcLayer.inPoint;
            if (srcLayer.outPoint > latestOut) latestOut = srcLayer.outPoint;
        }

        app.beginUndoGroup("Railcut: Precompose");
        try {
            // precompose expects a sorted array of layer indices
            indices.sort(function(a, b) { return a - b; });
            var newComp = comp.layers.precompose(indices, name, true);

            // Trim the precomp layer in the parent comp to the original clips' time span.
            if (trimToClips && newComp instanceof CompItem) {
                for (var pl = 1; pl <= comp.numLayers; pl++) {
                    var candidate = comp.layer(pl);
                    if (candidate.source === newComp) {
                        candidate.inPoint = earliestIn;
                        candidate.outPoint = latestOut;
                        break;
                    }
                }
            }
        } finally {
            app.endUndoGroup();
        }
        return JSON.stringify({ success: true, compName: name });
    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

function openLayerPrecomp(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;
        if (!(layer.source instanceof CompItem)) return makeResult(false, "Layer is not a precomp");
        layer.source.openInViewer();
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Open a layer's source in AE's Layer panel viewer (footage, stills, precomps).
 * Silently fails for layers without a viewable source (text, shape, solid, etc.).
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON with { success, error? }
 */
function openLayerSource(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;
        if (!layer.openInViewer) return makeResult(false, "Layer has no viewable source");
        layer.openInViewer();
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Get the text content of a text layer.
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON with { success, text }
 */
function getTextLayerContent(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ success: false, error: "No active composition" });
        var check = getLayerChecked(comp, layerIndex);
        if (check.error) return JSON.stringify({ success: false, error: check.error });
        var layer = check.layer;
        if (!(layer instanceof TextLayer)) return JSON.stringify({ success: false, error: "Layer is not a text layer" });

        var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
        var textDoc = textProp.value;
        return JSON.stringify({ success: true, text: textDoc.text });
    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Set the text content of a text layer.
 * @param {number} layerIndex - 1-based layer index
 * @param {string} newText - New text content
 * @returns {string} JSON result
 */
function setTextLayerContent(layerIndex, newText) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;
        if (!(layer instanceof TextLayer)) return makeResult(false, "Layer is not a text layer");

        app.beginUndoGroup("Railcut: Edit Text");
        try {
            var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
            var textDoc = textProp.value;
            textDoc.text = newText;
            textProp.setValue(textDoc);
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Step the CTI by a number of frames
 * @param {number} frames - Number of frames to step (positive = forward, negative = backward)
 * @returns {string} JSON result with new time
 */
function stepFrames(frames) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var frameDuration = 1 / comp.frameRate;
        var newTime = comp.time + (frames * frameDuration);

        // Clamp to valid range
        if (newTime < 0) newTime = 0;
        if (newTime > comp.duration) newTime = comp.duration;

        comp.time = newTime;

        return JSON.stringify({ success: true, time: newTime });

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Jump to the start of the composition
 * @returns {string} JSON result
 */
function goToStart() {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        comp.time = 0;
        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Jump to the end of the composition
 * @returns {string} JSON result
 */
function goToEnd() {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        comp.time = comp.duration;
        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Split a linked pair (video + audio layers) at the same time.
 * Both layers are split at razorTime, then the resulting 4 layers are
 * re-linked: left video+left audio (keeps original linkId), right video+right audio (new linkId).
 * @param {number} layerIndex1 - First layer index (1-based)
 * @param {number} layerIndex2 - Second layer index (1-based)
 * @param {number} splitTime - Time to split at (seconds)
 * @returns {string} JSON result
 */
function splitLinkedPair(layerIndex1, layerIndex2, splitTime) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var frameRate = comp.frameRate;
        var snappedSplitTime = snapToFrame(splitTime, frameRate);

        var check1 = getLayerChecked(comp, layerIndex1, true);
        if (check1.error) return makeResult(false, check1.error);
        var check2 = getLayerChecked(comp, layerIndex2, true);
        if (check2.error) return makeResult(false, check2.error);

        var linkData = parseLinkData(check1.layer.comment);
        var oldLinkId = linkData ? linkData.rc_link : null;

        // Track each split's new rcId + parent's source-layer index so the TS
        // side can pin the right pieces to the parent's V/A tracks.
        var splitInfos = [];

        app.beginUndoGroup("Railcut: Split Linked Pair");
        try {
            // Split in reverse index order so indices stay valid
            var indices = [layerIndex1, layerIndex2];
            indices.sort(function(a, b) { return b - a; });

            for (var i = 0; i < indices.length; i++) {
                var slpIdx = indices[i];
                var layer = comp.layer(slpIdx);
                if (snappedSplitTime <= layer.inPoint || snappedSplitTime >= layer.outPoint) continue;

                var originalOutPoint = layer.outPoint;
                layer.outPoint = snappedSplitTime;
                var newLayer = layer.duplicate();
                newLayer.inPoint = snappedSplitTime;
                newLayer.outPoint = originalOutPoint;

                // Assign new rcId to duplicate
                var slpNewRcId = "";
                try {
                    var dupComment = newLayer.comment;
                    slpNewRcId = generateRcId();
                    if (dupComment && parseRcId(dupComment)) {
                        newLayer.comment = appendRcId(dupComment, slpNewRcId);
                    } else {
                        newLayer.comment = (dupComment || "") + "\n[RC:" + slpNewRcId + "]";
                    }
                    splitInfos.push({ sourceLayerIndex: slpIdx, newRcId: slpNewRcId });
                } catch (erc) {}
            }

            // Re-link the split halves into two pairs
            if (oldLinkId) {
                relinkSplitPairs(comp, oldLinkId, snappedSplitTime);
            }

            // Bump comp comment version for fingerprint detection
            var cmnt = comp.comment || "";
            var vMatch = cmnt.match(/\[RCV:(\d+)\]/);
            var ver = vMatch ? parseInt(vMatch[1], 10) + 1 : 1;
            comp.comment = cmnt.replace(/\[RCV:\d+\]/, "") + "[RCV:" + ver + "]";
        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify({ success: true, splitLayers: splitInfos });
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Alt+Blade: split only the clicked component (video or audio) of a linked
 * pair or single A/V layer, creating a J/L cut. The unsplit partner stays
 * linked to whichever half of the split component still overlaps it
 * temporally — so the "earlier pair" keeps playing together and the
 * overhanging half becomes an independent tail that can be edited on its own.
 *
 * For a single A/V source, the layer is first promoted to a linked pair
 * (shared linkId, [V]/[A] suffixes, audioEnabled/enabled split) so the razor
 * cut produces the same J/L-cut shape as cutting an already-linked pair.
 * For a plain video-only or audio-only clip, this collapses to splitLayerAtTime.
 *
 * @param {number} layerIndex - 1-based index of the clicked layer
 * @param {number} splitTime - razor time (seconds)
 * @param {string} clickedRole - "video" or "audio" (which component to cut)
 * @returns {string} JSON result
 */
function bladeOneComponent(layerIndex, splitTime, clickedRole) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;
        var snappedSplitTime = snapToFrame(splitTime, comp.frameRate);

        app.beginUndoGroup("Railcut: Blade Component Only");
        try {
            var splitTarget = layer;
            var partner = null;
            var linkData = parseLinkData(layer.comment);

            if (linkData) {
                // Linked pair: find the partner by shared rc_link.
                for (var i = 1; i <= comp.numLayers; i++) {
                    if (i === layerIndex) continue;
                    var p = comp.layer(i);
                    try {
                        var pld = parseLinkData(p.comment);
                        if (pld && pld.rc_link === linkData.rc_link) {
                            partner = p;
                            break;
                        }
                    } catch (ep) { /* skip */ }
                }
                // Pick the layer matching clickedRole as the split target.
                if (linkData.rc_role === clickedRole) {
                    splitTarget = layer;
                } else if (partner) {
                    splitTarget = partner;
                }
            } else if (layer instanceof AVLayer && layer.hasVideo && layer.hasAudio
                       && layer.enabled && layer.audioEnabled) {
                // Single live A/V (both switches on): promote to a linked pair
                // first so the cut produces a proper J/L-cut shape (one half keeps
                // the link, the other orphans). Layers whose audio or video switch
                // was disabled by a prior unlink are treated as plain component
                // clips and fall through to the no-partner split path.
                var bladePair = promoteAVLayerToLinkedPair(layer);
                if (clickedRole === "audio") {
                    splitTarget = bladePair.audioRole;
                    partner = bladePair.videoRole;
                } else {
                    splitTarget = bladePair.videoRole;
                    partner = bladePair.audioRole;
                }
            }
            // else: single video-only or audio-only — no partner, just split below.

            // Razor-cut the target if splitTime falls within its bounds.
            var didSplit = false;
            var newLayer = null;
            var origOutPoint = splitTarget.outPoint;
            if (snappedSplitTime > splitTarget.inPoint && snappedSplitTime < splitTarget.outPoint) {
                splitTarget.outPoint = snappedSplitTime;
                newLayer = splitTarget.duplicate();
                newLayer.inPoint = snappedSplitTime;
                newLayer.outPoint = origOutPoint;
                didSplit = true;
            }

            // Re-wire link state: the partner keeps its link with whichever half
            // it still overlaps. Prefer the left half when both overlap (user's
            // intent — "the earlier pair stays linked"). Orphan the losing half.
            if (didSplit && partner) {
                // splitTarget is now the left half [inPoint .. snappedSplitTime].
                // newLayer is the right half [snappedSplitTime .. origOutPoint].
                var leftOverlapsPartner = splitTarget.inPoint < partner.outPoint
                    && snappedSplitTime > partner.inPoint;
                var rightOverlapsPartner = snappedSplitTime < partner.outPoint
                    && origOutPoint > partner.inPoint;
                var dupLd = parseLinkData(newLayer.comment);
                var dupRole = dupLd ? dupLd.rc_role : (linkData ? linkData.rc_role : "");

                if (leftOverlapsPartner) {
                    // Left keeps linkId (unchanged). Right orphans, but preserves
                    // its role so it renders as video-only / audio-only (instead
                    // of a regular A/V with audioEnabled=false / enabled=false
                    // showing dimmed in the opposite section).
                    orphanDuplicatedLayerKeepRole(newLayer);
                } else if (rightOverlapsPartner) {
                    // Right takes over the linkId (already inherited via duplicate);
                    // refresh its rcId. Orphan the left half (preserve its role).
                    var partnerLd = parseLinkData(partner.comment);
                    var liveLinkId = partnerLd ? partnerLd.rc_link : (linkData ? linkData.rc_link : null);
                    if (liveLinkId) {
                        var rwGroup = parseLayerGroup(newLayer.comment);
                        var rwMeta = { rc_link: liveLinkId, rc_role: dupRole };
                        if (rwGroup) rwMeta.rc_group = rwGroup;
                        newLayer.comment = JSON.stringify(rwMeta) + "\n[RC:" + generateRcId() + "]";
                    }
                    orphanDuplicatedLayerKeepRole(splitTarget);
                } else {
                    // Neither overlaps (degenerate): orphan halves preserving role,
                    // and the partner reverts to a plain layer (no role/link).
                    orphanDuplicatedLayerKeepRole(newLayer);
                    orphanDuplicatedLayerKeepRole(splitTarget);
                    orphanLinkedLayer(partner);
                }
            } else if (didSplit) {
                // No partner: just give the right half a fresh rcId.
                var dupComment = newLayer.comment;
                if (dupComment && parseRcId(dupComment)) {
                    newLayer.comment = appendRcId(dupComment, generateRcId());
                }
            }

            // Bump comp version for fingerprint detection.
            var cmnt = comp.comment || "";
            var vMatch = cmnt.match(/\[RCV:(\d+)\]/);
            var ver = vMatch ? parseInt(vMatch[1], 10) + 1 : 1;
            comp.comment = cmnt.replace(/\[RCV:\d+\]/, "") + "[RCV:" + ver + "]";
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Split a layer at the specified time
 * Creates a duplicate of the layer and trims both halves
 * @param {number} layerIndex - 1-based layer index
 * @param {number} splitTime - Time to split at (in seconds)
 * @returns {string} JSON result
 */
function splitLayerAtTime(layerIndex, splitTime) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        // Check if split time is within layer bounds
        if (splitTime <= layer.inPoint || splitTime >= layer.outPoint) {
            return makeResult(false, "Split time must be within layer in/out points");
        }

        app.beginUndoGroup("Railcut: Split Layer");

        try {
            var frameRate = comp.frameRate;

            // Snap split time to frame boundary
            var snappedSplitTime = snapToFrame(splitTime, frameRate);

            // Re-validate after snapping
            if (snappedSplitTime <= layer.inPoint || snappedSplitTime >= layer.outPoint) {
                return makeResult(false, "Split time must be within layer in/out points");
            }

            // Store original values
            var originalOutPoint = layer.outPoint;

            // Trim original layer to end at split point
            layer.outPoint = snappedSplitTime;

            // Duplicate the layer
            var newLayer = layer.duplicate();

            // Set new layer to start at split point
            newLayer.inPoint = snappedSplitTime;
            newLayer.outPoint = originalOutPoint;

            // Assign a new rcId to the duplicate so both halves have unique identities
            var splitNewRcId = "";
            try {
                var dupComment = newLayer.comment;
                splitNewRcId = generateRcId();
                if (dupComment && parseRcId(dupComment)) {
                    newLayer.comment = appendRcId(dupComment, splitNewRcId);
                } else {
                    newLayer.comment = (dupComment || "") + "\n[RC:" + splitNewRcId + "]";
                }
            } catch (erc) {}

        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify({ success: true, newRcId: splitNewRcId || null });

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Split multiple layers at a given time.
 * Processes highest index first to preserve indices during duplication.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @param {number} splitTime - Time to split at
 * @returns {string} JSON result with splitCount
 */
function splitLayersAtTime(layerIndicesJson, splitTime) {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ success: false, error: "No active composition" });

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) {
            return JSON.stringify({ success: false, error: "No layers specified" });
        }

        var frameRate = comp.frameRate;
        var snappedSplitTime = snapToFrame(splitTime, frameRate);

        // Sort descending (highest index first to preserve indices during duplication)
        layerIndices.sort(function(a, b) { return b - a; });

        app.beginUndoGroup("Railcut: Split Layers");

        try {
            var splitCount = 0;

            for (var i = 0; i < layerIndices.length; i++) {
                var layer = comp.layer(layerIndices[i]);
                if (!layer || layer.locked) continue;

                // Skip layers where playhead is outside their bounds
                if (snappedSplitTime <= layer.inPoint || snappedSplitTime >= layer.outPoint) continue;

                var originalOutPoint = layer.outPoint;

                // Trim original layer to end at split point
                layer.outPoint = snappedSplitTime;

                // Duplicate and set new layer to start at split point
                var newLayer = layer.duplicate();
                newLayer.inPoint = snappedSplitTime;
                newLayer.outPoint = originalOutPoint;

                // Give the duplicate a fresh rcId so both halves have unique
                // identities — otherwise useEnsureRcIds dedupes in a separate
                // undo group and the first Ctrl+Z only reverts the comment fix
                // instead of the whole split.
                try {
                    var dupComment = newLayer.comment;
                    if (dupComment && parseRcId(dupComment)) {
                        newLayer.comment = appendRcId(dupComment, generateRcId());
                    }
                } catch (erc) {}

                splitCount++;
            }

            return JSON.stringify({ success: true, splitCount: splitCount });

        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Join through edit: merge two adjacent clips from the same source back into one.
 * Extends the left clip's outPoint to cover the right clip, then removes the right clip.
 * @param {number} leftLayerIndex - 1-based index of the left clip
 * @param {number} rightLayerIndex - 1-based index of the right clip
 * @returns {string} JSON result
 */
function joinThroughEdit(leftLayerIndex, rightLayerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var leftLayer = comp.layer(leftLayerIndex);
        var rightLayer = comp.layer(rightLayerIndex);
        if (!leftLayer) return makeResult(false, "Left layer not found: " + leftLayerIndex);
        if (!rightLayer) return makeResult(false, "Right layer not found: " + rightLayerIndex);
        if (leftLayer.locked || rightLayer.locked) return makeResult(false, "One or both layers are locked");

        app.beginUndoGroup("Railcut: Join Through Edit");
        try {
            // Extend left clip to cover right clip's range
            leftLayer.outPoint = rightLayer.outPoint;

            // Remove the right clip
            rightLayer.remove();
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Resolve overlaps between a moved layer and other layers in the comp (overwrite mode).
 * Trims, splits, or deletes overlapping layers as needed.
 * @param {CompItem} comp - The composition
 * @param {Layer} movedLayer - The layer that was moved (used to get its index)
 * @param {number} movedIn - New inPoint of the moved layer
 * @param {number} movedOut - New outPoint of the moved layer
 * @param {number} frameRate - Comp frame rate
 * @param {Array} skipIndices - Layer indices to skip during overlap detection
 */
function resolveOverlaps(comp, movedLayer, movedIn, movedOut, frameRate, skipIndices, splitOutputs, movedTracksJson, otherTracksJson, additionalSkipRefs) {
    // Determine if the moved layer is component-specific (video-only or audio-only)
    var movedRole = null; // null = full A/V, "video" = video-only, "audio" = audio-only
    try {
        var movedComment = movedLayer.comment;
        if (movedComment) {
            var mc = parseLinkData(movedComment);
            if (mc && mc.rc_role) movedRole = mc.rc_role;
        }
    } catch (emc) {}
    // Also detect non-linked component-only layers (e.g., partial duplicates,
    // still images, silent footage). Use effective-visible / effective-audible
    // rather than just audioEnabled — a still image has no audio source but
    // audioEnabled defaults to true, so the old check misclassified it as A/V
    // and the A/V pre-split never ran.
    if (!movedRole) {
        var effVideo = movedLayer.hasVideo && movedLayer.enabled;
        var effAudio = movedLayer.hasAudio && movedLayer.audioEnabled;
        if (effVideo && !effAudio) movedRole = "video";
        else if (!effVideo && effAudio) movedRole = "audio";
    }

    // Parse optional track-info maps used to derive a per-target effective role
    // when the moved layer is a full A/V (movedRole == null). Without this, a
    // regular A/V moved vertically onto another regular A/V whose audio lives
    // on a different track gets the whole target trimmed — even though only
    // the video tracks actually overlap. With the maps, we promote the target
    // to a linked pair and trim only the matching role.
    var movedTracks = null;
    var otherTracks = null;
    if (movedTracksJson) {
        try { movedTracks = JSON.parse(movedTracksJson); } catch (emt) {}
    }
    if (otherTracksJson) {
        try { otherTracks = JSON.parse(otherTracksJson); } catch (eot) {}
    }

    // First pass: collect all overlapping layers
    var overlaps = [];
    // Collect layer references BEFORE iterating — A/V splits during the loop
    // add new layers which must not be processed (they're the non-overwritten components).
    var layerRefs = [];
    for (var lr = 1; lr <= comp.numLayers; lr++) {
        layerRefs.push(comp.layer(lr));
    }
    for (var i = 0; i < layerRefs.length; i++) {
        var otherLayer = layerRefs[i];

        // Skip the moved layer itself
        if (otherLayer.index === movedLayer.index) continue;

        // Skip locked layers
        if (otherLayer.locked) continue;

        // Skip layers on other tracks (passed by caller)
        if (isInArray(skipIndices, otherLayer.index)) continue;

        // Skip layers passed as ref-stable additional skips (e.g. group
        // members in a multi-layer move). Index-based skipIndices goes stale
        // once pre-splits earlier in the loop shift indices around; ref
        // equality survives those shifts.
        if (additionalSkipRefs) {
            var skippedByRef = false;
            for (var asr = 0; asr < additionalSkipRefs.length; asr++) {
                if (additionalSkipRefs[asr] === otherLayer) { skippedByRef = true; break; }
            }
            if (skippedByRef) continue;
        }

        // Only process editable layers (footage, precomp, solid, text, shape, adjustment)
        if (!isEditableLayer(otherLayer)) continue;

        var otherIn = otherLayer.inPoint;
        var otherOut = otherLayer.outPoint;

        // Check for overlap
        if (movedIn < otherOut && movedOut > otherIn) {
            // Check if the overlapped layer is already a linked pair component
            var otherRole = null;
            try {
                var otherLd = parseLinkData(otherLayer.comment);
                if (otherLd && otherLd.rc_role) otherRole = otherLd.rc_role;
            } catch (eor) {}

            // If both are component-specific and roles don't match, skip entirely
            // (e.g., audio component shouldn't overwrite a video-role layer)
            if (movedRole && otherRole && movedRole !== otherRole) continue;

            // Check if the overlapped layer is A/V and the moved layer is component-specific
            // Layers already split into linked pair components (otherRole set) are NOT A/V
            // Effective V/A presence — a layer with hasVideo but enabled=false
            // (e.g., the audio-only half of an unlinked A/V) shouldn't be
            // treated as having a live video side, otherwise pre-split would
            // resurrect a ghost video-role layer on the next reload.
            var otherHasVideo = otherLayer.hasVideo && otherLayer.enabled;
            var otherHasAudio = otherLayer.audioEnabled && (otherLayer.source && otherLayer.source.hasAudio);
            var otherIsAV = otherHasVideo && otherHasAudio && !otherRole;

            // Track-overlap gate: if the caller supplied track info and the
            // moved layer doesn't share either track with the other layer,
            // there can't be an actual overlap — skip regardless of otherIsAV.
            // This matters once earlier iterations of a group move have
            // pre-split a target into linked pair halves; the halves' tracks
            // may differ from the moved layer's even when their time ranges
            // still intersect.
            //
            // otherTracks is a snapshot taken BEFORE any iteration runs, so
            // for a layer that's been split into a linked pair half during a
            // prior iteration it still carries the pre-split (A/V) track info.
            // Use otherRole to mask the side the split removed: a V-role half
            // has no audio track anymore, an A-role half has no video track.
            var sharesV = false;
            var sharesA = false;
            var haveTrackInfo = false;
            var otherTrackInfo = null;
            if (movedTracks && otherTracks) {
                otherTrackInfo = otherTracks[String(otherLayer.index)];
                if (otherTrackInfo) {
                    haveTrackInfo = true;
                    var effOtherV = (otherRole === "audio") ? null : otherTrackInfo.v;
                    var effOtherA = (otherRole === "video") ? null : otherTrackInfo.a;
                    sharesV = movedTracks.v !== null && movedTracks.v !== undefined
                        && effOtherV !== null && effOtherV !== undefined
                        && movedTracks.v === effOtherV;
                    sharesA = movedTracks.a !== null && movedTracks.a !== undefined
                        && effOtherA !== null && effOtherA !== undefined
                        && movedTracks.a === effOtherA;
                    if (!sharesV && !sharesA) continue;
                }
            }

            // Capture parent V/A tracks so Case-4 (mid-split) can pin an
            // orphaned dup back to the parent's track. Without this, dups
            // auto-pack to V1/A1 on reload.
            var parentTracksForOverlap = null;
            if (otherTrackInfo) {
                parentTracksForOverlap = { v: otherTrackInfo.v, a: otherTrackInfo.a };
            }

            // Derive a per-target effective role when the moved layer is full A/V
            // (movedRole == null). If the moved and other layers share only the
            // video track, overlap is video-only; if only audio, audio-only; if
            // both, full A/V overwrite (no pre-split, existing behavior).
            var effectiveRole = movedRole;
            if (!effectiveRole && otherIsAV && haveTrackInfo) {
                if (sharesV && !sharesA) effectiveRole = "video";
                else if (sharesA && !sharesV) effectiveRole = "audio";
                // Both shared → full A/V trim (effectiveRole stays null).
            }

            // If moved layer is component-specific and overlapped is A/V, split first
            if (effectiveRole && otherIsAV) {
                var resolvedPair = promoteAVLayerToLinkedPair(otherLayer);
                // Track the split so callers can update track assignments.
                // Include parent V/A here so callers don't have to walk the
                // pre-shift index map — that walk breaks once Case-4 dups get
                // inserted above vRef and shift its index.
                if (splitOutputs) {
                    splitOutputs.push({
                        videoRef: resolvedPair.videoRole,
                        audioRef: resolvedPair.audioRole,
                        parentV: parentTracksForOverlap ? parentTracksForOverlap.v : null,
                        parentA: parentTracksForOverlap ? parentTracksForOverlap.a : null
                    });
                }

                if (effectiveRole === "video") {
                    // Only overwrite the video layer, skip the audio layer
                    overlaps.push({
                        layer: resolvedPair.videoRole,
                        index: resolvedPair.videoRole.index,
                        inPoint: otherIn,
                        outPoint: otherOut,
                        startTime: resolvedPair.videoRole.startTime,
                        parentTracks: parentTracksForOverlap
                    });
                } else {
                    // Only overwrite the audio layer, skip the video layer
                    overlaps.push({
                        layer: resolvedPair.audioRole,
                        index: resolvedPair.audioRole.index,
                        inPoint: otherIn,
                        outPoint: otherOut,
                        startTime: resolvedPair.audioRole.startTime,
                        parentTracks: parentTracksForOverlap
                    });
                }
            } else {
                overlaps.push({
                    layer: otherLayer,
                    index: otherLayer.index,
                    inPoint: otherIn,
                    outPoint: otherOut,
                    startTime: otherLayer.startTime,
                    parentTracks: parentTracksForOverlap
                });
            }
        }
    }

    // Second pass: resolve overlaps
    for (var j = 0; j < overlaps.length; j++) {
        var overlap = overlaps[j];
        var otherLayer = overlap.layer;
        var otherIn = overlap.inPoint;
        var otherOut = overlap.outPoint;

        // Case 1: Moved layer completely covers other layer - delete it
        if (movedIn <= otherIn && movedOut >= otherOut) {
            otherLayer.remove();
            continue;
        }

        // Case 2: Moved layer overlaps the END of other layer
        if (movedIn > otherIn && movedIn < otherOut && movedOut >= otherOut) {
            otherLayer.outPoint = snapToFrame(movedIn, frameRate);
            continue;
        }

        // Case 3: Moved layer overlaps the START of other layer
        if (movedOut > otherIn && movedOut < otherOut && movedIn <= otherIn) {
            var savedOut3 = otherLayer.outPoint;
            otherLayer.inPoint = snapToFrame(movedOut, frameRate);
            otherLayer.outPoint = savedOut3;
            continue;
        }

        // Case 4: Moved layer is in the MIDDLE of other layer - split it
        if (movedIn > otherIn && movedOut < otherOut) {
            var originalOutPoint = otherOut;
            otherLayer.outPoint = snapToFrame(movedIn, frameRate);
            var dupLayer = otherLayer.duplicate();
            dupLayer.inPoint = snapToFrame(movedOut, frameRate);
            dupLayer.outPoint = originalOutPoint;
            try {
                var splitComment = otherLayer.comment;
                if (splitComment) {
                    var splitLd = parseLinkData(splitComment);
                    if (splitLd && splitLd.rc_link) {
                        // Parent is a linked-pair component (e.g. video-role of
                        // a pre-split A/V). The dup inherits rc_link verbatim,
                        // but the opposite-role partner can only sensibly link
                        // to one half. Orphan the dup so the partner stays
                        // linked to the earlier half (matches bladeOneComponent's
                        // "prefer left" convention).
                        orphanDuplicatedLayer(dupLayer);
                        // Tell the caller to pin the orphaned dup to the parent's
                        // track on the TS side — without this it auto-packs to V1/A1.
                        if (splitOutputs && splitLd.rc_role) {
                            splitOutputs.push({
                                case4Dup: dupLayer,
                                role: splitLd.rc_role,
                                parentV: overlap.parentTracks ? overlap.parentTracks.v : null,
                                parentA: overlap.parentTracks ? overlap.parentTracks.a : null
                            });
                        }
                    } else {
                        // Preserve link metadata on the split duplicate, but
                        // assign a NEW rcId so the two halves have unique
                        // identities (prevents XMP key collision and stops the
                        // lazy dedup effect from modifying comments outside
                        // undo groups).
                        dupLayer.comment = appendRcId(splitComment, generateRcId());
                        // Pin to parent V/A tracks. Without a pin a full-A/V
                        // dup auto-packs to V1/A1 on reload.
                        if (splitOutputs && overlap.parentTracks) {
                            splitOutputs.push({
                                case4Dup: dupLayer,
                                role: "av",
                                parentV: overlap.parentTracks.v,
                                parentA: overlap.parentTracks.a
                            });
                        }
                    }
                }
            } catch (esc) {}
        }
    }
}

/**
 * Insert-shift move (shuffle edit): move a clip backward in time, splitting the
 * overlapping clip at the insertion point and shifting everything between the
 * insertion and original position forward by the clip's duration.
 * @param {number} layerIndex - 1-based layer index of the layer being moved
 * @param {number} timeOffset - Amount to shift in seconds (must be negative for backward)
 * @param {string} skipIndicesJson - JSON array of layer indices on other tracks (skip them)
 * @returns {string} JSON result with optional indexMap
 */
function moveLayerWithInsertShift(layerIndex, timeOffset, skipIndicesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        var skipIndices = [];
        if (skipIndicesJson) {
            skipIndices = JSON.parse(skipIndicesJson);
        }

        var frameRate = comp.frameRate;
        var snappedOffset = snapToFrame(timeOffset, frameRate);
        if (snappedOffset >= 0) {
            return makeResult(false, "Insert-shift only works for backward moves");
        }

        var origIn = layer.inPoint;
        var origOut = layer.outPoint;
        var clipDuration = origOut - origIn;
        var newIn = snapToFrame(origIn + snappedOffset, frameRate);
        var newOut = snapToFrame(origOut + snappedOffset, frameRate);

        if (newIn < 0) {
            var adj = -newIn;
            newIn = 0;
            newOut = snapToFrame(newOut + adj, frameRate);
            snappedOffset = newIn - origIn;
        }

        var halfFrame = 0.5 / frameRate;

        app.beginUndoGroup("Railcut: Insert-Shift Move");
        try {
            // Step 1: Split any clip that spans the insertion point (newIn)
            // Iterate backward since splitting adds layers
            for (var i = comp.numLayers; i >= 1; i--) {
                var other = comp.layer(i);
                if (other.index === layer.index) continue;
                if (other.locked) continue;
                if (isInArray(skipIndices, other.index)) continue;
                if (!isEditableLayer(other)) continue;

                if (other.inPoint < newIn - halfFrame && other.outPoint > newIn + halfFrame) {
                    // Split: trim original to end at newIn, duplicate gets newIn to original out
                    var savedOut = other.outPoint;
                    other.outPoint = snapToFrame(newIn, frameRate);
                    var dup = other.duplicate();
                    dup.inPoint = snapToFrame(newIn, frameRate);
                    dup.outPoint = savedOut;
                    // Assign new rcId to duplicate so both halves have unique identities
                    try {
                        var dc = dup.comment;
                        if (dc && parseRcId(dc)) dup.comment = appendRcId(dc, generateRcId());
                    } catch (erc2) {}
                }
            }

            // Step 2: Shift all same-track clips in the "shuffle zone"
            // (clips whose inPoint is >= newIn and < origIn, excluding the moved layer)
            for (var j = 1; j <= comp.numLayers; j++) {
                var shiftLayer = comp.layer(j);
                if (shiftLayer.index === layer.index) continue;
                if (shiftLayer.locked) continue;
                if (isInArray(skipIndices, shiftLayer.index)) continue;
                if (!isEditableLayer(shiftLayer)) continue;

                if (shiftLayer.inPoint >= newIn - halfFrame && shiftLayer.inPoint < origIn - halfFrame) {
                    shiftLayer.startTime += clipDuration;
                }
            }

            // Step 3: Move the dragged layer to the new position
            layer.startTime = layer.startTime + snappedOffset;

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Multi-clip insert-shift (shuffle edit) for backward moves.
 * Moves a group of layers backward as a unit, splitting any clip that spans
 * the insertion point and shifting clips within the shuffle zone forward by
 * the group's total duration.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices in the group
 * @param {number} timeOffset - Amount to shift in seconds (must be negative)
 * @param {string} skipIndicesJson - JSON array of additional layer indices to skip
 * @returns {string} JSON result
 */
function moveLayersAsGroupWithInsertShift(layerIndicesJson, timeOffset, skipIndicesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) {
            return makeResult(false, "No layer indices provided");
        }

        var skipIndices = [];
        if (skipIndicesJson) {
            skipIndices = JSON.parse(skipIndicesJson);
        }

        var frameRate = comp.frameRate;
        var snappedOffset = snapToFrame(timeOffset, frameRate);
        if (snappedOffset >= 0) {
            return makeResult(false, "Insert-shift only works for backward moves");
        }

        // Validate all group layers exist and compute group span
        var groupLayers = [];
        var minIn = Infinity;
        var maxOut = -Infinity;
        for (var gi = 0; gi < layerIndices.length; gi++) {
            var idx = layerIndices[gi];
            var gcheck = getLayerChecked(comp, idx, true);
            if (gcheck.error) return makeResult(false, gcheck.error);
            var gl = gcheck.layer;
            groupLayers.push(gl);
            if (gl.inPoint < minIn) minIn = gl.inPoint;
            if (gl.outPoint > maxOut) maxOut = gl.outPoint;
        }

        var origIn = minIn;
        var groupDuration = maxOut - minIn;
        var newIn = snapToFrame(origIn + snappedOffset, frameRate);

        if (newIn < 0) {
            var adj = -newIn;
            newIn = 0;
            snappedOffset = newIn - origIn;
        }

        var halfFrame = 0.5 / frameRate;

        // Group members are always skipped during split + shift passes
        var allSkip = {};
        for (var sk = 0; sk < skipIndices.length; sk++) {
            allSkip[skipIndices[sk]] = true;
        }
        for (var gm = 0; gm < groupLayers.length; gm++) {
            allSkip[groupLayers[gm].index] = true;
        }

        app.beginUndoGroup("Railcut: Insert-Shift Move (Group)");
        try {
            // Step 1: Split any clip that spans the insertion point (newIn).
            // Iterate backward since splitting adds layers.
            for (var i = comp.numLayers; i >= 1; i--) {
                var other = comp.layer(i);
                if (allSkip[other.index]) continue;
                if (other.locked) continue;
                if (!isEditableLayer(other)) continue;

                if (other.inPoint < newIn - halfFrame && other.outPoint > newIn + halfFrame) {
                    var savedOut = other.outPoint;
                    other.outPoint = snapToFrame(newIn, frameRate);
                    var dup = other.duplicate();
                    dup.inPoint = snapToFrame(newIn, frameRate);
                    dup.outPoint = savedOut;
                    try {
                        var dc = dup.comment;
                        if (dc && parseRcId(dc)) dup.comment = appendRcId(dc, generateRcId());
                    } catch (erc2) {}
                }
            }

            // Step 2: Shift all clips in the shuffle zone
            // (inPoint >= newIn and < origIn, excluding group + caller skips)
            for (var j = 1; j <= comp.numLayers; j++) {
                var shiftLayer = comp.layer(j);
                if (allSkip[shiftLayer.index]) continue;
                if (shiftLayer.locked) continue;
                if (!isEditableLayer(shiftLayer)) continue;

                if (shiftLayer.inPoint >= newIn - halfFrame && shiftLayer.inPoint < origIn - halfFrame) {
                    shiftLayer.startTime += groupDuration;
                }
            }

            // Step 3: Move all group layers by snappedOffset
            for (var gj = 0; gj < groupLayers.length; gj++) {
                groupLayers[gj].startTime = groupLayers[gj].startTime + snappedOffset;
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Move a layer and resolve overlaps with other clips (overwrite mode)
 * This mimics Premiere's behavior where the moved clip overwrites anything in its way
 * @param {number} layerIndex - 1-based layer index of the layer being moved
 * @param {number} timeOffset - Amount to shift in seconds
 * @param {string} skipIndicesJson - JSON array of layer indices to skip during overlap detection
 * @returns {string} JSON result
 */
/**
 * Inner body of moveLayerWithOverwrite, factored out so it can be reused
 * inside a larger undo group (e.g. by moveLayerWithOverwriteAndJLSplit).
 * Caller is responsible for app.beginUndoGroup / app.endUndoGroup.
 *
 * Returns { indexMap, splitLayers } for the result envelope.
 */
function _performMoveWithOverwrite(comp, layer, timeOffset, skipIndices, skipRefs, trackAssignmentsJson, movedTracksJson, otherTracksJson) {
    var frameRate = comp.frameRate;
    var snappedOffset = snapToFrame(timeOffset, frameRate);
    var newStartTime = layer.startTime + snappedOffset;
    var newInPoint = layer.inPoint + snappedOffset;
    var newOutPoint = layer.outPoint + snappedOffset;

    if (newInPoint < 0) {
        var adjustment = -newInPoint;
        newStartTime += adjustment;
        newInPoint = 0;
        newOutPoint += adjustment;
    }

    newStartTime = snapToFrame(newStartTime, frameRate);
    newInPoint = snapToFrame(newInPoint, frameRate);
    newOutPoint = snapToFrame(newOutPoint, frameRate);

    layer.startTime = newStartTime;
    layer.inPoint = newInPoint;
    layer.outPoint = newOutPoint;

    var mwoVideoTracks = otherTracksJson ? JSON.parse(otherTracksJson) : null;
    var mwoSplits = [];
    resolveOverlaps(comp, layer, newInPoint, newOutPoint, frameRate, skipIndices, mwoSplits, movedTracksJson, otherTracksJson, skipRefs);

    var mwoSplitInfos = [];
    for (var spi = 0; spi < mwoSplits.length; spi++) {
        var split = mwoSplits[spi];
        if (split.case4Dup) {
            try {
                var rcIdC4 = parseRcId(split.case4Dup.comment) || null;
                if (split.role === "av") {
                    if (split.parentV != null) {
                        mwoSplitInfos.push({
                            rcId: rcIdC4, linkRole: "video",
                            parentVideoTrack: split.parentV,
                            parentAudioTrack: null
                        });
                    }
                    if (split.parentA != null) {
                        mwoSplitInfos.push({
                            rcId: rcIdC4, linkRole: "audio",
                            parentVideoTrack: null,
                            parentAudioTrack: split.parentA
                        });
                    }
                } else {
                    mwoSplitInfos.push({
                        rcId: rcIdC4,
                        linkRole: split.role,
                        parentVideoTrack: split.role === "video" ? split.parentV : null,
                        parentAudioTrack: split.role === "audio" ? split.parentA : null
                    });
                }
            } catch (ignoreCd) {}
            continue;
        }
        var vRef = split.videoRef;
        var aRef = split.audioRef;
        var parentV = (split.parentV !== undefined) ? split.parentV : null;
        var parentA = (split.parentA !== undefined) ? split.parentA : null;
        if ((parentV === null || parentA === null) && mwoVideoTracks) {
            for (var ak in mwoVideoTracks) {
                try {
                    if (comp.layer(parseInt(ak, 10)) === vRef) {
                        var entry = mwoVideoTracks[ak];
                        if (entry) {
                            if (parentV === null && entry.v != null) parentV = entry.v;
                            if (parentA === null && entry.a != null) parentA = entry.a;
                        }
                        break;
                    }
                } catch (eMwo) {}
            }
        }
        try {
            mwoSplitInfos.push({
                rcId: parseRcId(vRef.comment) || null,
                linkRole: "video",
                parentVideoTrack: parentV,
                parentAudioTrack: parentA
            });
            mwoSplitInfos.push({
                rcId: parseRcId(aRef.comment) || null,
                linkRole: "audio",
                parentVideoTrack: parentV,
                parentAudioTrack: parentA
            });
        } catch (ignoreMwo) {}
    }

    var indexMap = null;
    if (trackAssignmentsJson) {
        indexMap = reorderLayersInPlace(comp, trackAssignmentsJson);
    }

    return { indexMap: indexMap, splitLayers: mwoSplitInfos };
}

function moveLayerWithOverwrite(layerIndex, timeOffset, skipIndicesJson, trackAssignmentsJson, movedTracksJson, otherTracksJson, visibilityJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        // Parse skip indices (layers on other tracks that should not be overwritten)
        var skipIndices = [];
        if (skipIndicesJson) {
            skipIndices = JSON.parse(skipIndicesJson);
        }
        // Resolve to refs BEFORE any pre-split shifts indices. Pass these to
        // resolveOverlaps as ref-based skips so the gate doesn't fail when a
        // pre-split during the loop bumps a skipped layer's index.
        var skipRefs = [];
        for (var sii = 0; sii < skipIndices.length; sii++) {
            try { skipRefs.push(comp.layer(skipIndices[sii])); } catch (eSkip) {}
        }

        app.beginUndoGroup("Railcut: Move with Overwrite");

        var moveResult;
        try {
            moveResult = _performMoveWithOverwrite(comp, layer, timeOffset, skipIndices, skipRefs, trackAssignmentsJson, movedTracksJson, otherTracksJson);
            // Track audibility / visibility sync (same undo step as the move)
            applyVisibilityChanges(comp, visibilityJson);
        } finally {
            app.endUndoGroup();
        }

        var resultObj = { success: true };
        if (moveResult.indexMap) resultObj.indexMap = moveResult.indexMap;
        if (moveResult.splitLayers && moveResult.splitLayers.length > 0) resultObj.splitLayers = moveResult.splitLayers;
        return JSON.stringify(resultObj);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}


/**
 * Reorder a layer to a new position in the layer stack
 * @param {number} layerIndex - Current 1-based layer index
 * @param {number} targetIndex - Target 1-based layer index
 * @returns {string} JSON result with new index
 */
function reorderLayer(layerIndex, targetIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        // Clamp target to valid range
        if (targetIndex < 1) targetIndex = 1;
        if (targetIndex > comp.numLayers) targetIndex = comp.numLayers;

        // No change needed
        if (targetIndex === layerIndex) {
            return JSON.stringify({ success: true, newIndex: layerIndex });
        }

        app.beginUndoGroup("Railcut: Reorder Layer");

        try {
            // AE's moveBefore/moveAfter work relative to other layers
            if (targetIndex < layerIndex) {
                // Moving up in stack (lower index = higher in stack)
                var targetLayer = comp.layer(targetIndex);
                layer.moveBefore(targetLayer);
            } else {
                // Moving down in stack
                var targetLayer = comp.layer(targetIndex);
                layer.moveAfter(targetLayer);
            }

            // Return the new index (layer object's index updates after move)
            return JSON.stringify({ success: true, newIndex: layer.index });

        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Move multiple layers by the same time offset as a single operation.
 * All layers move together in one undo group.
 * Optionally reorders layers by track and time within the same undo group.
 *
 * @param {string} layerIndicesJson - JSON array of layer indices to move
 * @param {number} timeOffset - Time offset in seconds (positive = forward, negative = backward)
 * @param {string} trackAssignmentsJson - Optional JSON object mapping layer indices to track numbers for reordering
 * @returns {string} JSON result with success status and optional indexMap
 */
function moveLayersAsGroup(layerIndicesJson, timeOffset, perLayerSkipJson, trackAssignmentsJson, audioTrackAssignmentsJson, autoSplitMapJson, visibilityJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) {
            return JSON.stringify({ success: false, error: "No layers specified" });
        }

        // Parse per-layer skip indices: { "layerIndex": [skipIdx1, skipIdx2, ...], ... }
        var perLayerSkip = null;
        if (perLayerSkipJson) {
            perLayerSkip = JSON.parse(perLayerSkipJson);
        }

        // Parse auto-split map (layerIndex → 'video' | 'audio'). Each entry is
        // a partial-lock A/V where the named side is the unlocked role we want
        // to move. promoteAVLayerToLinkedPair leaves the original layer ref as
        // that role; the dup (opposite role) sits at original timing.
        var autoSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: Move Layers");

        try {
            var frameRate = comp.frameRate;

            // Snap offset to frame boundary
            var snappedOffset = snapToFrame(timeOffset, frameRate);

            // Collect all layers first to validate them
            var layers = [];
            for (var i = 0; i < layerIndices.length; i++) {
                var layer = comp.layer(layerIndices[i]);
                if (!layer) {
                    return JSON.stringify({ success: false, error: "Layer not found: " + layerIndices[i] });
                }
                if (layer.locked) {
                    return JSON.stringify({ success: false, error: "Layer is locked: " + layerIndices[i] });
                }
                layers.push(layer);
            }

            // Auto-split partial-lock A/V members of the group BEFORE the
            // move runs. We have refs already (layers[]), and refs survive
            // index shifts caused by promote(), so the rest of the function
            // can operate on the same refs without re-fetching.
            if (autoSplitMap) {
                for (var asi = 0; asi < layerIndices.length; asi++) {
                    var asRole = autoSplitMap[String(layerIndices[asi])];
                    if (asRole === "video" || asRole === "audio") {
                        try {
                            promoteAVLayerToLinkedPair(layers[asi], { originalRole: asRole });
                        } catch (eAs) {}
                    }
                }
            }

            // Move all layers by the same offset
            var movedPositions = [];
            for (var j = 0; j < layers.length; j++) {
                var layer = layers[j];
                var newStartTime = layer.startTime + snappedOffset;
                var newInPoint = layer.inPoint + snappedOffset;
                var newOutPoint = layer.outPoint + snappedOffset;

                // Clamp to not go before 0
                if (newInPoint < 0) {
                    var adjustment = -newInPoint;
                    newStartTime += adjustment;
                    newInPoint = 0;
                    newOutPoint += adjustment;
                }

                // Snap all timing values to frame boundaries
                newStartTime = snapToFrame(newStartTime, frameRate);
                newInPoint = snapToFrame(newInPoint, frameRate);
                newOutPoint = snapToFrame(newOutPoint, frameRate);

                // Apply the move
                layer.startTime = newStartTime;
                layer.inPoint = newInPoint;
                layer.outPoint = newOutPoint;

                movedPositions.push({ layer: layer, inPoint: newInPoint, outPoint: newOutPoint });
            }

            // Pre-resolve perLayerSkip indices to layer REFERENCES before any
            // overlaps run. resolveOverlaps may insert/remove layers, shifting indices.
            // By storing references we can rebuild accurate skip indices each iteration.
            var perLayerSkipRefs = {};
            if (perLayerSkip) {
                for (var pk in perLayerSkip) {
                    var skipArr = perLayerSkip[pk];
                    var refs = [];
                    for (var ps = 0; ps < skipArr.length; ps++) {
                        try { refs.push(comp.layer(skipArr[ps])); } catch (e) {}
                    }
                    perLayerSkipRefs[pk] = refs;
                }
            }

            // Parse track-assignment JSONs (keyed by pre-insert index).
            var groupVideoTracks = trackAssignmentsJson ? JSON.parse(trackAssignmentsJson) : null;
            var groupAudioTracks = audioTrackAssignmentsJson ? JSON.parse(audioTrackAssignmentsJson) : null;

            // groupVideoTracks comes from buildCombinedTrackAssignments on the
            // TS side: positive numbers = video tracks; values < -1000 are
            // audio-only layers encoded as -audioTrack-1000 (the encoding
            // makes the reorder pass sort audio-only layers below all video
            // layers). For the moved-layer/other-tracks structures consumed
            // by resolveOverlaps, we need to decode that back into a clean
            // {v, a} pair so the share check compares actual track numbers.
            //
            // Without this decode, an audio-only moved layer carries v=-1002
            // (its post-move audio encoding) into resolveOverlaps, which then
            // fails to match the target's V1 video track AND fails to match
            // the target's audio track (because groupAudioTracks for the
            // moved layer reflects PRE-move state, not post-move). Result:
            // resolveOverlaps skips the target entirely, no split, no
            // overwrite — but the reorder still places the moved audio on
            // top of the target's audio, and packTracks escalates the
            // unresolved overlap to a different track on the next reload.
            function decodeTracks(idx) {
                var gvt = groupVideoTracks ? groupVideoTracks[String(idx)] : undefined;
                var gat = groupAudioTracks ? groupAudioTracks[String(idx)] : undefined;
                var v = null;
                var a = null;
                if (typeof gvt === "number") {
                    if (gvt < -1000) {
                        // Audio-only encoding
                        a = -gvt - 1000;
                    } else {
                        v = gvt;
                    }
                }
                if (a === null && typeof gat === "number") {
                    a = gat;
                }
                return { v: v, a: a };
            }

            // Snapshot every layer's ref + its V/A tracks BEFORE any overlap
            // resolution runs. Each resolveOverlaps call can split layers,
            // shifting indices for subsequent iterations — refs are stable so
            // we walk the snapshot and use ref.index (current) to build
            // otherTracksObj per iteration.
            var trackSnapshots = [];
            if (groupVideoTracks || groupAudioTracks) {
                for (var sn = 1; sn <= comp.numLayers; sn++) {
                    var snLayer = comp.layer(sn);
                    var snTracks = decodeTracks(sn);
                    trackSnapshots.push({
                        ref: snLayer,
                        origIdx: sn,
                        v: snTracks.v,
                        a: snTracks.a
                    });
                }
            }

            // Resolve overlaps per layer, each with its own skip set
            var allSplits = [];
            for (var k = 0; k < movedPositions.length; k++) {
                var layerIdx = layerIndices[k];

                // Rebuild skip indices from stored references using CURRENT indices.
                // Try/catch around .index because earlier iterations may have
                // deleted some skipRefs (e.g. when the target is a linked-pair
                // half that gets overwritten in iter 1, its ref is still in
                // iter 2's skipRefs but layer.index throws on deleted layers).
                var skipIndices = [];
                var skipRefs = perLayerSkipRefs[String(layerIdx)];
                if (skipRefs) {
                    for (var sr = 0; sr < skipRefs.length; sr++) {
                        try {
                            var curSkipIdx = skipRefs[sr].index;
                            if (!isInArray(skipIndices, curSkipIdx)) {
                                skipIndices.push(curSkipIdx);
                            }
                        } catch (eSkipDel) { /* layer deleted by an earlier iteration */ }
                    }
                }
                // Group members always skipped — use CURRENT indices
                for (var si = 0; si < layers.length; si++) {
                    var curIdx = layers[si].index;
                    if (!isInArray(skipIndices, curIdx)) {
                        skipIndices.push(curIdx);
                    }
                }

                // Build movedTracks + otherTracks for this iteration using
                // CURRENT indices (rebuilt fresh so earlier pre-splits don't
                // leave stale index→track entries).
                var groupMovedTracksJson = null;
                var groupOtherTracksJson = null;
                if (trackSnapshots.length > 0) {
                    // Use decodeTracks so audio-only moved layers report
                    // {v: null, a: targetAudioTrack} instead of the raw
                    // -audioTrack-1000 encoding from the combined map.
                    var movedTracksObj = decodeTracks(layerIdx);
                    groupMovedTracksJson = JSON.stringify(movedTracksObj);
                    var otherTracksObj = {};
                    for (var ts = 0; ts < trackSnapshots.length; ts++) {
                        var snap = trackSnapshots[ts];
                        try {
                            var curIdxSn = snap.ref.index;
                            otherTracksObj[String(curIdxSn)] = { v: snap.v, a: snap.a };
                        } catch (eSnap) { /* ref deleted */ }
                    }
                    groupOtherTracksJson = JSON.stringify(otherTracksObj);
                }

                var splitsBefore = allSplits.length;
                resolveOverlaps(
                    comp, movedPositions[k].layer,
                    movedPositions[k].inPoint, movedPositions[k].outPoint,
                    frameRate, skipIndices, allSplits,
                    groupMovedTracksJson, groupOtherTracksJson,
                    layers
                );
                // Register newly-created pre-split halves in trackSnapshots so
                // subsequent iterations can find their parent V/A tracks via
                // current-index lookup. Without this, iter 2's case-4 on a
                // pre-split half pushes a case4Dup with parentV/A=null → no
                // pin → audio drops to A1.
                for (var ns = splitsBefore; ns < allSplits.length; ns++) {
                    var newSplit = allSplits[ns];
                    if (newSplit.case4Dup) continue;
                    if (newSplit.videoRef && newSplit.parentV !== undefined && newSplit.parentV !== null) {
                        trackSnapshots.push({
                            ref: newSplit.videoRef,
                            origIdx: -1,
                            v: newSplit.parentV,
                            a: null
                        });
                    }
                    if (newSplit.audioRef && newSplit.parentA !== undefined && newSplit.parentA !== null) {
                        trackSnapshots.push({
                            ref: newSplit.audioRef,
                            origIdx: -1,
                            v: null,
                            a: newSplit.parentA
                        });
                    }
                }
            }

            // Resolve each pre-split pair's parent tracks once — reused for
            // both the reorder assignment map and the splitLayers return.
            // Case-4 orphaned dups (split.case4Dup) come through as separate
            // entries with parent tracks already resolved.
            var splitParents = []; // [{ vRef, aRef, parentV, parentA }]
            var case4Orphans = []; // [{ layer, role, parentV, parentA }]
            if (allSplits.length > 0) {
                var parentVideoMap = trackAssignmentsJson ? JSON.parse(trackAssignmentsJson) : {};
                var parentAudioMap = audioTrackAssignmentsJson ? JSON.parse(audioTrackAssignmentsJson) : {};
                for (var sp = 0; sp < allSplits.length; sp++) {
                    var split = allSplits[sp];
                    if (split.case4Dup) {
                        case4Orphans.push({
                            layer: split.case4Dup,
                            role: split.role,
                            parentV: split.parentV,
                            parentA: split.parentA
                        });
                        continue;
                    }
                    var vRef = split.videoRef;
                    var aRef = split.audioRef;
                    // Prefer parents embedded by resolveOverlaps — robust
                    // against index shifts from Case-4 dups. Fall back to the
                    // pre-shift index walk only when missing.
                    var parentVideoTrack = (split.parentV !== undefined) ? split.parentV : null;
                    var parentAudioTrack = (split.parentA !== undefined) ? split.parentA : null;
                    if (parentVideoTrack === null || parentAudioTrack === null) {
                        for (var ak in parentVideoMap) {
                            try {
                                if (comp.layer(parseInt(ak, 10)) === vRef) {
                                    var tv = parentVideoMap[ak];
                                    if (parentVideoTrack === null && tv >= 0) parentVideoTrack = tv;
                                    var atv = parentAudioMap[ak];
                                    if (parentAudioTrack === null && atv !== undefined) parentAudioTrack = atv;
                                    break;
                                }
                            } catch (espc) {}
                        }
                    }
                    splitParents.push({
                        vRef: vRef, aRef: aRef,
                        parentV: parentVideoTrack, parentA: parentAudioTrack
                    });
                }
            }

            // If track assignments provided, reorder layers within the same undo group
            var indexMap = null;
            if (trackAssignmentsJson) {
                // Add split layers to the assignment map so they get reordered correctly.
                if (splitParents.length > 0 || case4Orphans.length > 0) {
                    var assignments = JSON.parse(trackAssignmentsJson);
                    for (var sp2 = 0; sp2 < splitParents.length; sp2++) {
                        var spMap = splitParents[sp2];
                        if (spMap.parentV !== null) {
                            assignments[String(spMap.vRef.index)] = spMap.parentV;
                        }
                        if (spMap.parentA !== null) {
                            assignments[String(spMap.aRef.index)] = -(spMap.parentA + 1000);
                        }
                    }
                    for (var co = 0; co < case4Orphans.length; co++) {
                        var orphan = case4Orphans[co];
                        try {
                            // Full A/V (role==="av") sits on its V track in the stack.
                            if ((orphan.role === "av" || orphan.role === "video") && orphan.parentV !== null) {
                                assignments[String(orphan.layer.index)] = orphan.parentV;
                            } else if (orphan.role === "audio" && orphan.parentA !== null) {
                                assignments[String(orphan.layer.index)] = -(orphan.parentA + 1000);
                            }
                        } catch (eOrAs) {}
                    }
                    trackAssignmentsJson = JSON.stringify(assignments);
                }
                indexMap = reorderLayersInPlace(comp, trackAssignmentsJson);
            }

            // Collect split layer info for TypeScript to set XMP pins. Include
            // each parent's original V/A tracks so the TS side can pin the new
            // halves without having to guess from the moved-layer context.
            var splitLayerInfos = [];
            for (var spi = 0; spi < splitParents.length; spi++) {
                var spInfo = splitParents[spi];
                try {
                    splitLayerInfos.push({
                        rcId: parseRcId(spInfo.vRef.comment) || null,
                        linkRole: "video",
                        parentVideoTrack: spInfo.parentV,
                        parentAudioTrack: spInfo.parentA
                    });
                    splitLayerInfos.push({
                        rcId: parseRcId(spInfo.aRef.comment) || null,
                        linkRole: "audio",
                        parentVideoTrack: spInfo.parentV,
                        parentAudioTrack: spInfo.parentA
                    });
                } catch (ignore) {}
            }
            for (var co2 = 0; co2 < case4Orphans.length; co2++) {
                var orphan2 = case4Orphans[co2];
                try {
                    var rcIdOr = parseRcId(orphan2.layer.comment) || null;
                    if (orphan2.role === "av") {
                        if (orphan2.parentV != null) {
                            splitLayerInfos.push({
                                rcId: rcIdOr, linkRole: "video",
                                parentVideoTrack: orphan2.parentV,
                                parentAudioTrack: null
                            });
                        }
                        if (orphan2.parentA != null) {
                            splitLayerInfos.push({
                                rcId: rcIdOr, linkRole: "audio",
                                parentVideoTrack: null,
                                parentAudioTrack: orphan2.parentA
                            });
                        }
                    } else {
                        splitLayerInfos.push({
                            rcId: rcIdOr,
                            linkRole: orphan2.role,
                            parentVideoTrack: orphan2.role === "video" ? orphan2.parentV : null,
                            parentAudioTrack: orphan2.role === "audio" ? orphan2.parentA : null
                        });
                    }
                } catch (ignoreOr) {}
            }

            // Track-visibility sync (same undo step as the move)
            applyVisibilityChanges(comp, visibilityJson);

            if (indexMap || splitLayerInfos.length > 0) {
                var result = { success: true };
                if (indexMap) result.indexMap = indexMap;
                if (splitLayerInfos.length > 0) result.splitLayers = splitLayerInfos;
                return JSON.stringify(result);
            }
            return JSON.stringify({ success: true });
        } finally {
            app.endUndoGroup();
        }
    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Reorder all managed layers so that:
 * 1. Higher tracks are above lower tracks in the layer stack
 * 2. Within a track, later clips (by inPoint) are above earlier clips
 *
 * @param {string} trackAssignmentsJson - JSON object mapping layer indices to track numbers
 * @returns {string} JSON result with indexMap showing old->new index mappings
 */
function reorderLayersByTrackAndTime(trackAssignmentsJson, visibilityJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ success: false, error: "No active composition" });

        app.beginUndoGroup("Railcut: Reorder by Track");

        try {
            var indexMap = reorderLayersInPlace(comp, trackAssignmentsJson);
            // Bump a version counter in comp.comment to ensure AE registers an undoable
            // change AND the poll fingerprint differs (comp comment is hashed in nameHash).
            // Without this, vertical-only moves that don't change layer order produce
            // an empty undo group that AE discards, and the poll can't detect the change.
            var cmnt = comp.comment || "";
            var vMatch = cmnt.match(/\[RCV:(\d+)\]/);
            var ver = vMatch ? parseInt(vMatch[1], 10) + 1 : 1;
            comp.comment = cmnt.replace(/\[RCV:\d+\]/, "") + "[RCV:" + ver + "]";
            // Track-visibility sync (same undo step as the reorder)
            applyVisibilityChanges(comp, visibilityJson);
            return JSON.stringify({ success: true, indexMap: indexMap });
        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Move a layer horizontally in time AND vertically to a new track (layer stack position)
 * @param {number} layerIndex - Current 1-based layer index
 * @param {number} timeOffset - Time offset in seconds (horizontal movement)
 * @param {number} targetTrackIndex - Target track (1-based, corresponds to layer index)
 * @param {string} skipIndicesJson - JSON array of layer indices to skip during overlap detection
 * @returns {string} JSON result
 */
function moveLayerToTrack(layerIndex, timeOffset, targetTrackIndex, skipIndicesJson, trackAssignmentsJson, movedTracksJson, otherTracksJson, visibilityJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ success: false, error: "No active composition" });
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return JSON.stringify({ success: false, error: check.error });
        var layer = check.layer;

        // Parse skip indices (layers on other tracks that should not be overwritten)
        var skipIndices = [];
        if (skipIndicesJson) {
            skipIndices = JSON.parse(skipIndicesJson);
        }

        // Parse optional track-info maps for per-target effective-role
        // derivation (see resolveOverlaps for the full comment). Lets us
        // pre-split A/V targets when the overlap is only on one track.
        var movedTracks = null;
        var otherTracks = null;
        if (movedTracksJson) {
            try { movedTracks = JSON.parse(movedTracksJson); } catch (emt) {}
        }
        if (otherTracksJson) {
            try { otherTracks = JSON.parse(otherTracksJson); } catch (eot) {}
        }

        // Determine moved layer's explicit role (linked pair or single-component source).
        var movedRole = null;
        try {
            var movedComment = layer.comment;
            if (movedComment) {
                var mLd = parseLinkData(movedComment);
                if (mLd && mLd.rc_role) movedRole = mLd.rc_role;
            }
        } catch (eMr) {}
        if (!movedRole) {
            var mEffVideo = layer.hasVideo && layer.enabled;
            var mEffAudio = layer.hasAudio && layer.audioEnabled;
            if (mEffVideo && !mEffAudio) movedRole = "video";
            else if (!mEffVideo && mEffAudio) movedRole = "audio";
        }

        app.beginUndoGroup("Railcut: Move Layer to Track");

        try {
            var frameRate = comp.frameRate;

            // Clamp target track to valid range
            if (targetTrackIndex < 1) targetTrackIndex = 1;
            if (targetTrackIndex > comp.numLayers) targetTrackIndex = comp.numLayers;

            // Pre-collect layer references for final reorder BEFORE overwrite
            // (overwrite may delete/split layers, shifting indices — layer refs survive)
            var managedLayers = [];
            if (trackAssignmentsJson) {
                var trackAssignments = JSON.parse(trackAssignmentsJson);
                for (var m = 1; m <= comp.numLayers; m++) {
                    var ml = comp.layer(m);
                    var tn = trackAssignments[String(m)];
                    if (tn !== undefined) {
                        managedLayers.push({
                            layer: ml,
                            originalIndex: m,
                            track: tn,
                            inPoint: ml.inPoint
                        });
                    }
                }
            }

            // Step 3: Apply time offset (horizontal move) if significant
            if (Math.abs(timeOffset) > 0.001) {
                var snappedOffset = snapToFrame(timeOffset, frameRate);

                var newStartTime = layer.startTime + snappedOffset;
                var newInPoint = layer.inPoint + snappedOffset;
                var newOutPoint = layer.outPoint + snappedOffset;

                if (newInPoint < 0) {
                    var adjustment = -newInPoint;
                    newStartTime += adjustment;
                    newInPoint = 0;
                    newOutPoint += adjustment;
                }

                newStartTime = snapToFrame(newStartTime, frameRate);
                newInPoint = snapToFrame(newInPoint, frameRate);
                newOutPoint = snapToFrame(newOutPoint, frameRate);

                layer.startTime = newStartTime;
                layer.inPoint = newInPoint;
                layer.outPoint = newOutPoint;
            }

            // Step 4: Resolve overlaps (two-pass — collect first, then process)
            // Single-pass is broken: removing layers shifts indices.
            var movedIn = layer.inPoint;
            var movedOut = layer.outPoint;

            // Pass 1: collect overlapping layers (indices are stable here)
            // Also look up each layer's track for split-duplicate tracking.
            // Snapshot ALL layers before iterating so A/V pre-splits mid-loop
            // don't introduce new layers that get processed as their own targets.
            var otLayerRefs = [];
            for (var olr = 1; olr <= comp.numLayers; olr++) {
                otLayerRefs.push(comp.layer(olr));
            }
            var overlaps = [];
            var mvtSplits = [];
            // Case-4 dups whose parent had rc_link end up orphaned (no link).
            // Track them so we can pin to the parent's track — without a pin
            // they auto-pack to V1/A1 on the next reload.
            var mvtCase4Dups = [];
            for (var i = 0; i < otLayerRefs.length; i++) {
                var otherLayer = otLayerRefs[i];
                var otherOrigIdx = i + 1; // pre-pre-split index

                if (otherLayer.index === layer.index) continue;
                if (otherLayer.locked) continue;
                if (isInArray(skipIndices, otherLayer.index)) continue;
                if (!isEditableLayer(otherLayer)) continue;

                var otherIn = otherLayer.inPoint;
                var otherOut = otherLayer.outPoint;

                if (movedIn < otherOut && movedOut > otherIn) {
                    var overlapTrack = trackAssignments ? trackAssignments[String(otherOrigIdx)] : undefined;

                    // Pre-split A/V targets when the moved layer's overlap with
                    // them is component-specific. Mirrors resolveOverlaps' logic
                    // for the movedLayerToTrack code path.
                    var otherRole = null;
                    try {
                        var otherLd = parseLinkData(otherLayer.comment);
                        if (otherLd && otherLd.rc_role) otherRole = otherLd.rc_role;
                    } catch (eOr2) {}
                    if (movedRole && otherRole && movedRole !== otherRole) continue;

                    // Effective V/A presence — see resolveOverlaps for why
                    // disabled/audioEnabled gating matters.
                    var otherHasVideo = otherLayer.hasVideo && otherLayer.enabled;
                    var otherHasAudio = otherLayer.audioEnabled && (otherLayer.source && otherLayer.source.hasAudio);
                    var otherIsAV = otherHasVideo && otherHasAudio && !otherRole;

                    // Track-overlap gate with role masking (see resolveOverlaps
                    // for the rationale). Skip if moved and other don't share
                    // any live track.
                    var sharesV = false;
                    var sharesA = false;
                    var haveTrackInfo = false;
                    var otherTi = null;
                    if (movedTracks && otherTracks) {
                        otherTi = otherTracks[String(otherOrigIdx)];
                        if (otherTi) {
                            haveTrackInfo = true;
                            var effOtherV = (otherRole === "audio") ? null : otherTi.v;
                            var effOtherA = (otherRole === "video") ? null : otherTi.a;
                            sharesV = movedTracks.v !== null && movedTracks.v !== undefined
                                && effOtherV !== null && effOtherV !== undefined
                                && movedTracks.v === effOtherV;
                            sharesA = movedTracks.a !== null && movedTracks.a !== undefined
                                && effOtherA !== null && effOtherA !== undefined
                                && movedTracks.a === effOtherA;
                            if (!sharesV && !sharesA) continue;
                        }
                    }

                    // Capture parent V/A tracks so Case-4 can pin a full-A/V
                    // dup back to the parent's tracks. Without this the dup
                    // auto-packs to V1/A1.
                    var parentTracksForOl = otherTi
                        ? { v: otherTi.v, a: otherTi.a }
                        : null;

                    var effectiveRole = movedRole;
                    if (!effectiveRole && otherIsAV && haveTrackInfo) {
                        if (sharesV && !sharesA) effectiveRole = "video";
                        else if (sharesA && !sharesV) effectiveRole = "audio";
                    }

                    if (effectiveRole && otherIsAV) {
                        var mvtPair = promoteAVLayerToLinkedPair(otherLayer);
                        var keeper = effectiveRole === "video" ? mvtPair.videoRole : mvtPair.audioRole;
                        overlaps.push({
                            layer: keeper,
                            inPoint: otherIn,
                            outPoint: otherOut,
                            startTime: keeper.startTime,
                            track: overlapTrack,
                            parentTracks: parentTracksForOl
                        });
                        // Register the surviving opposite-role half in managedLayers
                        // so the stack reorder places it on its original V/A track.
                        var survivor = effectiveRole === "video" ? mvtPair.audioRole : mvtPair.videoRole;
                        if (overlapTrack !== undefined) {
                            managedLayers.push({
                                layer: survivor,
                                originalIndex: survivor.index,
                                track: overlapTrack,
                                inPoint: survivor.inPoint
                            });
                        }
                        // Track this split so we can return splitLayers with
                        // parent V/A tracks for rcId pinning on the TS side.
                        // Keyed by pre-shift index into otherTracks snapshot.
                        mvtSplits.push({
                            videoRef: mvtPair.videoRole,
                            audioRef: mvtPair.audioRole,
                            originIdx: otherOrigIdx
                        });
                    } else {
                        overlaps.push({
                            layer: otherLayer,
                            inPoint: otherIn,
                            outPoint: otherOut,
                            startTime: otherLayer.startTime,
                            track: overlapTrack,
                            parentTracks: parentTracksForOl
                        });
                    }
                }
            }

            // Pass 2: resolve overlaps using collected layer references
            for (var ov = 0; ov < overlaps.length; ov++) {
                var ol = overlaps[ov].layer;
                var olIn = overlaps[ov].inPoint;
                var olOut = overlaps[ov].outPoint;

                if (movedIn <= olIn && movedOut >= olOut) {
                    ol.remove();
                    continue;
                }
                if (movedIn > olIn && movedIn < olOut && movedOut >= olOut) {
                    ol.outPoint = snapToFrame(movedIn, frameRate);
                    continue;
                }
                if (movedOut > olIn && movedOut < olOut && movedIn <= olIn) {
                    var savedOut = ol.outPoint;
                    ol.inPoint = snapToFrame(movedOut, frameRate);
                    ol.outPoint = savedOut;
                    continue;
                }
                if (movedIn > olIn && movedOut < olOut) {
                    var origOut = olOut;
                    ol.outPoint = snapToFrame(movedIn, frameRate);
                    var dup = ol.duplicate();
                    dup.inPoint = snapToFrame(movedOut, frameRate);
                    dup.outPoint = origOut;
                    // Match resolveOverlaps' Case-4 link handling: if the parent
                    // is a linked-pair component, orphan the dup so the
                    // opposite-role partner stays linked to the earlier half.
                    // Otherwise just refresh rcId to avoid duplicate-id issues.
                    var dupOrphanedRole = null;
                    var dupIsFullAV = false;
                    try {
                        var olComment = ol.comment;
                        if (olComment) {
                            var olLd = parseLinkData(olComment);
                            if (olLd && olLd.rc_link) {
                                orphanDuplicatedLayer(dup);
                                dupOrphanedRole = olLd.rc_role || null;
                            } else if (parseRcId(olComment)) {
                                dup.comment = appendRcId(olComment, generateRcId());
                                // Full A/V dup needs both V and A pinned.
                                dupIsFullAV = (dup instanceof AVLayer)
                                    && dup.hasVideo && dup.hasAudio;
                            }
                        }
                    } catch (eMvtSplit) {}
                    // Include the split duplicate in the reorder with the same track as the parent
                    if (overlaps[ov].track !== undefined) {
                        managedLayers.push({
                            layer: dup,
                            originalIndex: dup.index,
                            track: overlaps[ov].track,
                            inPoint: dup.inPoint
                        });
                    }
                    // Pin the orphaned dup to the parent's track on the TS side
                    if (dupOrphanedRole && overlaps[ov].track !== undefined) {
                        mvtCase4Dups.push({
                            layer: dup,
                            role: dupOrphanedRole,
                            track: overlaps[ov].track
                        });
                    }
                    // Pin full-A/V dups via parent V/A so the audio side
                    // doesn't auto-pack to A1.
                    if (dupIsFullAV && overlaps[ov].parentTracks) {
                        mvtCase4Dups.push({
                            layer: dup,
                            role: "av",
                            parentV: overlaps[ov].parentTracks.v,
                            parentA: overlaps[ov].parentTracks.a
                        });
                    }
                }
            }

            // Step 5: Reorder using pre-collected layer refs (survives index shifts from overwrite)
            var indexMap = null;
            if (managedLayers.length > 0) {
                // Filter out deleted layers + re-read inPoint (may have been trimmed)
                var aliveLayers = [];
                for (var a = 0; a < managedLayers.length; a++) {
                    try {
                        var info = managedLayers[a];
                        info.inPoint = info.layer.inPoint;
                        aliveLayers.push(info);
                    } catch(e) {
                        // Layer was removed during overwrite — skip
                    }
                }

                aliveLayers.sort(function(a, b) {
                    if (a.track !== b.track) return b.track - a.track;
                    return b.inPoint - a.inPoint;
                });

                for (var r = 0; r < aliveLayers.length; r++) {
                    var desiredIndex = r + 1;
                    if (aliveLayers[r].layer.index !== desiredIndex && !aliveLayers[r].layer.locked) {
                        if (desiredIndex < aliveLayers[r].layer.index) {
                            aliveLayers[r].layer.moveBefore(comp.layer(desiredIndex));
                        } else {
                            aliveLayers[r].layer.moveAfter(comp.layer(desiredIndex));
                        }
                    }
                }

                indexMap = {};
                for (var j = 0; j < aliveLayers.length; j++) {
                    indexMap[String(aliveLayers[j].originalIndex)] = aliveLayers[j].layer.index;
                }
            }

            // Build splitLayerInfos so the TS side can pin pre-split halves to
            // their parent V/A tracks. Without this, fresh duplicates auto-pack
            // to V1/A1 on the next reload. Mirrors moveLayerWithOverwrite.
            var mvtSplitInfos = [];
            for (var spi = 0; spi < mvtSplits.length; spi++) {
                var split = mvtSplits[spi];
                var parentV = null;
                var parentA = null;
                if (otherTracks) {
                    var entry = otherTracks[String(split.originIdx)];
                    if (entry) {
                        if (entry.v != null) parentV = entry.v;
                        if (entry.a != null) parentA = entry.a;
                    }
                }
                try {
                    mvtSplitInfos.push({
                        rcId: parseRcId(split.videoRef.comment) || null,
                        linkRole: "video",
                        parentVideoTrack: parentV,
                        parentAudioTrack: parentA
                    });
                    mvtSplitInfos.push({
                        rcId: parseRcId(split.audioRef.comment) || null,
                        linkRole: "audio",
                        parentVideoTrack: parentV,
                        parentAudioTrack: parentA
                    });
                } catch (ignoreMvt) {}
            }
            // Add Case-4 dups. For role="video"/"audio" (orphaned linked-pair
            // components) pin to the single parent track. For role="av" (full
            // A/V dups) emit two pin entries so both V and A sides land on the
            // parent's tracks.
            for (var c4 = 0; c4 < mvtCase4Dups.length; c4++) {
                var c4d = mvtCase4Dups[c4];
                try {
                    var c4RcId = parseRcId(c4d.layer.comment) || null;
                    if (c4d.role === "av") {
                        if (c4d.parentV != null) {
                            mvtSplitInfos.push({
                                rcId: c4RcId, linkRole: "video",
                                parentVideoTrack: c4d.parentV,
                                parentAudioTrack: null
                            });
                        }
                        if (c4d.parentA != null) {
                            mvtSplitInfos.push({
                                rcId: c4RcId, linkRole: "audio",
                                parentVideoTrack: null,
                                parentAudioTrack: c4d.parentA
                            });
                        }
                    } else {
                        mvtSplitInfos.push({
                            rcId: c4RcId,
                            linkRole: c4d.role,
                            parentVideoTrack: c4d.role === "video" ? c4d.track : null,
                            parentAudioTrack: c4d.role === "audio" ? c4d.track : null
                        });
                    }
                } catch (ignoreC4) {}
            }

            // Track-visibility sync (same undo step as the move)
            applyVisibilityChanges(comp, visibilityJson);

            var resultObj = { success: true, newIndex: layer.index };
            if (indexMap) resultObj.indexMap = indexMap;
            if (mvtSplitInfos && mvtSplitInfos.length > 0) resultObj.splitLayers = mvtSplitInfos;
            return JSON.stringify(resultObj);

        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Delete multiple layers (for track deletion)
 * @param {string} layerIndicesJson - JSON array of layer indices to delete
 * @returns {string} JSON result with deleted count
 */
function deleteLayers(layerIndicesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ success: false, error: "No active composition" });

        var layerIndices = JSON.parse(layerIndicesJson);

        // Sort indices in descending order (delete from highest index first to preserve other indices)
        layerIndices.sort(function(a, b) { return b - a; });

        app.beginUndoGroup("Railcut: Delete Layers");

        try {
            var deleteCount = 0;
            for (var i = 0; i < layerIndices.length; i++) {
                var layer = comp.layer(layerIndices[i]);
                if (layer && !layer.locked) {
                    layer.remove();
                    deleteCount++;
                }
            }

            return JSON.stringify({ success: true, deletedCount: deleteCount });

        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Ripple delete multiple layers and close gaps.
 * Processes layers rightmost-first so cumulative shifts are correct.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @returns {string} JSON result
 */
function rippleDeleteLayers(layerIndicesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) return makeResult(false, "No layers specified");

        // Collect data for selected layers
        var toDelete = [];
        var deletingSet = {};
        for (var i = 0; i < layerIndices.length; i++) {
            var layer = comp.layer(layerIndices[i]);
            if (!layer || layer.locked) continue;
            toDelete.push({
                index: layerIndices[i],
                inPoint: layer.inPoint,
                outPoint: layer.outPoint,
                gapDuration: layer.outPoint - layer.inPoint
            });
            deletingSet[layerIndices[i]] = true;
        }

        if (toDelete.length === 0) return makeResult(true);

        app.beginUndoGroup("Railcut: Ripple Delete");

        try {
            // Phase 1: Pre-compute shifts for remaining layers while all layers still exist.
            // Merge overlapping deleted ranges first — a linked pair's V-role and
            // A-role components have the same time range, and naively summing
            // gap durations would double-count. Take the UNION of deleted
            // intervals, then for each remaining layer at inPoint X, shift =
            // total duration of merged intervals with outPoint <= X.
            var sortedDelete = toDelete.slice().sort(function(a, b) {
                return a.inPoint - b.inPoint;
            });
            var mergedRanges = [];
            for (var md = 0; md < sortedDelete.length; md++) {
                var rng = sortedDelete[md];
                if (mergedRanges.length === 0) {
                    mergedRanges.push({ inPoint: rng.inPoint, outPoint: rng.outPoint });
                } else {
                    var lastRng = mergedRanges[mergedRanges.length - 1];
                    if (rng.inPoint <= lastRng.outPoint + 0.001) {
                        // Overlap or touch — merge
                        if (rng.outPoint > lastRng.outPoint) lastRng.outPoint = rng.outPoint;
                    } else {
                        mergedRanges.push({ inPoint: rng.inPoint, outPoint: rng.outPoint });
                    }
                }
            }

            var shifts = [];
            for (var r = 1; r <= comp.numLayers; r++) {
                if (deletingSet[r]) continue;
                var rLayer = comp.layer(r);
                if (rLayer.locked) continue;

                var shiftAmount = 0;
                for (var mr = 0; mr < mergedRanges.length; mr++) {
                    if (mergedRanges[mr].outPoint <= rLayer.inPoint + 0.001) {
                        shiftAmount += mergedRanges[mr].outPoint - mergedRanges[mr].inPoint;
                    }
                }

                if (shiftAmount > 0) {
                    shifts.push({ layer: rLayer, amount: shiftAmount });
                }
            }

            // Phase 2: Delete selected layers (descending index to preserve lower indices)
            toDelete.sort(function(a, b) { return b.index - a.index; });
            for (var del = 0; del < toDelete.length; del++) {
                comp.layer(toDelete[del].index).remove();
            }

            // Phase 3: Apply shifts (layer references collected in Phase 1 are still valid)
            for (var sh = 0; sh < shifts.length; sh++) {
                shifts[sh].layer.startTime -= shifts[sh].amount;
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

// ============================================
// Premiere-Style Editing Tools
// ============================================

/**
 * Ripple edit in point - trim the in point and shift all following clips
 * @param {number} layerIndex - Layer to trim
 * @param {number} newInPoint - New in point time
 * @param {number} delta - How much the in point changed (positive = moved later, negative = moved earlier)
 * @returns {string} JSON result
 */
/** Core ripple-in logic (no undo group — caller wraps).
 *  skipIndices: layer indices that should NOT shift (fully locked).
 *  autoSplitMap: layerIndex → 'video' or 'audio'. Partial-lock regular A/V
 *    layers — promote each to a linked pair and shift only the named side. */
function rippleEditInCore(comp, layerIndex, newInPoint, delta, skipIndices, autoSplitMap) {
    var layer = comp.layer(layerIndex);
    if (!layer || layer.locked) return;

    var frameRate = comp.frameRate;
    var originalInPoint = layer.inPoint;
    var originalOutPoint = layer.outPoint;
    var rippleAmount = snapToFrame(-delta, frameRate);

    layer.startTime = snapToFrame(layer.startTime + rippleAmount, frameRate);
    var expectedOutPoint = snapToFrame(originalOutPoint + rippleAmount, frameRate);

    layer.inPoint = snapToFrame(originalInPoint, frameRate);
    if (Math.abs(layer.outPoint - expectedOutPoint) > 0.001) {
        layer.outPoint = expectedOutPoint;
    }

    var skipMap = {};
    if (skipIndices) {
        for (var sk = 0; sk < skipIndices.length; sk++) skipMap[skipIndices[sk]] = true;
    }
    var splitMap = autoSplitMap || {};

    // Pre-collect refs for auto-split layers BEFORE any modification (their
    // indices may shift when other auto-splits run).
    var autoSplitJobs = [];
    for (var asKey in splitMap) {
        if (splitMap.hasOwnProperty(asKey)) {
            try {
                autoSplitJobs.push({
                    ref: comp.layer(parseInt(asKey, 10)),
                    role: splitMap[asKey],
                });
            } catch (eAs) {}
        }
    }

    // Pass 1: shift normal downstream clips (skipping skipMap and splitMap).
    for (var i = 1; i <= comp.numLayers; i++) {
        var otherLayer = comp.layer(i);
        if (otherLayer.index === layer.index) continue;
        if (otherLayer.locked) continue;
        if (skipMap[otherLayer.index]) continue;
        if (splitMap[otherLayer.index]) continue;
        if (!isEditableLayer(otherLayer)) continue;
        if (otherLayer.inPoint >= originalOutPoint - 0.001) {
            otherLayer.startTime = snapToFrame(otherLayer.startTime + rippleAmount, frameRate);
        }
    }

    // Pass 2: auto-split partial-lock A/V downstream — promote, then shift the unlocked side.
    for (var asj = 0; asj < autoSplitJobs.length; asj++) {
        var job = autoSplitJobs[asj];
        if (!job.ref || job.ref.locked) continue;
        if (job.ref.inPoint < originalOutPoint - 0.001) continue; // not downstream
        try {
            var pair = promoteAVLayerToLinkedPair(job.ref, { originalRole: job.role });
            var shiftedLayer = job.role === "video" ? pair.videoRole : pair.audioRole;
            shiftedLayer.startTime = snapToFrame(shiftedLayer.startTime + rippleAmount, frameRate);
        } catch (eAs2) {}
    }
}

function rippleEditIn(layerIndex, newInPoint, delta, skipIndicesJson, autoSplitMapJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);

        var skipIndices = skipIndicesJson ? JSON.parse(skipIndicesJson) : null;
        var autoSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: Ripple Edit In");
        try {
            rippleEditInCore(comp, layerIndex, newInPoint, delta, skipIndices, autoSplitMap);
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Ripple edit in point on a linked pair — both layers in one undo group.
 * The partner gets the same ripple (same delta, same downstream shift).
 */
function rippleEditInLinked(layerIndex, partnerIndex, newInPoint, delta, skipIndicesJson, autoSplitMapJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var skipIndices = skipIndicesJson ? JSON.parse(skipIndicesJson) : null;
        var autoSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: Ripple Edit In");
        try {
            rippleEditInCore(comp, layerIndex, newInPoint, delta, skipIndices, autoSplitMap);
            var partnerLayer = comp.layer(partnerIndex);
            if (partnerLayer && !partnerLayer.locked) {
                var partnerNewIn = partnerLayer.inPoint + delta;
                // Don't re-run auto-split for partner's pass — the splits already happened.
                rippleEditInCore(comp, partnerIndex, partnerNewIn, delta, skipIndices, null);
            }
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

function rippleEditOutLinked(layerIndex, partnerIndex, newOutPoint, delta, skipIndicesJson, autoSplitMapJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var skipIndices = skipIndicesJson ? JSON.parse(skipIndicesJson) : null;
        var autoSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: Ripple Edit Out");
        try {
            rippleEditOutCore(comp, layerIndex, newOutPoint, delta, skipIndices, autoSplitMap);
            var partnerLayer = comp.layer(partnerIndex);
            if (partnerLayer && !partnerLayer.locked) {
                var partnerNewOut = partnerLayer.outPoint + delta;
                rippleEditOutCore(comp, partnerIndex, partnerNewOut, delta, skipIndices, null);
            }
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Ripple edit out point - trim the out point and shift all following clips
 * @param {number} layerIndex - Layer to trim
 * @param {number} newOutPoint - New out point time
 * @param {number} delta - How much the out point changed (positive = extended, negative = shortened)
 * @returns {string} JSON result
 */
/** Core ripple-out logic (no undo group — caller wraps).
 *  skipIndices: layer indices to leave anchored (fully locked).
 *  autoSplitMap: layerIndex → 'video' or 'audio'. Partial-lock regular A/V
 *    layers — promote each to a linked pair and shift only the named side. */
function rippleEditOutCore(comp, layerIndex, newOutPoint, delta, skipIndices, autoSplitMap) {
    var layer = comp.layer(layerIndex);
    if (!layer || layer.locked) return;

    var frameRate = comp.frameRate;
    var originalOutPoint = layer.outPoint;
    layer.outPoint = snapToFrame(newOutPoint, frameRate);
    var rippleAmount = snapToFrame(delta, frameRate);

    var skipMap = {};
    if (skipIndices) {
        for (var sk = 0; sk < skipIndices.length; sk++) skipMap[skipIndices[sk]] = true;
    }
    var splitMap = autoSplitMap || {};

    var autoSplitJobs = [];
    for (var asKey in splitMap) {
        if (splitMap.hasOwnProperty(asKey)) {
            try {
                autoSplitJobs.push({
                    ref: comp.layer(parseInt(asKey, 10)),
                    role: splitMap[asKey],
                });
            } catch (eAs) {}
        }
    }

    // Pass 1: shift normal downstream clips.
    for (var i = 1; i <= comp.numLayers; i++) {
        var otherLayer = comp.layer(i);
        if (otherLayer.index === layer.index) continue;
        if (otherLayer.locked) continue;
        if (skipMap[otherLayer.index]) continue;
        if (splitMap[otherLayer.index]) continue;
        if (!isEditableLayer(otherLayer)) continue;
        if (otherLayer.inPoint >= originalOutPoint - 0.001) {
            otherLayer.startTime = snapToFrame(otherLayer.startTime + rippleAmount, frameRate);
        }
    }

    // Pass 2: auto-split partial-lock A/V downstream — promote, then shift the unlocked side.
    for (var asj = 0; asj < autoSplitJobs.length; asj++) {
        var job = autoSplitJobs[asj];
        if (!job.ref || job.ref.locked) continue;
        if (job.ref.inPoint < originalOutPoint - 0.001) continue;
        try {
            var pair = promoteAVLayerToLinkedPair(job.ref, { originalRole: job.role });
            var shiftedLayer = job.role === "video" ? pair.videoRole : pair.audioRole;
            shiftedLayer.startTime = snapToFrame(shiftedLayer.startTime + rippleAmount, frameRate);
        } catch (eAs2) {}
    }
}

function rippleEditOut(layerIndex, newOutPoint, delta, skipIndicesJson, autoSplitMapJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);

        var skipIndices = skipIndicesJson ? JSON.parse(skipIndicesJson) : null;
        var autoSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: Ripple Edit Out");
        try {
            rippleEditOutCore(comp, layerIndex, newOutPoint, delta, skipIndices, autoSplitMap);
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Ripple Trim Next Edit (W shortcut) — trim a clip's out point to the given
 * time and ripple all downstream clips left to close the gap.
 * @param {number} layerIndex - 1-based layer index of clip to trim
 * @param {number} newOutPoint - Time to trim the out point to (CTI, pre-snapped)
 * @returns {string} JSON result
 */
function rippleTrimNextEdit(layerIndicesJSON, newOutPoint, excludeJSON) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJSON);
        var excludeIndices = excludeJSON ? JSON.parse(excludeJSON) : [];

        // Validate all layers exist and are unlocked
        var layers = [];
        for (var li = 0; li < layerIndices.length; li++) {
            var check = getLayerChecked(comp, layerIndices[li], true);
            if (check.error) return makeResult(false, check.error);
            layers.push(check.layer);
        }
        if (layers.length === 0) return makeResult(false, "No layers to trim");

        app.beginUndoGroup("Railcut: Ripple Trim Next Edit");

        try {
            var frameRate = comp.frameRate;
            var snappedNewOut = snapToFrame(newOutPoint, frameRate);
            var halfFrame = 0.5 / frameRate;

            // Find the max original outPoint among all trimmed layers
            var maxOriginalOutPoint = layers[0].outPoint;
            for (var k = 1; k < layers.length; k++) {
                if (layers[k].outPoint > maxOriginalOutPoint) {
                    maxOriginalOutPoint = layers[k].outPoint;
                }
            }

            // Trim all target layers' outPoints
            for (var t = 0; t < layers.length; t++) {
                layers[t].outPoint = snappedNewOut;
            }

            // Calculate ripple amount
            var trimAmount = snapToFrame(maxOriginalOutPoint - snappedNewOut, frameRate);

            // Build set of trimmed + excluded layer indices
            var skipSet = {};
            for (var s = 0; s < layerIndices.length; s++) {
                skipSet[layerIndices[s]] = true;
            }
            for (var ei = 0; ei < excludeIndices.length; ei++) {
                skipSet[excludeIndices[ei]] = true;
            }

            // Ripple: shift all non-skipped clips downstream of maxOriginalOutPoint
            for (var i = 1; i <= comp.numLayers; i++) {
                var otherLayer = comp.layer(i);
                if (skipSet[otherLayer.index]) continue;
                if (otherLayer.locked) continue;
                if (!isEditableLayer(otherLayer)) continue;

                if (otherLayer.inPoint >= maxOriginalOutPoint - halfFrame) {
                    otherLayer.startTime = snapToFrame(otherLayer.startTime - trimAmount, frameRate);
                }
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Ripple Trim Previous Edit (Q shortcut) — trim clips' in points to the
 * given time, shift them left so new in points land at the earliest original
 * in point, and ripple all clips at or after that point left.
 * Also moves the CTI to the earliest original in point.
 * @param {string} layerIndicesJSON - JSON array of 1-based layer indices
 * @param {number} newInPoint - Time to trim the in points to (CTI, pre-snapped)
 * @returns {string} JSON result with newCTI
 */
function rippleTrimPreviousEdit(layerIndicesJSON, newInPoint, excludeJSON) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJSON);
        var excludeIndices = excludeJSON ? JSON.parse(excludeJSON) : [];

        // Validate all layers exist and are unlocked
        var layers = [];
        for (var li = 0; li < layerIndices.length; li++) {
            var check = getLayerChecked(comp, layerIndices[li], true);
            if (check.error) return makeResult(false, check.error);
            layers.push(check.layer);
        }
        if (layers.length === 0) return makeResult(false, "No layers to trim");

        app.beginUndoGroup("Railcut: Ripple Trim Previous Edit");

        try {
            var frameRate = comp.frameRate;
            var snappedNewIn = snapToFrame(newInPoint, frameRate);
            var halfFrame = 0.5 / frameRate;

            // Find the min original inPoint among all trimmed layers
            var minOriginalInPoint = layers[0].inPoint;
            for (var k = 1; k < layers.length; k++) {
                if (layers[k].inPoint < minOriginalInPoint) {
                    minOriginalInPoint = layers[k].inPoint;
                }
            }

            // trimAmount = how much to shift left (based on earliest inPoint)
            var trimAmount = snapToFrame(snappedNewIn - minOriginalInPoint, frameRate);

            // Trim each layer: set inPoint, restore outPoint, shift left
            for (var t = 0; t < layers.length; t++) {
                var layer = layers[t];
                var originalOutPoint = layer.outPoint;

                // Set new inPoint (AE may shift outPoint)
                layer.inPoint = snappedNewIn;
                if (Math.abs(layer.outPoint - originalOutPoint) > 0.001) {
                    layer.outPoint = originalOutPoint;
                }

                // Shift this clip left by the global trim amount
                layer.startTime = snapToFrame(layer.startTime - trimAmount, frameRate);
            }

            // Build set of trimmed + excluded layer indices
            var skipSet = {};
            for (var s = 0; s < layerIndices.length; s++) {
                skipSet[layerIndices[s]] = true;
            }
            for (var ei = 0; ei < excludeIndices.length; ei++) {
                skipSet[excludeIndices[ei]] = true;
            }

            // Ripple all OTHER clips whose inPoint >= minOriginalInPoint left by trimAmount
            for (var i = 1; i <= comp.numLayers; i++) {
                var otherLayer = comp.layer(i);
                if (skipSet[otherLayer.index]) continue;
                if (otherLayer.locked) continue;
                if (!isEditableLayer(otherLayer)) continue;

                if (otherLayer.inPoint >= minOriginalInPoint - halfFrame) {
                    otherLayer.startTime = snapToFrame(otherLayer.startTime - trimAmount, frameRate);
                }
            }

            // Move CTI to minOriginalInPoint
            comp.time = snapToFrame(minOriginalInPoint, frameRate);

        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify({ success: true, newCTI: snapToFrame(minOriginalInPoint, comp.frameRate) });

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Trim Next Edit (Option+W / Ctrl+Alt+W) — trim a clip's out point to the
 * given time. No ripple, no clip movement. Leaves a gap after the clip.
 * @param {number} layerIndex - 1-based layer index of clip to trim
 * @param {number} newOutPoint - Time to trim the out point to (CTI, pre-snapped)
 * @returns {string} JSON result
 */
function trimNextEdit(layerIndicesJSON, newOutPoint) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJSON);
        var layers = [];
        for (var li = 0; li < layerIndices.length; li++) {
            var check = getLayerChecked(comp, layerIndices[li], true);
            if (check.error) return makeResult(false, check.error);
            layers.push(check.layer);
        }
        if (layers.length === 0) return makeResult(false, "No layers to trim");

        app.beginUndoGroup("Railcut: Trim Next Edit");
        try {
            var snappedOut = snapToFrame(newOutPoint, comp.frameRate);
            for (var t = 0; t < layers.length; t++) {
                layers[t].outPoint = snappedOut;
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Trim Previous Edit (Option+Q / Ctrl+Alt+Q) — trim a clip's in point to the
 * given time. No ripple, no clip movement. Leaves a gap before the clip.
 * @param {number} layerIndex - 1-based layer index of clip to trim
 * @param {number} newInPoint - Time to trim the in point to (CTI, pre-snapped)
 * @returns {string} JSON result
 */
function trimPreviousEdit(layerIndicesJSON, newInPoint) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJSON);
        var layers = [];
        for (var li = 0; li < layerIndices.length; li++) {
            var check = getLayerChecked(comp, layerIndices[li], true);
            if (check.error) return makeResult(false, check.error);
            layers.push(check.layer);
        }
        if (layers.length === 0) return makeResult(false, "No layers to trim");

        app.beginUndoGroup("Railcut: Trim Previous Edit");
        try {
            var snappedIn = snapToFrame(newInPoint, comp.frameRate);
            for (var t = 0; t < layers.length; t++) {
                var layer = layers[t];
                var originalOutPoint = layer.outPoint;
                layer.inPoint = snappedIn;
                // AE may shift outPoint when setting inPoint — restore it
                if (Math.abs(layer.outPoint - originalOutPoint) > 0.001) {
                    layer.outPoint = originalOutPoint;
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Rolling edit - adjust the edit point between two adjacent clips
 * Extends one clip while shortening the other - total duration stays the same
 * @param {number} firstLayerIndex - First clip (adjusting its out point)
 * @param {number} secondLayerIndex - Second clip (adjusting its in point)
 * @param {number} newEditPoint - New time for the edit point
 * @returns {string} JSON result
 */
/** Core rolling edit logic (no undo group — caller wraps). */
function rollingEditCore(comp, firstLayerIndex, secondLayerIndex, newEditPoint) {
    var firstLayer = comp.layer(firstLayerIndex);
    var secondLayer = comp.layer(secondLayerIndex);
    if (!firstLayer || !secondLayer) return;
    if (firstLayer.locked || secondLayer.locked) return;

    var frameRate = comp.frameRate;
    var secondLayerOriginalOutPoint = secondLayer.outPoint;
    var snappedEditPoint = snapToFrame(newEditPoint, frameRate);

    var frameTime = 1 / frameRate;
    var minEditPoint = firstLayer.inPoint + frameTime;
    var maxEditPoint = secondLayerOriginalOutPoint - frameTime;
    if (minEditPoint < 0) minEditPoint = 0;
    if (secondLayer.startTime > minEditPoint) minEditPoint = secondLayer.startTime;
    if (snappedEditPoint < minEditPoint) snappedEditPoint = snapToFrame(minEditPoint, frameRate);
    if (snappedEditPoint > maxEditPoint) snappedEditPoint = snapToFrame(maxEditPoint, frameRate);
    if (snappedEditPoint < 0) snappedEditPoint = 0;
    if (snappedEditPoint > comp.duration) snappedEditPoint = snapToFrame(comp.duration, frameRate);

    firstLayer.outPoint = snappedEditPoint;
    secondLayer.inPoint = snappedEditPoint;
    if (Math.abs(secondLayer.outPoint - secondLayerOriginalOutPoint) > 0.001) {
        secondLayer.outPoint = secondLayerOriginalOutPoint;
    }
}

function rollingEdit(firstLayerIndex, secondLayerIndex, newEditPoint) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        app.beginUndoGroup("Railcut: Rolling Edit");
        try {
            rollingEditCore(comp, firstLayerIndex, secondLayerIndex, newEditPoint);
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Rolling edit on a linked pair — rolls both the primary edit point AND
 * the linked partners' edit point in one undo group.
 */
function rollingEditLinked(firstLayerIndex, secondLayerIndex, firstPartnerIndex, secondPartnerIndex, newEditPoint) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        app.beginUndoGroup("Railcut: Rolling Edit");
        try {
            // Compute the delta from the primary pair's current edit point
            var firstLayer = comp.layer(firstLayerIndex);
            var originalEditPoint = firstLayer ? firstLayer.outPoint : 0;
            var delta = newEditPoint - originalEditPoint;

            rollingEditCore(comp, firstLayerIndex, secondLayerIndex, newEditPoint);

            // Apply the same DELTA to partner layers (preserves J/L offset).
            // When both partners exist, use rollingEditCore on both.
            // When only one partner exists (linked pair next to regular clip),
            // just adjust that partner's edge directly — don't re-roll the regular clip.
            if (firstPartnerIndex > 0 && secondPartnerIndex > 0) {
                var partnerFirst = comp.layer(firstPartnerIndex);
                if (partnerFirst) {
                    var partnerEditPoint = partnerFirst.outPoint + delta;
                    rollingEditCore(comp, firstPartnerIndex, secondPartnerIndex, partnerEditPoint);
                }
            } else if (firstPartnerIndex > 0) {
                // Only the "first" side has a partner — adjust its outPoint
                var fp = comp.layer(firstPartnerIndex);
                if (fp && !fp.locked) {
                    fp.outPoint = fp.outPoint + snapToFrame(delta, comp.frameRate);
                }
            } else if (secondPartnerIndex > 0) {
                // Only the "second" side has a partner — adjust its inPoint
                var sp = comp.layer(secondPartnerIndex);
                if (sp && !sp.locked) {
                    var spOrigOut = sp.outPoint;
                    sp.inPoint = sp.inPoint + snapToFrame(delta, comp.frameRate);
                    if (Math.abs(sp.outPoint - spOrigOut) > 0.001) sp.outPoint = spOrigOut;
                }
            }
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Rolling edit that splits A/V clips into linked pairs first, then rolls only
 * the targeted component (video or audio). Creates J/L cuts from regular clips.
 * @param {number} firstLayerIndex - First clip (out point changes)
 * @param {number} secondLayerIndex - Second clip (in point changes)
 * @param {number} newEditPoint - New edit point time
 * @param {string} component - 'video' or 'audio' — which component to roll
 */
/**
 * Apply a partial-lock rolling edit on a single layer (either side of the
 * edit). Handles regular A/V (auto-split into linked pair, roll only the
 * given component) and existing linked-pair role layers (just roll if the
 * role matches the component). Caller manages the undo group.
 */
function _performRollingPartialLock(layer, component, snappedEditPoint, edge) {
    if (!layer || layer.locked) return;
    var linkData = null;
    try { linkData = parseLinkData(layer.comment); } catch (eL) {}

    if (linkData && linkData.rc_link) {
        // Linked-pair role layer: roll only when this role matches the
        // component (e.g. unlinkedTrackType="video" → roll the video-role).
        // The partner role is on a locked track and stays anchored.
        if (linkData.rc_role !== component) return;
        if (edge === "out") {
            layer.outPoint = snappedEditPoint;
        } else {
            var savedOut = layer.outPoint;
            layer.inPoint = snappedEditPoint;
            if (Math.abs(layer.outPoint - savedOut) > 0.001) layer.outPoint = savedOut;
        }
        return;
    }

    if (layer.hasVideo && layer.hasAudio) {
        // Regular A/V: capture original timing, roll, then split into a
        // linked pair so only the rolled component shifts.
        var origStart = layer.startTime;
        var origIn = layer.inPoint;
        var origOut = layer.outPoint;
        if (edge === "out") {
            layer.outPoint = snappedEditPoint;
        } else {
            var savedOut2 = layer.outPoint;
            layer.inPoint = snappedEditPoint;
            if (Math.abs(layer.outPoint - savedOut2) > 0.001) layer.outPoint = savedOut2;
        }
        var linkId = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 8);
        _performJLSplit(layer, component, origStart, origIn, origOut, linkId);
        return;
    }

    // Single-channel layer (no V or no A) — just roll.
    if (edge === "out") {
        layer.outPoint = snappedEditPoint;
    } else {
        var savedOut3 = layer.outPoint;
        layer.inPoint = snappedEditPoint;
        if (Math.abs(layer.outPoint - savedOut3) > 0.001) layer.outPoint = savedOut3;
    }
}

/**
 * Generalized partial-lock rolling edit. firstLayerIndex is the clip whose
 * outPoint changes; secondLayerIndex is the clip whose inPoint changes (pass 0
 * if no adjacent). Each side is dispatched to _performRollingPartialLock so
 * regular A/V and linked-pair-role clips are handled correctly. Single undo
 * group.
 */
function rollingEditPartialLock(firstLayerIndex, secondLayerIndex, newEditPoint, component) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var firstLayer = firstLayerIndex > 0 ? comp.layer(firstLayerIndex) : null;
        var secondLayer = secondLayerIndex > 0 ? comp.layer(secondLayerIndex) : null;
        if (!firstLayer && !secondLayer) return makeResult(false, "No layers to roll");

        var frameRate = comp.frameRate;
        var snappedEditPoint = snapToFrame(newEditPoint, frameRate);

        app.beginUndoGroup("Railcut: Rolling Edit (J/L)");
        try {
            if (firstLayer) {
                _performRollingPartialLock(firstLayer, component, snappedEditPoint, "out");
            }
            // secondLayer ref stays valid across firstLayer's split (refs survive
            // index shifts), so no re-fetch needed.
            if (secondLayer) {
                _performRollingPartialLock(secondLayer, component, snappedEditPoint, "in");
            }
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

function rollingEditWithJLSplit(firstLayerIndex, secondLayerIndex, newEditPoint, component) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var firstLayer = comp.layer(firstLayerIndex);
        var secondLayer = comp.layer(secondLayerIndex);
        if (!firstLayer || !secondLayer) return makeResult(false, "Layer not found");

        // Capture pre-roll timings for both layers BEFORE any modification —
        // the J/L split duplicates land at these original positions.
        var firstOrigStart = firstLayer.startTime;
        var firstOrigIn = firstLayer.inPoint;
        var firstOrigOut = firstLayer.outPoint;
        var secondOrigStart = secondLayer.startTime;
        var secondOrigIn = secondLayer.inPoint;
        var secondOrigOut = secondLayer.outPoint;

        var frameRate = comp.frameRate;
        var snappedEditPoint = snapToFrame(newEditPoint, frameRate);
        var linkId1 = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 6);
        var linkId2 = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 8);

        app.beginUndoGroup("Railcut: Rolling Edit (J/L)");
        try {
            // Roll the first layer's outPoint, then split into a linked pair —
            // _performJLSplit's duplicate captures the rolled state, then
            // overwrites with origStart/origIn/origOut to land at original.
            firstLayer.outPoint = snappedEditPoint;
            _performJLSplit(firstLayer, component, firstOrigStart, firstOrigIn, firstOrigOut, linkId1);

            // Re-fetch second layer — the first split inserted a layer, so
            // secondLayerIndex may have shifted by +1.
            var adjIdx = secondLayerIndex >= firstLayerIndex ? secondLayerIndex + 1 : secondLayerIndex;
            secondLayer = (adjIdx >= 1 && adjIdx <= comp.numLayers) ? comp.layer(adjIdx) : null;
            if (!secondLayer) {
                app.endUndoGroup();
                return makeResult(false, "Second layer not found after split");
            }

            // Roll the second layer's inPoint (defensively guard outPoint
            // against AE's inPoint side-effect), then split.
            var savedSecondOut = secondLayer.outPoint;
            secondLayer.inPoint = snappedEditPoint;
            if (Math.abs(secondLayer.outPoint - savedSecondOut) > 0.001) {
                secondLayer.outPoint = savedSecondOut;
            }
            _performJLSplit(secondLayer, component, secondOrigStart, secondOrigIn, secondOrigOut, linkId2);
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Rolling edit multiple edit points at once
 * Applies the same delta to all specified edit points in a single undo group
 * @param {string} editsJson - JSON array of edit point specifications
 * @param {number} delta - Time offset to apply to all edit points
 * @returns {string} JSON result
 */
function rollingEditMultiple(editsJson, delta) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var edits = JSON.parse(editsJson);
        if (!edits || edits.length === 0) {
            return makeResult(false, "No edit points specified");
        }

        app.beginUndoGroup("Railcut: Rolling Edit");

        try {
            var frameRate = comp.frameRate;
            var frameTime = 1 / frameRate;

            // Snap delta to frame boundary
            var snappedDelta = snapToFrame(delta, frameRate);

            for (var i = 0; i < edits.length; i++) {
                var edit = edits[i];

                var clip = comp.layer(edit.clipIndex);
                var adjacent = edit.adjacentClipIndex ? comp.layer(edit.adjacentClipIndex) : null;

                if (!clip) continue;
                if (clip.locked) continue;
                if (adjacent && adjacent.locked) continue;

                var newEditPoint = snapToFrame(edit.time + snappedDelta, frameRate);

                // Apply constraints
                if (newEditPoint < 0) newEditPoint = 0;
                if (newEditPoint > comp.duration) newEditPoint = snapToFrame(comp.duration, frameRate);

                if (edit.edge === "out") {
                    // Rolling out point: clip's out changes, adjacent's in changes
                    var minOut = clip.inPoint + frameTime;
                    var maxOut = adjacent ? adjacent.outPoint - frameTime : comp.duration;

                    // Constrain by adjacent layer's startTime (can't trim past source start)
                    if (adjacent && adjacent.startTime > minOut) {
                        minOut = snapToFrame(adjacent.startTime, frameRate);
                    }

                    if (newEditPoint < minOut) newEditPoint = snapToFrame(minOut, frameRate);
                    if (newEditPoint > maxOut) newEditPoint = snapToFrame(maxOut, frameRate);

                    clip.outPoint = newEditPoint;

                    if (adjacent) {
                        var adjacentOriginalOutPoint = adjacent.outPoint;
                        adjacent.inPoint = newEditPoint;
                        // Defensive: restore outPoint if AE changed it as side effect
                        if (Math.abs(adjacent.outPoint - adjacentOriginalOutPoint) > 0.001) {
                            adjacent.outPoint = adjacentOriginalOutPoint;
                        }
                    }
                } else {
                    // Rolling in point: clip's in changes, adjacent's out changes
                    var minIn = adjacent ? adjacent.inPoint + frameTime : 0;
                    var maxIn = clip.outPoint - frameTime;

                    // Constrain by clip's own startTime (can't trim past source start)
                    if (clip.startTime > minIn) {
                        minIn = snapToFrame(clip.startTime, frameRate);
                    }

                    if (newEditPoint < minIn) newEditPoint = snapToFrame(minIn, frameRate);
                    if (newEditPoint > maxIn) newEditPoint = snapToFrame(maxIn, frameRate);

                    var clipOriginalOutPoint = clip.outPoint;
                    clip.inPoint = newEditPoint;
                    // Defensive: restore outPoint if AE changed it as side effect
                    if (Math.abs(clip.outPoint - clipOriginalOutPoint) > 0.001) {
                        clip.outPoint = clipOriginalOutPoint;
                    }

                    if (adjacent) {
                        adjacent.outPoint = newEditPoint;
                    }
                }
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Trim a group of layers by the same time delta. Used for Premiere-style
 * multi-track trim: every selected clip's matching edge (in or out)
 * shifts by the same delta. Single undo group.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @param {number} deltaOffset - Time offset to apply to the chosen edge
 * @param {string} edge - 'in' or 'out'
 * @returns {string} JSON result
 */
function trimLayers(layerIndicesJson, deltaOffset, edge) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var indices = JSON.parse(layerIndicesJson);
        if (!indices || !indices.length) return makeResult(false, "No layers");

        app.beginUndoGroup("Railcut: Trim");
        try {
            var frameRate = comp.frameRate;
            var snapDelta = snapToFrame(deltaOffset, frameRate);
            for (var i = 0; i < indices.length; i++) {
                var l = comp.layer(indices[i]);
                if (!l || l.locked) continue;
                // Defensively snapshot the un-touched edge — AE can shift the
                // OPPOSITE edge as a side-effect of changing one (especially
                // when extending past the source-frame-0 boundary). Restore
                // it after the assignment so trim only edits the chosen edge.
                if (edge === "in") {
                    var newIn = l.inPoint + snapDelta;
                    if (newIn >= l.outPoint - 1 / frameRate) continue;
                    var savedOut = l.outPoint;
                    l.inPoint = newIn;
                    if (Math.abs(l.outPoint - savedOut) > 0.001) l.outPoint = savedOut;
                } else {
                    var newOut = l.outPoint + snapDelta;
                    if (newOut <= l.inPoint + 1 / frameRate) continue;
                    var savedIn = l.inPoint;
                    l.outPoint = newOut;
                    if (Math.abs(l.inPoint - savedIn) > 0.001) l.inPoint = savedIn;
                }
            }
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Rate stretch a group of layers by the same time delta. Each layer's own
 * original duration is used to derive its per-layer stretch ratio so the
 * matching edge of every layer shifts by the same delta in seconds — this
 * is how Premiere's Rate Stretch tool behaves when multiple clips on
 * different tracks are selected together.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @param {number} deltaOffset - Time offset to apply to the matching edge of each layer
 * @param {string} anchorEdge - 'left' (anchor inPoint, stretch right) or 'right' (anchor outPoint, stretch left)
 * @returns {string} JSON result
 */
function rateStretchLayers(layerIndicesJson, deltaOffset, anchorEdge) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var indices = JSON.parse(layerIndicesJson);
        if (!indices || !indices.length) return makeResult(false, "No layers");

        app.beginUndoGroup("Railcut: Rate Stretch");
        try {
            var frameRate = comp.frameRate;
            var layers = [];
            for (var i = 0; i < indices.length; i++) {
                var lr = comp.layer(indices[i]);
                if (!lr || lr.locked) continue;
                layers.push(lr);
            }
            for (var j = 0; j < layers.length; j++) {
                var l = layers[j];
                var origDuration = l.outPoint - l.inPoint;
                var newDur = origDuration + deltaOffset;
                if (newDur <= 1 / frameRate) continue; // skip degenerate
                var ratio = newDur / origDuration;
                applyRateStretchToLayer(l, ratio, anchorEdge, frameRate);
            }
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Rate stretch - change clip playback speed by dragging an edge
 * @param {number} layerIndex - Layer to stretch
 * @param {number} newDuration - New duration in seconds
 * @param {string} anchorEdge - Which edge to keep fixed: 'left' (inPoint) or 'right' (outPoint)
 * @param {number} partnerLayerIndex - Optional 1-based partner layer to stretch in lockstep (linked pair). Pass 0 for none.
 * @returns {string} JSON result
 */
function rateStretch(layerIndex, newDuration, anchorEdge, partnerLayerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        var partnerLayer = null;
        if (partnerLayerIndex && partnerLayerIndex > 0 && partnerLayerIndex !== layerIndex) {
            var pcheck = getLayerChecked(comp, partnerLayerIndex, true);
            if (!pcheck.error) partnerLayer = pcheck.layer;
        }

        app.beginUndoGroup("Railcut: Rate Stretch");

        try {
            var frameRate = comp.frameRate;
            var currentInPoint = layer.inPoint;
            var currentOutPoint = layer.outPoint;
            var originalDuration = currentOutPoint - currentInPoint;

            // Calculate new stretch ratio (same for both halves of a linked pair).
            // ratio = newDuration / originalDuration; per-layer newStretch = stretch * ratio.
            var stretchRatio = newDuration / originalDuration;

            applyRateStretchToLayer(layer, stretchRatio, anchorEdge, frameRate);
            if (partnerLayer) {
                applyRateStretchToLayer(partnerLayer, stretchRatio, anchorEdge, frameRate);
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

function applyRateStretchToLayer(layer, stretchRatio, anchorEdge, frameRate) {
    var currentInPoint = layer.inPoint;
    var currentOutPoint = layer.outPoint;
    var currentStartTime = layer.startTime;
    var originalStretch = layer.stretch;

    var newStretch = originalStretch * stretchRatio;
    if (newStretch < 10) newStretch = 10;
    if (newStretch > 1000) newStretch = 1000;

    // Source times at in/out points (must be preserved across the stretch).
    var sourceInTime = (currentInPoint - currentStartTime) * 100 / originalStretch;
    var sourceOutTime = (currentOutPoint - currentStartTime) * 100 / originalStretch;

    layer.stretch = newStretch;

    if (anchorEdge === 'right') {
        // Anchor outPoint — user dragged in point (left edge)
        var newStartTimeR = snapToFrame(currentOutPoint - sourceOutTime * newStretch / 100, frameRate);
        var newInPointR = snapToFrame(newStartTimeR + sourceInTime * newStretch / 100, frameRate);
        layer.startTime = newStartTimeR;
        layer.inPoint = newInPointR;
        layer.outPoint = currentOutPoint;
    } else {
        // Anchor inPoint — user dragged out point (right edge)
        var newStartTimeL = snapToFrame(currentInPoint - sourceInTime * newStretch / 100, frameRate);
        var newOutPointL = snapToFrame(newStartTimeL + sourceOutTime * newStretch / 100, frameRate);
        layer.startTime = newStartTimeL;
        layer.inPoint = currentInPoint;
        layer.outPoint = newOutPointL;
    }
}

/**
 * Slip a layer - change which source content is visible without moving in/out points
 * This is equivalent to After Effects' Pan Behind tool behavior
 * @param {number} layerIndex - Layer to slip
 * @param {number} newStartTime - New start time for the layer
 * @param {boolean} isLive - If true, skip undo group (for live preview during drag)
 * @returns {string} JSON result
 */
function slipLayer(layerIndex, newStartTime, isLive) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        // Only create undo group for final (non-live) updates
        if (!isLive) {
            app.beginUndoGroup("Railcut: Slip");
        }

        try {
            var frameRate = comp.frameRate;

            // Store current in/out points - these define where the layer appears in the timeline
            var currentInPoint = layer.inPoint;
            var currentOutPoint = layer.outPoint;

            // Snap to frame boundary
            var snappedStartTime = snapToFrame(newStartTime, frameRate);

            // Change startTime - this shifts which source content is visible
            // NOTE: In AE, changing startTime also shifts inPoint/outPoint automatically
            layer.startTime = snappedStartTime;

            // Restore in/out points to keep the layer at the same position in the timeline
            // This is what makes it a "slip" - the layer stays in place but shows different content
            layer.inPoint = currentInPoint;
            layer.outPoint = currentOutPoint;

        } finally {
            if (!isLive) {
                app.endUndoGroup();
            }
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Begin an undo group for slip operations
 * Call this on mouseDown, then all live updates will be in this group
 * @returns {string} JSON result
 */
function beginSlipUndoGroup() {
    try {
        app.beginUndoGroup("Railcut: Slip");
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * End the slip undo group
 * Call this on mouseUp after all slip operations are done
 * @returns {string} JSON result
 */
function endSlipUndoGroup() {
    try {
        app.endUndoGroup();
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Generic outer undo group, plus a suppression flag that lets nested ES ops
 * skip their own beginUndoGroup/endUndoGroup. AE doesn't actually merge nested
 * undo groups — the first endUndoGroup closes the active group regardless of
 * how many beginUndoGroups preceded it. So instead, we open an outer group
 * here and *skip* the inner group calls entirely while the flag is set.
 */
var __railcutInOuterUndoGroup = false;

function beginRailcutUndoGroup(name) {
    try {
        app.beginUndoGroup(name || "Railcut: Op");
        __railcutInOuterUndoGroup = true;
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

function endRailcutUndoGroup() {
    try {
        __railcutInOuterUndoGroup = false;
        app.endUndoGroup();
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/** Helpers for ES functions: replace the begin/end pair when an outer group is open. */
function rcBeginUndo(name) {
    if (!__railcutInOuterUndoGroup) {
        app.beginUndoGroup(name);
    }
}
function rcEndUndo() {
    if (!__railcutInOuterUndoGroup) {
        app.endUndoGroup();
    }
}

/**
 * Slip multiple layers by the same delta offset
 * @param {string} layerIndicesJson - JSON array of layer indices
 * @param {number} deltaOffset - Time offset to apply to all layers' startTime
 * @param {boolean} isLive - If true, undo group is already open from beginSlipUndoGroup
 * @returns {string} JSON result
 */
function slipLayers(layerIndicesJson, deltaOffset, isLive, autoSplitMapJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) {
            return makeResult(false, "No layers specified");
        }

        // Auto-split map: regular A/V members of an unlinked-side multi-clip
        // slip get promoted to a linked pair (matching role kept on the
        // original ref) so we slip only the chosen side and the other side
        // stays at original timing. Only applies on the final commit
        // (isLive=false) — live previews don't promote.
        var autoSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        // Only create undo group for final (non-live) updates
        if (!isLive) {
            app.beginUndoGroup("Railcut: Slip");
        }

        try {
            var frameRate = comp.frameRate;
            var snappedDelta = snapToFrame(deltaOffset, frameRate);

            // Collect and validate all layers first
            var layers = [];
            for (var i = 0; i < layerIndices.length; i++) {
                var layer = comp.layer(layerIndices[i]);
                if (!layer) {
                    return makeResult(false, "Layer not found: " + layerIndices[i]);
                }
                if (layer.locked) {
                    return makeResult(false, "Layer is locked: " + layerIndices[i]);
                }
                layers.push(layer);
            }

            // Auto-split partial-lock / unlinked A/V members BEFORE slipping.
            // Refs survive the index shifts caused by promote(), so the slip
            // loop below operates on the same refs (now the matching role).
            // Track the new dups so the caller can pin them to their parent
            // tracks (otherwise the dups auto-pack to V1/A1 on reload).
            var splitInfos = [];
            if (autoSplitMap && !isLive) {
                for (var asi = 0; asi < layerIndices.length; asi++) {
                    var srcIdx = layerIndices[asi];
                    var asRole = autoSplitMap[String(srcIdx)];
                    if (asRole !== "video" && asRole !== "audio") continue;
                    try {
                        var ref = layers[asi];
                        var pair = promoteAVLayerToLinkedPair(ref, { originalRole: asRole });
                        var dupLinkRole = (asRole === "video") ? "audio" : "video";
                        splitInfos.push({
                            sourceIndex: srcIdx,
                            rcId: pair.dupRcId,
                            linkRole: dupLinkRole
                        });
                    } catch (eAs) { /* best effort */ }
                }
            }

            // Slip all layers by the same delta
            for (var j = 0; j < layers.length; j++) {
                var layer = layers[j];

                // Store current in/out points
                var currentInPoint = layer.inPoint;
                var currentOutPoint = layer.outPoint;

                // Apply delta to startTime
                layer.startTime = layer.startTime + snappedDelta;

                // Restore in/out points to keep layer in same timeline position
                layer.inPoint = currentInPoint;
                layer.outPoint = currentOutPoint;
            }

        } finally {
            if (!isLive) {
                app.endUndoGroup();
            }
        }

        if (splitInfos.length > 0) {
            return JSON.stringify({ success: true, splitLayers: splitInfos });
        }
        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Restore layers to their original startTimes (used to undo live slip updates before final commit)
 * @param {string} startTimesJson - JSON object mapping layer index to original startTime
 * @returns {string} JSON result
 */
function restoreStartTimes(startTimesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var startTimes = JSON.parse(startTimesJson);

        // No undo group - this is a silent restore before the final undoable operation
        for (var indexStr in startTimes) {
            if (startTimes.hasOwnProperty(indexStr)) {
                var layerIndex = parseInt(indexStr, 10);
                var originalStartTime = startTimes[indexStr];
                var layer = comp.layer(layerIndex);

                if (layer && !layer.locked) {
                    // Store current in/out points
                    var currentInPoint = layer.inPoint;
                    var currentOutPoint = layer.outPoint;

                    // Restore original startTime
                    layer.startTime = originalStartTime;

                    // Restore in/out points
                    layer.inPoint = currentInPoint;
                    layer.outPoint = currentOutPoint;
                }
            }
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Final slip operation that restores original state and applies slip in one undo group
 * This ensures live updates + final slip = single undo step
 * @param {string} layerIndicesJson - JSON array of layer indices to slip
 * @param {number} deltaOffset - Time offset to apply to all layers' startTime
 * @param {string} originalStartTimesJson - JSON object mapping layer index to original startTime (for undo fix)
 * @returns {string} JSON result
 */
function slipLayersFinal(layerIndicesJson, deltaOffset, originalStartTimesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) {
            return makeResult(false, "No layers specified");
        }

        var originalStartTimes = originalStartTimesJson ? JSON.parse(originalStartTimesJson) : null;

        app.beginUndoGroup("Railcut: Slip");

        try {
            var frameRate = comp.frameRate;
            var snappedDelta = snapToFrame(deltaOffset, frameRate);

            // First, restore all layers to their original startTimes (undo live updates)
            if (originalStartTimes) {
                for (var indexStr in originalStartTimes) {
                    if (originalStartTimes.hasOwnProperty(indexStr)) {
                        var layerIndex = parseInt(indexStr, 10);
                        var originalStartTime = originalStartTimes[indexStr];
                        var layer = comp.layer(layerIndex);

                        if (layer && !layer.locked) {
                            var currentInPoint = layer.inPoint;
                            var currentOutPoint = layer.outPoint;
                            layer.startTime = originalStartTime;
                            layer.inPoint = currentInPoint;
                            layer.outPoint = currentOutPoint;
                        }
                    }
                }
            }

            // Now apply the final slip
            for (var i = 0; i < layerIndices.length; i++) {
                var layer = comp.layer(layerIndices[i]);
                if (layer && !layer.locked) {
                    var currentInPoint = layer.inPoint;
                    var currentOutPoint = layer.outPoint;

                    layer.startTime = layer.startTime + snappedDelta;

                    layer.inPoint = currentInPoint;
                    layer.outPoint = currentOutPoint;
                }
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Slide a layer in time, adjusting adjacent clips' in/out points
 * @param {number} layerIndex - The layer index to slide
 * @param {number} delta - Time offset to slide by (positive = right, negative = left)
 * @param {number|null} beforeClipIndex - Index of clip before (or null if none)
 * @param {number|null} afterClipIndex - Index of clip after (or null if none)
 * @returns {string} JSON result
 */
/**
 * Inner body of slideLayer. Caller manages the undo group. Returns nothing.
 *   skipMap:    layerIndex → true. Layers on locked tracks that should be left
 *               untouched entirely.
 *   splitMap:   layerIndex → 'video' | 'audio'. Partial-lock regular A/V
 *               adjacent clips. Promote to a linked pair, then adjust only
 *               the named (unlocked) role's edge.
 */
function _performSlide(comp, layer, delta, beforeClipIndex, afterClipIndex, unlinkedMode, skipMap, splitMap) {
    var frameRate = comp.frameRate;
    var snappedDelta = snapToFrame(delta, frameRate);
    if (Math.abs(snappedDelta) < 0.0001) return;

    var sm = skipMap || {};
    var spm = splitMap || {};
    var isFrozen = function(l) { try { return !!sm[l.index]; } catch (e) { return false; } };

    // Capture refs to before/after BEFORE modifications. promoteAVLayerToLinkedPair
    // shifts indices, so resolve once and use refs for the remaining work.
    var beforeLayer = (beforeClipIndex !== null && beforeClipIndex > 0) ? comp.layer(beforeClipIndex) : null;
    var afterLayer = (afterClipIndex !== null && afterClipIndex > 0) ? comp.layer(afterClipIndex) : null;
    var beforeSplitRole = beforeLayer ? spm[beforeLayer.index] : null;
    var afterSplitRole = afterLayer ? spm[afterLayer.index] : null;

    // Move the main layer in time. If unlinkedMode (Alt+slide) the
    // linked partner stays put — Alt selects/edits one component only.
    if (!isFrozen(layer)) {
        layer.startTime = layer.startTime + snappedDelta;
    }
    if (!unlinkedMode) {
        var layerPartner = findLinkedPartner(comp, layer);
        if (layerPartner && !layerPartner.locked && !isFrozen(layerPartner)) {
            layerPartner.startTime = layerPartner.startTime + snappedDelta;
        }
    }

    // Before clip's outPoint adjustment.
    if (beforeLayer && !beforeLayer.locked && !isFrozen(beforeLayer)) {
        if (beforeSplitRole) {
            // Partial-lock A/V: capture original, shift outPoint, then split
            // so the dup (opposite role) lands at original timing.
            var bOrigStart = beforeLayer.startTime;
            var bOrigIn = beforeLayer.inPoint;
            var bOrigOut = beforeLayer.outPoint;
            beforeLayer.outPoint = beforeLayer.outPoint + snappedDelta;
            var bLinkId = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 8);
            _performJLSplit(beforeLayer, beforeSplitRole, bOrigStart, bOrigIn, bOrigOut, bLinkId);
        } else {
            beforeLayer.outPoint = beforeLayer.outPoint + snappedDelta;
            var beforePartner = findLinkedPartner(comp, beforeLayer);
            if (beforePartner && !beforePartner.locked && !isFrozen(beforePartner)) {
                beforePartner.outPoint = beforePartner.outPoint + snappedDelta;
            }
        }
    }

    // After clip's inPoint adjustment (defensively guard outPoint).
    if (afterLayer && !afterLayer.locked && !isFrozen(afterLayer)) {
        if (afterSplitRole) {
            var aOrigStart = afterLayer.startTime;
            var aOrigIn = afterLayer.inPoint;
            var aOrigOut = afterLayer.outPoint;
            var savedAfterOut = afterLayer.outPoint;
            afterLayer.inPoint = afterLayer.inPoint + snappedDelta;
            if (Math.abs(afterLayer.outPoint - savedAfterOut) > 0.001) afterLayer.outPoint = savedAfterOut;
            var aLinkId = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 8);
            _performJLSplit(afterLayer, afterSplitRole, aOrigStart, aOrigIn, aOrigOut, aLinkId);
        } else {
            var afterOriginalOutPoint = afterLayer.outPoint;
            afterLayer.inPoint = afterLayer.inPoint + snappedDelta;
            if (Math.abs(afterLayer.outPoint - afterOriginalOutPoint) > 0.001) {
                afterLayer.outPoint = afterOriginalOutPoint;
            }
            var afterPartner = findLinkedPartner(comp, afterLayer);
            if (afterPartner && !afterPartner.locked && !isFrozen(afterPartner)) {
                var afterPartnerOrigOut = afterPartner.outPoint;
                afterPartner.inPoint = afterPartner.inPoint + snappedDelta;
                if (Math.abs(afterPartner.outPoint - afterPartnerOrigOut) > 0.001) {
                    afterPartner.outPoint = afterPartnerOrigOut;
                }
            }
        }
    }
}

function slideLayer(layerIndex, delta, beforeClipIndex, afterClipIndex, unlinkedMode, lockedIndicesJson, autoSplitMapJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        var skipMap = null;
        if (lockedIndicesJson) {
            var arr = JSON.parse(lockedIndicesJson);
            skipMap = {};
            for (var i = 0; i < arr.length; i++) skipMap[arr[i]] = true;
        }
        var splitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: Slide");
        try {
            _performSlide(comp, layer, delta, beforeClipIndex, afterClipIndex, unlinkedMode, skipMap, splitMap);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Slide multiple layers in time, adjusting adjacent clips' in/out points
 * @param {string} layerIndicesJson - JSON array of layer indices to slide
 * @param {number} delta - Time offset to slide by (positive = right, negative = left)
 * @param {number|null} beforeClipIndex - Index of clip before the group (or null if none)
 * @param {number|null} afterClipIndex - Index of clip after the group (or null if none)
 * @returns {string} JSON result
 */
function slideLayers(layerIndicesJson, delta, beforeClipIndex, afterClipIndex, lockedIndicesJson, autoSplitMapJson, unlinkedMode) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) {
            return makeResult(false, "No layers specified");
        }

        var skipMap = {};
        if (lockedIndicesJson) {
            var lockedArr = JSON.parse(lockedIndicesJson);
            for (var lk = 0; lk < lockedArr.length; lk++) skipMap[lockedArr[lk]] = true;
        }

        // Auto-split map: regular A/V members of an unlinked-side multi-clip
        // slide get promoted to a linked pair (matching role on the original
        // ref) so we slide only the chosen side. The opposite-role dup stays
        // at original timing.
        var autoSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: Slide");

        try {
            var frameRate = comp.frameRate;
            var snappedDelta = snapToFrame(delta, frameRate);

            if (Math.abs(snappedDelta) < 0.0001) {
                return makeResult(true);
            }

            // Collect and validate all layers first. Capture before/after
            // refs HERE — promoteAVLayerToLinkedPair below shifts indices,
            // and stale indices would resolve to the wrong layer.
            var layers = [];
            for (var i = 0; i < layerIndices.length; i++) {
                var layer = comp.layer(layerIndices[i]);
                if (!layer) {
                    return makeResult(false, "Layer not found: " + layerIndices[i]);
                }
                if (layer.locked) {
                    return makeResult(false, "Layer is locked: " + layerIndices[i]);
                }
                layers.push(layer);
            }
            var beforeLayerRef = (beforeClipIndex !== null && beforeClipIndex > 0)
                ? comp.layer(beforeClipIndex) : null;
            var afterLayerRef = (afterClipIndex !== null && afterClipIndex > 0)
                ? comp.layer(afterClipIndex) : null;
            var beforeSplitRoleMulti = (beforeLayerRef && autoSplitMap)
                ? autoSplitMap[String(beforeClipIndex)] : null;
            var afterSplitRoleMulti = (afterLayerRef && autoSplitMap)
                ? autoSplitMap[String(afterClipIndex)] : null;

            // Auto-split partial-lock / unlinked A/V members BEFORE sliding.
            // Refs survive the index shifts caused by promote(), so the slide
            // loop below operates on the same refs (now the matching role).
            // Track new dups so the caller can pin them to their parent V/A
            // tracks — slide doesn't change track membership.
            var splitInfos = [];
            if (autoSplitMap) {
                for (var asi = 0; asi < layerIndices.length; asi++) {
                    var srcIdx = layerIndices[asi];
                    var asRole = autoSplitMap[String(srcIdx)];
                    if (asRole !== "video" && asRole !== "audio") continue;
                    try {
                        var pair = promoteAVLayerToLinkedPair(layers[asi], { originalRole: asRole });
                        var dupLinkRole = (asRole === "video") ? "audio" : "video";
                        splitInfos.push({
                            sourceIndex: srcIdx,
                            rcId: pair.dupRcId,
                            linkRole: dupLinkRole
                        });
                    } catch (eAs) { /* best effort */ }
                }
            }

            // Move all moved layers in time (skip layers on locked tracks)
            for (var j = 0; j < layers.length; j++) {
                if (skipMap[layers[j].index]) continue;
                layers[j].startTime = layers[j].startTime + snappedDelta;
            }

            // Adjust before clip's outPoint (extends/trims to fill gap).
            // Use the ref captured pre-promote so we don't operate on a
            // shifted-index neighbour. When the adjacent is also flagged
            // for auto-split (Alt-slide on regular A/V before/after),
            // shift its outPoint AND J/L-split it so only the matching
            // side's edit point moves.
            if (beforeLayerRef && !beforeLayerRef.locked && !skipMap[beforeLayerRef.index]) {
                if (beforeSplitRoleMulti === "video" || beforeSplitRoleMulti === "audio") {
                    var bOrigStart = beforeLayerRef.startTime;
                    var bOrigIn = beforeLayerRef.inPoint;
                    var bOrigOut = beforeLayerRef.outPoint;
                    beforeLayerRef.outPoint = beforeLayerRef.outPoint + snappedDelta;
                    var bLinkId = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 8);
                    var beforeSplitResult = _performJLSplit(beforeLayerRef, beforeSplitRoleMulti, bOrigStart, bOrigIn, bOrigOut, bLinkId);
                    if (beforeSplitResult && beforeSplitResult.dupRcId) {
                        splitInfos.push({
                            sourceIndex: beforeClipIndex,
                            rcId: beforeSplitResult.dupRcId,
                            linkRole: beforeSplitRoleMulti === "video" ? "audio" : "video"
                        });
                    }
                } else {
                    beforeLayerRef.outPoint = beforeLayerRef.outPoint + snappedDelta;
                    // In unlinked-side mode the partner stays put — Alt-slide
                    // only shifts the matching side's edge, even if the
                    // adjacent has already become a linked pair from an
                    // earlier slide in the same selection.
                    if (!unlinkedMode) {
                        var beforePartner2 = findLinkedPartner(comp, beforeLayerRef);
                        if (beforePartner2 && !beforePartner2.locked && !skipMap[beforePartner2.index]) {
                            beforePartner2.outPoint = beforePartner2.outPoint + snappedDelta;
                        }
                    }
                }
            }

            // Adjust after clip's inPoint (extends/trims to fill gap).
            if (afterLayerRef && !afterLayerRef.locked && !skipMap[afterLayerRef.index]) {
                if (afterSplitRoleMulti === "video" || afterSplitRoleMulti === "audio") {
                    var aOrigStart = afterLayerRef.startTime;
                    var aOrigIn = afterLayerRef.inPoint;
                    var aOrigOut = afterLayerRef.outPoint;
                    var savedAfterOutMulti = afterLayerRef.outPoint;
                    afterLayerRef.inPoint = afterLayerRef.inPoint + snappedDelta;
                    if (Math.abs(afterLayerRef.outPoint - savedAfterOutMulti) > 0.001) {
                        afterLayerRef.outPoint = savedAfterOutMulti;
                    }
                    var aLinkId = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 8);
                    var afterSplitResult = _performJLSplit(afterLayerRef, afterSplitRoleMulti, aOrigStart, aOrigIn, aOrigOut, aLinkId);
                    if (afterSplitResult && afterSplitResult.dupRcId) {
                        splitInfos.push({
                            sourceIndex: afterClipIndex,
                            rcId: afterSplitResult.dupRcId,
                            linkRole: afterSplitRoleMulti === "video" ? "audio" : "video"
                        });
                    }
                } else {
                    var afterOriginalOutPoint = afterLayerRef.outPoint;
                    afterLayerRef.inPoint = afterLayerRef.inPoint + snappedDelta;
                    if (Math.abs(afterLayerRef.outPoint - afterOriginalOutPoint) > 0.001) {
                        afterLayerRef.outPoint = afterOriginalOutPoint;
                    }
                    // Same unlinked-mode guard as the before branch.
                    if (!unlinkedMode) {
                        var afterPartner2 = findLinkedPartner(comp, afterLayerRef);
                        if (afterPartner2 && !afterPartner2.locked && !skipMap[afterPartner2.index]) {
                            var afterPartner2OrigOut = afterPartner2.outPoint;
                            afterPartner2.inPoint = afterPartner2.inPoint + snappedDelta;
                            if (Math.abs(afterPartner2.outPoint - afterPartner2OrigOut) > 0.001) {
                                afterPartner2.outPoint = afterPartner2OrigOut;
                            }
                        }
                    }
                }
            }

        } finally {
            app.endUndoGroup();
        }

        if (splitInfos.length > 0) {
            return JSON.stringify({ success: true, splitLayers: splitInfos });
        }
        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

// ============================================
// Audio Level Keyframe Operations
// ============================================

/**
 * Add or update an audio keyframe at the given time.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} time - Keyframe time in comp seconds
 * @param {number} db - Decibel value (applied to both L/R channels)
 * @param {string} interpType - "linear", "hold", or "bezier"
 */
function addAudioKeyframe(layerIndex, time, db, interpType) {
    try {
        var alResult = getAudioLevelsProperty(layerIndex);
        if (alResult.error) return makeResult(false, alResult.error);
        var audioLevels = alResult.audioLevels;

        app.beginUndoGroup("Railcut: Add Audio Keyframe");
        try {
            // setValueAtTime creates or updates keyframe
            audioLevels.setValueAtTime(time, [db, db]);

            // Set interpolation type
            var interp = KeyframeInterpolationType.LINEAR;
            if (interpType === "hold") {
                interp = KeyframeInterpolationType.HOLD;
            } else if (interpType === "bezier") {
                interp = KeyframeInterpolationType.BEZIER;
            }

            // Find the keyframe index at this time
            var keyIdx = audioLevels.nearestKeyIndex(time);
            if (keyIdx > 0 && Math.abs(audioLevels.keyTime(keyIdx) - time) < 0.0001) {
                audioLevels.setInterpolationTypeAtKey(keyIdx, interp, interp);
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Update an existing audio keyframe: move it in time and/or change its dB value.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} originalTime - Current keyframe time
 * @param {number} newTime - New keyframe time (same as original if only changing value)
 * @param {number} db - New dB value
 */
function updateAudioKeyframe(layerIndex, originalTime, newTime, db) {
    try {
        var alResult = getAudioLevelsProperty(layerIndex);
        if (alResult.error) return makeResult(false, alResult.error);
        var audioLevels = alResult.audioLevels;

        app.beginUndoGroup("Railcut: Update Audio Keyframe");
        try {
            // Find the keyframe at originalTime
            var keyIdx = audioLevels.nearestKeyIndex(originalTime);
            if (keyIdx < 1 || Math.abs(audioLevels.keyTime(keyIdx) - originalTime) > 0.001) {
                return makeResult(false, "No keyframe found at time " + originalTime);
            }

            // Read current interpolation before removing
            var inInterp = audioLevels.keyInInterpolationType(keyIdx);
            var outInterp = audioLevels.keyOutInterpolationType(keyIdx);

            if (Math.abs(originalTime - newTime) < 0.0001) {
                // Same time - just update value
                audioLevels.setValueAtKey(keyIdx, [db, db]);
            } else {
                // Different time - remove old, add new
                audioLevels.removeKey(keyIdx);
                audioLevels.setValueAtTime(newTime, [db, db]);

                // Restore interpolation on the new keyframe
                var newKeyIdx = audioLevels.nearestKeyIndex(newTime);
                if (newKeyIdx > 0 && Math.abs(audioLevels.keyTime(newKeyIdx) - newTime) < 0.0001) {
                    audioLevels.setInterpolationTypeAtKey(newKeyIdx, inInterp, outInterp);
                }
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Remove an audio keyframe at the given time.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} time - Keyframe time to remove
 */
function removeAudioKeyframe(layerIndex, time) {
    try {
        var alResult = getAudioLevelsProperty(layerIndex);
        if (alResult.error) return makeResult(false, alResult.error);
        var audioLevels = alResult.audioLevels;

        app.beginUndoGroup("Railcut: Remove Audio Keyframe");
        try {
            var keyIdx = audioLevels.nearestKeyIndex(time);
            if (keyIdx < 1 || Math.abs(audioLevels.keyTime(keyIdx) - time) > 0.001) {
                return makeResult(false, "No keyframe found at time " + time);
            }
            audioLevels.removeKey(keyIdx);

            // If no keyframes remain, the property reverts to its static value
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set a static audio level (removes all keyframes).
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} db - Decibel value
 */
function setAudioLevelStatic(layerIndex, db) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer || !layer.hasAudio) {
            return makeResult(false, "Layer " + layerIndex + " has no audio");
        }

        var audioLevels = layer.property("ADBE Audio Group").property("ADBE Audio Levels");
        if (!audioLevels) {
            return makeResult(false, "Cannot access audio levels property");
        }

        app.beginUndoGroup("Railcut: Set Audio Level");
        try {
            // Remove all existing keyframes (iterate backward)
            for (var i = audioLevels.numKeys; i >= 1; i--) {
                audioLevels.removeKey(i);
            }
            // Set static value
            audioLevels.setValue([db, db]);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}


/**
 * Set interpolation type(s) for an audio keyframe.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} time - Keyframe time
 * @param {string} inInterpType - "linear", "hold", or "bezier"
 * @param {string} outInterpType - "linear", "hold", or "bezier"
 * @param {boolean} autoBezier - Whether to set temporal auto-bezier
 * @param {boolean} continuous - Whether to set temporal continuous
 */
function setAudioKeyframeInterpolation(layerIndex, time, inInterpType, outInterpType, autoBezier, continuous) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer || !layer.hasAudio) {
            return makeResult(false, "Layer " + layerIndex + " has no audio");
        }

        var audioLevels = layer.property("ADBE Audio Group").property("ADBE Audio Levels");
        if (!audioLevels) {
            return makeResult(false, "Cannot access audio levels property");
        }

        app.beginUndoGroup("Railcut: Set Keyframe Interpolation");
        try {
            var keyIdx = audioLevels.nearestKeyIndex(time);
            if (keyIdx < 1 || Math.abs(audioLevels.keyTime(keyIdx) - time) > 0.001) {
                return makeResult(false, "No keyframe at time " + time);
            }

            var inInterp = KeyframeInterpolationType.LINEAR;
            if (inInterpType === "hold") inInterp = KeyframeInterpolationType.HOLD;
            else if (inInterpType === "bezier") inInterp = KeyframeInterpolationType.BEZIER;

            var outInterp = KeyframeInterpolationType.LINEAR;
            if (outInterpType === "hold") outInterp = KeyframeInterpolationType.HOLD;
            else if (outInterpType === "bezier") outInterp = KeyframeInterpolationType.BEZIER;

            audioLevels.setInterpolationTypeAtKey(keyIdx, inInterp, outInterp);

            // Set auto-bezier and continuous flags if applicable
            if (typeof autoBezier !== "undefined") {
                audioLevels.setTemporalAutoBezierAtKey(keyIdx, !!autoBezier);
            }
            if (typeof continuous !== "undefined") {
                audioLevels.setTemporalContinuousAtKey(keyIdx, !!continuous);
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set temporal ease at an audio keyframe (for bezier handle control).
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} time - Keyframe time
 * @param {number} inSpeed - Incoming ease speed (dB/sec)
 * @param {number} inInfluence - Incoming ease influence (0-100)
 * @param {number} outSpeed - Outgoing ease speed (dB/sec)
 * @param {number} outInfluence - Outgoing ease influence (0-100)
 */
function setAudioKeyframeTemporalEase(layerIndex, time, inSpeed, inInfluence, outSpeed, outInfluence) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer || !layer.hasAudio) {
            return makeResult(false, "Layer " + layerIndex + " has no audio");
        }

        var audioLevels = layer.property("ADBE Audio Group").property("ADBE Audio Levels");
        if (!audioLevels) {
            return makeResult(false, "Cannot access audio levels property");
        }

        app.beginUndoGroup("Railcut: Set Temporal Ease");
        try {
            var keyIdx = audioLevels.nearestKeyIndex(time);
            if (keyIdx < 1 || Math.abs(audioLevels.keyTime(keyIdx) - time) > 0.001) {
                return makeResult(false, "No keyframe at time " + time);
            }

            // Audio Levels is 2D [L, R] - set both channels identically
            var inEaseArr = [
                new KeyframeEase(inSpeed, inInfluence),
                new KeyframeEase(inSpeed, inInfluence)
            ];
            var outEaseArr = [
                new KeyframeEase(outSpeed, outInfluence),
                new KeyframeEase(outSpeed, outInfluence)
            ];
            audioLevels.setTemporalEaseAtKey(keyIdx, inEaseArr, outEaseArr);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Move multiple audio keyframes to new times/values in one undo group.
 * Used by pen tool multi-keyframe group drag.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {string} movesJson - JSON array of {originalTime, newTime, leftDB, rightDB}
 */
function moveAudioKeyframesBatch(layerIndex, movesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer || !layer.hasAudio) {
            return makeResult(false, "Layer " + layerIndex + " has no audio");
        }

        var audioLevels = layer.property("ADBE Audio Group").property("ADBE Audio Levels");
        if (!audioLevels) {
            return makeResult(false, "Cannot access audio levels property");
        }

        var moves = JSON.parse(movesJson);

        // Sort by originalTime descending to avoid index shifting when removing
        for (var s = 0; s < moves.length - 1; s++) {
            for (var t = s + 1; t < moves.length; t++) {
                if (moves[t].originalTime > moves[s].originalTime) {
                    var tmp = moves[s];
                    moves[s] = moves[t];
                    moves[t] = tmp;
                }
            }
        }

        app.beginUndoGroup("Railcut: Move Audio Keyframes");
        try {
            // First pass: collect interpolation info and remove old keyframes (reverse time order)
            var savedInterps = [];
            for (var i = 0; i < moves.length; i++) {
                var keyIdx = audioLevels.nearestKeyIndex(moves[i].originalTime);
                if (keyIdx < 1 || Math.abs(audioLevels.keyTime(keyIdx) - moves[i].originalTime) > 0.001) {
                    savedInterps.push(null);
                    continue;
                }

                var inInterp = audioLevels.keyInInterpolationType(keyIdx);
                var outInterp = audioLevels.keyOutInterpolationType(keyIdx);
                var inEase = null;
                var outEase = null;
                try {
                    inEase = audioLevels.keyInTemporalEase(keyIdx);
                    outEase = audioLevels.keyOutTemporalEase(keyIdx);
                } catch (easeErr) {
                    // Some interp types don't have ease
                }

                savedInterps.push({
                    inInterp: inInterp,
                    outInterp: outInterp,
                    inEase: inEase,
                    outEase: outEase
                });

                audioLevels.removeKey(keyIdx);
            }

            // Second pass: add new keyframes at new times (forward order for stability)
            for (var j = moves.length - 1; j >= 0; j--) {
                if (!savedInterps[j]) continue;

                var db = moves[j].leftDB;
                audioLevels.setValueAtTime(moves[j].newTime, [db, db]);

                var newKeyIdx = audioLevels.nearestKeyIndex(moves[j].newTime);
                if (newKeyIdx > 0 && Math.abs(audioLevels.keyTime(newKeyIdx) - moves[j].newTime) < 0.001) {
                    audioLevels.setInterpolationTypeAtKey(newKeyIdx, savedInterps[j].inInterp, savedInterps[j].outInterp);

                    if (savedInterps[j].inEase && savedInterps[j].outEase) {
                        try {
                            audioLevels.setTemporalEaseAtKey(newKeyIdx, savedInterps[j].inEase, savedInterps[j].outEase);
                        } catch (easeErr2) {
                            // Ease may not apply for all interp types
                        }
                    }
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Update dB values for multiple keyframes in one undo group.
 * Used by selection tool rubber band segment drag.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {string} updatesJson - JSON array of {time: number, db: number}
 */
function updateAudioKeyframesBatch(layerIndex, updatesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer || !layer.hasAudio) {
            return makeResult(false, "Layer " + layerIndex + " has no audio");
        }

        var audioLevels = layer.property("ADBE Audio Group").property("ADBE Audio Levels");
        if (!audioLevels) {
            return makeResult(false, "Cannot access audio levels property");
        }

        var updates = JSON.parse(updatesJson);

        app.beginUndoGroup("Railcut: Adjust Audio Level");
        try {
            for (var i = 0; i < updates.length; i++) {
                var keyIdx = audioLevels.nearestKeyIndex(updates[i].time);
                if (keyIdx > 0 && Math.abs(audioLevels.keyTime(keyIdx) - updates[i].time) < 0.001) {
                    audioLevels.setValueAtKey(keyIdx, [updates[i].db, updates[i].db]);
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

// ============================================
// Opacity Keyframe Functions
// ============================================

/**
 * Add or update an opacity keyframe at the given time.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} time - Keyframe time in comp seconds
 * @param {number} value - Opacity value (0-100)
 * @param {string} interpType - "linear", "hold", or "bezier"
 */
function addOpacityKeyframe(layerIndex, time, value, interpType) {
    try {
        var opResult = getOpacityProperty(layerIndex);
        if (opResult.error) return makeResult(false, opResult.error);
        var opacity = opResult.opacity;

        app.beginUndoGroup("Railcut: Add Opacity Keyframe");
        try {
            opacity.setValueAtTime(time, value);

            var interp = KeyframeInterpolationType.LINEAR;
            if (interpType === "hold") {
                interp = KeyframeInterpolationType.HOLD;
            } else if (interpType === "bezier") {
                interp = KeyframeInterpolationType.BEZIER;
            }

            var keyIdx = opacity.nearestKeyIndex(time);
            if (keyIdx > 0 && Math.abs(opacity.keyTime(keyIdx) - time) < 0.0001) {
                opacity.setInterpolationTypeAtKey(keyIdx, interp, interp);
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Update an existing opacity keyframe: move it in time and/or change its value.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} originalTime - Current keyframe time
 * @param {number} newTime - New keyframe time
 * @param {number} value - New opacity value (0-100)
 */
function updateOpacityKeyframe(layerIndex, originalTime, newTime, value) {
    try {
        var opResult = getOpacityProperty(layerIndex);
        if (opResult.error) return makeResult(false, opResult.error);
        var opacity = opResult.opacity;

        app.beginUndoGroup("Railcut: Update Opacity Keyframe");
        try {
            var keyIdx = opacity.nearestKeyIndex(originalTime);
            if (keyIdx < 1 || Math.abs(opacity.keyTime(keyIdx) - originalTime) > 0.001) {
                return makeResult(false, "No keyframe found at time " + originalTime);
            }

            var inInterp = opacity.keyInInterpolationType(keyIdx);
            var outInterp = opacity.keyOutInterpolationType(keyIdx);

            if (Math.abs(originalTime - newTime) < 0.0001) {
                opacity.setValueAtKey(keyIdx, value);
            } else {
                opacity.removeKey(keyIdx);
                opacity.setValueAtTime(newTime, value);

                var newKeyIdx = opacity.nearestKeyIndex(newTime);
                if (newKeyIdx > 0 && Math.abs(opacity.keyTime(newKeyIdx) - newTime) < 0.0001) {
                    opacity.setInterpolationTypeAtKey(newKeyIdx, inInterp, outInterp);
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Remove an opacity keyframe at the given time.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} time - Keyframe time to remove
 */
function removeOpacityKeyframe(layerIndex, time) {
    try {
        var opResult = getOpacityProperty(layerIndex);
        if (opResult.error) return makeResult(false, opResult.error);
        var opacity = opResult.opacity;

        app.beginUndoGroup("Railcut: Remove Opacity Keyframe");
        try {
            var keyIdx = opacity.nearestKeyIndex(time);
            if (keyIdx < 1 || Math.abs(opacity.keyTime(keyIdx) - time) > 0.001) {
                return makeResult(false, "No keyframe found at time " + time);
            }
            opacity.removeKey(keyIdx);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set a static opacity level (removes all keyframes).
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} value - Opacity value (0-100)
 */
function setOpacityStatic(layerIndex, value) {
    try {
        var opResult = getOpacityProperty(layerIndex);
        if (opResult.error) return makeResult(false, opResult.error);
        var opacity = opResult.opacity;

        app.beginUndoGroup("Railcut: Set Opacity Level");
        try {
            for (var i = opacity.numKeys; i >= 1; i--) {
                opacity.removeKey(i);
            }
            opacity.setValue(value);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set interpolation type(s) for an opacity keyframe.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} time - Keyframe time
 * @param {string} inInterpType - "linear", "hold", or "bezier"
 * @param {string} outInterpType - "linear", "hold", or "bezier"
 * @param {boolean} autoBezier - Whether to set temporal auto-bezier
 * @param {boolean} continuous - Whether to set temporal continuous
 */
function setOpacityKeyframeInterpolation(layerIndex, time, inInterpType, outInterpType, autoBezier, continuous) {
    try {
        var opResult = getOpacityProperty(layerIndex);
        if (opResult.error) return makeResult(false, opResult.error);
        var opacity = opResult.opacity;

        app.beginUndoGroup("Railcut: Set Opacity Keyframe Interpolation");
        try {
            var keyIdx = opacity.nearestKeyIndex(time);
            if (keyIdx < 1 || Math.abs(opacity.keyTime(keyIdx) - time) > 0.001) {
                return makeResult(false, "No keyframe at time " + time);
            }

            var inInterp = KeyframeInterpolationType.LINEAR;
            if (inInterpType === "hold") inInterp = KeyframeInterpolationType.HOLD;
            else if (inInterpType === "bezier") inInterp = KeyframeInterpolationType.BEZIER;

            var outInterp = KeyframeInterpolationType.LINEAR;
            if (outInterpType === "hold") outInterp = KeyframeInterpolationType.HOLD;
            else if (outInterpType === "bezier") outInterp = KeyframeInterpolationType.BEZIER;

            opacity.setInterpolationTypeAtKey(keyIdx, inInterp, outInterp);

            if (typeof autoBezier !== "undefined") {
                opacity.setTemporalAutoBezierAtKey(keyIdx, !!autoBezier);
            }
            if (typeof continuous !== "undefined") {
                opacity.setTemporalContinuousAtKey(keyIdx, !!continuous);
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set temporal ease at an opacity keyframe (for bezier handle control).
 * Opacity is 1D, so ease arrays have 1 element (unlike audio which is 2D).
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} time - Keyframe time
 * @param {number} inSpeed - Incoming ease speed
 * @param {number} inInfluence - Incoming ease influence (0-100)
 * @param {number} outSpeed - Outgoing ease speed
 * @param {number} outInfluence - Outgoing ease influence (0-100)
 */
function setOpacityKeyframeTemporalEase(layerIndex, time, inSpeed, inInfluence, outSpeed, outInfluence) {
    try {
        var opResult = getOpacityProperty(layerIndex);
        if (opResult.error) return makeResult(false, opResult.error);
        var opacity = opResult.opacity;

        app.beginUndoGroup("Railcut: Set Opacity Temporal Ease");
        try {
            var keyIdx = opacity.nearestKeyIndex(time);
            if (keyIdx < 1 || Math.abs(opacity.keyTime(keyIdx) - time) > 0.001) {
                return makeResult(false, "No keyframe at time " + time);
            }

            // Opacity is 1D - ease arrays have 1 element
            var inEaseArr = [new KeyframeEase(inSpeed, inInfluence)];
            var outEaseArr = [new KeyframeEase(outSpeed, outInfluence)];
            opacity.setTemporalEaseAtKey(keyIdx, inEaseArr, outEaseArr);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Move multiple opacity keyframes to new times/values in one undo group.
 * Used by pen tool multi-keyframe group drag.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {string} movesJson - JSON array of {originalTime, newTime, value}
 */
function moveOpacityKeyframesBatch(layerIndex, movesJson) {
    try {
        var opResult = getOpacityProperty(layerIndex);
        if (opResult.error) return makeResult(false, opResult.error);
        var opacity = opResult.opacity;

        var moves = JSON.parse(movesJson);

        // Sort by originalTime descending to avoid index shifting when removing
        for (var s = 0; s < moves.length - 1; s++) {
            for (var t = s + 1; t < moves.length; t++) {
                if (moves[t].originalTime > moves[s].originalTime) {
                    var tmp = moves[s];
                    moves[s] = moves[t];
                    moves[t] = tmp;
                }
            }
        }

        app.beginUndoGroup("Railcut: Move Opacity Keyframes");
        try {
            // First pass: collect interpolation info and remove old keyframes (reverse time order)
            var savedInterps = [];
            for (var i = 0; i < moves.length; i++) {
                var keyIdx = opacity.nearestKeyIndex(moves[i].originalTime);
                if (keyIdx < 1 || Math.abs(opacity.keyTime(keyIdx) - moves[i].originalTime) > 0.001) {
                    savedInterps.push(null);
                    continue;
                }

                var inInterp = opacity.keyInInterpolationType(keyIdx);
                var outInterp = opacity.keyOutInterpolationType(keyIdx);
                var inEase = null;
                var outEase = null;
                try {
                    inEase = opacity.keyInTemporalEase(keyIdx);
                    outEase = opacity.keyOutTemporalEase(keyIdx);
                } catch (easeErr) {
                    // Some interp types don't have ease
                }

                savedInterps.push({
                    inInterp: inInterp,
                    outInterp: outInterp,
                    inEase: inEase,
                    outEase: outEase
                });

                opacity.removeKey(keyIdx);
            }

            // Second pass: add new keyframes at new times (forward order for stability)
            for (var j = moves.length - 1; j >= 0; j--) {
                if (!savedInterps[j]) continue;

                opacity.setValueAtTime(moves[j].newTime, moves[j].value);

                var newKeyIdx = opacity.nearestKeyIndex(moves[j].newTime);
                if (newKeyIdx > 0 && Math.abs(opacity.keyTime(newKeyIdx) - moves[j].newTime) < 0.001) {
                    opacity.setInterpolationTypeAtKey(newKeyIdx, savedInterps[j].inInterp, savedInterps[j].outInterp);

                    if (savedInterps[j].inEase && savedInterps[j].outEase) {
                        try {
                            opacity.setTemporalEaseAtKey(newKeyIdx, savedInterps[j].inEase, savedInterps[j].outEase);
                        } catch (easeErr2) {
                            // Ease may not apply for all interp types
                        }
                    }
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Update opacity values for multiple keyframes in one undo group.
 * Used by selection tool rubber band segment drag.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {string} updatesJson - JSON array of {time: number, value: number}
 */
function updateOpacityKeyframesBatch(layerIndex, updatesJson) {
    try {
        var opResult = getOpacityProperty(layerIndex);
        if (opResult.error) return makeResult(false, opResult.error);
        var opacity = opResult.opacity;

        var updates = JSON.parse(updatesJson);

        app.beginUndoGroup("Railcut: Adjust Opacity Level");
        try {
            for (var i = 0; i < updates.length; i++) {
                var keyIdx = opacity.nearestKeyIndex(updates[i].time);
                if (keyIdx > 0 && Math.abs(opacity.keyTime(keyIdx) - updates[i].time) < 0.001) {
                    opacity.setValueAtKey(keyIdx, updates[i].value);
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Duplicate a single layer and place at a new time position.
 * @param {number} layerIndex - 1-based AE layer index
 * @param {number} newStartTime - New startTime for the duplicated layer
 * @returns {string} JSON result with success status and new layer index
 */
/**
 * @param {number} layerIndex
 * @param {number} newStartTime
 * @param {string} [componentOnly] - 'video' or 'audio' to create a partial duplicate
 */
function duplicateLayerToTime(layerIndex, newStartTime, componentOnly, skipIndicesJson, movedTracksJson, otherTracksJson) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return JSON.stringify({ success: false, error: "No active composition" });
        }

        var layer = comp.layer(layerIndex);
        if (!layer) {
            return JSON.stringify({ success: false, error: "Layer not found: " + layerIndex });
        }

        app.beginUndoGroup("Railcut: Duplicate Clip");

        try {
            var frameRate = comp.frameRate;
            var snappedStartTime = snapToFrame(newStartTime, frameRate);
            var delta = snappedStartTime - layer.startTime;

            var newLayer = layer.duplicate();
            // duplicate() copies current state including in/out points.
            // Shifting startTime moves the entire layer (in/out shift with it).
            newLayer.startTime = snappedStartTime;
            // Explicitly set in/out to frame-snapped values
            newLayer.inPoint = snapToFrame(layer.inPoint + delta, frameRate);
            newLayer.outPoint = snapToFrame(layer.outPoint + delta, frameRate);

            // Partial duplicate: disable the unwanted component AND tag the
            // dup with rc_role (no rc_link) so the panel excludes it from
            // the opposite section's packing. Without rc_role, the dup is
            // a regular A/V with audioEnabled=false (or enabled=false) and
            // shows up as a dimmed phantom on the next audio (or video)
            // track — same class of bug we fixed for Unlink.
            if (componentOnly === "video") {
                newLayer.audioEnabled = false;
            } else if (componentOnly === "audio") {
                newLayer.enabled = false;
            }

            // Assign new rcId to duplicate (preserve any existing JSON
            // metadata — rc_group from the source carries through).
            try {
                var dupComment = newLayer.comment;
                if (dupComment && parseRcId(dupComment)) {
                    newLayer.comment = appendRcId(dupComment, generateRcId());
                } else if (!dupComment || !parseRcId(dupComment)) {
                    newLayer.comment = (dupComment || "") + "\n[RC:" + generateRcId() + "]";
                }
            } catch (erc) {}

            // For partial duplicates, write rc_role onto the dup so
            // getCompData's hasVideo / hasAudio override flips and the
            // opposite section's packing excludes it.
            if (componentOnly === "video" || componentOnly === "audio") {
                try {
                    var dupRcTag = parseRcId(newLayer.comment);
                    var dupGroup = parseLayerGroup(newLayer.comment);
                    var dupMeta = { rc_role: componentOnly };
                    if (dupGroup) dupMeta.rc_group = dupGroup;
                    var dupNew = JSON.stringify(dupMeta);
                    if (dupRcTag) dupNew += "\n[RC:" + dupRcTag + "]";
                    newLayer.comment = dupNew;
                } catch (eRole) { /* best effort */ }
            }

            // Resolve overlaps (overwrite). Pass track info maps so resolveOverlaps
            // can (a) pre-split A/V targets when the duplicate's overlap is
            // component-specific and (b) pin Case-4 dups to the parent's V/A
            // tracks. Without these, partial overwrites trim both sides and
            // mid-clip dups auto-pack to V1/A1.
            var skipIndices = [];
            if (skipIndicesJson) {
                try { skipIndices = JSON.parse(skipIndicesJson); } catch (ep) {}
            }
            // layer.duplicate() inserts the dup directly above the source —
            // all layers at AE-index >= layerIndex shifted down by one. Caller
            // built otherTracksJson (and skipIndices) from PRE-duplicate
            // indices, so remap both before resolveOverlaps runs.
            var shiftedOtherTracksJson = otherTracksJson;
            if (otherTracksJson) {
                try {
                    var rawOther = JSON.parse(otherTracksJson);
                    var shiftedOther = {};
                    for (var ok in rawOther) {
                        var oldIdx = parseInt(ok, 10);
                        var newIdx = oldIdx >= layerIndex ? oldIdx + 1 : oldIdx;
                        shiftedOther[String(newIdx)] = rawOther[ok];
                    }
                    shiftedOtherTracksJson = JSON.stringify(shiftedOther);
                } catch (eShift) {}
            }
            var shiftedSkipIndices = [];
            for (var si = 0; si < skipIndices.length; si++) {
                var sIdx = skipIndices[si];
                shiftedSkipIndices.push(sIdx >= layerIndex ? sIdx + 1 : sIdx);
            }

            var dupSplits = [];
            resolveOverlaps(
                comp, newLayer, newLayer.inPoint, newLayer.outPoint,
                frameRate, shiftedSkipIndices, dupSplits, movedTracksJson, shiftedOtherTracksJson
            );

            // Build splitLayerInfos with parent V/A tracks (mirrors moveLayerWithOverwrite).
            var dupSplitInfos = [];
            for (var spi = 0; spi < dupSplits.length; spi++) {
                var split = dupSplits[spi];
                if (split.case4Dup) {
                    var rcIdC4 = parseRcId(split.case4Dup.comment) || null;
                    if (split.role === "av") {
                        if (split.parentV != null) {
                            dupSplitInfos.push({
                                rcId: rcIdC4, linkRole: "video",
                                parentVideoTrack: split.parentV,
                                parentAudioTrack: null
                            });
                        }
                        if (split.parentA != null) {
                            dupSplitInfos.push({
                                rcId: rcIdC4, linkRole: "audio",
                                parentVideoTrack: null,
                                parentAudioTrack: split.parentA
                            });
                        }
                    } else {
                        dupSplitInfos.push({
                            rcId: rcIdC4,
                            linkRole: split.role,
                            parentVideoTrack: split.role === "video" ? split.parentV : null,
                            parentAudioTrack: split.role === "audio" ? split.parentA : null
                        });
                    }
                    continue;
                }
                // Pre-split pair (resolveOverlaps embeds parents).
                var parentV = (split.parentV !== undefined) ? split.parentV : null;
                var parentA = (split.parentA !== undefined) ? split.parentA : null;
                try {
                    dupSplitInfos.push({
                        rcId: parseRcId(split.videoRef.comment) || null,
                        linkRole: "video",
                        parentVideoTrack: parentV,
                        parentAudioTrack: parentA
                    });
                    dupSplitInfos.push({
                        rcId: parseRcId(split.audioRef.comment) || null,
                        linkRole: "audio",
                        parentVideoTrack: parentV,
                        parentAudioTrack: parentA
                    });
                } catch (igDup) {}
            }

            var dupResultObj = {
                success: true,
                newIndex: newLayer.index,
                newRcId: parseRcId(newLayer.comment) || null
            };
            if (dupSplitInfos.length > 0) dupResultObj.splitLayers = dupSplitInfos;
            return JSON.stringify(dupResultObj);
        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Duplicate multiple layers as a group, maintaining relative timing offsets.
 * The reference layer defines the anchor point; all other layers keep their
 * relative positions.
 *
 * @param {string} layerIndicesJson - JSON array of layer indices to duplicate
 * @param {number} referenceIndex - Layer index used as the timing anchor
 * @param {number} newStartTime - New startTime for the reference layer's duplicate
 * @returns {string} JSON result with success status and indexMap
 */
function duplicateLayersToTime(layerIndicesJson, referenceIndex, newStartTime, perLayerSkipJson, perLayerMovedTracksJson, otherTracksJson) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return JSON.stringify({ success: false, error: "No active composition" });
        }

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) {
            return JSON.stringify({ success: false, error: "No layers specified" });
        }

        var refLayer = comp.layer(referenceIndex);
        if (!refLayer) {
            return JSON.stringify({ success: false, error: "Reference layer not found: " + referenceIndex });
        }

        // Per-layer overlap-resolution inputs. Without these, the new
        // duplicates land on top of existing clips and packTracks shoves
        // the targets to a different track on reload — looking like the
        // duplicate "missed" the overwrite. Mirrors moveLayersAsGroup.
        var perLayerSkip = perLayerSkipJson ? JSON.parse(perLayerSkipJson) : null;
        var perLayerMovedTracks = perLayerMovedTracksJson ? JSON.parse(perLayerMovedTracksJson) : null;

        app.beginUndoGroup("Railcut: Duplicate Clips");

        try {
            var frameRate = comp.frameRate;
            var snappedNewStart = snapToFrame(newStartTime, frameRate);
            var refDelta = snappedNewStart - refLayer.startTime;

            var indexMap = {};
            // Map from source layer index → new dup's rcId so the TS side can
            // pin each dup to its source's V/A tracks. Without this, dups
            // auto-pack to V1/A1 on reload.
            var newRcIdMap = {};

            // Resolve perLayerSkip indices to layer references BEFORE any
            // duplicate or overlap resolution shifts indices. References
            // survive the shifts; we re-derive current indices per iteration.
            var perLayerSkipRefs = {};
            if (perLayerSkip) {
                for (var pk in perLayerSkip) {
                    var skipArr = perLayerSkip[pk];
                    var refs = [];
                    for (var ps = 0; ps < skipArr.length; ps++) {
                        try { refs.push(comp.layer(skipArr[ps])); } catch (eSk) {}
                    }
                    perLayerSkipRefs[pk] = refs;
                }
            }

            // Snapshot every layer's ref + V/A tracks BEFORE any duplicate
            // or overlap resolution. Used to build otherTracksObj per-iteration
            // by current index — refs stay stable across the iterations'
            // index shifts (from duplicate, then from resolveOverlaps splits).
            var trackSnapshots = [];
            if (perLayerMovedTracks && otherTracksJson) {
                var rawOtherTracks = JSON.parse(otherTracksJson);
                for (var sn = 1; sn <= comp.numLayers; sn++) {
                    var snLayer = comp.layer(sn);
                    var ot = rawOtherTracks[String(sn)];
                    trackSnapshots.push({
                        ref: snLayer,
                        v: ot ? (typeof ot.v === "number" ? ot.v : null) : null,
                        a: ot ? (typeof ot.a === "number" ? ot.a : null) : null
                    });
                }
            }

            // Duplicate layers in reverse order so source indices don't shift
            // during iteration. Collect dup refs paired with source index.
            var dupRefs = []; // [{ srcIdx, dup }]
            for (var i = layerIndices.length - 1; i >= 0; i--) {
                var srcIdx = layerIndices[i];
                var srcLayer = comp.layer(srcIdx);
                if (!srcLayer || srcLayer.locked) continue;

                var newLayer = srcLayer.duplicate();
                var layerNewStart = snapToFrame(srcLayer.startTime + refDelta, frameRate);
                newLayer.startTime = layerNewStart;
                newLayer.inPoint = snapToFrame(srcLayer.inPoint + refDelta, frameRate);
                newLayer.outPoint = snapToFrame(srcLayer.outPoint + refDelta, frameRate);

                // Assign fresh rcId so dup doesn't collide with source.
                try {
                    var dlcComment = newLayer.comment;
                    if (dlcComment && parseRcId(dlcComment)) {
                        newLayer.comment = appendRcId(dlcComment, generateRcId());
                    } else {
                        newLayer.comment = (dlcComment || "") + "\n[RC:" + generateRcId() + "]";
                    }
                } catch (eRc) {}

                newRcIdMap[String(srcIdx)] = parseRcId(newLayer.comment) || null;
                dupRefs.push({ srcIdx: srcIdx, dup: newLayer });
            }

            // Run resolveOverlaps for each new duplicate. Each iteration may
            // split or delete other layers; trackSnapshots holds stable
            // refs so we can rebuild otherTracksObj with current indices.
            var allSplits = [];
            for (var d = 0; d < dupRefs.length; d++) {
                var dupInfo = dupRefs[d];
                var dupSrcIdx = dupInfo.srcIdx;
                var newDupLayer = dupInfo.dup;

                // Only run overlap resolution if caller supplied tracks info.
                if (!perLayerMovedTracks) {
                    indexMap[String(dupSrcIdx)] = newDupLayer.index;
                    continue;
                }

                // Skip indices for THIS dup: caller-supplied + all current dups
                // in the group (don't overwrite our own duplicates). Try/catch
                // around .index because earlier iterations may have deleted
                // some skipRefs — see moveLayersAsGroup for the full rationale.
                var dupSkipIndices = [];
                var skipRefs = perLayerSkipRefs[String(dupSrcIdx)];
                if (skipRefs) {
                    for (var sr = 0; sr < skipRefs.length; sr++) {
                        try {
                            var curSkipIdx = skipRefs[sr].index;
                            if (!isInArray(dupSkipIndices, curSkipIdx)) {
                                dupSkipIndices.push(curSkipIdx);
                            }
                        } catch (eSkipDel) { /* layer deleted by an earlier iteration */ }
                    }
                }
                // Also skip the other dups in our own group.
                for (var od = 0; od < dupRefs.length; od++) {
                    if (od === d) continue;
                    var otherDupIdx = dupRefs[od].dup.index;
                    if (!isInArray(dupSkipIndices, otherDupIdx)) {
                        dupSkipIndices.push(otherDupIdx);
                    }
                }

                // movedTracks for this dup (inherited from its source).
                var movedTracksObj = perLayerMovedTracks[String(dupSrcIdx)];
                var groupMovedTracksJson = movedTracksObj ? JSON.stringify(movedTracksObj) : null;

                // otherTracks rebuilt with current indices from snapshot refs.
                var groupOtherTracksJson = null;
                if (trackSnapshots.length > 0) {
                    var otherTracksObj = {};
                    for (var ts = 0; ts < trackSnapshots.length; ts++) {
                        var snap = trackSnapshots[ts];
                        try {
                            otherTracksObj[String(snap.ref.index)] = { v: snap.v, a: snap.a };
                        } catch (eSnap) { /* ref deleted */ }
                    }
                    groupOtherTracksJson = JSON.stringify(otherTracksObj);
                }

                var splitsBefore = allSplits.length;
                resolveOverlaps(
                    comp, newDupLayer,
                    newDupLayer.inPoint, newDupLayer.outPoint,
                    frameRate, dupSkipIndices, allSplits,
                    groupMovedTracksJson, groupOtherTracksJson
                );

                // Register pre-split halves into trackSnapshots so subsequent
                // iterations can find their parent V/A tracks via current
                // index lookup (mirrors moveLayersAsGroup).
                for (var ns = splitsBefore; ns < allSplits.length; ns++) {
                    var newSplit = allSplits[ns];
                    if (newSplit.case4Dup) continue;
                    if (newSplit.videoRef && newSplit.parentV !== undefined && newSplit.parentV !== null) {
                        trackSnapshots.push({
                            ref: newSplit.videoRef,
                            v: newSplit.parentV,
                            a: null
                        });
                    }
                    if (newSplit.audioRef && newSplit.parentA !== undefined && newSplit.parentA !== null) {
                        trackSnapshots.push({
                            ref: newSplit.audioRef,
                            v: null,
                            a: newSplit.parentA
                        });
                    }
                }

                indexMap[String(dupSrcIdx)] = newDupLayer.index;
            }

            // Build splitLayerInfos so the TS side can pin new pre-split
            // halves to their parent V/A tracks. Mirrors moveLayerWithOverwrite.
            var dupSplitInfos = [];
            for (var spi = 0; spi < allSplits.length; spi++) {
                var split = allSplits[spi];
                if (split.case4Dup) {
                    try {
                        var rcIdC4 = parseRcId(split.case4Dup.comment) || null;
                        if (split.role === "av") {
                            if (split.parentV != null) {
                                dupSplitInfos.push({
                                    rcId: rcIdC4, linkRole: "video",
                                    parentVideoTrack: split.parentV,
                                    parentAudioTrack: null
                                });
                            }
                            if (split.parentA != null) {
                                dupSplitInfos.push({
                                    rcId: rcIdC4, linkRole: "audio",
                                    parentVideoTrack: null,
                                    parentAudioTrack: split.parentA
                                });
                            }
                        } else {
                            dupSplitInfos.push({
                                rcId: rcIdC4,
                                linkRole: split.role,
                                parentVideoTrack: split.role === "video" ? split.parentV : null,
                                parentAudioTrack: split.role === "audio" ? split.parentA : null
                            });
                        }
                    } catch (igCd) {}
                    continue;
                }
                var parentV = (split.parentV !== undefined) ? split.parentV : null;
                var parentA = (split.parentA !== undefined) ? split.parentA : null;
                try {
                    dupSplitInfos.push({
                        rcId: parseRcId(split.videoRef.comment) || null,
                        linkRole: "video",
                        parentVideoTrack: parentV,
                        parentAudioTrack: parentA
                    });
                    dupSplitInfos.push({
                        rcId: parseRcId(split.audioRef.comment) || null,
                        linkRole: "audio",
                        parentVideoTrack: parentV,
                        parentAudioTrack: parentA
                    });
                } catch (igDup) {}
            }

            var dupResultObj = {
                success: true,
                indexMap: indexMap,
                newRcIdMap: newRcIdMap
            };
            if (dupSplitInfos.length > 0) dupResultObj.splitLayers = dupSplitInfos;
            return JSON.stringify(dupResultObj);
        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Set the composition work area start and duration.
 * @param {number} start - Work area start time in seconds
 * @param {number} duration - Work area duration in seconds
 * @returns {string} JSON result with success status
 */
/**
 * Create an undoable AE entry for a Railcut JS-only operation (e.g. track
 * add/delete on an empty track). Bumps the [RCV:N] marker in comp.comment
 * inside an undo group so AE registers an undo step. The fingerprint hash
 * picks up the comment change and Railcut's undo cache restores the JS state.
 * @param {string} label - Undo group label (shown in AE's Edit > Undo menu)
 * @returns {string} JSON result
 */
function registerCommentBumpUndo(label) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        app.beginUndoGroup("Railcut: " + (label || "Track Edit"));
        try {
            var cmnt = comp.comment || "";
            var vMatch = cmnt.match(/\[RCV:(\d+)\]/);
            var ver = vMatch ? parseInt(vMatch[1], 10) + 1 : 1;
            comp.comment = cmnt.replace(/\[RCV:\d+\]/, "") + "[RCV:" + ver + "]";
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

function setWorkArea(start, duration) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        app.beginUndoGroup("Railcut: Set Work Area");
        try {
            var frameRate = comp.frameRate;
            var snappedStart = snapToFrame(start, frameRate);
            var snappedDuration = snapToFrame(duration, frameRate);
            var newEnd = snappedStart + snappedDuration;
            var currentEnd = comp.workAreaStart + comp.workAreaDuration;

            if (newEnd > currentEnd) {
                // Moving forward: extend end first so AE doesn't clamp the new start
                comp.workAreaDuration = newEnd - comp.workAreaStart;
                comp.workAreaStart = snappedStart;
                comp.workAreaDuration = snappedDuration;
            } else {
                // Moving backward or shrinking: set start first (safe, it's lower)
                comp.workAreaStart = snappedStart;
                comp.workAreaDuration = snappedDuration;
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Serialize selected layers for clipboard copy.
 * Returns clip data needed to reconstruct the layers at paste time.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @returns {string} JSON with clips array and referenceTime
 */
function copyLayers(layerIndicesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return JSON.stringify({ success: false, error: "No active composition" });
        }

        var indices = JSON.parse(layerIndicesJson);
        if (!indices || indices.length === 0) {
            return JSON.stringify({ success: false, error: "No layers specified" });
        }

        var clips = [];
        var minInPoint = Infinity;

        // First pass: collect clip data and find earliest inPoint
        for (var i = 0; i < indices.length; i++) {
            var layer = comp.layer(indices[i]);
            if (!layer) continue;

            if (layer.inPoint < minInPoint) {
                minInPoint = layer.inPoint;
            }

            var sType = getLayerSourceType(layer);
            // Extract link metadata from comment
            var clipLinkId = null;
            var clipLinkRole = null;
            try {
                var ld = parseLinkData(layer.comment);
                if (ld) {
                    clipLinkId = ld.rc_link || null;
                    clipLinkRole = ld.rc_role || null;
                }
            } catch (eLink) {}
            // Extract group id (independent of link metadata) so a paste can
            // generate a fresh group across the pasted set when the source
            // clips were grouped.
            var clipGroupId = null;
            try { clipGroupId = parseLayerGroup(layer.comment); } catch (eGrp) {}

            clips.push({
                sourceItemId: layer.source ? layer.source.id : -1,
                sourceName: layer.source ? layer.source.name : layer.name,
                layerName: layer.name,
                sourceType: sType,
                sourceOffset: layer.inPoint - layer.startTime,
                clipDuration: layer.outPoint - layer.inPoint,
                relativeStart: 0, // filled in second pass
                stretch: (layer instanceof AVLayer) ? layer.stretch : 100,
                label: layer.label,
                audioEnabled: (layer instanceof AVLayer && layer.hasAudio) ? layer.audioEnabled : true,
                hasAudio: (layer instanceof AVLayer) ? layer.hasAudio : false,
                hasVideo: (layer instanceof AVLayer) ? layer.hasVideo : false,
                isEnabled: layer.enabled,
                linkId: clipLinkId,
                linkRole: clipLinkRole,
                groupId: clipGroupId
            });
        }

        // Second pass: set relativeStart (offset from earliest clip)
        for (var j = 0; j < clips.length; j++) {
            var srcLayer = comp.layer(indices[j]);
            if (srcLayer) {
                clips[j].relativeStart = srcLayer.inPoint - minInPoint;
            }
        }

        return JSON.stringify({
            success: true,
            clips: clips,
            referenceTime: minInPoint
        });

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Find a project item by its ID.
 * @param {number} id - AE project item ID
 * @returns {Item|null}
 */
function findProjectItemById(id) {
    for (var i = 1; i <= app.project.numItems; i++) {
        if (app.project.item(i).id === id) return app.project.item(i);
    }
    return null;
}

/**
 * Find a project item by name (fallback when ID doesn't match).
 * @param {string} name - Project item name
 * @returns {Item|null}
 */
function findProjectItemByName(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
        if (app.project.item(i).name === name) return app.project.item(i);
    }
    return null;
}

/**
 * Create a layer in the comp based on sourceType and clipboard data.
 * For source-based layers, adds from the project item.
 * For generated layers (text, shape, camera, light), uses AE creation APIs.
 * @param {CompItem} comp - Active composition
 * @param {object} clip - Clipboard clip data
 * @returns {Layer|null} The created layer, or null if creation failed
 */
function createLayerFromClipData(comp, clip) {
    if (clip.sourceType === "text") {
        return comp.layers.addText("");
    }
    if (clip.sourceType === "shape") {
        return comp.layers.addShape();
    }
    if (clip.sourceType === "camera") {
        return comp.layers.addCamera(clip.sourceName || "Camera", [comp.width / 2, comp.height / 2]);
    }
    if (clip.sourceType === "light") {
        return comp.layers.addLight(clip.sourceName || "Light", [comp.width / 2, comp.height / 2]);
    }
    // Source-based layers: find project item
    var source = findProjectItemById(clip.sourceItemId);
    if (!source) {
        source = findProjectItemByName(clip.sourceName);
    }
    if (!source) return null;
    return comp.layers.add(source);
}

/**
 * Apply timing and metadata to a pasted layer.
 * @param {Layer} newLayer - The newly created layer
 * @param {object} clip - Clipboard clip data
 * @param {number} newInPoint - Target in point
 * @param {number} newOutPoint - Target out point
 * @param {number} newStartTime - Target start time
 */
function applyPasteTimingToLayer(newLayer, clip, newInPoint, newOutPoint, newStartTime) {
    if (newLayer instanceof AVLayer) {
        newLayer.stretch = clip.stretch || 100;
    }
    newLayer.startTime = newStartTime;
    newLayer.inPoint = newInPoint;
    newLayer.outPoint = newOutPoint;
    newLayer.label = clip.label;
    if (newLayer instanceof AVLayer && newLayer.hasAudio) {
        newLayer.audioEnabled = clip.audioEnabled;
    }
    // Restore layer enabled state (video switch — false for audio-role layers)
    if (clip.isEnabled === false) {
        newLayer.enabled = false;
    }
}

/**
 * Ripple close a gap by shifting all downstream unlocked layers left.
 * Uses partial ripple: if any shift would cause an overlap, reduce the ripple
 * amount to the maximum safe value across all tracks.
 *
 * @param {number} gapStart - Start time of the gap (outPoint of clip before gap)
 * @param {number} gapEnd - End time of the gap (inPoint of clip after gap)
 * @returns {string} JSON result with success status and rippleAmount
 */
/**
 * Close gaps on unlocked tracks by rippling clips leftward to the end of
 * the previous clip on the same track. Linked pairs shift by the minimum
 * gap available on either of their tracks so sync is preserved. The first
 * clip on each track stays put (Premiere behavior).
 *
 * When `selectedIndicesJson` is a non-empty array, only selected clips are
 * eligible to shift; shifting a selected clip also carries all of its
 * followers on the same track(s) with it, so spacing between non-selected
 * clips after the selection is preserved. Empty or missing selection closes
 * every gap on every unlocked track.
 *
 * @param {string} videoAssignmentsJson - {layerIndex: trackNum} for video tracks
 * @param {string} audioAssignmentsJson - {layerIndex: trackNum} for audio tracks
 * @param {string} lockedVideoTracksJson - [trackNum, ...] locked video tracks
 * @param {string} lockedAudioTracksJson - [trackNum, ...] locked audio tracks
 * @param {string} selectedIndicesJson - [layerIndex, ...] or empty for all
 * @returns {string} JSON result
 */
function closeGaps(videoAssignmentsJson, audioAssignmentsJson, lockedVideoTracksJson, lockedAudioTracksJson, selectedIndicesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var videoAssignments = JSON.parse(videoAssignmentsJson || "{}");
        var audioAssignments = JSON.parse(audioAssignmentsJson || "{}");
        var lockedVideoTracks = JSON.parse(lockedVideoTracksJson || "[]");
        var lockedAudioTracks = JSON.parse(lockedAudioTracksJson || "[]");
        var selectedArr = JSON.parse(selectedIndicesJson || "[]");
        var selected = {}; // hash for O(1) membership
        for (var si = 0; si < selectedArr.length; si++) selected[selectedArr[si]] = true;
        var hasSelection = selectedArr.length > 0;

        var frameRate = comp.frameRate;
        var halfFrame = 0.5 / frameRate;

        function isTrackLocked(trackType, trackNum) {
            var list = trackType === "video" ? lockedVideoTracks : lockedAudioTracks;
            for (var i = 0; i < list.length; i++) {
                if (list[i] === trackNum) return true;
            }
            return false;
        }

        // Gap (seconds) immediately before `layer` on the given track, or 0
        // if this is the first clip on the track. Locked clips still occupy
        // the timeline and must block other clips from shifting past them.
        function gapBefore(layer, trackType, trackNum) {
            if (trackNum === undefined) return Infinity;
            if (isTrackLocked(trackType, trackNum)) return 0;
            var assignments = trackType === "video" ? videoAssignments : audioAssignments;
            var prevEnd = -1;
            var anyPrev = false;
            for (var i = 1; i <= comp.numLayers; i++) {
                var other = comp.layer(i);
                if (other.index === layer.index) continue;
                if (!isEditableLayer(other)) continue;
                if (assignments[other.index] !== trackNum) continue;
                if (other.outPoint <= layer.inPoint + halfFrame) {
                    if (other.outPoint > prevEnd) prevEnd = other.outPoint;
                    anyPrev = true;
                }
            }
            if (!anyPrev) return 0;
            var gap = layer.inPoint - prevEnd;
            return gap > halfFrame ? gap : 0;
        }

        // Collect all followers at-or-after `layer` on its track(s) and on
        // the linked partner's track(s). Used for selection-scope shifts so
        // the layout after the selected clip is preserved.
        function collectFollowers(layer, partner) {
            var out = [layer];
            var seen = {};
            seen[layer.index] = true;
            if (partner) { out.push(partner); seen[partner.index] = true; }

            function addFollowersOnTrack(anchor, trackType, trackNum) {
                if (trackNum === undefined) return;
                var assignments = trackType === "video" ? videoAssignments : audioAssignments;
                for (var i = 1; i <= comp.numLayers; i++) {
                    var other = comp.layer(i);
                    if (seen[other.index]) continue;
                    if (!isEditableLayer(other) || other.locked) continue;
                    if (assignments[other.index] !== trackNum) continue;
                    if (other.inPoint >= anchor.inPoint - halfFrame && other.index !== anchor.index) {
                        out.push(other);
                        seen[other.index] = true;
                    }
                }
            }

            addFollowersOnTrack(layer, "video", videoAssignments[layer.index]);
            addFollowersOnTrack(layer, "audio", audioAssignments[layer.index]);
            if (partner) {
                addFollowersOnTrack(partner, "video", videoAssignments[partner.index]);
                addFollowersOnTrack(partner, "audio", audioAssignments[partner.index]);
            }
            return out;
        }

        app.beginUndoGroup("Railcut: Close Gaps");
        try {
            var maxPasses = comp.numLayers * 2 + 4;
            var anyShift = true;
            var passes = 0;

            while (anyShift && passes < maxPasses) {
                passes++;
                anyShift = false;

                var layers = [];
                for (var li = 1; li <= comp.numLayers; li++) {
                    var l = comp.layer(li);
                    if (!isEditableLayer(l) || l.locked) continue;
                    layers.push(l);
                }
                layers.sort(function(a, b) { return a.inPoint - b.inPoint; });

                for (var k = 0; k < layers.length; k++) {
                    var layer = layers[k];

                    // In selection mode, only selected clips (and their linked
                    // partners) can initiate a shift.
                    if (hasSelection) {
                        var partnerForSelCheck = findLinkedPartner(comp, layer);
                        var isSelected = !!selected[layer.index]
                            || (partnerForSelCheck && !!selected[partnerForSelCheck.index]);
                        if (!isSelected) continue;
                    }

                    var vTrack = videoAssignments[layer.index];
                    var aTrack = audioAssignments[layer.index];
                    if (vTrack !== undefined && isTrackLocked("video", vTrack)) continue;
                    if (aTrack !== undefined && isTrackLocked("audio", aTrack)) continue;

                    var shift = Infinity;
                    if (vTrack !== undefined) shift = Math.min(shift, gapBefore(layer, "video", vTrack));
                    if (aTrack !== undefined) shift = Math.min(shift, gapBefore(layer, "audio", aTrack));

                    var partner = findLinkedPartner(comp, layer);
                    if (partner) {
                        var pvTrack = videoAssignments[partner.index];
                        var paTrack = audioAssignments[partner.index];
                        if (pvTrack !== undefined && isTrackLocked("video", pvTrack)) { shift = 0; }
                        else if (pvTrack !== undefined) shift = Math.min(shift, gapBefore(partner, "video", pvTrack));
                        if (paTrack !== undefined && isTrackLocked("audio", paTrack)) { shift = 0; }
                        else if (paTrack !== undefined) shift = Math.min(shift, gapBefore(partner, "audio", paTrack));
                    }

                    if (shift === Infinity || shift <= halfFrame) continue;
                    var snapped = snapToFrame(shift, frameRate);
                    if (snapped <= halfFrame) continue;

                    if (hasSelection) {
                        // Carry followers so layout after the selected clip is preserved.
                        var toShift = collectFollowers(layer, partner);
                        // Guard: make sure none of the followers are on locked tracks.
                        var blocked = false;
                        for (var fi = 0; fi < toShift.length; fi++) {
                            var fl = toShift[fi];
                            var fvT = videoAssignments[fl.index];
                            var faT = audioAssignments[fl.index];
                            if (fvT !== undefined && isTrackLocked("video", fvT)) { blocked = true; break; }
                            if (faT !== undefined && isTrackLocked("audio", faT)) { blocked = true; break; }
                        }
                        if (blocked) continue;
                        for (var fj = 0; fj < toShift.length; fj++) {
                            toShift[fj].startTime -= snapped;
                        }
                    } else {
                        layer.startTime -= snapped;
                        if (partner) partner.startTime -= snapped;
                    }
                    anyShift = true;
                }
            }

            // Bump comp version for fingerprint detection.
            var cmnt = comp.comment || "";
            var vMatch = cmnt.match(/\[RCV:(\d+)\]/);
            var ver = vMatch ? parseInt(vMatch[1], 10) + 1 : 1;
            comp.comment = cmnt.replace(/\[RCV:\d+\]/, "") + "[RCV:" + ver + "]";
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

function rippleCloseGap(gapStart, gapEnd) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return JSON.stringify({ success: false, error: "No active composition" });
        }

        var frameRate = comp.frameRate;
        var gapDuration = gapEnd - gapStart;

        app.beginUndoGroup("Railcut: Close Gap");
        try {
            var shifting = [];
            var halfFrame = 0.5 / frameRate;

            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (!isEditableLayer(layer)) continue;
                if (layer.locked) continue;

                // Shift ALL downstream layers (Premiere behavior).
                // Use half-frame tolerance to avoid floating point edge cases
                // where the clip right at gapEnd isn't picked up.
                // Collision checking is done on the TypeScript side before calling.
                if (layer.inPoint >= gapEnd - halfFrame) {
                    shifting.push(layer);
                }
            }

            if (shifting.length === 0) {
                return JSON.stringify({ success: true, rippleAmount: 0 });
            }

            var actualRipple = snapToFrame(gapDuration, frameRate);

            for (var j = 0; j < shifting.length; j++) {
                shifting[j].startTime -= actualRipple;
            }

            return JSON.stringify({ success: true, rippleAmount: actualRipple });
        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

function pasteLayers(clipDataJson, targetTime, targetVideoTrack, targetAudioTrack, trackAssignmentsJson) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return JSON.stringify({ success: false, error: "No active composition" });
        }

        var data = JSON.parse(clipDataJson);
        if (!data.clips || data.clips.length === 0) {
            return JSON.stringify({ success: false, error: "No clips to paste" });
        }

        var frameRate = comp.frameRate;

        // Parse track assignments if provided (track-aware paste)
        var hasTrackInfo = (trackAssignmentsJson !== undefined && trackAssignmentsJson !== null);
        var existingVideoTracks = {};  // originalLayerIndex -> video track number
        var existingAudioTracks = {};  // originalLayerIndex -> audio track number
        if (hasTrackInfo) {
            var assignments = JSON.parse(trackAssignmentsJson);
            for (var key in assignments) {
                if (key.charAt(0) === "a") {
                    existingAudioTracks[key.substring(1)] = assignments[key];
                } else {
                    existingVideoTracks[key] = assignments[key];
                }
            }
        }

        app.beginUndoGroup("Railcut: Paste");
        try {
            var pastedCount = 0;
            var pastedClipData = [];
            var linkIdMap = {}; // old linkId → new linkId (for re-linking pasted pairs)
            var groupIdMap = {}; // old groupId → fresh groupId (per source group)

            // Phase 1: Create all pasted layers (they stack at index 1..N)
            for (var i = 0; i < data.clips.length; i++) {
                var clip = data.clips[i];

                var newLayer = createLayerFromClipData(comp, clip);
                if (!newLayer) continue;

                var newInPoint = snapToFrame(targetTime + clip.relativeStart, frameRate);
                var newStartTime = snapToFrame(newInPoint - clip.sourceOffset, frameRate);
                var newOutPoint = snapToFrame(newInPoint + clip.clipDuration, frameRate);

                applyPasteTimingToLayer(newLayer, clip, newInPoint, newOutPoint, newStartTime);

                // Restore custom layer name (strip [V]/[A] suffix since it gets re-added below)
                if (clip.layerName) {
                    newLayer.name = removeRoleSuffix(clip.layerName);
                }

                // Build comment: rcId + link metadata (if any) + fresh group
                // metadata when the source clip was grouped. Groups get
                // remapped per-source so the pasted set is its own group,
                // independent of whatever group(s) the source belonged to.
                var newRcId = generateRcId();
                var meta = null;
                if (clip.linkId && clip.linkRole) {
                    if (!linkIdMap[clip.linkId]) {
                        linkIdMap[clip.linkId] = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 6);
                    }
                    meta = { rc_link: linkIdMap[clip.linkId], rc_role: clip.linkRole };
                    newLayer.name = addRoleSuffix(newLayer.name, clip.linkRole);
                }
                if (clip.groupId) {
                    if (!groupIdMap[clip.groupId]) {
                        groupIdMap[clip.groupId] = "rcg_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 6);
                    }
                    if (!meta) meta = {};
                    meta.rc_group = groupIdMap[clip.groupId];
                }
                var newComment = meta ? JSON.stringify(meta) : "";
                newComment = appendRcId(newComment, newRcId);
                newLayer.comment = newComment;

                pastedClipData.push(clip);
                pastedCount++;
            }

            if (pastedCount === 0) {
                return JSON.stringify({ success: true, count: 0 });
            }

            // Reverse pastedClipData so it matches layer stack order.
            // Each createLayerFromClipData adds at index 1, pushing previous layers down,
            // so comp.layer(1) is the LAST created layer. pastedClipData was built in
            // creation order, so we reverse it to align with comp.layer(1..N).
            pastedClipData.reverse();

            // Phase 1.5: Pre-split any existing regular A/V layer whose two
            // sides will be trimmed asymmetrically by the paste — i.e. only
            // the V side hit, only the A side hit, or both hit with different
            // time ranges. Without pre-splitting, a single AE layer can't
            // have its V trimmed independently of its A, so trimming one side
            // would drag the other along. Must happen BEFORE the snapshot so
            // the snapshot captures the already-split layers.
            var preSplitLayers = [];  // { ref, trackType, trackNum } for track override return
            if (hasTrackInfo) {
                // Build per-side paste ranges from pastedClipData.
                var pasteVRanges = [];  // { track, inP, outP }
                var pasteARanges = [];
                for (var pri = 0; pri < pastedClipData.length; pri++) {
                    var prClip = pastedClipData[pri];
                    var prIn = snapToFrame(targetTime + prClip.relativeStart, frameRate);
                    var prOut = snapToFrame(prIn + prClip.clipDuration, frameRate);
                    var prIsAudioRole = prClip.linkRole === "audio";
                    var prIsVideoRole = prClip.linkRole === "video";
                    if (prIsAudioRole || (prClip.hasAudio && !prClip.hasVideo && !prIsVideoRole)) {
                        pasteARanges.push({
                            track: (prClip.audioTrack != null) ? prClip.audioTrack : targetAudioTrack,
                            inP: prIn, outP: prOut
                        });
                    } else if (prIsVideoRole) {
                        pasteVRanges.push({
                            track: (prClip.videoTrack != null) ? prClip.videoTrack : targetVideoTrack,
                            inP: prIn, outP: prOut
                        });
                    } else if (prClip.hasVideo) {
                        pasteVRanges.push({
                            track: (prClip.videoTrack != null) ? prClip.videoTrack : targetVideoTrack,
                            inP: prIn, outP: prOut
                        });
                        if (prClip.hasAudio) {
                            pasteARanges.push({
                                track: (prClip.audioTrack != null) ? prClip.audioTrack : targetAudioTrack,
                                inP: prIn, outP: prOut
                            });
                        }
                    }
                }

                // Pass 1: identify candidates by reference (origIdx is correct
                // here because no promotions have happened yet).
                var splitCandidates = [];  // { layer, vTrack, aTrack }
                for (var et = pastedCount + 1; et <= comp.numLayers; et++) {
                    var etLayer = comp.layer(et);
                    if (etLayer.locked) continue;
                    if (!isEditableLayer(etLayer)) continue;

                    // Skip already-linked layers
                    try {
                        var etLd = parseLinkData(etLayer.comment);
                        if (etLd && etLd.rc_link) continue;
                    } catch (eParse) {}

                    // Need both V and A on the source for a split to make sense
                    var etHasV = false, etHasA = false;
                    try { etHasV = etLayer.hasVideo; } catch (eHV) {}
                    try { etHasA = etLayer.hasAudio; } catch (eHA) {}
                    if (!etHasV || !etHasA) continue;

                    var etOrigIdx = String(et - pastedCount);
                    var etVTrack = existingVideoTracks[etOrigIdx];
                    var etATrack = existingAudioTracks[etOrigIdx];
                    if (etVTrack === undefined || etATrack === undefined) continue;

                    var etIn = etLayer.inPoint;
                    var etOut = etLayer.outPoint;

                    var vHit = null;
                    for (var vr = 0; vr < pasteVRanges.length; vr++) {
                        var pv = pasteVRanges[vr];
                        if (pv.track !== etVTrack) continue;
                        if (pv.inP >= etOut || pv.outP <= etIn) continue;
                        vHit = pv;
                        break;
                    }
                    var aHit = null;
                    for (var ar = 0; ar < pasteARanges.length; ar++) {
                        var pa = pasteARanges[ar];
                        if (pa.track !== etATrack) continue;
                        if (pa.inP >= etOut || pa.outP <= etIn) continue;
                        aHit = pa;
                        break;
                    }

                    var needSplit = false;
                    if (!vHit && !aHit) needSplit = false;
                    else if (!vHit || !aHit) needSplit = true;
                    else if (Math.abs(vHit.inP - aHit.inP) > 0.001 || Math.abs(vHit.outP - aHit.outP) > 0.001) needSplit = true;

                    if (needSplit) {
                        splitCandidates.push({ layer: etLayer, vTrack: etVTrack, aTrack: etATrack });
                    }
                }

                // Pass 2: promote each candidate by reference so AE index
                // shifts during promotion don't desync our origIdx math.
                for (var sci = 0; sci < splitCandidates.length; sci++) {
                    var sc = splitCandidates[sci];
                    var pastePair = promoteAVLayerToLinkedPair(sc.layer);
                    preSplitLayers.push({ ref: pastePair.videoRole, trackType: "video", trackNum: sc.vTrack });
                    preSplitLayers.push({ ref: pastePair.audioRole, trackType: "audio", trackNum: sc.aTrack });
                }
            }

            // Snapshot existing layers BEFORE Phase 2 modifies indices.
            // After Phase 1 + pre-split, pasted layers are at 1..pastedCount.
            // Existing (+ pre-split) layers are at (pastedCount+1)..numLayers.
            // For pre-split layers, use preSplitLayers for track info (origIdx won't match).
            var existingLayerRefs = [];   // parallel arrays as ES3 Map substitute
            var existingLayerVideoTrackNums = [];
            var existingLayerAudioTrackNums = [];
            if (hasTrackInfo) {
                for (var si = pastedCount + 1; si <= comp.numLayers; si++) {
                    var snapLayer = comp.layer(si);
                    // Check if this is a pre-split layer (use reference match)
                    var psMatch = null;
                    for (var psm = 0; psm < preSplitLayers.length; psm++) {
                        if (preSplitLayers[psm].ref === snapLayer) {
                            psMatch = preSplitLayers[psm];
                            break;
                        }
                    }
                    if (psMatch) {
                        existingLayerRefs.push(snapLayer);
                        if (psMatch.trackType === "video") {
                            existingLayerVideoTrackNums.push(psMatch.trackNum);
                            existingLayerAudioTrackNums.push(-1);
                        } else {
                            existingLayerVideoTrackNums.push(-1);
                            existingLayerAudioTrackNums.push(psMatch.trackNum);
                        }
                    } else {
                        // Original layer — compute origIdx accounting for pre-split insertions
                        // Count how many pre-split dups are above this index
                        var preSplitAbove = 0;
                        for (var psa = 0; psa < preSplitLayers.length; psa++) {
                            try {
                                if (preSplitLayers[psa].ref.index < si) preSplitAbove++;
                            } catch (e) {}
                        }
                        // Half of preSplitLayers are originals (already counted in origIdx),
                        // the other half are new dups that shifted indices
                        var dupsAbove = Math.floor(preSplitAbove / 2);
                        var origIdx = String(si - pastedCount - dupsAbove);
                        var vTrack = existingVideoTracks[origIdx];
                        var aTrack = existingAudioTracks[origIdx];
                        existingLayerRefs.push(snapLayer);
                        existingLayerVideoTrackNums.push(vTrack !== undefined ? vTrack : -1);
                        existingLayerAudioTrackNums.push(aTrack !== undefined ? aTrack : -1);
                    }
                }
            }

            // Also collect pasted layer references for Phase 3 identification
            var pastedLayerRefs = [];
            for (var plr = 0; plr < pastedCount; plr++) {
                pastedLayerRefs.push(comp.layer(plr + 1));
            }

            // Phase 2: Resolve overlaps per pasted layer.
            // When track info is provided, only resolve against layers on the same track.
            // Track split duplicates (Case 4) to inherit parent's track in Phase 3.
            var splitDupRefs = [];
            var splitDupVideoTrackNums = [];
            var splitDupAudioTrackNums = [];

            // Track each pasted layer's resolved track (may differ from target if locked clips block it)
            var pastedResolvedTracks = [];
            var splitLinkIds = null; // linkIds that were Case-4-split (need re-linking)

            for (var pi = 1; pi <= pastedCount; pi++) {
                var pLayer = comp.layer(pi);
                var movedIn = pLayer.inPoint;
                var movedOut = pLayer.outPoint;

                // Determine which (track, isAudio) combos to resolve overlaps on.
                // Regular A/V clips (no linkRole, hasVideo, hasAudio) need BOTH tracks
                // resolved — otherwise pasting over a linked pair leaves the audio half
                // of the existing pair untouched.
                var tracksToResolve = []; // [{ track, isAudio }, ...]
                if (hasTrackInfo) {
                    var pClip = pastedClipData[pi - 1];
                    var isAudioRole = pClip.linkRole === "audio";
                    var isVideoRole = pClip.linkRole === "video";
                    if (isAudioRole || (pClip.hasAudio && !pClip.hasVideo && !isVideoRole)) {
                        tracksToResolve.push({
                            track: (pClip.audioTrack != null) ? pClip.audioTrack : targetAudioTrack,
                            isAudio: true
                        });
                    } else if (isVideoRole) {
                        tracksToResolve.push({
                            track: (pClip.videoTrack != null) ? pClip.videoTrack : targetVideoTrack,
                            isAudio: false
                        });
                    } else if (pClip.hasVideo) {
                        tracksToResolve.push({
                            track: (pClip.videoTrack != null) ? pClip.videoTrack : targetVideoTrack,
                            isAudio: false
                        });
                        if (pClip.hasAudio) {
                            tracksToResolve.push({
                                track: (pClip.audioTrack != null) ? pClip.audioTrack : targetAudioTrack,
                                isAudio: true
                            });
                        }
                    } else {
                        tracksToResolve.push({ track: targetVideoTrack, isAudio: false });
                    }
                } else {
                    tracksToResolve.push({ track: -1, isAudio: false });
                }

                // Locked-track bumping (primary/first track only — the resolvedTrack
                // returned to TS, used for pinning).
                var pastedTrack = tracksToResolve[0].track;
                var pastedIsAudio = tracksToResolve[0].isAudio;
                if (hasTrackInfo) {
                    var maxBump = 100;
                    while (maxBump-- > 0) {
                        var blocked = false;
                        for (var bl = pastedCount + 1; bl <= comp.numLayers; bl++) {
                            var blLayer = comp.layer(bl);
                            if (!blLayer.locked) continue;
                            var blTrack = -1;
                            var blTrackArr = pastedIsAudio ? existingLayerAudioTrackNums : existingLayerVideoTrackNums;
                            for (var blt = 0; blt < existingLayerRefs.length; blt++) {
                                if (existingLayerRefs[blt] === blLayer) {
                                    blTrack = blTrackArr[blt];
                                    break;
                                }
                            }
                            if (blTrack !== pastedTrack) continue;
                            if (movedIn < blLayer.outPoint && movedOut > blLayer.inPoint) {
                                blocked = true;
                                break;
                            }
                        }
                        if (!blocked) break;
                        pastedTrack++;
                    }
                    tracksToResolve[0].track = pastedTrack;
                }

                pastedResolvedTracks.push(pastedTrack);

                // For each track this paste should clear, run overlap resolution.
                for (var tri = 0; tri < tracksToResolve.length; tri++) {
                    var trTrack = tracksToResolve[tri].track;
                    var trIsAudio = tracksToResolve[tri].isAudio;

                    // Collect overlapping existing layers on this track (skip pasted)
                    var overlaps = [];
                    for (var li = pastedCount + 1; li <= comp.numLayers; li++) {
                        var other = comp.layer(li);
                        if (other.locked) continue;
                        if (!isEditableLayer(other)) continue;

                        if (hasTrackInfo && trTrack >= 0) {
                            var otherTrack = -1;
                            var otherTrackArr = trIsAudio ? existingLayerAudioTrackNums : existingLayerVideoTrackNums;
                            for (var st = 0; st < existingLayerRefs.length; st++) {
                                if (existingLayerRefs[st] === other) {
                                    otherTrack = otherTrackArr[st];
                                    break;
                                }
                            }
                            if (otherTrack < 0) {
                                var sdTrackArr = trIsAudio ? splitDupAudioTrackNums : splitDupVideoTrackNums;
                                for (var sdt = 0; sdt < splitDupRefs.length; sdt++) {
                                    if (splitDupRefs[sdt] === other) {
                                        otherTrack = sdTrackArr[sdt];
                                        break;
                                    }
                                }
                            }
                            if (otherTrack !== trTrack) continue;
                        }

                        var otherIn = other.inPoint;
                        var otherOut = other.outPoint;

                        if (movedIn < otherOut && movedOut > otherIn) {
                            overlaps.push({
                                layer: other,
                                inPoint: otherIn,
                                outPoint: otherOut
                            });
                        }
                    }

                    // Resolve each overlap (4-case pattern from moveLayerWithOverwrite)
                    for (var oi = 0; oi < overlaps.length; oi++) {
                    var ov = overlaps[oi];
                    var ovLayer = ov.layer;
                    // Case 1: Pasted layer completely covers existing — delete it
                    if (movedIn <= ov.inPoint && movedOut >= ov.outPoint) {
                        ovLayer.remove();
                        continue;
                    }

                    // Case 2: Pasted overlaps END of existing — trim out point
                    if (movedIn > ov.inPoint && movedIn < ov.outPoint && movedOut >= ov.outPoint) {
                        ovLayer.outPoint = snapToFrame(movedIn, frameRate);
                        continue;
                    }

                    // Case 3: Pasted overlaps START of existing — trim in point
                    if (movedOut > ov.inPoint && movedOut < ov.outPoint && movedIn <= ov.inPoint) {
                        var savedOut3 = ovLayer.outPoint;
                        ovLayer.inPoint = snapToFrame(movedOut, frameRate);
                        ovLayer.outPoint = savedOut3;
                        continue;
                    }

                    // Case 4: Pasted in MIDDLE of existing — split it
                    if (movedIn > ov.inPoint && movedOut < ov.outPoint) {
                        var origOut = ov.outPoint;
                        ovLayer.outPoint = snapToFrame(movedIn, frameRate);
                        var dupLayer = ovLayer.duplicate();
                        dupLayer.inPoint = snapToFrame(movedOut, frameRate);
                        dupLayer.outPoint = origOut;

                        // Assign new rcId to duplicate (prevent duplicate rcId)
                        try {
                            var dupComment = dupLayer.comment;
                            if (dupComment && parseRcId(dupComment)) {
                                dupLayer.comment = appendRcId(dupComment, generateRcId());
                            }
                        } catch (erc) {}

                        // Track linked-pair splits for re-linking after overlap resolution
                        try {
                            var ovLd = parseLinkData(ovLayer.comment);
                            if (ovLd && ovLd.rc_link) {
                                if (!splitLinkIds) splitLinkIds = {};
                                splitLinkIds[ovLd.rc_link] = true;
                            }
                        } catch (eld) {}

                        // Record split duplicate with parent's tracks
                        if (hasTrackInfo) {
                            for (var pt = 0; pt < existingLayerRefs.length; pt++) {
                                if (existingLayerRefs[pt] === ovLayer) {
                                    splitDupRefs.push(dupLayer);
                                    splitDupVideoTrackNums.push(existingLayerVideoTrackNums[pt]);
                                    splitDupAudioTrackNums.push(existingLayerAudioTrackNums[pt]);
                                    break;
                                }
                            }
                        }
                    }
                }
                } // end tracksToResolve loop
            }

            // Re-link Case-4-split linked pairs: left halves keep original linkId,
            // right halves get a new shared linkId (same pattern as blade splits).
            if (splitLinkIds) {
                for (var slk in splitLinkIds) {
                    // Find all layers with this linkId, separate into left (trimmed outPoint)
                    // and right (new duplicate with later inPoint) halves.
                    // The left halves keep the original linkId. Right halves get a new one.
                    var rightHalves = [];
                    for (var ri = 1; ri <= comp.numLayers; ri++) {
                        var rLayer = comp.layer(ri);
                        try {
                            var rld = parseLinkData(rLayer.comment);
                            if (!rld || rld.rc_link !== slk) continue;
                        } catch (e) { continue; }
                        // Right half = the duplicate (later inPoint in each role pair).
                        // Check if this is a splitDupRef
                        var isRightHalf = false;
                        for (var rsd = 0; rsd < splitDupRefs.length; rsd++) {
                            if (splitDupRefs[rsd] === rLayer) { isRightHalf = true; break; }
                        }
                        if (isRightHalf) rightHalves.push(rLayer);
                    }
                    if (rightHalves.length >= 2) {
                        var newRightLinkId = "rc_link_" + generateRcId();
                        for (var rh = 0; rh < rightHalves.length; rh++) {
                            var rhLayer = rightHalves[rh];
                            var rhRcTag = parseRcId(rhLayer.comment);
                            var rhLd = parseLinkData(rhLayer.comment);
                            var rhRole = rhLd ? rhLd.rc_role : "";
                            var rhGroup = parseLayerGroup(rhLayer.comment);
                            var rhMeta = { rc_link: newRightLinkId, rc_role: rhRole };
                            if (rhGroup) rhMeta.rc_group = rhGroup;
                            var rhCmt = JSON.stringify(rhMeta);
                            if (rhRcTag) rhCmt += "\n[RC:" + rhRcTag + "]";
                            rhLayer.comment = rhCmt;
                        }
                    } else if (rightHalves.length === 1) {
                        // Only one role got Case-4-split (the other role's clip
                        // wasn't on a paste track). The right half has no partner,
                        // so unlink it — left half stays linked to the un-split
                        // partner. Without this, three layers would share the
                        // same linkId (left + right + un-split partner).
                        unlinkButKeepRole(rightHalves[0]);
                    }
                }
            }

            // Phase 3: Reorder layers
            if (hasTrackInfo) {
                try {
                    // Build assignment map: current index -> track number
                    var newAssignments = {};
                    for (var allIdx = 1; allIdx <= comp.numLayers; allIdx++) {
                        var curLayer = comp.layer(allIdx);
                        if (!isEditableLayer(curLayer)) continue;

                        // Check if pasted layer (use resolved track which may have been bumped)
                        var foundTrack = -1;
                        for (var chk = 0; chk < pastedLayerRefs.length; chk++) {
                            if (pastedLayerRefs[chk] === curLayer) {
                                var pc = pastedClipData[chk];
                                var pcIsAudio = pc.linkRole === "audio" || (pc.hasAudio && !pc.hasVideo && pc.linkRole !== "video");
                                if (pcIsAudio) {
                                    foundTrack = pastedResolvedTracks[chk] - 1000;
                                } else {
                                    foundTrack = pastedResolvedTracks[chk];
                                }
                                break;
                            }
                        }

                        // Check existing layer snapshot
                        // Use video track for A/V layers, audio track (offset -1000) for audio-only
                        if (foundTrack < 0) {
                            for (var ex = 0; ex < existingLayerRefs.length; ex++) {
                                if (existingLayerRefs[ex] === curLayer) {
                                    if (existingLayerVideoTrackNums[ex] >= 0) {
                                        foundTrack = existingLayerVideoTrackNums[ex];
                                    } else if (existingLayerAudioTrackNums[ex] >= 0) {
                                        foundTrack = existingLayerAudioTrackNums[ex] - 1000;
                                    }
                                    break;
                                }
                            }
                        }

                        // Check split duplicates
                        if (foundTrack < 0) {
                            for (var sd = 0; sd < splitDupRefs.length; sd++) {
                                if (splitDupRefs[sd] === curLayer) {
                                    if (splitDupVideoTrackNums[sd] >= 0) {
                                        foundTrack = splitDupVideoTrackNums[sd];
                                    } else if (splitDupAudioTrackNums[sd] >= 0) {
                                        foundTrack = splitDupAudioTrackNums[sd] - 1000;
                                    }
                                    break;
                                }
                            }
                        }

                        newAssignments[String(allIdx)] = (foundTrack !== -1) ? foundTrack : 1;
                    }

                    reorderLayersInPlace(comp, JSON.stringify(newAssignments));
                } catch (sortError) {
                    return JSON.stringify({ success: true, count: pastedCount, warning: "Reorder failed: " + sortError.toString() });
                }
            } else {
                // No track info: simple inPoint-descending reorder (original behavior)
                try {
                    var editableLayers = [];
                    for (var r = 1; r <= comp.numLayers; r++) {
                        var rLayer = comp.layer(r);
                        if (!isEditableLayer(rLayer)) continue;
                        editableLayers.push({
                            layer: rLayer,
                            inPoint: rLayer.inPoint
                        });
                    }

                    editableLayers.sort(function(a, b) {
                        return b.inPoint - a.inPoint;
                    });

                    for (var t = 0; t < editableLayers.length; t++) {
                        var targetIndex = t + 1;
                        var layerObj = editableLayers[t].layer;
                        if (layerObj.index !== targetIndex) {
                            if (targetIndex < layerObj.index) {
                                layerObj.moveBefore(comp.layer(targetIndex));
                            } else {
                                layerObj.moveAfter(comp.layer(targetIndex));
                            }
                        }
                    }
                } catch (sortError) {
                    return JSON.stringify({ success: true, count: pastedCount, warning: "Reorder failed: " + sortError.toString() });
                }
            }

            // Collect pasted layer info for track override fingerprinting
            var pastedLayerInfos = [];
            for (var pli = 0; pli < pastedLayerRefs.length; pli++) {
                var pRef = pastedLayerRefs[pli];
                try {
                    var pName = pRef.source ? pRef.source.name : pRef.name;
                    var plClip = pastedClipData[pli];
                    pastedLayerInfos.push({
                        sourceName: pName,
                        inPoint: pRef.inPoint,
                        outPoint: pRef.outPoint,
                        startTime: pRef.startTime,
                        hasVideo: (pRef instanceof AVLayer) ? pRef.hasVideo : true,
                        hasAudio: (pRef instanceof AVLayer) ? pRef.hasAudio : false,
                        linkRole: plClip ? (plClip.linkRole || null) : null,
                        resolvedTrack: pastedResolvedTracks[pli],
                        // Pass through both original tracks so the TS side can pin
                        // A/V clips on both maps (resolvedTrack only carries one side).
                        videoTrack: plClip && plClip.videoTrack != null ? plClip.videoTrack : null,
                        audioTrack: plClip && plClip.audioTrack != null ? plClip.audioTrack : null,
                        rcId: parseRcId(pRef.comment) || null
                    });
                } catch (ignore) {
                    // Layer was removed during overlap resolution
                }
            }

            // Also include pre-split layers and their Case-4 split dups so TypeScript
            // can set track overrides for them (otherwise they get auto-assigned to wrong tracks).
            // Include rcId so TypeScript can pin directly by rcId, bypassing fingerprint matching.
            for (var ps = 0; ps < preSplitLayers.length; ps++) {
                var psRef = preSplitLayers[ps].ref;
                try {
                    var psName = psRef.source ? psRef.source.name : psRef.name;
                    pastedLayerInfos.push({
                        sourceName: psName,
                        inPoint: psRef.inPoint,
                        outPoint: psRef.outPoint,
                        startTime: psRef.startTime,
                        hasVideo: (psRef instanceof AVLayer) ? psRef.hasVideo : true,
                        hasAudio: (psRef instanceof AVLayer) ? psRef.hasAudio : false,
                        linkRole: preSplitLayers[ps].trackType === "audio" ? "audio" : "video",
                        resolvedTrack: preSplitLayers[ps].trackNum,
                        rcId: parseRcId(psRef.comment) || null
                    });
                } catch (ignore) {}
            }
            for (var sdi = 0; sdi < splitDupRefs.length; sdi++) {
                var sdRef = splitDupRefs[sdi];
                try {
                    var sdName = sdRef.source ? sdRef.source.name : sdRef.name;
                    var sdVT = splitDupVideoTrackNums[sdi];
                    var sdAT = splitDupAudioTrackNums[sdi];
                    var sdHasVideo = (sdRef instanceof AVLayer) ? sdRef.hasVideo : true;
                    var sdHasAudio = (sdRef instanceof AVLayer) ? sdRef.hasAudio : false;
                    // Read role from comment — full A/V dups (no rc_link parent) have no role.
                    var sdLd = null;
                    try { sdLd = parseLinkData(sdRef.comment); } catch (esd) {}
                    var sdLinkRole = sdLd ? (sdLd.rc_role || null) : null;
                    var sdRcId = parseRcId(sdRef.comment) || null;
                    var sdIsFullAV = sdHasVideo && sdHasAudio && sdVT >= 0 && sdAT >= 0 && !sdLinkRole;

                    if (sdIsFullAV) {
                        // Full A/V case-4 dup: emit with linkRole=null + both
                        // videoTrack/audioTrack so the TS audio-pin path fires
                        // (same shape as non-split pasted A/V clips).
                        pastedLayerInfos.push({
                            sourceName: sdName,
                            inPoint: sdRef.inPoint,
                            outPoint: sdRef.outPoint,
                            startTime: sdRef.startTime,
                            hasVideo: true,
                            hasAudio: true,
                            linkRole: null,
                            rcId: sdRcId,
                            resolvedTrack: sdVT,
                            videoTrack: sdVT,
                            audioTrack: sdAT
                        });
                    } else {
                        var sdIsAudio = sdVT < 0 && sdAT >= 0;
                        pastedLayerInfos.push({
                            sourceName: sdName,
                            inPoint: sdRef.inPoint,
                            outPoint: sdRef.outPoint,
                            startTime: sdRef.startTime,
                            hasVideo: sdHasVideo,
                            hasAudio: sdHasAudio,
                            linkRole: sdLinkRole || (sdIsAudio ? "audio" : "video"),
                            rcId: sdRcId,
                            resolvedTrack: sdIsAudio ? sdAT : sdVT
                        });
                    }
                } catch (ignore) {}
            }

            return JSON.stringify({ success: true, count: pastedCount, pastedLayers: pastedLayerInfos });
        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Paste Insert: create layers from clipboard, split all unlocked clips at targetTime,
 * and shift everything at/after targetTime forward by the paste duration.
 * Clips on locked tracks and locked layers are skipped silently.
 *
 * @param {string} clipDataJson - JSON with { clips: ClipboardClip[] } including videoTrack/audioTrack
 * @param {number} targetTime - CTI position (paste point)
 * @param {string} trackAssignmentsJson - Current layer->track map (same format as pasteLayers)
 * @param {string} lockedTracksJson - Locked tracks map: { "v1": true, "a2": true, ... }
 * @returns {string} JSON result with pastedLayers array
 */
function pasteInsertLayers(clipDataJson, targetTime, trackAssignmentsJson, lockedTracksJson) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return JSON.stringify({ success: false, error: "No active composition" });
        }

        var data = JSON.parse(clipDataJson);
        if (!data.clips || data.clips.length === 0) {
            return JSON.stringify({ success: false, error: "No clips to paste" });
        }

        var frameRate = comp.frameRate;
        var halfFrame = 0.5 / frameRate;
        targetTime = snapToFrame(targetTime, frameRate);

        // Parse track assignments for existing layers
        var existingVideoTracks = {};
        var existingAudioTracks = {};
        if (trackAssignmentsJson) {
            var assignments = JSON.parse(trackAssignmentsJson);
            for (var key in assignments) {
                if (key.charAt(0) === "a") {
                    existingAudioTracks[key.substring(1)] = assignments[key];
                } else {
                    existingVideoTracks[key] = assignments[key];
                }
            }
        }

        // Parse locked tracks
        var lockedVideoTracks = {};
        var lockedAudioTracks = {};
        if (lockedTracksJson) {
            var lockedParsed = JSON.parse(lockedTracksJson);
            for (var lk in lockedParsed) {
                if (lk.charAt(0) === "v") {
                    lockedVideoTracks[lk.substring(1)] = true;
                } else if (lk.charAt(0) === "a") {
                    lockedAudioTracks[lk.substring(1)] = true;
                }
            }
        }

        // Compute paste duration: max(relativeStart + clipDuration) across all clips
        var pasteDuration = 0;
        for (var pd = 0; pd < data.clips.length; pd++) {
            var clipSpan = data.clips[pd].relativeStart + data.clips[pd].clipDuration;
            if (clipSpan > pasteDuration) pasteDuration = clipSpan;
        }
        pasteDuration = snapToFrame(pasteDuration, frameRate);

        if (pasteDuration <= 0) {
            return JSON.stringify({ success: false, error: "Paste duration is zero" });
        }

        app.beginUndoGroup("Railcut: Paste Insert");
        try {
            // === Phase 1: Snapshot existing layers with track info ===
            var layerRefs = [];
            var layerVideoTracks = [];
            var layerAudioTracks = [];
            var layerSkip = []; // true if layer should not be split/shifted

            for (var si = 1; si <= comp.numLayers; si++) {
                var sLayer = comp.layer(si);
                var origIdx = si;
                var vt = existingVideoTracks[String(origIdx)];
                var at = existingAudioTracks[String(origIdx)];

                // Determine if this layer is on a locked track or is itself locked
                var skip = false;
                if (sLayer.locked) {
                    skip = true;
                } else {
                    if (vt !== undefined && lockedVideoTracks[String(vt)]) skip = true;
                    if (at !== undefined && lockedAudioTracks[String(at)]) skip = true;
                }

                layerRefs.push(sLayer);
                layerVideoTracks.push(vt !== undefined ? vt : -1);
                layerAudioTracks.push(at !== undefined ? at : -1);
                layerSkip.push(skip);
            }

            // === Phase 2: Split unlocked layers that span the CTI ===
            // Process highest-index first so duplications don't shift unprocessed layers
            var splitRightRefs = [];
            var splitRightVideoTracks = [];
            var splitRightAudioTracks = [];

            for (var sp = layerRefs.length - 1; sp >= 0; sp--) {
                if (layerSkip[sp]) continue;
                var spLayer = layerRefs[sp];
                try {
                    var spIn = spLayer.inPoint;
                    var spOut = spLayer.outPoint;
                } catch (e) { continue; } // layer may have been removed

                // Layer spans CTI if inPoint < targetTime < outPoint (with tolerance)
                if (spIn < targetTime - halfFrame && spOut > targetTime + halfFrame) {
                    var origOutPoint = spOut;
                    var origStartTime = spLayer.startTime;

                    // Trim left half: set outPoint to CTI
                    spLayer.outPoint = snapToFrame(targetTime, frameRate);

                    // Create right half via duplicate
                    var rightHalf = spLayer.duplicate();
                    // rightHalf is now at spLayer.index - 1 (above original)
                    rightHalf.startTime = origStartTime;
                    rightHalf.inPoint = snapToFrame(targetTime, frameRate);
                    rightHalf.outPoint = origOutPoint;

                    // Track the right half with same track assignments as parent
                    splitRightRefs.push(rightHalf);
                    splitRightVideoTracks.push(layerVideoTracks[sp]);
                    splitRightAudioTracks.push(layerAudioTracks[sp]);
                }
            }

            // === Phase 3: Shift all layers at/after CTI forward by pasteDuration ===
            // This includes right-half splits and any layers already after CTI
            // Check original snapshot layers
            for (var sh = 0; sh < layerRefs.length; sh++) {
                if (layerSkip[sh]) continue;
                var shLayer = layerRefs[sh];
                try {
                    var shIn = shLayer.inPoint;
                } catch (e) { continue; }
                if (shIn >= targetTime - halfFrame) {
                    shLayer.startTime += pasteDuration;
                }
            }
            // Check split right-halves (they are at targetTime, so they should be shifted)
            for (var sr = 0; sr < splitRightRefs.length; sr++) {
                var srLayer = splitRightRefs[sr];
                try {
                    srLayer.startTime += pasteDuration;
                } catch (e) { continue; }
            }

            // === Phase 4: Create pasted layers ===
            var pastedLayerRefs = [];
            var pastedResolvedTracks = [];
            var pastedLinkIdMap = {}; // original linkId → new shared linkId (per linked pair)
            var pastedGroupIdMap = {}; // original groupId → fresh groupId (per source group)

            for (var pi = 0; pi < data.clips.length; pi++) {
                var clip = data.clips[pi];
                var newLayer = createLayerFromClipData(comp, clip);
                if (!newLayer) continue;

                var newInPoint = snapToFrame(targetTime + clip.relativeStart, frameRate);
                var newStartTime = snapToFrame(newInPoint - clip.sourceOffset, frameRate);
                var newOutPoint = snapToFrame(newInPoint + clip.clipDuration, frameRate);

                applyPasteTimingToLayer(newLayer, clip, newInPoint, newOutPoint, newStartTime);

                // Restore layer name and write a comment carrying a fresh rcId
                // (plus fresh linkId if this clip was part of a linked pair,
                // and a fresh group id if it was part of a group). Without
                // the rcId, the TS side can't pin the new layer to its
                // target track and packTracks auto-packs it to the lowest slot.
                if (clip.layerName) {
                    newLayer.name = removeRoleSuffix(clip.layerName);
                }
                var newRcIdPI = generateRcId();
                var metaPI = null;
                if (clip.linkId && clip.linkRole) {
                    if (!pastedLinkIdMap[clip.linkId]) {
                        pastedLinkIdMap[clip.linkId] = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 6);
                    }
                    metaPI = { rc_link: pastedLinkIdMap[clip.linkId], rc_role: clip.linkRole };
                    newLayer.name = addRoleSuffix(newLayer.name, clip.linkRole);
                }
                if (clip.groupId) {
                    if (!pastedGroupIdMap[clip.groupId]) {
                        pastedGroupIdMap[clip.groupId] = "rcg_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 6);
                    }
                    if (!metaPI) metaPI = {};
                    metaPI.rc_group = pastedGroupIdMap[clip.groupId];
                }
                var newCommentPI = metaPI ? JSON.stringify(metaPI) : "";
                newCommentPI = appendRcId(newCommentPI, newRcIdPI);
                newLayer.comment = newCommentPI;

                pastedLayerRefs.push(newLayer);
                // Use the original track from clipboard
                // For linked pairs, use linkRole (native hasVideo/hasAudio are both true for A/V sources)
                var isAudioOnly = clip.linkRole === "audio" || (clip.hasAudio && !clip.hasVideo && clip.linkRole !== "video");
                var resolvedTrack = isAudioOnly
                    ? (clip.audioTrack || 1)
                    : (clip.videoTrack || 1);
                pastedResolvedTracks.push(resolvedTrack);
            }

            if (pastedLayerRefs.length === 0) {
                return JSON.stringify({ success: true, count: 0 });
            }

            // === Phase 5: Reorder layer stack ===
            // Build track assignment map for reorderLayersInPlace
            // All layers now have new indices — must use current .index
            var reorderMap = {};

            // Pasted layers — use clipboard track (audio-only get -1000 offset)
            for (var ri = 0; ri < pastedLayerRefs.length; ri++) {
                var pLayer = pastedLayerRefs[ri];
                var pClip = data.clips[ri];
                var pIsAudioOnly = pClip.linkRole === "audio" || (pClip.hasAudio && !pClip.hasVideo && pClip.linkRole !== "video");
                reorderMap[String(pLayer.index)] = pIsAudioOnly
                    ? (pastedResolvedTracks[ri] - 1000)
                    : pastedResolvedTracks[ri];
            }

            // Original layers (from snapshot) — use their original track assignments
            // Audio-only layers (no video track) get audio track with -1000 offset
            for (var ro = 0; ro < layerRefs.length; ro++) {
                var oLayer = layerRefs[ro];
                try { var oIdx = oLayer.index; } catch (e) { continue; }
                var oVT = layerVideoTracks[ro];
                var oAT = layerAudioTracks[ro];
                if (oVT !== -1) {
                    reorderMap[String(oIdx)] = oVT;
                } else if (oAT !== -1) {
                    reorderMap[String(oIdx)] = oAT - 1000;
                }
            }

            // Split right-halves — inherit parent track
            for (var rs = 0; rs < splitRightRefs.length; rs++) {
                var sLayer2 = splitRightRefs[rs];
                try { var sIdx = sLayer2.index; } catch (e) { continue; }
                var sVT = splitRightVideoTracks[rs];
                var sAT = splitRightAudioTracks[rs];
                if (sVT !== -1) {
                    reorderMap[String(sIdx)] = sVT;
                } else if (sAT !== -1) {
                    reorderMap[String(sIdx)] = sAT - 1000;
                }
            }

            reorderLayersInPlace(comp, JSON.stringify(reorderMap));

            // === Phase 6: Collect and return pasted layer info ===
            var pastedLayerInfos = [];
            for (var pli = 0; pli < pastedLayerRefs.length; pli++) {
                var pRef = pastedLayerRefs[pli];
                try {
                    var pName = pRef.source ? pRef.source.name : pRef.name;
                    var piClip = data.clips[pli];
                    pastedLayerInfos.push({
                        sourceName: pName,
                        inPoint: pRef.inPoint,
                        outPoint: pRef.outPoint,
                        startTime: pRef.startTime,
                        hasVideo: (pRef instanceof AVLayer) ? pRef.hasVideo : true,
                        hasAudio: (pRef instanceof AVLayer) ? pRef.hasAudio : false,
                        linkRole: piClip ? (piClip.linkRole || null) : null,
                        resolvedTrack: pastedResolvedTracks[pli],
                        // Pass through both original tracks so the TS side can pin A/V
                        // clips on both the video and audio maps (resolvedTrack only
                        // carries one side based on linkRole).
                        videoTrack: piClip && piClip.videoTrack != null ? piClip.videoTrack : null,
                        audioTrack: piClip && piClip.audioTrack != null ? piClip.audioTrack : null,
                        rcId: parseRcId(pRef.comment) || null
                    });
                } catch (ignore) {}
            }

            return JSON.stringify({ success: true, count: pastedLayerRefs.length, pastedLayers: pastedLayerInfos });
        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

// ============================================
// Composition Markers
// ============================================

/**
 * Add a composition marker at the given time.
 * @param {number} time - Marker time in seconds
 * @param {string} comment - Marker comment text (optional)
 * @returns {string} JSON result with success status
 */
function addCompMarker(time, comment) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        app.beginUndoGroup("Railcut: Add Marker");
        try {
            var markerValue = new MarkerValue(comment || "");
            comp.markerProperty.setValueAtTime(time, markerValue);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Add a marker at the live CTI position without stopping RAM preview.
 * Uses native AddMarker command (2157) via scheduleTask to run in AE's main thread.
 * Adds comp marker if no layer selected, layer marker if a layer is selected.
 * @returns {string} JSON result with success status
 */
function addMarkerLive() {
    app.scheduleTask('app.executeCommand(2157)', 0, false);
    return makeResult(true);
}

/**
 * Add a pending cut marker at the live CTI position during RAM preview.
 * Deselects all layers first to ensure a COMP marker (not layer marker),
 * then tags it with "CUT" comment for later identification.
 * @returns {string} JSON result
 */
function addPendingCutMarker() {
    app.scheduleTask(
        'app.beginUndoGroup("__pendingCut__");' +
        'var c = app.project.activeItem;' +
        'if (c && c instanceof CompItem) {' +
        '  for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = false;' +
        '  var mp = c.markerProperty;' +
        '  var oldTimes = {};' +
        '  for (var i = 1; i <= mp.numKeys; i++) oldTimes[mp.keyTime(i).toFixed(6)] = true;' +
        '  app.executeCommand(2157);' +
        '  if (mp.numKeys > 0) {' +
        '    for (var j = 1; j <= mp.numKeys; j++) {' +
        '      var t = mp.keyTime(j);' +
        '      if (!oldTimes[t.toFixed(6)]) {' +
        '        var v = mp.keyValue(j);' +
        '        mp.removeKey(j);' +
        '        var nv = new MarkerValue("CUT");' +
        '        nv.duration = v.duration;' +
        '        nv.label = v.label;' +
        '        mp.setValueAtTime(t, nv);' +
        '        break;' +
        '      }' +
        '    }' +
        '  }' +
        '}' +
        'app.endUndoGroup();',
        0, false
    );
    return makeResult(true);
}

/**
 * Process pending cut markers: find all "CUT" markers, collect their times,
 * undo the individual marker additions (cleaning the undo history), then
 * split targeted layers at each time in a single undo group.
 * @param {string} targetedLayerIndicesJson - JSON array of layer indices to split
 * @returns {string} JSON result with cutTimes array
 */
function processPendingCuts(targetedLayerIndicesJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ success: false, error: "No active composition" });

        var layerIndices = JSON.parse(targetedLayerIndicesJson);
        var frameRate = comp.frameRate;
        var markerProp = comp.markerProperty;

        // Collect pending cut times from CUT markers
        var cutTimes = [];
        var numCutMarkers = 0;
        for (var m = 1; m <= markerProp.numKeys; m++) {
            var val = markerProp.keyValue(m);
            if (val.comment === "CUT") {
                cutTimes.push(snapToFrame(markerProp.keyTime(m), frameRate));
                numCutMarkers++;
            }
        }

        if (numCutMarkers === 0) {
            return JSON.stringify({ success: true, cutTimes: [] });
        }

        // Undo each individual marker addition to clean the undo history.
        // Each addPendingCutMarker scheduleTask is wrapped in one undo group,
        // so undoing numCutMarkers times should suffice. The while-loop is a
        // safety net in case any created extra undo entries.
        var maxUndos = numCutMarkers * 3;
        var undoCount = 0;
        while (undoCount < maxUndos) {
            var hasCutMarkers = false;
            for (var chk = 1; chk <= markerProp.numKeys; chk++) {
                if (markerProp.keyValue(chk).comment === "CUT") { hasCutMarkers = true; break; }
            }
            if (!hasCutMarkers) break;
            app.executeCommand(16); // Edit > Undo
            undoCount++;
        }

        // Deduplicate by frame boundary
        cutTimes.sort(function(a, b) { return a - b; });
        var uniqueTimes = [cutTimes[0]];
        for (var d = 1; d < cutTimes.length; d++) {
            if (Math.abs(cutTimes[d] - uniqueTimes[uniqueTimes.length - 1]) > 0.5 / frameRate) {
                uniqueTimes.push(cutTimes[d]);
            }
        }

        // All splits in one undo group (markers already removed via undo above)
        app.beginUndoGroup("Railcut: Add Edit On-the-Fly");
        try {
            // Collect layer OBJECTS for targeted indices (object refs survive index shifts)
            var targetLayers = [];
            for (var li = 0; li < layerIndices.length; li++) {
                var layer = comp.layer(layerIndices[li]);
                if (layer && !layer.locked) targetLayers.push(layer);
            }

            // For each layer, find applicable cut times and split right-to-left
            for (var tl = 0; tl < targetLayers.length; tl++) {
                var lyr = targetLayers[tl];
                var inP = lyr.inPoint;
                var outP = lyr.outPoint;

                // Filter cut times within this layer's bounds
                var applicable = [];
                for (var c = 0; c < uniqueTimes.length; c++) {
                    if (uniqueTimes[c] > inP && uniqueTimes[c] < outP) {
                        applicable.push(uniqueTimes[c]);
                    }
                }
                if (applicable.length === 0) continue;

                // Sort descending (rightmost first) so each split doesn't invalidate others
                applicable.sort(function(a, b) { return b - a; });

                for (var s = 0; s < applicable.length; s++) {
                    var splitTime = applicable[s];
                    var currentOut = lyr.outPoint;
                    lyr.outPoint = splitTime;
                    var newLayer = lyr.duplicate();
                    newLayer.inPoint = splitTime;
                    newLayer.outPoint = currentOut;
                }
            }

            return JSON.stringify({ success: true, cutTimes: uniqueTimes });

        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Delete a composition marker by its 1-based key index.
 * @param {number} markerIndex - 1-based marker key index
 * @returns {string} JSON result with success status
 */
function deleteCompMarker(markerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var markerProp = comp.markerProperty;
        if (markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex);
        }

        app.beginUndoGroup("Railcut: Delete Marker");
        try {
            markerProp.removeKey(markerIndex);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Move a composition marker to a new time, preserving all properties.
 * @param {number} markerIndex - 1-based marker key index
 * @param {number} newTime - New time in seconds
 * @returns {string} JSON result with success status
 */
function moveCompMarker(markerIndex, newTime) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var markerProp = comp.markerProperty;
        if (markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex);
        }

        app.beginUndoGroup("Railcut: Move Marker");
        try {
            var currentValue = markerProp.keyValue(markerIndex);
            markerProp.removeKey(markerIndex);
            markerProp.setValueAtTime(newTime, currentValue);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set the label color of a composition marker.
 * @param {number} markerIndex - 1-based marker key index
 * @param {number} labelIndex - Label color index (0-16)
 * @returns {string} JSON result with success status
 */
function setCompMarkerLabel(markerIndex, labelIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var markerProp = comp.markerProperty;
        if (markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex + " (numKeys: " + markerProp.numKeys + ")");
        }

        app.beginUndoGroup("Railcut: Set Marker Color");
        try {
            var time = markerProp.keyTime(markerIndex);
            var currentValue = markerProp.keyValue(markerIndex);
            var oldLabel = currentValue.label;

            // Create new marker value with updated label
            var newValue = cloneMarkerValue(currentValue, { label: labelIndex });

            // Remove old and add new at same time
            markerProp.removeKey(markerIndex);
            markerProp.setValueAtTime(time, newValue);

            // Verify the change
            var newIndex = markerProp.nearestKeyIndex(time);
            var verifyValue = markerProp.keyValue(newIndex);

            return JSON.stringify({
                success: true,
                oldLabel: oldLabel,
                newLabel: verifyValue.label,
                requestedLabel: labelIndex
            });
        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set the duration of a composition marker (and optionally move its start time).
 * Used for extending/resizing duration markers.
 * @param {number} markerIndex - 1-based marker key index
 * @param {number} newTime - New start time in seconds
 * @param {number} newDuration - New duration in seconds (0 for point marker)
 * @returns {string} JSON result with success status
 */
function setCompMarkerDuration(markerIndex, newTime, newDuration) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var markerProp = comp.markerProperty;
        if (markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex);
        }

        app.beginUndoGroup("Railcut: Set Marker Duration");
        try {
            var currentValue = markerProp.keyValue(markerIndex);

            // Create new marker value with updated duration
            var newValue = cloneMarkerValue(currentValue, { duration: Math.max(0, newDuration) });

            // Remove old and add new at new time
            markerProp.removeKey(markerIndex);
            markerProp.setValueAtTime(newTime, newValue);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Edit a composition marker's properties (time, duration, comment, label).
 * @param {number} markerIndex - 1-based marker key index
 * @param {number} newTime - New time position in seconds
 * @param {number} newDuration - New duration in seconds (0 = point marker)
 * @param {string} newComment - New comment text
 * @param {number} newLabel - New label color index (0-16)
 * @returns {string} JSON result
 */
function editCompMarker(markerIndex, newTime, newDuration, newComment, newLabel) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var markerProp = comp.markerProperty;
        if (markerIndex < 1 || markerIndex > markerProp.numKeys)
            return makeResult(false, "Invalid marker index");

        app.beginUndoGroup("Railcut: Edit Marker");
        try {
            var currentValue = markerProp.keyValue(markerIndex);
            var newValue = cloneMarkerValue(currentValue, {
                comment: newComment,
                duration: newDuration,
                label: newLabel
            });
            markerProp.removeKey(markerIndex);
            markerProp.setValueAtTime(newTime, newValue);
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Edit a layer marker's properties (time, duration, comment, label).
 * @param {number} layerIndex - 1-based layer index
 * @param {number} markerIndex - 1-based marker key index
 * @param {number} newTime - New time position in seconds
 * @param {number} newDuration - New duration in seconds (0 = point marker)
 * @param {string} newComment - New comment text
 * @param {number} newLabel - New label color index (0-16)
 * @returns {string} JSON result
 */
function editLayerMarker(layerIndex, markerIndex, newTime, newDuration, newComment, newLabel) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layer = comp.layer(layerIndex);
        if (!layer) return makeResult(false, "Layer not found");

        var markerProp = layer.property("Marker");
        if (!markerProp || markerIndex < 1 || markerIndex > markerProp.numKeys)
            return makeResult(false, "Invalid marker index");

        app.beginUndoGroup("Railcut: Edit Layer Marker");
        try {
            var currentValue = markerProp.keyValue(markerIndex);
            var newValue = cloneMarkerValue(currentValue, {
                comment: newComment,
                duration: newDuration,
                label: newLabel
            });
            markerProp.removeKey(markerIndex);
            markerProp.setValueAtTime(newTime, newValue);
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

// =============================================================
// Layer Marker Operations
// =============================================================

/**
 * Add a marker to a specific layer at the given time.
 * @param {number} layerIndex - 1-based layer index
 * @param {number} time - Time in seconds (comp time)
 * @param {string} [comment] - Optional marker comment text
 * @returns {string} JSON result with success status
 */
function addLayerMarker(layerIndex, time, comment) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer) {
            return makeResult(false, "Layer not found: " + layerIndex);
        }

        app.beginUndoGroup("Railcut: Add Layer Marker");
        try {
            var markerValue = new MarkerValue(comment || "");
            var markerProp = layer.property("Marker");
            markerProp.setValueAtTime(time, markerValue);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Delete a layer marker by its 1-based key index.
 * @param {number} layerIndex - 1-based layer index
 * @param {number} markerIndex - 1-based marker key index
 * @returns {string} JSON result with success status
 */
function deleteLayerMarker(layerIndex, markerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer) {
            return makeResult(false, "Layer not found: " + layerIndex);
        }

        var markerProp = layer.property("Marker");
        if (!markerProp || markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex);
        }

        app.beginUndoGroup("Railcut: Delete Layer Marker");
        try {
            markerProp.removeKey(markerIndex);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Move a layer marker to a new time, preserving all properties.
 * @param {number} layerIndex - 1-based layer index
 * @param {number} markerIndex - 1-based marker key index
 * @param {number} newTime - New time in seconds (comp time)
 * @returns {string} JSON result with success status
 */
function moveLayerMarker(layerIndex, markerIndex, newTime) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer) {
            return makeResult(false, "Layer not found: " + layerIndex);
        }

        var markerProp = layer.property("Marker");
        if (!markerProp || markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex);
        }

        app.beginUndoGroup("Railcut: Move Layer Marker");
        try {
            var currentValue = markerProp.keyValue(markerIndex);
            markerProp.removeKey(markerIndex);
            markerProp.setValueAtTime(newTime, currentValue);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set the label color of a layer marker.
 * @param {number} layerIndex - 1-based layer index
 * @param {number} markerIndex - 1-based marker key index
 * @param {number} labelIndex - Label color index (0-16)
 * @returns {string} JSON result with success status
 */
function setLayerMarkerLabel(layerIndex, markerIndex, labelIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer) {
            return makeResult(false, "Layer not found: " + layerIndex);
        }

        var markerProp = layer.property("Marker");
        if (!markerProp || markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex + " (numKeys: " + (markerProp ? markerProp.numKeys : 0) + ")");
        }

        app.beginUndoGroup("Railcut: Set Marker Color");
        try {
            var time = markerProp.keyTime(markerIndex);
            var currentValue = markerProp.keyValue(markerIndex);
            var oldLabel = currentValue.label;

            // Create new marker value with updated label
            var newValue = cloneMarkerValue(currentValue, { label: labelIndex });

            // Remove old and add new at same time
            markerProp.removeKey(markerIndex);
            markerProp.setValueAtTime(time, newValue);

            // Verify the change
            var newIndex = markerProp.nearestKeyIndex(time);
            var verifyValue = markerProp.keyValue(newIndex);

            return JSON.stringify({
                success: true,
                oldLabel: oldLabel,
                newLabel: verifyValue.label,
                requestedLabel: labelIndex
            });
        } finally {
            app.endUndoGroup();
        }

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set the duration of a layer marker (and optionally move its start time).
 * Used for extending/resizing duration markers.
 * @param {number} layerIndex - 1-based layer index
 * @param {number} markerIndex - 1-based marker key index
 * @param {number} newTime - New start time in seconds
 * @param {number} newDuration - New duration in seconds (0 for point marker)
 * @returns {string} JSON result with success status
 */
function setLayerMarkerDuration(layerIndex, markerIndex, newTime, newDuration) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer) {
            return makeResult(false, "Layer not found: " + layerIndex);
        }

        var markerProp = layer.property("Marker");
        if (!markerProp || markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex);
        }

        app.beginUndoGroup("Railcut: Set Marker Duration");
        try {
            var currentValue = markerProp.keyValue(markerIndex);

            // Create new marker value with updated duration
            var newValue = cloneMarkerValue(currentValue, { duration: Math.max(0, newDuration) });

            // Remove old and add new at new time
            markerProp.removeKey(markerIndex);
            markerProp.setValueAtTime(newTime, newValue);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Navigate to a composition marker and open the AE marker dialog.
 * Sets CTI to marker time and deselects all layers so comp marker context is active.
 * @param {number} markerIndex - 1-based marker key index
 * @returns {string} JSON result with success status
 */
function navigateToCompMarker(markerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var markerProp = comp.markerProperty;
        if (markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex);
        }

        // Navigate CTI to marker time
        comp.time = markerProp.keyTime(markerIndex);

        // Deselect all layers so comp context is active
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).selected = false;
        }

        // Select the marker key for editing
        markerProp.setSelectedAtKey(markerIndex, true);

        // Try to open the marker dialog via Edit > Edit Selected Markers
        // Use findMenuCommandId for version compatibility
        var dialogOpened = false;
        try {
            var cmdId = app.findMenuCommandId("Edit Selected Markers");
            if (cmdId && cmdId > 0) {
                app.executeCommand(cmdId);
                dialogOpened = true;
            }
        } catch (cmdErr) {
            // findMenuCommandId failed, try known command IDs
        }

        // Fallback: try known command IDs for different AE versions
        if (!dialogOpened) {
            var knownIds = [2379, 2158, 3769]; // Various AE versions
            for (var k = 0; k < knownIds.length; k++) {
                try {
                    app.executeCommand(knownIds[k]);
                    dialogOpened = true;
                    break;
                } catch (idErr) {
                    // Try next ID
                }
            }
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Navigate to a layer marker and open the AE marker dialog.
 * Sets CTI to marker time, selects the layer, and selects the marker key.
 * @param {number} layerIndex - 1-based layer index
 * @param {number} markerIndex - 1-based marker key index
 * @returns {string} JSON result with success status
 */
function navigateToLayerMarker(layerIndex, markerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) {
            return makeResult(false, "No active composition");
        }

        var layer = comp.layer(layerIndex);
        if (!layer) {
            return makeResult(false, "Layer not found: " + layerIndex);
        }

        var markerProp = layer.property("Marker");
        if (!markerProp || markerIndex < 1 || markerIndex > markerProp.numKeys) {
            return makeResult(false, "Invalid marker index: " + markerIndex);
        }

        // Navigate CTI to marker time
        comp.time = markerProp.keyTime(markerIndex);

        // Select only this layer
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).selected = false;
        }
        layer.selected = true;

        // Select the marker key for editing
        markerProp.setSelectedAtKey(markerIndex, true);

        // Try to open the marker dialog via Edit > Edit Selected Markers
        // Use findMenuCommandId for version compatibility
        var dialogOpened = false;
        try {
            var cmdId = app.findMenuCommandId("Edit Selected Markers");
            if (cmdId && cmdId > 0) {
                app.executeCommand(cmdId);
                dialogOpened = true;
            }
        } catch (cmdErr) {
            // findMenuCommandId failed, try known command IDs
        }

        // Fallback: try known command IDs for different AE versions
        if (!dialogOpened) {
            var knownIds = [2379, 2158, 3769]; // Various AE versions
            for (var k = 0; k < knownIds.length; k++) {
                try {
                    app.executeCommand(knownIds[k]);
                    dialogOpened = true;
                    break;
                } catch (idErr) {
                    // Try next ID
                }
            }
        }

        return makeResult(true);

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

// ============================================
// Rename & Speed
// ============================================

/**
 * Rename a layer.
 * @param {number} layerIndex - 1-based layer index
 * @param {string} newName - New layer name
 * @returns {string} JSON result
 */
function renameLayer(layerIndex, newName) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);

        app.beginUndoGroup("Railcut: Rename Layer");
        try {
            check.layer.name = newName;
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Rename two layers (linked pair) in a single undo group.
 * @param {number} layerIndex - 1-based layer index of the primary half
 * @param {string} newName - New name for primary
 * @param {number} partnerIndex - 1-based layer index of the partner
 * @param {string} partnerName - New name for partner
 * @returns {string} JSON result
 */
function renameLinkedPair(layerIndex, newName, partnerIndex, partnerName) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var primary = getLayerChecked(comp, layerIndex, true);
        if (primary.error) return makeResult(false, primary.error);
        var partner = getLayerChecked(comp, partnerIndex, true);
        if (partner.error) return makeResult(false, partner.error);

        app.beginUndoGroup("Railcut: Rename Linked Pair");
        try {
            primary.layer.name = newName;
            partner.layer.name = partnerName;
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set layer speed by adjusting stretch property.
 * Anchors at the inPoint (left edge stays fixed).
 * @param {number} layerIndex - 1-based layer index
 * @param {number} speedPercent - New speed percentage (100 = normal, 200 = 2x fast)
 * @returns {string} JSON result
 */
function setLayerSpeed(layerIndex, speedPercent, maxOutPoint, reverse) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        if (speedPercent <= 0) return makeResult(false, "Speed must be positive");

        app.beginUndoGroup("Railcut: Set Layer Speed");
        try {
            var frameRate = comp.frameRate;
            // For reversed layers, anchor on the visible start (which AE reports as outPoint)
            var wasReversed = layer.stretch < 0;
            var anchorIn = wasReversed ? layer.outPoint : layer.inPoint;

            // stretch = (100 / speedPercent) * 100
            // e.g. 200% speed -> stretch = 50, 50% speed -> stretch = 200
            var newStretch = (100 / speedPercent) * 100;
            if (reverse) newStretch = -newStretch;

            // Set the new stretch — AE auto-adjusts inPoint/outPoint/startTime
            layer.stretch = newStretch;

            // Correct drift so the visible start stays at its original position
            var newAnchor = newStretch < 0 ? layer.outPoint : layer.inPoint;
            var drift = newAnchor - anchorIn;
            if (Math.abs(drift) > 0.0001) {
                layer.startTime = snapToFrame(layer.startTime - drift, frameRate);
            }

            // Clamp outPoint if it would extend past an adjacent clip
            // For reversed layers, the visible end is at inPoint
            var visibleEnd = newStretch < 0 ? layer.inPoint : layer.outPoint;
            if (typeof maxOutPoint === "number" && visibleEnd > maxOutPoint + 0.5 / frameRate) {
                if (newStretch < 0) {
                    layer.inPoint = snapToFrame(maxOutPoint, frameRate);
                } else {
                    layer.outPoint = snapToFrame(maxOutPoint, frameRate);
                }
            }

        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Set blending mode on one or more layers.
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @param {string} modeKey - String key (e.g. "MULTIPLY") matching blendingModeFromKey
 * @returns {string} JSON result
 */
function setLayerBlendingMode(layerIndicesJson, modeKey) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var indices = JSON.parse(layerIndicesJson);
        if (!indices || indices.length === 0) return makeResult(false, "No layers");

        var mode = blendingModeFromKey(modeKey);
        if (mode === null) return makeResult(false, "Unknown blending mode");

        app.beginUndoGroup("Railcut: Set Blending Mode");
        try {
            for (var i = 0; i < indices.length; i++) {
                try {
                    var layer = comp.layer(indices[i]);
                    if (layer instanceof AVLayer) {
                        layer.blendingMode = mode;
                    }
                } catch (eLayer) {}
            }
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

// ============================================
// Lift / Extract (Work Area Operations)
// ============================================

/**
 * Lift work area: trim/split/delete portions of specified layers within
 * a time range, leaving gaps. Layers are identified by index.
 *
 * Overlap logic per layer:
 *   - Fully inside range → delete
 *   - Spans range start only → trim outPoint to rangeStart
 *   - Spans range end only → trim inPoint to rangeEnd
 *   - Wider than range → split at rangeStart, split at rangeEnd, delete middle
 *   - No overlap → skip
 *
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices
 * @param {number} rangeStart - Start of work area (comp time)
 * @param {number} rangeEnd - End of work area (comp time)
 * @returns {string} JSON result
 */
function liftWorkArea(layerIndicesJson, rangeStart, rangeEnd) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) return makeResult(true);

        var frameRate = comp.frameRate;
        rangeStart = snapToFrame(rangeStart, frameRate);
        rangeEnd = snapToFrame(rangeEnd, frameRate);
        if (rangeEnd <= rangeStart) return makeResult(false, "Invalid range");

        var eps = 0.5 / frameRate;

        // Collect right-piece infos so the TS side can pin them to the parent's
        // V/A tracks (otherwise they auto-pack to V1/A1 on reload).
        var splitInfos = [];

        app.beginUndoGroup("Railcut: Lift");

        try {
            // Sort descending so deletions don't shift indices of layers we haven't processed yet
            layerIndices.sort(function(a, b) { return b - a; });

            for (var i = 0; i < layerIndices.length; i++) {
                var origIndex = layerIndices[i];
                var layer = comp.layer(origIndex);
                if (!layer || layer.locked) continue;

                var layerIn = layer.inPoint;
                var layerOut = layer.outPoint;

                // No overlap
                if (layerIn >= rangeEnd - eps || layerOut <= rangeStart + eps) continue;

                var startsBeforeRange = layerIn < rangeStart - eps;
                var endsAfterRange = layerOut > rangeEnd + eps;

                if (startsBeforeRange && endsAfterRange) {
                    // Layer wider than range — split at both edges, delete middle
                    var snappedEnd = snapToFrame(rangeEnd, frameRate);
                    var origOut = layer.outPoint;
                    layer.outPoint = snappedEnd;
                    var rightPiece = layer.duplicate();
                    // Set inPoint first, then outPoint (same order as splitLayerAtTime)
                    rightPiece.inPoint = snappedEnd;
                    rightPiece.outPoint = origOut;
                    layer.outPoint = snapToFrame(rangeStart, frameRate);
                    // Assign fresh rcId so the right piece doesn't collide with
                    // the parent (otherwise dedup runs on reload and might pick
                    // either layer as the keeper).
                    try {
                        var rpComment = rightPiece.comment;
                        var newRpRcId = generateRcId();
                        if (rpComment && parseRcId(rpComment)) {
                            rightPiece.comment = appendRcId(rpComment, newRpRcId);
                        } else {
                            rightPiece.comment = (rpComment || "") + "\n[RC:" + newRpRcId + "]";
                        }
                        splitInfos.push({
                            sourceLayerIndex: origIndex,
                            newRcId: newRpRcId
                        });
                    } catch (eRpId) {}

                } else if (startsBeforeRange && !endsAfterRange) {
                    // Spans range start only — trim outPoint to rangeStart
                    layer.outPoint = snapToFrame(rangeStart, frameRate);

                } else if (!startsBeforeRange && endsAfterRange) {
                    // Spans range end only — trim inPoint to rangeEnd
                    // Save outPoint first: AE auto-adjusts outPoint to maintain
                    // duration when inPoint changes (same issue as workAreaStart)
                    var preservedOut = layer.outPoint;
                    layer.inPoint = snapToFrame(rangeEnd, frameRate);
                    layer.outPoint = preservedOut;

                } else {
                    // Fully inside range — delete
                    layer.remove();
                }
            }
        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify({ success: true, splitLayers: splitInfos });

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Extract work area: trim/split/delete specified layers within a time range,
 * then ripple-shift them to close the gap. Only processes layers whose
 * indices are in layerIndicesJson — the caller excludes locked tracks.
 *
 * @param {string} layerIndicesJson - JSON array of 1-based layer indices to process
 * @param {number} rangeStart - Start of work area (comp time)
 * @param {number} rangeEnd - End of work area (comp time)
 * @returns {string} JSON result
 */
function extractWorkArea(layerIndicesJson, rangeStart, rangeEnd) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var layerIndices = JSON.parse(layerIndicesJson);
        if (!layerIndices || layerIndices.length === 0) return makeResult(true);

        // Build lookup set for eligible layer indices
        var indexSet = {};
        for (var idx = 0; idx < layerIndices.length; idx++) {
            indexSet[layerIndices[idx]] = true;
        }

        var frameRate = comp.frameRate;
        rangeStart = snapToFrame(rangeStart, frameRate);
        rangeEnd = snapToFrame(rangeEnd, frameRate);
        if (rangeEnd <= rangeStart) return makeResult(false, "Invalid range");

        var rangeDuration = rangeEnd - rangeStart;
        var eps = 0.5 / frameRate;

        app.beginUndoGroup("Railcut: Extract");

        try {
            // Phase 1: Categorize eligible layers by overlap type.
            // Collect layer references and actions before modifying, since
            // splits/deletes change indices.
            var toDelete = [];    // layer references to remove
            var toTrimOut = [];   // { layer, newOut } — spans start only
            var toTrimIn = [];    // { layer } — spans end only (will shift left)
            var toSplit = [];     // { layer } — wider than range
            var toShift = [];     // layer references fully after range (shift left)

            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (layer.locked || !indexSet[i]) continue;

                var layerIn = layer.inPoint;
                var layerOut = layer.outPoint;

                var startsBeforeRange = layerIn < rangeStart - eps;
                var endsAfterRange = layerOut > rangeEnd + eps;
                var overlapsRange = layerIn < rangeEnd - eps && layerOut > rangeStart + eps;

                if (!overlapsRange) {
                    // No overlap — collect post-range layers for Phase 6 shift
                    if (layerIn >= rangeEnd - eps) {
                        toShift.push(layer);
                    }
                    continue;
                }

                if (startsBeforeRange && endsAfterRange) {
                    toSplit.push({ layer: layer });
                } else if (startsBeforeRange) {
                    toTrimOut.push({ layer: layer, newOut: snapToFrame(rangeStart, frameRate) });
                } else if (endsAfterRange) {
                    toTrimIn.push({ layer: layer });
                } else {
                    // Fully inside range
                    toDelete.push(layer);
                }
            }

            // Phase 2: Process splits (wider-than-range layers).
            // Track right-piece infos so the TS side can pin them to the
            // parent's V/A tracks (see liftWorkArea for why).
            var splitInfos = [];
            for (var s = 0; s < toSplit.length; s++) {
                var sl = toSplit[s].layer;
                var slOrigIndex = sl.index;
                var snappedStart = snapToFrame(rangeStart, frameRate);
                var snappedEnd = snapToFrame(rangeEnd, frameRate);
                var origOut = sl.outPoint;

                // Trim original to end at rangeStart
                sl.outPoint = snappedStart;

                // Create right piece starting at rangeEnd, then shift it left
                var rightPiece = sl.duplicate();
                // Set inPoint first, then outPoint (same order as splitLayerAtTime)
                rightPiece.inPoint = snappedEnd;
                rightPiece.outPoint = origOut;
                rightPiece.startTime -= rangeDuration;

                // Assign fresh rcId so the right piece doesn't collide with parent.
                try {
                    var rpExComment = rightPiece.comment;
                    var newRpExRcId = generateRcId();
                    if (rpExComment && parseRcId(rpExComment)) {
                        rightPiece.comment = appendRcId(rpExComment, newRpExRcId);
                    } else {
                        rightPiece.comment = (rpExComment || "") + "\n[RC:" + newRpExRcId + "]";
                    }
                    splitInfos.push({
                        sourceLayerIndex: slOrigIndex,
                        newRcId: newRpExRcId
                    });
                } catch (eRpExId) {}
            }

            // Phase 3: Trim outPoints (spans start only — no shift needed)
            for (var t = 0; t < toTrimOut.length; t++) {
                toTrimOut[t].layer.outPoint = toTrimOut[t].newOut;
            }

            // Phase 4: Trim inPoints (spans end only) and shift left
            for (var u = 0; u < toTrimIn.length; u++) {
                var tl = toTrimIn[u].layer;
                // Save outPoint: AE auto-adjusts outPoint to maintain duration
                // when inPoint changes, so we must explicitly restore it
                var preservedOut = tl.outPoint;
                tl.inPoint = snapToFrame(rangeEnd, frameRate);
                tl.outPoint = preservedOut;
                tl.startTime -= rangeDuration;
            }

            // Phase 5: Delete fully-inside layers
            for (var d = toDelete.length - 1; d >= 0; d--) {
                toDelete[d].remove();
            }

            // Phase 6: Shift post-range eligible layers leftward.
            // References were collected in Phase 1 before indices changed.
            // Layers on locked tracks were excluded by the caller.
            for (var r = 0; r < toShift.length; r++) {
                toShift[r].startTime -= rangeDuration;
            }

        } finally {
            app.endUndoGroup();
        }

        return JSON.stringify({ success: true, splitLayers: splitInfos });

    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Fit layer to comp frame — scale layer so its source fills the comp dimensions.
 * Equivalent to Layer > Transform > Fit to Comp.
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON result
 */
function fitLayerToCompWidth(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var result = getLayerChecked(comp, layerIndex, true);
        if (result.error) return makeResult(false, result.error);
        var layer = result.layer;

        if (!layer.source || layer.source.width === undefined) {
            return makeResult(false, "Layer has no spatial dimensions");
        }

        var sourceW = layer.source.width;
        if (sourceW <= 0) return makeResult(false, "Invalid source dimensions");

        var uniformScale = (comp.width / sourceW) * 100;

        app.beginUndoGroup("Railcut: Fit to Comp Width");
        try {
            layer.transform.scale.setValue([uniformScale, uniformScale]);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

function fitLayerToCompHeight(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var result = getLayerChecked(comp, layerIndex, true);
        if (result.error) return makeResult(false, result.error);
        var layer = result.layer;

        if (!layer.source || layer.source.height === undefined) {
            return makeResult(false, "Layer has no spatial dimensions");
        }

        var sourceH = layer.source.height;
        if (sourceH <= 0) return makeResult(false, "Invalid source dimensions");

        var uniformScale = (comp.height / sourceH) * 100;

        app.beginUndoGroup("Railcut: Fit to Comp Height");
        try {
            layer.transform.scale.setValue([uniformScale, uniformScale]);
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

// ============================================
// Project Panel Selection
// ============================================

/**
 * Probe footage viewer in/out marks for ALL currently selected project items.
 * Uses a single cmd 2005 ("Add Footage to Comp") call which adds all selected items
 * and respects their footage viewer marks. Reads each layer's timing, then undoes.
 * Safe to call during drag — the comp should already be in the active viewer.
 * @param {number} compId - Target composition ID (must be in the active viewer)
 * @returns {string} JSON with marks: { itemId: { markedIn, markedOut } } for items that have marks
 */
function probeFootageMarks(compId) {
    try {
        // Find the comp
        var comp = null;
        for (var ci = 1; ci <= app.project.numItems; ci++) {
            var projItem = app.project.item(ci);
            if (projItem instanceof CompItem && projItem.id === compId) {
                comp = projItem;
                break;
            }
        }
        if (!comp) return JSON.stringify({ success: false, error: "Comp not found" });

        // Ensure comp is in the viewer (should already be — no visible change)
        comp.openInViewer();

        // cmd 2005 adds ALL selected items to the active comp, respecting footage viewer marks
        var beforeCount = comp.numLayers;
        app.executeCommand(2005);

        var marks = {};
        var addedCount = comp.numLayers - beforeCount;
        if (addedCount > 0) {
            // Read each newly added layer (they're at indices 1..addedCount)
            for (var li = 1; li <= addedCount; li++) {
                var layer = comp.layer(li);
                if (layer.source) {
                    var srcId = layer.source.id;
                    var dur = layer.outPoint - layer.inPoint;
                    var srcDur = layer.source.duration || 0;
                    if (srcDur > 0 && Math.abs(dur - srcDur) > 0.001) {
                        marks[srcId] = {
                            markedIn: layer.inPoint - layer.startTime,
                            markedOut: layer.outPoint - layer.startTime
                        };
                    }
                }
            }
            // Undo the add — removes all layers cmd 2005 created
            app.executeCommand(16);
        }

        return JSON.stringify({ success: true, marks: marks });
    } catch (e) {
        // If something went wrong mid-probe, try to undo
        try { app.executeCommand(16); } catch (eu) {}
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

/**
 * Insert a project item into the active comp at a specified time.
 * @param {number} itemId - AE project item ID
 * @param {string} mode - "insert" (ripple shift downstream) or "overlay" (overwrite overlapping)
 * @param {number} time - Target time in seconds where the clip should be placed
 * @param {string} sameTrackIndicesJson - JSON array of layer indices on the target track (overlay only affects these)
 */
function insertProjectItem(itemId, mode, time, sameTrackIndicesJson, compId, disableVideo, disableAudio, stillDuration, markedIn, markedOut, targetVideoTrack, existingVideoAssignmentsJson) {
    try {
        // Use explicit compId to find the target comp — getActiveComp() is unreliable
        // during drag-and-drop because AE sets activeItem to the dragged project item
        var comp = null;
        if (compId) {
            for (var ci = 1; ci <= app.project.numItems; ci++) {
                var projItem = app.project.item(ci);
                if (projItem instanceof CompItem && projItem.id === compId) {
                    comp = projItem;
                    break;
                }
            }
        }
        if (!comp) comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var item = findProjectItemById(itemId);
        if (!item) return makeResult(false, "Project item not found: " + itemId);

        var frameRate = comp.frameRate;
        var targetTime = snapToFrame(time, frameRate);

        // Parse same-track indices for overlay filtering
        // When provided (even if empty), only overwrite layers in this list
        var hasSameTrackFilter = !!sameTrackIndicesJson;
        var sameTrackIndices = [];
        if (sameTrackIndicesJson) {
            sameTrackIndices = JSON.parse(sameTrackIndicesJson);
        }


        app.beginUndoGroup("Railcut: " + (mode === "insert" ? "Insert" : "Overlay") + " Clip");
        try {
            // Capture pre-insert video-assigned layer refs so the stack reorder at
            // the end can resolve to current indices even after pre-splits create
            // duplicates mid-function.
            var preInsertVideoRefs = [];
            if (existingVideoAssignmentsJson) {
                var existingVA = {};
                try { existingVA = JSON.parse(existingVideoAssignmentsJson); } catch (epva) {}
                for (var peIdxKey in existingVA) {
                    if (!existingVA.hasOwnProperty(peIdxKey)) continue;
                    var peIdx = parseInt(peIdxKey, 10);
                    if (!isNaN(peIdx) && peIdx >= 1 && peIdx <= comp.numLayers) {
                        preInsertVideoRefs.push({ ref: comp.layer(peIdx), videoTrack: existingVA[peIdxKey] });
                    }
                }
            }

            var newLayer = comp.layers.add(item);
            if (!newLayer) return makeResult(false, "Failed to create layer");

            // Assign an rcId immediately so the panel's first post-insert reload
            // can resolve the localStorage fingerprint pin (set by the JS drop
            // handler) onto this layer. Without this, audio-only / video-only
            // drops arrive rcId-less, the override path can't map to a pin, and
            // auto-pin claims the lowest free track before useEnsureRcIds catches
            // up — making the dropped clip appear stuck on track 1.
            try {
                if (!parseRcId(newLayer.comment)) {
                    newLayer.comment = appendRcId(newLayer.comment, generateRcId());
                }
            } catch (eAssignRcId) { /* best effort */ }

            // comp.layers.add() inserts at index 1, shifting all existing indices +1
            for (var si = 0; si < sameTrackIndices.length; si++) {
                sameTrackIndices[si] = sameTrackIndices[si] + 1;
            }

            // Position at target time — respect footage viewer in/out marks if present
            var hasMarks = typeof markedIn === "number" && typeof markedOut === "number";

            if (item.duration === 0) {
                // Still image — no marks possible
                var sourceDuration = stillDuration > 0 ? stillDuration : comp.duration;
                newLayer.startTime = targetTime;
                newLayer.inPoint = targetTime;
                newLayer.outPoint = snapToFrame(targetTime + sourceDuration, frameRate);
            } else if (hasMarks) {
                // Footage viewer marks — use marked sub-range
                newLayer.startTime = targetTime - markedIn;
                newLayer.inPoint = targetTime;
                newLayer.outPoint = snapToFrame(targetTime + (markedOut - markedIn), frameRate);
            } else {
                // No marks — full source duration (original behavior)
                var sourceDuration = item.duration;
                newLayer.startTime = targetTime;
                newLayer.inPoint = targetTime;
                newLayer.outPoint = snapToFrame(targetTime + sourceDuration, frameRate);
            }

            var movedIn = newLayer.inPoint;
            var movedOut = newLayer.outPoint;

            if (mode === "insert") {
                // Insert edit: split layers spanning the insert point, then ripple shift
                var clipDuration = movedOut - movedIn;
                var halfFrame = 0.5 / frameRate;

                // First pass: split any layer that spans the insert point
                // Iterate backward since splitting adds layers
                for (var i = comp.numLayers; i >= 1; i--) {
                    var layer = comp.layer(i);
                    if (layer === newLayer || layer.locked) continue;
                    if (layer.inPoint < targetTime - halfFrame && layer.outPoint > targetTime + halfFrame) {
                        // Layer spans the insert point — split it
                        var origOut = layer.outPoint;
                        layer.outPoint = snapToFrame(targetTime, frameRate);
                        var splitRight = layer.duplicate();
                        splitRight.inPoint = snapToFrame(targetTime, frameRate);
                        splitRight.outPoint = origOut;
                    }
                }

                // Second pass: shift all layers at or after the insert point
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    if (layer === newLayer || layer.locked) continue;
                    if (layer.inPoint >= targetTime - halfFrame) {
                        layer.startTime += clipDuration;
                    }
                }
            } else {
                // Overlay mode. Track targets by layer REFERENCE (stable across index
                // shifts) rather than index, because pre-splitting live A/V targets
                // for single-component drops creates duplicate layers that reshuffle
                // indices.
                var incomingIsAudioOnly = !!disableVideo || !newLayer.hasVideo;
                var incomingIsVideoOnly = !!disableAudio || !newLayer.hasAudio;
                var isSingleComponent = incomingIsAudioOnly !== incomingIsVideoOnly;

                // Build initial targetRefs from sameTrackIndices (or all unlocked layers).
                var targetRefs = [];
                if (hasSameTrackFilter) {
                    for (var sti = 0; sti < sameTrackIndices.length; sti++) {
                        var tidx = sameTrackIndices[sti];
                        if (tidx >= 1 && tidx <= comp.numLayers) {
                            var tref = comp.layer(tidx);
                            if (tref && tref !== newLayer && !tref.locked) targetRefs.push(tref);
                        }
                    }
                } else {
                    for (var tmi = 1; tmi <= comp.numLayers; tmi++) {
                        var tmr = comp.layer(tmi);
                        if (tmr !== newLayer && !tmr.locked) targetRefs.push(tmr);
                    }
                }

                // Pre-split live A/V targets when incoming is single-component so only
                // the matching role is overwritten. The original V+A relationship is
                // preserved: both halves share a new linkId so the surviving
                // opposite-role half (and any trimmed pieces of the overwritten half)
                // stay linked. Tracked here so post-overwrite cleanup can fix up
                // linkIds if the overwrite deletes or fragments the overwritten half.
                var preSplitPairs = [];
                var origName = "";
                if (isSingleComponent) {
                    var updatedTargets = [];
                    for (var trr = 0; trr < targetRefs.length; trr++) {
                        var candidate = targetRefs[trr];
                        var canSplit = (candidate instanceof AVLayer) && candidate.hasVideo && candidate.hasAudio
                            && candidate.enabled && candidate.audioEnabled;
                        if (canSplit) {
                            var candLd = parseLinkData(candidate.comment);
                            if (candLd && candLd.rc_link) canSplit = false;
                        }
                        if (canSplit && (movedIn >= candidate.outPoint || movedOut <= candidate.inPoint)) {
                            canSplit = false;
                        }
                        if (!canSplit) { updatedTargets.push(candidate); continue; }

                        // Split A/V into a LINKED V+A pair with a shared linkId so
                        // the original source relationship persists after overwrite.
                        var overlayPair = promoteAVLayerToLinkedPair(candidate);
                        preSplitPairs.push({ linkId: overlayPair.linkId });

                        if (incomingIsAudioOnly) {
                            // Overwriting audio: videoRole survives; audioRole is the overwrite target.
                            updatedTargets.push(overlayPair.audioRole);
                        } else {
                            // Overwriting video: videoRole is overwrite target; audioRole survives.
                            updatedTargets.push(overlayPair.videoRole);
                        }
                    }
                    targetRefs = updatedTargets;
                }

                // 4-case overlap resolution. Sort by current index DESC for safe removals.
                targetRefs.sort(function(a, b) {
                    try { return b.index - a.index; } catch (eSort) { return 0; }
                });
                for (var rr = 0; rr < targetRefs.length; rr++) {
                    var other = targetRefs[rr];
                    var otherIn, otherOut;
                    try {
                        if (other.locked) continue;
                        otherIn = other.inPoint;
                        otherOut = other.outPoint;
                    } catch (eLive) { continue; }
                    if (movedIn >= otherOut || movedOut <= otherIn) continue;

                    if (movedIn <= otherIn && movedOut >= otherOut) {
                        other.remove(); continue;
                    }
                    if (movedIn > otherIn && movedIn < otherOut && movedOut >= otherOut) {
                        other.outPoint = snapToFrame(movedIn, frameRate); continue;
                    }
                    if (movedOut > otherIn && movedOut < otherOut && movedIn <= otherIn) {
                        var savedOut = other.outPoint;
                        other.inPoint = snapToFrame(movedOut, frameRate);
                        other.outPoint = savedOut; continue;
                    }
                    if (movedIn > otherIn && movedOut < otherOut) {
                        var origOut = other.outPoint;
                        other.outPoint = snapToFrame(movedIn, frameRate);
                        var dup = other.duplicate();
                        dup.inPoint = snapToFrame(movedOut, frameRate);
                        dup.outPoint = origOut;
                    }
                }

                // Clean up linkId state for each pre-split pair. The overwrite may
                // have removed, trimmed, or split the overwritten half — normalize
                // so the linkId is only shared by a valid video+audio pair, or
                // cleared entirely when no partner remains.
                for (var cu = 0; cu < preSplitPairs.length; cu++) {
                    var psLid = preSplitPairs[cu].linkId;
                    var members = [];
                    for (var mi = 1; mi <= comp.numLayers; mi++) {
                        var mlayer = comp.layer(mi);
                        try {
                            var mld = parseLinkData(mlayer.comment);
                            if (mld && mld.rc_link === psLid) {
                                members.push({ layer: mlayer, role: mld.rc_role || "" });
                            }
                        } catch (emm) { /* skip */ }
                    }
                    if (members.length < 2) {
                        // 0 or 1 survivor — orphan any remaining holder.
                        for (var m0 = 0; m0 < members.length; m0++) {
                            orphanLinkedLayer(members[m0].layer);
                        }
                    } else if (members.length > 2) {
                        // Overwrite split the audio half into two pieces → 3+ layers
                        // share the linkId. Keep the leftmost piece of the overwritten
                        // role linked to the survivor; orphan the rest.
                        var videoHolders = [];
                        var audioHolders = [];
                        for (var qq = 0; qq < members.length; qq++) {
                            if (members[qq].role === "video") videoHolders.push(members[qq].layer);
                            else if (members[qq].role === "audio") audioHolders.push(members[qq].layer);
                        }
                        var keepRole = incomingIsAudioOnly ? audioHolders : videoHolders;
                        var survRole = incomingIsAudioOnly ? videoHolders : audioHolders;
                        keepRole.sort(function(a, b) { return a.inPoint - b.inPoint; });
                        var keepLayer = keepRole.length > 0 ? keepRole[0] : null;
                        for (var kk = 0; kk < keepRole.length; kk++) {
                            if (keepRole[kk] !== keepLayer) {
                                orphanLinkedLayer(keepRole[kk]);
                            }
                        }
                        // If the surviving opposite-role side became empty (shouldn't
                        // happen here, but guard anyway), orphan the remaining piece too.
                        if (survRole.length === 0 && keepLayer) {
                            orphanLinkedLayer(keepLayer);
                        }
                    }
                }
            }

            // Disable discarded sources (track patching)
            if (disableVideo) {
                newLayer.enabled = false;
            }
            if (disableAudio) {
                newLayer.audioEnabled = false;
            }

            // Audio-only layers should be below all video layers in the stack
            var isAudioOnly = !newLayer.hasVideo || disableVideo;
            if (isAudioOnly && comp.numLayers > 1 && newLayer.index < comp.numLayers) {
                newLayer.moveAfter(comp.layer(comp.numLayers));
            }

            // Reorder the AE layer stack so the new clip's stack position matches
            // its intended video track before packTracks sees it. Otherwise, when
            // the new clip is pinned to a lower video track than existing layers,
            // the AE-index-ordering constraint in packTracks bumps it up to a
            // higher track to avoid a stack-order violation. Use layer refs to
            // resolve current indices — pre-split may have introduced duplicates
            // that shifted the pre-insert index mapping.
            if (!isAudioOnly && targetVideoTrack) {
                var reorderMap = {};
                reorderMap[String(newLayer.index)] = targetVideoTrack;
                for (var prI = 0; prI < preInsertVideoRefs.length; prI++) {
                    var entry = preInsertVideoRefs[prI];
                    try {
                        // Skip layers whose video switch is now off (pre-split audio halves).
                        if (entry.ref instanceof AVLayer && !entry.ref.enabled && entry.ref.audioEnabled) continue;
                        reorderMap[String(entry.ref.index)] = entry.videoTrack;
                    } catch (eRef) { /* ref deleted */ }
                }
                reorderLayersInPlace(comp, JSON.stringify(reorderMap));
            }
        } finally {
            app.endUndoGroup();
        }
        // Fix activeItem: drag-and-drop from the Project Panel leaves activeItem
        // pointing to the dragged item.  viewer.setActive() re-establishes it to
        // the comp displayed in the viewer.  Safe as a one-time post-drop call.
        _lastCompId = comp.id;
        _compPinExpiry = new Date().getTime() + 3000; // pin covers the immediate reload
        try { var v = app.activeViewer; if (v) v.setActive(); } catch (ev) {}

        return JSON.stringify({
            success: true,
            sourceName: newLayer.name,
            inPoint: newLayer.inPoint,
            outPoint: newLayer.outPoint,
            startTime: newLayer.startTime,
        });
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Read the current project panel selection.
 * Returns an array of selected items with their properties.
 */
function getProjectSelection() {
    try {
        var items = app.project.selection;
        var result = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var info = {
                name: item.name,
                id: item.id,
                typeName: item.typeName,
                width: 0,
                height: 0,
                duration: 0,
                frameRate: 0,
                hasVideo: false,
                hasAudio: false,
                filePath: null
            };
            if (item instanceof CompItem) {
                info.width = item.width;
                info.height = item.height;
                info.duration = item.duration;
                info.frameRate = item.frameRate;
                info.hasVideo = true;
                // Check if any layer in the comp has audio enabled
                info.hasAudio = false;
                try {
                    for (var ci = 1; ci <= item.numLayers; ci++) {
                        var cl = item.layer(ci);
                        if (cl.hasAudio && cl.audioEnabled) {
                            info.hasAudio = true;
                            break;
                        }
                    }
                } catch (ae) {
                    // If layer iteration fails, assume audio present to be safe
                    info.hasAudio = true;
                }
            } else if (item instanceof FootageItem) {
                info.width = item.width;
                info.height = item.height;
                info.duration = item.duration;
                info.frameRate = item.frameRate;
                info.hasVideo = item.hasVideo;
                info.hasAudio = item.hasAudio;
                if (item.file) {
                    info.filePath = item.file.fsName;
                }
            }
            result.push(info);
        }
        return JSON.stringify({ success: true, items: result });
    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString(), items: [] });
    }
}


/**
 * Add a footage item to a comp at the comp's current time, respecting any
 * footage viewer in/out marks set on the item. Uses cmd 2005 ("Add Footage
 * to Comp") because marks aren't exposed on any ExtendScript property.
 *
 * Saves and restores the project panel selection so the user's selection
 * isn't mutated. Falls back to comp.layers.add() if cmd 2005 fails (e.g.
 * stills, which have no duration and thus no marks).
 *
 * @param {CompItem} comp - the target comp (must already be active in the viewer for cmd 2005 to land there)
 * @param {FootageItem} item - the source item to add
 * @returns {AVLayer|null} the new layer at index 1 (top of stack) or null
 */
function _addFootageItemWithMarks(comp, item) {
    if (!comp || !item) return null;

    // Stills / no-duration items: marks don't apply, just add normally
    if (!(item.duration > 0)) {
        try { return comp.layers.add(item); } catch (eS) { return null; }
    }

    // Snapshot project panel selection, then narrow to just this item
    var savedSelection = [];
    for (var pi = 1; pi <= app.project.numItems; pi++) {
        var pItem;
        try { pItem = app.project.item(pi); } catch (eP) { continue; }
        try {
            if (pItem.selected) savedSelection.push(pItem);
            pItem.selected = false;
        } catch (eS2) {}
    }
    try { item.selected = true; } catch (eS3) {}

    // Make the comp active so cmd 2005 lands the layer here
    try { comp.openInViewer(); } catch (eOV) {}

    var beforeCount = comp.numLayers;
    try { app.executeCommand(2005); } catch (e2005) {}

    var newLayer = null;
    if (comp.numLayers > beforeCount) {
        // cmd 2005 inserts at index 1 (top of stack)
        try { newLayer = comp.layer(1); } catch (eL) {}
    }

    // Restore selection
    try { item.selected = false; } catch (eR1) {}
    for (var sj = 0; sj < savedSelection.length; sj++) {
        try { savedSelection[sj].selected = true; } catch (eR2) {}
    }

    // Fallback if cmd 2005 didn't add anything (some AE versions or edge cases)
    if (!newLayer) {
        try { newLayer = comp.layers.add(item); } catch (eF) {}
    }
    return newLayer;
}

/**
 * Create a new composition from a footage item in the project.
 * Matches the footage's dimensions, frame rate, and duration.
 * Respects footage viewer in/out marks — comp duration matches the marked
 * range. For stills (duration 0), borrows duration/fps from the most recent
 * comp in the project.
 * @param {number} itemId - project item ID
 */
function createCompFromFootage(itemId) {
    try {
        var item = findProjectItemById(itemId);
        if (!item) return makeResult(false, "Item not found in project");
        if (!(item instanceof FootageItem)) return makeResult(false, "Item is not a footage source");
        if (!item.hasVideo) return makeResult(false, "Item has no video");

        var width = item.width;
        var height = item.height;
        var pixelAspect = item.pixelAspect || 1;
        var duration = item.duration;
        var frameRate = (item.frameDuration > 0) ? (1 / item.frameDuration) : 0;

        // Still images: duration and frameRate are 0 — borrow from most recent comp
        if (duration <= 0 || frameRate <= 0) {
            var fallbackDuration = 30;
            var fallbackFps = 30;
            for (var i = app.project.numItems; i >= 1; i--) {
                var candidate = app.project.item(i);
                if (candidate instanceof CompItem) {
                    fallbackDuration = candidate.duration;
                    fallbackFps = candidate.frameRate;
                    break;
                }
            }
            if (duration <= 0) duration = fallbackDuration;
            if (frameRate <= 0) frameRate = fallbackFps;
        }

        app.beginUndoGroup("Railcut: New Composition from Footage");
        try {
            var comp = app.project.items.addComp(item.name, width, height, pixelAspect, duration, frameRate);
            var layer = _addFootageItemWithMarks(comp, item);
            if (!layer) layer = comp.layers.add(item);

            // If footage marks shortened the layer, re-anchor to time 0 and
            // resize the comp so its duration matches the marked range.
            if (layer && item.duration > 0) {
                var markedDuration = layer.outPoint - layer.inPoint;
                if (markedDuration > 0) {
                    var anchorOffset = -layer.inPoint;
                    layer.startTime += anchorOffset;
                    layer.inPoint = 0;
                    layer.outPoint = snapToFrame(markedDuration, frameRate);
                    if (Math.abs(markedDuration - duration) > 0.001) {
                        comp.duration = layer.outPoint;
                    }
                }
            }

            // For stills: fit to comp if dimensions differ
            if (item.duration <= 0 && layer && (item.width !== width || item.height !== height)) {
                var scaleX = (width / item.width) * 100;
                var scaleY = (height / item.height) * 100;
                var scale = Math.min(scaleX, scaleY);
                layer.transform.scale.setValue([scale, scale]);
            }
        } finally {
            app.endUndoGroup();
        }

        // Pin so getActiveComp() finds the new comp
        _lastCompId = comp.id;
        _compPinExpiry = new Date().getTime() + 5000;

        // Open in viewer so it becomes the active composition
        try { comp.openInViewer(); } catch (ev) {}

        return JSON.stringify({ success: true, compId: comp.id, compName: comp.name });
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Create a new composition from multiple footage files, sequenced end-to-end.
 * Comp dimensions and frame rate come from the first video file.
 * Comp duration matches the total sequenced duration.
 * @param {string} filePathsJson - JSON array of file path strings
 * @returns {string} JSON with success, compId, compName
 */
function createCompFromFootageSequence(filePathsJson) {
    try {
        var filePaths = JSON.parse(filePathsJson);
        if (!filePaths || filePaths.length === 0) return makeResult(false, "No files provided");

        // Import or find all files first
        var items = [];
        for (var fi = 0; fi < filePaths.length; fi++) {
            var targetFile = new File(filePaths[fi]);
            if (!targetFile.exists) continue;
            var item = null;
            var targetFsName = targetFile.fsName;
            for (var pi = 1; pi <= app.project.numItems; pi++) {
                var pItem = app.project.item(pi);
                if (pItem instanceof FootageItem && pItem.file && pItem.file.fsName === targetFsName) {
                    item = pItem;
                    break;
                }
            }
            if (!item) {
                var io = new ImportOptions(targetFile);
                item = app.project.importFile(io);
            }
            if (item) items.push(item);
        }
        if (items.length === 0) return makeResult(false, "No valid files found");

        // Get comp settings from first video item
        var refItem = null;
        for (var ri = 0; ri < items.length; ri++) {
            if (items[ri].hasVideo) { refItem = items[ri]; break; }
        }
        if (!refItem) return makeResult(false, "No video footage found");

        var width = refItem.width;
        var height = refItem.height;
        var pixelAspect = refItem.pixelAspect || 1;
        var frameRate = (refItem.frameDuration > 0) ? (1 / refItem.frameDuration) : 30;

        // Calculate total duration
        var totalDuration = 0;
        for (var di = 0; di < items.length; di++) {
            totalDuration += items[di].duration || 0;
        }
        if (totalDuration <= 0) totalDuration = 30; // fallback for stills

        // Build comp name from first item
        var compName = refItem.name;

        app.beginUndoGroup("Railcut: New Composition from Footage Sequence");
        var comp;
        try {
            comp = app.project.items.addComp(compName, width, height, pixelAspect, totalDuration, frameRate);

            // Add layers sequenced end-to-end. Use cmd 2005 per item so footage
            // viewer marks are respected, then re-anchor each layer to the
            // running sequence position.
            var currentTime = 0;
            for (var li = 0; li < items.length; li++) {
                var layerItem = items[li];
                var newLayer = _addFootageItemWithMarks(comp, layerItem);
                if (!newLayer) {
                    // Fallback for stills/cmd-2005 failures
                    newLayer = comp.layers.add(layerItem);
                }
                // Compute this clip's duration: the marked range when present,
                // otherwise the full source (or comp fallback for stills).
                var layerDuration;
                if (layerItem.duration > 0) {
                    layerDuration = newLayer.outPoint - newLayer.inPoint;
                    if (layerDuration <= 0) layerDuration = layerItem.duration;
                } else {
                    layerDuration = totalDuration;
                }
                // Slide the layer so its inPoint lands at currentTime while
                // preserving the source-time offset cmd 2005 set up.
                var anchorOffset = currentTime - newLayer.inPoint;
                newLayer.startTime += anchorOffset;
                newLayer.inPoint = snapToFrame(currentTime, frameRate);
                newLayer.outPoint = snapToFrame(currentTime + layerDuration, frameRate);
                currentTime = newLayer.outPoint;
            }

            // Marks may have shortened the sequence — resize comp to match.
            if (Math.abs(currentTime - totalDuration) > 0.001 && currentTime > 0) {
                comp.duration = currentTime;
            }
        } finally {
            app.endUndoGroup();
        }

        // Pin so getActiveComp() finds the new comp
        _lastCompId = comp.id;
        _compPinExpiry = new Date().getTime() + 5000;

        try { comp.openInViewer(); } catch (ev) {}

        return JSON.stringify({ success: true, compId: comp.id, compName: comp.name });
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Import a file into the project, or return the existing item if already imported.
 * Compares by fsName to avoid duplicates.
 * @param {string} filePath - OS file path (fsName format)
 * @returns {string} JSON with success, id, name, duration, hasVideo, hasAudio, alreadyImported
 */
function importOrFindFile(filePath) {
    try {
        var targetFile = new File(filePath);
        if (!targetFile.exists) return makeResult(false, "File not found: " + filePath);

        // Check if already imported — compare fsName
        var targetFsName = targetFile.fsName;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof FootageItem && item.file && item.file.fsName === targetFsName) {
                return JSON.stringify({
                    success: true,
                    alreadyImported: true,
                    id: item.id,
                    name: item.name,
                    duration: item.duration,
                    hasVideo: item.hasVideo,
                    hasAudio: item.hasAudio
                });
            }
        }

        // Import new file
        var io = new ImportOptions(targetFile);
        var imported = app.project.importFile(io);

        if (!(imported instanceof FootageItem)) {
            return JSON.stringify({
                success: true,
                alreadyImported: false,
                id: imported.id,
                name: imported.name,
                duration: imported.duration || 0,
                hasVideo: true,
                hasAudio: false
            });
        }

        return JSON.stringify({
            success: true,
            alreadyImported: false,
            id: imported.id,
            name: imported.name,
            duration: imported.duration,
            hasVideo: imported.hasVideo,
            hasAudio: imported.hasAudio
        });
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Import multiple files and sequence them end-to-end starting at a given time.
 * All files are imported (or found if already imported), then added as layers
 * in order, each starting where the previous one ends.
 * Single undo group for the entire operation.
 *
 * @param {string} filePathsJson - JSON array of file path strings
 * @param {number} startTime - Time at which the first clip starts (seconds)
 * @param {number} compId - Comp ID to add layers to
 * @param {boolean} disableVideo - If true, disable video (enabled=false) on all new layers
 * @param {boolean} disableAudio - If true, disable audio on all new layers
 * @returns {string} JSON with success, layers array [{sourceName, inPoint, outPoint, startTime}], count
 */
function importAndSequenceFiles(filePathsJson, startTime, compId, disableVideo, disableAudio, marksJson) {
    try {
        var filePaths = JSON.parse(filePathsJson);
        if (!filePaths || filePaths.length === 0) return makeResult(false, "No files provided");

        // Parse footage viewer marks (keyed by item ID)
        var marks = {};
        if (marksJson) {
            try { marks = JSON.parse(marksJson); } catch (mpe) {}
        }

        // Find target comp
        var comp = null;
        if (compId) {
            for (var ci = 1; ci <= app.project.numItems; ci++) {
                var projItem = app.project.item(ci);
                if (projItem instanceof CompItem && projItem.id === compId) {
                    comp = projItem;
                    break;
                }
            }
        }
        if (!comp) comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");

        var frameRate = comp.frameRate;
        var currentTime = snapToFrame(startTime, frameRate);
        var results = [];

        app.beginUndoGroup("Railcut: Import & Sequence " + filePaths.length + " Clips");
        try {
            for (var fi = 0; fi < filePaths.length; fi++) {
                var filePath = filePaths[fi];
                var targetFile = new File(filePath);
                if (!targetFile.exists) continue;

                // Import or find existing
                var item = null;
                var targetFsName = targetFile.fsName;
                for (var pi = 1; pi <= app.project.numItems; pi++) {
                    var pItem = app.project.item(pi);
                    if (pItem instanceof FootageItem && pItem.file && pItem.file.fsName === targetFsName) {
                        item = pItem;
                        break;
                    }
                }
                if (!item) {
                    var io = new ImportOptions(targetFile);
                    item = app.project.importFile(io);
                }
                if (!item) continue;

                // Check for footage viewer marks on this item
                var itemMarks = marks[String(item.id)];
                var hasMarks = itemMarks && typeof itemMarks.markedIn === "number" && typeof itemMarks.markedOut === "number";

                // Add to comp and position sequentially
                var newLayer = comp.layers.add(item);
                if (!newLayer) continue;

                // Assign an rcId immediately so the panel's first reload
                // can resolve fingerprint pins onto this layer AND so the
                // assignment lives inside this undo group. Without this,
                // useEnsureRcIds would assign rcIds outside the group and
                // each "Comment Change" would consume its own Ctrl+Z entry,
                // burying the actual import many undos deep.
                try {
                    if (!parseRcId(newLayer.comment)) {
                        newLayer.comment = appendRcId(newLayer.comment, generateRcId());
                    }
                } catch (eAssignRcIdMulti) { /* best effort */ }

                if (hasMarks) {
                    // Apply footage viewer marks
                    var mIn = itemMarks.markedIn;
                    var mOut = itemMarks.markedOut;
                    newLayer.startTime = currentTime - mIn;
                    newLayer.inPoint = currentTime;
                    newLayer.outPoint = snapToFrame(currentTime + (mOut - mIn), frameRate);
                } else {
                    var sourceDuration = item.duration || comp.duration;
                    newLayer.startTime = currentTime;
                    newLayer.inPoint = currentTime;
                    newLayer.outPoint = snapToFrame(currentTime + sourceDuration, frameRate);
                }

                if (disableVideo) newLayer.enabled = false;
                if (disableAudio) newLayer.audioEnabled = false;

                // Audio-only layers should be below all video layers in the stack
                var isAudioOnly = !newLayer.hasVideo || disableVideo;
                if (isAudioOnly && comp.numLayers > 1) {
                    newLayer.moveAfter(comp.layer(comp.numLayers));
                }

                results.push({
                    sourceName: newLayer.name,
                    inPoint: newLayer.inPoint,
                    outPoint: newLayer.outPoint,
                    startTime: newLayer.startTime
                });

                // Advance time to end of this clip
                currentTime = newLayer.outPoint;
            }
        } finally {
            app.endUndoGroup();
        }

        // Restore viewer focus
        try { var v = app.activeViewer; if (v) v.setActive(); } catch (ev) {}

        return JSON.stringify({
            success: true,
            count: results.length,
            layers: results
        });
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

// ============================================
// XMP Persistence — Project-Embedded Track State
// ============================================

var RC_XMP_NS = "http://railcut.com/xmp/1.0/";
var RC_XMP_PREFIX = "rc";
var _xmpInitialized = false;

/**
 * Load AdobeXMPScript library and register Railcut namespace.
 * Safe to call multiple times (no-op after first success).
 */
function initXmpLibrary() {
    if (_xmpInitialized) return true;
    try {
        if (typeof ExternalObject !== "undefined") {
            if (ExternalObject.AdobeXMPScript === undefined) {
                ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
            }
        }
        XMPMeta.registerNamespace(RC_XMP_NS, RC_XMP_PREFIX);
        _xmpInitialized = true;
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Read Railcut XMP track data from the current project.
 * Returns JSON string of the full RailcutXmpData structure, or "null".
 * @returns {string}
 */
function readRailcutXmp() {
    try {
        var proj = app.project;
        if (!proj) return "null";
        if (!initXmpLibrary()) return "null";

        var raw = proj.xmpPacket;
        if (!raw || raw.length === 0) return "null";

        var xmp = new XMPMeta(raw);
        var prop = xmp.getProperty(RC_XMP_NS, "trackData");
        if (!prop) return "null";

        // Validate it's parseable JSON before returning
        var str = String(prop);
        JSON.parse(str); // throws if invalid
        return str;
    } catch (e) {
        return "null";
    }
}

/**
 * Write Railcut XMP track data to the current project.
 * @param {string} jsonStr - JSON string of RailcutXmpData
 * @returns {string} JSON result
 */
function writeRailcutXmp(jsonStr) {
    try {
        var proj = app.project;
        if (!proj) return makeResult(false, "No project");
        if (!initXmpLibrary()) return makeResult(false, "XMP library not available");

        var raw = proj.xmpPacket || "";
        var xmp;
        if (raw.length > 0) {
            xmp = new XMPMeta(raw);
        } else {
            xmp = new XMPMeta();
        }

        XMPMeta.registerNamespace(RC_XMP_NS, RC_XMP_PREFIX);
        xmp.setProperty(RC_XMP_NS, "trackData", jsonStr);

        // Wrap the proj.xmpPacket assignment in a named undo group so the
        // resulting AE entry shows "Railcut: Save Track Layout" instead of
        // a generic Comment-Change-flavoured one. Combined with the
        // suppressXmpWriteRef guard in Timeline.tsx, this means any XMP
        // entry the user sees in undo history is labelled and intentional.
        app.beginUndoGroup("Railcut: Save Track Layout");
        try {
            proj.xmpPacket = xmp.serialize();
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Get comp data + XMP track state in a single call (avoids two evalScript round-trips).
 * Returns JSON: {"comp": <CompData|null>, "xmp": <RailcutXmpData|null>}
 * @returns {string}
 */
function getCompDataWithXmp() {
    try {
        var compDataStr = getCompData();
        var xmpStr = readRailcutXmp();
        return '{"comp":' + compDataStr + ',"xmp":' + xmpStr + '}';
    } catch (e) {
        return '{"comp":null,"xmp":null}';
    }
}

// ============================================
// Link Metadata (J/L Cuts)
// ============================================

/**
 * Set Railcut link metadata on a layer's comment field.
 * @param {number} layerIndex - 1-based layer index
 * @param {string} linkId - UUID linking video and audio layers
 * @param {string} role - "video" or "audio"
 * @returns {string} JSON result
 */
function setLayerLinkComment(layerIndex, linkId, role) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);

        app.beginUndoGroup("Railcut: Set Link");
        try {
            var existingRcTag = parseRcId(check.layer.comment);
            var existingGroup = parseLayerGroup(check.layer.comment);
            var meta = { rc_link: linkId, rc_role: role };
            if (existingGroup) meta.rc_group = existingGroup;
            var newComment = JSON.stringify(meta);
            if (existingRcTag) {
                newComment = newComment + "\n[RC:" + existingRcTag + "]";
            }
            check.layer.comment = newComment;
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e2) {
        return makeResult(false, e2.toString());
    }
}

/**
 * Clear Railcut link metadata from a layer's comment field.
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON result
 */
function clearLayerLinkComment(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);

        app.beginUndoGroup("Railcut: Clear Link");
        try {
            // Preserve [RC:] tag and rc_group, only clear link JSON
            var existingRcTag = parseRcId(check.layer.comment);
            var existingGroup = parseLayerGroup(check.layer.comment);
            var meta = existingGroup ? JSON.stringify({ rc_group: existingGroup }) : "";
            var combined = meta;
            if (existingRcTag) combined += (combined ? "\n" : "") + "[RC:" + existingRcTag + "]";
            check.layer.comment = combined;
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e3) {
        return makeResult(false, e3.toString());
    }
}

/**
 * Set link metadata on two layers in a single undo group.
 * @param {number} videoLayerIndex - 1-based index of the video layer
 * @param {number} audioLayerIndex - 1-based index of the audio layer
 * @param {string} linkId - UUID shared by both layers
 * @returns {string} JSON result
 */
function linkLayerPair(videoLayerIndex, audioLayerIndex, linkId) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var checkV = getLayerChecked(comp, videoLayerIndex, true);
        if (checkV.error) return makeResult(false, checkV.error);
        var checkA = getLayerChecked(comp, audioLayerIndex, true);
        if (checkA.error) return makeResult(false, checkA.error);

        app.beginUndoGroup("Railcut: Link Layers");
        try {
            var rcTagV = parseRcId(checkV.layer.comment);
            var rcTagA = parseRcId(checkA.layer.comment);
            var groupV = parseLayerGroup(checkV.layer.comment);
            var groupA = parseLayerGroup(checkA.layer.comment);
            var metaV = { rc_link: linkId, rc_role: "video" };
            if (groupV) metaV.rc_group = groupV;
            var metaA = { rc_link: linkId, rc_role: "audio" };
            if (groupA) metaA.rc_group = groupA;
            var commentV = JSON.stringify(metaV);
            var commentA = JSON.stringify(metaA);
            if (rcTagV) commentV = commentV + "\n[RC:" + rcTagV + "]";
            if (rcTagA) commentA = commentA + "\n[RC:" + rcTagA + "]";
            checkV.layer.comment = commentV;
            checkA.layer.comment = commentA;
            // Set AE layer flags for linked pair behavior
            if (checkV.layer instanceof AVLayer && checkV.layer.hasAudio) {
                checkV.layer.audioEnabled = false;
            }
            checkA.layer.enabled = false;
            // Add [V]/[A] name suffixes
            checkV.layer.name = addRoleSuffix(removeRoleSuffix(checkV.layer.name), "video");
            checkA.layer.name = addRoleSuffix(removeRoleSuffix(checkA.layer.name), "audio");
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e4) {
        return makeResult(false, e4.toString());
    }
}

/**
 * Split an A/V layer into linked video-only and audio-only layers for J/L cuts.
 * Called after a move/trim has already been committed on one component.
 * Duplicates the layer, assigns roles, and restores the unmoved component
 * to its original timing.
 * @param {number} layerIndex - 1-based index of the layer (already at new position)
 * @param {string} movedComponent - 'video' or 'audio' — which was moved
 * @param {number} origStartTime - original startTime before the move
 * @param {number} origInPoint - original inPoint before the move
 * @param {number} origOutPoint - original outPoint before the move
 * @param {string} linkId - UUID for the linked pair
 * @param {string} [rcId] - Optional rcId of the moved layer; preferred over
 *   layerIndex because indices can shift mid-operation when overwrite
 *   resolution duplicates a target clip (Case 4) above the moved layer.
 * @returns {string} JSON result with { success, videoIndex, audioIndex }
 */
/**
 * Inner J/L split body: duplicate `layer` into the opposite role at original
 * timing, leaving `layer` as the moved component. Caller manages the undo
 * group. Returns the new duplicate's rcId so callers can pin its track.
 */
function _performJLSplit(layer, movedComponent, origStartTime, origInPoint, origOutPoint, linkId) {
    var duplicate = layer.duplicate();
    duplicate.moveAfter(layer);
    var origRcTag = parseRcId(layer.comment);
    var origGroup = parseLayerGroup(layer.comment);
    var dupRcId = generateRcId();

    var buildMeta = function(role) {
        var m = { rc_link: linkId, rc_role: role };
        if (origGroup) m.rc_group = origGroup;
        return JSON.stringify(m);
    };

    if (movedComponent === "video") {
        layer.audioEnabled = false;
        layer.name = addRoleSuffix(layer.name, "video");
        var vcmt = buildMeta("video");
        if (origRcTag) vcmt = vcmt + "\n[RC:" + origRcTag + "]";
        layer.comment = vcmt;
        duplicate.enabled = false;
        duplicate.name = addRoleSuffix(duplicate.name, "audio");
        duplicate.startTime = origStartTime;
        duplicate.inPoint = origInPoint;
        duplicate.outPoint = origOutPoint;
        var acmt = buildMeta("audio");
        acmt = acmt + "\n[RC:" + dupRcId + "]";
        duplicate.comment = acmt;
    } else {
        layer.enabled = false;
        layer.name = addRoleSuffix(layer.name, "audio");
        var acmt2 = buildMeta("audio");
        if (origRcTag) acmt2 = acmt2 + "\n[RC:" + origRcTag + "]";
        layer.comment = acmt2;
        duplicate.audioEnabled = false;
        duplicate.name = addRoleSuffix(duplicate.name, "video");
        duplicate.startTime = origStartTime;
        duplicate.inPoint = origInPoint;
        duplicate.outPoint = origOutPoint;
        var vcmt2 = buildMeta("video");
        vcmt2 = vcmt2 + "\n[RC:" + dupRcId + "]";
        duplicate.comment = vcmt2;
        duplicate.moveBefore(layer);
    }

    return { duplicate: duplicate, dupRcId: dupRcId };
}

function splitLayerForJLCut(layerIndex, movedComponent, origStartTime, origInPoint, origOutPoint, linkId, rcId) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var layer;
        if (rcId) {
            layer = findLayerByRcId(comp, rcId);
            if (!layer) return makeResult(false, "Layer not found for rcId " + rcId);
        } else {
            var check = getLayerChecked(comp, layerIndex);
            if (check.error) return makeResult(false, check.error);
            layer = check.layer;
        }

        app.beginUndoGroup("Railcut: J/L Cut");
        try {
            _performJLSplit(layer, movedComponent, origStartTime, origInPoint, origOutPoint, linkId);
        } finally {
            app.endUndoGroup();
        }

        // Return the final indices (may have shifted due to duplicate/reorder)
        var videoIdx = 0;
        var audioIdx = 0;
        var videoRcIdRet = null;
        var audioRcIdRet = null;
        for (var fi = 1; fi <= comp.numLayers; fi++) {
            try {
                var fc = comp.layer(fi).comment;
                if (fc) {
                    var fobj = parseLinkData(fc);
                    if (fobj && fobj.rc_link === linkId) {
                        var fRcId = parseRcId(fc) || null;
                        if (fobj.rc_role === "video") { videoIdx = fi; videoRcIdRet = fRcId; }
                        if (fobj.rc_role === "audio") { audioIdx = fi; audioRcIdRet = fRcId; }
                    }
                }
            } catch (ep) {}
        }

        return JSON.stringify({
            success: true,
            videoIndex: videoIdx,
            audioIndex: audioIdx,
            videoRcId: videoRcIdRet,
            audioRcId: audioRcIdRet
        });
    } catch (e6) {
        return makeResult(false, e6.toString());
    }
}

/**
 * Move + J/L cut split in one undo group. Used for Alt+drag (and partial-lock
 * implicit Alt) move on an unsplit A/V clip — the unmoved component is split
 * off into a linked-pair partner that stays at the original timing, and the
 * dragged component moves to the new position with overwrite. Single Ctrl+Z
 * reverts the whole thing.
 *
 * @param {number} layerIndex - 1-based layer index of the A/V clip
 * @param {string} movedComponent - 'video' or 'audio' — which side moves
 * @param {number} timeOffset - signed seconds to move the dragged component
 * @param {string} skipIndicesJson - JSON array of layer indices to skip during overlap resolution
 * @param {string} trackAssignmentsJson - optional JSON object for layer-stack reorder
 * @param {string} movedTracksJson - optional JSON for moved-layer's V/A track hint
 * @param {string} otherTracksJson - optional JSON map of other layers' V/A tracks
 * @param {string} linkId - link id to share between the two halves
 */
function moveLayerWithOverwriteAndJLSplit(
    layerIndex, movedComponent, timeOffset,
    skipIndicesJson, trackAssignmentsJson, movedTracksJson, otherTracksJson,
    linkId
) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        // Capture pre-move timing for the unmoved-partner duplicate.
        var origStartTime = layer.startTime;
        var origInPoint = layer.inPoint;
        var origOutPoint = layer.outPoint;

        var skipIndices = skipIndicesJson ? JSON.parse(skipIndicesJson) : [];
        var skipRefs = [];
        for (var sii = 0; sii < skipIndices.length; sii++) {
            try { skipRefs.push(comp.layer(skipIndices[sii])); } catch (eSkip) {}
        }

        var moveResult;
        var splitResult;

        app.beginUndoGroup("Railcut: J/L Cut Move");
        try {
            // Step 1: Move with overwrite.
            moveResult = _performMoveWithOverwrite(
                comp, layer, timeOffset, skipIndices, skipRefs,
                trackAssignmentsJson, movedTracksJson, otherTracksJson
            );
            // Step 2: Split into linked pair (`layer` is now the moved component;
            // duplicate becomes the unmoved opposite role at original timing).
            splitResult = _performJLSplit(
                layer, movedComponent,
                origStartTime, origInPoint, origOutPoint, linkId
            );
        } finally {
            app.endUndoGroup();
        }

        // Re-scan for final indices/rcIds (same pattern as splitLayerForJLCut).
        var videoIdx = 0;
        var audioIdx = 0;
        var videoRcIdRet = null;
        var audioRcIdRet = null;
        for (var fi = 1; fi <= comp.numLayers; fi++) {
            try {
                var fc = comp.layer(fi).comment;
                if (fc) {
                    var fobj = parseLinkData(fc);
                    if (fobj && fobj.rc_link === linkId) {
                        var fRcId = parseRcId(fc) || null;
                        if (fobj.rc_role === "video") { videoIdx = fi; videoRcIdRet = fRcId; }
                        if (fobj.rc_role === "audio") { audioIdx = fi; audioRcIdRet = fRcId; }
                    }
                }
            } catch (epm) {}
        }

        var resultObj = {
            success: true,
            videoIndex: videoIdx,
            audioIndex: audioIdx,
            videoRcId: videoRcIdRet,
            audioRcId: audioRcIdRet
        };
        if (moveResult.indexMap) resultObj.indexMap = moveResult.indexMap;
        if (moveResult.splitLayers && moveResult.splitLayers.length > 0) {
            resultObj.splitLayers = moveResult.splitLayers;
        }
        return JSON.stringify(resultObj);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Slip + J/L cut split in one undo group. Used for Alt+drag (and partial-lock
 * implicit Alt) slip on an unsplit A/V clip — the unmoved component is split
 * off into a linked-pair partner that stays at the original timing/source,
 * and the slipped component shifts source content via startTime.
 *
 * @param {number} layerIndex - 1-based layer index of the A/V clip
 * @param {string} slippedComponent - 'video' or 'audio' — which side slips
 * @param {number} deltaOffset - signed seconds for the startTime shift
 * @param {string} linkId - link id to share between the two halves
 */
function slipLayerWithJLSplit(layerIndex, slippedComponent, deltaOffset, linkId) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        var origStartTime = layer.startTime;
        var origInPoint = layer.inPoint;
        var origOutPoint = layer.outPoint;

        app.beginUndoGroup("Railcut: J/L Cut Slip");
        try {
            // Slip: shift startTime, then restore in/out so the timeline range is unchanged.
            var frameRate = comp.frameRate;
            var snappedDelta = snapToFrame(deltaOffset, frameRate);
            var savedIn = layer.inPoint;
            var savedOut = layer.outPoint;
            layer.startTime = layer.startTime + snappedDelta;
            layer.inPoint = savedIn;
            layer.outPoint = savedOut;

            // Split into linked pair: layer keeps the slipped state as the
            // slipped component; duplicate is restored to original timing as
            // the opposite role.
            _performJLSplit(layer, slippedComponent, origStartTime, origInPoint, origOutPoint, linkId);
        } finally {
            app.endUndoGroup();
        }

        // Resolve final indices/rcIds for both halves so the TS side can pin the dup.
        var videoIdx = 0;
        var audioIdx = 0;
        var videoRcIdRet = null;
        var audioRcIdRet = null;
        for (var fi = 1; fi <= comp.numLayers; fi++) {
            try {
                var fc = comp.layer(fi).comment;
                if (fc) {
                    var fobj = parseLinkData(fc);
                    if (fobj && fobj.rc_link === linkId) {
                        var fRcId = parseRcId(fc) || null;
                        if (fobj.rc_role === "video") { videoIdx = fi; videoRcIdRet = fRcId; }
                        if (fobj.rc_role === "audio") { audioIdx = fi; audioRcIdRet = fRcId; }
                    }
                }
            } catch (epm) {}
        }

        return JSON.stringify({
            success: true,
            videoIndex: videoIdx,
            audioIndex: audioIdx,
            videoRcId: videoRcIdRet,
            audioRcId: audioRcIdRet
        });
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Rate stretch + J/L cut split in one undo group. Used for partial-lock
 * implicit-Alt rate stretch on an unsplit A/V — the unmoved component is
 * split off (at original timing AND original stretch) and the dragged
 * component gets the new stretch.
 */
function rateStretchWithJLSplit(layerIndex, stretchedComponent, newDuration, anchorEdge, linkId) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        var origStartTime = layer.startTime;
        var origInPoint = layer.inPoint;
        var origOutPoint = layer.outPoint;

        var frameRate = comp.frameRate;
        var originalDuration = origOutPoint - origInPoint;
        var stretchRatio = newDuration / originalDuration;

        app.beginUndoGroup("Railcut: J/L Cut Rate Stretch");
        try {
            // Split FIRST so the duplicate inherits the unstretched layer.
            // _performJLSplit clones and resets dup's startTime/in/out to the
            // captured originals; layer's stretch is unchanged so the dup
            // also keeps the original stretch.
            _performJLSplit(layer, stretchedComponent, origStartTime, origInPoint, origOutPoint, linkId);
            // Now apply the stretch to the original layer (which became the
            // stretchedComponent role).
            applyRateStretchToLayer(layer, stretchRatio, anchorEdge, frameRate);
        } finally {
            app.endUndoGroup();
        }

        return _resolveJLCutPair(comp, linkId);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Slide + J/L cut split in one undo group. Used for Alt+drag (and partial-lock
 * implicit Alt) slide on an unsplit A/V clip.
 */
function slideLayerWithJLSplit(layerIndex, slidComponent, delta, beforeClipIndex, afterClipIndex, linkId, lockedIndicesJson, autoSplitMapJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        var origStartTime = layer.startTime;
        var origInPoint = layer.inPoint;
        var origOutPoint = layer.outPoint;
        var slideSkipMap = null;
        if (lockedIndicesJson) {
            var slideArr = JSON.parse(lockedIndicesJson);
            slideSkipMap = {};
            for (var sli = 0; sli < slideArr.length; sli++) slideSkipMap[slideArr[sli]] = true;
        }
        var slideSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: J/L Cut Slide");
        try {
            // Slide the layer (unlinked — partner is the duplicate we're about
            // to create at original position). Pass skipMap so adjacent clips'
            // locked partners stay anchored. Pass splitMap to auto-split
            // partial-lock A/V adjacent clips.
            _performSlide(comp, layer, delta, beforeClipIndex, afterClipIndex, true, slideSkipMap, slideSplitMap);
            // Split into linked pair: layer becomes the slid component;
            // duplicate is restored to original timing as the opposite role.
            _performJLSplit(layer, slidComponent, origStartTime, origInPoint, origOutPoint, linkId);
        } finally {
            app.endUndoGroup();
        }

        var videoIdx = 0;
        var audioIdx = 0;
        var videoRcIdRet = null;
        var audioRcIdRet = null;
        for (var fi = 1; fi <= comp.numLayers; fi++) {
            try {
                var fc = comp.layer(fi).comment;
                if (fc) {
                    var fobj = parseLinkData(fc);
                    if (fobj && fobj.rc_link === linkId) {
                        var fRcId = parseRcId(fc) || null;
                        if (fobj.rc_role === "video") { videoIdx = fi; videoRcIdRet = fRcId; }
                        if (fobj.rc_role === "audio") { audioIdx = fi; audioRcIdRet = fRcId; }
                    }
                }
            } catch (epm) {}
        }

        return JSON.stringify({
            success: true,
            videoIndex: videoIdx,
            audioIndex: audioIdx,
            videoRcId: videoRcIdRet,
            audioRcId: audioRcIdRet
        });
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Ripple-in + J/L cut split in one undo group. The rippled component takes
 * the new in point (with downstream shift); the unrippled component is split
 * off as the linked-pair partner at the original timing.
 */
function rippleEditInWithJLSplit(layerIndex, rippledComponent, newInPoint, delta, linkId, skipIndicesJson, autoSplitMapJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        var origStartTime = layer.startTime;
        var origInPoint = layer.inPoint;
        var origOutPoint = layer.outPoint;
        var skipIndices = skipIndicesJson ? JSON.parse(skipIndicesJson) : null;
        var autoSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: J/L Cut Ripple In");
        try {
            rippleEditInCore(comp, layerIndex, newInPoint, delta, skipIndices, autoSplitMap);
            _performJLSplit(layer, rippledComponent, origStartTime, origInPoint, origOutPoint, linkId);
        } finally {
            app.endUndoGroup();
        }

        return _resolveJLCutPair(comp, linkId);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Ripple-out + J/L cut split in one undo group.
 */
function rippleEditOutWithJLSplit(layerIndex, rippledComponent, newOutPoint, delta, linkId, skipIndicesJson, autoSplitMapJson) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        var origStartTime = layer.startTime;
        var origInPoint = layer.inPoint;
        var origOutPoint = layer.outPoint;
        var skipIndices = skipIndicesJson ? JSON.parse(skipIndicesJson) : null;
        var autoSplitMap = autoSplitMapJson ? JSON.parse(autoSplitMapJson) : null;

        app.beginUndoGroup("Railcut: J/L Cut Ripple Out");
        try {
            rippleEditOutCore(comp, layerIndex, newOutPoint, delta, skipIndices, autoSplitMap);
            _performJLSplit(layer, rippledComponent, origStartTime, origInPoint, origOutPoint, linkId);
        } finally {
            app.endUndoGroup();
        }

        return _resolveJLCutPair(comp, linkId);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/** Resolve final (videoIndex, audioIndex, videoRcId, audioRcId) for a J/L pair by linkId. */
function _resolveJLCutPair(comp, linkId) {
    var videoIdx = 0;
    var audioIdx = 0;
    var videoRcIdRet = null;
    var audioRcIdRet = null;
    for (var fi = 1; fi <= comp.numLayers; fi++) {
        try {
            var fc = comp.layer(fi).comment;
            if (fc) {
                var fobj = parseLinkData(fc);
                if (fobj && fobj.rc_link === linkId) {
                    var fRcId = parseRcId(fc) || null;
                    if (fobj.rc_role === "video") { videoIdx = fi; videoRcIdRet = fRcId; }
                    if (fobj.rc_role === "audio") { audioIdx = fi; audioRcIdRet = fRcId; }
                }
            }
        } catch (epm) {}
    }
    return JSON.stringify({
        success: true,
        videoIndex: videoIdx,
        audioIndex: audioIdx,
        videoRcId: videoRcIdRet,
        audioRcId: audioRcIdRet
    });
}

/**
 * Split an A/V layer into a linked pair AND trim only the specified component,
 * all in one undo group. Used for Alt+trim J/L cut creation.
 * @param {number} layerIndex - 1-based layer index
 * @param {string} trimComponent - 'video' or 'audio' — which portion to trim
 * @param {string} trimEdge - 'in' or 'out' — which edge
 * @param {number} newTime - New in or out point value
 * @returns {string} JSON result
 */
function trimWithJLSplit(layerIndex, trimComponent, trimEdge, newTime, preGeneratedDupRcId) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;
        var frameRate = comp.frameRate;
        var snappedNewTime = snapToFrame(newTime, frameRate);

        // Store original timing before any changes
        var origStartTime = layer.startTime;
        var origInPoint = layer.inPoint;
        var origOutPoint = layer.outPoint;

        app.beginUndoGroup("Railcut: J/L Cut Trim");
        try {
            // Promote into a linked pair, with the original taking the trimmed
            // role so its [RC:] tag (and therefore its track pin) stays with
            // the component the user is actively editing.
            var trimPair = promoteAVLayerToLinkedPair(layer, {
                originalRole: trimComponent,
                dupRcId: preGeneratedDupRcId,
            });
            var trimmedLayer = trimComponent === "video" ? trimPair.videoRole : trimPair.audioRole;
            var untrimmedDup = trimComponent === "video" ? trimPair.audioRole : trimPair.videoRole;

            // Apply trim to the original (defensive: setting inPoint can corrupt outPoint in AE)
            if (trimEdge === "in") {
                var savedOut = trimmedLayer.outPoint;
                trimmedLayer.inPoint = snappedNewTime;
                if (Math.abs(trimmedLayer.outPoint - savedOut) > 0.001) trimmedLayer.outPoint = savedOut;
            } else {
                trimmedLayer.outPoint = snappedNewTime;
            }

            // Ensure the untrimmed duplicate keeps the original pre-trim timing.
            // AE's duplicate() captures it at duplicate time, but resetting here
            // guards against any incidental mutation during the promote step.
            untrimmedDup.startTime = origStartTime;
            untrimmedDup.inPoint = origInPoint;
            untrimmedDup.outPoint = origOutPoint;

            // Bump comp comment for fingerprint detection
            var cmnt = comp.comment || "";
            var vMatch = cmnt.match(/\[RCV:(\d+)\]/);
            var ver = vMatch ? parseInt(vMatch[1], 10) + 1 : 1;
            comp.comment = cmnt.replace(/\[RCV:\d+\]/, "") + "[RCV:" + ver + "]";
        } finally {
            app.endUndoGroup();
        }

        return makeResult(true);
    } catch (e) {
        return makeResult(false, e.toString());
    }
}

/**
 * Clear link metadata from two layers in a single undo group.
 * @param {number} layerIndex1 - 1-based index of first layer
 * @param {number} layerIndex2 - 1-based index of second layer
 * @returns {string} JSON result
 */
/**
 * After blading a linked pair, 4 layers share the same linkId.
 * Re-link them into 2 pairs: left video↔left audio, right video↔right audio.
 * Identifies pairs by timing: layers whose inPoint matches the razor time
 * are the "right" pair; others are the "left" pair.
 * Must be called inside an existing undo group.
 */
function relinkSplitPairs(comp, oldLinkId, razorTime) {
    var halfFrame = 0.5 / comp.frameRate;
    var leftEntries = [];
    var rightEntries = [];

    // Classify each linked layer by its position relative to razorTime using
    // temporal bounds. This correctly handles J/L offset-region splits where
    // one partner isn't split (it lives entirely on one side of the razor)
    // and the other partner's halves should only stay linked to the partner
    // they still overlap in time.
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        try {
            var ld = parseLinkData(layer.comment);
            if (!ld || ld.rc_link !== oldLinkId) continue;
            var entry = { layer: layer, role: ld.rc_role || "" };
            if (layer.outPoint <= razorTime + halfFrame) {
                leftEntries.push(entry);
            } else if (layer.inPoint >= razorTime - halfFrame) {
                rightEntries.push(entry);
            }
            // Layers spanning razorTime shouldn't occur after a valid split.
        } catch (e) { /* skip */ }
    }

    function hasPair(group) {
        var v = false, a = false;
        for (var k = 0; k < group.length; k++) {
            if (group[k].role === "video") v = true;
            else if (group[k].role === "audio") a = true;
        }
        return v && a;
    }

    function setLinkId(layer, role, newLinkId) {
        var rcTag = parseRcId(layer.comment);
        var rcGroup = parseLayerGroup(layer.comment);
        var meta = { rc_link: newLinkId, rc_role: role };
        if (rcGroup) meta.rc_group = rcGroup;
        var newComment = JSON.stringify(meta);
        if (rcTag) newComment += "\n[RC:" + rcTag + "]";
        layer.comment = newComment;
    }

    // Left side keeps oldLinkId if it has a valid video+audio pair; otherwise orphan.
    if (!hasPair(leftEntries)) {
        for (var l = 0; l < leftEntries.length; l++) {
            orphanLinkedLayer(leftEntries[l].layer);
        }
    }

    // Right side gets a new linkId if it has a valid pair; otherwise orphan.
    if (hasPair(rightEntries)) {
        var newLinkId = "rc_" + (new Date()).getTime() + "_" + Math.random().toString(36).substr(2, 6);
        for (var r = 0; r < rightEntries.length; r++) {
            setLinkId(rightEntries[r].layer, rightEntries[r].role, newLinkId);
        }
    } else {
        for (var r2 = 0; r2 < rightEntries.length; r2++) {
            orphanLinkedLayer(rightEntries[r2].layer);
        }
    }
}

function unlinkLayerPair(layerIndex1, layerIndex2) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check1 = getLayerChecked(comp, layerIndex1, true);
        if (check1.error) return makeResult(false, check1.error);
        var check2 = getLayerChecked(comp, layerIndex2, true);
        if (check2.error) return makeResult(false, check2.error);

        app.beginUndoGroup("Railcut: Unlink Layers");
        try {
            // Preserve rc_role (without rc_link) so each half stays
            // role-restricted in the panel. Without this, hasVideo/hasAudio
            // fall back to the intrinsic source on both halves and a dimmed
            // phantom shows up on the opposite section.
            unlinkButKeepRole(check1.layer);
            unlinkButKeepRole(check2.layer);
        } finally {
            app.endUndoGroup();
        }
        return makeResult(true);
    } catch (e5) {
        return makeResult(false, e5.toString());
    }
}

/**
 * Split a regular A/V layer into independent video-only and audio-only layers (no link).
 * @param {number} layerIndex - 1-based layer index
 * @returns {string} JSON result
 */
function splitAVLayerUnlinked(layerIndex) {
    try {
        var comp = getActiveComp();
        if (!comp) return makeResult(false, "No active composition");
        var check = getLayerChecked(comp, layerIndex, true);
        if (check.error) return makeResult(false, check.error);
        var layer = check.layer;

        if (!(layer instanceof AVLayer) || !layer.hasVideo || !layer.hasAudio) {
            return makeResult(false, "Layer is not an A/V layer");
        }

        // Declare in outer scope so the return below can read it after the
        // try/finally completes.
        var newRcId = "";

        app.beginUndoGroup("Railcut: Unlink Audio/Video");
        try {
            var rcTag = parseRcId(layer.comment);
            var srcGroup = parseLayerGroup(layer.comment);

            // Duplicate for audio portion
            var audioDup = layer.duplicate();
            audioDup.moveAfter(layer);

            // Original becomes video-only. Tag rc_role='video' (no rc_link)
            // so the panel excludes it from audio packing — otherwise the
            // muted audio side renders as a dimmed phantom on the next
            // available audio track. Preserve rc_group so a grouped clip's
            // halves stay in the group.
            layer.audioEnabled = false;
            var vMeta = { rc_role: "video" };
            if (srcGroup) vMeta.rc_group = srcGroup;
            var vCmt = JSON.stringify(vMeta);
            if (rcTag) vCmt += "\n[RC:" + rcTag + "]";
            layer.comment = vCmt;

            // Duplicate becomes audio-only with matching role metadata so
            // it's excluded from video packing.
            audioDup.enabled = false;
            newRcId = generateRcId();
            var aMeta = { rc_role: "audio" };
            if (srcGroup) aMeta.rc_group = srcGroup;
            audioDup.comment = JSON.stringify(aMeta) + "\n[RC:" + newRcId + "]";
        } finally {
            app.endUndoGroup();
        }
        // Return the new audio-half rcId so the caller can pin it to the
        // source's audio track. Without this, the new audio layer auto-packs
        // to A1 on reload.
        return JSON.stringify({ success: true, audioRcId: newRcId });
    } catch (e) {
        return makeResult(false, e.toString());
    }
}
