# گزارش بند ۱ — سازگاری پایلوت با CEP 12

این تغییر فقط پیش‌نیاز سازگاری است؛ تعمیم ساختار صفحات آغاز نشده است. مبنا: commit `c48a067`، شاخهٔ مستقل `work/cep70-compat`. دو صفحهٔ پایلوت همچنان `table` و `kinetic` هستند. کد میزبان، فایل‌های Premiere/Resolve، داده‌های پروژه، شناسه‌ها و توکن‌های مرحلهٔ A دست‌نخورده‌اند.

## نتیجه و مرز اعتبار

مستند رسمی Adobe، **Chromium/CEF 99** و Node.js 17.7.1 را برای CEP 12 ثبت کرده است. بنابراین هدف این بند Chromium 99 است؛ تأییدیهٔ سازگاری با Chromium 90–98 نداریم. `CSXS 12.0` در manifest فعلی نیز ثبت شده است. قدیمی‌بودن حداقل نسخهٔ AE در HostList به‌تنهایی اثبات پشتیبانی از CEP 11 نیست.

تلاش برای دریافت مرورگر قدیمی از مخازن رسمی با خطای 403 متوقف شد؛ مرورگر 99 و After Effects در این محیط اجرا نشدند. مطابق گزینهٔ جایگزین در درخواست، تست با قابلیت‌های جدید غیرفعال‌شده انجام شد. **مرورگر واقعی تست Chromium 154.0.8037.57 است. این تست شبیه‌ساز کامل Chromium 99 یا CEF نیست.** مرورگر جدید در حالت `--native99` عمداً رد می‌شود تا نسخه یا User-Agent ساختگی به‌جای تست واقعی گزارش نشود.

[منابع و نتیجهٔ دریافت مرورگر](sources.json) · [فهرست ۵۹ قابلیت با نسخه، پیوند و هش منبع MDN](features.json) · [فهرست دقیق property/function/at-ruleهای ۳۵ CSS متصل و محل قواعد جدید قدیمی](source-audit.json)

## قابلیت‌های حساس CSS و جایگزین‌ها

| قابلیت | اولین Chromium پشتیبان | وضعیت فعلی |
|---|---:|---|
| `@container`، `container-type` و واحدهای `cq*` | 105 | container queryهای پایلوت و اعلان container حذف شدند؛ ResizeObserver عرض خود `.app-shell` را می‌سنجد و `data-size="compact|normal|wide"` می‌گذارد. تنها مسیر چیدمان در همهٔ مرورگرها همین attribute است. واحد cq استفاده نشده است. |
| `:has()` | 105 | در ۶ قاعدهٔ CSS قدیمی وجود دارد؛ برای هر شش کاربرد، attribute متناظر با MutationObserver و رویداد change ساخته می‌شود. CSS جایگزین بدون :has کار می‌کند. |
| `color-mix()` | 111 | در CSS قدیمی برای کارت و دکمهٔ هشدار است. کارت از سطح سالید مرحلهٔ A استفاده می‌کند؛ پس‌زمینه/کادر/متن هشدار به نقش‌های رنگی توکن متصل شدند. وابستگی اجباری به color-mix نداریم. |
| nesting با selector تو در تو / `&` | 112 محدود؛ 120 کامل | در پایلوت استفاده نشده است. وجود قواعد داخل `@layer` به معنی selector nesting نیست. |
| `dvh/dvw`، `sv*`، `lv*` | 108 | `100dvh` پایلوت به `100vh` تغییر کرد. واحدهای کوچک/بزرگ viewport استفاده نشده‌اند. |
| `@layer` | **99** | حفظ شده است؛ کنترل تقدم قواعد پایلوت و مرحلهٔ A به آن وابسته است و در هدف CEP 12 پشتیبانی می‌شود. برای 90–98 جایگزین ارائه نشده؛ آن نسخه‌ها هدف و تأییدشده نیستند. |
| CSS Variables | 49 | مقیاس رابط و توکن‌ها؛ حفظ شده. |
| `min()`، `max()`، `clamp()` | 79 | اندازه‌های سیال با کف خوانایی/کلیک؛ حفظ شده. |
| `:is()`، `:where()`، `:not()` با فهرست selector | 88 | گروه‌بندی قواعد؛ حفظ شده. |
| `:scope`، modifier بی‌تفاوت به بزرگی حروف `[... i]` | 27 / 49 | انتخاب کنترل‌ها در JS؛ حفظ شده. |
| `:focus-visible` | 86 | نمایش focus صفحه‌کلید؛ حفظ شده. |
| Grid / `gap` در Grid / `gap` در Flex | 57 / 66 / 84 | چیدمان و شکست ردیف‌ها؛ حفظ شده. نام قدیمی grid-gap از 57 وجود داشت. |
| `display:contents` / `flex-wrap` | 65 / 29 | wrapper هدر / شکستن کنترل‌ها؛ حفظ شده. رفتار دسترس‌پذیری contents در میزبان واقعی جدا باید بررسی شود. |
| `block-size` و `min-inline-size` | 57 | اندازه‌های منطقی؛ حفظ شده. |
| `inset` و `inset-block-start` | 87 | جای کنترل و پنجره؛ حفظ شده. |
| `aspect-ratio` / `overflow:clip` | 88 / 90 | پیش‌نمایش و محدودهٔ اسکرول؛ حفظ شده. |
| `overflow-wrap:anywhere` | 80 | متن بلند؛ حفظ شده. |
| `scroll-padding-block` | 69 | آشکارکردن کنترل فعال؛ حفظ شده. |
| `overscroll-behavior` | 63 محدود؛ 144 کامل | روی محفظهٔ واقعاً اسکرول‌شونده استفاده می‌شود. نسخه‌های 63–143 روی محفظهٔ فاقد overflow اثر ندارند؛ چیدمان به آن رفتار وابسته نیست. |
| `backdrop-filter` | 76 | جلوهٔ اختیاریِ CSS قدیمی؛ نتیجهٔ GPU و ترکیب شیشه در CEF واقعی تأیید نشده است. |
| `unicode-bidi:isolate` / appearance بدون prefix | 48 / 84 | ترتیب متن مخلوط و مقدار native select؛ حفظ شده. |
| native `details` / `dialog` | 12 / 37 | آکاردئون و انتخاب صفحه؛ حفظ شده. |

