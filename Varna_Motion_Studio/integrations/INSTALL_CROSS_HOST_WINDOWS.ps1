param([ValidateSet('Premiere','Resolve')][string]$HostApp='Premiere')
$ErrorActionPreference='Stop'
$payload=Split-Path $PSScriptRoot -Parent
$package=Get-Content -LiteralPath (Join-Path $payload 'PACKAGE_MANIFEST.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($entry in $package.files) {
  $r=[string]$entry.path
  if($r -match '^(js/|css/|tools/|integrations/|premiere\.html$|editor\.html$|assets/varna-logo\.svg$)') {
    $file=Join-Path $payload $r
    if(!(Test-Path -LiteralPath $file -PathType Leaf) -or (Get-Item -LiteralPath $file).Length -ne $entry.bytes -or (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.sha256) { throw ('Package verification failed: '+$r) }
  }
}
if ($HostApp -eq 'Premiere') {
  $target=Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.varnalabs.editstudio.premiere'
  $staged=$target+'.stage-'+[guid]::NewGuid().ToString('N')
  $backup=$target+'.backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss')
  New-Item -ItemType Directory -Path $staged -Force | Out-Null
  try {
    foreach($name in @('js','css','tools','integrations')) { Copy-Item -LiteralPath (Join-Path $payload $name) -Destination $staged -Recurse }
    New-Item -ItemType Directory -Path (Join-Path $staged 'assets') -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $payload 'assets\varna-logo.svg') -Destination (Join-Path $staged 'assets')
    Copy-Item -LiteralPath (Join-Path $payload 'editor.html') -Destination $staged
    Copy-Item -LiteralPath (Join-Path $payload 'premiere.html') -Destination $staged
    New-Item -ItemType Directory -Path (Join-Path $staged 'CSXS') -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'premiere\CSXS\manifest.xml') -Destination (Join-Path $staged 'CSXS\manifest.xml')
    if(Test-Path -LiteralPath $target){Move-Item -LiteralPath $target -Destination $backup}
    try { Move-Item -LiteralPath $staged -Destination $target } catch { if(Test-Path -LiteralPath $backup){Move-Item -LiteralPath $backup -Destination $target};throw }
    foreach($version in @(12,13)) { $key='HKCU:\Software\Adobe\CSXS.'+$version;New-Item -Path $key -Force | Out-Null;New-ItemProperty -Path $key -Name PlayerDebugMode -Value '1' -PropertyType String -Force | Out-Null }
    Write-Host ('Installed Premiere CEP panel: '+$target)
    Write-Host 'Restart Premiere; Window > Extensions (Legacy) > Video Studio. CEP must be supported by your Premiere version.'
  } finally { if(Test-Path -LiteralPath $staged){Remove-Item -LiteralPath $staged -Recurse -Force} }
} else {
  $target=Join-Path $env:APPDATA 'Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts\Utility'
  New-Item -ItemType Directory -Path $target -Force | Out-Null
  $file=Join-Path $target 'Video_Studio.py'
  if(Test-Path -LiteralPath $file){Copy-Item -LiteralPath $file -Destination ($file+'.backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))}
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'resolve\Video_Studio.py') -Destination $file -Force
  Write-Host ('Installed Resolve utility: '+$file)
  Write-Host 'Restart Resolve; Workspace > Scripts > Utility > Video_Studio. Python scripting availability depends on your Resolve edition/configuration.'
}
