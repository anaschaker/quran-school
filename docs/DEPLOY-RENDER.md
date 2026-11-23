# النشر على Render — خطوة بخطوة

> **مهم**: Render يحتاج خطة مدفوعة (Starter أو أعلى) لتركيب **قرص دائم (Disk)**.
> الخطة المجانية لا تحفظ قاعدة البيانات (تُفقد عند كل نشر). لا تستخدم Free.

## 1. ارفع المشروع إلى GitHub

```bash
cd quran-school
git init
git add .
git commit -m "quran-school v0.0.1.3"
git branch -M main
git remote add origin https://github.com/USERNAME/quran-school.git
git push -u origin main
```

> لا ترفع `.env` أو `prisma/*.db` (موجودة في `.gitignore`). تحقق: `git status`.

## 2. أنشئ حساب Render

- [render.com](https://render.com) → Sign up بـ GitHub.
- اربط مستودع `quran-school`.

## 3. أنشئ الخدمة من Blueprint

1. Dashboard → **New → Blueprint**.
2. اختر المستودع → Render يقرأ `render.yaml`.
3. راجع:
   - Name: `quran-school`
   - Plan: **Starter** (وليس Free)
   - Disk: `quran-data` → `/data` → 1GB
4. اضغط **Apply**.

> بديل: **New → Web Service → Docker**، ثم أضف Disk يدويًا من صفحة **Disk** بعد الإنشاء (mount `/data`).

## 4. اضبط متغيرات البيئة

من صفحة الخدمة → **Environment**:

| المتغير | القيمة |
|---------|--------|
| `AUTH_SECRET` | يُولَّد تلقائيًا من Blueprint (أو `openssl rand -base64 32`) |
| `NEXT_PUBLIC_SITE_URL` | رابط Render المؤقت (مثل `https://quran-school.onrender.com`) ثم حدّثه للدومين |
| `MAIL_FROM` | `مدرسة القرآن الكريم <quraanschool11@gmail.com>` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | بريد المدرسة |
| `SMTP_PASS` | كلمة مرور التطبيق (App Password) |
| `WHATSAPP_*` | اتركها فارغة إن لم تستخدم واتساب |
| `ADMIN_NAME` | اسم المدير (للتهيئة فقط) |
| `ADMIN_EMAIL` | بريد المدير |
| `ADMIN_PASSWORD` | كلمة مرور قوية (10+ أحرف) |
| `ADMIN_PHONE` | هاتف المدير (اختياري) |

> `DATABASE_URL=file:/data/dev.db` موجود في `render.yaml` — لا تغيّره.

## 5. انتظر البناء

- Render يبني `Dockerfile` ثم يشغّل الخدمة.
- راقب **Logs**. أول بناء 3-6 دقائق.
- عند ظهور `Ready`، افتح:

```
https://quran-school.onrender.com/api/health
```

يجب أن يعيد:
```json
{ "status": "ok", "version": "v0.0.1.3", "checks": { "database": { "status": "ok" } } }
```

## 6. أنشئ حساب المدير الأول (مرة واحدة)

من صفحة الخدمة → **Shell**:

```bash
npx tsx scripts/init-production.ts
```

- إذا كانت `ADMIN_*` مضبوطة، سيعمل مباشرة.
- إن لم تكن، سيسألك الاسم/البريد/الهاتف/كلمة المرور.

ثم **احذف** `ADMIN_PASSWORD` من Environment (لا تتركه).

## 7. سجّل الدخول

1. افتح `https://quran-school.onrender.com/login`.
2. ادخل ببريد المدير وكلمة المرور.
3. افتح `/admin/settings` واضبط: اسم المدرسة، phone، address، hours، سعر الصرف.
4. افتح `/admin/launch-status` وتأكد من الفحوصات.

## 8. الدومين و HTTPS

1. **Settings → Custom Domains → Add Domain** (مثل `quran.example.com`).
2. أضف سجل CNAME في DNS كما يعرضه Render.
3. Render يفعّل HTTPS تلقائيًا (Let's Encrypt).
4. حدّث `NEXT_PUBLIC_SITE_URL` للدومين ثم **Manual Deploy**.

## 9. النسخ الاحتياطي

- **Render Disk Snapshots**: يوميًا تلقائيًا (7 أيام) — من صفحة **Disk**.
- **نسخ التطبيق**: `/data/backups/quran-school-backup-YYYY-MM-DD.db` (14 نسخة).
- تحميل نسخة من Shell:
  ```bash
  ls -lh /data/backups
  ```
  أو عبر `/admin/settings` → «نسخة احتياطية».
- تنزيل من جهازك (SCP):
  ```bash
  scp -s YOUR_SERVICE@ssh.YOUR_REGION.render.com:/data/backups/quran-school-backup-YYYY-MM-DD.db ./
  ```

## 10. التحديث

```bash
git add .
git commit -m "update"
git push
```
Render ينشر تلقائيًا (Auto-Deploy). تأكد من `/api/health`.

## 11. حل المشاكل

| المشكلة | الحل |
|---------|------|
| `Permission denied` على /data | أعد النشر (entrypoint يضبط الملكية) أو تأكد أن Disk mounted على `/data` |
| `P2021: table does not exist` | Shell: `npx prisma migrate deploy` |
| الصفحة 502 | تحقق من Logs، ومن `PORT` (Render يضبطه تلقائيًا) |
| البيانات تُفقد عند النشر | تأكد أن Disk مضاف (خطة Starter) وليس Free |
| البريد لا يُرسل | راجع SMTP_* و«تفضيلات الإشعارات» للمستخدم |

## 12. التكلفة التقريبية

- Starter Web Service: ~$7/شهر.
- Disk 1GB: ~$0.25/شهر.
- (اختياري) Postgres لاحقًا: يبدأ من ~$6/شهر.
