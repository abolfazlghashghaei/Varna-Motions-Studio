param([ValidateSet('Premiere','Resolve')][string]$HostApp='Premiere')
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
foreach($required in @('plugin.html','premiere.html','js/plugin53.js','js/titles53.js','tools/vendor/runtime53.cjs','integrations/resolve/Motion_Tools.py','assets/fonts/Vazirmatn.woff2')){if(!$known.ContainsKey($required)){throw ('Incomplete manifest: '+$required)}}
foreach($dir in @('js','css','tools','integrations','assets/fonts')){
  foreach($file in Get-ChildItem -LiteralPath (Join-Path $payload $dir) -File -Recurse){
    $relative=$file.FullName.Substring($payload.Length+1).Replace('\','/')
    if(!$known.ContainsKey($relative)){throw ('Unverified package file: '+$relative)}
  }
}
foreach($entry in $package.files) {
  $r=[string]$entry.path
  if($r -match '^(js/|css/|tools/|integrations/|premiere\.html$|plugin\.html$|assets/fonts/|assets/varna-logo\.svg$)') {
    $file=Join-Path $payload $r
    if(!(Test-Path -LiteralPath $file -PathType Leaf) -or (Get-Item -LiteralPath $file).Length -ne $entry.bytes -or (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.sha256) { throw ('Package verification failed: '+$r) }
  }
}
function Copy-SharedTools53([string]$destination) {
  New-Item -ItemType Directory -Path $destination -Force | Out-Null
  foreach($name in @('js','css','tools','integrations')) { Copy-Item -LiteralPath (Join-Path $payload $name) -Destination $destination -Recurse }
  # No NLE entry, controls or stylesheet are installed in either other host.
  foreach($name in @('js\editor51.js','js\studio51.js','js\studio52.js','js\nle53.js','js\timeline53-core.js','js\ai52-ui.js','css\editor51.css','css\nle53.css')) {
    $owned=Join-Path $destination $name
    if(Test-Path -LiteralPath $owned){Remove-Item -LiteralPath $owned -Force}
  }
  New-Item -ItemType Directory -Path (Join-Path $destination 'assets') -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $payload 'assets\fonts') -Destination (Join-Path $destination 'assets') -Recurse
  Copy-Item -LiteralPath (Join-Path $payload 'assets\varna-logo.svg') -Destination (Join-Path $destination 'assets')
  Copy-Item -LiteralPath (Join-Path $payload 'plugin.html') -Destination $destination
}
if ($HostApp -eq 'Premiere') {
  $target=Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.varnalabs.editstudio.premiere'
} else {
  $target=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Hosts\Resolve'
}
$staged=$target+'.stage-'+[guid]::NewGuid().ToString('N')
$backup=$target+'.backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N').Substring(0,6)
try {
  Copy-SharedTools53 $staged
  if($HostApp -eq 'Premiere') {
    Copy-Item -LiteralPath (Join-Path $payload 'premiere.html') -Destination $staged
    New-Item -ItemType Directory -Path (Join-Path $staged 'CSXS') -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'premiere\CSXS\manifest.xml') -Destination (Join-Path $staged 'CSXS\manifest.xml')
  }
  if(Test-Path -LiteralPath $target){Move-Item -LiteralPath $target -Destination $backup}
  try { Move-Item -LiteralPath $staged -Destination $target } catch { if(Test-Path -LiteralPath $backup){Move-Item -LiteralPath $backup -Destination $target};throw }
  if($HostApp -eq 'Premiere') {
    foreach($version in @(12,13)) { $key='HKCU:\Software\Adobe\CSXS.'+$version;New-Item -Path $key -Force | Out-Null;New-ItemProperty -Path $key -Name PlayerDebugMode -Value '1' -PropertyType String -Force | Out-Null }
    Write-Host 'Installed shared Motion Tools. Restart Premiere > Extensions (Legacy) > Motion Tools.'
  } else {
    $utility=Join-Path $env:APPDATA 'Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts\Utility'
    New-Item -ItemType Directory -Path $utility -Force | Out-Null
    foreach($name in @('Motion_Tools.py','Import_Title.py','Motion_Tools.json')) {
      $owned=Join-Path $utility $name
      if(Test-Path -LiteralPath $owned){Copy-Item -LiteralPath $owned -Destination ($owned+'.backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N').Substring(0,6))}
    }
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'resolve\Motion_Tools.py') -Destination (Join-Path $utility 'Motion_Tools.py') -Force
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'resolve\Video_Studio.py') -Destination (Join-Path $utility 'Import_Title.py') -Force
    @{server=(Join-Path $target 'tools\editor51-server.cjs');port=8795} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $utility 'Motion_Tools.json') -Encoding UTF8
    Write-Host 'Installed shared tools. Resolve > Workspace > Scripts > Utility > Motion_Tools.'
    Write-Host 'Import_Title places editable Text+ graphics on a video track. Node.js 18+ is required for the tools window.'
  }
} finally { if(Test-Path -LiteralPath $staged){Remove-Item -LiteralPath $staged -Recurse -Force} }
