# تست و بازتولید پایلوت B

نتیجهٔ نهایی ماتریس، همراه hash منابع ثابت در ابتدا/انتهای اجرا، در [matrix.json](matrix.json) ثبت شده است.

| تست | نتیجه |
|---|---|
| ui47_controls_browser | موفق؛ فایل قبلی بدون تغییر |
| table47_browser | موفق؛ فایل قبلی بدون تغییر |
| ui68_tokens_browser | موفق؛ بررسی خوانایی/پالت در هر ۲۲ صفحه؛ فایل قبلی بدون تغییر |
| ui69_pilot_browser | موفق؛ ۵۷۶ ترکیب صفحه، ۸۶۴ حالت باز، صفر شکست، صفر خطای مرورگر؛ فقط دو صفحهٔ پایلوت |
| ui69_interactions_browser | موفق؛ state واقعی، رفت‌وبرگشت، فونت، فوکوس، شرط دورخط، متن کاربر، select بومی، کیبورد، مقیاس ریشه، نسبت تصویر و مسیر جایگزین container query |
| installer_package | موفق؛ ۳۳۳۶ checksum؛ نصب واقعی ویندوز تست نشده |
| run-release | ۸۶/۱۰۰؛ دقیقاً همان ۱۴ شکست مرحلهٔ A، بدون شکست جدید |

لاگ‌ها در [tests/](tests/) و تطبیق شناسه‌ها/فایل‌های دست‌نخورده در [contract.json](contract.json) هستند. هیچ تست قبلی حذف، ویرایش یا ضعیف نشده است. ۱۴ شکست قدیمی مطابق خواسته در commit جدا بررسی خواهند شد؛ این commit پایلوت آن‌ها را پنهان نمی‌کند.

اجرای تست‌ها از ریشهٔ مخزن (Chromium سیستم در `/usr/bin/chromium`، بستهٔ Playwright موجود در `tooling53/node_modules`):

```bash
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui47_controls_browser.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/table47_browser.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui68_tokens_browser.cjs
NODE_PATH=tooling53/node_modules B69_REPORT=docs/ui-b69/matrix.json node Varna_Motion_Studio/tests/ui69_pilot_browser.cjs
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui69_interactions_browser.cjs
node Varna_Motion_Studio/tests/installer_package.cjs
node Varna_Motion_Studio/tests/run-release.cjs
```

تصاویر، بدون تغییر checkout:

```bash
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui69_screenshots.cjs --before
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui69_screenshots.cjs
```

گزینهٔ `--before` به تاریخچهٔ Git و commit `b350500` نیاز دارد. تصاویر و گزارش‌ها در `docs/ui-b69` نوشته می‌شوند. matrix پیش‌فرض همیشه همهٔ ۶ عرض، ۳ ارتفاع، ۴ بزرگ‌نمایی، دو تم، دو زبان و دو صفحه را اجرا می‌کند. متغیرهای `B69_WIDTHS`، `B69_HEIGHTS` و `B69_ZOOMS` فقط برای بازتولید متمرکز خطا هستند؛ gate تحویل بدون محدودکردن این متغیرها اجرا می‌شود.

آزمون تعامل، کنترل‌های اصلی را شبیه‌سازی نمی‌کند؛ DOM، controller و state واقعی برنامه اجرا می‌شوند. فقط پاسخ bridge افتر، برای تست مرورگری، صریحاً mock است. موارد بومیِ اجرا‌نشده در گزارش اصلی جدا آمده‌اند.
