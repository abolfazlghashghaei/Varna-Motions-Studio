// Orb Reactor - ExtendScript host for After Effects (AEFT) and Premiere Pro (PPRO).
// Every public function returns a JSON string.

function _jsonStr(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}
function _jsonVal(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return isFinite(v) ? String(v) : 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return _jsonStr(v);
  if (v instanceof Array) {
    var parts = [];
    for (var i = 0; i < v.length; i++) parts.push(_jsonVal(v[i]));
    return '[' + parts.join(',') + ']';
  }
  var out = [];
  for (var k in v) {
    if (v.hasOwnProperty(k)) out.push(_jsonStr(k) + ':' + _jsonVal(v[k]));
  }
  return '{' + out.join(',') + '}';
}
function _ok(data) { data.ok = true; return _jsonVal(data); }
function _err(message) { return _jsonVal({ ok: false, error: String(message) }); }

/** 'aftereffects' | 'premierepro' | 'unknown' */
function _hostKind() {
  try {
    if (typeof BridgeTalk !== 'undefined' && BridgeTalk.appName) {
      var n = String(BridgeTalk.appName).toLowerCase();
      if (n.indexOf('premiere') >= 0) return 'premierepro';
      if (n.indexOf('aftereffects') >= 0 || n.indexOf('after effects') >= 0) return 'aftereffects';
    }
  } catch (e0) {}
  try {
    if (app.project && app.project.activeSequence !== undefined) return 'premierepro';
  } catch (e1) {}
  try {
    if (typeof CompItem !== 'undefined') return 'aftereffects';
  } catch (e2) {}
  return 'unknown';
}

function aePing() {
  return _ok({
    appVersion: app.version,
    buildName: app.buildName || '',
    host: _hostKind(),
  });
}

// ---------------------------------------------------------------------------
// After Effects helpers
// ---------------------------------------------------------------------------

function _aeActiveComp() {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) return null;
  return comp;
}

function aeGetActiveCompInfo() {
  try {
    if (_hostKind() === 'premierepro') return _pproGetActiveSequenceInfo();

    var comp = _aeActiveComp();
    if (!comp) return _err('The active item is not a composition. Select or open a comp first.');
    return _ok({
      host: 'aftereffects',
      id: comp.id,
      name: comp.name,
      width: comp.width,
      height: comp.height,
      frameRate: comp.frameRate,
      duration: comp.duration,
      workAreaStart: comp.workAreaStart,
      workAreaDuration: comp.workAreaDuration,
      currentTime: comp.time,
      pixelAspect: comp.pixelAspect,
    });
  } catch (e) {
    return _err(e.toString());
  }
}

/**
 * Walk a precomp for footage items that have audio + a file path.
 * Returns the best match whose layer time range overlaps the outer layer's
 * visible range inside the precomp.
 */
function _aeFindAudioFileInComp(compItem, outerSourceIn, outerSourceOut, depth) {
  if (!compItem || !(compItem instanceof CompItem)) return null;
  if (depth > 5) return null;
  var best = null;
  for (var li = 1; li <= compItem.numLayers; li++) {
    try {
      var L = compItem.layer(li);
      if (!(L instanceof AVLayer) || !L.source) continue;
      var src = L.source;

      // Layer's visible range inside this comp.
      var layerIn = Math.max(0, L.inPoint);
      var layerOut = Math.max(layerIn + 0.05, L.outPoint);
      // Intersection with the outer layer's trimmed range mapped into this comp.
      var visIn = Math.max(layerIn, outerSourceIn || 0);
      var visOut = Math.min(layerOut, (outerSourceOut != null) ? outerSourceOut : layerOut);
      if (!(visOut > visIn)) continue;

      if (src instanceof FootageItem) {
        var hasAudio = false;
        try { hasAudio = !!src.hasAudio; } catch (eH) { hasAudio = false; }
        if (!hasAudio) continue;
        var fp = '';
        try {
          if (src.mainSource && src.mainSource.file) fp = src.mainSource.file.fsName;
        } catch (eF) { fp = ''; }
        if (!fp) continue;
        // Source-relative in/out for the visible portion.
        var mediaIn = Math.max(0, visIn - L.startTime);
        var mediaOut = Math.max(mediaIn + 0.05, visOut - L.startTime);
        var candidate = {
          filePath: fp,
          sourceIn: mediaIn,
          sourceOut: mediaOut,
          name: L.name,
          // Prefer layers that cover more of the outer range.
          coverage: visOut - visIn,
        };
        if (!best || candidate.coverage > best.coverage) best = candidate;
      } else if (src instanceof CompItem) {
        // Map outer visible range into the nested precomp's local time.
        var nestedOuterIn = Math.max(0, visIn - L.startTime);
        var nestedOuterOut = Math.max(nestedOuterIn + 0.05, visOut - L.startTime);
        var nested = _aeFindAudioFileInComp(src, nestedOuterIn, nestedOuterOut, depth + 1);
        if (nested) {
          if (!best || (nested.coverage || 0) > (best.coverage || 0)) {
            best = nested;
            best.name = L.name + ' / ' + nested.name;
          }
        }
      }
    } catch (eL) {}
  }
  return best;
}

