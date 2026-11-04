param([string]$RequestFile,[string]$StatusFile,[string]$SpecFile)
# Only platform inventory is controlled. File operations, archive extraction,
# child processes, exit codes, receipts and status updates are production code.
function global:Get-CimInstance {param([string]$ClassName);if($ClassName -eq 'Win32_VideoController'){return [pscustomobject]@{Name='NVIDIA fixture'}};return @()}
& (Join-Path (Split-Path $PSScriptRoot -Parent) 'Backend61.ps1') -RequestFile $RequestFile -StatusFile $StatusFile -SpecFile $SpecFile

exit $LASTEXITCODE
