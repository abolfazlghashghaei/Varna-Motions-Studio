$ErrorActionPreference='Stop'
$root=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Connect58'
$config=Get-Content -LiteralPath (Join-Path $root 'server.json') -Raw|ConvertFrom-Json
$spec=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'tunnel-version.json') -Raw|ConvertFrom-Json
$asset=@($spec.asset)[0];if($asset.digest -notmatch '^sha256:[a-f0-9]{64}$'){throw 'Invalid pinned tunnel checksum'}
$bin=Join-Path $root ('cloudflared-'+$spec.tag+'.exe');$valid=(Test-Path -LiteralPath $bin) -and (Get-Item -LiteralPath $bin).Length -eq $asset.size -and (Get-FileHash -LiteralPath $bin -Algorithm SHA256).Hash -eq $asset.digest.Substring(7)
if(!$valid){$download=$bin+'.download';try{[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;(New-Object Net.WebClient).DownloadFile($asset.browser_download_url,$download);if((Get-Item -LiteralPath $download).Length -ne $asset.size -or (Get-FileHash -LiteralPath $download -Algorithm SHA256).Hash -ne $asset.digest.Substring(7)){throw 'Tunnel download checksum failed'};Move-Item -LiteralPath $download -Destination $bin -Force}finally{Remove-Item -LiteralPath $download -Force -ErrorAction SilentlyContinue}}
try{$reply=Invoke-RestMethod -Uri ('http://127.0.0.1:'+$config.port+'/v1/status') -Headers @{Authorization=('Bearer '+$config.token)} -TimeoutSec 3}catch{Start-Process -FilePath (Join-Path $root 'START_SERVER.cmd');Write-Host 'Wait until the personal server shows its local address.';Read-Host 'Press Enter when it is ready'|Out-Null}
Write-Host 'Copy the https://...trycloudflare.com URL below into the phone connection settings.'
Write-Host ('Pairing key: '+$config.token)
Write-Host 'Keep this tunnel and the server running. The address changes when this quick tunnel restarts.'
& $bin tunnel --url ('http://127.0.0.1:'+$config.port) --no-autoupdate