function aeGetSelectedAudioLayerInfo() {
  try {
    if (_hostKind() === 'premierepro') return _pproGetSelectedAudioClipInfo();

    var comp = _aeActiveComp();
    if (!comp) return _err('The active item is not a composition.');
    var layers = comp.selectedLayers;
    if (!layers || layers.length === 0) {
      return _err('Select one or more layers (or precomps) with audio, then try again.');
    }
    var clips = [];
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof AVLayer) || !layer.source) continue;
      var src = layer.source;

      // Outer layer timeline + source trim.
      var timelineIn = layer.inPoint;
      var timelineOut = layer.outPoint;
      var outerSourceIn = Math.max(0, layer.inPoint - layer.startTime);
      var outerSourceOut = Math.max(outerSourceIn + 0.05, layer.outPoint - layer.startTime);

      var filePath = '';
      var sourceIn = outerSourceIn;
      var sourceOut = outerSourceOut;
      var clipName = layer.name;
      var hasVideo = false;
      try { hasVideo = !!src.hasVideo; } catch (eV) { hasVideo = false; }

      if (src instanceof FootageItem) {
        var hasAudio = false;
        try { hasAudio = !!src.hasAudio; } catch (e2) { hasAudio = false; }
        if (!hasAudio) continue;
        try {
          if (src.mainSource && src.mainSource.file) filePath = src.mainSource.file.fsName;
        } catch (e3) { filePath = ''; }
      } else if (src instanceof CompItem) {
        // Precomp: dig for audio footage even if hasAudio is unreliable.
        var found = _aeFindAudioFileInComp(src, outerSourceIn, outerSourceOut, 0);
        if (found && found.filePath) {
          filePath = found.filePath;
          sourceIn = found.sourceIn;
          sourceOut = found.sourceOut;
          clipName = layer.name + ' / ' + found.name;
        }
      }
      if (!filePath) continue;

      clips.push({
        name: clipName,
        filePath: filePath,
        sourceIn: sourceIn,
        sourceOut: sourceOut,
        timelineIn: timelineIn,
        timelineOut: timelineOut,
        layerIndex: layer.index,
        hasVideo: hasVideo,
      });
    }
    if (!clips.length) {
      return _err('Select one or more layers (or precomps) whose source has audio, then try again.');
    }
    // Sort by timeline order so multi-clip reactivity plays as one continuous range.
    clips.sort(function (a, b) { return a.timelineIn - b.timelineIn; });
    var first = clips[0];
    // Highest (top-most) selected layer index is the smallest number in AE.
    var topSelectedIndex = clips[0].layerIndex;
    for (var si = 1; si < clips.length; si++) {
      if (clips[si].layerIndex < topSelectedIndex) topSelectedIndex = clips[si].layerIndex;
    }
    var placeStart = first.timelineIn;
    var placeEnd = first.timelineOut;
    for (var pi = 1; pi < clips.length; pi++) {
      if (clips[pi].timelineIn < placeStart) placeStart = clips[pi].timelineIn;
      if (clips[pi].timelineOut > placeEnd) placeEnd = clips[pi].timelineOut;
    }
    return _ok({
      host: 'aftereffects',
      layerName: clips.length === 1 ? first.name : (clips.length + ' selected layers'),
      filePath: first.filePath,
      hasVideo: first.hasVideo,
      inPoint: first.timelineIn,
      outPoint: first.timelineOut,
      startTime: first.timelineIn - first.sourceIn,
      sourceDuration: Math.max(0.05, placeEnd - placeStart),
      sourceIn: first.sourceIn,
      sourceOut: first.sourceOut,
      clips: clips,
      clipCount: clips.length,
      placeStart: placeStart,
      placeEnd: placeEnd,
      anchorLayerIndex: topSelectedIndex,
    });
  } catch (e) {
    return _err(e.toString());
  }
}

function aeImportSequenceAtCTI(firstFramePath, frameRate, layerName) {
  try {
    if (_hostKind() === 'premierepro') {
      return _pproImportSequenceAtCTI(firstFramePath, frameRate, layerName || 'Orb Reactor', null);
    }
    var comp = _aeActiveComp();
    if (!comp) return _err('The active item is not a composition.');
    var f = new File(firstFramePath);
    if (!f.exists) return _err('Rendered frame not found on disk: ' + firstFramePath);

    var importOptions = new ImportOptions(f);
    importOptions.sequence = true;
    var item = app.project.importFile(importOptions);
    try {
      if (item.mainSource && 'conformFrameRate' in item.mainSource) {
        item.mainSource.conformFrameRate = frameRate;
      }
    } catch (eFr) {}

    app.beginUndoGroup('Place Orb Reactor on Timeline');
    var layer = comp.layers.add(item);
    layer.name = layerName || 'Orb Reactor';
    layer.startTime = comp.time;
    app.endUndoGroup();
    return _ok({ layerIndex: layer.index, layerName: layer.name, itemId: item.id, host: 'aftereffects' });
  } catch (e) {
    return _err(e.toString());
  }
}

