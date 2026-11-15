/* 100 Lower Thirds panel — After Effects side.
   lt100_import(path, id): imports library/LT_<id>.aep, files it under "100 Lower Thirds" in the
   Project panel and adds the comp to the active composition at the current time.
   With no active composition the imported comp is opened instead. Returns "OK <message>" or an error. */
function lt100_findFolder(name, parent) {
    var i, it;
    for (i = 1; i <= app.project.numItems; i++) {
        it = app.project.item(i);
        if ((it instanceof FolderItem) && it.name === name && it.parentFolder.id === parent.id) { return it; }
    }
    return null;
}
function lt100_firstComp(folder) {
    var i, it, r;
    for (i = 1; i <= folder.numItems; i++) {
        it = folder.item(i);
        if ((it instanceof CompItem) && /^Lower Third \d\d\d/.test(it.name)) { return it; }
        if (it instanceof FolderItem) { r = lt100_firstComp(it); if (r) { return r; } }
    }
    return null;
}
function lt100_import(path, id) {
    var f = new File(path), target, imported, comp, root, layer, s, i;
    if (!f.exists) { return "ERROR: library file not found:\n" + path; }
    target = app.project.activeItem;
    app.beginUndoGroup("Import Lower Third " + id);
    try {
        imported = app.project.importFile(new ImportOptions(f));
        if (!(imported instanceof FolderItem)) { app.endUndoGroup(); return "ERROR: unexpected import result"; }
        comp = lt100_firstComp(imported);
        if (!comp) { app.endUndoGroup(); return "ERROR: no Lower Third comp in " + f.name; }

        root = lt100_findFolder("100 Lower Thirds", app.project.rootFolder);
        if (!root) { root = app.project.items.addFolder("100 Lower Thirds"); }
        imported.parentFolder = root;
        imported.name = "Lower Third " + id;

        if ((target instanceof CompItem) && target !== comp) {
            layer = target.layers.add(comp);
            layer.startTime = target.time;
            if (target.width !== comp.width || target.height !== comp.height) {
                s = Math.min(target.width / comp.width, target.height / comp.height) * 100;
                layer.property("ADBE Transform Group").property("ADBE Scale").setValue([s, s]);
            }
            layer.property("ADBE Transform Group").property("ADBE Position").setValue([target.width / 2, target.height / 2]);
            for (i = 1; i <= target.numLayers; i++) { target.layer(i).selected = false; }
            layer.selected = true;
            app.endUndoGroup();
            return "OK Lower Third " + id + " added to \"" + target.name + "\"";
        }
        comp.openInViewer();
        app.endUndoGroup();
        return "OK Lower Third " + id + " imported (no active comp — opened it)";
    } catch (e) {
        app.endUndoGroup();
        return "ERROR: " + e.toString() + (e.line ? " (line " + e.line + ")" : "");
    }
}
