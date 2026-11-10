# ممیزی رابط وارنا — مرحلهٔ ۱

این تحویل فقط **گزارش و طرح پیشنهادی** است. کد پلاگین و تست‌های آن تغییر نکرده‌اند.

- [گزارش کامل: ۲۲ صفحه، تداخل CSS، کنتراست و آزمون‌ها](REPORT_FA.md)
- [طرح پیشنهادی: مقیاس‌ها، کامپوننت‌ها، متن‌ها، فایل مشترک و مسیر تازه‌کار](PROPOSAL_FA.md)
- [اندازه‌گیری‌های مرورگر](measurements.json) · [قراردادهای HTML سه میزبان](source-inventory.json)
- [گزارش خام آزمون‌ها](baseline-tests/)
- [گالری HTML، برای بازکردن محلی](before.html)

مبنای ممیزی: `5ebfa72`. آزمون کنترل‌های عددی و جدول موفق؛ دروازهٔ انتشار فعلی **۸۶/۱۰۰**، پیش از هر تغییر جدید. متن آزمایشی ساختگی است و رندر واقعی Adobe بررسی نشده است.

## تصاویر قبل

۷۲ تصویر: تمام ۲۲ صفحه در سه اندازه، و ۶ تصویر مقایسهٔ ورودی‌های Premiere/Resolve. اندازهٔ ۶۲۰×۶۴۰ از manifest خود پنل گرفته شده است. تصاویر «بعد» به مرحلهٔ اجرا تعلق دارند و هنوز ساخته نشده‌اند.

| صفحه | اندازهٔ پیش‌فرض پنل | نمای بزرگ | نمای کوتاه |
|---|---|---|---|
| خانه `home` | [۶۲۰×۶۴۰](before/home-620.png) | [۱۰۰۰×۷۶۰](before/home-1000.png) | [۷۶۰×۵۲۰](before/home-760.png) |
| ویرایش متن `text` | [۶۲۰×۶۴۰](before/text-620.png) | [۱۰۰۰×۷۶۰](before/text-1000.png) | [۷۶۰×۵۲۰](before/text-760.png) |
| جدول `table` | [۶۲۰×۶۴۰](before/table-620.png) | [۱۰۰۰×۷۶۰](before/table-1000.png) | [۷۶۰×۵۲۰](before/table-760.png) |
| حرکت متن `motion` | [۶۲۰×۶۴۰](before/motion-620.png) | [۱۰۰۰×۷۶۰](before/motion-1000.png) | [۷۶۰×۵۲۰](before/motion-760.png) |
| حرکت کلمه‌ها `kinetic` | [۶۲۰×۶۴۰](before/kinetic-620.png) | [۱۰۰۰×۷۶۰](before/kinetic-1000.png) | [۷۶۰×۵۲۰](before/kinetic-760.png) |
| استایل‌های آماده `templates` | [۶۲۰×۶۴۰](before/templates-620.png) | [۱۰۰۰×۷۶۰](before/templates-1000.png) | [۷۶۰×۵۲۰](before/templates-760.png) |
| افکت صوتی `sfx` | [۶۲۰×۶۴۰](before/sfx-620.png) | [۱۰۰۰×۷۶۰](before/sfx-1000.png) | [۷۶۰×۵۲۰](before/sfx-760.png) |
| ساخت صدا `music` | [۶۲۰×۶۴۰](before/music-620.png) | [۱۰۰۰×۷۶۰](before/music-1000.png) | [۷۶۰×۵۲۰](before/music-760.png) |
| ساخت زیرنویس `audio` | [۶۲۰×۶۴۰](before/audio-620.png) | [۱۰۰۰×۷۶۰](before/audio-1000.png) | [۷۶۰×۵۲۰](before/audio-760.png) |
| اصلاح هوشمند `ai` | [۶۲۰×۶۴۰](before/ai-620.png) | [۱۰۰۰×۷۶۰](before/ai-1000.png) | [۷۶۰×۵۲۰](before/ai-760.png) |
| زمینه `bg` | [۶۲۰×۶۴۰](before/bg-620.png) | [۱۰۰۰×۷۶۰](before/bg-1000.png) | [۷۶۰×۵۲۰](before/bg-760.png) |
| برند `brand` | [۶۲۰×۶۴۰](before/brand-620.png) | [۱۰۰۰×۷۶۰](before/brand-1000.png) | [۷۶۰×۵۲۰](before/brand-760.png) |
| دستیار پروژه `director` | [۶۲۰×۶۴۰](before/director-620.png) | [۱۰۰۰×۷۶۰](before/director-1000.png) | [۷۶۰×۵۲۰](before/director-760.png) |
| نرمی حرکت `easing49` | [۶۲۰×۶۴۰](before/easing49-620.png) | [۱۰۰۰×۷۶۰](before/easing49-1000.png) | [۷۶۰×۵۲۰](before/easing49-760.png) |
| دستیار دستور `assistant49` | [۶۲۰×۶۴۰](before/assistant49-620.png) | [۱۰۰۰×۷۶۰](before/assistant49-1000.png) | [۷۶۰×۵۲۰](before/assistant49-760.png) |
| جای امن متن `safe` | [۶۲۰×۶۴۰](before/safe-620.png) | [۱۰۰۰×۷۶۰](before/safe-1000.png) | [۷۶۰×۵۲۰](before/safe-760.png) |
| واژه‌های برجسته `keywords` | [۶۲۰×۶۴۰](before/keywords-620.png) | [۱۰۰۰×۷۶۰](before/keywords-1000.png) | [۷۶۰×۵۲۰](before/keywords-760.png) |
| ترجمه `translate` | [۶۲۰×۶۴۰](before/translate-620.png) | [۱۰۰۰×۷۶۰](before/translate-1000.png) | [۷۶۰×۵۲۰](before/translate-760.png) |
| ابزارهای افزوده `tools` | [۶۲۰×۶۴۰](before/tools-620.png) | [۱۰۰۰×۷۶۰](before/tools-1000.png) | [۷۶۰×۵۲۰](before/tools-760.png) |
| مدل‌ها و مصرف `resources` | [۶۲۰×۶۴۰](before/resources-620.png) | [۱۰۰۰×۷۶۰](before/resources-1000.png) | [۷۶۰×۵۲۰](before/resources-760.png) |
| افزودن به پروژه `output` | [۶۲۰×۶۴۰](before/output-620.png) | [۱۰۰۰×۷۶۰](before/output-1000.png) | [۷۶۰×۵۲۰](before/output-760.png) |
| تنظیمات `settings` | [۶۲۰×۶۴۰](before/settings-620.png) | [۱۰۰۰×۷۶۰](before/settings-1000.png) | [۷۶۰×۵۲۰](before/settings-760.png) |

## مقایسهٔ ورودی میزبان‌ها در مرورگر

| میزبان | خانه | متن | جدول |
|---|---|---|---|
| Premiere | [تصویر](before/premiere-home.png) | [تصویر](before/premiere-text.png) | [تصویر](before/premiere-table.png) |
| Resolve | [تصویر](before/resolve-home.png) | [تصویر](before/resolve-text.png) | [تصویر](before/resolve-table.png) |

این تصاویر تفاوت HTML/بارگذاری UI را نشان می‌دهند؛ اتصال یا عملکرد داخل خودِ این نرم‌افزارها در این محیط اجرا نشده است.
