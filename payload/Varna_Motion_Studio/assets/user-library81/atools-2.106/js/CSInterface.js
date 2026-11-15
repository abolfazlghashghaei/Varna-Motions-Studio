/* Minimal CSInterface for evalScript bridge (AmanowTools CEP) */
function CSInterface() {}
CSInterface.prototype._cep = function(){ return (typeof window!=="undefined") ? window.__adobe_cep__ : null; };
CSInterface.prototype.evalScript = function (script, callback) {
    if (callback === null || callback === undefined) callback = function (r) {};
    var cep = this._cep();
    if (cep) { cep.evalScript(script, callback); }
    else { callback("EvalScript error: CEP not available."); }
};
CSInterface.prototype.getHostEnvironment = function () {
    var cep = this._cep();
    try { return JSON.parse(cep.getHostEnvironment()); } catch(e){ return {}; }
};
CSInterface.prototype.getApplicationID = function () {
    var env = this.getHostEnvironment(); return env ? env.appName : "";
};
CSInterface.prototype.openURLInDefaultBrowser = function (url) {
    try { return window.cep.util.openURLInDefaultBrowser(url); } catch(e){}
};
CSInterface.prototype.getSystemPath = function (pathType) {
    var cep = this._cep();
    try { return decodeURI(cep.getSystemPath(pathType)); } catch(e){ return ""; }
};
/* --- needed by the floating card window ---------------------------------
   The same page is registered twice in the manifest: once as the docked
   Panel and once as a Modeless extension. getExtensionID is how the page
   tells which one it is running as, and requestOpenExtension is how the
   panel asks the floating one to appear. */
CSInterface.prototype.getExtensionID = function () {
    var cep = this._cep();
    try { return cep.getExtensionId(); } catch(e){ return ""; }
};
CSInterface.prototype.requestOpenExtension = function (id, params) {
    var cep = this._cep();
    try { cep.requestOpenExtension(id, params || ""); return true; } catch(e){ return false; }
};
CSInterface.prototype.closeExtension = function () {
    var cep = this._cep();
    try { cep.closeExtension(); } catch(e){}
};
CSInterface.prototype.resizeContent = function (w, h) {
    var cep = this._cep();
    try { cep.resizeContent(w, h); } catch(e){}
};
/* --- messages between the two windows -----------------------------------
   A file handoff still decides WHICH card, because it survives the floating
   window not being up yet. This is the fast path for when it already is:
   no polling interval to wait out. */
function CSEvent(type, scope, appId, extensionId) {
    this.type = type;
    this.scope = scope || "APPLICATION";
    this.appId = appId;
    this.extensionId = extensionId;
    this.data = "";
}
CSInterface.prototype.dispatchEvent = function (event) {
    var cep = this._cep();
    try {
        if (typeof event.data === "object") { event.data = JSON.stringify(event.data); }
        cep.dispatchEvent(event);
    } catch(e){}
};
CSInterface.prototype.addEventListener = function (type, listener, obj) {
    var cep = this._cep();
    try { cep.addEventListener(type, listener, obj); } catch(e){}
};
CSInterface.prototype.removeEventListener = function (type, listener, obj) {
    var cep = this._cep();
    try { cep.removeEventListener(type, listener, obj); } catch(e){}
};
