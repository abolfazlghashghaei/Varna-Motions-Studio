# فایل‌ها و دلیل تغییر

- `Varna_Motion_Studio/index.html`: بارگذاری adapter فقط در ورودی AE؛ ترتیب لایهٔ important مستند.
- `css/ui/pilot-b69.css`: حذف container query و dvh، استفادهٔ واحد از data-size روی پنل.
- `js/pilot-b69.js`: افزودن data-size به اندازه‌گیری موجود؛ alias قدیمی برای مصرف‌کنندگان فعلی حفظ شده است.
- `css/ui/cep70.css` (جدید): یک adapter مشترک برای selector و رنگ‌های ناسازگارِ CSS قدیمی؛ کاربرد و importantها کامنت دارند. حذف در D پس از ادغام.
- `js/cep70.js` (جدید): تشخیص واقعی قابلیت، attributeهای معادل :has، مشاهدهٔ عناصر پویا؛ بدون تغییر داده یا فراخوانی host.
- `tests/helpers/cep70-profile.cjs` (جدید): حذف قابلیت‌های پس از 99 از CSS قبل از parser و از feature detection؛ test-only، بدون runtime injection در محصول.
- `tests/cep70_browser.cjs` (جدید): تست دائمی محدودیت قابلیت و مسیر اختیاری واقعی99 با کنترل نسخهٔ واقعی مرورگر.
- `tests/helpers/panel69.cjs`: حالت اختیاری profile؛ حالت پیش‌فرض و متریک‌های قبلی بدون تغییر.
- `tests/ui69_pilot_browser.cjs`: افزودن snapshot منابع جدید، نسخهٔ واقعی مرورگر و آمار profile؛ assertionهای قبلی دست‌نخورده‌اند.
- `tooling53/package.json` / lock: ثبت مستقیم postcss 8.5.32 موجود در tree برای parser آزمون؛ وابستگی runtime تازه‌ای نیست.
- `PACKAGE_MANIFEST.json`: به‌روزرسانی checksum بسته بعد از تثبیت منابع.
- `docs/cep70/`: گزارش نسخه‌ها، inventory، قرارداد شناسه‌ها، نتایج و تصاویر این commit؛ شواهد تاریخی A/B بازنویسی نشده‌اند.

موارد نیازمند تست دستی در After Effects در انتهای REPORT_FA.md جدا فهرست شده‌اند. هیچ فایل میزبان یا CSS قدیمی حذف نشده است.
