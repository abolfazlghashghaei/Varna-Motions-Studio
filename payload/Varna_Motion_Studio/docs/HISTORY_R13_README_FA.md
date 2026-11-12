# Varna Motion Studio 4.3 PRO STABLE R13

## محور اصلی R13

R13 روی سه بخش متمرکز است: **Sound Design هوشمندتر، موتورهای AI کاملاً محلی با مسیرهای مشخص، و خروجی واقعی Motion برای IN / OUT / BOTH**.

### 1) Smart Sound FX R13

- تحلیل Timeline فقط به Cut محدود نیست؛ Position / Scale / Rotation / Opacity، Effect keyframeها، Transition/Overlap، Marker، Typography و Scene Change بررسی می‌شوند.
- Cutهای ضعیف و تغییرات کوچک به‌صورت پیش‌فرض می‌توانند **بدون صدا** بمانند؛ Ambience/Music/Nature از SFX یک‌باره جدا شده‌اند و روی Cut کوچک انتخاب نمی‌شوند.
- Vision فریم‌های قبل/لحظه/بعد رویدادهای مهم را می‌بیند تا حرکت واقعی، Popup، Impact، محیط و نوع صحنه را بهتر تشخیص دهد.
- پیشنهادهای محیطی مثل Forest / City / Office / Room Tone در بخش **Atmosphere Suggestions** جدا نمایش داده می‌شوند و پیش‌فرض خاموش‌اند؛ کاربر تصمیم می‌گیرد آن‌ها را اضافه کند.
- اگر Music در Composition تشخیص داده شود، Beat analysis انجام می‌شود و Cueهای مناسبِ قوی می‌توانند فقط در فاصله نزدیک به Beat جابه‌جا شوند؛ رویداد ضعیف صرفاً برای رسیدن به Beat صدا نمی‌گیرد.
- Varna از Accept / Reject / Replaceهای کاربر یاد می‌گیرد و امتیاز فایل و دسته رویداد را در دیتای پایدار ذخیره می‌کند تا انتخاب‌های بعدی بهتر شوند.
- SFX Preview و Apply از `eventTime` واقعی استفاده می‌کنند؛ لایه صدا نباید در ابتدای Composition جمع شود.

### 2) تراز و استانداردسازی صدا

بخش **Audio Standard / Auto Balance** همه Audio Layerهای فعال را بررسی می‌کند و نقش آن‌ها را به Dialogue / Music / Ambience / SFX تقسیم می‌کند.

- اندازه‌گیری Integrated Loudness و True Peak با FFmpeg
- Presetهای Web/Social، EBU R128، ATSC A/85 و حالت دستی
- Gain مستقل بر اساس نقش منبع
- محدود کردن Gain بر اساس True Peak
- Ducking خودکار Music/Ambience زیر بازه‌های Dialogue
- Keyframeهای دستی قبلی Audio Levels بدون اجازه بازنویسی نمی‌شوند؛ لایه‌ای که automation دستی دارد حفظ می‌شود.

### 3) موتورهای محلی — بدون برنامه رابط واسط

مسیرهای پیش‌فرض:

```text
C:\whisper.cpp
C:\whisper.cpp\models\Taype
C:\whisper.cpp\models\Text amendment\Qwen3.5-9B-GGUF
C:\whisper.cpp\models\Translator\translategemma-4b-it-GGUF
C:\whisper.cpp\models\Vision\Qwen2.5-VL-3B-Instruct-GGUF
C:\whisper.cpp\llama-b11277-bin-win-cuda-12.4-x64
```

Varna داخل هر پوشه فایل GGUF مناسب را Recursive پیدا می‌کند. اگر پوشه **Taype** فعلاً مدل GGUF نداشته باشد، تصمیم‌های Type/Classification از مدل Text استفاده می‌کنند. Vision علاوه بر مدل Qwen2.5-VL به `mmproj*.gguf` داخل همان پوشه Vision نیاز دارد.

تمام این مسیرها در UI قابل تغییرند. اگر پوشه‌ها یا Runtime جابه‌جا شدند لازم نیست کد تغییر کند؛ فقط Folder همان Role را انتخاب کن.

Runtime مورد استفاده `llama-server.exe` است و Varna هنگام نیاز Role فعال را عوض می‌کند: Text amendment، Type، Translator یا Vision. پورت قبل از اجرا بررسی می‌شود تا موتور روی سرویس دیگری سوار نشود.

### 4) Motion — IN / OUT / BOTH

در کتابخانه Motion یک Preset را انتخاب می‌کنی و تعیین می‌کنی روی:

- `IN`
- `OUT`
- `IN + OUT`

اعمال شود. در حالت BOTH همان خانواده حرکت برای ورود و خروج متناظر استفاده می‌شود. مسیر Host برای Composer-styleها دوباره Audit شده و 43 Motion متنی Composer هم در IN و هم OUT mapping اجرایی دارند.

Markerها فقط `IN` و `OUT` هستند؛ جابه‌جایی IN مدت ورود و جابه‌جایی OUT مدت خروج را کنترل می‌کند. Background در حالت Sync از Timing همان متن پیروی می‌کند.

### 5) پایداری R13

در شروع پنل چند تابع Library/Profile که در Build قبلی حذف شده بودند دوباره برگردانده شدند تا UI هنگام `init()` Crash نکند. Host Bridge نیز برای تمام 27 فراخوانی مستقیم فعلی متد متناظر دارد.

## تست‌های release

برای R13 این مسیرها بررسی شده‌اند:

- Syntax: `app.js`, `state.js`, `node-engine.js`, `ghaf_host.jsx`
- Core subtitle/timing tests
- Host tests
- UI initialization + preview/apply tests
- Timeline import/regression tests
- R13 audit: مدل‌های محلی، SFX context/beat/learning/audio balance، IN/OUT/BOTH و 43 Composer preset

تست‌های نسخه‌های قدیمی که صرفاً نام Version یا UI قدیمی را الزام می‌کنند معیار R13 نیستند.

> اجرای بصری نهایی Motion، Vision و Audio inside After Effects باید یک دور روی سیستم مقصد تست شود، چون محیط ساخت به GUI واقعی After Effects دسترسی ندارد.
