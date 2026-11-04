function Find-Engines60([string]$Root){
 $queue=New-Object 'System.Collections.Generic.Queue[string]';$queue.Enqueue([IO.Path]::GetFullPath($Root+[IO.Path]::DirectorySeparatorChar));$seen=@{};$scanned=0
 while($queue.Count){if($env:VARNA_CANCEL_FILE -and (Test-Path -LiteralPath $env:VARNA_CANCEL_FILE)){throw 'CANCELLED during engine inventory'};$dir=$queue.Dequeue();$scanned++;if($scanned%100 -eq 0){Write-Host ('[scan] '+$scanned+' folders: '+$dir);Write-Progress -Activity 'Inventory C drive' -Status ($scanned.ToString()+' folders checked: '+$dir)};foreach($child in @(Get-ChildItem -LiteralPath $dir -Directory -Force -ErrorAction SilentlyContinue)){
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
  if($current.Attributes -band [IO.FileAttributes]::ReadOnly){[IO.File]::SetAttributes($Path,($current.Attributes -band (-bnot [IO.FileAttributes]::ReadOnly)))}
  [IO.Directory]::Delete($Path,$false)
 }else{
  # Git pack/index files are routinely ReadOnly on Windows. Never change link-target attributes.
  if($item.Attributes -band [IO.FileAttributes]::ReadOnly){[IO.File]::SetAttributes($Path,($item.Attributes -band (-bnot [IO.FileAttributes]::ReadOnly)))}
  try{[IO.File]::Delete($Path)}catch [UnauthorizedAccessException]{throw ('Access denied after clearing Read-only: '+$Path+'. Close programs using this file, or run the uninstaller as Administrator. Ownership/ACLs were not changed.')}
 }
}

Export-ModuleMember -Function Find-Engines60,Remove-EngineTree602
