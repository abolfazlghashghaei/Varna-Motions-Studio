$ErrorActionPreference='Stop'
$repo=Split-Path $PSScriptRoot -Parent
foreach($f in @('installer60/Manage.ps1','Varna_Motion_Studio/tools/Profile60.ps1','Varna_Motion_Studio/INSTALL_WINDOWS.ps1','Varna_Motion_Studio/integrations/INSTALL_CROSS_HOST_WINDOWS.ps1')){$t=$null;$e=$null;[System.Management.Automation.Language.Parser]::ParseFile((Join-Path $repo $f),[ref]$t,[ref]$e)|Out-Null;if($e.Count){throw ($e|Out-String)}}
$tmp=Join-Path ([IO.Path]::GetTempPath()) ('profile60-'+[guid]::NewGuid().ToString('N'))
try{
New-Item -ItemType Directory (Join-Path $tmp 'js') -Force|Out-Null
[IO.File]::WriteAllText((Join-Path $tmp 'index.html'),'<head></head><script src="./js/music-engine.js"></script><script src="js/audio50.js"></script><script src="js/app.js"></script>')
foreach($n in @('music-engine','audio50','audio51','app')){[IO.File]::WriteAllText((Join-Path $tmp ('js/'+$n+'.js')),'fixture')}
& (Join-Path $repo 'Varna_Motion_Studio/tools/Profile60.ps1') -Target $tmp -Enabled $false
if(Test-Path (Join-Path $tmp 'js/music-engine.js')){throw 'Engine module installed in no-engine profile'}
$html=Get-Content (Join-Path $tmp 'index.html') -Raw
if($html -match 'src="(?:./)?js/(music-engine|audio50)' -or $html -notmatch 'js/app.js'){throw 'Wrong profile script dependencies'}
if((Get-Content (Join-Path $tmp 'engine-profile60.js') -Raw) -notmatch 'VARNA_ENGINE_ENABLED=false'){throw 'Profile flag absent'}
& (Join-Path $repo 'Varna_Motion_Studio/tools/Profile60.ps1') -Target $tmp -Enabled $true
if((Get-Content (Join-Path $tmp 'engine-profile60.js') -Raw) -notmatch 'VARNA_ENGINE_ENABLED=true'){throw 'Engine flag missing'}
$t=$null;$e=$null;$ast=[System.Management.Automation.Language.Parser]::ParseFile((Join-Path $repo 'installer60/Manage.ps1'),[ref]$t,[ref]$e)
foreach($name in @('Get-VarnaEngineCandidates','Find-Engines60')){
 $fn=$ast.Find({param($x)$x -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $x.Name -eq $name},$true)
 Invoke-Expression $fn.Extent.Text
 if($name -eq 'Get-VarnaEngineCandidates'){$discovery=$fn.Extent.Text}
}
$installer=[System.Management.Automation.Language.Parser]::ParseFile((Join-Path $repo 'Varna_Motion_Studio/INSTALL_WINDOWS.ps1'),[ref]$t,[ref]$e)
$other=$installer.Find({param($x)$x -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $x.Name -eq 'Get-VarnaEngineCandidates'},$true)
if($other.Extent.Text -cne $discovery){throw 'Installer and standalone uninstaller discovery rules diverged'}
foreach($name in @('GHAF/Core','VarnaMotionStudio/Engines59/v0.43.0','unrelated/Varna/Engine','VarnaMotionStudio/Engines59/cache/nested/engine')){
 $base=Join-Path $tmp $name;New-Item -ItemType Directory (Join-Path $base 'ComfyUI'),(Join-Path $base 'python_embeded') -Force|Out-Null
 [IO.File]::WriteAllText((Join-Path $base 'ComfyUI/main.py'),'fixture');[IO.File]::WriteAllText((Join-Path $base 'python_embeded/python.exe'),'fixture')
}
$script:allowedScan=Join-Path $tmp 'VarnaMotionStudio/Engines59';$script:scans=@()
# Trap actual enumeration: any call outside the fixed Varna root, or recursion,
# fails. This detects a drive walk even when it would ultimately return 2 engines.
function Get-ChildItem {
 [CmdletBinding()]param([string]$LiteralPath,[switch]$Directory,[switch]$Force,[switch]$Recurse)
 if($Recurse -or $LiteralPath -ne $script:allowedScan){throw ('Unexpected scan: '+$LiteralPath)}
 $script:scans+=$LiteralPath
 Microsoft.PowerShell.Management\Get-ChildItem -LiteralPath $LiteralPath -Directory:$Directory -Force:$Force
}
$found=@(Find-Engines60 $tmp)
if($found.Count -ne 2){throw ('Exactly the fixed Varna and GHAF engines must be found; actual '+$found.Count)}
$expected=@((Join-Path $tmp 'GHAF/Core'),(Join-Path $tmp 'VarnaMotionStudio/Engines59/v0.43.0'))|Sort-Object
if(Compare-Object $expected @($found.Path|Sort-Object)){throw 'Wrong engine addresses'}
$pointer=Join-Path $tmp 'VarnaMotionStudio/engine-root.txt'
[IO.File]::WriteAllText($pointer,(Join-Path $tmp 'unrelated/Varna/Engine'))
if(@(Find-Engines60 $tmp).Count -ne 2){throw 'An outside pointer expanded discovery'}
[IO.File]::WriteAllText($pointer,$expected[1])
if(@(Get-VarnaEngineCandidates $tmp)[0] -ne $expected[1]){throw 'Known version pointer was not reused first'}
$link=Join-Path $script:allowedScan 'linked-version'
$kind=if($env:OS -eq 'Windows_NT'){'Junction'}else{'SymbolicLink'}
New-Item -ItemType $kind -Path $link -Target (Join-Path $tmp 'unrelated/Varna/Engine')|Out-Null
if(@(Find-Engines60 $tmp).Count -ne 2){throw 'Linked version was followed'}
Remove-Item -LiteralPath $link -Force
Remove-Item -LiteralPath (Join-Path $tmp 'GHAF/Core/python_embeded/python.exe')
if(@(Find-Engines60 $tmp).Count -ne 1){throw 'Incomplete engine was accepted'}
Remove-Item Function:Get-ChildItem
if(@(Find-Engines60 (Join-Path $tmp 'absent')).Count){throw 'Missing roots should not trigger fallback scanning'}
if((Get-Content (Join-Path $repo 'installer60/Manage.ps1') -Raw) -match 'SystemDrive|Queue\[string\]|Inventory C drive'){throw 'Drive scanning remains in preflight'}
Write-Host 'PASS60 parser, physically omitted engine modules, shared-module preservation, fixed-location discovery, no recursive/outside scans, invalid-pointer rejection, version reuse, missing/incomplete engines and junction rejection. Real Windows install/removal not executed.'
}finally{Remove-Item $tmp -Recurse -Force}
