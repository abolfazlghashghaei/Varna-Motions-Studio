param(
    [switch]$Uninstall,
    [ValidateSet('Core','Studio','Max')][string]$Level = 'Studio',
    [string]$ProgressPath = ''
)
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$extensions = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
$dst = Join-Path $extensions 'VarnaMotionStudio'
$recovery = Join-Path $env:APPDATA 'VarnaMotionStudio\Backups'
$stamp = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8)
$stage = Join-Path $recovery ('stage-' + $stamp)
$moves = New-Object System.Collections.ArrayList
$installed = $false
$externalAdded = New-Object System.Collections.ArrayList
$externalOwned = New-Object System.Collections.ArrayList

function Set-InstallStatus([int]$percent,[string]$phase,[string]$message) {
    if ($ProgressPath) {
        try {
            $json = @{ percent = $percent; phase = $phase; message = $message } | ConvertTo-Json -Compress
            [IO.File]::WriteAllText($ProgressPath,$json,(New-Object System.Text.UTF8Encoding($false)))
        } catch { }
    }
    Write-Host $message
}
function Get-VarnaInstallations {
    $result = @()
    if (!(Test-Path -LiteralPath $extensions -PathType Container)) { return $result }
    foreach ($dir in (Get-ChildItem -LiteralPath $extensions -Directory -ErrorAction SilentlyContinue)) {
        if (($dir.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
        $file = Join-Path $dir.FullName 'CSXS\manifest.xml'
        if (!(Test-Path -LiteralPath $file -PathType Leaf)) { continue }
        try {
            [xml]$manifest = Get-Content -LiteralPath $file -Raw -Encoding UTF8
            if ($manifest.ExtensionManifest.ExtensionBundleId -eq 'com.varnalabs.motionstudio') { $result += $dir.FullName }
        } catch { }
    }
    return $result
}
function Save-Previous([string]$path,[string]$label) {
    $folder = Join-Path $recovery ($label + '-' + (Split-Path $path -Leaf) + '-' + $stamp)
    Move-Item -LiteralPath $path -Destination $folder -ErrorAction Stop
    [void]$moves.Add(@{ Original = $path; Saved = $folder })
}
function Restore-Previous {
    for ($i = $moves.Count - 1; $i -ge 0; $i--) {
        $entry = $moves[$i]
        if ((Test-Path -LiteralPath $entry.Saved) -and !(Test-Path -LiteralPath $entry.Original)) {
            try { Move-Item -LiteralPath $entry.Saved -Destination $entry.Original -ErrorAction Stop }
            catch { Write-Warning "Could not restore $($entry.Original): $_" }
        }
    }
}
function Get-AERoots {
    $adobe = Join-Path $env:ProgramFiles 'Adobe'
    $roots = New-Object System.Collections.ArrayList
    if (Test-Path -LiteralPath $adobe -PathType Container) {
        foreach ($dir in (Get-ChildItem -LiteralPath $adobe -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'Adobe After Effects *' })) {
            [void]$roots.Add((Join-Path $dir.FullName 'Support Files'))
        }
    }
    foreach ($key in (Get-ChildItem 'HKLM:\SOFTWARE\Adobe\After Effects' -ErrorAction SilentlyContinue)) {
        $entry = Get-ItemProperty -LiteralPath $key.PSPath -ErrorAction SilentlyContinue
        foreach ($field in @('InstallPath','ApplicationPath')) {
            $candidate = [string]$entry.$field
            if (!$candidate) { continue }
            if ($candidate -match '\.exe$') { $candidate = Split-Path $candidate -Parent }
            if (Test-Path -LiteralPath (Join-Path $candidate 'Support Files\Scripts\ScriptUI Panels') -PathType Container) { $candidate = Join-Path $candidate 'Support Files' }
            [void]$roots.Add($candidate)
        }
    }
    return @($roots | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'Scripts\ScriptUI Panels') -PathType Container } | Select-Object -Unique)
}
function Copy-ExternalVerified([string]$source,[string]$target,[string]$hash) {
    if ((Test-Path -LiteralPath $target -PathType Leaf)) {
        if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $hash) { throw "A different third-party component already exists: $target" }
        return $false
    }
    try {
        New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force -ErrorAction Stop | Out-Null
        Copy-Item -LiteralPath $source -Destination $target -ErrorAction Stop
    } catch {
        $helper = Join-Path $recovery ('vendor-copy-' + [guid]::NewGuid().ToString('N') + '.ps1')
        @'
param([string]$Source,[string]$Target,[string]$Expected)
$ErrorActionPreference='Stop'
New-Item -ItemType Directory -Path (Split-Path $Target -Parent) -Force | Out-Null
if (Test-Path -LiteralPath $Target) { exit 3 }
Copy-Item -LiteralPath $Source -Destination $Target -ErrorAction Stop
if ((Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash -ne $Expected) { Remove-Item -LiteralPath $Target -Force; exit 4 }
'@ | Set-Content -LiteralPath $helper -Encoding UTF8
        try {
            $arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -Source "{1}" -Target "{2}" -Expected "{3}"' -f $helper,$source,$target,$hash
            $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -Verb RunAs -PassThru -Wait
            if ($process.ExitCode -ne 0) { throw "Component install was declined or failed: $target ($($process.ExitCode))" }
        } finally { Remove-Item -LiteralPath $helper -Force -ErrorAction SilentlyContinue }
    }
    if (!(Test-Path -LiteralPath $target -PathType Leaf) -or (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $hash) { throw "Component checksum mismatch: $target" }
    return $true
}
function Remove-OwnedExternal([string]$target,[string]$hash) {
    if (!(Test-Path -LiteralPath $target -PathType Leaf)) { return }
    if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $hash) { Write-Warning "Modified component preserved: $target"; return }
    try { Remove-Item -LiteralPath $target -Force -ErrorAction Stop }
    catch {
        $helper = Join-Path $recovery ('vendor-remove-' + [guid]::NewGuid().ToString('N') + '.ps1')
        @'
param([string]$Target,[string]$Expected)
$ErrorActionPreference='Stop'
if ((Test-Path -LiteralPath $Target -PathType Leaf) -and (Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash -eq $Expected) { Remove-Item -LiteralPath $Target -Force -ErrorAction Stop }
'@ | Set-Content -LiteralPath $helper -Encoding UTF8
        try {
            $arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -Target "{1}" -Expected "{2}"' -f $helper,$target,$hash
            $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -Verb RunAs -PassThru -Wait
            if ($process.ExitCode -ne 0) { Write-Warning "Component could not be removed: $target" }
        } catch { Write-Warning "Component preserved: $target" }
        finally { Remove-Item -LiteralPath $helper -Force -ErrorAction SilentlyContinue }
    }
}
function Get-VendorInstallPlan([string]$panelRoot) {
    $plan = New-Object System.Collections.ArrayList
    $root = Join-Path $panelRoot 'assets\vendor'
    $cep = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
    foreach ($pair in @(@('Railcut\Railcut','Railcut'),@('Orb Reactor\com.anas.orbreactor','com.anas.orbreactor'))) {
        $folder = Join-Path $root $pair[0]
        foreach ($file in (Get-ChildItem -LiteralPath $folder -File -Recurse -ErrorAction Stop)) {
            $relative = $file.FullName.Substring($folder.Length).TrimStart('\')
            [void]$plan.Add(@{ Source=$file.FullName; Target=(Join-Path (Join-Path $cep $pair[1]) $relative) })
        }
    }
    [void]$plan.Add(@{Source=(Join-Path $root 'Cosmic\Win\Cosmic.aex');Target=(Join-Path $env:ProgramFiles 'Adobe\Common\Plug-ins\7.0\MediaCore\Cosmic\Cosmic.aex')})
    $aeRoots = @(Get-AERoots)
    if (!$aeRoots.Count) { throw 'After Effects installation was not found for the supplied tools.' }
    foreach ($ae in $aeRoots) {
        $plugins = Join-Path $ae 'Plug-ins'
        $scripts = Join-Path $ae 'Scripts\ScriptUI Panels'
        foreach ($pair in @(
            @('Glassary\Windows\Glassary\Glassary.aex',(Join-Path $plugins 'Made by mor\Glassary\Glassary.aex')),
            @('Glassary\Glassary-ScriptUI\Glassary.jsxbin',(Join-Path $scripts 'Glassary.jsxbin')),
            @('CuttanaNir3\Win\CuttanaNir.aex',(Join-Path $plugins 'Terrible Junk Show\CuttanaNir.aex')),
            @('CuttanaNir3\CuttanaNir.jsxbin',(Join-Path $scripts 'CuttanaNir.jsxbin')),
            @('WriteTyper\WriteTyper.jsxbin',(Join-Path $scripts 'WriteTyper.jsxbin'))
        )) { [void]$plan.Add(@{Source=(Join-Path $root $pair[0]);Target=$pair[1]}) }
    }
    return $plan
}
function Test-PackageEntry([string]$relative,[string]$root) {
    if (!$relative -or $relative -match '[\\:]' -or $relative.StartsWith('/') -or $relative -match '(^|/)\.\.?(/|$)') { throw "Unsafe package path: $relative" }
    $full = [IO.Path]::GetFullPath((Join-Path $root $relative))
    if (!$full.StartsWith([IO.Path]::GetFullPath($root).TrimEnd('\') + '\',[StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe package path: $relative" }
    return $full
}
function Include-Entry([string]$relative) {
    if ($Level -eq 'Core' -and $relative.StartsWith('assets/sfx/') -and $relative -ne 'assets/sfx/ghaf_type_click.wav') { return $false }
    if ($Level -ne 'Max' -and $relative.StartsWith('assets/packs/')) { return $false }
    if ($Level -ne 'Max' -and $relative.StartsWith('assets/vendor/')) { return $false }
    return $true
}
function Test-VarnaEngine([string]$base) {
    $python = Join-Path $base 'python_embeded\python.exe'
    $appDir = Join-Path $base 'ComfyUI'
    if (!(Test-Path -LiteralPath $python -PathType Leaf) -or !(Test-Path -LiteralPath (Join-Path $appDir 'main.py') -PathType Leaf)) { return $false }
    $stdout = Join-Path $recovery ('engine-probe-' + [guid]::NewGuid().ToString('N') + '.out')
    $stderr = $stdout + '.err'
    $script = $stdout + '.py'
    try {
        [IO.File]::WriteAllText($script,"import sys`nsys.path.insert(0, sys.argv[1])`nimport torch, folder_paths`nprint('VARNA_ENGINE_OK')`n")
        $probe = Start-Process -FilePath $python -ArgumentList ('"' + $script + '" "' + $appDir + '"') -WorkingDirectory $appDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
        if (!$probe.WaitForExit(90000)) { $probe.Kill(); return $false }
        return $probe.ExitCode -eq 0 -and (Get-Content -LiteralPath $stdout -Raw -ErrorAction SilentlyContinue) -match 'VARNA_ENGINE_OK'
    } catch { return $false }
    finally { Remove-Item -LiteralPath $stdout,$stderr,$script -Force -ErrorAction SilentlyContinue }
}
function Get-VarnaEngineCandidates {
    $roots = New-Object System.Collections.ArrayList
    $pointer = Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\engine-root.txt'
    if (Test-Path -LiteralPath $pointer -PathType Leaf) {
        $saved = (Get-Content -LiteralPath $pointer -Raw -ErrorAction SilentlyContinue).Trim()
        if ($saved) { [void]$roots.Add($saved) }
    }
    if ($env:VARNA_ENGINE_ROOT) { [void]$roots.Add($env:VARNA_ENGINE_ROOT) }
    foreach ($base in @((Join-Path $env:LOCALAPPDATA 'GHAF\Core'),(Join-Path $env:LOCALAPPDATA 'GHAF'),(Join-Path $env:APPDATA 'GHAF\Core'),(Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\ComfyUI_windows_portable'),(Join-Path $env:USERPROFILE 'ComfyUI_windows_portable'),(Join-Path $env:SystemDrive 'ComfyUI_windows_portable'))) { [void]$roots.Add($base) }
    $shared = Join-Path $env:LOCALAPPDATA 'GHAF'
    if (Test-Path -LiteralPath $shared -PathType Container) {
        foreach ($child in (Get-ChildItem -LiteralPath $shared -Directory -ErrorAction SilentlyContinue)) {
            if (($child.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) { [void]$roots.Add($child.FullName) }
        }
    }
    $seen = @{}
    foreach ($item in $roots) {
        foreach ($variant in @([string]$item,(Join-Path ([string]$item) 'ComfyUI_windows_portable'))) {
            if (!$variant) { continue }
            $key = $variant.TrimEnd('\').ToLowerInvariant()
            if (!$seen.ContainsKey($key)) { $seen[$key] = $true; $variant }
        }
    }
}
function Save-VarnaEngineLocation([string]$root) {
    $dir = Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio'
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    [IO.File]::WriteAllText((Join-Path $dir 'engine-root.txt'),$root,(New-Object System.Text.UTF8Encoding($false)))
}
function Test-RunningVarnaEngine {
    foreach ($port in @(17861,8188)) {
        try {
            $response = Invoke-RestMethod -Uri ("http://127.0.0.1:$port/system_stats") -TimeoutSec 2 -ErrorAction Stop
            if ($null -ne $response.system -and $null -ne $response.devices) { return $true }
        } catch { }
    }
    return $false
}
function Receive-VarnaEngine([string]$uri,[string]$target,[long]$expected) {
    Add-Type -AssemblyName System.Net.Http
    $client = New-Object System.Net.Http.HttpClient
    $client.Timeout = [TimeSpan]::FromHours(3)
    $response = $null; $inputStream = $null; $outputStream = $null
    try {
        $response = $client.GetAsync($uri,[System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
        $response.EnsureSuccessStatusCode() | Out-Null
        $total = if ($expected -gt 0) { $expected } else { [long]$response.Content.Headers.ContentLength }
        $inputStream = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
        $outputStream = [IO.File]::Open($target,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
        $buffer = New-Object byte[] (1024*1024); [long]$received=0; $last=-1
        while (($count=$inputStream.Read($buffer,0,$buffer.Length)) -gt 0) {
            $outputStream.Write($buffer,0,$count); $received += $count
            $pct = if ($total -gt 0) { [int](100*$received/$total) } else { 0 }
            if ($pct -ge $last+2 -or $last -lt 0) {
                $last=$pct
                $of = if ($total -gt 0) { (' / {0:N1}' -f ($total/1MB)) } else { '' }
                Set-InstallStatus ([int](47+25*$pct/100)) 'engine-download' ('موتور وارنا: {0:N1}{1} MiB · {2}%' -f ($received/1MB),$of,$pct)
            }
        }
        if ($expected -gt 0 -and $received -ne $expected) { throw 'اندازهٔ دریافت موتور وارنا با فایل رسمی یکسان نیست.' }
    } finally {
        if ($outputStream) { $outputStream.Dispose() }; if ($inputStream) { $inputStream.Dispose() }
        if ($response) { $response.Dispose() }; $client.Dispose()
    }
}
function Get-AEEffectPath {
    $keys = @(Get-ChildItem 'HKLM:\SOFTWARE\Adobe\After Effects' -ErrorAction SilentlyContinue | Sort-Object { try { [version]$_.PSChildName } catch { [version]'0.0' } } -Descending)
    foreach ($key in $keys) {
        $value = Get-ItemProperty -LiteralPath $key.PSPath -ErrorAction SilentlyContinue
        foreach ($name in @('CommonPluginInstallPath','PluginInstallPath')) {
            $dir = [string]$value.$name
            if ($dir -and (Test-Path -LiteralPath $dir -PathType Container)) { return (Join-Path $dir 'AE Glass.aex') }
        }
    }
    $adobe = Join-Path $env:ProgramFiles 'Adobe'
    if (!(Test-Path -LiteralPath $adobe -PathType Container)) { throw 'After Effects نصب‌شده پیدا نشد؛ مسیر افکت قابل تشخیص نیست.' }
    return Join-Path $adobe 'Common\Plug-ins\7.0\MediaCore\AE Glass.aex'
}
function Install-AEEffect([string]$source,[string]$target) {
    $expected=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    if (Test-Path -LiteralPath $target -PathType Leaf) {
        if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -eq $expected) { return 'AE Glass از قبل نصب و تأیید شده است.' }
        return 'Existing different AE Glass preserved; bundled effect skipped.'
    }
    try {
        New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force -ErrorAction Stop | Out-Null
        Copy-Item -LiteralPath $source -Destination $target -ErrorAction Stop
    } catch {
        $helper=Join-Path $recovery ('ae-glass-copy-' + $stamp + '.ps1')
        @'
param([string]$Source,[string]$Target,[string]$Expected)
$ErrorActionPreference='Stop'
New-Item -ItemType Directory -Path (Split-Path $Target -Parent) -Force | Out-Null
if (Test-Path -LiteralPath $Target) { exit 3 }
Copy-Item -LiteralPath $Source -Destination $Target -ErrorAction Stop
if ((Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash -ne $Expected) { Remove-Item -LiteralPath $Target -Force; exit 4 }
'@ | Set-Content -LiteralPath $helper -Encoding UTF8
        $argsList='-NoProfile -ExecutionPolicy Bypass -File "{0}" -Source "{1}" -Target "{2}" -Expected {3}' -f $helper,$source,$target,$expected
        $process=Start-Process -FilePath 'powershell.exe' -ArgumentList $argsList -Verb RunAs -PassThru -Wait
        if ($process.ExitCode -ne 0) { throw ('نصب AE Glass با دسترسی مدیر انجام نشد: ' + $process.ExitCode) }
    }
    if (!(Test-Path -LiteralPath $target -PathType Leaf) -or (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $expected) { throw 'AE Glass در مسیر افکت کپی یا تأیید نشد.' }
    return 'AE Glass در مسیر افکت AE نصب و با هش تأیید شد.'
}
function Ensure-ComfyPortable {
    $root = Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\ComfyUI_windows_portable'
    $sharedRoot = Join-Path $env:LOCALAPPDATA 'GHAF\Core'
    $sharedPresent = Test-Path -LiteralPath $sharedRoot -PathType Container
    $suspected = New-Object System.Collections.ArrayList
    foreach ($candidate in @(Get-VarnaEngineCandidates)) {
        $entry = Join-Path $candidate 'ComfyUI\main.py'
        $python = Join-Path $candidate 'python_embeded\python.exe'
        if (!(Test-Path -LiteralPath $entry -PathType Leaf) -and !(Test-Path -LiteralPath $python -PathType Leaf)) { continue }
        Set-InstallStatus 47 'engine-check' 'موتور وارنا موجود پیدا شد؛ آزمون سلامت در حال اجراست…'
        if (Test-VarnaEngine $candidate) {
            Save-VarnaEngineLocation $candidate
            return 'موتور مشترک وارنا تأیید شد؛ هیچ موتور دیگری دریافت یا نصب نمی‌شود.'
        }
        [void]$suspected.Add($candidate)
    }
    if (Test-RunningVarnaEngine) { return 'موتور مشترک وارنا در حال اجراست؛ دانلود موتور تکراری انجام نمی‌شود.' }
    if ($sharedPresent) {
        Set-InstallStatus 47 'engine-check' 'پوشهٔ موتور مشترک در GHAF\Core وجود دارد. آزمون سلامت کامل نشد؛ نصب پنل ادامه می‌یابد و موتور دیگری دانلود نمی‌شود.'
        return 'موتور مشترک موجود است ولی سلامت آن تأیید نشد؛ موتور تازه دریافت نشد. اجرای موتور موجود را جداگانه بررسی کنید.'
    }
    $sharedConfig = Join-Path $env:LOCALAPPDATA 'GHAF\Config\extra_model_paths.yaml'
    if ($suspected.Count -eq 0 -and (Test-Path -LiteralPath $sharedConfig -PathType Leaf)) { [void]$suspected.Add((Join-Path $env:LOCALAPPDATA 'GHAF')) }
    if ($suspected.Count) { return ('موتور نصب‌شده یافت شد، اما سلامت آن تأیید نشد. نصب پنل ادامه یافت و موتور دیگری دانلود نشد. محل بررسی: ' + ($suspected -join ' ؛ ')) }
    $gpu = @(Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'NVIDIA' })
    if (!$gpu.Count) { throw 'موتور وارنا پیدا نشد و نسخهٔ خودکار این بسته به کارت NVIDIA نیاز دارد.' }
    $sevenZip = Get-Command 7z.exe -ErrorAction SilentlyContinue
    if (!$sevenZip) { $possible = Join-Path $env:ProgramFiles '7-Zip\7z.exe'; if (Test-Path -LiteralPath $possible) { $sevenZip = @{ Source = $possible } } }
    $tar = Get-Command tar.exe -ErrorAction SilentlyContinue
    if (!$sevenZip -and !$tar) { throw 'موتور وارنا پیدا نشد؛ برای استخراج نسخهٔ خودکار 7-Zip یا tar سازگار لازم است.' }
    $uri = 'https://api.github.com/repos/comfyanonymous/ComfyUI/releases/latest'
    $release = Invoke-RestMethod -Uri $uri -Headers @{ 'User-Agent'='VarnaMotionStudio-Installer' } -TimeoutSec 40
    $asset = @($release.assets | Where-Object { $_.name -eq 'ComfyUI_windows_portable_nvidia.7z' } | Select-Object -First 1)[0]
    if (!$asset -or [string]$asset.digest -notmatch '^sha256:[0-9a-fA-F]{64}$') { throw 'فایل رسمی موتور وارنا یا هش اعتبارسنجی در دسترس نیست.' }
    $download = Join-Path $recovery ('ComfyUI-' + $stamp + '.7z')
    $unpack = Join-Path $recovery ('comfy-stage-' + $stamp)
    try {
        Set-InstallStatus 47 'engine-download' 'دریافت نسخهٔ رسمی موتور وارنا برای NVIDIA…'
        Receive-VarnaEngine $asset.browser_download_url $download ([long]$asset.size)
        if ((Get-Item -LiteralPath $download).Length -ne [long]$asset.size -or (Get-FileHash -LiteralPath $download -Algorithm SHA256).Hash -ne ([string]$asset.digest).Substring(7)) { throw 'اعتبارسنجی فایل موتور وارنا ناموفق بود.' }
        New-Item -ItemType Directory -Path $unpack -Force | Out-Null
        if ($sevenZip) { & $sevenZip.Source x "-o$unpack" '-y' $download | Out-Null }
        else { & $tar.Source -xf $download -C $unpack }
        if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath (Join-Path $unpack 'ComfyUI_windows_portable\ComfyUI\main.py'))) { throw 'استخراج بستهٔ موتور وارنا ناموفق بود.' }
        New-Item -ItemType Directory -Path (Split-Path $root -Parent) -Force | Out-Null
        if (Test-Path -LiteralPath $root) { Move-Item -LiteralPath $root -Destination (Join-Path $recovery ('incomplete-engine-' + $stamp)) -ErrorAction Stop }
        if (!(Test-VarnaEngine (Join-Path $unpack 'ComfyUI_windows_portable'))) { throw 'موتور وارنا استخراج شد اما آزمون اجرا ناموفق بود.' }
        Move-Item -LiteralPath (Join-Path $unpack 'ComfyUI_windows_portable') -Destination $root -ErrorAction Stop
        Save-VarnaEngineLocation $root
        return 'موتور وارنا نصب شد؛ مدل‌های صدا جداگانه بررسی می‌شوند.'
    } finally {
        Remove-Item -LiteralPath $download -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $unpack -Recurse -Force -ErrorAction SilentlyContinue
    }
}


try {
    if (Get-Process AfterFX -ErrorAction SilentlyContinue) { throw 'Close After Effects before changing the installation.' }
    New-Item -ItemType Directory -Path $recovery -Force | Out-Null
    $existing = @(Get-VarnaInstallations)
    if ((Test-Path -LiteralPath $dst) -and $dst -notin $existing) { throw 'The destination contains an unrelated extension. Nothing was changed.' }
    if ($Uninstall) {
        Set-InstallStatus 10 'scan' ('Found ' + $existing.Count + ' Varna extension folder(s). Shared AI runtimes and settings are outside this operation.')
        if (!$existing.Count) { Set-InstallStatus 100 'done' 'No installed Varna panel was found. Shared components were left in place.'; exit 0 }
        $owned = New-Object System.Collections.ArrayList
        foreach ($path in $existing) {
            $profileFile = Join-Path $path 'INSTALL_PROFILE.json'
            if (Test-Path -LiteralPath $profileFile -PathType Leaf) {
                try {
                    $oldProfile = Get-Content -LiteralPath $profileFile -Raw -Encoding UTF8 | ConvertFrom-Json
                    foreach ($record in @($oldProfile.externalComponents)) { if ($record.path -and $record.sha256) { [void]$owned.Add($record) } }
                } catch { Write-Warning "Installation profile cannot be read: $profileFile" }
            }
        }
        foreach ($path in $existing) { Save-Previous $path 'uninstalled-panel' }
        foreach ($record in $owned) { Remove-OwnedExternal ([string]$record.path) ([string]$record.sha256) }
        Set-InstallStatus 100 'done' ('Panel moved to recovery. تنظیمات، موتور وارنا و مدل‌های مشترک حفظ شدند. Recovery: ' + $recovery)
        exit 0
    }
    if ([IO.Path]::GetFullPath($src).TrimEnd('\') -eq [IO.Path]::GetFullPath($dst).TrimEnd('\')) { throw 'Extract the complete ZIP to a separate folder before installing.' }
    $manifestFile = Join-Path $src 'PACKAGE_MANIFEST.json'
    if (!(Test-Path -LiteralPath $manifestFile -PathType Leaf)) { throw 'PACKAGE_MANIFEST.json is missing. Extract the complete ZIP.' }
    $package = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
    if ([string]$package.version -notmatch '^4\.5\.0-rc\.[0-9]+$' -or !$package.files -or !$package.files.Count) { throw 'Invalid or unsupported package manifest.' }
    Set-InstallStatus 5 'scan' ('Installing ' + $package.version + ' / ' + $Level + '; previous installations: ' + $existing.Count)
    $selected = @($package.files | Where-Object { Include-Entry ([string]$_.path) })
    $seen = @{}
    $index = 0
    foreach ($file in $selected) {
        $relative = [string]$file.path
        $key = $relative.ToLowerInvariant()
        if ($seen.ContainsKey($key)) { throw "Duplicate package path: $relative" }
        $seen[$key] = $true
        $from = Test-PackageEntry $relative $src
        if (!(Test-Path -LiteralPath $from -PathType Leaf)) { throw "Missing package file: $relative. Extract the ZIP again." }
        $item = Get-Item -LiteralPath $from
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Package link is not allowed: $relative" }
        if ($item.Length -ne [long]$file.bytes -or (Get-FileHash -LiteralPath $from -Algorithm SHA256).Hash -ne [string]$file.sha256) {
            throw "Package checksum mismatch: $relative. Extract the complete current ZIP again. The existing installation is untouched."
        }
        $index++
        if ($index % 50 -eq 0 -or $index -eq $selected.Count) { Set-InstallStatus ([int](5 + 42 * $index / $selected.Count)) 'verify' ("Verified $index / $($selected.Count) files") }
    }
    foreach ($path in $existing) {
        $profileFile = Join-Path $path 'INSTALL_PROFILE.json'
        if (!(Test-Path -LiteralPath $profileFile -PathType Leaf)) { continue }
        try {
            $oldProfile = Get-Content -LiteralPath $profileFile -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($record in @($oldProfile.externalComponents)) {
                if ($record.path -and $record.sha256 -and (Test-Path -LiteralPath $record.path -PathType Leaf) -and (Get-FileHash -LiteralPath $record.path -Algorithm SHA256).Hash -eq [string]$record.sha256) { [void]$externalOwned.Add(@{path=[string]$record.path;sha256=[string]$record.sha256}) }
            }
        } catch { Write-Warning "Previous ownership profile was not readable: $profileFile" }
    }
    $vendorPlan = @()
    if ($Level -eq 'Max') {
        $vendorPlan = @(Get-VendorInstallPlan $src)
        # Decide per component before writing anything: never mix two vendor versions.
        $groups = @{}
        foreach ($entry in $vendorPlan) {
            $relative = $entry.Source.Substring((Join-Path $src 'assets\vendor').Length).TrimStart('\')
            $component = $relative.Split('\')[0]
            if (!$groups.ContainsKey($component)) { $groups[$component] = @() }
            $groups[$component] += $entry
        }
        $vendorPlan = @()
        foreach ($component in $groups.Keys) {
            $conflict = $false
            foreach ($entry in $groups[$component]) {
                if (Test-Path -LiteralPath $entry.Target) {
                    if (!(Test-Path -LiteralPath $entry.Target -PathType Leaf) -or (Get-FileHash -LiteralPath $entry.Target -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $entry.Source -Algorithm SHA256).Hash) { $conflict = $true; break }
                }
            }
            # Existing CEP extensions are complete independent installations, even if incomplete or newer.
            if ($component -eq 'Orb Reactor' -and (Test-Path -LiteralPath (Join-Path $extensions 'com.anas.orbreactor'))) { $conflict = $true }
            if ($component -eq 'Railcut' -and (Test-Path -LiteralPath (Join-Path $extensions 'Railcut'))) { $conflict = $true }
            if ($conflict) { Write-Warning ("Existing component preserved; bundled component skipped as a whole: " + $component) }
            else { $vendorPlan += $groups[$component] }
        }
    }
    $comfyState = 'موتور وارنا: وضعیت نسخهٔ موجود بررسی شد.'
    if ($Level -eq 'Max') { $comfyState = Ensure-ComfyPortable }
    $audioState = 'مدل‌ها در محل اصلی خود باقی می‌مانند؛ مسیرشان در پنل تنظیم می‌شود.'
    New-Item -ItemType Directory -Path $stage -Force | Out-Null
    $index = 0
    foreach ($file in $selected) {
        $relative = [string]$file.path
        $from = Test-PackageEntry $relative $src
        $to = Test-PackageEntry $relative $stage
        New-Item -ItemType Directory -Path (Split-Path $to -Parent) -Force | Out-Null
        Copy-Item -LiteralPath $from -Destination $to -ErrorAction Stop
        if ((Get-FileHash -LiteralPath $to -Algorithm SHA256).Hash -ne [string]$file.sha256) { throw "Staging checksum mismatch: $relative" }
        $index++
        if ($index % 50 -eq 0 -or $index -eq $selected.Count) { Set-InstallStatus ([int](73 + 17 * $index / $selected.Count)) 'stage' ("Prepared $index / $($selected.Count) files") }
    }
    Copy-Item -LiteralPath $manifestFile -Destination $stage -ErrorAction Stop
    $profile = @{ version = $package.version; level = $Level; packs = @('core'); externalPathsModified = @(); externalComponents = @() }
    if ($Level -ne 'Core') { $profile.packs += 'sfx' }
    if ($Level -eq 'Max') { $profile.packs += 'composer'; $profile.packs += 'textyle-presets'; $profile.packs += 'ae-glass' }
    $profile | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $stage 'INSTALL_PROFILE.json') -Encoding UTF8
    [xml]$cepManifest = Get-Content -LiteralPath (Join-Path $stage 'CSXS\manifest.xml') -Raw -Encoding UTF8
    if ($cepManifest.ExtensionManifest.ExtensionBundleId -ne 'com.varnalabs.motionstudio') { throw 'CEP extension identity does not match Varna.' }
    New-Item -ItemType Directory -Path $extensions -Force | Out-Null
    Set-InstallStatus 93 'switch' 'Package checked. Archiving old Varna extensions before activation.'
    foreach ($path in $existing) { Save-Previous $path 'previous-panel' }
    Move-Item -LiteralPath $stage -Destination $dst -ErrorAction Stop
    $installed = $true
    foreach ($v in @('12','13')) {
        try {
            $regPath = 'HKCU:\Software\Adobe\CSXS.' + $v
            New-Item -Path $regPath -Force | Out-Null
            New-ItemProperty -Path $regPath -Name PlayerDebugMode -Value '1' -PropertyType String -Force | Out-Null
        } catch { Write-Warning "CEP preference skipped: $_" }
    }
    $effectState = 'AE Glass effect unchanged.'
    if ($Level -eq 'Max') {
        $bundledEffect = Join-Path $dst 'assets\packs\ae-glass\AE Glass.aex'
        if (!(Test-Path -LiteralPath $bundledEffect -PathType Leaf)) { throw 'AE Glass بسته‌بندی‌شده پیدا نشد.' }
        $sharedEffect = Get-AEEffectPath
        Set-InstallStatus 95 'effect' ('کپی AE Glass در: ' + $sharedEffect)
        $effectState = Install-AEEffect $bundledEffect $sharedEffect
        $profile.externalPathsModified += $sharedEffect
        $count = 0
        foreach ($entry in $vendorPlan) {
            $hash = (Get-FileHash -LiteralPath $entry.Source -Algorithm SHA256).Hash
            $newFile = Copy-ExternalVerified $entry.Source $entry.Target $hash
            if ($newFile) { [void]$externalAdded.Add(@{path=$entry.Target;sha256=$hash}); [void]$externalOwned.Add(@{path=$entry.Target;sha256=$hash}) }
            $count++
            if ($count % 8 -eq 0 -or $count -eq $vendorPlan.Count) { Set-InstallStatus ([int](96+3*$count/$vendorPlan.Count)) 'vendor' ("Installed / verified $count / $($vendorPlan.Count) companion files") }
        }
        $profile.packs += 'companion-tools'
    }
    $profile.externalComponents = @($externalOwned | Group-Object path | ForEach-Object { $_.Group[0] })
    $profile | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $dst 'INSTALL_PROFILE.json') -Encoding UTF8
    Set-InstallStatus 100 'done' ("Installed Varna Motion Studio $($package.version) ($Level). Previous versions backed up. $effectState $comfyState $audioState")
    exit 0
} catch {
    $reason = [string]$_
    foreach ($record in $externalAdded) { Remove-OwnedExternal ([string]$record.path) ([string]$record.sha256) }
    if ($installed -and (Test-Path -LiteralPath $dst)) {
        try { Move-Item -LiteralPath $dst -Destination (Join-Path $recovery ('failed-new-' + $stamp)) -ErrorAction Stop }
        catch { Write-Warning "Could not move incomplete installation: $_" }
    }
    Restore-Previous
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue }
    Set-InstallStatus 0 'error' ('Installation stopped: ' + $reason)
    exit 1
}
