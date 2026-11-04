$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
Import-Module (Join-Path (Split-Path $PSScriptRoot -Parent) 'Download61.psm1') -Force
$root=Join-Path ([IO.Path]::GetTempPath()) ('download61-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory $root|Out-Null
try{
 $bytes=New-Object byte[] (5*1024*1024);for($i=0;$i -lt $bytes.Length;$i++){$bytes[$i]=61};$expected=Join-Path $root 'expected';[IO.File]::WriteAllBytes($expected,$bytes);$hash=(Get-FileHash $expected).Hash
 foreach($endpoint in @('stall','headers')){
  $env:VARNA_CANCEL_FILE=Join-Path $root ('cancel-'+$endpoint);$target=Join-Path $root $endpoint
  $job=Start-Job -ScriptBlock {param($f);Start-Sleep -Seconds 1;[IO.File]::WriteAllText($f,'cancel')} -ArgumentList $env:VARNA_CANCEL_FILE
  $cancelled=$false;$watch=[Diagnostics.Stopwatch]::StartNew()
  try{Receive-VarnaFile59 -Uri ('http://127.0.0.1:8661/'+$endpoint) -Target $target -ExpectedBytes $bytes.Length -Sha256 $hash}catch{if($_.Exception.Message -match 'CANCELLED'){$cancelled=$true}}
  Wait-Job $job|Out-Null;Remove-Job $job
  if(!$cancelled -or $watch.Elapsed.TotalSeconds -gt 15){throw ('Stalled '+$endpoint+' request could not cancel')}
  Remove-Item -LiteralPath $env:VARNA_CANCEL_FILE -Force;$env:VARNA_CANCEL_FILE=$null
  if($endpoint -eq 'stall' -and (!(Test-Path $target) -or (Get-Item $target).Length -le 0)){throw 'Partial bytes not retained'}
 }
 $target=Join-Path $root 'stall';Receive-VarnaFile59 -Uri 'http://127.0.0.1:8661/file' -Target $target -ExpectedBytes $bytes.Length -Sha256 $hash
 if((Get-FileHash $target).Hash -ne $hash){throw 'Cancelled download did not resume correctly'}
 [IO.File]::WriteAllBytes($target,(New-Object byte[] ($bytes.Length+1)))
 Receive-VarnaFile59 -Uri 'http://127.0.0.1:8661/file' -Target $target -ExpectedBytes $bytes.Length -Sha256 $hash
 if((Get-FileHash $target).Hash -ne $hash){throw 'Oversized partial not recovered'}
 Write-Host 'PASS61 actual HTTP: stalled headers/body cancel promptly, partial retained/resumed with exact hash, oversized partial quarantined and recovered.'
}finally{$env:VARNA_CANCEL_FILE=$null;Remove-Item $root -Recurse -Force}
