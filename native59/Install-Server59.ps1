param([string]$RuntimeArchive='')
$ErrorActionPreference='Stop'
$source=Split-Path $PSScriptRoot -Parent
$payload=Join-Path $source 'Varna_Motion_Studio'
# The workspace installer verifies/reuses the same runtime used by the other hosts.
& (Join-Path $payload 'integrations\INSTALL_CROSS_HOST_WINDOWS.ps1') -HostApp Editor -RuntimeArchive $RuntimeArchive
$root=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Connect58'
$service=Join-Path $root 'Service59'
$stage=$service+'.stage-'+[guid]::NewGuid().ToString('N')
try {
 New-Item -ItemType Directory (Join-Path $stage 'connect58'),(Join-Path $stage 'Varna_Motion_Studio\js'),(Join-Path $stage 'bin') -Force|Out-Null
 foreach($name in @('server.cjs','Start-Internet58.ps1','tunnel-version.json','CLOUDFLARED_LICENSE')){Copy-Item -LiteralPath (Join-Path $source ('connect58\'+$name)) -Destination (Join-Path $stage 'connect58')}
 Copy-Item -LiteralPath (Join-Path $payload 'js\editor51-core.js') -Destination (Join-Path $stage 'Varna_Motion_Studio\js')
 $manifest=Get-Content -LiteralPath (Join-Path $payload 'PACKAGE_MANIFEST.json') -Raw -Encoding UTF8|ConvertFrom-Json
 $entry=@($manifest.files|Where-Object {$_.path -eq 'assets/vendor/Railcut/Railcut/bin/win/ffmpeg.exe'})[0]
 $ffmpeg=Join-Path $payload $entry.path
 if(!$entry -or !(Test-Path -LiteralPath $ffmpeg) -or (Get-FileHash -LiteralPath $ffmpeg -Algorithm SHA256).Hash -ne $entry.sha256){throw 'Bundled FFmpeg validation failed'}
 Copy-Item -LiteralPath $ffmpeg -Destination (Join-Path $stage 'bin\ffmpeg.exe')
 New-Item -ItemType Directory $root -Force|Out-Null
 $config=Join-Path $root 'server.json'
 if(Test-Path -LiteralPath $config){$cfg=Get-Content -LiteralPath $config -Raw -Encoding UTF8|ConvertFrom-Json}else{
  $bytes=New-Object byte[] 32;$rng=[Security.Cryptography.RandomNumberGenerator]::Create();try{$rng.GetBytes($bytes)}finally{$rng.Dispose()}
  $cfg=[pscustomobject]@{token=([BitConverter]::ToString($bytes)).Replace('-','').ToLower();bind='127.0.0.1';port=8798;whisper='';model=''}
 }
 $cfg|Add-Member -MemberType NoteProperty -Name ffmpeg -Value (Join-Path $service 'bin\ffmpeg.exe') -Force
 if(Test-Path -LiteralPath $service){Move-Item -LiteralPath $service -Destination ($service+'.backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))}
 Move-Item -LiteralPath $stage -Destination $service
 $cfg|ConvertTo-Json|Set-Content -LiteralPath $config -Encoding UTF8
 $spec=Get-Content -LiteralPath (Join-Path $payload 'integrations\resolve\runtime54.json') -Raw|ConvertFrom-Json
 $exe=Join-Path $env:LOCALAPPDATA ('VarnaMotionStudio\Runtime54\'+$spec.version+'\electron.exe')
 $launch=Join-Path $root 'START_SERVER.cmd'
 [IO.File]::WriteAllText($launch,"@echo off`r`nset ELECTRON_RUN_AS_NODE=1`r`n`"$exe`" `"$(Join-Path $service 'connect58\server.cjs')`"`r`npause`r`n")
 $shell=New-Object -ComObject WScript.Shell
 $link=$shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'Personal Processing Server.lnk'));$link.TargetPath=$launch;$link.Save()
 $internet=$shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'Personal Server - Internet.lnk'));$internet.TargetPath='powershell.exe';$internet.Arguments='-NoProfile -ExecutionPolicy Bypass -File "'+(Join-Path $service 'connect58\Start-Internet58.ps1')+'"';$internet.Save()
 Write-Host 'Personal server installed. Existing pairing key and speech-model settings were preserved.'
 Write-Host ('Settings: '+$config)
} finally {if(Test-Path -LiteralPath $stage){Remove-Item -LiteralPath $stage -Recurse -Force}}
