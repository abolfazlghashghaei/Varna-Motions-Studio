$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../VarnaLayout.psm1') -Force
$scratch = Join-Path ([IO.Path]::GetTempPath()) ('varna-layout-' + [guid]::NewGuid().ToString('N'))
function Put([string]$path,[string]$content) { [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($path)); [IO.File]::WriteAllText($path,$content) }
function Snapshot([string]$root) { return (@(Get-ChildItem -LiteralPath $root -File -Recurse | Sort-Object FullName | ForEach-Object { $_.FullName.Substring($root.Length) + ':' + (Get-FileHash -LiteralPath $_.FullName).Hash }) -join "`n") }
try {
    $outer = Join-Path $scratch 'Full47'
    $original = Join-Path $outer 'Varna_Motion_Studio'
    $nested = Join-Path $original 'Varna_Motion_Studio'
    $bundle = Join-Path $scratch 'repair/files'
    $wanted = @{
        'index.html'='new-ui'; 'CSXS/manifest.xml'='verified-extension';
        'INSTALL_WINDOWS.ps1'='verified-installer'; 'INSTALL_WINDOWS.bat'='verified-launcher';
        'js/production47.js'='verified-routes'; 'css/liquid48.css'='verified-glass';
        'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg'='verified-component'; 'assets/keep.dat'='original-asset'
    }
    $entries = @()
    foreach ($name in @($wanted.Keys | Sort-Object)) {
        $temp = Join-Path $scratch 'entry'
        Put $temp $wanted[$name]
        $entries += @{path=$name;bytes=(Get-Item $temp).Length;sha256=(Get-FileHash $temp).Hash.ToLowerInvariant()}
        if (!$name.StartsWith('assets/')) { Put (Join-Path $bundle $name) $wanted[$name] }
    }
    $manifest = Join-Path $bundle 'PACKAGE_MANIFEST.json'
    [IO.File]::WriteAllText($manifest,(@{version='4.5.0-rc.47';files=$entries} | ConvertTo-Json -Depth 5))
    $manifestHash = (Get-FileHash $manifest).Hash
    Put (Join-Path $original 'index.html') 'old-ui'
    Put (Join-Path $original 'CSXS/manifest.xml') 'old-extension'
    Put (Join-Path $original 'PACKAGE_MANIFEST.json') 'old-manifest'
    Put (Join-Path $original 'INSTALL_WINDOWS.ps1') 'old-installer'
    Put (Join-Path $original 'INSTALL_WINDOWS.bat') 'misplaced-outer-launcher'
    Put (Join-Path $original 'assets/keep.dat') 'original-asset'
    Put (Join-Path $original 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg') 'git-lfs-pointer'
    Put (Join-Path $nested 'index.html') 'new-ui'
    Put (Join-Path $nested 'PACKAGE_MANIFEST.json') 'partial-update-manifest'
    Put (Join-Path $nested 'INSTALL_WINDOWS.bat') 'inner-launcher-without-backend'
    Put (Join-Path $nested 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg') 'verified-component'
    $repairFolder = Join-Path $original 'extracted-repair-zip'
    [void][IO.Directory]::CreateDirectory($repairFolder)
    foreach ($start in @($outer,$original,$nested,$repairFolder)) {
        if ((Find-VarnaPackageRoot $start) -ne $original) { throw ('Wrong base selected from ' + $start) }
    }
    Write-Host 'PASS full root, payload root, partial nested update and extracted repair folder resolve to the actual base'
    $before = Snapshot $original
    $plan = Get-VarnaRecoveryPlan $original $bundle $manifestHash
    if ($plan.Files.Count -ne 8 -or ($plan.Files | Where-Object Path -eq 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg').Source -ne (Join-Path $nested 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg')) { throw 'Verified nested component was not reused.' }
    if ((Snapshot $original) -ne $before) { throw 'Planning changed original files.' }
    Write-Host 'PASS reported nesting reproduced; verified nested component selected without any download or original mutation'
    $ready = New-VarnaRecoveredPackage $plan
    if ([IO.Path]::GetDirectoryName($ready) -ne $outer -or !(Test-Path (Join-Path $ready 'INSTALL_WINDOWS.ps1'))) { throw 'Prepared package has no correctly located backend.' }
    foreach ($file in $plan.Files) { if ((Get-FileHash (Join-Path $ready $file.Path)).Hash -ne $file.Hash) { throw 'Prepared bytes mismatch.' } }
    if ((Snapshot $original) -ne $before) { throw 'Repair overwrote original files.' }
    Write-Host 'PASS complete verified sibling package contains the real backend and updated UI; original tree unchanged'
    $component = Join-Path $nested 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg'
    $cache = Join-Path ([IO.Path]::GetDirectoryName($component)) ('vdl-' + ((Get-FileHash $component).Hash.ToLowerInvariant()).Substring(0,12))
    [IO.File]::Move($component,$cache)
    $cachePlan = Get-VarnaRecoveryPlan $original $bundle $manifestHash
    if (($cachePlan.Files | Where-Object Path -eq 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg').Source -ne $cache) { throw 'Verified download cache ignored.' }
    Write-Host 'PASS previously verified download cache can also be reused'
    $priorFolders = @(Get-ChildItem $outer -Directory | Where-Object Name -like 'v48-*').Count
    $script:copies = 0
    $copyFailure = { param($a,$b) $script:copies++; if ($script:copies -eq 2) { throw 'Simulated copy refusal' }; [IO.File]::Copy($a,$b,$false) }
    $caught=$false;try { [void](New-VarnaRecoveredPackage $cachePlan -CopyFile $copyFailure) } catch { $caught=$true }
    if (!$caught -or @(Get-ChildItem $outer -Directory | Where-Object Name -like 'v48-*').Count -ne $priorFolders) { throw 'Failed preparation leaked a partial package.' }
    Write-Host 'PASS copy failure removes only the new staging directory'
    [IO.File]::WriteAllText($cache,'corrupt')
    $caught=$false;try { [void](Get-VarnaRecoveryPlan $original $bundle $manifestHash) } catch { $caught=$_.Exception.Message -like '*BASE_FILES_MISSING_OR_DIFFERENT*' }
    if (!$caught) { throw 'Corrupt component bypassed checksum verification.' }
    Write-Host 'PASS missing or corrupt base assets stop before staging or installation'
    $caught=$false;try { [void](Get-VarnaRecoveryPlan $original $bundle ('0'*64)) } catch { $caught=$_.Exception.Message -like '*manifest checksum*' }
    if (!$caught) { throw 'Unverified recovery manifest accepted.' }
    Write-Host 'PASS recovery manifest pin is enforced'
    $ambiguous = Join-Path $scratch 'ambiguous'
    foreach ($name in @('Varna-one','Varna-two')) { foreach ($marker in @('index.html','CSXS/manifest.xml','PACKAGE_MANIFEST.json','assets/a')) { Put (Join-Path (Join-Path $ambiguous $name) $marker) 'x' } }
    $caught=$false;try { [void](Find-VarnaPackageRoot $ambiguous) } catch { $caught=$_.Exception.Message -like '*MULTIPLE_PACKAGES*' }
    if (!$caught) { throw 'Ambiguous source chosen silently.' }
    Write-Host 'PASS ambiguous packages require explicit folder selection'
} finally { if (Test-Path $scratch) { Remove-Item -LiteralPath $scratch -Recurse -Force } }
