---
description: كيفية ربط ونشر تطبيق الحي عبر Codemagic
---

# دليل النشر عبر Codemagic

هذا الدليل يشرح الخطوات اللازمة لأتمتة بناء ورفع تطبيق "الحي" إلى متجري App Store و Google Play.

## 1. المتطلبات الأساسية
- حساب Codemagic مرتبط بمستودع GitHub الخاص بالمشروع.
- ملفات الـ Signing (Keystore للأندرويد، و Certificates/Provisioning Profiles للـ iOS).
- الوصول إلى App Store Connect و Google Play Console.

## 2. متغيرات البيئة (Environment Variables)
يجب إضافة المتغيرات التالية في إعدادات Codemagic:
- `SUPABASE_URL`: رابط مشروع Supabase.
- `SUPABASE_ANON_KEY`: المفتاح العام لـ Supabase.
- `MAPBOX_ACCESS_TOKEN`: مفتاح الخرائط (يُفضل استخدامه أثناء البناء إذا كان ثابتاً، أو تركه للديناميكية كما هو حالياً).
- `APP_STORE_CONNECT_KEY_ID` / `ISSUER_ID` (للـ iOS).

## 3. خطوات سير العمل (Workflow)
1. **تثبيت التبعيات**: `npm install`.
2. **بناء نسخة الويب**: `npm run build`.
3. **مزامنة Capacitor**: 
   - `npx cap sync android`
   - `npx cap sync ios`
4. **بناء النسخة الأصلية (Native Build)**:
   - للأندرويد: `cd android && ./gradlew bundleRelease`.
   - للـ iOS: استخدام الـ Xcode build script المدمج في Codemagic.

## 4. النصيحة النهائية
تأكد من تحديث `package.json` بـ `version` جديد قبل كل بناء لضمان قبول المتاجر للتحديث.

// turbo
3. npx cap sync