function aeImportFileAtCTI(filePath, layerName, conformFrameRate) {
  try {
    if (_hostKind() === 'premierepro') {
      return _pproImportFileAtCTI(filePath, layerName || 'Orb Reactor', false);
    }
    var comp = _aeActiveComp();
    if (!comp) return _err('The active item is not a composition.');
    var f = new File(filePath);
    if (!f.exists) return _err('File not found on disk: ' + filePath);

    var importOptions = new ImportOptions(f);
    var item = app.project.importFile(importOptions);
    try {
      if (conformFrameRate && item.mainSource && 'conformFrameRate' in item.mainSource) {
        item.mainSource.conformFrameRate = conformFrameRate;
      }
    } catch (eFr) {}

    app.beginUndoGroup('Place Orb Reactor on Timeline');
    var layer = comp.layers.add(item);
    layer.name = layerName || item.name;
    layer.startTime = comp.time;
    app.endUndoGroup();
    return _ok({ layerIndex: layer.index, layerName: layer.name, itemId: item.id, host: 'aftereffects' });
  } catch (e) {
    return _err(e.toString());
  }
}

// placeStart: timeline seconds (null/undefined = use CTI).
// anchorLayerIndex: AE layer index to place above (null = stack at top).
// width/height/placeEnd/durationSeconds are optional extras (Premiere duration fix).
function aeImportOrbAndAudioAtCTI(orbPath, orbIsSequence, frameRate, orbLayerName, audioPath, audioLayerName, placeStart, anchorLayerIndex, width, height, placeEnd, durationSeconds) {
  try {
    if (_hostKind() === 'premierepro') {
      // Prefer explicit duration; else derive from placeEnd - placeStart.
      var dur = null;
      if (durationSeconds != null && isFinite(Number(durationSeconds)) && Number(durationSeconds) > 0.05) {
        dur = Number(durationSeconds);
      } else if (placeStart != null && placeEnd != null && isFinite(Number(placeEnd) - Number(placeStart))) {
        var span = Number(placeEnd) - Number(placeStart);
        if (span > 0.05) dur = span;
      }
      return _pproImportOrbAndAudioAtCTI(
        orbPath, !!orbIsSequence, frameRate,
        orbLayerName || 'Orb Reactor',
        audioPath, audioLayerName || 'Orb Audio',
        placeStart, width, height, placeEnd, dur
      );
    }

    var comp = _aeActiveComp();
    if (!comp) return _err('The active item is not a composition.');

    var startT = (placeStart !== null && placeStart !== undefined && isFinite(Number(placeStart)))
      ? Number(placeStart)
      : comp.time;

    var orbFile = new File(orbPath);
    if (!orbFile.exists) return _err('Rendered orb file not found on disk: ' + orbPath);
    var orbImportOptions = new ImportOptions(orbFile);
    if (orbIsSequence) orbImportOptions.sequence = true;
    var orbItem = app.project.importFile(orbImportOptions);
    try {
      if (orbItem.mainSource && 'conformFrameRate' in orbItem.mainSource) {
        orbItem.mainSource.conformFrameRate = frameRate;
      }
    } catch (eFr) {}

    var audioItem = null;
    if (audioPath) {
      var audioFile = new File(audioPath);
      if (!audioFile.exists) return _err('Audio file not found on disk: ' + audioPath);
      audioItem = app.project.importFile(new ImportOptions(audioFile));
    }

    // Layer order (top → bottom): Orb, then Audio (if any), then existing layers.
    // layers.add() always inserts at the top, so add audio first, then orb.
    app.beginUndoGroup('Place Orb Reactor on Timeline');
    var audioLayer = null;
    if (audioItem) {
      audioLayer = comp.layers.add(audioItem);
      audioLayer.name = audioLayerName || audioItem.name;
      audioLayer.startTime = startT;
    }
    var orbLayer = comp.layers.add(orbItem);
    orbLayer.name = orbLayerName || 'Orb Reactor';
    orbLayer.startTime = startT;

    // If an anchor layer was selected, stack just above it:
    //   [orb]  [audio]  [selected…]
    var anchor = null;
    if (anchorLayerIndex !== null && anchorLayerIndex !== undefined && isFinite(Number(anchorLayerIndex))) {
      try {
        var idx = Number(anchorLayerIndex);
        // Indices may have shifted after adds; try to resolve by current index.
        if (idx >= 1 && idx <= comp.numLayers) anchor = comp.layer(idx);
      } catch (eA) { anchor = null; }
    }
    // Prefer currently selected layer if still selected (more reliable after import).
    try {
      if (comp.selectedLayers && comp.selectedLayers.length > 0) {
        var sel = comp.selectedLayers[0];
        // Don't use the layers we just added as the anchor.
        if (sel !== orbLayer && sel !== audioLayer) anchor = sel;
      }
    } catch (eS) {}

    if (anchor) {
      try {
        if (audioLayer) {
          audioLayer.moveBefore(anchor);
          orbLayer.moveBefore(audioLayer);
        } else {
          orbLayer.moveBefore(anchor);
        }
      } catch (eM) { /* keep top-of-stack order */ }
    }
    app.endUndoGroup();

    return _ok({
      host: 'aftereffects',
      orbLayerIndex: orbLayer.index,
      orbLayerName: orbLayer.name,
      audioLayerIndex: audioLayer ? audioLayer.index : null,
      audioLayerName: audioLayer ? audioLayer.name : null,
      placeStart: startT,
    });
  } catch (e) {
    return _err(e.toString());
  }
}

