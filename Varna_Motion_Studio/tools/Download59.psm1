function Receive-VarnaFile59 {
 param([Parameter(Mandatory=$true)][string]$Uri,[Parameter(Mandatory=$true)][string]$Target,[long]$ExpectedBytes=0,[string]$Sha256='', [hashtable]$Headers=@{},[string]$Label='Download',[string]$LogPath=$env:VARNA_INSTALL_LOG)
 $ErrorActionPreference='Stop';[Net.ServicePointManager]::SecurityProtocol=[Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12;Add-Type -AssemblyName System.Net.Http
 $parent=Split-Path $Target -Parent;if($parent){[IO.Directory]::CreateDirectory($parent)|Out-Null}
 for($attempt=1;$attempt -le 3;$attempt++){
  $client=New-Object Net.Http.HttpClient;$client.Timeout=[TimeSpan]::FromHours(4);$response=$null;$inputStream=$null;$outputStream=$null
  try {
   $offset=if(Test-Path -LiteralPath $Target){[long](Get-Item -LiteralPath $Target).Length}else{0}
   if($ExpectedBytes -gt 0 -and $offset -gt $ExpectedBytes){throw 'Partial download is larger than expected'}
   if($offset -eq $ExpectedBytes -and $offset -gt 0){if(!$Sha256 -or (Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash -eq $Sha256){Write-Host "$Label : reusing complete verified download";return};Move-Item -LiteralPath $Target -Destination ($Target+'.bad-'+[guid]::NewGuid().ToString('N').Substring(0,8));$offset=0}
   $request=New-Object Net.Http.HttpRequestMessage([Net.Http.HttpMethod]::Get,$Uri)
   foreach($key in $Headers.Keys){$request.Headers.TryAddWithoutValidation([string]$key,[string]$Headers[$key])|Out-Null}
   if($offset -gt 0){$request.Headers.Range=New-Object Net.Http.Headers.RangeHeaderValue($offset,$null)}
   Write-Host ("{0} | connecting | attempt {1}/3 | resume {2:N1} MiB" -f $Label,$attempt,($offset/1MB))
   $response=$client.SendAsync($request,[Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult();$response.EnsureSuccessStatusCode()|Out-Null
   if($offset -gt 0 -and [int]$response.StatusCode -eq 206){if(!$response.Content.Headers.ContentRange -or $response.Content.Headers.ContentRange.From -ne $offset){throw 'Server returned an incorrect resume range'}}elseif($offset -gt 0){Write-Host 'Server does not support resume; restarting this file';$offset=0}
   $total=$ExpectedBytes;if(!$total -and $response.Content.Headers.ContentLength){$total=$offset+[long]$response.Content.Headers.ContentLength}
   $inputStream=$response.Content.ReadAsStreamAsync().GetAwaiter().GetResult();$mode=if($offset){[IO.FileMode]::Append}else{[IO.FileMode]::Create};$outputStream=[IO.File]::Open($Target,$mode,[IO.FileAccess]::Write,[IO.FileShare]::Read)
   $buffer=New-Object byte[] (1024*1024);$received=$offset;$watch=[Diagnostics.Stopwatch]::StartNew();$lastTime=-2.0;$lastBytes=$offset;$speed=0
   while(($count=$inputStream.Read($buffer,0,$buffer.Length)) -gt 0){$outputStream.Write($buffer,0,$count);$received+=$count;if($total -gt 0 -and $received -gt $total){throw 'Server sent more data than expected'};$seconds=$watch.Elapsed.TotalSeconds
    if($seconds-$lastTime -ge 1){$speed=($received-$lastBytes)/[Math]::Max(.01,$seconds-[Math]::Max(0,$lastTime));$pct=if($total -gt 0){[Math]::Min(100,[Math]::Floor(100*$received/$total))}else{0};$eta=if($speed -gt 0 -and $total -gt 0){[TimeSpan]::FromSeconds(($total-$received)/$speed).ToString('hh\:mm\:ss')}else{'--:--:--'};$message=('{0} | {1:N1} / {2:N1} MiB | {3}% | {4:N2} MiB/s | ETA {5}' -f $Label,($received/1MB),($total/1MB),$pct,($speed/1MB),$eta);Write-Host $message;Write-Progress -Activity $Label -Status $message -PercentComplete $pct;if($LogPath){Add-Content -LiteralPath $LogPath -Value ((Get-Date -Format o)+' '+$message) -Encoding UTF8};$lastTime=$seconds;$lastBytes=$received}
   }
   $outputStream.Dispose();$outputStream=$null;Write-Progress -Activity $Label -Completed
   if($ExpectedBytes -gt 0 -and $received -ne $ExpectedBytes){throw 'Download stopped before the expected size'}
   if($Sha256){Write-Host "$Label | verifying SHA-256...";if((Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash -ne $Sha256){Move-Item -LiteralPath $Target -Destination ($Target+'.bad-'+[guid]::NewGuid().ToString('N').Substring(0,8));throw 'Downloaded file checksum mismatch'}}
   Write-Host ('{0} | complete | {1:N1} MiB | average {2:N2} MiB/s | {3:N1}s' -f $Label,($received/1MB),(($received-$offset)/1MB/[Math]::Max(.01,$watch.Elapsed.TotalSeconds)),$watch.Elapsed.TotalSeconds);return
  } catch {Write-Host ("$Label | failed: "+$_.Exception.Message);if($attempt -eq 3){throw};Start-Sleep -Seconds 2}
  finally {if($outputStream){$outputStream.Dispose()};if($inputStream){$inputStream.Dispose()};if($response){$response.Dispose()};$client.Dispose()}
 }
}
Export-ModuleMember -Function Receive-VarnaFile59
