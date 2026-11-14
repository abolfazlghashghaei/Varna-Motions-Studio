# UX/UI Audit — Varna Motion Studio 4.3 R8

این Audit قبل از نهایی‌سازی R8 روی ساختار فعلی R7، جریان‌های Table / Motion / SFX / Color / Preview و فایل‌های Animation Composer / Mister Horse ارسالی انجام شد. هدف، حفظ Business Logic سالم و اصلاح نقاطی بود که مستقیماً باعث خطا، ابهام یا کندی کار می‌شدند؛ نه بازطراحی تزئینی.

## Critical UX issues

### 1) ساختار DOM و خروجی Table شکننده بود
**مشکل:** بخش Table در R7 در اثر اضافه‌شدن چند مرحله‌ای کنترل‌ها، nesting و grouping نامنظم داشت و برخی کنترل‌ها به ساختار قدیمی وابسته مانده بودند.  
**چرا مشکل است:** وقتی DOM و state یک بخش پیچیده با هم هم‌خوان نباشند، Preview ممکن است کار کند ولی Build واقعی یا Inspector روی Cell خروجی قابل پیش‌بینی ندهد.  
**اثر روی کاربر:** کاربر به تنظیمات اعتماد نمی‌کند و نمی‌داند ایراد از جدول است یا After Effects.  
**راه‌حل R8:** بخش Table به یک جریان روشن «ساختار → Cell → زمان → Style → Preview/Build» بازچینی شد، IDهای بلااستفاده حذف شدند و Build/Preview پاسخ Host را validate می‌کنند.

### 2) Resize افقی در RTL برعکس رفتار فیزیکی موس بود
**مشکل:** Delta حرکت موس برای RTL دوباره معکوس می‌شد.  
**چرا مشکل است:** RTL باید فقط نگاشت ستون منطقی به سمت فیزیکی را عوض کند، نه معنای حرکت موس را.  
**اثر:** کشیدن مرز به راست، ستون سمت چپ را کوچک/بزرگ خلاف انتظار می‌کرد.  
**راه‌حل R8:** ستون‌های فیزیکی RTL از آرایه منطقی reverse می‌شوند ولی Delta موس همیشه در جهت فیزیکی باقی می‌ماند؛ Preview و خروجی AE نیز یک mapping مشترک دارند.

### 3) زمان حضور Table پراکنده و غیرقابل پیش‌بینی بود
**مشکل:** Start/Duration/Cell timing در چند input جدا دیده می‌شد و مدت پیش‌فرض کوتاه می‌توانست جای انتخاب صریح کاربر را بگیرد.  
**چرا مشکل است:** برای یک آیتم تایم‌لاین، سؤال اصلی کاربر «از کجا تا کجا دیده شود؟» است.  
**اثر:** جدول زودتر از انتظار ناپدید می‌شد یا کاربر مجبور بود مدت را محاسبه کند.  
**راه‌حل R8:** یک Range دو دستگیره‌ای Start/End با نمایش مستقیم بازه اضافه شد. مقدار دقیق زیر Advanced باقی مانده و Build مستقیماً `start/end` را به AE می‌فرستد.

### 4) معنی «فقط چهار گوشه بیرونی» اشتباه بود
**مشکل:** R7 می‌توانست تمام چهار گوشه چهار Cell کناری را Round کند.  
**چرا مشکل است:** منظور طراحی جدول، فقط یک گوشه بیرونی از هر Cell گوشه است.  
**اثر:** Grid شبیه کارت‌های جداگانه دیده می‌شد و مرزهای داخلی گرد می‌شدند.  
**راه‌حل R8:** برای Cellهای گوشه فقط همان corner فیزیکی بیرونی با Path سفارشی Round می‌شود؛ تمام گوشه‌های داخلی square می‌مانند و در RTL نیز نگاشت physical left/right تصحیح شده است.

## Major UX issues

### 5) Color Picker دو مفهوم متفاوت را مخلوط کرده بود
**مشکل:** کنار `<input type=color>` دکمه جدا با عنوان قطره‌چکان اضافه شده بود، در حالی که درخواست اصلی انتخاب صحیح رنگ از Color Selector خود کنترل بود.  
**اثر:** کاربر با دو action مشابه روبه‌رو می‌شد و تغییر رنگ همیشه بلافاصله وارد state نمی‌شد.  
**راه‌حل R8:** دکمه‌های اضافی Eyedropper حذف شدند. Swatch بومی + HEX تنها کنترل رنگ هستند و رویداد `input/change` هر دو state و preview را sync می‌کنند.

### 6) IN و OUT موشن discoverable نبودند
**مشکل:** Outro در یک dropdown فرعی پنهان بود و مدل ذهنی Animation Composer را نداشت.  
**اثر:** ساخت خروجی کامل ورود/خروج کند و مبهم بود.  
**راه‌حل R8:** Motion به دو phase واضح **IN** و **OUT** تقسیم شد، هر کدام Library و Preset مستقل دارند و هنگام خروجی کپشن Markerهای `VARNA IN` و `VARNA OUT` روی لایه ساخته می‌شوند.

### 7) دسته‌بندی Motion با selector بیش‌ازحد عمومی collision داشت
**مشکل:** handler دسته‌بندی روی هر دکمه دارای attribute مشابه اجرا می‌شد و می‌توانست Preset را به‌جای Tab بگیرد.  
**اثر:** active state و filtering گاهی غیرمنطقی می‌شد.  
**راه‌حل R8:** event binding فقط به container دسته‌بندی Motion محدود شد و Phase tabs از Preset selection جدا شدند.

