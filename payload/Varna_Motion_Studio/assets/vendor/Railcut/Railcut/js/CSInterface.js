/**
 * CSInterface.js v12.0.0
 *
 * Adobe CEP (Common Extensibility Platform) Interface Library
 *
 * This is a minimal implementation of Adobe's CSInterface for CEP extensions.
 * For the full official version, download from:
 * https://github.com/Adobe-CEP/CEP-Resources/tree/master/CEP_12.x
 *
 * Copyright (c) Adobe Systems Incorporated. All rights reserved.
 */

/**
 * CSInterface class for CEP extensions
 * @constructor
 */
function CSInterface() {
    // Access the native CEP bridge
    this.hostEnvironment = window.__adobe_cep__ ? JSON.parse(window.__adobe_cep__.getHostEnvironment()) : null;
}

/**
 * Stores the host environment data
 * @type {Object}
 */
CSInterface.prototype.hostEnvironment = null;

/**
 * Retrieves information about the host environment
 * @returns {Object} Host environment information
 */
CSInterface.prototype.getHostEnvironment = function() {
    if (!this.hostEnvironment) {
        this.hostEnvironment = window.__adobe_cep__
            ? JSON.parse(window.__adobe_cep__.getHostEnvironment())
            : {
                appName: 'Development',
                appVersion: '0.0.0',
                appLocale: 'en_US',
                appUILocale: 'en_US',
                appId: 'DEV',
                isAppOnline: true,
                appSkinInfo: null
            };
    }
    return this.hostEnvironment;
};

/**
 * Evaluates a script in the host application's ExtendScript engine
 * @param {string} script - The script to evaluate
 * @param {function} callback - Callback function receiving the result
 */
CSInterface.prototype.evalScript = function(script, callback) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.evalScript(script, callback);
    } else {
        // Development mode - log and return mock data
        console.log('[CSInterface] evalScript (dev mode):', script);
        if (callback) {
            // Simulate async behavior
            setTimeout(function() {
                callback('undefined');
            }, 100);
        }
    }
};

/**
 * Registers an event listener
 * @param {string} type - Event type
 * @param {function} listener - Event listener function
 * @param {Object} obj - Optional object to bind
 */
CSInterface.prototype.addEventListener = function(type, listener, obj) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.addEventListener(type, listener, obj);
    } else {
        // Development fallback
        window.addEventListener(type, listener);
    }
};

/**
 * Removes an event listener
 * @param {string} type - Event type
 * @param {function} listener - Event listener function
 * @param {Object} obj - Optional object to bind
 */
CSInterface.prototype.removeEventListener = function(type, listener, obj) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.removeEventListener(type, listener, obj);
    } else {
        window.removeEventListener(type, listener);
    }
};

/**
 * Dispatches an event
 * @param {CSEvent} event - Event to dispatch
 */
CSInterface.prototype.dispatchEvent = function(event) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.dispatchEvent(event);
    }
};

/**
 * Requests to open another extension
 * @param {string} extensionId - ID of the extension to open
 * @param {string} params - Optional parameters
 */
CSInterface.prototype.requestOpenExtension = function(extensionId, params) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.requestOpenExtension(extensionId, params || '');
    }
};

/**
 * Closes the extension
 */
CSInterface.prototype.closeExtension = function() {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.closeExtension();
    }
};

/**
 * Gets a system path
 * @param {string} pathType - Type of path to retrieve
 * @returns {string} The system path
 */
CSInterface.prototype.getSystemPath = function(pathType) {
    if (window.__adobe_cep__) {
        var path = window.__adobe_cep__.getSystemPath(pathType);
        // CEP returns file:// URIs with URL-encoded characters (e.g. accented
        // chars in Windows usernames). Decode so consumers get clean OS paths.
        if (path && path.indexOf('%') !== -1) {
            try { path = decodeURIComponent(path); } catch (e) { /* keep original */ }
        }
        return path;
    }
    return '';
};

/**
 * Gets the current API version
 * @returns {Object} Version info with major, minor, micro
 */
CSInterface.prototype.getCurrentApiVersion = function() {
    if (window.__adobe_cep__) {
        return JSON.parse(window.__adobe_cep__.getCurrentApiVersion());
    }
    return { major: 12, minor: 0, micro: 0 };
};

/**
 * Sets the panel flyout menu
 * @param {string} menu - XML string defining the menu
 */
CSInterface.prototype.setPanelFlyoutMenu = function(menu) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.setPanelFlyoutMenu(menu);
    }
};

