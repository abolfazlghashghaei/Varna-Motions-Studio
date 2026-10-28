-- Native Resolve connector. No Python interpreter, Node PATH lookup or TCP listener.
-- The installer replaces this placeholder with its verified shared-tools directory.
local root = [[__VARNA_ROOT54__]]
local function loadJSON()
  local code,why=loadfile(root..'/integrations/resolve/lib/json.lua')
  if not code then error(why) end
  return code()
end
local json=loadJSON()
local function read(path)
  local f=io.open(path,'rb');if not f then return nil end
  local s=f:read('*a');f:close();s=s:gsub('^\239\187\191','');return json.decode(s)
end
local cfg=assert(read(root..'/integrations/resolve/runtime54-user.json'),'Missing runtime configuration')
local function write(path,value)
  local f=assert(io.open(path..'.tmp','wb'));f:write(json.encode(value));f:close();os.remove(path);assert(os.rename(path..'.tmp',path))
end
local function openTools()
 local command='powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'..root..'/integrations/resolve/Launch54.ps1"'
 os.execute(command)
end
os.remove(cfg.bus..'/error.json');openTools()
local r=resolve or (bmd and bmd.scriptapp and bmd.scriptapp('Resolve'))
if not r then write(cfg.bus..'/error.json',{message='Resolve scripting is not available in this session'});return end
local fusion=r:Fusion();local ui=fusion and fusion.UIManager
if not ui then write(cfg.bus..'/error.json',{message='Resolve UIManager is not available in this edition/configuration. Local tools opened; the native connector requires a supported Resolve edition.'});return end
local disp=bmd.UIDispatcher(ui)
local existing=ui:FindWindow('MotionToolsConnection54')
if existing then existing:Show();existing:Raise();return end
local win=disp:AddWindow({ID='MotionToolsConnection54',WindowTitle='Motion Tools connection',Geometry={200,150,430,110}},ui:VGroup{ui:Label{ID='Status',Text='Connected. Keep this connector open while using the tools.'},ui:Button{ID='Open',Text='Open Motion Tools'}})
local items=win:GetItems();local session=tostring(os.time())..'-'..tostring(math.random(100000,999999))
local function timeline()
  local project=r:GetProjectManager():GetCurrentProject();local tl=project and project:GetCurrentTimeline()
  assert(tl,'Open a Resolve project and timeline first');return project,tl
end
local function fps(tl)local v=tl:GetSetting('timelineFrameRate');return tonumber(tostring(v):match('[%d%.]+')) or 30 end
local function tcFrames(tc,rate)
 local h,m,s,f=tostring(tc):match('(%d+):(%d+):(%d+)[:;](%d+)');if not h then return 0 end
 local nominal=math.floor(rate+.5);local count=(tonumber(h)*3600+tonumber(m)*60+tonumber(s))*nominal+tonumber(f);if tostring(tc):find(';') then local mins=tonumber(h)*60+tonumber(m);count=count-math.floor(nominal/15+.5)*(mins-math.floor(mins/10)) end;return count
