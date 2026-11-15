/* 100 Lower Thirds — preview browser.
   The same page works in a normal web browser (catalog + lightbox) and inside
   After Effects as a CEP panel (click = import into the active composition). */
(function () {
  "use strict";
  var ITEMS = window.LT_ITEMS || [];
  var CEP = !!(window.__adobe_cep__);
  var state = { q: "", family: "", align: "", size: 180 };
  var grid = document.getElementById("grid");
  var extRoot = "";

  function $(id) { return document.getElementById(id); }
  function pad(n) { return ("00" + n).slice(-3); }
  function mediaPath(kind, id) { return "media/" + kind + "/" + id + (kind === "clips" ? ".webm" : ".jpg"); }
  function alignKey(a) { return a === "Center" ? "C" : (a === "Right" ? "R" : "L"); }

  try { var s = parseInt(localStorage.getItem("lt100.size"), 10); if (s >= 120 && s <= 420) { state.size = s; } } catch (e) {}
  document.documentElement.style.setProperty("--card", state.size + "px");

  if (CEP) {
    $("modeLabel").textContent = "Click a design to add it to your comp";
    var p = window.__adobe_cep__.getSystemPath("extension");
    p = decodeURI(p).replace(/^file:\/{2,3}/, "");
    if (/^[A-Za-z]:/.test(p) === false && p.charAt(0) !== "/") { p = "/" + p; }
    extRoot = p.replace(/\\/g, "/");
  } else {
    $("modeLabel").textContent = "Preview Browser";
  }

  // ---------- filters ----------
  var families = [];
  ITEMS.forEach(function (it) { if (families.indexOf(it.family) < 0) { families.push(it.family); } });
  function chip(label, value, count) {
    var b = document.createElement("button");
    b.innerHTML = label + "<span>" + count + "</span>";
    b.dataset.f = value;
    if (value === state.family) { b.className = "on"; }
    b.onclick = function () { state.family = value; render(); syncChips(); };
    return b;
  }
  function syncChips() {
    Array.prototype.forEach.call($("chips").children, function (b) { b.className = (b.dataset.f === state.family) ? "on" : ""; });
  }
  $("chips").appendChild(chip("All", "", ITEMS.length));
  families.forEach(function (f) {
    $("chips").appendChild(chip(f, f, ITEMS.filter(function (i) { return i.family === f; }).length));
  });
  Array.prototype.forEach.call($("alignSeg").children, function (b) {
    b.onclick = function () {
      state.align = b.dataset.a;
      Array.prototype.forEach.call($("alignSeg").children, function (x) { x.className = (x === b) ? "on" : ""; });
      render();
    };
  });
  $("q").addEventListener("input", function () { state.q = this.value.trim().toLowerCase(); render(); });
  function setSize(d) {
    state.size = Math.max(120, Math.min(420, state.size + d));
    document.documentElement.style.setProperty("--card", state.size + "px");
    try { localStorage.setItem("lt100.size", state.size); } catch (e) {}
  }
  $("szDown").onclick = function () { setSize(-40); };
  $("szUp").onclick = function () { setSize(40); };

  function visible() {
    return ITEMS.filter(function (it) {
      if (state.family && it.family !== state.family) { return false; }
      if (state.align && it.align !== state.align) { return false; }
      if (state.q) {
        var q = state.q.replace(/^#/, "");
        if (/^\d+$/.test(q)) { return it.id.indexOf(pad(parseInt(q, 10))) === 0 || String(it.n).indexOf(q) === 0; }
        return (it.family + " " + it.align + " " + it.font).toLowerCase().indexOf(q) >= 0;
      }
      return true;
    });
  }

  // ---------- grid ----------
  var current = [];
  function render() {
    current = visible();
    grid.innerHTML = "";
    if (!current.length) { grid.innerHTML = '<div class="empty">No lower thirds match.</div>'; }
    current.forEach(function (it, idx) { grid.appendChild(card(it, idx)); });
    $("count").textContent = current.length + " of " + ITEMS.length + " lower thirds";
    $("hint").textContent = CEP ? "Hover to preview · click to import" : "Hover to preview · click to open";
  }
  function card(it, idx) {
    var c = document.createElement("div");
    c.className = "card";
    c.title = "Lower Third " + it.id + " — " + it.family;
    c.innerHTML =
      '<div class="media ' + alignKey(it.align) + '">' +
        '<img loading="lazy" src="' + mediaPath("posters", it.id) + '" alt="">' +
        '<span class="num">' + it.id + '</span>' +
      '</div>' +
      '<div class="meta"><b>' + it.family + '</b><span>' + it.align + '</span></div>';
    var media = c.querySelector(".media"), vid = null;
    c.addEventListener("mouseenter", function () {
      if (!vid) {
        vid = document.createElement("video");
        vid.muted = true; vid.loop = true; vid.playsInline = true; vid.preload = "auto";
        vid.src = mediaPath("clips", it.id);
        vid.addEventListener("playing", function () { vid.className = "ready"; });
        media.insertBefore(vid, media.querySelector(".num"));
      }
      try { vid.currentTime = 0; } catch (e) {}
      var pr = vid.play(); if (pr && pr.catch) { pr.catch(function () {}); }
    });
    c.addEventListener("mouseleave", function () { if (vid) { vid.pause(); vid.className = ""; } });
    c.addEventListener("click", function () {
      if (CEP) { importItem(it, c); } else { openLightbox(idx); }
    });
    return c;
  }

  // ---------- import (After Effects) ----------
  function esc(s) { return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }
  function importItem(it, el) {
    var path = extRoot + "/library/LT_" + it.id + ".aep";
    if (el) { el.classList.add("busy"); }
    toast("Importing Lower Third " + it.id + "…");
    window.__adobe_cep__.evalScript('lt100_import("' + esc(path) + '","' + it.id + '")', function (res) {
      if (el) { el.classList.remove("busy"); }
      if (res && res.indexOf("OK") === 0) { toast(res.substring(3)); }
      else { toast(res || "Import failed", true); }
    });
  }

  // ---------- lightbox (web browser) ----------
  var lbIdx = 0;
  function openLightbox(idx) {
    lbIdx = idx; var it = current[idx]; if (!it) { return; }
    $("lb").hidden = false;
    var v = $("lbVideo"); v.src = mediaPath("clips", it.id); v.play();
    $("lbTitle").textContent = "Lower Third " + it.id;
    $("lbMeta").textContent = it.family + " · " + it.align + " · " + it.font;
    $("lbAction").textContent = CEP ? "Import" : "Copy comp name";
  }
  function closeLightbox() { $("lb").hidden = true; $("lbVideo").pause(); }
  $("lbClose").onclick = closeLightbox;
  $("lb").addEventListener("click", function (e) { if (e.target === $("lb")) { closeLightbox(); } });
  $("lbPrev").onclick = function () { openLightbox((lbIdx - 1 + current.length) % current.length); };
  $("lbNext").onclick = function () { openLightbox((lbIdx + 1) % current.length); };
  $("lbAction").onclick = function () {
    var it = current[lbIdx];
    if (CEP) { importItem(it, null); return; }
    var name = "Lower Third " + it.id;
    if (navigator.clipboard) { navigator.clipboard.writeText(name).then(function () { toast("Copied: " + name); }, function () { toast(name); }); }
    else { toast(name); }
  };
  document.addEventListener("keydown", function (e) {
    if ($("lb").hidden) { return; }
    if (e.key === "Escape") { closeLightbox(); }
    if (e.key === "ArrowRight") { $("lbNext").onclick(); }
    if (e.key === "ArrowLeft") { $("lbPrev").onclick(); }
  });

  var tt = null;
  function toast(msg, err) {
    var t = $("toast"); t.textContent = msg; t.className = "toast show" + (err ? " err" : "");
    clearTimeout(tt); tt = setTimeout(function () { t.className = "toast"; }, err ? 5000 : 2200);
  }

  render();
})();
