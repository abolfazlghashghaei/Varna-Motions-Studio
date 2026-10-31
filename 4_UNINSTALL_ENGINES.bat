@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer60\Manage.ps1" -Action Uninstall
if errorlevel 1 echo Operation stopped. Read the error above.
pause
