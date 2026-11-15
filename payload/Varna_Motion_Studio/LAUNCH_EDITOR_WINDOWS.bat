@echo off
setlocal
title VARNA EDIT STUDIO
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18 or newer is required for local MP4 export and Whisper.
  echo You can open editor.html in Chrome or Edge for browser editing and WebM.
  pause
  exit /b 1
)
node "%~dp0tools\editor51-server.cjs" --open
if errorlevel 1 pause
endlocal
