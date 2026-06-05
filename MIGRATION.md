# دليل ترحيل الـ Backend من Lovable إلى مشروع Supabase خاص بك

هذا الدليل ينقل قاعدة البيانات والدوال والتخزين من مشروع Supabase المُدار عبر Lovable
(`hmnpraslunhnuigeetoe`) إلى مشروع Supabase جديد تملكه أنت — بحيث يصبح التطبيق مستقلاً 100%.

> ⚠️ **لا تُلغِ اشتراك Lovable إلا بعد إكمال كل الخطوات والتأكد أن المشروع الجديد يعمل.**

---

## ما تحتاجه قبل البدء
- حساب Supabase خاص بك (مجاني يكفي للبداية): https://supabase.com
- أدوات: `npx supabase` (موجود)، و `psql` + `pg_dump` (من Postgres client).
- **سلسلة اتصال قاعدة البيانات القديمة** (OLD): من لوحة Supabase القديمة (تُفتح عبر Lovable):
  `Settings → Database → Connection string (URI)` + كلمة مرور قاعدة البيانات.

---

## المرحلة 1 — أنشئ المشروع الجديد
1. ادخل supabase.com بحسابك → New project → اختر اسم ومنطقة (الأقرب: Frankfurt/Bahrain).
2. احفظ من `Settings → API`:
   - `Project URL`  → سيصير `NEW_URL`
   - `anon public key` → سيصير `NEW_ANON_KEY`
   - `service_role key` (سري)
   - `Project Ref` (الجزء قبل `.supabase.co`) → `NEW_REF`
3. احفظ من `Settings → Database`:
   - كلمة مرور قاعدة البيانات الجديدة + سلسلة الاتصال → `NEW_DB_URL`

---

## المرحلة 2 — انقل المخطط (Schema)
المخطط كامل محفوظ في `supabase/migrations/` (60 ملف).

```bash
npx supabase login                       # توكن من supabase.com/dashboard/account/tokens
npx supabase link --project-ref NEW_REF  # اربط المشروع الجديد
npx supabase db push                     # يطبّق كل الـ migrations (يبني الجداول والسياسات)
```

---

## المرحلة 3 — انقل البيانات + حسابات المستخدمين
> استخدم سلسلة الاتصال المباشرة (port 5432)، وليست pooler إن أمكن.

```bash
# 3أ) صدّر من القديم
npx supabase db dump --db-url "OLD_DB_URL" -f old_roles.sql  --role-only
npx supabase db dump --db-url "OLD_DB_URL" -f old_data.sql   --data-only --use-copy

# 3ب) استورد إلى الجديد
psql "NEW_DB_URL" -f old_roles.sql
psql "NEW_DB_URL" -f old_data.sql
```

ملاحظة: `--data-only` ينقل بيانات الجداول العامة **و** حسابات المستخدمين في `auth.users`
(فتبقى كلمات المرور وتسجيلات الدخول كما هي). بعد الاستيراد تحقق:
```bash
psql "NEW_DB_URL" -c "select count(*) from auth.users;"
psql "NEW_DB_URL" -c "select count(*) from public.products;"
```

---

## المرحلة 4 — انقل ملفات التخزين (الصور)
الحاويات المستخدمة: **`avatars`** (صور المستخدمين) و **`product-images`** (صور المنتجات/الشعارات).

1. في المشروع الجديد: `Storage → New bucket` → أنشئ `avatars` و `product-images` (اجعلها **public** مثل القديمة).
2. حمّل الملفات من القديم وارفعها للجديد. أسهل طريقة عبر سكربت Node بسيط (أو يدوياً للملفات القليلة):
   - نزّل من: `https://hmnpraslunhnuigeetoe.supabase.co/storage/v1/object/public/<bucket>/<path>`
   - ارفع للجديد عبر `supabase.storage.from('<bucket>').upload(...)` بمفتاح service_role.