### 8) Assetهای ارسالی از workflow پلاگین جدا بودند
**مشکل:** Packهای Motion/SFX ارسالی در R7 به Library داخلی Varna متصل نبودند.  
**اثر:** کاربر فایل‌ها را دارد ولی داخل همان workflow از آن‌ها استفاده نمی‌کند.  
**راه‌حل R8:** 66 فایل WAV ارسالی در Library داخلی SFX bundle و خودکار register شدند. 818 فایل `.mhcitem` + 818 preview + 4 `.aegraphic` + فایل‌های engine ارسالی نیز همراه R8 نگهداری شده‌اند. چون `.mhcitem` فرمت proprietary است، Varna محتوای باینری آن را حدس نمی‌زند؛ اجرای مستقیم موشن با Presetهای Native AE «Composer Style» انجام می‌شود تا وابستگی و crash ایجاد نشود.

## Visual / UI issues

### 9) Design system به‌علت overrideهای چند نسخه‌ای یکدست نبود
**مشکل:** R2 تا R7 هر کدام CSS overrideهای جدید اضافه کرده بودند؛ radius، spacing، control height و contrast در بعضی Cardها متفاوت بود.  
**اثر:** محصول شبیه مجموعه componentهای جدا دیده می‌شد و hierarchy ضعیف می‌شد.  
**راه‌حل R8:** یک R8 Product System نهایی در انتهای stylesheet قرار گرفت: spacing/radius/control-height مشترک، hierarchy ثابت برای Card/Input/Button، focus-visible مشخص، dividerهای کم‌کنتراست و responsive behavior یکسان.

### 10) Table Cellها با width ثابت مقابل Resize مستقیم مقاومت می‌کردند
**مشکل:** input داخل Cell عرض ثابت داشت.  
**اثر:** مرز ستون حرکت می‌کرد ولی محتوا حس می‌داد اندازه سلول تغییر نکرده یا overflow می‌کرد.  
**راه‌حل R8:** Cell inputها `width:100%` و `min-width:0` دارند؛ editor حداقل اندازه منطقی دارد و handleها hit-area مناسب‌تری دارند.

### 11) Preview داخلی Table بیش‌ازحد اهمیت بصری داشت
**مشکل:** Preview بزرگ داخل Panel فضای کار را می‌گرفت، در حالی که نتیجه واقعی باید روی Comp سنجیده شود.  
**اثر:** Scroll بیشتر و cognitive load بالاتر.  
**راه‌حل R8:** Preview داخلی به Mini Preview جمع‌شونده تبدیل شد و Preview اصلی «روی Composition» است.

## Minor polish issues

### 12) Feedback stateها و Help copy در بعضی بخش‌ها نزدیک کنترل بعدی بودند
**راه‌حل R8:** توضیح هر Section داخل همان Card و با فاصله ثابت قرار گرفت، statusها نزدیک action مربوطه هستند، focus/disabled/loading stateها هماهنگ شده و layout در پنل باریک به یک ستون collapse می‌شود.

## مهم‌ترین تصمیم‌های UX در R8

- نتیجه واقعی After Effects بر Preview تزئینی داخل Panel اولویت دارد.
- کنترل مستقیم (Drag / Start-End / Swatch) بر نمایش عددهای تکراری اولویت دارد؛ عدد دقیق فقط جایی می‌ماند که واقعاً برای کنترل حرفه‌ای لازم است.
- RTL یک mapping داده است، نه معکوس‌کردن رفتار موس.
- Motion با مدل ذهنی IN/OUT ارائه می‌شود و Background از نظر زمان با متن sync می‌شود.
- Asset proprietary بدون شناخت format اجرا/بازنویسی نمی‌شود؛ فایل اصلی حفظ می‌شود و مسیر اجرای پایدار با Native AE ارائه می‌شود.

## چیزهایی که عمداً تغییر ندادیم

- Navigation اصلی صفحات؛ چون کاربران نسخه‌های قبلی با آن آشنا هستند و مشکل بحرانی در ساختار top-level نداشت.
- Business logic اصلی Caption/Whisper/Correction Memory؛ این نسخه تمرکز اصلی‌اش Table/Motion/SFX/UI بود و بازنویسی بی‌دلیل ریسک Regression ایجاد می‌کرد.
- Advanced controls حرفه‌ای؛ حذف نشدند، فقط زیر hierarchy مناسب‌تر قرار گرفتند.
- Preview روی Comp؛ حفظ شد چون دقیق‌ترین reference برای AE است.

## مواردی که هنوز تست واقعی After Effects لازم دارند

محیط build فعلی نمی‌تواند خود Adobe After Effects را اجرا کند. بنابراین با وجود تست‌های static/regression، موارد زیر باید یک دور در AE واقعی بررسی شوند:

1. Path سفارشی چهار corner بیرونی Table روی چند نسبت ابعاد و Merge پیچیده.
2. Color Selector بومی CEP/Chromium در نسخه دقیق After Effects نصب‌شده.
3. Markerهای IN/OUT و feel انیمیشن‌ها در نرخ فریم‌های مختلف.
4. Liquid Glass با Gaussian Blur/Stroke روی GPU/renderer واقعی AE.
5. SFX import/placement با assetهای WAV روی Composition واقعی.

