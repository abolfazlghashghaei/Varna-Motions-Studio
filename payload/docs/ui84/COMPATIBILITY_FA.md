# حدود سازگاری UI84

قواعد تازه به container query، :has()، color-mix()، nesting یا @scope وابسته نیستند. اندازهٔ واقعی workspace را ResizeObserver می‌سنجد و data-pane-layout84 را تغییر می‌دهد. CSS جدید داخل همان flow77.css است؛ فایل تازه و !important تازه اضافه نشده است. @layer قدیمی مالک رابط مربوط به Chromium 99 است و در این تغییر بازنویسی نشده است.

| ویژگی مورد استفاده | شروع پشتیبانی Chromium |
|---|---|
| CSS Variables / Grid | ۴۹ / ۵۷ |
| flex gap | ۸۴ |
| min/max/clamp | ۷۹ |
| overflow-wrap:anywhere | ۸۰ |
| logical properties | بسته به خاصیت، حداکثر ۸۷ برای خواص به‌کاررفته |
| :is() / @layer | ۸۸ / ۹۹ |
| :scope / dialog.showModal | ۲۷ / ۳۷ |
| CSS resize | ۱؛ رفتار سمت دستگیره تابع RTL/LTR است |
| ResizeObserver / IntersectionObserver | ۶۴ / ۵۱ |
| optional chaining / nullish coalescing | ۸۰ |
| MediaQueryList.addEventListener | ۷۳ |
| fs.rmSync | Node 14.14؛ برای مسیر کش پریویو، به Node فعال در CEP نیاز است |

مرورگر آزمون Chromium جدید است. پروفایل chromium99-disabled قواعد پس از ۹۹ را قبل از parse حذف و APIهای جدیدترِ منتخب را غیرفعال می‌کند. این آزمون اجرای Chromium 99 یا CEP واقعی نیست و تفاوت‌های parser/CEF/codec/Node و رفتار GPU را تضمین نمی‌کند. Chromium/CSXS واقعی سیستم مقصد باید با مراحل MANUAL_TEST_FA.md آزموده شود. کنترل‌های عددی و handlerهای میزبان حفظ شده‌اند.

روی ارتفاع ۴۰۰ و عرض‌های ۲۵۰–۴۰۰ نیز فضای خود workspace و نوار اقدام اندازه‌گیری می‌شود؛ گزارش نهایی نسبت محتوا در layout-summary.json است. دستگاه‌پیکسل و reflow در چهار مقیاس آزموده می‌شوند؛ این شبیه‌سازی DPI بومی ویندوز نیست.
