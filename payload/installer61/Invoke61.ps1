param([string]$Script,[string]$ArgumentsFile)
$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
[Console]::OutputEncoding=New-Object Text.UTF8Encoding($false)
try{
 $obj=Get-Content -LiteralPath $ArgumentsFile -Raw -Encoding UTF8|ConvertFrom-Json
 $arguments=@{};foreach($p in $obj.PSObject.Properties){$arguments[$p.Name]=$p.Value}
 $global:LASTEXITCODE=0
 & $Script @arguments
 exit $LASTEXITCODE
}catch{Write-Host ($_|Out-String);exit 1}
