# گیت انتشار موجود

نتیجه: ۸۶ از ۱۰۰؛ همان ۱۴ شکست UI83، بدون شکست تازه. هیچ تستی برای سبزشدن حذف یا ضعیف نشد. این‌ها هنوز محدودیت گیت کامل انتشار هستند، نه دلیل کافی برای حذف قابلیت از رابط.

| آزمون | خطای مشاهده‌شده |
|---|---|
| ui.cjs | AssertionError [ERR_ASSERTION]: Font list must initialize     at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/ui.cjs:19:148 {   generatedMessage: false,   code: 'ERR_ASSERTION',   actual: false, |
| rc24_ui.cjs | AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:    assert(calls.some(x=>x[0]==='open'&&x[1]==='railcut'))      at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/rc24_ui.cjs:33:298 { |
| rc25_ui.cjs | AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:    assert(calls.some(x=>x[0]==='open'&&x[1]==='railcut'))      at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/rc24_ui.cjs:33:298 { |
| rc26_app_actions.cjs | AssertionError [ERR_ASSERTION]: Font list must initialize     at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/ui.cjs:19:148 {   generatedMessage: false,   code: 'ERR_ASSERTION',   actual: false, |
| rc35_app.cjs | AssertionError [ERR_ASSERTION]: Font list must initialize     at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/ui.cjs:19:148 {   generatedMessage: false,   code: 'ERR_ASSERTION',   actual: false, |
| rc36_app.cjs | AssertionError [ERR_ASSERTION]: Font list must initialize     at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/ui.cjs:19:148 {   generatedMessage: false,   code: 'ERR_ASSERTION',   actual: false, |
| rc37_captions.cjs | AssertionError [ERR_ASSERTION]: Font list must initialize     at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/ui.cjs:19:148 {   generatedMessage: false,   code: 'ERR_ASSERTION',   actual: false, |
| rc41_app.cjs | AssertionError [ERR_ASSERTION]: Font list must initialize     at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/ui.cjs:19:148 {   generatedMessage: false,   code: 'ERR_ASSERTION',   actual: false, |
| rc45_app.cjs | AssertionError [ERR_ASSERTION]: Font list must initialize     at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/ui.cjs:19:148 {   generatedMessage: false,   code: 'ERR_ASSERTION',   actual: false, |
| rc46_scene.cjs | TypeError: box.before is not a function     at rows (scene40-ui.js:19:215)     at sync (scene40-ui.js:49:1042)     at scene40-ui.js:61:3150     at scene40-ui.js:62:3 |
| rc47_app.cjs | AssertionError [ERR_ASSERTION]: Font list must initialize     at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/ui.cjs:19:148 {   generatedMessage: false,   code: 'ERR_ASSERTION',   actual: false, |
| rc21_companions_shots.cjs | AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:    assert(html.includes('id="'+id+'"'))      at Object.<anonymous> (/workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/rc21_companions_shots.cjs:7:149) |
| production50_core.cjs | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:  102 !== 12      at Object.<anonymous> (/workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/production50_core.cjs:3:8) |
| studio51_server.cjs | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:  404 !== 200      at /workspace/Varna-Motions-Studio/Varna_Motion_Studio/tests/studio51_server.cjs:5:161 |

خطای تازهٔ موقت installer_package در زمان توسعه به manifest قدیمی مربوط بود و با بازسازی هش و اندازهٔ فایل‌ها برطرف شد. بررسی آماده‌ساز بسته و فایل‌های تحویل مستقل است.

خطاهای Font list از fixture قدیمی مشترک می‌آیند؛ آزمون مرورگرِ فونت واقعی و انتخاب آن پاس شده است. دو تست rc24/rc25 هنوز انتظار بخش حذف‌شدهٔ Railcut را دارند. rc46_scene یک DOM ساختگی بدون before دارد. خطای rc21، تعداد production50 و مسیر studio51 باید در کار مستقل با قرارداد فعلی بازبینی شوند؛ نتیجهٔ ناموفق آن‌ها در تحویل UI85 حفظ شده است.
