# النشر على Netlify (Turso + Netlify Blobs)

> **السبب**: Netlify بيئة serverless (لا قرص دائم)، لذا لا يمكن استخدام SQLite كملف.
> بدلًا من ذلك نستخدم **Turso** (libSQL/SQlite سحابي، خطة مجانية بدون بطاقة)
> لقاعدة البيانات، و **Netlify Blobs** لتخزين الموارد (ملفات PDF/MP3/صور).
> الـ schema (Prisma + SQLite) لم يتغير — نفس الترحيلات.

## 1. أنشئ حسابات (بدون بطاقة)

1. **Netlify**: [app.netlify.com](https://app.netlify.com) → Sign up with GitHub.
2. **Turso**: [app.turso.tech](https://app.turso.tech) → Sign up (GitHub/Google). لا بطاقة مطلوبة.
   - أنشئ قاعدة بيانات: `turso db create quran-school`
   - احصل على URL والتوكن:
     ```
     turso db show quran-school --url
     turso db tokens create quran-school
     ```

## 2. ارفع المشروع إلى GitHub

(كما في `docs/DEPLOY-RENDER.md` — commit + push.)

## 3. أنشئ موقع Netlify

1. Netlify Dashboard → **Add new site → Import an existing project**.
2. اختر مستودع `quran-school`.
3. Build settings (Netlify يكتشف Next.js تلقائيًا عبر `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `.next`
4. قبل Deploy، أضف **Environment variables** (Site settings → Environment variables):

| المتغير | القيمة |
|---------|--------|
| `TURSO_DATABASE_URL` | `libsql://...turso.io` |
| `TURSO_AUTH_TOKEN` | توكن Turso |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-site.netlify.app` (يُحدَّث لاحقًا) |
| `MAIL_FROM` / `SMTP_*` | اختياري |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | للتهيئة لأول مرة (ثم احذف `ADMIN_PASSWORD`) |

5. **Deploy site**. أول بناء ~3-5 دقائق.

## 4. طبّق ترحيلات قاعدة البيانات

من Netlify CLI (أو محليًا مع env vars):
```
npm install -g netlify-cli
netlify login
netlify link
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:migrate:turso
```
أو محليًا:
```
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx tsx scripts/turso-migrate.ts
```

## 5. أنشئ حساب المدير (مرة واحدة)

محليًا مع env vars:
```
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." \
ADMIN_NAME="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." \
npx tsx scripts/init-production.ts
```
ثم احذف `ADMIN_PASSWORD` من Netlify.

## 6. الدومين

1. Netlify → **Domain management → Add custom domain**.
2. اتبع تعليمات DNS (CNAME إلى `xxx.netlify.app`).
3. Netlify يفعّل HTTPS تلقائيًا (Let's Encrypt).
4. حدّث `NEXT_PUBLIC_SITE_URL` ثم أعد النشر.

## 7. النسخ الاحتياطي

- Turso يوفر Point-in-Time Restore (1 يوم على Free).
- لنسخة يدوية: `turso db dump quran-school > backup.sql`.
- زر «نسخة احتياطية» في `/admin/settings` غير متاح على Netlify (يُرجع 501).

## 8. التحديث

```
git push
```
Netlify ينشر تلقائيًا.

## 9. الفروقات عن Render/VPS

- لا يوجد قرص محلي: لا `entrypoint.sh`/`backup.sh` على الخادم.
- لا `reset-demo-data` على الإنتاج (شغّله محليًا مع env vars).
- `/admin/launch-status`: فحص النسخ الاحتياطي يُعرض كـ «غير متاح» على Netlify.

## 10. حل المشاكل

| المشكلة | الحل |
|---------|------|
| `SQLITE_CANTOPEN` / ملف غير موجود | تحقق من `TURSO_DATABASE_URL` (يجب أن يبدأ بـ `libsql://`) |
| `401 Unauthorized` من Turso | أعد إنشاء التوكن (`turso db tokens create`) |
| بناء Netlify فشل | تحقق من Node version (20) و`netlify.toml` |
| الموارد (ملفات) لا تُحمّل | تحقق من `NETLIFY` env (تُضبط تلقائيًا) |
| `P2002` (unique) | شغّل `turso-migrate` مرة أخرى (idempotent) |
