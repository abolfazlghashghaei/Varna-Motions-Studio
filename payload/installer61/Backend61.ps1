param([Parameter(Mandatory=$true)][string]$RequestFile,[Parameter(Mandatory=$true)][string]$StatusFile,[Parameter(Mandatory=$true)][string]$SpecFile)
$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
[Console]::OutputEncoding=New-Object Text.UTF8Encoding($false)
Import-Module (Join-Path $PSScriptRoot 'Core61.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'Download61.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'EngineCleanup61.psm1') -Force
$stage=$null;$completed=New-Object Collections.ArrayList
$home61=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio'
$cache=Join-Path $home61 'Cache61';$recovery=Join-Path $home61 'Recovery61';$receiptPath=Join-Path $home61 'Setup61State\installed.json'
try{
 $request=Get-Content -LiteralPath $RequestFile -Raw -Encoding UTF8|ConvertFrom-Json
 if($request.action -notin @('Inspect','Install','Repair','Remove')){throw 'Unsupported operation'}
 $hosts=@($request.hosts);foreach($h in $hosts){if($h -notin @('AE','Premiere','Resolve')){throw 'Unknown host'}}
 $inventory=Get-Inventory61
 if($request.action -eq 'Inspect'){
  Write-Status61 $StatusFile 'Inspect' 'Checking installed panels, GPU, available disk space and running applications...'
  $inventory['engines']=@()
  if($request.scanEngines){Write-Status61 $StatusFile 'Inspect' 'Scanning C for branded engines. Inaccessible folders and junctions are skipped.';$inventory.engines=@(Find-Engines60 $env:SystemDrive);$legacyCache=Join-Path $home61 'Downloads59';if(Test-Path -LiteralPath $legacyCache -PathType Container){$inventory.engines+=@{Path=$legacyCache;Cache=$true}}}
  Write-Status61 $StatusFile 'Inspected' 'Inventory complete. No installation files changed.' $inventory
  exit 0
 }
 if($inventory.running.Count){throw ('Close these applications first: '+($inventory.running -join ', '))}
 if(!$hosts.Count -and !($request.action -eq 'Remove' -and (@($request.enginePaths).Count -or $request.allowManagerOnly))){throw 'Select at least one host or an engine removal target'}
 foreach($h in $hosts){if($inventory.hosts[$h].exists -and !$inventory.hosts[$h].owned){throw ('Unrecognized existing '+$h+' folder; preserved: '+$inventory.hosts[$h].path)}}
 Assert-NotCancelled61
 if($request.action -eq 'Remove'){
  Write-Status61 $StatusFile 'Removing' 'Removing only recognized selected components; preserving user settings and models unless explicitly selected.'
  $oldReceipt=$null;if(Test-Path -LiteralPath $receiptPath){$oldReceipt=Get-Content -LiteralPath $receiptPath -Raw -Encoding UTF8|ConvertFrom-Json}
  $paths=Get-HostPaths61
  foreach($h in $hosts){
   Assert-NotCancelled61
   $owned=@()
   if($h -eq 'AE' -and (Test-OwnedHost61 $h $paths[$h])){try{$p=Get-Content (Join-Path $paths[$h] 'INSTALL_PROFILE.json') -Raw -Encoding UTF8|ConvertFrom-Json;$owned=@($p.externalComponents)}catch{Write-Host 'External ownership profile unavailable; external files preserved.'}}
   $saved=Move-OwnedHost61 $h $paths[$h] $recovery
   if($saved){
    foreach($record in $owned){if($record.path -and $record.sha256 -and (Test-Path -LiteralPath $record.path -PathType Leaf)){
     $item=Get-Item -LiteralPath $record.path -Force
     if(!($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -and (Get-FileHash -LiteralPath $record.path).Hash -eq $record.sha256){Move-Item -LiteralPath $record.path -Destination (Join-Path $recovery ([guid]::NewGuid().ToString('N')+'-'+$item.Name)) -ErrorAction Stop}else{Write-Host ('Changed/shared external file preserved: '+$record.path)}
    }}
    if($h -eq 'Resolve' -and $oldReceipt){foreach($record in @($oldReceipt.resolveFiles)){
     if($record.path -and (Test-Path -LiteralPath $record.path -PathType Leaf) -and (Get-FileHash -LiteralPath $record.path).Hash -eq $record.sha256){Move-Item -LiteralPath $record.path -Destination (Join-Path $recovery ([guid]::NewGuid().ToString('N')+'-'+(Split-Path $record.path -Leaf))) -ErrorAction Stop}
    }}
    [void]$completed.Add($h)
   }
  }
  foreach($path in @($request.enginePaths)){
   Assert-NotCancelled61
   if(!$request.confirmEngineRemoval){throw 'Engine/model removal was not explicitly confirmed'}
   $canonical=[IO.Path]::GetFullPath([string]$path).TrimEnd('\');$root=[IO.Path]::GetPathRoot($canonical)
   if($root -ne ($env:SystemDrive+'\') -or $canonical -notmatch '(?i)(varna|ghaf|qaf|قاف|وارنا)'){throw 'Engine path is outside the permitted branded C-drive scope'}
   $isCache=$canonical -eq (Join-Path $home61 'Downloads59')
   $portable=(Test-Path -LiteralPath (Join-Path $canonical 'ComfyUI\main.py')) -and (Test-Path -LiteralPath (Join-Path $canonical 'python_embeded\python.exe'))
   $source=(Test-Path -LiteralPath (Join-Path $canonical 'main.py')) -and (Test-Path -LiteralPath (Join-Path $canonical 'comfy'))
   if(!$isCache -and !$portable -and !$source){throw ('Engine identity changed; scan again: '+$canonical)}
   if(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue|Where-Object {$_.ExecutablePath -and $_.ExecutablePath.StartsWith($canonical+'\',[StringComparison]::OrdinalIgnoreCase)}){throw ('Stop the running engine first: '+$canonical)}
   Remove-EngineTree602 -Path $canonical -Root
   [void]$completed.Add($canonical)
  }
  $pointer=Join-Path $home61 'engine-root.txt';if(Test-Path $pointer){$saved=(Get-Content $pointer -Raw).Trim();if($saved -and !(Test-Path -LiteralPath $saved)){Remove-Item -LiteralPath $pointer -Force}}
  if($request.clearCache -and (Test-Path -LiteralPath $cache)){Remove-EngineTree602 -Path $cache -Root}
  if(Test-Path -LiteralPath $receiptPath){
   $remaining=if($oldReceipt){@($oldReceipt.hosts|Where-Object {$_ -notin $hosts})}else{@()}
   if(!$remaining.Count){Remove-Item -LiteralPath $receiptPath -Force}else{$oldReceipt.hosts=$remaining;$oldReceipt|ConvertTo-Json -Depth 10|Set-Content -LiteralPath $receiptPath -Encoding UTF8}
  }
  Write-Status61 $StatusFile 'Complete' 'Selected components removed. Recovery copies, user data and unselected engines are preserved.' @{completed=@($completed);action='Remove'}
  exit 0
 }
 if($request.engine -and !$inventory.nvidia){throw 'Automatic local AI engine installation requires NVIDIA; disable the engine option on this device.'}
 Write-Status61 $StatusFile 'Download' 'Obtaining the checksum-pinned package; verified downloads are reused and partial downloads resumed.'
 $spec=Get-Content -LiteralPath $SpecFile -Raw -Encoding UTF8|ConvertFrom-Json;Assert-Spec61 $spec
 New-Item -ItemType Directory -Path $cache -Force|Out-Null
 $archive=Join-Path $cache ($spec.sha256+'.zip')
 Receive-VarnaFile59 -Uri $spec.url -Target $archive -ExpectedBytes ([long]$spec.bytes) -Sha256 $spec.sha256 -Label 'Varna package'
 if(!(Test-Archive61 $archive $spec)){throw 'Package verification failed'}
 Assert-NotCancelled61
 Write-Status61 $StatusFile 'Extract' 'Extracting the verified package. Cancel takes effect after this step.'
 $stage=Join-Path $home61 ('Extract61\'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory $stage -Force|Out-Null
 Expand-Archive -LiteralPath $archive -DestinationPath $stage
 $roots=@(Get-ChildItem -LiteralPath $stage -Directory);if($roots.Count -ne 1){throw 'Unsupported archive structure'}
 $package=Join-Path $roots[0].FullName 'payload';$payload=Join-Path $package 'Varna_Motion_Studio'
 foreach($required in @('PREPARE_GITHUB_DOWNLOAD.ps1','VarnaDownload.psm1','Varna_Motion_Studio\tools\Download59.psm1','Varna_Motion_Studio\tools\Profile60.ps1','Varna_Motion_Studio\INSTALL_WINDOWS.ps1','Varna_Motion_Studio\PACKAGE_MANIFEST.json')){if(!(Test-Path -LiteralPath (Join-Path $package $required) -PathType Leaf)){throw ('Incomplete package dependency: '+$required)}}
 Write-Status61 $StatusFile 'Verify' 'Package structure and restoration helpers verified.'
 Write-Host 'Windows profile: Mac-only ffmpeg component is excluded; no 147 MiB Mac download is needed.'
 $mode=if($request.engine){'WithEngine'}else{'WithoutEngine'}
 if($request.engine -and 'AE' -notin $hosts){Write-Status61 $StatusFile 'Engine' 'Checking/reusing or installing the local AI engine.';Invoke-Installer61 (Join-Path $payload 'INSTALL_WINDOWS.ps1') @{Level='Studio';EngineMode=$mode;EngineOnly=$true}}
 foreach($h in $hosts){
  Write-Status61 $StatusFile 'Install' ('Installing/repairing '+$h+' with profile '+$mode+'. Existing owned installs are backed up.')
  if($h -eq 'AE'){Invoke-Installer61 (Join-Path $payload 'INSTALL_WINDOWS.ps1') @{Level='Max';EngineMode=$mode}}
  else{Invoke-Installer61 (Join-Path $payload 'integrations\INSTALL_CROSS_HOST_WINDOWS.ps1') @{HostApp=$h;EngineMode=$mode}}
  [void]$completed.Add($h)
  $resolveFiles=@()
  if($h -eq 'Resolve'){$utility=Join-Path $env:APPDATA 'Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts\Utility';foreach($name in @('Motion_Tools.lua','Import_Title.py')){$f=Join-Path $utility $name;if(Test-Path -LiteralPath $f){$resolveFiles+=@{path=$f;sha256=(Get-FileHash -LiteralPath $f).Hash}}}}
  Save-Receipt61 -Path $receiptPath -HostName $h -Mode $mode -Commit $spec.commit -ArchiveHash $spec.sha256 -ResolveFiles $resolveFiles
 }
 Write-Status61 $StatusFile 'Complete' 'Selected components installed. Restart the selected host applications.' @{completed=@($completed);action=$request.action}
 exit 0
}catch{
 $message=$_.Exception.Message;$phase=if($env:VARNA_CANCEL_FILE -and (Test-Path -LiteralPath $env:VARNA_CANCEL_FILE)){'Cancelled'}else{'Failed'}
 Write-Host ($_|Out-String)
 Write-Status61 $StatusFile $phase $message @{completed=@($completed);action=$request.action}
 exit 1
}finally{
 if($stage -and (Test-Path -LiteralPath $stage)){try{Remove-EngineTree602 -Path $stage -Root}catch{Write-Host ('Extraction cleanup pending: '+$stage+'; '+$_.Exception.Message)}}
}
