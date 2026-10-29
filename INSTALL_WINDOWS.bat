@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
if not exist "%~dp0Varna_Motion_Studio\INSTALL_WINDOWS.ps1" (
    echo Incomplete or nested update folder detected. The original installer is missing here.
    echo Use REPAIR_AND_INSTALL_WINDOWS.bat from the package layout repair ZIP.
    pause
    exit /b 1
)
echo VARNA RC47 - STUDIO55
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
