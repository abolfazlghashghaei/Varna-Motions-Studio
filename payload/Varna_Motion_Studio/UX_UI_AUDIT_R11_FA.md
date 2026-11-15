# UX/UI Audit — R11

## Critical UX issues
- Liquid Glass خروجی قبلی از نظر مدل بصری با Glassmorphism اشتباه گرفته شده بود؛ سطح شیشه فقط Blur/Border داشت و کنترل گرادینت واقعی نداشت. **حل:** Two-Tint + draggable handles + optical refraction + rim/specular/depth.
- IN/OUT کتابخانه Motion نامتقارن بود و کاربر نمی‌توانست برای هر Motion ورودی خروج متناظر پیدا کند. **حل:** OUT به‌صورت مستقیم از کل کتابخانه IN ساخته می‌شود.
- بخشی از Motionهای Transform به Keyframe ثابت وابسته بودند؛ Markerها برای همه Presetها duration را کنترل نمی‌کردند. **حل:** Transform Motionهای Varna نیز Expression/Marker-driven شدند.

## Major UX issues
- Table Designer به‌صورت دو ستون فشرده، با کنترل‌های مرتبط در نواحی دور از هم نمایش داده می‌شد. **حل:** workflow یک‌ستونه و ترتیبی.
- Liquid table با Opacity زیاد روی تک‌تک Cellها خروجی مات/شیری می‌داد. **حل:** یک optical frame مشترک + Cell tint بسیار کم + rim/separator ظریف.
- Round outer corners از نظر مفهومی باید فقط چهار corner فیزیکی باشد. **حل:** Path سفارشی بر مبنای جهت فیزیکی RTL/LTR.

## Visual/UI issues
- Color flow با picker جایگزین‌شده رفتار غیرقابل پیش‌بینی داشت. **حل:** native color input حفظ شد، HEX مکمل همان state است.
- کنترل Gradient به عددهای Angle/Balance محدود بود. **حل:** surface بصری با Handle A/B و drag مستقیم.

## Minor polish
- OUT preview با جهت معکوس همان Preview اصلی نمایش داده می‌شود.
- Table advanced settings جمع‌شونده ماند تا cognitive load پایین بماند.
- تم کلی، Navigation و بخش‌هایی که در R10 سالم بودند عمداً بازطراحی نشدند تا ریسک regression کم بماند.

## موارد نیازمند تست داخل AE
- حس نهایی Refraction/Bevel بسته به رزولوشن و Footage باید داخل After Effects 2026 بررسی شود.
- Gradient Ramp، Turbulent Displace و Bevel همگی داخل try/catch هستند تا نبود/تفاوت نسخه باعث Host Error نشود.
