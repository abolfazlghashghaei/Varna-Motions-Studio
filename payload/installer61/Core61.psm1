$ErrorActionPreference='Stop'
function Write-Status61([string]$Path,[string]$Phase,[string]$Message,[object]$Data=$null){
 $value=@{phase=$Phase;message=$Message;data=$Data;time=(Get-Date -Format o)}|ConvertTo-Json -Depth 12
 $tmp=$Path+'.tmp';[IO.File]::WriteAllText($tmp,$value,(New-Object Text.UTF8Encoding($false)))
 if(Test-Path -LiteralPath $Path){[IO.File]::Replace($tmp,$Path,[NullString]::Value)}else{[IO.File]::Move($tmp,$Path)}
 Write-Host ('['+$Phase+'] '+$Message)
}
function Assert-NotCancelled61 {
 if($env:VARNA_CANCEL_FILE -and (Test-Path -LiteralPath $env:VARNA_CANCEL_FILE)){throw 'CANCELLED: completed components and partial downloads are preserved.'}
}
function Test-Archive61([string]$File,[object]$Spec){
 return (Test-Path -LiteralPath $File -PathType Leaf) -and (Get-Item -LiteralPath $File).Length -eq [long]$Spec.bytes -and (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash -eq $Spec.sha256
}
function Assert-Spec61([object]$Spec){
 if($Spec.commit -notmatch '^[a-f0-9]{40}$' -or $Spec.sha256 -notmatch '^[a-f0-9]{64}$' -or [long]$Spec.bytes -lt 1000000 -or $Spec.url -ne ('https://github.com/abolfazlghashghaei/Varna-Motions-Studio/archive/'+$Spec.commit+'.zip')){throw 'Invalid pinned package metadata'}
}
function Get-HostPaths61 {
 return @{AE=(Join-Path $env:APPDATA 'Adobe\CEP\extensions\VarnaMotionStudio');Premiere=(Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.varnalabs.editstudio.premiere');Resolve=(Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Hosts\Resolve')}
}
function Test-OwnedHost61([string]$HostName,[string]$Path){
 try{
  if((Get-Item -LiteralPath $Path -Force -ErrorAction Stop).Attributes -band [IO.FileAttributes]::ReparsePoint){return $false}
  if($HostName -in @('AE','Premiere')){
   [xml]$m=Get-Content -LiteralPath (Join-Path $Path 'CSXS\manifest.xml') -Raw -Encoding UTF8
   $id=if($HostName -eq 'AE'){'com.varnalabs.motionstudio'}else{'com.varnalabs.editstudio.premiere'}
   return $m.ExtensionManifest.ExtensionBundleId -eq $id
  }
  $p=Get-Content -LiteralPath (Join-Path $Path 'INSTALL_PROFILE.json') -Raw -Encoding UTF8|ConvertFrom-Json
  return $p.host -eq 'Resolve' -and $p.version -eq '4.5.0-rc.47'
 }catch{return $false}
}
function Get-Inventory61 {
 $paths=Get-HostPaths61;$hosts=@{}
 foreach($name in @('AE','Premiere','Resolve')){$hosts[$name]=@{path=$paths[$name];exists=(Test-Path -LiteralPath $paths[$name]);owned=(Test-OwnedHost61 $name $paths[$name])}}
 $gpu=@(Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue|ForEach-Object {$_.Name})
 $drive=Get-PSDrive -Name ([IO.Path]::GetPathRoot($env:LOCALAPPDATA).Substring(0,1)) -ErrorAction SilentlyContinue
 return @{hosts=$hosts;gpu=$gpu;nvidia=@($gpu|Where-Object {$_ -match 'NVIDIA'}).Count -gt 0;freeBytes=$drive.Free;running=@(Get-Process AfterFX,'Adobe Premiere Pro',Resolve -ErrorAction SilentlyContinue|ForEach-Object {$_.ProcessName})}
}
function Move-OwnedHost61([string]$Name,[string]$Path,[string]$Recovery){
 if(!(Test-Path -LiteralPath $Path)){Write-Host ($Name+' already absent');return $null}
 if(!(Test-OwnedHost61 $Name $Path)){throw ('Unrecognized or linked installation; preserved: '+$Path)}
 New-Item -ItemType Directory -Path $Recovery -Force|Out-Null
 $dest=Join-Path $Recovery ($Name+'-'+[guid]::NewGuid().ToString('N'))
 Move-Item -LiteralPath $Path -Destination $dest -ErrorAction Stop
 Write-Host ($Name+' removed from host; recovery copy: '+$dest)
 return $dest
}
function Invoke-Installer61([string]$Script,[hashtable]$Arguments){
 Assert-NotCancelled61
 # Use a child process: legacy installers use exit, and must not terminate this worker.
 $argFile=Join-Path $env:TEMP ('varna61-args-'+[guid]::NewGuid().ToString('N')+'.json')
 $Arguments|ConvertTo-Json|Set-Content -LiteralPath $argFile -Encoding UTF8
 $process=$null
 try{
  $shell=Join-Path $PSHOME 'powershell.exe';if(!(Test-Path -LiteralPath $shell)){$shell=(Get-Process -Id $PID).Path}
  $info=New-Object Diagnostics.ProcessStartInfo
  $info.FileName=$shell
  $info.Arguments='-NoLogo -NoProfile -ExecutionPolicy Bypass -File "'+(Join-Path $PSScriptRoot 'Invoke61.ps1')+'" -Script "'+$Script+'" -ArgumentsFile "'+$argFile+'"'
  $info.UseShellExecute=$false;$info.CreateNoWindow=$true;$info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
  $info.StandardOutputEncoding=New-Object Text.UTF8Encoding($false);$info.StandardErrorEncoding=New-Object Text.UTF8Encoding($false)
  $process=New-Object Diagnostics.Process;$process.StartInfo=$info;[void]$process.Start()
  $errors=$process.StandardError.ReadToEndAsync()
  while(($line=$process.StandardOutput.ReadLine()) -ne $null){Write-Host $line}
  $process.WaitForExit();$errorText=$errors.GetAwaiter().GetResult();if($errorText){Write-Host $errorText}
  if($process.ExitCode -ne 0){throw ('Installation step failed ('+$process.ExitCode+'): '+$Script)}
 }finally{if($process){$process.Dispose()};Remove-Item -LiteralPath $argFile -Force -ErrorAction SilentlyContinue}
}

Export-ModuleMember -Function *61
function Save-Receipt61([string]$Path,[string]$HostName,[string]$Mode,[string]$Commit,[string]$ArchiveHash,[object[]]$ResolveFiles=@()){
 $receipt=@{version=61;time=(Get-Date -Format o);hosts=@();profiles=@{};sourceCommit=$Commit;archiveSha256=$ArchiveHash;resolveFiles=@()}
 if(Test-Path -LiteralPath $Path){
  $old=Get-Content -LiteralPath $Path -Raw -Encoding UTF8|ConvertFrom-Json
  $receipt.hosts=@($old.hosts);$receipt.resolveFiles=@($old.resolveFiles)
  if($old.profiles){foreach($p in $old.profiles.PSObject.Properties){$receipt.profiles[$p.Name]=$p.Value}}
 }
 $receipt.hosts=@(@($receipt.hosts)+@($HostName)|Select-Object -Unique);$receipt.profiles[$HostName]=$Mode
 if($HostName -eq 'Resolve'){$receipt.resolveFiles=@($ResolveFiles)}
 New-Item -ItemType Directory (Split-Path $Path -Parent) -Force|Out-Null
 $tmp=$Path+'.tmp';$receipt|ConvertTo-Json -Depth 12|Set-Content -LiteralPath $tmp -Encoding UTF8
 if(Test-Path -LiteralPath $Path){[IO.File]::Replace($tmp,$Path,[NullString]::Value)}else{[IO.File]::Move($tmp,$Path)}
}
Export-ModuleMember -Function Save-Receipt61
