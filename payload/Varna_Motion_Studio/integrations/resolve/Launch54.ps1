$ErrorActionPreference='Stop'
try {
    $cfg=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'runtime54-user.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    if(!(Test-Path -LiteralPath $cfg.electron -PathType Leaf)){throw 'The verified Motion Tools runtime is missing. Run INSTALL_RESOLVE_WINDOWS.bat again.'}
    if((Get-FileHash -LiteralPath $cfg.electron -Algorithm SHA256).Hash -ne $cfg.executableSha256){throw 'The Motion Tools executable differs from its verified installation. Run the complete installer again.'}
    $logs=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\logs'
    New-Item -ItemType Directory -Path $logs -Force | Out-Null
    $stamp=[guid]::NewGuid().ToString('N').Substring(0,8)
    $stdout=Join-Path $logs ('resolve54-'+$stamp+'.out.log')
    $stderr=Join-Path $logs ('resolve54-'+$stamp+'.error.log')
    Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    $entry=Join-Path $PSScriptRoot 'main54.cjs'
    $child=Start-Process -FilePath $cfg.electron -ArgumentList ('"'+$entry+'"') -WorkingDirectory (Split-Path $PSScriptRoot -Parent) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    if($child.WaitForExit(3000) -and $child.ExitCode -ne 0){throw ('The tools stopped during startup. '+((Get-Content -LiteralPath $stderr -Tail 12 -ErrorAction SilentlyContinue) -join [Environment]::NewLine))}
} catch {
    $message=$_.Exception.Message
    Write-Error $message -ErrorAction Continue
    try{Add-Type -AssemblyName System.Windows.Forms;[System.Windows.Forms.MessageBox]::Show($message,'Motion Tools startup error') | Out-Null}catch{}
    exit 1
}
