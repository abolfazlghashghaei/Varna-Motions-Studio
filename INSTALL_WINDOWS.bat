@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
echo VARNA RC47 - PRODUCTION47
echo Close After Effects before installing.
echo Preparing files from the GitHub download...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0PREPARE_GITHUB_DOWNLOAD.ps1"
if errorlevel 1 goto failed
call "%~dp0Varna_Motion_Studio\INSTALL_WINDOWS.bat"
exit /b %ERRORLEVEL%
:failed
echo Preparation failed. No existing plugin installation was changed.
pause
exit /b 1