حداقل نسخه‌های جدول از دادهٔ MDN خوانده شده‌اند؛ پشتیبانی API یا CSS در Chromium، معادل تأیید رفتار اختصاصی CEF/GPU/سیستم‌عامل نیست. قواعد معمول قدیمی مانند border، padding، rgba، media query و ویژگی‌های پایهٔ Flex/Grid نیز در فهرست ماشینی property/function ثبت شده‌اند؛ قابلیت جدید پس از 99 به کد مالکیت‌شدهٔ پایلوت افزوده نشده است.

## JavaScript و DOM

| قابلیت استفاده‌شده | اولین Chromium پشتیبان | تصمیم |
|---|---:|---|
| ResizeObserver / MutationObserver | 64 / 26 | مسیر اصلی اندازه‌گیری و نگهداری DOM؛ هیچ polyfill لازم برای 99 ندارند. |
| optional chaining / nullish coalescing | 80 / 80 | در کد فعلی پشتیبانی می‌شوند؛ نیازی به تغییر منطق نیست. |
| Object.entries / Object.fromEntries / Array.flatMap | 54 / 73 / 69 | موجود در پایلوت یا زیرساخت؛ زیر مرز 99. |
| Element.append / before / after / replaceWith | 54 | همان nodeهای زنده جابه‌جا می‌شوند؛ کنترل یا handler کپی نشده است. |
| Element.remove / closest / matches | 24 / 41 / 33 | زیر مرز 99. |
| toggleAttribute / NodeList.forEach | 69 / 51 | زیر مرز 99. |
| focus با preventScroll / scrollIntoView با options | 64 / 61 | حفظ focus و نمایش کنترل فعال. |
| HTMLDialogElement.showModal / CSS.supports | 37 / 28 | انتخاب صفحات و تشخیص قابلیت با try/catch. |
| Canvas.roundRect | 99 | در کد ارث‌رسیده guard دارد و مسیر ctx.rect نیز از قبل موجود است؛ پایلوت مستقیماً به این متد وابسته نیست. |

`const/let`، arrow function، destructuring، default parameter، template literal، Map/Set، Array.from، requestAnimationFrame و APIهای معمول event/DOM/Canvas2D قبل از Chromium 99 پشتیبانی می‌شوند. parser/build هدف chrome99 برای سه فایل UI متعلق به این مرحله بدون هشدار اجرا شد؛ این فقط بررسی ساخت/نحو است، نه اجرای JS در V8 قدیمی. APIهای جدیدی مانند toSorted/groupBy/withResolvers در پروفایل تست unavailable می‌شوند؛ این کار تمام اختلاف‌های موتور JS را شبیه‌سازی نمی‌کند.

## پوشش قواعد قدیمی و علت CSS جدید

`css/ui/cep70.css` یک adapter مشترک سازگاری است؛ CSS مختص صفحهٔ تازه یا تعمیم طراحی نیست. در مرحلهٔ D باید همراه دو لایهٔ موقت A68/B69 ادغام شود. هیچ CSS قدیمی حذف نشده است.