function aeRevealFolder(folderPath) {
  try {
    var folder = new Folder(folderPath);
    if (!folder.exists) return _err('Folder does not exist: ' + folderPath);
    folder.execute();
    return _ok({});
  } catch (e) {
    return _err(e.toString());
  }
}

function aeSelectFolder(promptText) {
  try {
    var folder = Folder.selectDialog(promptText || 'Choose an output folder');
    if (!folder) return _err('No folder selected.');
    return _ok({ path: folder.fsName });
  } catch (e) {
    return _err(e.toString());
  }
}

// ---------------------------------------------------------------------------
// Premiere Pro helpers
// ---------------------------------------------------------------------------

function _pproActiveSequence() {
  if (!app.project) return null;
  return app.project.activeSequence || null;
}

function _ticksToSeconds(ticks) {
  // Premiere ticks: 254016000000 per second (common)
  var t = Number(ticks);
  if (!isFinite(t) || t <= 0) return 0;
  return t / 254016000000.0;
}

function _secondsToTicks(sec) {
  return Math.round(Number(sec) * 254016000000.0);
}

function _timeToTicks(timeObj) {
  if (!timeObj) return 0;
  try {
    if (timeObj.ticks !== undefined && timeObj.ticks !== null) return Number(timeObj.ticks);
  } catch (e) {}
  try {
    if (typeof timeObj.seconds === 'number') return _secondsToTicks(timeObj.seconds);
  } catch (e2) {}
  return 0;
}

function _pproGetActiveSequenceInfo() {
  var seq = _pproActiveSequence();
  if (!seq) return _err('No active sequence. Open or select a sequence in Premiere Pro first.');

  var settings = seq.getSettings ? seq.getSettings() : null;
  var width = 1920, height = 1080, frameRate = 30, duration = 10, pixelAspect = 1;
  try {
    if (settings) {
      if (settings.videoFrameWidth) width = settings.videoFrameWidth;
      if (settings.videoFrameHeight) height = settings.videoFrameHeight;
      if (settings.videoFrameRate && settings.videoFrameRate.seconds)
        frameRate = 1.0 / settings.videoFrameRate.seconds;
      else if (settings.videoFrameRate) frameRate = Number(settings.videoFrameRate) || 30;
    }
  } catch (eS) {}

  try {
    if (seq.end) duration = _ticksToSeconds(_timeToTicks(seq.end));
  } catch (eD) {}

  var currentTime = 0;
  try {
    currentTime = _ticksToSeconds(_timeToTicks(seq.getPlayerPosition()));
  } catch (eT) {}

  // Work area ≈ full sequence if in/out not available
  var workAreaStart = 0;
  var workAreaDuration = duration;
  try {
    if (seq.getInPoint && seq.getOutPoint) {
      var ip = _ticksToSeconds(_timeToTicks(seq.getInPoint()));
      var op = _ticksToSeconds(_timeToTicks(seq.getOutPoint()));
      if (op > ip) {
        workAreaStart = ip;
        workAreaDuration = op - ip;
      }
    }
  } catch (eW) {}

  return _ok({
    host: 'premierepro',
    id: seq.sequenceID || 0,
    name: seq.name,
    width: width,
    height: height,
    frameRate: frameRate,
    duration: duration,
    workAreaStart: workAreaStart,
    workAreaDuration: workAreaDuration,
    currentTime: currentTime,
    pixelAspect: pixelAspect,
  });
}

/** Resolve a media file path from a Premiere project item (clip or nest). */
function _pproResolveMediaPath(projectItem) {
  if (!projectItem) return '';
  var filePath = '';
  try {
    if (projectItem.getMediaPath) filePath = projectItem.getMediaPath() || '';
  } catch (eM) { filePath = ''; }
  if (filePath) return filePath;

  // Nested sequence: dig for the first clip with a media path inside the nest.
  try {
    var isSeq = false;
    try {
      if (projectItem.isSequence) isSeq = !!projectItem.isSequence();
    } catch (eIs) {
      try {
        // Some builds expose type as a number/string containing SEQUENCE
        if (projectItem.type && String(projectItem.type).toUpperCase().indexOf('SEQUENCE') >= 0) isSeq = true;
      } catch (eT) {}
    }
    if (!isSeq) return '';

    // Walk the nested sequence via QE when available for reliable media paths.
    try {
      if (typeof qe === 'undefined') { try { app.enableQE(); } catch (eQ) {} }
    } catch (eQE) {}

    // Fallback: use projectItem tree if the nest exposes children (rare).
    try {
      if (projectItem.children && projectItem.children.numItems > 0) {
        for (var ci = 0; ci < projectItem.children.numItems; ci++) {
          var child = projectItem.children[ci];
          var nested = _pproResolveMediaPath(child);
          if (nested) return nested;
        }
      }
    } catch (eCh) {}
  } catch (eNest) {}
  return '';
}

