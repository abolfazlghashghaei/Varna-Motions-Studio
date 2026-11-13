# ۱۴ شکست موجود در پایه

اجرای بدون تغییر `node tests/run-release.cjs` همچنان ۸۶ از ۱۰۰ است. فهرست شکست‌ها با گزارش پایهٔ UI77 و گزارش تاریخی `0c91a2e` مقایسه شد؛ هیچ موردی اضافه یا پنهان نشده است. این تغییر روی اصلاح UI79 متمرکز است؛ نتیجهٔ gate به‌عنوان سبز یا انتشار پایدار گزارش نمی‌شود.

| تست | علت مشاهده‌شده |
|---|---|
| `ui.cjs` | شکست فعلی `Font list must initialize` در fixture دست‌سازِ راه‌اندازی فونت |
| `rc26_app_actions.cjs` | همان شکست مشترکِ `Font list must initialize` در fixture واردشدهٔ ui.cjs |
| `rc35_app.cjs` | همان شکست مشترکِ `Font list must initialize` در fixture واردشدهٔ ui.cjs |
| `rc36_app.cjs` | همان شکست مشترکِ `Font list must initialize` در fixture واردشدهٔ ui.cjs |
| `rc37_captions.cjs` | همان شکست مشترکِ `Font list must initialize` در fixture واردشدهٔ ui.cjs |
| `rc41_app.cjs` | همان شکست مشترکِ `Font list must initialize` در fixture واردشدهٔ ui.cjs |
| `rc45_app.cjs` | همان شکست مشترکِ `Font list must initialize` در fixture واردشدهٔ ui.cjs |
| `rc47_app.cjs` | همان شکست مشترکِ `Font list must initialize` در fixture واردشدهٔ ui.cjs |
| `rc46_scene.cjs` | DOM دست‌ساز، متد `.before()` را ندارد |
| `rc24_ui.cjs` | انتظار مسیریابی بخش تدوین حذف‌شدهٔ قبلی |
| `rc25_ui.cjs` | انتظار مسیریابی بخش تدوین حذف‌شدهٔ قبلی |
| `rc21_companions_shots.cjs` | انتظار کنترل‌های Railcut/تدوین که قبلاً به درخواست کاربر حذف شده‌اند |
| `production50_core.cjs` | انتظار قدیمیِ ۱۲ استایل، در حالی که کتابخانه اکنون ۱۰۲ استایل دارد |
| `studio51_server.cjs` | انتظار HTTP 200 برای `editor.html` حذف‌شدهٔ قبلی |

در این تحویل هیچ‌یک از این تست‌ها حذف یا با انتظار ضعیف‌تر جایگزین نشده است. اصلاح fixture یا به‌روزرسانی انتظارهای منسوخ باید در تغییر مستقل با دلیل و پوشش رفتاری معادل انجام شود. لاگ کامل: [run-release.log](run-release.log). مقایسهٔ ماشینی: [release-comparison.json](release-comparison.json).
