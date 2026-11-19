# فایل‌ها و علت تغییر

| گروه فایل | علت |
|---|---|
| js/workspace-panes84.js و js/table-designer.js | ناحیه‌های جدول/متن/موشن، هویت کنترل، اندازه و تمام‌صفحه؛ fit پریویو در فضای واقعی |
| css/ui/flow77.css | مرزبندی مشترک، چیدمان تطبیقی و فضای overhang فارسی؛ بدون فایل CSS یا !important تازه |
| js/preview-clock84.js و js/background-workspace81.js | یک ساعت محدود برای کارت‌های قابل مشاهده؛ ورود/خروج مستقل و حالت اجرا |
| js/background-motion81-core.js، host/ghaf_host.jsx | حالت ثابت و خروج مستقل با موتور ES3 مشترک؛ host از منبع بازتولید شده است |
| js/library-previews84.js، js/library-preview84-node.js | انتخاب فقط برای preview؛ رندر جدا، صف/کش/لغو، فریم JPEG متناسب با build همراه؛ Apply صریح |
| js/library-destinations84.js و js/flow77.js | هفت مقصد مستقل، هوک‌های یکی‌شده، جست‌وجو و سنجاق با همان کامپوننت‌های ناوبری |
| js/user-library81-ui.js، js/feature-workspaces83.js | انتخاب نام+جهت، حفظ draft/کنترل‌های واقعی، جلوگیری از import و اجرای خودکار vendor |
| host/user-library81.jsx و js/cep-bridge.js | API فقط‌خواندنی مکان renderer و FFmpeg؛ همگام‌کردن revision ماژول |
| js/text-workspace80.js | اتصال/بازگشت ایمن به ناحیه‌های مشترک، با حفظ ویرایشگر کوچک قبلی |
| index.html | ترتیب بارگذاری AE؛ Premiere و Resolve تغییر نکردند |
| assets/library84/catalog.json و previews | کاتالوگ نام‌های واقعی و ۶۰ کلیپ فوتیج؛ اصل فایل‌ها دست‌نخورده |
| tests/ui84*، tests/library84*، tests/background84* | رگرسیون ناحیه‌ها، عدم import، سخت‌گیری چیدمان، کدک واقعی/پیکسل و پلیر فریم |
| tests/library82*، ui69_interactions، ui83_features و user_library81 | تطبیق قرارداد مسیرهای جدید با حفظ assertions معنایی؛ دلیل در TEST_MIGRATION_FA |
| tools/build-library84-*، package-ui84-review، ui84-screenshots و verify-ui84-download | ساخت بازتولیدپذیر کاتالوگ/کلیپ/بسته، تصاویر واقعی و تطبیق ZIP با درخت Git |
| PACKAGE_MANIFEST.json | هش و اندازهٔ فایل‌های همین منبع |

موارد صرفاً بومی و نحوهٔ آزمون در TODO.md و MANUAL_TEST_FA.md است؛ هیچ نصب/فعال‌سازی/رندر واقعی Adobe از این فهرست ادعا نمی‌شود.