/**
 * Collect audio-capable clips from a nested sequence between nest timeline
 * bounds. Returns an array of {filePath, sourceIn, sourceOut, timelineIn, timelineOut, name}.
 * Times are mapped into the parent sequence's timeline.
 */
function _pproCollectFromNestedSequence(nestProjectItem, nestTimelineIn, nestTimelineOut, into) {
  // Premiere ExtendScript cannot always open a nested sequence's tracks from
  // the parent. Best-effort: if we can find ANY media path on the nest item,
  // treat the whole nest span as one clip of that media (user can refine).
  var path = _pproResolveMediaPath(nestProjectItem);
  if (path) {
    into.push({
      name: (nestProjectItem && nestProjectItem.name) ? nestProjectItem.name : 'Nest',
      filePath: path,
      sourceIn: 0,
      sourceOut: Math.max(0.05, nestTimelineOut - nestTimelineIn),
      timelineIn: nestTimelineIn,
      timelineOut: nestTimelineOut,
      hasVideo: true,
      isNest: true,
    });
  }
}

function _pproGetSelectedAudioClipInfo() {
  var seq = _pproActiveSequence();
  if (!seq) return _err('No active sequence.');

  // Collect ALL selected clips (audio tracks first, then video) so multi-select works.
  function collectFromTrack(track, into) {
    if (!track || !track.clips) return;
    for (var i = 0; i < track.clips.numItems; i++) {
      var clip = track.clips[i];
      try {
        if (!clip.isSelected()) continue;
      } catch (eSel) { continue; }
      var projectItem = null;
      try { projectItem = clip.projectItem; } catch (eP) { projectItem = null; }
      if (!projectItem) continue;

      var timelineIn = _ticksToSeconds(_timeToTicks(clip.start));
      var timelineOut = _ticksToSeconds(_timeToTicks(clip.end));
      var tlDur = Math.max(0.05, timelineOut - timelineIn);

      var filePath = '';
      try {
        if (projectItem.getMediaPath) filePath = projectItem.getMediaPath() || '';
      } catch (eM) { filePath = ''; }

      // Nested sequence selected as a clip: try to resolve inner media.
      var isNest = false;
      if (!filePath) {
        try {
          if (projectItem.isSequence && projectItem.isSequence()) isNest = true;
        } catch (eIs) {
          try {
            if (projectItem.type && String(projectItem.type).toUpperCase().indexOf('SEQUENCE') >= 0) isNest = true;
          } catch (eT) {}
        }
      }
      if (isNest && !filePath) {
        _pproCollectFromNestedSequence(projectItem, timelineIn, timelineOut, into);
        continue;
      }
      if (!filePath) continue;

      // Media in/out (portion of the source file used on the timeline).
      var sourceIn = 0;
      var sourceOut = tlDur;
      try {
        var ip = _ticksToSeconds(_timeToTicks(clip.inPoint));
        var op = _ticksToSeconds(_timeToTicks(clip.outPoint));
        if (op > ip + 0.001) {
          sourceIn = ip;
          sourceOut = op;
        }
      } catch (eIO) {}
      // Guard against bad in/out (some PPro builds return absolute ticks incorrectly).
      if (!(sourceOut > sourceIn) || (sourceOut - sourceIn) > tlDur * 4) {
        sourceIn = 0;
        sourceOut = tlDur;
      }

      into.push({
        name: clip.name || projectItem.name || 'Clip',
        filePath: filePath,
        sourceIn: sourceIn,
        sourceOut: sourceOut,
        timelineIn: timelineIn,
        timelineOut: timelineOut,
        hasVideo: true,
      });
    }
  }

  var clips = [];
  var t;
  try {
    for (t = 0; t < seq.audioTracks.numTracks; t++) collectFromTrack(seq.audioTracks[t], clips);
  } catch (eA) {}
  try {
    for (t = 0; t < seq.videoTracks.numTracks; t++) collectFromTrack(seq.videoTracks[t], clips);
  } catch (eV) {}

  // Deduplicate identical timeline ranges (same clip selected on A+V tracks).
  if (clips.length > 1) {
    var deduped = [];
    var seen = {};
    for (var di = 0; di < clips.length; di++) {
      var key = clips[di].filePath + '|' +
        Number(clips[di].timelineIn).toFixed(3) + '|' +
        Number(clips[di].timelineOut).toFixed(3);
      if (seen[key]) continue;
      seen[key] = true;
      deduped.push(clips[di]);
    }
    clips = deduped;
  }

  if (!clips.length) {
    return _err('Select one or more clips (or nests with media) on the timeline, then try again.');
  }

  clips.sort(function (a, b) { return a.timelineIn - b.timelineIn; });
  var first = clips[0];
  var placeStart = first.timelineIn;
  var placeEnd = first.timelineOut;
  for (var pi = 1; pi < clips.length; pi++) {
    if (clips[pi].timelineIn < placeStart) placeStart = clips[pi].timelineIn;
    if (clips[pi].timelineOut > placeEnd) placeEnd = clips[pi].timelineOut;
  }
  return _ok({
    host: 'premierepro',
    layerName: clips.length === 1 ? first.name : (clips.length + ' selected clips'),
    filePath: first.filePath,
    hasVideo: true,
    inPoint: first.timelineIn,
    outPoint: first.timelineOut,
    startTime: first.timelineIn,
    sourceDuration: Math.max(0.05, placeEnd - placeStart),
    sourceIn: first.sourceIn,
    sourceOut: first.sourceOut,
    clips: clips,
    clipCount: clips.length,
    placeStart: placeStart,
    placeEnd: placeEnd,
  });
}

