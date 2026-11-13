const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'PACKAGE_MANIFEST.json'),'utf8'));
assert.equal(manifest.version,'4.5.0-rc.47');
const names=new Set();
for(const file of manifest.files){
 assert(!names.has(file.path.toLowerCase()),'duplicate path '+file.path);names.add(file.path.toLowerCase());
 assert(!path.isAbsolute(file.path)&&!file.path.includes('..')&&!file.path.includes('\\'),'unsafe path '+file.path);
 const bytes=fs.readFileSync(path.join(root,file.path));
 assert.equal(bytes.length,file.bytes,'size '+file.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.sha256,'checksum '+file.path);
}
for(const essential of ['README_FA.md','INSTALL_WINDOWS.ps1','INSTALL_WINDOWS.bat','UNINSTALL_WINDOWS.bat','js/textyle-catalog.js','host/ghaf_host.jsx'])assert(names.has(essential.toLowerCase()),'missing '+essential);
for(const legacy of ['INSTALL_WINDOWS_GUI.ps1','Varna_Setup.vbs','Varna_Uninstall.vbs','BUILD_SETUP_EXE_WINDOWS.ps1'])assert(!names.has(legacy.toLowerCase()),'legacy GUI launcher still packaged: '+legacy);
const batch=fs.readFileSync(path.join(root,'INSTALL_WINDOWS.bat'),'utf8');
assert(batch.includes('choice /C 123')&&batch.includes('-File "%~dp0INSTALL_WINDOWS.ps1" -Level %VARNA_LEVEL%'));
assert(!batch.includes('WindowStyle Hidden')&&batch.includes('set "VARNA_RESULT=%ERRORLEVEL%"')&&batch.includes('pause'));
const uninstall=fs.readFileSync(path.join(root,'UNINSTALL_WINDOWS.bat'),'utf8');
assert(uninstall.includes('choice /C YN')&&uninstall.includes('-Uninstall')&&uninstall.includes('pause'));
const source=fs.readFileSync(path.join(root,'INSTALL_WINDOWS.ps1'));assert.deepEqual([...source.subarray(0,3)],[239,187,191],'Windows PowerShell backend needs UTF-8 BOM');
const installer=fs.readFileSync(path.join(root,'INSTALL_WINDOWS.ps1'),'utf8');
const installSwitch=installer.indexOf("Set-InstallStatus 93 'switch'");assert(installer.indexOf('foreach ($file in $selected)')<installSwitch&&installer.indexOf("Save-Previous $path 'previous-panel'")>installSwitch,'previous panel moved before validation');
assert(!/Stop-VarnaOrphans|taskkill\.exe|ComfyUI.*Remove-Item/i.test(installer),'shared runtime may be removed');
assert(installer.includes('Restore-Previous')&&installer.includes('externalPathsModified = @()'),'rollback or ownership boundaries missing');
console.log(`PASS installer: ${manifest.files.length} source checksums, visible BAT launchers, ownership boundary and rollback`);

assert(installer.includes('$groups[$component] += $entry') && installer.includes('bundled component skipped as a whole'), 'vendor conflicts must skip whole components');
assert(!installer.includes('Existing third-party component has different content; no file was replaced'), 'old fatal Orb conflict remains');
assert(installer.includes("Join-Path $extensions 'com.anas.orbreactor'"),'existing Orb directory guard missing');
