"""Validate interoperability using the official library, not only our own parser."""
import json, subprocess, tempfile
from pathlib import Path
import opentimelineio as otio
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as folder:
    file=Path(folder)/'Timeline.otio'
    code="const C=require('./Varna_Motion_Studio/js/editor51-core.js'),T=require('./Varna_Motion_Studio/js/timeline53-core.js');const p=C.fresh();p.assets.push({id:'a',name:'s.mov',kind:'video',duration:10});const c=C.add(p,'a','v1',2);c.in=1;c.out=6;process.stdout.write(JSON.stringify(T.otio(p)));"
    file.write_text(subprocess.check_output(['node','-e',code],cwd=root,text=True))
    timeline=otio.adapters.read_from_file(str(file));clips=list(timeline.find_clips())
    assert len(clips)==1 and clips[0].source_range.start_time.to_seconds()==1
    assert abs(timeline.duration().to_seconds()-7)<1e-6
    otio.adapters.write_to_file(timeline,str(file))
    code="const T=require('./Varna_Motion_Studio/js/timeline53-core.js'),C=require('./Varna_Motion_Studio/js/editor51-core.js');const p=C.validate(T.fromOtio(JSON.parse(require('fs').readFileSync(process.argv[1]))));if(p.clips[0].start!==2||p.clips[0].in!==1||p.clips[0].out!==6)process.exit(1);"
    subprocess.run(['node','-e',code,str(file)],cwd=root,check=True)
print('PASS official OpenTimelineIO read / serialize / import preserves source trim, gap and duration')