function _pproImportProjectItem(filePath) {
  var f = new File(filePath);
  if (!f.exists) throw new Error('File not found on disk: ' + filePath);
  var targetBin = app.project.rootItem;
  try {
    app.project.importFiles([f.fsName], true, targetBin, false);
  } catch (eImp) {
    throw new Error('Import failed: ' + eImp.toString());
  }
  // Newly imported item is typically the last child of root (or still selected).
  var item = null;
  try {
    if (app.project.rootItem.children && app.project.rootItem.children.numItems > 0) {
      item = app.project.rootItem.children[app.project.rootItem.children.numItems - 1];
    }
  } catch (eCh) {}
  // Prefer matching by path when possible
  try {
    function walk(bin) {
      if (!bin || !bin.children) return null;
      for (var i = 0; i < bin.children.numItems; i++) {
        var c = bin.children[i];
        try {
          if (c.type && String(c.type).indexOf('BIN') >= 0) {
            var nested = walk(c);
            if (nested) return nested;
          } else if (c.getMediaPath && c.getMediaPath() === f.fsName) {
            return c;
          }
        } catch (eW) {}
      }
      return null;
    }
    var byPath = walk(app.project.rootItem);
    if (byPath) item = byPath;
  } catch (eWalk) {}
  if (!item) throw new Error('Imported file but could not locate it in the Project panel.');
  return item;
}

function _pproTrackOccupied(track, startTicks, endTicks) {
  if (!track || !track.clips) return false;
  for (var i = 0; i < track.clips.numItems; i++) {
    var clip = track.clips[i];
    var cs = _timeToTicks(clip.start);
    var ce = _timeToTicks(clip.end);
    if (cs < endTicks && ce > startTicks) return true;
  }
  return false;
}

function _pproFindFreeVideoTrackIndex(seq, startTicks, endTicks) {
  for (var i = 0; i < seq.videoTracks.numTracks; i++) {
    if (!_pproTrackOccupied(seq.videoTracks[i], startTicks, endTicks)) return i;
  }
  return -1;
}

function _pproFindFreeAudioTrackIndex(seq, startTicks, endTicks) {
  for (var i = 0; i < seq.audioTracks.numTracks; i++) {
    if (!_pproTrackOccupied(seq.audioTracks[i], startTicks, endTicks)) return i;
  }
  return -1;
}

function _pproEnsureVideoTrack(seq, preferredIndex) {
  if (preferredIndex >= 0 && preferredIndex < seq.videoTracks.numTracks) return preferredIndex;
  // Try QE DOM to add a video track when all are occupied.
  try {
    if (typeof qe === 'undefined') {
      try { app.enableQE(); } catch (eQ) {}
    }
    if (typeof qe !== 'undefined' && qe.project) {
      var qeSeq = qe.project.getActiveSequence();
      if (qeSeq && qeSeq.addTracks) {
        qeSeq.addTracks(1, 0, 0); // 1 video, 0 audio, 0 audio sub
      }
    }
  } catch (eAdd) {}
  // Re-read: prefer the new highest track.
  var n = seq.videoTracks.numTracks;
  if (n > 0) return n - 1;
  return 0;
}

function _pproEnsureAudioTrack(seq, preferredIndex) {
  if (preferredIndex >= 0 && preferredIndex < seq.audioTracks.numTracks) return preferredIndex;
  try {
    if (typeof qe === 'undefined') {
      try { app.enableQE(); } catch (eQ) {}
    }
    if (typeof qe !== 'undefined' && qe.project) {
      var qeSeq = qe.project.getActiveSequence();
      if (qeSeq && qeSeq.addTracks) {
        qeSeq.addTracks(0, 1, 0);
      }
    }
  } catch (eAdd) {}
  var n = seq.audioTracks.numTracks;
  if (n > 0) return n - 1;
  return 0;
}

function _pproClipDurationTicks(projectItem, preferredSeconds) {
  if (preferredSeconds != null && isFinite(Number(preferredSeconds)) && Number(preferredSeconds) > 0.05) {
    return _secondsToTicks(Number(preferredSeconds));
  }
  try {
    if (projectItem.getOutPoint && projectItem.getInPoint) {
      var a = _timeToTicks(projectItem.getInPoint());
      var b = _timeToTicks(projectItem.getOutPoint());
      if (b > a) return b - a;
    }
  } catch (e) {}
  // Fallback ~5 seconds only when nothing else is known
  return _secondsToTicks(5);
}

