@echo off
setlocal
echo Close DaVinci Resolve before installation.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Varna_Motion_Studio\integrations\INSTALL_CROSS_HOST_WINDOWS.ps1" -HostApp Resolve
if errorlevel 1 echo Installation failed. Read the error above.
pause
endlocal
