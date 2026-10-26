$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot '../VarnaDownload.psm1') -Force
$dir=Join-Path ([IO.Path]::GetTempPath()) ('varna-restore-'+[guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($dir)
try {
    $source=Join-Path $dir 'download';$target=Join-Path $dir 'ffmpeg'
    function Setup { [IO.File]::WriteAllText($source,'verified-binary');[IO.File]::WriteAllText($target,'original-pointer') }
    Setup
    $sha=(Get-FileHash $source).Hash;$old=(Get-FileHash $target).Hash;$size=(Get-Item $source).Length
    Restore-VerifiedVarnaComponent $source $target $sha $size $old
    if ((Get-FileHash $target).Hash -ne $sha -or (Test-Path $source)) { throw 'Successful replacement failed.' }
    Write-Host 'PASS existing pointer restored with verified bytes'
    Setup
    $script:moves=0
    $fail={param($a,$b) $script:moves++;if($script:moves -eq 2){throw 'Simulated filesystem refusal'};[IO.File]::Move($a,$b)}
    $caught=$false
    try { Restore-VerifiedVarnaComponent $source $target $sha $size $old -MoveFile $fail } catch { $caught=$true }
    if (!$caught -or (Get-FileHash $target).Hash -ne $old -or (Get-FileHash $source).Hash -ne $sha) { throw 'Rollback/cache retention failed.' }
    Write-Host 'PASS failed activation restores pointer and retains verified download'
    Restore-VerifiedVarnaComponent $source $target $sha $size $old
    if ((Get-FileHash $target).Hash -ne $sha) { throw 'Retry failed.' }
    Write-Host 'PASS retry reuses verified download'
    Setup;[IO.File]::WriteAllText($target,'user-changed-file')
    $caught=$false;try{Restore-VerifiedVarnaComponent $source $target $sha $size $old}catch{$caught=$true}
    if (!$caught -or [IO.File]::ReadAllText($target) -ne 'user-changed-file') { throw 'Changed target overwritten.' }
    Write-Host 'PASS changed target rejected without overwrite'
    Setup;[IO.File]::WriteAllText($source,'bad')
    $caught=$false;try{Restore-VerifiedVarnaComponent $source $target $sha $size $old}catch{$caught=$true}
    if (!$caught -or (Get-FileHash $target).Hash -ne $old) { throw 'Checksum guard failed.' }
    Write-Host 'PASS corrupted download rejected before target mutation'
    Setup;Remove-Item $target
    Restore-VerifiedVarnaComponent $source $target $sha $size
    if ((Get-FileHash $target).Hash -ne $sha) { throw 'Missing target restoration failed.' }
    Write-Host 'PASS absent component restored'
} finally { Remove-Item $dir -Recurse -Force }