/** After placing a clip, force its timeline out-point to start + durationSeconds. */
function _pproForceClipDuration(track, startTicks, durationSeconds, layerName) {
  if (!track || !track.clips || !(durationSeconds > 0.05)) return;
  var targetEnd = startTicks + _secondsToTicks(durationSeconds);
  try {
    for (var i = 0; i < track.clips.numItems; i++) {
      var c = track.clips[i];
      if (Math.abs(_timeToTicks(c.start) - startTicks) > 5000) continue;
      if (layerName) {
        try { c.name = layerName; } catch (eN) {}
      }
      try {
        // Prefer setting end via ticks / seconds on the track item.
        if (c.end && c.end.seconds !== undefined) {
          c.end.seconds = _ticksToSeconds(targetEnd);
        } else if (c.end && c.end.ticks !== undefined) {
          c.end.ticks = String(targetEnd);
        }
      } catch (eEnd) {
        try {
          // Some builds use setOutPoint on the clip
          if (c.setOutPoint) {
            var outT = c.start;
            if (outT && outT.seconds !== undefined) {
              outT.seconds = _ticksToSeconds(startTicks) + durationSeconds;
              c.setOutPoint(outT);
            }
          }
        } catch (eOut) {}
      }
      break;
    }
  } catch (e) {}
}

function _pproTimeFromSeconds(seq, seconds) {
  // Build a Time object at the given seconds (or fall back to playhead).
  if (seconds === null || seconds === undefined || !isFinite(Number(seconds))) {
    return seq.getPlayerPosition();
  }
  try {
    var t = seq.getPlayerPosition(); // clone-like Time instance
    if (t && t.seconds !== undefined) {
      t.seconds = Number(seconds);
      return t;
    }
  } catch (e1) {}
  try {
    // Some PPro builds expose Time via ticks string
    var t2 = seq.getPlayerPosition();
    if (t2 && t2.ticks !== undefined) {
      t2.ticks = String(_secondsToTicks(Number(seconds)));
      return t2;
    }
  } catch (e2) {}
  return seq.getPlayerPosition();
}

function _pproPlaceVideoAtCTI(seq, projectItem, layerName, placeStartSeconds, durationSeconds) {
  var pos = _pproTimeFromSeconds(seq, placeStartSeconds);
  var startTicks = _timeToTicks(pos);
  var durTicks = _pproClipDurationTicks(projectItem, durationSeconds);
  var endTicks = startTicks + durTicks;

  var freeIdx = _pproFindFreeVideoTrackIndex(seq, startTicks, endTicks);
  var trackIdx = _pproEnsureVideoTrack(seq, freeIdx);
  var track = seq.videoTracks[trackIdx];

  var placed = false;
  try {
    if (freeIdx >= 0 && track.overwriteClip) {
      track.overwriteClip(projectItem, pos);
      placed = true;
    }
  } catch (eOw) { placed = false; }
  if (!placed) {
    try {
      track.insertClip(projectItem, pos);
      placed = true;
    } catch (eIns) {
      throw new Error('Could not place clip on video track: ' + eIns.toString());
    }
  }
  // Critical for PNG sequences: Premiere often imports them as a short/still
  // duration. Force the track item to the exact export length (matches audio).
  if (durationSeconds != null && isFinite(Number(durationSeconds))) {
    _pproForceClipDuration(track, startTicks, Number(durationSeconds), layerName);
  } else {
    try {
      for (var i = 0; i < track.clips.numItems; i++) {
        var c = track.clips[i];
        if (Math.abs(_timeToTicks(c.start) - startTicks) < 1000) {
          if (layerName) c.name = layerName;
          break;
        }
      }
    } catch (eN) {}
  }
  return trackIdx;
}

function _pproPlaceAudioAtCTI(seq, projectItem, layerName, placeStartSeconds, durationSeconds) {
  var pos = _pproTimeFromSeconds(seq, placeStartSeconds);
  var startTicks = _timeToTicks(pos);
  var durTicks = _pproClipDurationTicks(projectItem, durationSeconds);
  var endTicks = startTicks + durTicks;

  var freeIdx = _pproFindFreeAudioTrackIndex(seq, startTicks, endTicks);
  var trackIdx = _pproEnsureAudioTrack(seq, freeIdx);
  var track = seq.audioTracks[trackIdx];

  var placed = false;
  try {
    if (freeIdx >= 0 && track.overwriteClip) {
      track.overwriteClip(projectItem, pos);
      placed = true;
    }
  } catch (eOw) { placed = false; }
  if (!placed) {
    try {
      track.insertClip(projectItem, pos);
      placed = true;
    } catch (eIns) {
      throw new Error('Could not place clip on audio track: ' + eIns.toString());
    }
  }
  if (durationSeconds != null && isFinite(Number(durationSeconds))) {
    _pproForceClipDuration(track, startTicks, Number(durationSeconds), layerName);
  } else {
    try {
      for (var i = 0; i < track.clips.numItems; i++) {
        var c = track.clips[i];
        if (Math.abs(_timeToTicks(c.start) - startTicks) < 1000) {
          if (layerName) c.name = layerName;
          break;
        }
      }
    } catch (eN) {}
  }
  return trackIdx;
}

