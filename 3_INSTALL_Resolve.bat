@echo off
setlocal
chcp 65001 >nul
set "VARNA_INSTALL_LOG=%~dp0INSTALL_DETAILS.log"
echo 1 With engine   2 Without engine
choice /C 12 /N /M "Installation mode [1/2]: "
set "mode=WithoutEngine"
if errorlevel 2 goto run
set "mode=WithEngine"
:run
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0payload\installer60\Manage.ps1" -HostApp Resolve -Mode %mode%
if errorlevel 1 echo Installation stopped. Read the error above.
pause
