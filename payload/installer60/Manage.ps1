param([ValidateSet('Install','Repair','Uninstall')][string]$Action='Install',[ValidateSet('AE','Premiere','Resolve')][string]$HostApp='AE',[ValidateSet('WithEngine','WithoutEngine')][string]$Mode='WithoutEngine',[string]$ScanRoot=$env:SystemDrive)
$ErrorActionPreference='Stop'
$package=Split-Path $PSScriptRoot -Parent
$payload=Join-Path $package 'Varna_Motion_Studio'
$report=Join-Path $env:TEMP ('Varna-preflight-'+(Get-Date -Format yyyyMMdd-HHmmss)+'.json')
function Find-Engines60([string]$Root){
 $queue=New-Object 'System.Collections.Generic.Queue[string]';$queue.Enqueue([IO.Path]::GetFullPath($Root+[IO.Path]::DirectorySeparatorChar));$seen=@{};$scanned=0
 while($queue.Count){$dir=$queue.Dequeue();$scanned++;if($scanned%100 -eq 0){Write-Progress -Activity 'Inventory C drive' -Status ($scanned.ToString()+' folders checked: '+$dir)};foreach($child in @(Get-ChildItem -LiteralPath $dir -Directory -Force -ErrorAction SilentlyContinue)){
  if($child.Attributes -band [IO.FileAttributes]::ReparsePoint){continue}
  if($child.Name -in @('Windows','$Recycle.Bin','System Volume Information','.git','node_modules')){continue}
  $path=$child.FullName
  $branded=$path -match '(?i)(varna|ghaf|qaf|قاف|وارنا)'
  $engine=(Test-Path -LiteralPath (Join-Path $path 'ComfyUI\main.py')) -and (Test-Path -LiteralPath (Join-Path $path 'python_embeded\python.exe'))
  $source=Test-Path -LiteralPath (Join-Path $path 'main.py')
  if($branded -and ($engine -or ($source -and (Test-Path -LiteralPath (Join-Path $path 'comfy'))))){if(!$seen[$path]){$seen[$path]=$true;[pscustomobject]@{Path=$path;Portable=$engine;Models=(Test-Path (Join-Path $path 'ComfyUI\models'))}};continue}
  $queue.Enqueue($path)
 }}
}
# Never use recursive deletion on a tree that may contain model junctions.
function Remove-EngineTree602 {
 param([Parameter(Mandatory=$true)][string]$Path,[switch]$Root)
 $item=Get-Item -LiteralPath $Path -Force -ErrorAction Stop
 if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){
  if($Root){throw ('Engine root changed to a link; scan again: '+$Path)}
  # Nonrecursive native deletion unlinks the entry; it never enumerates its target.
  if($item.Attributes -band [IO.FileAttributes]::Directory){[IO.Directory]::Delete($Path,$false)}else{[IO.File]::Delete($Path)}
  Write-Host ('Disconnected link; target preserved: '+$Path)
  return
 }
 if($item.PSIsContainer){
  foreach($child in @(Get-ChildItem -LiteralPath $Path -Force -ErrorAction Stop)){
   Remove-EngineTree602 -Path $child.FullName
  }
  # Refuse a late substitution or newly added content instead of traversing it.
  $current=Get-Item -LiteralPath $Path -Force -ErrorAction Stop
  if($current.Attributes -band [IO.FileAttributes]::ReparsePoint){throw ('Directory changed during deletion: '+$Path)}
  [IO.Directory]::Delete($Path,$false)
 }else{[IO.File]::Delete($Path)}
}
Write-Host '1. Preflight: close Adobe applications; inventory only, no files changed.'
if(Get-Process AfterFX,'Adobe Premiere Pro',Resolve -ErrorAction SilentlyContinue){throw 'Close After Effects, Premiere and Resolve first.'}
Write-Host 'Scanning branded engine installations; inaccessible folders are skipped and junctions are never followed...'
$engines=@(Find-Engines60 $ScanRoot)
if($Action -eq 'Uninstall'){
 $cache=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Downloads59'
 if(Test-Path -LiteralPath $cache -PathType Container){$engines+= [pscustomobject]@{Path=$cache;Portable=$false;Models=$false;Cache=$true}}
}
$state=[ordered]@{action=$Action;host=$HostApp;mode=$Mode;engines=$engines;packageManifest=(Test-Path (Join-Path $payload 'PACKAGE_MANIFEST.json'));nvidia=@(Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue|Where-Object Name -match NVIDIA).Count -gt 0}
$state|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $report -Encoding UTF8
$state['existingAEPanel']=Test-Path (Join-Path $env:APPDATA 'Adobe\CEP\extensions\VarnaMotionStudio')
$state['existingPremierePanel']=Test-Path (Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.varnalabs.editstudio.premiere')
$state['existingResolveTools']=Test-Path (Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Hosts\Resolve')
$state['bundledExtractor']=Test-Path (Join-Path $payload 'tools\vendor\7zr59.exe')
$state|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $report -Encoding UTF8
Start-Transcript -Path ($report+'.log') -Append|Out-Null
Write-Host ('Inventory: '+$report);$state|Format-List|Out-Host;$engines|Format-Table Path,Portable,Models -AutoSize|Out-Host
if($Action -eq 'Uninstall'){
 Write-Host 'These engine folders, including their models, will be permanently deleted. Other Varna panels/projects are not selected.'
 if(!$engines.Count){Write-Host 'No validated branded ComfyUI engines found.';return}
 $approval=Read-Host 'Type DELETE ENGINES to delete exactly the listed engine folders'
 if($approval -cne 'DELETE ENGINES'){Write-Host 'Cancelled; no files deleted.';return}
 foreach($engine in $engines){
  # Revalidate after confirmation; do not expand deletion to any parent directory.
  $path=$engine.Path
  if($engine.Portable -and (!(Test-Path (Join-Path $path 'ComfyUI\main.py')) -or !(Test-Path (Join-Path $path 'python_embeded\python.exe')))){throw ('Engine layout changed; scan again: '+$path)}
  if((Get-Item -LiteralPath $path).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Engine path changed to a link'}
  if(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue|Where-Object {$_.ExecutablePath -and $_.ExecutablePath.StartsWith($path+'\',[StringComparison]::OrdinalIgnoreCase)}){throw ('Stop the running engine first: '+$path)}
  Remove-EngineTree602 -Path $path -Root
  Write-Host ('Deleted: '+$path)
 }
 $pointer=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\engine-root.txt'
 if(Test-Path $pointer){$saved=(Get-Content $pointer -Raw).Trim();if(!(Test-Path $saved)){Remove-Item -LiteralPath $pointer -Force}}
 Write-Host 'Engine removal finished. Inventory retained in TEMP.';return
}
if(!$state.packageManifest){throw 'Extract the complete release ZIP first.'}
if($Mode -eq 'WithEngine' -and !$state.nvidia -and !$engines.Count){throw 'Automatic engine installation currently requires NVIDIA. Choose WithoutEngine for this device.'}
Write-Host '2. Verify and prepare package components.'
& (Join-Path $package 'PREPARE_GITHUB_DOWNLOAD.ps1');if($LASTEXITCODE){throw 'Package preparation failed'}
Write-Host '3. Install/repair selected profile. Valid shared engines and downloads are reused.'
if($HostApp -eq 'AE'){
 & (Join-Path $payload 'INSTALL_WINDOWS.ps1') -Level Max -EngineMode $Mode
 if($LASTEXITCODE){throw 'Panel/engine step failed; read its diagnostic'}
}else{
 if($Mode -eq 'WithEngine'){
  & (Join-Path $payload 'INSTALL_WINDOWS.ps1') -Level Studio -EngineMode $Mode -EngineOnly
  if($LASTEXITCODE){throw 'Engine step failed'}
 }
 & (Join-Path $payload 'integrations\INSTALL_CROSS_HOST_WINDOWS.ps1') -HostApp $HostApp -EngineMode $Mode
}
Write-Host '4. Completed. Selected profile recorded; restart the host.'
