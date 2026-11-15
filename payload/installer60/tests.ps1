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
$fn=$ast.Find({param($x)$x -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $x.Name -eq 'Find-Engines60'},$true)
Invoke-Expression $fn.Extent.Text
foreach($name in @('GHAF/Core','Varna/Engine','unrelated/Engine')){
 $base=Join-Path $tmp $name;New-Item -ItemType Directory (Join-Path $base 'ComfyUI'),(Join-Path $base 'python_embeded') -Force|Out-Null
 [IO.File]::WriteAllText((Join-Path $base 'ComfyUI/main.py'),'fixture');[IO.File]::WriteAllText((Join-Path $base 'python_embeded/python.exe'),'fixture')
}
$found=@(Find-Engines60 $tmp)
if($found.Count -ne 2){throw ('Discovery must select exactly two branded engines, found '+$found.Count)}
Write-Host 'PASS60 parser, physically omitted engine modules, shared-module preservation and explicit profile flags. Real Windows install/removal not executed.'
}finally{Remove-Item $tmp -Recurse -Force}
