@echo off
setlocal
echo Installing the full editing workspace with its verified runtime.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Varna_Motion_Studio\integrations\INSTALL_CROSS_HOST_WINDOWS.ps1" -HostApp Editor
if errorlevel 1 goto failed
call "%LOCALAPPDATA%\VarnaMotionStudio\Hosts\Editor\OPEN_WORKSPACE.cmd"
exit /b %errorlevel%
:failed
echo Installation failed. Read the error above.
pause
exit /b 1
