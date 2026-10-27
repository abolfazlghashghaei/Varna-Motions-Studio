@echo off
setlocal
if not exist "%~dp0Varna_Motion_Studio\LAUNCH_EDITOR_WINDOWS.bat" (
  echo Extract the entire current ZIP into a new folder first.
  pause
  exit /b 1
)
call "%~dp0Varna_Motion_Studio\LAUNCH_EDITOR_WINDOWS.bat"
endlocal
