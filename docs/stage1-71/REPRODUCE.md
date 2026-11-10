# تکرار شواهد مرحلهٔ ۱

از ریشهٔ مخزن و با وابستگی‌های قفل‌شدهٔ tooling53 و Chromium نصب‌شده اجرا کن. VARNA_CHROMIUM می‌تواند مسیر مرورگر را تعیین کند. مرورگر واقعی هر اجرا در JSON ثبت می‌شود.

```sh
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui71_height_browser.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui71_height_browser.cjs --modern
NODE_PATH=tooling53/node_modules B69_REPORT=/tmp/pilot-modern.json node Varna_Motion_Studio/tests/ui69_pilot_browser.cjs
NODE_PATH=tooling53/node_modules VARNA_CEP70_PROFILE=chromium99 B69_REPORT=/tmp/pilot-restricted.json node Varna_Motion_Studio/tests/ui69_pilot_browser.cjs
NODE_PATH=tooling53/node_modules CEP70_OUT=/tmp/cep-compat node Varna_Motion_Studio/tests/cep70_browser.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui47_controls_browser.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/table47_browser.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui68_tokens_browser.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui69_interactions_browser.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui71_screenshots.cjs --before
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui71_screenshots.cjs
node Varna_Motion_Studio/tests/installer_package.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/run-release.cjs
```

در این commit آخرین فرمان عمداً هنوز exit code 1 با همان ۱۴ شکست پیشین دارد؛ اصلاح آن‌ها مرحلهٔ ۵ است. فایل‌ها و assertionهای قبلی برای سبزشدن تغییر نکرده‌اند. تست new height با حالت پیش‌فرض، قابلیت‌های پس از Chromium 99 را محدود می‌کند؛ `--modern` همان مرورگر بدون محدودیت است و به معنی native CEP نیست.

برای اجرای واقعی مرورگر قدیمی، پس از تهیهٔ executable معتبر Chromium 99:

```sh
NODE_PATH=tooling53/node_modules VARNA_CHROMIUM=/path/to/chromium99 node Varna_Motion_Studio/tests/cep70_browser.cjs --native99
```

این مسیر در محیط فعلی اجرا نشده است؛ سازگاری پروتکل Playwright با executable قدیمی نیز باید در آن محیط بررسی شود. برای اجرای بومی از چک‌لیست MANUAL_TEST_FA.md استفاده کن. تصاویر را در checkout همین commit بازتولید کن؛ فقط index و دو فایل تغییرکردهٔ pilot برای حالت before از 23a8f28 برگردانده می‌شوند و بقیهٔ وابستگی‌ها در این مرحله ثابت‌اند.
