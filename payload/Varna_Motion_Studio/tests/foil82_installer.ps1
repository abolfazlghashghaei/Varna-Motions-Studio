$ErrorActionPreference='Stop'
$panel82=Split-Path $PSScriptRoot -Parent
$tokens82=$null;$errors82=$null
$ast82=[Management.Automation.Language.Parser]::ParseFile((Join-Path $panel82 'INSTALL_WINDOWS.ps1'),[ref]$tokens82,[ref]$errors82)
if($errors82.Count){throw 'Installer PowerShell syntax failed'}
foreach($name82 in @('Get-VendorInstallPlan','Include-Entry')){
 $fn82=$ast82.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name82},$true)
 if(!$fn82){throw ('Missing function '+$name82)}
 . ([scriptblock]::Create($fn82.Extent.Text))
}
$fixture82Root=Join-Path ([IO.Path]::GetTempPath()) ('varna-plan82-'+[guid]::NewGuid().ToString('N'))
$prior82App=$env:APPDATA;$prior82Program=$env:ProgramFiles
try{
 $env:APPDATA=Join-Path $fixture82Root 'appdata';$env:ProgramFiles=Join-Path $fixture82Root 'programs'
 $fixture82Panel=Join-Path $fixture82Root 'panel';$fixture82AE=Join-Path $fixture82Root 'AE'
 function Get-AERoots { return @($fixture82AE) }
 foreach($relative82 in @('assets/vendor/Railcut/Railcut','assets/vendor/Orb Reactor/com.anas.orbreactor')){
  $folder82=Join-Path $fixture82Panel $relative82;New-Item -ItemType Directory $folder82 -Force|Out-Null;[IO.File]::WriteAllText((Join-Path $folder82 'fixture.txt'),'fixture')
 }
 $plan82=@(Get-VendorInstallPlan $fixture82Panel)
 if(@($plan82|Where-Object {$_.Component -eq 'HolographicFoil82'}).Count){throw 'A source-only package cannot install an absent plugin'}
 $foil82=Join-Path $fixture82Panel 'assets/user-library81/holographic-foil/HolographicFoil.aex';New-Item -ItemType Directory (Split-Path $foil82 -Parent) -Force|Out-Null;[IO.File]::WriteAllText($foil82,'fixture only, never executed')
 $plan82=@(Get-VendorInstallPlan $fixture82Panel);$item82=@($plan82|Where-Object {$_.Component -eq 'HolographicFoil82'})
 if($item82.Count -ne 1 -or $item82[0].Source -ne $foil82 -or $item82[0].Target -notlike '*HolographicFoil.aex'){throw 'The supplied foil binary is not mapped to its native shared plugin target'}
 $Level='Max';if(!(Include-Entry 'assets/user-library81/holographic-foil/HolographicFoil.aex')){throw 'Private runtime library excluded'}
 Write-Host 'PASS UI82 actual installer functions: optional foil source, exact shared native target and included private runtime assets. No external copy, elevation or vendor execution performed.'
}finally{$env:APPDATA=$prior82App;$env:ProgramFiles=$prior82Program;Remove-Item -LiteralPath $fixture82Root -Recurse -Force -ErrorAction SilentlyContinue}
