/* ===================== READY LIBRARY: BUNDLED MEDIA =====================
   After Effects never stores raster footage inside a .aep — it only records a
   path. A part of the READY library was built from projects whose stills sit
   next to those projects, so on any machine but the author's those items
   imported with "Media Missing" colour bars.

   Those stills now ship in assets/ready/media (byte-identical copies, ASCII
   names) with a manifest that says which file belongs to which library item.
   Right after an item is imported we relink whatever came in missing, so the
   item lands complete on Windows and macOS alike.

   assets/ready/media.txt row:
       <itemId> TAB <index> TAB <foldedBasename> TAB <bundledFile>

   foldedBasename = lowercased file name with every char above U+007F removed.
   Folding sidesteps the NFC/NFD difference between Windows and macOS, which
   would otherwise break matching for names holding non-Latin characters.

   Loaded by main.js through $.evalFile, so the definitions live in the panel's
   own ExtendScript engine for the rest of the session. Everything is declared
   as an assignment rather than a function statement — assignments are legal
   inside the guard block that main.js wraps around this file. Holds no secrets
   and is meant to stay readable.
   ======================================================================== */

/* lowercase + drop everything outside ASCII */
am_rdFold = function (s) {
    var o = "", i, c;
    s = String(s);
    for (i = 0; i < s.length; i++) {
        c = s.charCodeAt(i);
        if (c < 128) o += s.charAt(i);
    }
    return o.toLowerCase();
};

/* file name out of a path recorded on either platform */
am_rdBase = function (p) {
    var n = String(p).replace(/\\/g, "/"), i = n.lastIndexOf("/");
    return (i >= 0) ? n.substring(i + 1) : n;
};

am_rdMap = null;
am_rdMapDir = "";

/* manifest -> { itemId: [ {idx, key, file}, ... ] }, cached per folder */
am_rdLoad = function (dir) {
    if (am_rdMap && am_rdMapDir === String(dir)) return am_rdMap;
    var map = {};
    try {
        var f = new File(String(dir) + "/media.txt");
        if (f.exists) {
            f.encoding = "UTF-8";
            f.open("r");
            var txt = f.read();
            f.close();
            var lines = String(txt).split("\n"), i, p;
            for (i = 0; i < lines.length; i++) {
                if (!lines[i]) continue;
                p = lines[i].split("\t");
                if (p.length < 4) continue;
                if (!map[p[0]]) map[p[0]] = [];
                map[p[0]].push({ idx: parseInt(p[1], 10) || 0, key: p[2], file: p[3] });
            }
        }
    } catch (e) {}
    am_rdMap = map;
    am_rdMapDir = String(dir);
    return map;
};

/* ids of every project item right now — the fence that keeps the relink from
   ever touching footage the user already had open */
am_rdIds = function () {
    var s = {}, i;
    for (i = 1; i <= app.project.numItems; i++) {
        try { s[app.project.item(i).id] = 1; } catch (e) {}
    }
    return s;
};

/* relink only items that (a) appeared during this insert, (b) came in missing,
   and (c) are listed in the manifest under this library id */
am_rdRelinkNew = function (before, dir, id) {
    var byId = am_rdLoad(dir), rows = byId[String(id)];
    if (!rows || !rows.length) return 0;

    var fresh = [], i, it;
    for (i = 1; i <= app.project.numItems; i++) {
        try {
            it = app.project.item(i);
            if (before[it.id]) continue;
            if (!(it instanceof FootageItem)) continue;
            if (it.footageMissing !== true) continue;
            fresh.push(it);
        } catch (e) {}
    }
    if (!fresh.length) return 0;

    var fixed = 0;
    for (i = 0; i < fresh.length; i++) {
        it = fresh[i];
        var row = null, k = "", j;

        if (rows.length === 1) {
            /* 62 of the 78 affected items reference exactly one file */
            row = rows[0];
        } else {
            try { if (it.file) k = am_rdFold(am_rdBase(it.file.fsName)); } catch (e1) {}
            if (k) {
                for (j = 0; j < rows.length; j++) { if (rows[j].key === k) { row = rows[j]; break; } }
            }
            if (!row) {
                /* AE names a footage item after its file, so this survives even
                   when the recorded path itself cannot be read back */
                k = am_rdFold(String(it.name));
                for (j = 0; j < rows.length; j++) { if (rows[j].key === k) { row = rows[j]; break; } }
            }
            if (!row && fresh.length === rows.length) {
                /* last resort, and only when the counts line up exactly */
                for (j = 0; j < rows.length; j++) { if (rows[j].idx === i) { row = rows[j]; break; } }
            }
        }
        if (!row) continue;

        try {
            var nf = new File(String(dir) + "/" + row.file);
            if (!nf.exists) continue;

            /* The .aep also stores how this footage is to be interpreted.
               replace() makes After Effects guess again for the new file, and
               for images with soft edges it can land on straight vs
               premultiplied alpha differently, which shifts those edge pixels.
               Carry the stored interpretation across so the frame renders
               exactly as it did for the author. */
            var keep = String(it.name), am = null, pc = null, ia = null;
            try { am = it.mainSource.alphaMode; } catch (eA) {}
            try { pc = it.mainSource.premulColor; } catch (eB) {}
            try { ia = it.mainSource.invertAlpha; } catch (eC) {}

            it.replace(nf);

            try { it.name = keep; } catch (e2) {}
            try { if (am !== null) it.mainSource.alphaMode = am; } catch (eD) {}
            try { if (pc !== null) it.mainSource.premulColor = pc; } catch (eE) {}
            try { if (ia !== null) it.mainSource.invertAlpha = ia; } catch (eF) {}

            if (it.footageMissing !== true) fixed++;
        } catch (e3) {}
    }
    return fixed;
};

/* what main.js calls: fence, hand off to the compiled am_readyUse, relink.
   Returns am_readyUse's own string with "|RL<n>" appended, so the existing
   "OK|<layers>" parsing on the panel side keeps working unchanged. */
am_rdWrap = function (path, id, name, open, dir) {
    var before;
    try { before = am_rdIds(); } catch (e0) { before = {}; }
    var res = am_readyUse(path, id, name, open);
    var n = 0;
    try { n = am_rdRelinkNew(before, dir, id); } catch (e) { n = -1; }
    return String(res) + "|RL" + n;
};