3. سياسات التخزين (RLS) تأتي مع الـ migrations؛ تأكد أنها طُبّقت.

---

## المرحلة 5 — انشر الدوال (Edge Functions)
```bash
npx supabase functions deploy edfapay-webhook --no-verify-jwt
npx supabase functions deploy send-webpush --no-verify-jwt
npx supabase functions deploy aimtell-webhook --no-verify-jwt
# والبقية (تحقق jwt افتراضي):
for f in edfapay-payment edfapay-applepay-validate edfapay-applepay-process verify-edfapay-credentials \
  calculate-eta check-scheduled-orders check-weekly-payouts delete-provider geocode-neighborhoods \
  get-mapbox-token process-scheduled-notifications send-application-email send-contact-email \
  send-employee-notification send-notification send-order-email send-weekly-report setup-provider; do
  npx supabase functions deploy "$f"
done
```

---

## المرحلة 6 — اضبط المفاتيح السرية (Secrets) على المشروع الجديد
```bash
npx supabase secrets set \
  EDFAPAY_MERCHANT_ID=04c89915-0b5a-461c-999a-aae9926f6363 \
  EDFAPAY_PASSWORD=b3d4ef21-b826-428a-bec6-b7f719e3c85d \
  RESEND_API_KEY=__من_المشروع_القديم__ \
  MAPBOX_ACCESS_TOKEN=__من_المشروع_القديم__ \
  AIMTELL_API_KEY=__من_المشروع_القديم__ \
  AIMTELL_SITE_ID=33878 \
  VAPID_PUBLIC_KEY=BGvaDjAFzT9wThyVENojjsQjRBKBU8_UZE91CIBm-MGX-zvVhq4YZ0dn3p_szqzQWrhMfiZOYqBuLflXj_YwFWI \
  VAPID_PRIVATE_KEY=__من_المشروع_القديم__
```
> `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` تُحقن تلقائياً — لا تضبطها يدوياً.
> القيم المكتوب عليها `__من_المشروع_القديم__` انسخها من أسرار المشروع القديم
> (لوحة Supabase القديمة → Edge Functions → Secrets).

---

## المرحلة 7 — حدّث ملفات المشروع لتشير للـ Backend الجديد
شغّل السكربت الجاهز (يحدّث `.env` و `codemagic.yaml` و `supabase/config.toml`):
```bash
bash scripts/migrate-supabase.sh NEW_REF "NEW_URL" "NEW_ANON_KEY"
```
ثم أعد البناء والمزامنة:
```bash
npm run build && npx cap sync
```

---

## المرحلة 8 — إعادة الضبط الخارجي
1. **Auth Providers**: في المشروع الجديد → Authentication → Providers → فعّل Google و Apple
   وأدخل نفس الـ Client IDs/Secrets المستخدمة سابقاً.
2. **Redirect URLs**: Authentication → URL Configuration → أضف:
   - `al7ay://auth-callback`  (للتطبيق الأصلي)
   - رابط موقعك (إن وُجد)
3. **EdfaPay**: في لوحة EdfaPay → غيّر رابط الكول باك إلى:
   `https://NEW_REF.supabase.co/functions/v1/edfapay-webhook`
4. **Apple Pay domain** (اختياري للويب): حدّث `domainName` في
   `supabase/functions/edfapay-applepay-validate/index.ts` لنطاقك الجديد.

---

## المرحلة 9 — تحقق نهائي ثم ألغِ Lovable
- [ ] تسجيل دخول جديد يعمل (إيميل + Google/Apple)
- [ ] المنتجات والمتاجر تظهر
- [ ] طلب تجريبي يكتمل + الدفع (EdfaPay) ينشئ الطلب
- [ ] الصور تظهر (avatars / product-images)
- [ ] الإشعارات تعمل
- [ ] بناء iOS عبر Codemagic ناجح ويشير للـ Backend الجديد

بعد نجاح كل ما سبق فقط → **ألغِ اشتراك Lovable**.
