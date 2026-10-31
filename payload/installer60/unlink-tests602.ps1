$ErrorActionPreference='Stop'
$t=$null;$e=$null;$ast=[System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'Manage.ps1'),[ref]$t,[ref]$e)
if($e.Count){throw ($e|Out-String)}
$fn=$ast.Find({param($n)$n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Remove-EngineTree602'},$true)
Invoke-Expression $fn.Extent.Text
$base=Join-Path ([IO.Path]::GetTempPath()) ('unlink602-'+[guid]::NewGuid().ToString('N'))
try {
 $outside=Join-Path $base 'outside';$engine=Join-Path $base 'GHAF/Core';$models=Join-Path $engine 'ComfyUI/models'
 New-Item -ItemType Directory $outside,$models -Force|Out-Null
 [IO.File]::WriteAllText((Join-Path $outside 'KEEP.bin'),'USER MODEL')
 [IO.File]::WriteAllText((Join-Path $engine 'owned.txt'),'engine')
 $kind=if($env:OS -eq 'Windows_NT'){'Junction'}else{'SymbolicLink'}
 New-Item -ItemType $kind -Path (Join-Path $models 'SEEDVR2') -Target $outside|Out-Null
 New-Item -ItemType SymbolicLink -Path (Join-Path $models 'file-model') -Target (Join-Path $outside 'KEEP.bin')|Out-Null
 Remove-EngineTree602 -Path $engine -Root
 if(Test-Path $engine){throw 'Engine not removed'}
 if([IO.File]::ReadAllText((Join-Path $outside 'KEEP.bin')) -ne 'USER MODEL'){throw 'External model changed'}
 $rootLink=Join-Path $base 'root-link';New-Item -ItemType $kind -Path $rootLink -Target $outside|Out-Null
 $rejected=$false;try{Remove-EngineTree602 -Path $rootLink -Root}catch{$rejected=$true}
 if(!$rejected -or !(Test-Path (Join-Path $outside 'KEEP.bin'))){throw 'Root-link protection failed'}
 if($kind -eq 'SymbolicLink'){
  $broken=Join-Path $base 'broken';New-Item -ItemType SymbolicLink -Path $broken -Target (Join-Path $base 'missing')|Out-Null
  Remove-EngineTree602 -Path $broken
  if(Get-Item -LiteralPath $broken -Force -ErrorAction SilentlyContinue){throw 'Broken link remained'}
 }
 Write-Host ('PASS602 real filesystem: engine removed; external model bytes preserved; root link refused. Link type: '+$kind)
}finally{
 # Test cleanup also avoids following links.
 if(Test-Path $base){Remove-EngineTree602 -Path $base -Root}
}
