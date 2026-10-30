function Invoke-Checked58([string]$Script,[hashtable]$Arguments=@{}) {
    $global:LASTEXITCODE=0
    & $Script @Arguments
    if($LASTEXITCODE -ne 0){throw ('Installation step failed with exit code '+$LASTEXITCODE+': '+(Split-Path $Script -Leaf))}
}
