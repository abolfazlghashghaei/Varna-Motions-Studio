@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
if not exist "%~dp0INSTALL_WINDOWS.ps1" (
    echo Incomplete or nested update folder detected. The original installer is missing here.
    echo Use REPAIR_AND_INSTALL_WINDOWS.bat from the package layout repair ZIP.
    pause
    exit /b 1
)
if exist "%~dp0..\PREPARE_GITHUB_DOWNLOAD.ps1" (
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\PREPARE_GITHUB_DOWNLOAD.ps1"
    if errorlevel 1 (
        echo Package preparation failed. See the error above.
        pause
        exit /b 1
    )
)
chcp 65001 >nul
title Varna Motion Studio - Install

echo.
echo VARNA MOTION STUDIO - INSTALL
echo =============================
echo Close After Effects and extract the entire ZIP into a new folder first.
echo.
echo   1  Core    - Panel and built-in effects
echo   2  Studio  - Core plus SFX library
echo   3  Max     - All bundled packs and local engine check
echo.
choice /C 123 /N /M "Choose installation level [1/2/3]: "
if errorlevel 4 goto cancelled
if errorlevel 3 (set "VARNA_LEVEL=Max"&goto install)
if errorlevel 2 (set "VARNA_LEVEL=Studio"&goto install)
if errorlevel 1 (set "VARNA_LEVEL=Core"&goto install)
goto cancelled

:install
echo.
echo Installing %VARNA_LEVEL% from "%CD%"...
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_WINDOWS.ps1" -Level %VARNA_LEVEL%
set "VARNA_RESULT=%ERRORLEVEL%"
echo.
if not "%VARNA_RESULT%"=="0" (
    echo Installation failed with exit code %VARNA_RESULT%. Read the error above.
    echo The previous panel is backed up or restored if activation failed.
) else (
    echo Installation completed. Restart After Effects to load the panel.
)
echo.
pause
exit /b %VARNA_RESULT%

:cancelled
echo Installation cancelled.
pause
exit /b 1
