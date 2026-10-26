# Prepare GitHub source archives without changing the plugin's manifest or trust checks.
$ErrorActionPreference = 'Stop'
$phase = 'reading the package manifest'
$tempFile = $null
$client = $null
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $packageRoot = Join-Path $PSScriptRoot 'Varna_Motion_Studio'
    $manifest = Get-Content -LiteralPath (Join-Path $packageRoot 'PACKAGE_MANIFEST.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    $relative = 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg'
    $entries = @($manifest.files | Where-Object { $_.path -eq $relative })
    if ($manifest.version -ne '4.5.0-rc.47' -or $entries.Count -ne 1) { throw 'Unexpected package manifest.' }
    $entry = $entries[0]
    if ([string]$entry.sha256 -notmatch '^[a-fA-F0-9]{64}$' -or [long]$entry.bytes -le 0) { throw 'Invalid file metadata.' }
    $target = Join-Path $packageRoot $relative
    $originalHash = $null
    if (Test-Path -LiteralPath $target) {
        $item = Get-Item -LiteralPath $target -Force
        if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Unexpected target type.' }
        $originalHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
        if ($item.Length -eq [long]$entry.bytes -and $originalHash -eq [string]$entry.sha256) {
            Write-Host 'Package component already verified.'
            exit 0
        }
        if ($item.Length -gt 1024) { throw 'An existing, different file will not be overwritten.' }
        $pointer = [IO.File]::ReadAllText($target)
        if (!$pointer.StartsWith('version https://git-lfs.github.com/spec/v1') -or $pointer -notmatch ('oid sha256:' + [regex]::Escape([string]$entry.sha256)) -or $pointer -notmatch ('size ' + [string]$entry.bytes + '(\r?\n|$)')) { throw 'Unrecognized Git LFS pointer.' }
    }
    $phase = 'requesting the public Git LFS component'
    $request = @{ operation = 'download'; transfers = @('basic'); objects = @(@{ oid = [string]$entry.sha256; size = [long]$entry.bytes }) } | ConvertTo-Json -Depth 6 -Compress
    $response = Invoke-RestMethod -Uri 'https://github.com/abolfazlghashghaei/Varna-Motions-Studio.git/info/lfs/objects/batch' -Method Post -ContentType 'application/vnd.git-lfs+json' -Headers @{ Accept = 'application/vnd.git-lfs+json' } -Body $request
    $objects = @($response.objects)
    if ($objects.Count -ne 1 -or $objects[0].error -or $objects[0].oid -ne [string]$entry.sha256 -or [long]$objects[0].size -ne [long]$entry.bytes) { throw 'Git LFS response did not match the requested component.' }
    $download = $objects[0].actions.download
    $uri = [Uri]$download.href
    if ($uri.Scheme -ne 'https' -or $uri.DnsSafeHost -notin @('github-cloud.githubusercontent.com', 'github-cloud.s3.amazonaws.com')) { throw 'Unsupported component source.' }
    $phase = 'downloading the Git LFS component'
    Write-Host ('Downloading a required package component (' + [math]::Round([long]$entry.bytes / 1MB) + ' MB) from GitHub...')
    [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target))
    $tempFile = $target + '.download-' + [guid]::NewGuid().ToString('N')
    $client = New-Object Net.WebClient
    if ($download.header) { foreach ($header in $download.header.PSObject.Properties) { $client.Headers[$header.Name] = [string]$header.Value } }
    $client.DownloadFile($uri, $tempFile)
    $phase = 'verifying the component checksum'
    if ((Get-Item -LiteralPath $tempFile).Length -ne [long]$entry.bytes -or (Get-FileHash -LiteralPath $tempFile -Algorithm SHA256).Hash -ne [string]$entry.sha256) { throw 'Component checksum mismatch.' }
    $phase = 'restoring the verified component'
    if ($originalHash) {
        if (!(Test-Path -LiteralPath $target) -or (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $originalHash) { throw 'The target changed while downloading.' }
        [IO.File]::Replace($tempFile, $target, $null)
    } else { [IO.File]::Move($tempFile, $target) }
    $tempFile = $null
    Write-Host 'Package component verified. Starting the original installer.'
    exit 0
} catch {
    Write-Host ('Preparation failed while ' + $phase + '. The original installer was not started.')
    Write-Host 'Check your connection to GitHub, keep the extracted files together, and retry.'
    exit 1
} finally {
    if ($client) { $client.Dispose() }
    if ($tempFile -and (Test-Path -LiteralPath $tempFile)) { Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue }
}