| منبع قدیمی | :has یا رنگ جدید | جایگزین |
|---|---|---|
| appearance25.css | کارت دارای fontSelect | `data-cep70-has-font`؛ همان span در Grid عریض |
| fluent-glass47.css | inline-control دارای numeric37 | `data-cep70-has-numeric`؛ min-width و flex-wrap |
| project-brain.css | director-item دارای input checked | `data-cep70-has-checked`؛ همان border و shadow |
| studio37.css | control دارای textarea | `data-cep70-has-textarea`؛ همان span در عرض کم |
| upgrades27.css | label دارای checkbox | `data-cep70-has-checkbox`؛ همان چینش ردیفی |
| workflow-ui.css | card-title دارای card-icon | `data-cep70-has-card-icon`؛ همان min-height |
| liquid-ui.css / varna-ui.css | card / warning-soft با color-mix | سطح سالید و نقش‌های توکن مرحلهٔ A |
| vendor/ui30/tom-select.css | رنگ header افزونهٔ dropdown_header | syntax قدیمی color-mix نامعتبر است؛ افزونهٔ dropdown_header در تنظیمات فعلی studio30.js فعال نشده و header ساخته نمی‌شود. قاعدهٔ vendor حذف یا بازنویسی نشده است. |

لایهٔ adapter قبل از پایلوت و A68 بارگذاری می‌شود. `!important` فقط برای رقابت با همان قواعد important قدیمی و تقدم مرحلهٔ A لازم است؛ دلیل کنار قواعد در فایل ثبت شده است. قابلیت‌سنجی، UA sniffing ندارد؛ attributeها فقط presentation هستند و دادهٔ متن یا پروژه را تغییر نمی‌دهند. MutationObserver تغییر فرزندان را می‌بیند، change وضعیت checkbox را به‌روز می‌کند، و کارها با requestAnimationFrame تجمیع می‌شوند؛ خود attributeهای adapter دوباره observer را فعال نمی‌کنند.

## تست‌ها و شواهد

| بررسی | نتیجه |
|---|---|
| ui47_controls_browser.cjs اصلی | سبز؛ فایل آزمون تغییر نکرده |
| table47_browser.cjs اصلی | سبز؛ فایل آزمون تغییر نکرده |
| ui68_tokens_browser.cjs اصلی | سبز؛ فایل آزمون تغییر نکرده؛ شامل ۲۲ صفحه در دو تم |
| ui69_interactions_browser.cjs | سبز؛ رفتار عدد، فونت، focus، ورود/خروج، دادهٔ کلمه و نسبت تصویر |
| ماتریس ui69 معمول | **576 حالت صفحه / 864 حالت با بخش‌های باز، صفر شکست** |
| همان ماتریس با قابلیت‌های پس از 99 غیرفعال | **576 حالت صفحه / 864 حالت با بخش‌های باز، صفر شکست** |
| cep70_browser.cjs جدید | **48 حالت با بخش‌های باز، صفر شکست**؛ تشخیص قابلیت، fallbackهای پویا، عرض واقعی پنل مستقل از viewport، نبود قواعد جدید در CSS مالکیت‌شده |
| run-release.cjs / installer_package.cjs | 86/100؛ دقیقاً همان ۱۴ شکست قبلی، بدون شکست تازه / 3340 checksum بسته سبز |
| قرارداد شناسه‌ها | 899 شناسهٔ ثابت و بدون تکرار در هر HTML؛ شناسه‌ها و classهای HTML نسبت به مبنا ثابت |
| منطق اصلی و میزبان‌ها | Premiere/Resolve، host، app.js، توکن‌ها و stage-a68.css ثابت |

ماتریس‌ها: دو صفحه × عرض‌های 250/320/400/620/900/1400 × ارتفاع‌های 400/700/1000 × مقیاس‌های 100/125/150/200٪ × دو تم × دو زبان. فضای CSS با بزرگ‌نمایی reflow می‌شود و DPR نیز تنظیم می‌شود؛ این تست صرفاً تغییر DPR نیست و درعین‌حال جای DPI واقعی ویندوز را نمی‌گیرد.

پروفایل تست، قواعد :has و @container/nesting و اعلان‌های color-mix/واحدهای جدید را **قبل از parser** از CSS دریافتی حذف می‌کند، CSS.supports آن‌ها را false می‌کند و styleهای تزریقی را نیز بررسی می‌کند. قواعد استاندارد 99 از جمله @layer فعال می‌مانند. هیچ assertion قبلی حذف یا آسان‌تر نشده؛ تنها snapshot منابع ui69 با فایل‌های تازه کامل‌تر شده است. پوشش ۲۰ صفحهٔ دیگر برای الگوی تخت ادعا نشده است.

[خروجی ماتریس معمول](modern-matrix.json) · [خروجی ماتریس محدودشده](emulated-matrix.json) · [آزمون متمرکز](compatibility.json) · [قرارداد و هش‌ها](contract.json) · [لاگ تست‌ها](tests/)

