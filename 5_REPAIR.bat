@echo off
setlocal
chcp 65001 >nul
echo 1 After Effects   2 Premiere   3 Resolve
choice /C 123 /N /M "Host [1/2/3]: "
set "host=AE"
if errorlevel 2 set "host=Premiere"
if errorlevel 3 set "host=Resolve"
echo 1 With engine   2 Without engine
choice /C 12 /N /M "Repair mode [1/2]: "
set "mode=WithoutEngine"
if errorlevel 2 goto run
set "mode=WithEngine"
:run
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0payload\installer60\Manage.ps1" -Action Repair -HostApp %host% -Mode %mode%
if errorlevel 1 echo Operation stopped. Read the error above.
pause
