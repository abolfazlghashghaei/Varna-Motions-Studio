$ErrorActionPreference='Stop'
$package=Split-Path $PSScriptRoot -Parent
$tmp=Join-Path ([IO.Path]::GetTempPath()) ('prepare603-'+[guid]::NewGuid().ToString('N'))
try{
 New-Item -ItemType Directory (Join-Path $tmp 'Varna_Motion_Studio/tools'),(Join-Path $tmp 'Varna_Motion_Studio/assets/vendor/Railcut/Railcut/bin/mac') -Force|Out-Null
 foreach($f in @('PREPARE_GITHUB_DOWNLOAD.ps1','VarnaDownload.psm1','Varna_Motion_Studio/tools/Download59.psm1')){Copy-Item -LiteralPath (Join-Path $package $f) -Destination (Join-Path $tmp $f)}
 $relative='assets/vendor/Railcut/Railcut/bin/mac/ffmpeg';$target=Join-Path $tmp ('Varna_Motion_Studio/'+$relative)
 [IO.File]::WriteAllText($target,'verified test component')
 $hash=(Get-FileHash $target -Algorithm SHA256).Hash
 @{version='4.5.0-rc.47';files=@(@{path=$relative;bytes=(Get-Item $target).Length;sha256=$hash})}|ConvertTo-Json -Depth 5|Set-Content (Join-Path $tmp 'Varna_Motion_Studio/PACKAGE_MANIFEST.json')
 $shell=(Get-Process -Id $PID).Path
 & $shell -NoProfile -File (Join-Path $tmp 'PREPARE_GITHUB_DOWNLOAD.ps1')
 if($LASTEXITCODE -ne 0){throw 'Actual preparation entrypoint failed to load packaged helpers'}
 Import-Module (Join-Path $tmp 'VarnaDownload.psm1') -Force
 $download=Join-Path $tmp 'download';[IO.File]::WriteAllText($download,'replacement component')
 $newHash=(Get-FileHash $download).Hash
 Restore-VerifiedVarnaComponent -DownloadPath $download -TargetPath $target -ExpectedHash $newHash -ExpectedBytes (Get-Item $download).Length -OriginalHash $hash
 if((Get-FileHash $target).Hash -ne $newHash){throw 'Component restoration failed'}
 Write-Host 'PASS603 actual preparation subprocess, packaged module imports, already-verified skip and verified component replacement. No network needed.'
}finally{Remove-Item -LiteralPath $tmp -Recurse -Force}
