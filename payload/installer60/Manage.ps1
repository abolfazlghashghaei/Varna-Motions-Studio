param([ValidateSet('Install','Repair','Uninstall')][string]$Action='Install',[ValidateSet('AE','Premiere','Resolve')][string]$HostApp='AE',[ValidateSet('WithEngine','WithoutEngine')][string]$Mode='WithoutEngine')
$ErrorActionPreference='Stop'
$package=Split-Path $PSScriptRoot -Parent
$payload=Join-Path $package 'Varna_Motion_Studio'
$report=Join-Path $env:TEMP ('Varna-preflight-'+(Get-Date -Format yyyyMMdd-HHmmss)+'.json')
function Get-VarnaEngineCandidates {
    param([string]$LocalAppData=$env:LOCALAPPDATA)
    if ([string]::IsNullOrWhiteSpace($LocalAppData)) { throw 'LOCALAPPDATA is unavailable; engine locations cannot be checked.' }
    # Exactly two installation addresses. Only immediate version directories
    # inside Varna's own address are inspected; never traverse a drive/profile.
    $locations = @((Join-Path $LocalAppData 'VarnaMotionStudio\Engines59'),(Join-Path $LocalAppData 'GHAF\Core'))
    $saved = ''
    $candidates = New-Object System.Collections.ArrayList
    foreach ($location in $locations) {
        $parent = Get-Item -LiteralPath (Split-Path $location -Parent) -Force -ErrorAction SilentlyContinue
        $item = Get-Item -LiteralPath $location -Force -ErrorAction SilentlyContinue
        if (!$parent -or !$item -or !$item.PSIsContainer) { continue }
        if (($parent.Attributes -band [IO.FileAttributes]::ReparsePoint) -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { continue }
        [void]$candidates.Add($item.FullName)
        if ($location -eq $locations[0]) {
            foreach ($version in @(Get-ChildItem -LiteralPath $location -Directory -Force -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)) {
                if (!($version.Attributes -band [IO.FileAttributes]::ReparsePoint)) { [void]$candidates.Add($version.FullName) }
            }
        }
    }
    # A saved pointer may prioritize a known version, never add a third address.
    $pointer = Join-Path $LocalAppData 'VarnaMotionStudio\engine-root.txt'
    if (Test-Path -LiteralPath $pointer -PathType Leaf) {
        $saved = ([string](Get-Content -LiteralPath $pointer -Raw -ErrorAction SilentlyContinue)).Trim()
        if ($candidates.Contains($saved)) { $saved }
    }
    foreach ($candidate in $candidates) { if ($candidate -ne $saved) { $candidate } }
}
function Find-Engines60([string]$LocalAppData=$env:LOCALAPPDATA){
 foreach($path in @(Get-VarnaEngineCandidates -LocalAppData $LocalAppData)){
  $main=Join-Path $path 'ComfyUI\main.py';$python=Join-Path $path 'python_embeded\python.exe'
  # Refuse linked runtime directories rather than following their targets.
  $linked=$false
  foreach($part in @('ComfyUI','python_embeded')){
   $item=Get-Item -LiteralPath (Join-Path $path $part) -Force -ErrorAction SilentlyContinue
   if($item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){$linked=$true}
  }
  if(!$linked -and (Test-Path -LiteralPath $main -PathType Leaf) -and (Test-Path -LiteralPath $python -PathType Leaf)){
   [pscustomobject]@{Path=$path;Portable=$true;Models=(Test-Path -LiteralPath (Join-Path $path 'ComfyUI\models'))}
  }
 }
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
  if($current.Attributes -band [IO.FileAttributes]::ReadOnly){[IO.File]::SetAttributes($Path,($current.Attributes -band (-bnot [IO.FileAttributes]::ReadOnly)))}
  [IO.Directory]::Delete($Path,$false)
 }else{
  # Git pack/index files are routinely ReadOnly on Windows. Never change link-target attributes.
  if($item.Attributes -band [IO.FileAttributes]::ReadOnly){[IO.File]::SetAttributes($Path,($item.Attributes -band (-bnot [IO.FileAttributes]::ReadOnly)))}
  try{[IO.File]::Delete($Path)}catch [UnauthorizedAccessException]{throw ('Access denied after clearing Read-only: '+$Path+'. Close programs using this file, or run the uninstaller as Administrator. Ownership/ACLs were not changed.')}
 }
}
Write-Host '1. Preflight: close Adobe applications; inventory only, no files changed.'
if(Get-Process AfterFX,'Adobe Premiere Pro',Resolve -ErrorAction SilentlyContinue){throw 'Close After Effects, Premiere and Resolve first.'}
Write-Host 'Checking the two fixed engine locations only (no drive scan):'
$locations=@((Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Engines59'),(Join-Path $env:LOCALAPPDATA 'GHAF\Core'))
$locations|ForEach-Object {Write-Host ('  '+$_)}
$engines=@(Find-Engines60)
if($Action -eq 'Uninstall'){
 $cache=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Downloads59'
 if(Test-Path -LiteralPath $cache -PathType Container){$engines+= [pscustomobject]@{Path=$cache;Portable=$false;Models=$false;Cache=$true}}
}
$state=[ordered]@{action=$Action;host=$HostApp;mode=$Mode;engineLocations=$locations;engines=$engines;packageManifest=(Test-Path (Join-Path $payload 'PACKAGE_MANIFEST.json'));nvidia=@(Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue|Where-Object Name -match NVIDIA).Count -gt 0}
$state|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $report -Encoding UTF8
$state['existingAEPanel']=Test-Path (Join-Path $env:APPDATA 'Adobe\CEP\extensions\VarnaMotionStudio')
$state['existingPremierePanel']=Test-Path (Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.varnalabs.editstudio.premiere')
$state['existingResolveTools']=Test-Path (Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Hosts\Resolve')
$state['bundledExtractor']=Test-Path (Join-Path $payload 'tools\vendor\7zr59.exe')
$state|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $report -Encoding UTF8
Start-Transcript -Path ($report+'.log') -Append|Out-Null
Write-Host ('Inventory: '+$report);if($Action -ne 'Uninstall'){$state|Format-List|Out-Host}else{Write-Host 'Standalone engine removal: installation payload/extractor is not required.'};$engines|Format-Table Path,Portable,Models -AutoSize|Out-Host
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
