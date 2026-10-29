param([ValidateSet('Premiere','Resolve','Editor')][string]$HostApp='Premiere',[string]$RuntimeArchive='')
$ErrorActionPreference='Stop'
$payload=Split-Path $PSScriptRoot -Parent
$package=Get-Content -LiteralPath (Join-Path $payload 'PACKAGE_MANIFEST.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if($package.version -ne '4.5.0-rc.47' -or @($package.files).Count -lt 100){throw 'Invalid package manifest'}
$known=@{}
foreach($entry in $package.files){
  $r=[string]$entry.path
  if($r -match '(^/|\\|:|(^|/)\.\.(/|$))' -or $known.ContainsKey($r)){throw 'Unsafe or duplicate manifest path'}
  $known[$r]=$entry
}
foreach($required in @('plugin.html','premiere.html','resolve.html','editor.html','js/plugin53.js','js/titles53.js','tools/vendor/runtime53.cjs','integrations/resolve/Motion_Tools.py','assets/fonts/Vazirmatn.woff2')){if(!$known.ContainsKey($required)){throw ('Incomplete manifest: '+$required)}}
foreach($dir in @('js','css','tools','integrations','assets/fonts','assets/text55','assets/templates38','assets/sfx','assets/vendor/ui30','assets/vendor/rebound49','assets/vendor/conjure49')){
  foreach($file in Get-ChildItem -LiteralPath (Join-Path $payload $dir) -File -Recurse -Force){
    $relative=$file.FullName.Substring($payload.Length+1).Replace('\','/')
    if($relative -like 'assets/templates38/source-projects/*'){continue}
    if(!$known.ContainsKey($relative)){throw ('Unverified package file: '+$relative)}
  }
}
foreach($entry in $package.files) {
  $r=[string]$entry.path
  if($r -like 'assets/templates38/source-projects/*'){continue}
  if($r -cmatch '^assets/vendor/.*/(?:LICENSE|NOTICE|UPSTREAM)(?:\.[^/]*)?$' -or $r -match '^(js/|css/|tools/|integrations/|premiere\.html$|editor\.html$|resolve\.html$|plugin\.html$|assets/(fonts/|text55/|templates38/|sfx/|vendor/(ui30/|rebound49/|conjure49/))|assets/varna-logo\.svg$)') {
    $file=Join-Path $payload $r
    if(!(Test-Path -LiteralPath $file -PathType Leaf) -or (Get-Item -LiteralPath $file -Force).Length -ne $entry.bytes -or (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.sha256) { throw ('Package verification failed: '+$r) }
  }
}
function Copy-SharedTools53([string]$destination) {
  New-Item -ItemType Directory -Path $destination -Force | Out-Null
  foreach($name in @('js','css','tools','integrations')) { Copy-Item -LiteralPath (Join-Path $payload $name) -Destination $destination -Recurse -Force }
  # No NLE entry, controls or stylesheet are installed in either other host.
  if($HostApp -ne 'Editor'){foreach($name in @('js\editor51.js','js\studio51.js','js\studio52.js','js\nle53.js','js\timeline53-core.js','js\ai52-ui.js','js\production54.js','js\layout55.js','css\layout55.css','css\editor51.css','css\nle53.css')) {
    $owned=Join-Path $destination $name
    if(Test-Path -LiteralPath $owned){Remove-Item -LiteralPath $owned -Force}
  }}
  New-Item -ItemType Directory -Path (Join-Path $destination 'assets') -Force | Out-Null
  foreach($asset in @('sfx','text55')){Copy-Item -LiteralPath (Join-Path $payload ('assets\'+$asset)) -Destination (Join-Path $destination 'assets') -Recurse -Force}
  $templates=Join-Path $destination 'assets\templates38'
  New-Item -ItemType Directory -Path $templates -Force | Out-Null
  foreach($child in Get-ChildItem -LiteralPath (Join-Path $payload 'assets\templates38') -Force){if($child.Name -ne 'source-projects'){Copy-Item -LiteralPath $child.FullName -Destination $templates -Recurse -Force}}
  New-Item -ItemType Directory -Path (Join-Path $destination 'assets\vendor') -Force | Out-Null
  foreach($vendor in @('ui30','rebound49','conjure49')){Copy-Item -LiteralPath (Join-Path $payload ('assets\vendor\'+$vendor)) -Destination (Join-Path $destination 'assets\vendor') -Recurse -Force}
  Copy-Item -LiteralPath (Join-Path $payload 'assets\fonts') -Destination (Join-Path $destination 'assets') -Recurse
  Copy-Item -LiteralPath (Join-Path $payload 'assets\varna-logo.svg') -Destination (Join-Path $destination 'assets')
  foreach($entry in $package.files){if($entry.path -cmatch '^assets/vendor/.*/(?:LICENSE|NOTICE|UPSTREAM)(?:\.[^/]*)?$'){$notice=Join-Path $destination $entry.path;New-Item -ItemType Directory -Path (Split-Path $notice -Parent) -Force | Out-Null;Copy-Item -LiteralPath (Join-Path $payload $entry.path) -Destination $notice -Force}}
  Copy-Item -LiteralPath (Join-Path $payload 'plugin.html') -Destination $destination
}
if ($HostApp -eq 'Premiere') {
  $target=Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.varnalabs.editstudio.premiere'
} else {
  $target=Join-Path $env:LOCALAPPDATA ('VarnaMotionStudio\Hosts\'+$HostApp)
}
if($HostApp -ne 'Premiere'){
  $spec=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'resolve\runtime54.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  $runtime=Join-Path $env:LOCALAPPDATA ('VarnaMotionStudio\Runtime54\'+$spec.version)
  $marker=Join-Path $runtime 'VERIFIED_RUNTIME54.json'
  $valid=$false
  if(Test-Path -LiteralPath $marker){try{$r=Get-Content -LiteralPath $marker -Raw | ConvertFrom-Json;$valid=$r.archiveSha256 -eq $spec.sha256 -and @($r.files).Count -ge 4;foreach($entry in $r.files){$file=Join-Path $runtime $entry.path;if(!(Test-Path -LiteralPath $file -PathType Leaf) -or (Get-Item -LiteralPath $file -Force).Length -ne $entry.bytes -or (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.sha256){$valid=$false;break}}}catch{$valid=$false}}
  if(!$valid){
    $cache=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Cache54'
    New-Item -ItemType Directory -Path $cache -Force | Out-Null
    $archive=if($RuntimeArchive){$RuntimeArchive}else{Join-Path $cache $spec.name}
    if(!$RuntimeArchive -and (!(Test-Path -LiteralPath $archive) -or (Get-Item -LiteralPath $archive -Force).Length -ne $spec.bytes -or (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $spec.sha256)){
      Write-Host ('Downloading official verified Motion Tools runtime: '+[math]::Round($spec.bytes/1MB)+' MB')
      [Net.ServicePointManager]::SecurityProtocol=[Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
      $download=$archive+'.download'
      try{(New-Object Net.WebClient).DownloadFile($spec.url,$download);Move-Item -LiteralPath $download -Destination $archive -Force}finally{if(Test-Path -LiteralPath $download){Remove-Item -LiteralPath $download -Force}}
    }
    if(!(Test-Path -LiteralPath $archive) -or (Get-Item -LiteralPath $archive -Force).Length -ne $spec.bytes -or (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $spec.sha256){throw 'Official runtime checksum failed. No plugin activation was attempted.'}
    $extract=$runtime+'.stage-'+[guid]::NewGuid().ToString('N')
    try{
      Expand-Archive -LiteralPath $archive -DestinationPath $extract
      foreach($required in @('electron.exe','resources\default_app.asar','LICENSE','LICENSES.chromium.html')){if(!(Test-Path -LiteralPath (Join-Path $extract $required))){throw ('Incomplete official runtime: '+$required)}}
      $runtimeFiles=@(Get-ChildItem -LiteralPath $extract -File -Recurse -Force | ForEach-Object {@{path=$_.FullName.Substring($extract.Length+1);bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash}})
      @{archiveSha256=$spec.sha256;executableSha256=(Get-FileHash -LiteralPath (Join-Path $extract 'electron.exe') -Algorithm SHA256).Hash;files=$runtimeFiles} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $extract 'VERIFIED_RUNTIME54.json') -Encoding UTF8
      if(Test-Path -LiteralPath $runtime){Move-Item -LiteralPath $runtime -Destination ($runtime+'.backup-'+[guid]::NewGuid().ToString('N').Substring(0,8))}
      New-Item -ItemType Directory -Path (Split-Path $runtime -Parent) -Force | Out-Null
      Move-Item -LiteralPath $extract -Destination $runtime
    }finally{if(Test-Path -LiteralPath $extract){Remove-Item -LiteralPath $extract -Recurse -Force}}
  }
}
$staged=$target+'.stage-'+[guid]::NewGuid().ToString('N')
$backup=$target+'.backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N').Substring(0,6)
$activated54=$false
try {
  Copy-SharedTools53 $staged
  @{level='Studio';version='4.5.0-rc.47';build='Studio54';host=$HostApp;packs=@('shared-production','sfx')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $staged 'INSTALL_PROFILE.json') -Encoding UTF8
  if($HostApp -eq 'Resolve'){Copy-Item -LiteralPath (Join-Path $payload 'resolve.html') -Destination $staged}
  if($HostApp -eq 'Editor'){Copy-Item -LiteralPath (Join-Path $payload 'editor.html') -Destination $staged}
  if($HostApp -eq 'Premiere') {
    Copy-Item -LiteralPath (Join-Path $payload 'premiere.html') -Destination $staged
    New-Item -ItemType Directory -Path (Join-Path $staged 'CSXS') -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'premiere\CSXS\manifest.xml') -Destination (Join-Path $staged 'CSXS\manifest.xml')
  }
  if(Test-Path -LiteralPath $target){Move-Item -LiteralPath $target -Destination $backup}
  try { Move-Item -LiteralPath $staged -Destination $target;$activated54=$true } catch { if(Test-Path -LiteralPath $backup){Move-Item -LiteralPath $backup -Destination $target};throw }
  if($HostApp -eq 'Premiere') {
    if($env:OS -eq 'Windows_NT'){foreach($version in @(11,12,13)) { $key='HKCU:\Software\Adobe\CSXS.'+$version;New-Item -Path $key -Force | Out-Null;New-ItemProperty -Path $key -Name PlayerDebugMode -Value '1' -PropertyType String -Force | Out-Null }}
    Write-Host 'Installed shared Motion Tools. Restart Premiere > Extensions (Legacy) > Motion Tools.'
  } elseif($HostApp -eq 'Resolve') {
    $utility=Join-Path $env:APPDATA 'Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts\Utility'
    New-Item -ItemType Directory -Path $utility -Force | Out-Null
    $runtime=Join-Path $env:LOCALAPPDATA ('VarnaMotionStudio\Runtime54\'+$spec.version)
    $exe=Join-Path $runtime 'electron.exe'
    $bus=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\ResolveBus54'
    New-Item -ItemType Directory -Path $bus -Force | Out-Null
    $cfg=@{bus=$bus;electron=$exe;executableSha256=(Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash}
    $cfg | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $target 'integrations\resolve\runtime54-user.json') -Encoding UTF8
    $lua=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'resolve\Motion_Tools.lua') -Raw -Encoding UTF8
    if($target.Contains(']]')){throw 'Unsupported closing bracket sequence in installation path'}
    $lua=$lua.Replace('__VARNA_ROOT54__',$target.Replace('\','/'))
    foreach($name in @('Motion_Tools.lua','Motion_Tools.py','Motion_Tools.json','Import_Title.py')){
      $owned=Join-Path $utility $name
      if(Test-Path -LiteralPath $owned){Copy-Item -LiteralPath $owned -Destination ($owned+'.backup-'+[guid]::NewGuid().ToString('N').Substring(0,8))}
    }
    [IO.File]::WriteAllText((Join-Path $utility 'Motion_Tools.lua'),$lua,(New-Object System.Text.UTF8Encoding($false)))
    $old=Join-Path $utility 'Motion_Tools.py'
    if((Test-Path -LiteralPath $old) -and (Get-Content -LiteralPath $old -Raw).Contains('Open the shared production tools')){Move-Item -LiteralPath $old -Destination ($old+'.retired-'+[guid]::NewGuid().ToString('N').Substring(0,8))}
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'resolve\Video_Studio.py') -Destination (Join-Path $utility 'Import_Title.py') -Force
    Write-Host 'Installed full production tools. Resolve > Workspace > Scripts > Utility > Motion_Tools (Lua).'
    Write-Host 'Keep the small connection window open. The tools app uses the verified bundled runtime; Python and Node PATH are not required.'

  } else {
    $exe=Join-Path (Join-Path $env:LOCALAPPDATA ('VarnaMotionStudio\Runtime54\'+$spec.version)) 'electron.exe'
    $launch=Join-Path $target 'OPEN_WORKSPACE.cmd'
    $entry=Join-Path $target 'integrations\resolve\main54.cjs'
    [IO.File]::WriteAllText($launch,('@echo off'+[Environment]::NewLine+'set ELECTRON_RUN_AS_NODE='+[Environment]::NewLine+'"'+$exe+'" "'+$entry+'" --workspace=editor'+[Environment]::NewLine),(New-Object System.Text.UTF8Encoding($false)))
    Write-Host ('Installed full AE editing workspace: '+$launch)

  }
} catch {
  $failure54=$_
  if($activated54 -and (Test-Path -LiteralPath $target)){Move-Item -LiteralPath $target -Destination ($target+'.failed-'+[guid]::NewGuid().ToString('N').Substring(0,8));if(Test-Path -LiteralPath $backup){Move-Item -LiteralPath $backup -Destination $target}}
  throw $failure54
} finally { if(Test-Path -LiteralPath $staged){Remove-Item -LiteralPath $staged -Recurse -Force} }
