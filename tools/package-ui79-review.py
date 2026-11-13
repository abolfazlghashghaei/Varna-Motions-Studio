"""Build a self-contained Windows review tree from the verified source manifest.

This packages files only. It never runs the installer, downloads models, or
modifies an installed extension. The destination must be empty (or .git only).
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

SOURCE = Path(__file__).resolve().parents[1]
PRODUCT = SOURCE / "Varna_Motion_Studio"
MAC_ONLY = "assets/vendor/Railcut/Railcut/bin/mac/ffmpeg"
LAUNCHERS = ["1_INSTALL_AE.bat", "2_INSTALL_Premiere.bat", "3_INSTALL_Resolve.bat", "4_UNINSTALL_ENGINES.bat", "5_REPAIR.bat"]


def digest(path):
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def copy_file(source, target):
    if source.is_symlink():
        raise ValueError("Do not package symbolic links: " + str(source))
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--source-commit", required=True)
    args = parser.parse_args()
    target = args.destination.resolve()
    if target == SOURCE or SOURCE in target.parents:
        raise ValueError("Use a separate delivery directory")
    if target.exists() and any(p.name != ".git" for p in target.iterdir()):
        raise ValueError("Destination must be empty or contain only .git")
    target.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((PRODUCT / "PACKAGE_MANIFEST.json").read_text())
    original_count = len(manifest["files"])
    omitted = [item for item in manifest["files"] if item["path"] == MAC_ONLY]
    if len(omitted) != 1:
        raise ValueError("Expected the original Mac-only manifest entry")
    manifest["files"] = [item for item in manifest["files"] if item["path"] != MAC_ONLY]
    manifest["platform"] = "Windows"
    manifest["sourceCommit"] = args.source_commit
    payload = target / "payload"
    count = len(manifest["files"])
    for item in manifest["files"]:
        relative = Path(item["path"])
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError("Unsafe manifest path")
        source = PRODUCT / relative
        if not source.resolve().is_relative_to(PRODUCT.resolve()) or source.is_symlink():
            raise ValueError("Manifest entry leaves the product")
        if source.stat().st_size != item["bytes"] or digest(source) != item["sha256"]:
            raise ValueError("Source checksum mismatch: " + str(relative))
        if item["bytes"] >= 100 * 1024 * 1024:
            raise ValueError("Delivery contains a file above the GitHub blob limit")
        copy_file(source, payload / "Varna_Motion_Studio" / relative)
    (payload / "Varna_Motion_Studio" / "PACKAGE_MANIFEST.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    for name in LAUNCHERS:
        original = (SOURCE / name).read_bytes()
        needle = b"%~dp0installer60"
        if original.count(needle) != 1:
            raise ValueError("Unexpected launcher: " + name)
        (target / name).write_bytes(original.replace(needle, b"%~dp0payload\\installer60"))
    for source in (SOURCE / "installer60").rglob("*"):
        if source.is_file() and source.name != "build-package.py" and "__pycache__" not in source.parts:
            copy_file(source, payload / source.relative_to(SOURCE))
    copy_file(SOURCE / "VarnaDownload.psm1", payload / "VarnaDownload.psm1")
    for name in ["ui79", "ux-audit68"]:
        for source in (SOURCE / "docs" / name).rglob("*"):
            if source.is_file() and (name == "ui79" or source.name == "source-inventory.json"):
                copy_file(source, payload / source.relative_to(SOURCE))

    # Use native separators; the same verification can be exercised by PowerShell
    # on Linux, without pretending that a native Windows installation was tested.
    preparer = r'''$ErrorActionPreference = 'Stop'
try {
    if ($env:OS -ne 'Windows_NT') { throw 'This review package is for Windows.' }
    $root = Join-Path $PSScriptRoot 'Varna_Motion_Studio'
    $manifest = Get-Content -LiteralPath (Join-Path $root 'PACKAGE_MANIFEST.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($manifest.version -cne '__VERSION__' -or $manifest.platform -cne 'Windows' -or @($manifest.files).Count -ne __COUNT__) { throw 'Unexpected UI79 Windows manifest.' }
    $separator = [IO.Path]::DirectorySeparatorChar
    $prefix = [IO.Path]::GetFullPath($root).TrimEnd($separator) + $separator
    $seen = @{}
    $count = 0
    Write-Host 'Checking the complete UI79 Windows payload. No package component download is required.'
    foreach ($entry in $manifest.files) {
        $relative = [string]$entry.path
        if (!$relative -or [IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[\\/])\.\.([\\/]|$)' -or $seen.ContainsKey($relative)) { throw ('Unsafe or duplicate manifest path: ' + $relative) }
        if ($relative -eq 'assets/vendor/Railcut/Railcut/bin/mac/ffmpeg') { throw 'A Mac-only file is not part of this Windows package.' }
        $seen[$relative] = $true
        $path = [IO.Path]::GetFullPath((Join-Path $root $relative))
        if (!$path.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'Manifest path is outside the payload.' }
        $item = Get-Item -LiteralPath $path -Force -ErrorAction Stop
        if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw ('Unexpected file type: ' + $relative) }
        if ($item.Length -ne [long]$entry.bytes -or (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne [string]$entry.sha256) { throw ('Package checksum mismatch: ' + $relative) }
        $count++
        if ($count % 100 -eq 0) { Write-Host ('Verified Windows payload ' + $count + ' / __COUNT__') }
    }
    Write-Host 'All __COUNT__ Windows payload files verified. Starting the selected installer.'
    exit 0
} catch {
    Write-Host ('Package preparation stopped: ' + $_.Exception.Message)
    Write-Host 'Extract the complete UI79 ZIP into a new folder and retry. No existing plugin files were changed by preparation.'
    exit 1
}
'''.replace("__VERSION__", manifest["version"]).replace("__COUNT__", str(count))
    (payload / "PREPARE_GITHUB_DOWNLOAD.ps1").write_bytes(b"\xef\xbb\xbf" + preparer.replace("\n", "\r\n").encode())
    info = {
        "ui": 79, "version": manifest["version"], "platform": "Windows", "sourceCommit": args.source_commit,
        "evidenceCommit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=SOURCE, text=True).strip(),
        "manifestFiles": count, "sourceManifestFiles": original_count, "excludedMacOnlyFile": MAC_ONLY,
        "allRetainedProductHashesUnchanged": True, "nativeWindowsInstallerTested": False, "nativeCEPTested": False,
        "modelsBundled": False, "releaseGatePassed": 86, "releaseGateTotal": 100,
    }
    (payload / "BUILD_INFO.json").write_text(json.dumps(info, indent=2) + "\n")
    (target / ".gitattributes").write_text("* -text\n")
    readme = '''# UI79 — رابط جدید پنل After Effects / Windows

۱. ZIP را کامل در پوشه‌ای تازه با مسیر کوتاه مثل C:\\VarnaTest استخراج کن.
۲. After Effects و برنامه‌های Adobe و Resolve را ببند.
۳. فایل 1_INSTALL_AE.bat را اجرا کن. برای بررسی رابط بدون دانلود موتور AI، گزینهٔ ۲ (Without engine) کافی است.
۴. پس از نصب، افتر را باز کن و پنل Varna Motion Studio را از بخش Extensions در منوی Window باز کن.
۵. برای دیدن تصاویر بدون نصب، PREVIEW.html و سپس گالری قبل/بعد را باز کن.

نوار کناری با کم‌شدن جا خودکار فقط آیکون نشان می‌دهد. Phone connection حذف شده؛ حرکت موس بدون تغییر CSS کل پنل و بازگشت V به شکل موجی از نوک به بالا انجام می‌شود. تنظیمات اصلی باز و ابزارهای تکمیلی جدا هستند. رابط روی کنترل‌های واقعی افتر قرار گرفته است. تم‌های قبلی، رنگ دلخواه، V با برخورد موضعی موس و بازگشت موجی، انیمیشن‌های رابط، میانبرهای قابل تنظیم و محوشدگی ذخیره‌شونده در دسترس‌اند. حالت بدون موتور میانبر تولید صدا ندارد؛ زیرنویس و اصلاح آفلاین باقی می‌مانند.

این بستهٔ ویندوز __COUNT__ فایل محصول را با هش محلی بررسی می‌کند. دانلود قطعهٔ مخصوص Mac برای آماده‌سازی لازم نیست. مدل‌های AI و موتور اختیاری همراه این ZIP نیستند؛ انتخاب With engine ممکن است به دریافت آن‌ها نیاز داشته باشد. پوشهٔ payload را ناقص یا جابه‌جا نکن.

این نسخه برای آزمون رابط است. اجرای واقعی CEP، نصب ویندوز، DPI، فونت‌های نصب‌شده و رندر افکت‌های بومی در محیط توسعه تأیید نشده‌اند. ۱۴ شکست قدیمی release gate بدون تغییر باقی است؛ جزئیات و گزارش آزمون‌ها در payload/docs/ui79 قرار دارند.

2_INSTALL_Premiere.bat و 3_INSTALL_Resolve.bat ورودی‌های قبلی این دو میزبان هستند؛ UI79 فقط به ورودی افتر اضافه شده است. فایل 4_UNINSTALL_ENGINES.bat برای حذف موتورهای انتخابی و مدل‌های داخلشان، پس از نمایش مسیر و تأیید خودت است؛ برای بررسی UI نیازی به اجرای آن نیست. 5_REPAIR.bat همان تعمیرکنندهٔ موجود است.

گالری: payload/docs/ui79/GALLERY.html
راهنمای آزمون ده‌مرحله‌ای: payload/docs/ui79/MANUAL_TEST_FA.md
گزارش تحویل: payload/docs/ui79/REPORT_FA.md
'''.replace("__COUNT__", str(count))
    (target / "READ_ME_FIRST_FA.md").write_text(readme, encoding="utf-8-sig")
    (target / "PREVIEW.html").write_text('''<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UI79 — بررسی رابط</title><style>body{margin:1rem;background:#101925;color:#edf4ff;font:16px/1.8 Tahoma,Arial,sans-serif}a{color:#a3deef}main{display:flex;flex-wrap:wrap;gap:1rem}img{max-width:100%;height:auto}figure{margin:0;max-width:620px}</style><h1>UI79 · رابط تازهٔ پنل افتر</h1><p>این صفحه تصاویر واقعی رابط مرورگر را نشان می‌دهد؛ برای اجرای پنل، راهنمای READ_ME_FIRST_FA.md را دنبال کن.</p><p><a href="payload/docs/ui79/v-return.gif">پیش‌نمایش انیمیشن تازهٔ V</a> · <a href="payload/docs/ui79/icons-809x580.png">نوار خودکار آیکون</a></p><p><a href="payload/docs/ui79/GALLERY.html">گالری ۲۲ صفحه؛ مقایسهٔ قبل و بعد</a></p><main><figure><figcaption>تم اصلی</figcaption><img src="payload/docs/ui79/gallery/after-home-620-dark.png" alt="خانه با تم اصلی"></figure><figure><figcaption>نعنا · روشن</figcaption><img src="payload/docs/ui79/gallery/palette-mint-light.png" alt="رنگ نعنا در حالت روشن"></figure></main></html>''')
    for item in manifest["files"]:
        destination = payload / "Varna_Motion_Studio" / item["path"]
        if digest(destination) != item["sha256"]:
            raise ValueError("Delivery checksum mismatch: " + item["path"])
    (payload / "WINDOWS_DELIVERY_VALIDATION.json").write_text(json.dumps({**info, "verifiedFiles": count}, indent=2) + "\n")
    print(json.dumps(info, indent=2))


if __name__ == "__main__":
    main()
