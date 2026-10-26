$ErrorActionPreference = 'Stop'
function Get-VarnaSafePath {
    param([string]$Root,[string]$Relative)
    if (!$Relative -or $Relative -match '[\\:<>"|?*\x00-\x1f]' -or $Relative.StartsWith('/') -or $Relative -match '(^|/)\.\.?(/|$)') { throw "Unsafe package path: $Relative" }
    $base = [IO.Path]::GetFullPath($Root).TrimEnd([char[]]@([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar))
    $path = [IO.Path]::GetFullPath((Join-Path $base $Relative))
    if (!$path.StartsWith($base + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe package path: $Relative" }
    return $path
}

function Test-VarnaPackageRoot {
    param([string]$Path)
    if (![IO.Directory]::Exists($Path)) { return $false }
    if (([IO.File]::GetAttributes($Path) -band [IO.FileAttributes]::ReparsePoint) -ne 0) { return $false }
    foreach ($name in @('CSXS/manifest.xml','index.html','PACKAGE_MANIFEST.json')) {
        if (![IO.File]::Exists((Join-Path $Path $name))) { return $false }
    }
    return [IO.Directory]::Exists((Join-Path $Path 'assets'))
}

function Find-VarnaPackageRoot {
    param([Parameter(Mandatory=$true)][string]$StartPath)
    $anchor = [IO.Path]::GetFullPath($StartPath)
    for ($level=0; $level -lt 3 -and $anchor; $level++) {
        if (Test-VarnaPackageRoot $anchor) { return $anchor }
        $found = @{}
        foreach ($dir in @(Get-ChildItem -LiteralPath $anchor -Directory -ErrorAction Stop)) {
            if ($dir.Name -notmatch '^Varna' -or ($dir.Attributes -band [IO.FileAttributes]::ReparsePoint)) { continue }
            foreach ($candidate in @($dir.FullName,(Join-Path $dir.FullName 'Varna_Motion_Studio'))) {
                if (Test-VarnaPackageRoot $candidate) { $found[[IO.Path]::GetFullPath($candidate)] = $true }
            }
        }
        if ($found.Count -eq 1) { return (@($found.Keys)[0]) }
        if ($found.Count -gt 1) { throw 'MULTIPLE_PACKAGES: Select the original extracted Varna folder.' }
        $parent = [IO.Directory]::GetParent($anchor)
        if (!$parent) { break }
        $anchor = $parent.FullName
    }
    throw 'PACKAGE_NOT_FOUND: Select the original extracted Varna folder.'
}

function Test-VarnaVerifiedFile {
    param([string]$Root,[string]$Path,[long]$Bytes,[string]$Hash,[hashtable]$CheckedDirectories)
    if (![IO.File]::Exists($Path)) { return $false }
    if (([IO.File]::GetAttributes($Path) -band [IO.FileAttributes]::ReparsePoint) -ne 0) { return $false }
    $dir = [IO.Path]::GetDirectoryName($Path)
    $stop = [IO.Path]::GetFullPath($Root)
    while ($dir) {
        if ($CheckedDirectories.ContainsKey($dir)) { break }
        if (([IO.File]::GetAttributes($dir) -band [IO.FileAttributes]::ReparsePoint) -ne 0) { return $false }
        $CheckedDirectories[$dir] = $true
        if ($dir.Equals($stop,[StringComparison]::OrdinalIgnoreCase)) { break }
        $dir = [IO.Path]::GetDirectoryName($dir)
    }
    $info = New-Object IO.FileInfo($Path)
    return $info.Length -eq $Bytes -and (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash -eq $Hash
}

function Get-VarnaRecoveryPlan {
    param(
        [Parameter(Mandatory=$true)][string]$PackageRoot,
        [Parameter(Mandatory=$true)][string]$BundleRoot,
        [Parameter(Mandatory=$true)][string]$ExpectedManifestHash
    )
    if (!(Test-VarnaPackageRoot $PackageRoot)) { throw 'The selected folder is not a complete extracted Varna base package.' }
    $PackageRoot = [IO.Path]::GetFullPath($PackageRoot).TrimEnd([char[]]@([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar))
    $manifestPath = Join-Path $BundleRoot 'PACKAGE_MANIFEST.json'
    if (!(Test-Path -LiteralPath $manifestPath -PathType Leaf) -or (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash -ne $ExpectedManifestHash) { throw 'Recovery manifest checksum mismatch. Extract the complete current repair ZIP again.' }
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($manifest.version -ne '4.5.0-rc.47' -or !$manifest.files -or $manifest.files.Count -gt 20000) { throw 'Unsupported recovery manifest.' }
    $roots = @($PackageRoot,(Join-Path $PackageRoot 'Varna_Motion_Studio'))
    $files = New-Object System.Collections.ArrayList
    $missing = New-Object System.Collections.ArrayList
    $seen = @{}; $checked = @{}; $index = 0
    foreach ($entry in $manifest.files) {
        $relative = [string]$entry.path
        [void](Get-VarnaSafePath $PackageRoot $relative)
        if ($seen.ContainsKey($relative) -or [string]$entry.sha256 -notmatch '^[a-fA-F0-9]{64}$' -or [long]$entry.bytes -lt 0) { throw "Invalid or duplicate recovery entry: $relative" }
        $seen[$relative] = $true
        $sources = @()
        if (!$relative.StartsWith('assets/')) { $sources += $BundleRoot }
        $sources += $roots
        $source = $null
        foreach ($root in $sources) {
            $candidate = Get-VarnaSafePath $root $relative
            if (Test-VarnaVerifiedFile $root $candidate ([long]$entry.bytes) ([string]$entry.sha256) $checked) { $source = $candidate; break }
            if ($relative -eq 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg') {
                $cache = Join-Path ([IO.Path]::GetDirectoryName($candidate)) ('vdl-' + ([string]$entry.sha256).Substring(0,12))
                if (Test-VarnaVerifiedFile $root $cache ([long]$entry.bytes) ([string]$entry.sha256) $checked) { $source = $cache; break }
            }
        }
        if ($source) { [void]$files.Add([pscustomobject]@{ Path=$relative; Source=$source; Bytes=[long]$entry.bytes; Hash=[string]$entry.sha256 }) }
        else { [void]$missing.Add($relative) }
        $index++
        if ($index % 100 -eq 0) { Write-Host ("Verified repair sources $index / " + $manifest.files.Count) }
    }
    foreach ($required in @('INSTALL_WINDOWS.ps1','INSTALL_WINDOWS.bat','index.html','CSXS/manifest.xml')) {
        if (!$seen.ContainsKey($required)) { throw "Incomplete recovery manifest: $required" }
    }
    if ($missing.Count) { throw ('BASE_FILES_MISSING_OR_DIFFERENT: ' + (($missing | Select-Object -First 8) -join ', ') + '. No original files were changed. Use the complete corrected package if these assets are missing.') }
    return [pscustomobject]@{ PackageRoot=$PackageRoot; Files=@($files.ToArray()); ManifestPath=$manifestPath; ManifestHash=$ExpectedManifestHash }
}

function New-VarnaRecoveredPackage {
    param(
        [Parameter(Mandatory=$true)]$Plan,
        [scriptblock]$CopyFile = { param($from,$to) [IO.File]::Copy($from,$to,$false) }
    )
    $ErrorActionPreference = 'Stop'
    $stage = Join-Path ([IO.Path]::GetDirectoryName($Plan.PackageRoot)) ('v48-' + [guid]::NewGuid().ToString('N').Substring(0,8))
    if ([IO.Directory]::Exists($stage)) { throw 'Unexpected recovery folder collision.' }
    [void][IO.Directory]::CreateDirectory($stage)
    try {
        $checked = @{}; $index = 0
        foreach ($entry in $Plan.Files) {
            $target = Get-VarnaSafePath $stage $entry.Path
            [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target))
            & $CopyFile $entry.Source $target
            if (!(Test-VarnaVerifiedFile $stage $target $entry.Bytes $entry.Hash $checked)) { throw ('Prepared file failed checksum verification: ' + $entry.Path) }
            $index++
            if ($index % 100 -eq 0) { Write-Host ("Prepared verified files $index / " + $Plan.Files.Count) }
        }
        $targetManifest = Join-Path $stage 'PACKAGE_MANIFEST.json'
        [IO.File]::Copy($Plan.ManifestPath,$targetManifest,$false)
        if ((Get-FileHash -LiteralPath $targetManifest -Algorithm SHA256).Hash -ne $Plan.ManifestHash) { throw 'Prepared manifest failed checksum verification.' }
        return $stage
    } catch {
        Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
        throw
    }
}

Export-ModuleMember -Function Find-VarnaPackageRoot,Get-VarnaRecoveryPlan,New-VarnaRecoveredPackage
