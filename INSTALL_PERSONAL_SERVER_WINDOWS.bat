@echo off
setlocal
set "VARNA_INSTALL_LOG=%~dp0INSTALL_DETAILS.log"
echo Installing the personal server and shared verified runtime.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0native59\Install-Server59.ps1"
if errorlevel 1 echo Installation failed. Read the error above.
pause
endlocal
