"""Resolve Workspace > Scripts > Utility. Native Text+ titles stay on video tracks.
Import a .setting produced by Video Studio into the selected Fusion title clip.
This script never creates a subtitle track and never replaces an existing composition.
"""
def run(resolve, fusion):
    import os
    project = resolve.GetProjectManager().GetCurrentProject()
    timeline = project.GetCurrentTimeline() if project else None
    if timeline is None:
        raise RuntimeError("Open a Resolve timeline first")
    path = fusion.RequestFile()
    if not path or not str(path).lower().endswith(".setting") or not os.path.isfile(path):
        raise RuntimeError("Choose an exported Text+ .setting file")
    # InsertFusionCompositionIntoTimeline creates a new graphic on a video track.
    item = timeline.InsertFusionCompositionIntoTimeline()
    if not item:
        raise RuntimeError("Resolve could not insert a Fusion composition at the playhead")
    comp = item.GetFusionCompByIndex(1)
    if comp is None:
        raise RuntimeError("New Fusion composition is unavailable")
    text = open(path, "r", encoding="utf-8").read()
    # .setting is executable Fusion settings syntax. Only locally exported, trusted files belong here.
    comp.StartUndo("Import graphic title")
    comp.Lock()
    try:
        existing = list((comp.GetToolList(False) or {}).values())
        pasted = comp.Paste(text)
        if not pasted:
            raise RuntimeError("The selected file could not be imported as Fusion settings")
        for tool in existing:
            if tool.GetAttrs().get("TOOLS_RegID") == "MediaOut":
                comp.DeleteTool(tool)
        comp.EndUndo(True)
    except Exception:
        comp.EndUndo(False)
        raise
    finally:
        comp.Unlock()
    print("Editable Text+ inserted on a video track. Trim its timeline duration as required.")

if __name__ == "__main__":
    resolve = globals().get("resolve")
    if resolve is None:
        import DaVinciResolveScript as dvr
        resolve = dvr.scriptapp("Resolve")
    if resolve is None:
        raise RuntimeError("Resolve scripting is unavailable in this edition/configuration")
    run(resolve, resolve.Fusion())
