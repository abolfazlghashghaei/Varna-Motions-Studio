function Restore-VerifiedVarnaComponent {
    param(
        [Parameter(Mandatory=$true)][string]$DownloadPath,
        [Parameter(Mandatory=$true)][string]$TargetPath,
        [Parameter(Mandatory=$true)][string]$ExpectedHash,
        [Parameter(Mandatory=$true)][long]$ExpectedBytes,
        [string]$OriginalHash,
        [scriptblock]$MoveFile = { param($from, $to) [IO.File]::Move($from, $to) }
    )
    $ErrorActionPreference = 'Stop'
    $download = Get-Item -LiteralPath $DownloadPath -Force
    if ($download.Length -ne $ExpectedBytes -or (Get-FileHash -LiteralPath $DownloadPath -Algorithm SHA256).Hash -ne $ExpectedHash) { throw 'Downloaded component failed checksum verification.' }
    $backup = $null
    if (Test-Path -LiteralPath $TargetPath) {
        if (!$OriginalHash -or (Get-FileHash -LiteralPath $TargetPath -Algorithm SHA256).Hash -ne $OriginalHash) { throw 'The target changed while downloading; no file was replaced.' }
        $backup = Join-Path ([IO.Path]::GetDirectoryName($TargetPath)) ('vbak-' + [guid]::NewGuid().ToString('N').Substring(0,8))
        & $MoveFile $TargetPath $backup
    } elseif ($OriginalHash) { throw 'The original target disappeared; no file was replaced.' }
    try {
        & $MoveFile $DownloadPath $TargetPath
        if ((Get-Item -LiteralPath $TargetPath).Length -ne $ExpectedBytes -or (Get-FileHash -LiteralPath $TargetPath -Algorithm SHA256).Hash -ne $ExpectedHash) { throw 'Restored component failed checksum verification.' }
    } catch {
        if ($backup -and (Test-Path -LiteralPath $backup)) {
            if (Test-Path -LiteralPath $TargetPath) {
                $failed = Join-Path ([IO.Path]::GetDirectoryName($TargetPath)) ('vbad-' + [guid]::NewGuid().ToString('N').Substring(0,8))
                [IO.File]::Move($TargetPath, $failed)
            }
            [IO.File]::Move($backup, $TargetPath)
        }
        throw
    }
    if ($backup -and (Test-Path -LiteralPath $backup)) {
        try { Remove-Item -LiteralPath $backup -Force -ErrorAction Stop }
        catch { Write-Warning ('Component restored; the old pointer backup remains at ' + $backup) }
    }
}
Export-ModuleMember -Function Restore-VerifiedVarnaComponent
