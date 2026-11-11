$ErrorActionPreference = 'Stop'
try {
    if ($env:OS -ne 'Windows_NT') { throw 'This review package is for Windows.' }
    $root = Join-Path $PSScriptRoot 'Varna_Motion_Studio'
    $manifest = Get-Content -LiteralPath (Join-Path $root 'PACKAGE_MANIFEST.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($manifest.version -cne '4.5.0-rc.47' -or $manifest.platform -cne 'Windows' -or @($manifest.files).Count -ne 3348) { throw 'Unexpected UI77 Windows manifest.' }
    $separator = [IO.Path]::DirectorySeparatorChar
    $prefix = [IO.Path]::GetFullPath($root).TrimEnd($separator) + $separator
    $seen = @{}
    $count = 0
    Write-Host 'Checking the complete UI77 Windows payload. No package component download is required.'
    foreach ($entry in $manifest.files) {
        $relative = [string]$entry.path
        if (!$relative -or [IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[\\/])\.\.([\\/]|$)' -or $seen.ContainsKey($relative)) { throw ('Unsafe or duplicate manifest path: ' + $relative) }
        if ($relative -eq 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg') { throw 'A Mac-only file is not part of this Windows package.' }
        $seen[$relative] = $true
        $path = [IO.Path]::GetFullPath((Join-Path $root $relative))
        if (!$path.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'Manifest path is outside the payload.' }
        $item = Get-Item -LiteralPath $path -Force -ErrorAction Stop
        if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw ('Unexpected file type: ' + $relative) }
        if ($item.Length -ne [long]$entry.bytes -or (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne [string]$entry.sha256) { throw ('Package checksum mismatch: ' + $relative) }
        $count++
        if ($count % 100 -eq 0) { Write-Host ('Verified Windows payload ' + $count + ' / 3348') }
    }
    Write-Host 'All 3348 Windows payload files verified. Starting the selected installer.'
    exit 0
} catch {
    Write-Host ('Package preparation stopped: ' + $_.Exception.Message)
    Write-Host 'Extract the complete UI77 ZIP into a new folder and retry. No existing plugin files were changed by preparation.'
    exit 1
}
