@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
chcp 65001 >nul
title Varna Motion Studio - Uninstall
echo.
echo VARNA MOTION STUDIO - UNINSTALL
echo Close After Effects before continuing.
echo Only the Varna panel will be moved to its recovery folder.
echo.
choice /C YN /N /M "Continue [Y/N]? "
if not errorlevel 1 goto cancelled
if errorlevel 2 goto cancelled
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_WINDOWS.ps1" -Uninstall
set "VARNA_RESULT=%ERRORLEVEL%"
echo.
if not "%VARNA_RESULT%"=="0" (echo Uninstall failed with exit code %VARNA_RESULT%. Read the error above.) else (echo Uninstall completed.)
pause
exit /b %VARNA_RESULT%
:cancelled
echo Uninstall cancelled.
pause
exit /b 1
