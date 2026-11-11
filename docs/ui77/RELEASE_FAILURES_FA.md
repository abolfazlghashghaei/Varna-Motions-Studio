# ۱۴ شکست موجود در پایه

اجرای بدون تغییر `node tests/run-release.cjs` همچنان ۸۶ از ۱۰۰ است. فهرست شکست‌ها با گزارش پایهٔ `0c91a2e` مقایسه شد؛ هیچ موردی اضافه یا پنهان نشده است. این تغییر روی ادغام UI77 متمرکز است؛ نتیجهٔ gate به‌عنوان سبز یا انتشار پایدار گزارش نمی‌شود.

| تست | علت مشاهده‌شده |
|---|---|
| `ui.cjs` | DOM دست‌ساز تست، `document.dispatchEvent` لازم برای راه‌اندازی فعلی را ندارد |
| `rc26_app_actions.cjs` | همان کمبود `document.dispatchEvent` در fixture |
| `rc35_app.cjs` | همان کمبود `document.dispatchEvent` در fixture |
| `rc36_app.cjs` | همان کمبود `document.dispatchEvent` در fixture |
| `rc37_captions.cjs` | همان کمبود `document.dispatchEvent` در fixture |
| `rc41_app.cjs` | همان کمبود `document.dispatchEvent` در fixture |
| `rc45_app.cjs` | همان کمبود `document.dispatchEvent` در fixture |
| `rc47_app.cjs` | همان کمبود `document.dispatchEvent` در fixture |
| `rc46_scene.cjs` | DOM دست‌ساز، متد `.before()` را ندارد |
| `rc24_ui.cjs` | انتظار مسیریابی بخش تدوین حذف‌شدهٔ قبلی |
| `rc25_ui.cjs` | انتظار مسیریابی بخش تدوین حذف‌شدهٔ قبلی |
| `rc21_companions_shots.cjs` | انتظار کنترل‌های Railcut/تدوین که قبلاً به درخواست کاربر حذف شده‌اند |
| `production50_core.cjs` | انتظار قدیمیِ ۱۲ استایل، در حالی که کتابخانه اکنون ۱۰۲ استایل دارد |
| `studio51_server.cjs` | انتظار HTTP 200 برای `editor.html` حذف‌شدهٔ قبلی |

در این تحویل هیچ‌یک از این تست‌ها حذف یا با انتظار ضعیف‌تر جایگزین نشده است. اصلاح fixture یا به‌روزرسانی انتظارهای منسوخ باید در تغییر مستقل با دلیل و پوشش رفتاری معادل انجام شود. لاگ کامل: [run-release.log](logs/run-release.log). مقایسهٔ ماشینی: [release-comparison.json](release-comparison.json).
