$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$payload = Join-Path $root 'Varna_Motion_Studio'
$tokens = $null; $parseErrors = $null
$installer = [Management.Automation.Language.Parser]::ParseFile((Join-Path $payload 'INSTALL_WINDOWS.ps1'),[ref]$tokens,[ref]$parseErrors)
if ($parseErrors.Count) { throw ($parseErrors | Out-String) }
$function = $installer.Find({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Include-Entry' },$true)
Invoke-Expression $function.Extent.Text
$html = [IO.File]::ReadAllText((Join-Path $payload 'index.html'))
$dependencies = @([regex]::Matches($html,'(?:src|href)="\./(assets/vendor/[^"]+)"') | ForEach-Object { $_.Groups[1].Value })
foreach ($Level in @('Core','Studio','Max')) {
    foreach ($relative in $dependencies) {
        if (!(Include-Entry $relative)) { throw "Missing interface dependency at ${Level}: $relative" }
        if (!(Test-Path -LiteralPath (Join-Path $payload $relative) -PathType Leaf)) { throw "Dependency not bundled: $relative" }
    }
    foreach ($folder in @('rebound49','conjure49')) {
        if (!(Include-Entry "assets/vendor/$folder/LICENSE")) { throw "License excluded at $Level" }
    }
    if ($Level -ne 'Max' -and (Include-Entry 'assets/vendor/Railcut/Railcut/index.html')) { throw 'Optional vendor policy changed' }
    Write-Host "PASS $Level contains every declared interface dependency and both new licenses"
}
foreach ($file in @(Get-ChildItem $root -File -Filter '*.ps1') + @(Get-ChildItem $payload -File -Filter '*.ps1')) {
    [void][Management.Automation.Language.Parser]::ParseFile($file.FullName,[ref]$tokens,[ref]$parseErrors)
    if ($parseErrors.Count) { throw ($parseErrors | Out-String) }
}
Write-Host 'PASS installer PowerShell syntax; native Windows activation is not exercised on Linux'
