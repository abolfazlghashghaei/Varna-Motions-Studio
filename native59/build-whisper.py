from pathlib import Path
import os,subprocess,hashlib,json,shutil
root=Path(__file__).resolve().parents[1];base=Path(os.environ.get('NATIVE59_CACHE','/workspace/shared/native59'));src=base/'whisper.cpp-1.8.3';ndk=base/'android-ndk-r27c';cmake=base/'buildtools/cmake/data/bin/cmake';ninja=base/'buildtools/bin/ninja'
for abi in ['arm64-v8a','x86_64']:
 build=base/('whisper-build-'+abi);build.mkdir(exist_ok=True)
 args=[str(cmake),'-S',str(root/'native59/whisper'),'-B',str(build),'-G','Ninja','-DCMAKE_MAKE_PROGRAM='+str(ninja),'-DCMAKE_TOOLCHAIN_FILE='+str(ndk/'build/cmake/android.toolchain.cmake'),'-DANDROID_ABI='+abi,'-DANDROID_PLATFORM=android-29','-DANDROID_STL=c++_static','-DCMAKE_BUILD_TYPE=Release','-DWHISPER_SOURCE='+str(src)]
 subprocess.run(args,check=True);subprocess.run([str(cmake),'--build',str(build),'--target','varna_whisper59','-j','3'],check=True)
 dest=root/'native59/libs'/abi/'libvarna_whisper59.so';dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(build/'libvarna_whisper59.so',dest)
 subprocess.run([str(ndk/'toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-strip'),'--strip-unneeded',str(dest)],check=True)
 print('BUILT',abi,hashlib.sha256((build/'libvarna_whisper59.so').read_bytes()).hexdigest(),flush=True)
