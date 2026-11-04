$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
foreach($file in Get-ChildItem -LiteralPath $root -Include '*.ps1','*.psm1' -Recurse){$t=$null;$e=$null;[Management.Automation.Language.Parser]::ParseFile($file.FullName,[ref]$t,[ref]$e)|Out-Null;if($e.Count){throw ($file.FullName+': '+($e|Out-String))}}
Import-Module (Join-Path $root 'Core61.psm1') -Force
Import-Module (Join-Path $root 'EngineCleanup61.psm1') -Force
$tmp=Join-Path ([IO.Path]::GetTempPath()) ('core61-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory $tmp|Out-Null
try{
 $spec=@{commit=('a'*40);sha256=('b'*64);bytes=1200000;url=('https://github.com/abolfazlghashghaei/Varna-Motions-Studio/archive/'+('a'*40)+'.zip')}
 Assert-Spec61 $spec
 $bad=$spec.Clone();$bad.url='http://example.invalid/file.zip';$rejected=$false;try{Assert-Spec61 $bad}catch{$rejected=$true};if(!$rejected){throw 'Unpinned source was accepted'}
 $status=Join-Path $tmp 'status.json';Write-Status61 $status 'Inspect' 'first';Write-Status61 $status 'Complete' 'second' @{completed=@('AE')}
 $read=Get-Content $status -Raw|ConvertFrom-Json;if($read.message -ne 'second' -or $read.data.completed[0] -ne 'AE'){throw 'Atomic status replacement failed'}
 $owned=Join-Path $tmp 'owned';$foreign=Join-Path $tmp 'foreign';New-Item -ItemType Directory (Join-Path $owned 'CSXS'),(Join-Path $foreign 'CSXS') -Force|Out-Null
 [IO.File]::WriteAllText((Join-Path $owned 'CSXS/manifest.xml'),'<ExtensionManifest ExtensionBundleId="com.varnalabs.motionstudio"/>')
 [IO.File]::WriteAllText((Join-Path $foreign 'CSXS/manifest.xml'),'<ExtensionManifest ExtensionBundleId="someone.else"/>')
 $failed=$false;try{Move-OwnedHost61 'AE' $foreign (Join-Path $tmp 'recovery')}catch{$failed=$true};if(!$failed -or !(Test-Path $foreign)){throw 'Foreign installation was touched'}
 $saved=Move-OwnedHost61 'AE' $owned (Join-Path $tmp 'recovery');if((Test-Path $owned) -or !(Test-Path $saved)){throw 'Owned panel recovery failed'}
 $link=Join-Path $tmp 'linked-install';New-Item -ItemType SymbolicLink -Path $link -Target $foreign|Out-Null
 if(Test-OwnedHost61 'AE' $link){throw 'Linked installation accepted'}
 $receipt=Join-Path $tmp 'state/receipt.json'
 Save-Receipt61 $receipt 'Resolve' 'WithoutEngine' ('a'*40) ('b'*64) @(@{path='owned.lua';sha256=('c'*64)})
 Save-Receipt61 $receipt 'AE' 'WithEngine' ('a'*40) ('b'*64)
 $r=Get-Content $receipt -Raw|ConvertFrom-Json
 if($r.hosts.Count -ne 2 -or $r.resolveFiles[0].path -ne 'owned.lua' -or $r.profiles.AE -ne 'WithEngine'){throw 'Partial-operation receipt lost host/ownership data'}
 $env:VARNA_CANCEL_FILE=Join-Path $tmp 'cancel';[IO.File]::WriteAllText($env:VARNA_CANCEL_FILE,'cancel');$rejected=$false;try{Assert-NotCancelled61}catch{$rejected=$true};if(!$rejected){throw 'Cancellation ignored'}
 $env:VARNA_CANCEL_FILE=$null
 $oldTemp=$env:TEMP;$env:TEMP=$tmp
 try{
  $child=Join-Path $tmp 'installer with spaces.ps1'
  [IO.File]::WriteAllText($child,'param([string]$Mode,[switch]$Fail);Write-Host ("child: "+$Mode);if($Mode -ne "mode with spaces"){exit 9};if($Fail){exit 7};exit 0')
  Invoke-Installer61 $child @{Mode='mode with spaces'}
  $failed=$false;try{Invoke-Installer61 $child @{Mode='mode with spaces';Fail=$true}}catch{if($_.Exception.Message -match '\(7\)'){$failed=$true}}
  if(!$failed){throw 'Child installer failure was swallowed'}
 }finally{$env:TEMP=$oldTemp}
 Write-Host 'PASS61 parser, immutable-source policy, atomic status, foreign/linked-panel preservation, owned recovery, incremental receipts and cancellation checkpoints. WinForms/Windows activation are not executed.'
}finally{$env:VARNA_CANCEL_FILE=$null;Remove-EngineTree602 -Path $tmp -Root}