برای تکرار از ریشهٔ مخزن (پس از نصب وابستگی‌های قفل‌شدهٔ tooling53):

```sh
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/cep70_browser.cjs
NODE_PATH=tooling53/node_modules VARNA_CEP70_PROFILE=chromium99 B69_REPORT=/tmp/cep99-matrix.json node Varna_Motion_Studio/tests/ui69_pilot_browser.cjs
NODE_PATH=tooling53/node_modules B69_REPORT=/tmp/modern-matrix.json node Varna_Motion_Studio/tests/ui69_pilot_browser.cjs
```

در صورت دسترسی به یک executable واقعی Chromium 99:

```sh
NODE_PATH=tooling53/node_modules VARNA_CHROMIUM=/path/to/chromium99 node Varna_Motion_Studio/tests/cep70_browser.cjs --native99
```

سازگاری خود Playwright نصب‌شده با پروتکل مرورگر 99 نیز باید در آن محیط بررسی شود؛ وجود این مسیر اختیاری به معنی اجرای موفق آن در این تحویل نیست.

## تصاویر و ارتفاع کم

[نمای تصاویر معمول/قابلیت محدود](SCREENSHOTS.md) شامل هر دو صفحه در چهار عرض و دو تم، با ارتفاع 400 و فارسی است. [تصاویر پایلوت تأییدشدهٔ قبل از این اصلاح](../ui-b69/README.md) جدا نگه داشته شده‌اند و ارتفاع 700 دارند؛ مقایسهٔ پیکسلی این دو ارتفاع ادعا نشده است.

اندازه‌گیری مقدماتی ناحیهٔ workspace پس از هدر و هر دو نوار پایین، در اندازهٔ رابط «خودکار/14px»، مقیاس 100٪ و ارتفاع 400:

| عرض | ارتفاع ناحیهٔ محتوا در هر دو صفحه | سهم از ارتفاع |
|---:|---:|---:|
| 250 | 264px | 66٪ |
| 320 | 264px | 66٪ |
| 400 | 243px | 60.75٪ |

این اعداد clientHeight محفظه و شامل padding داخلی‌اند؛ مساحت artwork نیستند. در هر دو تم و زبان یکسان بودند. این فقط دادهٔ مقدماتی بند ۲ است؛ همهٔ اندازه‌های رابط و مقیاس‌های سیستم برای شرط 50٪ بررسی و بازطراحی نشده‌اند. در این commit ادغام نوارها یا تغییر طراحی ارتفاع انجام نشده است.

## فقط قابل تأیید داخل After Effects واقعی

- اجرای CEP 12/CEF 99، بارگذاری @layer در CEF و بازگشت از/به پنل در dock و undock.
- تغییر اندازهٔ واقعی پنل با DPIهای 100/125/150/200٪ ویندوز، چند مانیتور و focus صفحه‌کلید.
- اتصال evalScript و host/ghaf_host.jsx؛ ایجاد/حذف/بازسازی لایه‌ها، Undo افتر، متن و جدول واقعی و فونت‌های نصب‌شده.
- نسبت کامپوزیشن، واکنش live preview به تعویض یا حذف کامپوزیشن و نتیجهٔ render نهایی.
- optics مربوط به backdrop-filter/شیشه، GPU و color management میزبان.
- popup native select، dialog focus/IME فارسی، tooltip و دسترس‌پذیری واقعی در CEF.

پشتیبانی مستند همهٔ قابلیت‌های باقی‌مانده تا مرز 99 بررسی شده؛ نتیجهٔ واقعی موارد بالا هنوز تأیید نشده است.

## مرز توقف و ترتیب بعدی

این تحویل در پایان بند ۱ متوقف می‌شود. پیش از دستهٔ ۱، بند ۲ باید با اندازه‌گیری کامل فضای محتوا و در صورت نیاز جمع‌کردن دو نوار تکمیل شود. سپس هر دسته یک commit مستقل و توقف برای بازبینی:

1. خانه، خروجی، محدودهٔ امن.
2. متن، موشن، استایل‌ها، منحنی حرکت.
3. افکت صوتی، ساخت صدا، ساخت زیرنویس، کلمات مهم، ترجمه.
4. بکگراند، برند، دستیار پروژه، دستیار اسکریپت، اصلاح هوشمند، ابزارهای افزوده، منابع سیستم، تنظیمات.

stage-a68.css و پایلوت و adapter فعلاً موقت‌اند؛ حذف/ادغام فقط در مرحلهٔ D با اثبات پوشش قواعد و مقایسهٔ تصاویر انجام می‌شود. ۱۴ شکست قدیمی release gate در محدودهٔ این commit اصلاح نمی‌شوند و نتیجهٔ gate جدا گزارش می‌شود.
