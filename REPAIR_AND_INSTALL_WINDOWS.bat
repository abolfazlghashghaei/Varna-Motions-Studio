@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
echo VARNA LIQUID48 - REPAIR PACKAGE LAYOUT
echo Close After Effects before installing.
echo.
echo   1  Core
echo   2  Studio
echo   3  Max
choice /C 123 /N /M "Choose installation level [1/2/3]: "
if errorlevel 4 exit /b 1
if errorlevel 3 (set "VARNA_LEVEL=Max"&goto repair)
if errorlevel 2 (set "VARNA_LEVEL=Studio"&goto repair)
if errorlevel 1 (set "VARNA_LEVEL=Core"&goto repair)
exit /b 1
:repair
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0REPAIR_LAYOUT_AND_INSTALL.ps1" -Level %VARNA_LEVEL%
set "VARNA_RESULT=%ERRORLEVEL%"
echo.
if not "%VARNA_RESULT%"=="0" echo Repair or installation stopped. Read the error above.
pause
exit /b %VARNA_RESULT%