function _pproImportFileAtCTI(filePath, layerName, asAudio) {
  try {
    var seq = _pproActiveSequence();
    if (!seq) return _err('No active sequence. Open or select a sequence first.');
    var item = _pproImportProjectItem(filePath);
    var trackIdx;
    if (asAudio) trackIdx = _pproPlaceAudioAtCTI(seq, item, layerName);
    else trackIdx = _pproPlaceVideoAtCTI(seq, item, layerName);
    return _ok({
      host: 'premierepro',
      layerIndex: trackIdx,
      layerName: layerName || item.name,
      itemId: 0,
    });
  } catch (e) {
    return _err(e.toString());
  }
}

/**
 * Import a PNG image sequence into Premiere and return the ProjectItem.
 * Uses importFiles(..., importAsNumberedStills=true) when available.
 */
function _pproImportSequenceItem(firstFramePath) {
  var f = new File(firstFramePath);
  if (!f.exists) throw new Error('Rendered frame not found on disk: ' + firstFramePath);

  var targetBin = app.project.rootItem;
  try {
    // importFiles(paths, suppressUI, targetBin, importAsNumberedStills)
    app.project.importFiles([f.fsName], true, targetBin, true);
  } catch (e1) {
    try {
      app.project.importFiles([f.fsName], true, targetBin, false);
    } catch (e2) {
      throw new Error('Sequence import failed: ' + e2.toString());
    }
  }

  var item = null;
  try {
    function walk(bin) {
      if (!bin || !bin.children) return null;
      for (var i = 0; i < bin.children.numItems; i++) {
        var c = bin.children[i];
        try {
          if (c.type && String(c.type).indexOf('BIN') >= 0) {
            var nested = walk(c);
            if (nested) return nested;
          } else if (c.getMediaPath) {
            var mp = c.getMediaPath();
            if (mp && (mp === f.fsName || mp.indexOf(f.name) >= 0)) return c;
          }
        } catch (eW) {}
      }
      return null;
    }
    item = walk(app.project.rootItem);
  } catch (eWalk) {}
  if (!item) {
    try {
      if (app.project.rootItem.children && app.project.rootItem.children.numItems > 0) {
        item = app.project.rootItem.children[app.project.rootItem.children.numItems - 1];
      }
    } catch (eCh) {}
  }
  if (!item) throw new Error('Imported sequence but could not locate it in the Project panel.');
  return item;
}

function _pproImportSequenceAtCTI(firstFramePath, frameRate, layerName, placeStart, durationSeconds) {
  try {
    var seq = _pproActiveSequence();
    if (!seq) return _err('No active sequence. Open or select a sequence first.');
    var item = _pproImportSequenceItem(firstFramePath);
    var trackIdx = _pproPlaceVideoAtCTI(seq, item, layerName || 'Orb Reactor', placeStart, durationSeconds);
    return _ok({
      host: 'premierepro',
      layerIndex: trackIdx,
      layerName: layerName || item.name,
      itemId: 0,
    });
  } catch (e) {
    return _err(e.toString());
  }
}

function _pproImportOrbAndAudioAtCTI(orbPath, orbIsSequence, frameRate, orbLayerName, audioPath, audioLayerName, placeStart, width, height, placeEnd, durationSeconds) {
  try {
    var seq = _pproActiveSequence();
    if (!seq) return _err('No active sequence. Open or select a sequence first.');

    // durationSeconds = exact length of the rendered export (matches audio when
    // "Match loaded audio length" is used). Critical for PNG sequences in Premiere.
    var dur = (durationSeconds != null && isFinite(Number(durationSeconds)))
      ? Number(durationSeconds) : null;
    if (dur == null && placeStart != null && placeEnd != null) {
      var span = Number(placeEnd) - Number(placeStart);
      if (isFinite(span) && span > 0.05) dur = span;
    }

    var videoTrack;
    if (orbIsSequence) {
      var seqItem = _pproImportSequenceItem(orbPath);
      videoTrack = _pproPlaceVideoAtCTI(seq, seqItem, orbLayerName, placeStart, dur);
    } else {
      var orbItem = _pproImportProjectItem(orbPath);
      videoTrack = _pproPlaceVideoAtCTI(seq, orbItem, orbLayerName, placeStart, dur);
    }

    var audioTrack = null;
    if (audioPath) {
      var audioItem = _pproImportProjectItem(audioPath);
      audioTrack = _pproPlaceAudioAtCTI(seq, audioItem, audioLayerName, placeStart, dur);
    }

    return _ok({
      host: 'premierepro',
      orbLayerIndex: videoTrack,
      orbLayerName: orbLayerName,
      audioLayerIndex: audioTrack,
      audioLayerName: audioPath ? audioLayerName : null,
      placeStart: placeStart,
      durationSeconds: dur,
    });
  } catch (e) {
    return _err(e.toString());
  }
}

// Persistent CEP adapter namespace. Original handlers and licensing are preserved.
$.global.VarnaOrbHost={aePing:aePing,aeGetActiveCompInfo:aeGetActiveCompInfo,aeGetSelectedAudioLayerInfo:aeGetSelectedAudioLayerInfo,aeImportSequenceAtCTI:aeImportSequenceAtCTI,aeImportFileAtCTI:aeImportFileAtCTI,aeImportOrbAndAudioAtCTI:aeImportOrbAndAudioAtCTI,aeRevealFolder:aeRevealFolder,aeSelectFolder:aeSelectFolder};
