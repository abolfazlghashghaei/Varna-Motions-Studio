param(
    [string]$PackageRoot = '',
    [ValidateSet('Core','Studio','Max')][string]$Level = 'Max',
    [switch]$CheckOnly,
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
try {
    Import-Module (Join-Path $PSScriptRoot 'VarnaLayout.psm1') -Force -ErrorAction Stop
    $bundle = Join-Path $PSScriptRoot 'files'
    if (!$PackageRoot) {
        try { $PackageRoot = Find-VarnaPackageRoot $PSScriptRoot }
        catch {
            if ($env:OS -ne 'Windows_NT') { throw }
            Add-Type -AssemblyName System.Windows.Forms
            $picker = New-Object System.Windows.Forms.FolderBrowserDialog
            $picker.Description = 'Select the original extracted Varna package, containing assets and index.html.'
            $picker.ShowNewFolderButton = $false
            try {
                if ($picker.ShowDialog() -ne [Windows.Forms.DialogResult]::OK) { throw 'No package folder was selected.' }
                $PackageRoot = $picker.SelectedPath
            } finally { $picker.Dispose() }
        }
    }
    Write-Host ('Original extracted package: ' + $PackageRoot)
    Write-Host 'Checking the complete current package before changing any files...'
    $plan = Get-VarnaRecoveryPlan -PackageRoot $PackageRoot -BundleRoot $bundle -ExpectedManifestHash '6c72deaf693f6f5a7ace6bf8e909e932c01e108ecab9a3dae0f5b52009217dfa'
    if ($CheckOnly) { Write-Host ('PASS: ' + $plan.Files.Count + ' verified sources. No files changed.'); exit 0 }
    $ready = New-VarnaRecoveredPackage $plan
    Write-Host ('Complete verified package prepared at: ' + $ready)
    Write-Host 'The original extracted folder is preserved. No component was downloaded.'
    if ($PrepareOnly) { exit 0 }
    if ($env:OS -ne 'Windows_NT') { throw 'Native installation must be run on Windows.' }
    $installer = Join-Path $ready 'INSTALL_WINDOWS.ps1'
    if (!(Test-Path -LiteralPath $installer -PathType Leaf)) { throw 'The verified native installer is missing.' }
    & (Join-Path $PSHOME 'powershell.exe') -NoLogo -NoProfile -ExecutionPolicy Bypass -File $installer -Level $Level
    exit $LASTEXITCODE
} catch {
    Write-Host ('Repair stopped: ' + $_.Exception.Message)
    Write-Host 'The original source files were not overwritten by this repair. Read the specific error above.'
    Write-Host 'Complete corrected package: https://github.com/abolfazlghashghaei/Varna-Motions-Studio/archive/refs/tags/v4.5.0-rc.47-liquid48-layout1.zip'
    exit 1
}
