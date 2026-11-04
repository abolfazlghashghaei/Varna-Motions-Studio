Unicode true
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
Name "Varna Studio Setup & Maintenance"
OutFile "build/Varna-Studio-Setup-61.exe"
InstallDir "$LOCALAPPDATA\VarnaMotionStudio\Setup61"
InstallDirRegKey HKCU "Software\VarnaStudio\Setup61" "Path"
RequestExecutionLevel user
SilentInstall silent
SilentUnInstall silent
SetCompressor /SOLID lzma
Icon "assets/varna.ico"
UninstallIcon "assets/varna.ico"
VIProductVersion "4.5.0.61"
VIAddVersionKey /LANG=1033 "ProductName" "Varna Studio Setup & Maintenance"
VIAddVersionKey /LANG=1033 "CompanyName" "Varna Studio"
VIAddVersionKey /LANG=1033 "FileDescription" "Graphical installer, repair and removal manager"
VIAddVersionKey /LANG=1033 "FileVersion" "61.0"
VIAddVersionKey /LANG=1033 "LegalCopyright" "Varna Studio"
Var Mutex
Var PSExe
Function .onInit
${IfNot} ${AtLeastWin10}
MessageBox MB_ICONSTOP "Windows 10 or later is required."
Abort
${EndIf}
${If} ${RunningX64}
SetRegView 64
StrCpy $PSExe "$WINDIR\Sysnative\WindowsPowerShell\v1.0\powershell.exe"
${Else}
StrCpy $PSExe "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe"
${EndIf}
System::Call 'kernel32::CreateMutexW(p 0, i 0, w "Local\VarnaStudioSetup61") p .r0 ?e'
Pop $1
StrCpy $Mutex $0
${If} $1 = 183
MessageBox MB_ICONINFORMATION "Varna setup is already running."
Abort
${EndIf}
FunctionEnd
Section
SetOutPath "$INSTDIR"
File "Gui61.ps1"
File "GuiLauncher61.ps1"
File "Backend61.ps1"
File "Core61.psm1"
File "Download61.psm1"
File "EngineCleanup61.psm1"
File "Invoke61.ps1"
File "package-lock61.json"
File "README_FA.md"
File "NOTICES.txt"
SetOutPath "$INSTDIR\assets"
File "assets/varna.ico"
File "assets/sidebar.png"
SetOutPath "$INSTDIR"
${If} $EXEPATH != "$INSTDIR\Setup.exe"
CopyFiles /SILENT "$EXEPATH" "$INSTDIR\Setup.exe"
${EndIf}
InitPluginsDir
nsExec::ExecToLog '"$PSExe" -NoLogo -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File "$INSTDIR\GuiLauncher61.ps1" -ResultPath "$PLUGINSDIR\result.ini"'
Pop $0
${If} $0 != 0
ReadINIStr $1 "$PLUGINSDIR\result.ini" "Result" "Changed"
${If} $1 != 1
SetErrorLevel 1
Abort
${EndIf}
SetErrorLevel 1
${EndIf}
WriteUninstaller "$INSTDIR\Uninstall.exe"
WriteRegStr HKCU "Software\VarnaStudio\Setup61" "Path" "$INSTDIR"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "DisplayName" "Varna Studio — Setup & Maintenance"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "Publisher" "Varna Studio"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "DisplayVersion" "4.5 RC47 / Setup61"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "InstallLocation" "$INSTDIR"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "DisplayIcon" "$INSTDIR\assets\varna.ico"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "UninstallString" '"$INSTDIR\Uninstall.exe"'
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "ModifyPath" '"$INSTDIR\Setup.exe"'
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "NoRepair" 0
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "NoModify" 0
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61" "URLInfoAbout" "https://github.com/abolfazlghashghaei/Varna-Motions-Studio"
CreateDirectory "$SMPROGRAMS\Varna Studio"
CreateShortCut "$SMPROGRAMS\Varna Studio\Setup and repair.lnk" "$INSTDIR\Setup.exe"
CreateShortCut "$SMPROGRAMS\Varna Studio\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
SectionEnd
Function un.onInit
${IfNot} ${AtLeastWin10}
MessageBox MB_ICONSTOP "Windows 10 or later is required."
Abort
${EndIf}
${If} ${RunningX64}
SetRegView 64
StrCpy $PSExe "$WINDIR\Sysnative\WindowsPowerShell\v1.0\powershell.exe"
${Else}
StrCpy $PSExe "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe"
${EndIf}
System::Call 'kernel32::CreateMutexW(p 0, i 0, w "Local\VarnaStudioSetup61") p .r0 ?e'
Pop $1
${If} $1 = 183
MessageBox MB_ICONINFORMATION "Close the running Varna setup first."
Abort
${EndIf}
FunctionEnd
Section "Uninstall"
InitPluginsDir
nsExec::ExecToLog '"$PSExe" -NoLogo -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File "$INSTDIR\GuiLauncher61.ps1" -InitialAction Remove -ResultPath "$PLUGINSDIR\result.ini"'
Pop $0
${If} $0 != 0
SetErrorLevel 1
Abort
${EndIf}
DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VarnaStudio61"
DeleteRegKey HKCU "Software\VarnaStudio\Setup61"
Delete "$SMPROGRAMS\Varna Studio\Setup and repair.lnk"
Delete "$SMPROGRAMS\Varna Studio\Uninstall.lnk"
RMDir "$SMPROGRAMS\Varna Studio"
Delete /REBOOTOK "$INSTDIR\Setup.exe"
Delete "$INSTDIR\Gui61.ps1"
Delete "$INSTDIR\GuiLauncher61.ps1"
Delete "$INSTDIR\Backend61.ps1"
Delete "$INSTDIR\Core61.psm1"
Delete "$INSTDIR\Download61.psm1"
Delete "$INSTDIR\EngineCleanup61.psm1"
Delete "$INSTDIR\Invoke61.ps1"
Delete "$INSTDIR\package-lock61.json"
Delete "$INSTDIR\README_FA.md"
Delete "$INSTDIR\NOTICES.txt"
Delete "$INSTDIR\assets\varna.ico"
Delete "$INSTDIR\assets\sidebar.png"
RMDir "$INSTDIR\assets"
Delete "$INSTDIR\Uninstall.exe"
RMDir "$INSTDIR"
IfRebootFlag 0 +2
MessageBox MB_ICONINFORMATION "Windows restart is required to finish removing the setup manager."
SectionEnd