/**
 * Sets a context menu handler
 * @param {string} menu - XML string defining the menu
 * @param {function} callback - Menu item click handler
 */
CSInterface.prototype.setContextMenu = function(menu, callback) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.setContextMenu(menu, callback);
    }
};

/**
 * Sets context menu by JSON
 * @param {string} menuJSON - JSON string defining the menu
 * @param {function} callback - Menu item click handler
 */
CSInterface.prototype.setContextMenuByJSON = function(menuJSON, callback) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.setContextMenuByJSON(menuJSON, callback);
    }
};

/**
 * Updates the context menu
 * @param {string} menu - Updated menu XML
 */
CSInterface.prototype.updateContextMenuItem = function(menuItemID, enabled, checked) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.updateContextMenuItem(menuItemID, enabled, checked);
    }
};

/**
 * Gets scaling factor for high DPI displays
 * @returns {number} Scale factor
 */
CSInterface.prototype.getScaleFactor = function() {
    if (window.__adobe_cep__) {
        return window.__adobe_cep__.getScaleFactor();
    }
    return window.devicePixelRatio || 1;
};

/**
 * Resizes the panel content
 * @param {number} width - New width
 * @param {number} height - New height
 */
CSInterface.prototype.resizeContent = function(width, height) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.resizeContent(width, height);
    }
};

/**
 * Gets the window title
 * @returns {string} Window title
 */
CSInterface.prototype.getWindowTitle = function() {
    if (window.__adobe_cep__) {
        return window.__adobe_cep__.getWindowTitle();
    }
    return document.title;
};

/**
 * Sets the window title
 * @param {string} title - New window title
 */
CSInterface.prototype.setWindowTitle = function(title) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.setWindowTitle(title);
    }
    document.title = title;
};

/**
 * Gets the list of installed extensions
 * @param {Array} extensionIds - Optional array of extension IDs to filter
 * @returns {Array} Array of Extension objects
 */
CSInterface.prototype.getExtensions = function(extensionIds) {
    if (window.__adobe_cep__) {
        var extensions = JSON.parse(window.__adobe_cep__.getExtensions(extensionIds));
        return extensions;
    }
    return [];
};

/**
 * Gets the network preferences
 * @returns {Object} Network preferences
 */
CSInterface.prototype.getNetworkPreferences = function() {
    if (window.__adobe_cep__) {
        return JSON.parse(window.__adobe_cep__.getNetworkPreferences());
    }
    return {};
};

/**
 * Gets OS information
 * @returns {string} OS information string
 */
CSInterface.prototype.getOSInformation = function() {
    if (window.__adobe_cep__) {
        return window.__adobe_cep__.getOSInformation();
    }
    return navigator.platform;
};

/**
 * Opens a URL in the default browser
 * @param {string} url - URL to open
 */
CSInterface.prototype.openURLInDefaultBrowser = function(url) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.openURLInDefaultBrowser(url);
    } else {
        window.open(url, '_blank');
    }
};

/**
 * Gets the extension ID
 * @returns {string} Extension ID
 */
CSInterface.prototype.getExtensionID = function() {
    if (window.__adobe_cep__) {
        return window.__adobe_cep__.getExtensionId();
    }
    return 'com.development.extension';
};

// System path constants
CSInterface.prototype.EXTENSION_ID = 'extensionId';

// System path types
var SystemPath = {
    USER_DATA: 'userData',
    COMMON_FILES: 'commonFiles',
    MY_DOCUMENTS: 'myDocuments',
    APPLICATION: 'application',
    EXTENSION: 'extension',
    HOST_APPLICATION: 'hostApplication'
};

/**
 * CSEvent class for CEP events
 * @constructor
 */
function CSEvent(type, scope, appId, extensionId) {
    this.type = type;
    this.scope = scope;
    this.appId = appId;
    this.extensionId = extensionId;
    this.data = '';
}

/**
 * Registers interest in specific keyboard events.
 * Keys NOT in the list pass through to the host application (e.g., Spacebar for AE playback).
 * @param {string} keyEventsInterest - JSON string specifying which key events to intercept
 */
CSInterface.prototype.registerKeyEventsInterest = function(keyEventsInterest) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.registerKeyEventsInterest(keyEventsInterest);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CSInterface: CSInterface,
        CSEvent: CSEvent,
        SystemPath: SystemPath
    };
}

// Make available globally
window.CSInterface = CSInterface;
window.CSEvent = CSEvent;
window.SystemPath = SystemPath;
