Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "Sections.nsh"
Name "Varna Studio Setup"
OutFile "build/Varna-Setup-Connect58.exe"
RequestExecutionLevel user
SetCompressor /SOLID lzma
!include "release.nsh"
!if ${ARCHIVE_BYTES} <= 0
!error "A verified nonempty archive is required"
!endif
Var Options
!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"
Section "Application and verified shared runtime (required)" SecBase
SectionIn RO
StrCpy $Options ""
SectionEnd
Section "After Effects panel + sound library" SecAE
StrCpy $Options "$Options,ae"
SectionEnd
Section /o "Extended AE packs + local AI engine (NVIDIA, large download)" SecAI
StrCpy $Options "$Options,engine"
SectionEnd
Section /o "Premiere production tools" SecPremiere
StrCpy $Options "$Options,premiere"
SectionEnd
Section /o "DaVinci Resolve production tools" SecResolve
StrCpy $Options "$Options,resolve"
SectionEnd
Section "Personal processing server" SecServer
StrCpy $Options "$Options,server"
SectionEnd
Section -Install
InitPluginsDir
SetOutPath "$PLUGINSDIR"
File "Install58.ps1"
File "Invoke-Checked58.ps1"
DetailPrint "Downloading and verifying the complete pinned release. This may take several minutes."
nsExec::ExecToLog 'powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\Install58.ps1" -ArchiveUrl "${ARCHIVE_URL}" -ArchiveSha256 "${ARCHIVE_SHA256}" -ArchiveBytes ${ARCHIVE_BYTES} -Components "$Options"'
Pop $0
${If} $0 != 0
MessageBox MB_ICONSTOP "Installation failed. Read the detailed log above. Existing host backups and the verified download are retained."
SetErrorLevel 1
Abort
${EndIf}
SectionEnd
Function .onSelChange
${If} ${SectionIsSelected} ${SecAI}
!insertmacro SelectSection ${SecAE}
${EndIf}
FunctionEnd
