$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot '..\..\Varna_Motion_Studio\tools\Download59.psm1') -Force
$root=Join-Path ([IO.Path]::GetTempPath()) ('download59-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory $root|Out-Null
try{$full=Join-Path $root 'expected';$bytes=New-Object byte[] (5*1024*1024);for($i=0;$i -lt $bytes.Length;$i++){$bytes[$i]=59};[IO.File]::WriteAllBytes($full,$bytes);$hash=(Get-FileHash $full -Algorithm SHA256).Hash;$target=Join-Path $root 'partial';[IO.File]::WriteAllBytes($target,$bytes[0..(1024*1024-1)]);$log=Join-Path $root 'log.txt'
Receive-VarnaFile59 -Uri 'http://127.0.0.1:8599/file' -Target $target -ExpectedBytes $bytes.Length -Sha256 $hash -LogPath $log -Label 'Resume test'
if((Get-FileHash $target).Hash -ne $hash){throw 'Resume changed file bytes'};if((Get-Content $log -Raw) -notmatch 'MiB/s.*ETA'){throw 'Speed/ETA not logged'}
[IO.File]::WriteAllBytes($target,$bytes[0..(1024*1024-1)]);Receive-VarnaFile59 -Uri 'http://127.0.0.1:8599/ignore' -Target $target -ExpectedBytes $bytes.Length -Sha256 $hash -Label 'Range ignored test'
if((Get-FileHash $target).Hash -ne $hash){throw 'Server ignoring Range corrupted data'};Write-Host 'PASS59 actual HTTP transfer: resumed bytes, server-ignored Range restart, exact size/SHA, measured speed/ETA log'
}finally{Remove-Item $root -Recurse -Force}
