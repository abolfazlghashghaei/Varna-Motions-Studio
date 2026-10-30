$ErrorActionPreference='Stop'
$root=Join-Path ([IO.Path]::GetTempPath()) ('server59-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory $root|Out-Null
$oldLocal=$env:LOCALAPPDATA;$env:LOCALAPPDATA=Join-Path $root 'local'
try{
$payload=Join-Path $root 'Varna_Motion_Studio';foreach($dir in @('integrations/resolve','js','assets/vendor/Railcut/Railcut/bin/win')){New-Item -ItemType Directory (Join-Path $payload $dir) -Force|Out-Null};New-Item -ItemType Directory (Join-Path $root 'connect58') -Force|Out-Null
[IO.File]::WriteAllText((Join-Path $payload 'integrations/INSTALL_CROSS_HOST_WINDOWS.ps1'),"param(`$HostApp,`$RuntimeArchive)`nif(`$HostApp -ne 'Editor'){throw 'Wrong runtime component'}")
[IO.File]::WriteAllText((Join-Path $payload 'integrations/resolve/runtime54.json'),'{"version":"fixture"}')
$sourceRoot=Join-Path $PSScriptRoot '../..';foreach($f in @('server.cjs','Start-Internet58.ps1','tunnel-version.json','CLOUDFLARED_LICENSE')){Copy-Item (Join-Path $sourceRoot ('connect58/'+$f)) (Join-Path $root 'connect58')}
Copy-Item (Join-Path $sourceRoot 'Varna_Motion_Studio/js/editor51-core.js') (Join-Path $payload 'js')
$bin=Join-Path $payload 'assets/vendor/Railcut/Railcut/bin/win/ffmpeg.exe';[IO.File]::WriteAllText($bin,'fixture executable');@{files=@(@{path='assets/vendor/Railcut/Railcut/bin/win/ffmpeg.exe';sha256=(Get-FileHash $bin).Hash})}|ConvertTo-Json -Depth 5|Set-Content (Join-Path $payload 'PACKAGE_MANIFEST.json')
$settings=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio/Connect58';New-Item -ItemType Directory $settings -Force|Out-Null
@{token='keep-pairing-key';bind='127.0.0.1';port=8798;whisper='my-whisper';model='my-model'}|ConvertTo-Json|Set-Content (Join-Path $settings 'server.json')
function New-Object {param([string]$ComObject);if($ComObject -ne 'WScript.Shell'){throw 'Unexpected object'};$obj=[pscustomobject]@{};$obj|Add-Member ScriptMethod CreateShortcut {param($path);$shortcut=[pscustomobject]@{TargetPath='';Arguments=''};$shortcut|Add-Member ScriptMethod Save {};return $shortcut};return $obj}
$scriptText=(Get-Content (Join-Path $PSScriptRoot '../Install-Server59.ps1') -Raw).Replace('$source=Split-Path $PSScriptRoot -Parent',('$source='''+$root.Replace("'","''")+''''))
$scriptText=$scriptText.Replace("[Environment]::GetFolderPath('Desktop')",("'"+$root.Replace("'","''")+"'"))
Invoke-Expression $scriptText
$cfg=Get-Content (Join-Path $settings 'server.json') -Raw|ConvertFrom-Json
if($cfg.token -ne 'keep-pairing-key' -or $cfg.model -ne 'my-model' -or $cfg.whisper -ne 'my-whisper'){throw 'Existing server identity/model settings changed'}
if(!(Test-Path -LiteralPath $cfg.ffmpeg)){throw 'FFmpeg missing'}
$entry=Join-Path $settings 'Service59/connect58/server.cjs';if(!(Test-Path -LiteralPath $entry) -or !(Test-Path (Join-Path $settings 'Service59/Varna_Motion_Studio/js/editor51-core.js'))){throw 'Service/core layout broken'}
Invoke-Expression $scriptText
if(!(Get-ChildItem -LiteralPath $settings -Directory|Where-Object Name -like 'Service59.backup-*')){throw 'Previous service not backed up'}
Write-Host 'PASS59 personal server BAT orchestration: stable service/core/FFmpeg layout, preserved pairing/model settings, shared-runtime delegation and reinstall backup. Windows shortcut COM/runtime execution are modeled.'
}finally{$env:LOCALAPPDATA=$oldLocal;Remove-Item $root -Recurse -Force}
