"""Execute the actual Lua connector with a constrained Resolve SDK model."""
from pathlib import Path
import json,shutil,tempfile,time
from lupa import LuaRuntime
root=Path(__file__).resolve().parents[1]/'Varna_Motion_Studio'
with tempfile.TemporaryDirectory(prefix='resolve54-') as folder:
    p=Path(folder);(p/'integrations/resolve/lib').mkdir(parents=True);(p/'bus').mkdir()
    shutil.copy2(root/'integrations/resolve/lib/json.lua',p/'integrations/resolve/lib/json.lua')
    (p/'integrations/resolve/runtime54-user.json').write_text(json.dumps({'bus':str(p/'bus')}))
    lua=LuaRuntime(unpack_returned_tuples=True)
    lua.globals().py_list=lambda pattern:lua.table_from([lua.table_from({'Name':f.name}) for f in (p/'bus').glob('*.request.json')])
    lua.execute('''
    launches={};os.execute=function(command) launches[#launches+1]=command;return 0 end
    markerData={[60]={name='Cut',duration=1}};inserted={};tracks={{}};local current='01:00:00:00'
    local source={GetName=function()return 'Train' end,GetStart=function()return 108000 end,GetEnd=function()return 108300 end,GetDuration=function()return 300 end,GetLeftOffset=function()return 30 end,GetMediaPoolItem=function()return {GetClipProperty=function(_,key)return '/media/train.mp4' end} end}
    mediaPool={ImportMedia=function(_,files)return {{path=files[1]}} end,AppendToTimeline=function(_,items)inserted[#inserted+1]=items[1];local x=items[1];local c={GetStart=function()return x.recordFrame end,GetEnd=function()return x.recordFrame+x.endFrame+1 end,GetUniqueId=function()return 'native54' end,GetMediaPoolItem=function()return {GetClipProperty=function()return x.mediaPoolItem.path end} end};tracks[x.trackIndex][#tracks[x.trackIndex]+1]=c;return {c} end}
    tl={GetSetting=function(_,key)if key=='timelineFrameRate' then return '30' elseif key=='timelineResolutionWidth' then return '1920' else return '1080' end end,GetStartFrame=function()return 108000 end,GetEndFrame=function()return 108900 end,GetMarkers=function()return markerData end,AddMarker=function(_,frame,color,name,note,duration,customData)markerData[frame]={color=color,name=name,note=note,duration=duration,customData=customData};return true end,DeleteMarkerAtFrame=function(_,frame)markerData[frame]=nil;return true end,GetUniqueId=function()return 'timeline54' end,GetName=function()return 'Sequence' end,GetCurrentTimecode=function()return current end,SetCurrentTimecode=function(_,value)current=value;return true end,GetCurrentVideoItem=function()return source end,GetTrackCount=function()return #tracks end,GetItemListInTrack=function(_,kind,index)return tracks[index] end,AddTrack=function()tracks[#tracks+1]={};return true end,DeleteClips=function(_,list)for i=#tracks,1,-1 do for j=#tracks[i],1,-1 do if tracks[i][j]==list[1] then table.remove(tracks[i],j) end end end;return true end}
    project={GetCurrentTimeline=function()return tl end,GetMediaPool=function()return mediaPool end}
    timer={ID='MotionToolsPoll54',Start=function()end,Stop=function()end}
    window={On={Open={},MotionToolsConnection54={}},GetItems=function()return {Status={}} end,Show=function()end,Hide=function()end}
    dispatcher={On={},AddWindow=function()return window end,RunLoop=function()test_pump() end,ExitLoop=function()end}
    ui={FindWindow=function()return nil end,VGroup=function(_,value)return value end,Label=function(_,value)return value end,Button=function(_,value)return value end,Timer=function()return timer end}
    resolve={Fusion=function()return {UIManager=ui} end,GetProjectManager=function()return {GetCurrentProject=function()return project end,SaveProject=function()return true end} end}
    bmd={UIDispatcher=function()return dispatcher end,readdir=function(pattern)return py_list(pattern) end}
    ''')
    results={}
    def pump():
        ready=json.loads((p/'bus/ready.json').read_text());session=ready['session']
        def request(method,payload,expected=True):
            name='request-'+str(len(results));data={'id':name,'session':session,'method':method,'payload':payload,'deadline':time.time()+20}
            (p/'bus'/f'{name}.request.json').write_text(json.dumps(data));lua.globals().dispatcher.On.Timeout(lua.table_from({'who':'MotionToolsPoll54'}))
            r=json.loads((p/'bus'/f'{name}.response.json').read_text());assert r['ok']==expected,r;results[name]=r;return r.get('data')
        q=request('sequence',{});assert q['width']==1920 and q['height']==1080 and q['frameRate']==30 and q['time']==0
        request('writeMarker',{'id':'cue','start':3,'duration':2,'comment':'VARNA_SOUND50:{}','label':'Music'});assert lua.globals().markerData[90].duration==60
        request('writeMarker',{'id':'cue','start':2,'duration':2,'comment':'VARNA_SOUND50:{}'},False);assert lua.globals().markerData[60].name=='Cut'
        request('writeMarker',{'id':'cue','start':4,'duration':2,'comment':'VARNA_SOUND50:{}'});assert lua.globals().markerData[90] is None and lua.globals().markerData[120].customData=='motion54:cue'
        source=request('source',{});assert source['path']=='/media/train.mp4' and source['sourceStart']==1 and source['sourceDuration']==10
        request('setTime',{'time':2});assert request('sequence',{})['time']==2
        first=request('graphic',{'path':'/render/title.mov','start':1.5,'duration':2})
        assert first['videoTrack']==0 and first['nodeId']=='native54'
        x=lua.globals().inserted[1];assert x.recordFrame==108045 and x.endFrame==59 and x.mediaType==1 and x.trackIndex==1
        second=request('graphic',{'path':'/render/new.mov','start':1.5,'duration':2});assert second['videoTrack']==1
        request('removeGraphic',{'path':'/render/title.mov','nodeId':'native54','projectId':'wrong'},False)
        assert request('removeGraphic',{'path':'/render/title.mov','nodeId':'native54','projectId':'timeline54'})['removed']==1
        request('script',{'code':'os.execute("invalid")'},False)
        lua.globals().window.On.MotionToolsConnection54.Close()
    lua.globals().test_pump=pump
    source=(root/'integrations/resolve/Motion_Tools.lua').read_text().replace('__VARNA_ROOT54__',str(p))
    lua.execute(source)
    assert len(lua.globals().launches)==1 and 'Launch54.ps1' in lua.globals().launches[1]
    assert not (p/'bus/ready.json').exists()
print('PASS actual Lua connector: ready/timer/mailbox, native timeline/media/timecode APIs, exact video-track frame placement, overlap isolation, owned-output deletion and wrong-project/script rejection; SDK model, not Resolve itself.')