end
local function info()
 local project,tl=timeline();local rate=fps(tl);local begin=tl:GetStartFrame();local marks={}
 for frame,m in pairs(tl:GetMarkers() or {}) do marks[#marks+1]={time=tonumber(frame)/rate,comment=(m.note and m.note~='' and m.note) or m.name or '',duration=(tonumber(m.duration) or 0)/rate} end
 table.sort(marks,function(a,b)return a.time<b.time end)
 return {id=tl:GetUniqueId(),compId=tl:GetUniqueId(),name=tl:GetName(),width=tonumber(tl:GetSetting('timelineResolutionWidth')) or 1920,height=tonumber(tl:GetSetting('timelineResolutionHeight')) or 1080,frameRate=rate,duration=math.max(.1,(tl:GetEndFrame()-begin)/rate),time=math.max(0,(tcFrames(tl:GetCurrentTimecode(),rate)-begin)/rate),workAreaStart=0,workAreaDuration=math.max(.1,(tl:GetEndFrame()-begin)/rate),markers=marks,layers=tl:GetTrackCount('video'),host='DaVinci Resolve',saved=false,file=''}
end
local function source()
 local _,tl=timeline();local c=tl:GetCurrentVideoItem();assert(c,'Place the Resolve playhead over a video clip');local media=c:GetMediaPoolItem();local file=media and media:GetClipProperty('File Path');assert(file and file~='','The selected clip has no file source')
 local q=info();local offset=c:GetLeftOffset() or 0
 return {path=file,kind='file',layer=c:GetName(),layerType='footage',comp=q.name,compId=q.id,compWidth=q.width,compHeight=q.height,fps=q.frameRate,sourceStart=offset/q.frameRate,sourceDuration=c:GetDuration()/q.frameRate,layerIn=(c:GetStart()-tl:GetStartFrame())/q.frameRate,layerOut=(c:GetEnd()-tl:GetStartFrame())/q.frameRate,stretch=100}
end
local function execute(method,p)
 if method=='ping' then return {host='DaVinci Resolve',revision='studio54'} end
 if method=='sequence' then return info() end
 if method=='source' then return source() end
 local project,tl=timeline()
 if method=='save' then assert(r:GetProjectManager():SaveProject(),'Resolve could not save');return {saved=true,file=''} end
 if method=='setTime' then local rate=fps(tl);local n=tl:GetStartFrame()+math.floor(tonumber(p.time)*rate+.5);local nominal=math.floor(rate+.5);local sep=':';if tostring(tl:GetCurrentTimecode()):find(';') then local drop=math.floor(nominal/15+.5);local ten=nominal*600-drop*9;local minute=nominal*60-drop;local d=math.floor(n/ten);local rem=n%ten;n=n+drop*9*d;if rem>=drop then n=n+drop*math.floor((rem-drop)/minute) end;sep=';' end;local tc=string.format('%02d:%02d:%02d'..sep..'%02d',math.floor(n/nominal/3600),math.floor(n/nominal/60)%60,math.floor(n/nominal)%60,n%nominal);assert(tl:SetCurrentTimecode(tc),'Resolve refused the playhead position');return {time=p.time} end
 if method=='assets' then local files={};for _,a in ipairs(p.assets or {}) do if a.enabled~=false then files[#files+1]=a.path end end;local imported=project:GetMediaPool():ImportMedia(files);assert(imported,'Resolve media import failed');return {imported=#imported} end
 if method=='timeline' then local out=info();out.items={};for _,kind in ipairs({'video','audio'}) do for track=1,tl:GetTrackCount(kind) do for _,c in ipairs(tl:GetItemListInTrack(kind,track) or {}) do local media=c:GetMediaPoolItem();out.items[#out.items+1]={name=c:GetName(),start=(c:GetStart()-tl:GetStartFrame())/out.frameRate,['end']=(c:GetEnd()-tl:GetStartFrame())/out.frameRate,track=track,kind=kind,path=media and media:GetClipProperty('File Path') or '',sourceStart=(c:GetLeftOffset() or 0)/out.frameRate} end end end;return out end
 if method=='writeMarker' then
  local at=tonumber(p.start);local duration=tonumber(p.duration);assert(at and at>=0 and duration and duration>0 and duration<=86400,'Invalid marker range');assert(type(p.id)=='string' and p.id~='' and type(p.comment)=='string' and #p.comment<=4000,'Invalid marker');local frame=math.floor(at*fps(tl)+.5);local owned='motion54:'..p.id;local marks=tl:GetMarkers() or {};local existing=marks[frame];assert(not existing or existing.customData==owned,'A different marker occupies this frame')
  if existing then assert(tl:DeleteMarkerAtFrame(frame),'Could not replace the owned marker') end
  local ok=tl:AddMarker(frame,'Cyan',tostring(p.label or 'Production cue'),p.comment,math.max(1,math.ceil(duration*fps(tl))),owned)
  if not ok then if existing then tl:AddMarker(frame,existing.color,existing.name,existing.note,existing.duration,existing.customData) end;error('Resolve rejected the marker') end
  for old,m in pairs(marks) do if old~=frame and m.customData==owned then tl:DeleteMarkerAtFrame(old) end end
  return {start=at,duration=duration}
 end
 if method=='removeGraphic' then assert(tostring(p.projectId)==tostring(tl:GetUniqueId()),'Timeline changed; previous output preserved');for track=1,tl:GetTrackCount('video') do for _,c in ipairs(tl:GetItemListInTrack('video',track) or {}) do local media=c:GetMediaPoolItem();if c:GetUniqueId()==p.nodeId and media and media:GetClipProperty('File Path')==p.path then assert(tl:DeleteClips({c},false),'Previous graphic could not be removed');return {removed=1} end end end;return {removed=0} end
 if method=='graphic' or method=='audio' then
  local rate=fps(tl);local at=tonumber(p.start);local duration=tonumber(p.duration);assert(at and at>=0 and duration and duration>0,'Invalid graphic time range');local begin=tl:GetStartFrame()+math.floor(at*rate+.5);local finish=begin+math.ceil(duration*rate);local kind=method=='audio' and 'audio' or 'video';local target=nil
  for track=tl:GetTrackCount(kind),1,-1 do local free=true;for _,c in ipairs(tl:GetItemListInTrack(kind,track) or {}) do if c:GetEnd()>begin and c:GetStart()<finish then free=false;break end end;if free then target=track;break end end
  if not target then assert(tl:AddTrack(kind),'Add an empty destination track');target=tl:GetTrackCount(kind) end
  local media=project:GetMediaPool():ImportMedia({p.path});assert(media and media[1],'Resolve could not import the rendered media');local clips=project:GetMediaPool():AppendToTimeline({{mediaPoolItem=media[1],startFrame=0,endFrame=math.ceil(duration*rate)-1,mediaType=kind=='video' and 1 or 2,trackIndex=target,recordFrame=begin}});assert(clips and clips[1],'Resolve insertion was not confirmed');return {videoTrack=kind=='video' and target-1 or nil,audioTrack=kind=='audio' and target-1 or nil,start=at,duration=duration,nodeId=clips[1]:GetUniqueId(),graphic=kind=='video'}
 end
 error('Unsupported Resolve operation: '..tostring(method))
end

local timer=ui:Timer{ID='MotionToolsPoll54',Interval=100,SingleShot=false}
local last=0
function disp.On.Timeout(ev)
 if ev.who~=timer.ID then return end
 if os.time()~=last then last=os.time();write(cfg.bus..'/ready.json',{session=session,at=last}) end
 for _,entry in ipairs(bmd.readdir(cfg.bus..'/*.request.json') or {}) do
  local name=entry.Name or entry.name
  if name and name:match('^[%w%-]+%.request%.json$') then
   local file=cfg.bus..'/'..name;local request=nil;local valid,data=pcall(read,file)
   if valid then request=data end
   if request and request.session==session and tonumber(request.deadline or 0)>=os.time() and request.id==name:gsub('%.request%.json$','') then
    os.remove(file);local ok,result=pcall(execute,request.method,request.payload or {})
    write(cfg.bus..'/'..request.id..'.response.json',{id=request.id,session=session,ok=ok,data=ok and result or nil,error=not ok and tostring(result) or nil})
    items.Status.Text=ok and 'Connected · '..request.method or tostring(result)
   elseif request then os.remove(file) end
  end
 end
end
function win.On.Open.Clicked()openTools()end
function win.On.MotionToolsConnection54.Close()timer:Stop();os.remove(cfg.bus..'/ready.json');disp:ExitLoop()end
write(cfg.bus..'/ready.json',{session=session,at=os.time()});win:Show();timer:Start();disp:RunLoop();timer:Stop();win:Hide()
