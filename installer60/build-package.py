from pathlib import Path
import subprocess,shutil
source=Path(__file__).resolve().parents[1]
target=Path('/workspace/Varna-Installer60')
# Run only in a new isolated release worktree; never remove the working source checkout.
assert target != source and (target/'.git').is_file()
subprocess.run(['git','rm','-r','--quiet','--ignore-unmatch','.'],cwd=target,check=True)
for name in ['1_INSTALL_AE.bat','2_INSTALL_Premiere.bat','3_INSTALL_Resolve.bat','4_UNINSTALL_ENGINES.bat','5_REPAIR.bat']:
 text=(source/name).read_text().replace('%~dp0installer60','%~dp0payload\\installer60')
 (target/name).write_bytes(text.replace('\n','\r\n').encode())
for folder in ['Varna_Motion_Studio','installer60']:
 shutil.copytree(source/folder,target/'payload'/folder,ignore=shutil.ignore_patterns('__pycache__','build-package.py'))
shutil.copy2(source/'PREPARE_GITHUB_DOWNLOAD.ps1',target/'payload/PREPARE_GITHUB_DOWNLOAD.ps1')
# GitHub archive uses the already published, recoverable LFS pointer for this Mac-only binary.
p='Varna_Motion_Studio/assets/vendor/Railcut/Railcut/bin/mac/ffmpeg'
(target/'payload'/p).write_bytes(subprocess.check_output(['git','show','HEAD:'+p],cwd=source))
print('Prepared exactly five root launchers with implementation and guide under payload/.')
