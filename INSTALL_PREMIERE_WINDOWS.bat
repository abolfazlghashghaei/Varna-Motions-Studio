@echo off
setlocal
echo Close Premiere Pro before installation.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Varna_Motion_Studio\integrations\INSTALL_CROSS_HOST_WINDOWS.ps1" -HostApp Premiere
if errorlevel 1 echo Installation failed. Read the error above.
pause
endlocal
