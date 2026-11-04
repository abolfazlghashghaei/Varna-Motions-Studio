param([ValidateSet('Install','Remove')][string]$InitialAction='Install',[string]$ResultPath)
$ErrorActionPreference='Stop'
try{
 $global:LASTEXITCODE=0
 & (Join-Path $PSScriptRoot 'Gui61.ps1') -InitialAction $InitialAction -ResultPath $ResultPath
 exit $LASTEXITCODE
}catch{
 $log=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Logs61\startup-error.txt'
 New-Item -ItemType Directory (Split-Path $log -Parent) -Force|Out-Null
 ($_|Out-String)|Set-Content -LiteralPath $log -Encoding UTF8
 try{Add-Type -AssemblyName System.Windows.Forms;[void][Windows.Forms.MessageBox]::Show(('Varna setup could not open. Details: '+$log),'Varna Studio','OK','Error')}catch{Write-Host ('Startup failed. Details: '+$log)}
 exit 1
}
