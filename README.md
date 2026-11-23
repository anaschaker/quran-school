# مدرسة القرآن الكريم

موقع إداري وتعريفي لمدرسة قرآنية، بواجهة عربية كاملة من اليمين إلى اليسار (RTL)،
وهوية بصرية هادئة بالأخضر الداكن والذهبي والأبيض.

يوفر المشروع:

- صفحات عامة: الرئيسية، عن المدرسة، البرامج، التواصل، تسجيل الدخول.
- لوحة إدارة: الطلاب، المعلمون، الحلقات، الاختبارات، الإعلانات، رسائل التواصل،
  وتقرير الحضور الشهري مع تصدير الكشوف.
- لوحة معلم: حلقاته وطلابه فقط، مع تسجيل الحضور والتسميع وإنشاء الاختبارات.
- لوحة طالب وولي أمر: ملخص التقدم والحضور والدرجات والإعلانات الموجّهة.

## التقنيات

- Next.js 16 (App Router) مع TypeScript
- Tailwind CSS 4
- Prisma 6 مع قاعدة بيانات SQLite
- jose لتوقيع جلسات JWT، وbcryptjs لتجزئة كلمات المرور
- Zod للتحقق من المدخلات برسائل عربية
- recharts للرسوم البيانية
- خط Cairo عبر `next/font`

## المتطلبات

- Node.js 20 أو أحدث
- npm

## التثبيت

```bash
npm install
```

## إعداد متغيرات البيئة

انسخ ملف النموذج ثم عدّل القيم:

```bash
# على أنظمة يونكس
cp .env.example .env

# على ويندوز (PowerShell)
Copy-Item .env.example .env
```

ثم ولّد مفتاحًا عشوائيًا لـ `AUTH_SECRET` وضعه في `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

محتوى `.env` المتوقع:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ضع-هنا-المفتاح-العشوائي"
```

> لا ترفع ملف `.env` إلى المستودع. الملف `.env.example` يحتوي على القيم النموذجية فقط.

## قاعدة البيانات

```bash
npm run db:generate   # توليد Prisma Client
npm run db:migrate    # إنشاء قاعدة البيانات وتطبيق الترحيلات
npm run db:seed       # إدخال البيانات التجريبية
```

- قاعدة SQLite تُنشأ داخل `prisma/dev.db`.
- يمكن استخدام `npm run db:studio` لاستعراض البيانات.

## التشغيل

```bash
# بيئة التطوير
npm run dev

# أو بناء وتشغيل نسخة الإنتاج
npm run build
npm run start
```

ثم افتح [http://localhost:3000](http://localhost:3000) وانتقل إلى `/login`.

## حسابات التجربة

كلمة المرور لجميع الحسابات: `Quran@1234`

| الدور | البريد الإلكتروني | الهاتف |
| --- | --- | --- |
| مدير | `admin@quran-school.test` | `0500000001` |
| معلم | `teacher1@quran-school.test` | `0500000002` |
| طالب | `student1@quran-school.test` | `0500000101` |
| ولي أمر | `parent1@quran-school.test` | `0500000011` |

يمكن تسجيل الدخول بالبريد الإلكتروني أو رقم الهاتف.

## الصفحات العامة

- `/` الصفحة الرئيسية: هيرو، إحصائيات حيّة، برامج، وآخر الإعلانات.
- `/about` عن المدرسة.
- `/programs` البرامج (حفظ، تجويد، مراجعة، تلاوة).
- `/contact` معلومات التواصل ونموذج يحفظ الرسائل في جدول `ContactMessage`.
- `/login` تسجيل الدخول.

## المصادقة والصلاحيات

- تُقارن كلمة المرور بتجزئة bcrypt، وتُحفظ الجلسة في كوكي `quran_session`
  بخيارات `httpOnly` و`SameSite=Lax` و`Secure` في الإنتاج، لمدة 7 أيام.
- يحمي `src/proxy.ts` المسارات `/admin` و`/teacher` و`/student` و`/parent`.
- إضافة إلى ذلك، تتحقق كل صفحة محمية من الدور في الخادم عبر `requireRole()`.
- المعلم لا يصل إلا إلى حلقاته وطلابه، وولي الأمر لا يرى إلا أبناءه.
- تُتحقق جميع المدخلات في Server Actions باستخدام Zod قبل الوصول إلى قاعدة البيانات.

## الأوامر

| الأمر | الوصف |
| --- | --- |
| `npm run dev` | خادم التطوير على `http://localhost:3000` |
| `npm run build` | بناء المشروع للإنتاج |
| `npm run start` | تشغيل نسخة الإنتاج بعد البناء |
| `npm run lint` | فحص الشيفرة باستخدام ESLint |
| `npm run db:generate` | توليد Prisma Client |
| `npm run db:push` | مزامنة المخطط دون إنشاء ترحيل |
| `npm run db:migrate` | إنشاء وتطبيق ترحيل جديد |
| `npm run db:seed` | إدخال البيانات التجريبية |
| `npm run db:studio` | فتح Prisma Studio |

## إعدادات المدرسة

جميع النصوص والمعلومات الظاهرة (الاسم، الهاتف، البريد، العنوان، ساعات الدوام،
العملة وسعر الصرف، البرامج، ونصوص «عن المدرسة») موجودة في
`src/config/school.ts`، ويمكن تعديل معظمها من `/admin/settings` (تُحفظ في قاعدة
البيانات وتتقدّم على القيم الافتراضية).

## النشر والتوثيق

- **DEPLOY.md**: خطوات النشر من الصفر (VPS، Docker، Nginx، HTTPS، نسخ احتياطي).
- **docs/DEPLOY-NETLIFY.md**: النشر على Netlify (Turso + Netlify Blobs) بدون بطاقة."
- **docs/DEPLOY-RENDER.md**: النشر على Render خطوة بخطوة (Docker + Disk).
- **docs/USER-GUIDE-ADMIN.md**: دليل المدير (خطوات نصية).
- **docs/USER-GUIDE-TEACHER.md**: دليل المعلم.
- **docs/USER-GUIDE-PARENT.md**: دليل ولي الأمر.
- **docs/LAUNCH-CHECKLIST.md**: قائمة تحقق قبل الإطلاق.
- **docs/HANDOVER.md**: حزمة التسليم (بنية، أدوار، صيانة، PostgreSQL).
- **فحص الصحة**: `/api/health` (حالة التطبيق + قاعدة البيانات + الإصدار).
- **النسخ الاحتياطي**: `sh scripts/backup.sh` (احتفاظ 14)؛ الاستعادة `sh scripts/restore.sh <file>`.

## الإصدار

- `APP_VERSION` = `v0.0.1.3` (يظهر في التذييل وفي `/api/health`).
- `package.json` = `0.0.1`.

## قناة واتساب (اختيارية)

1. أنشئ تطبيقًا في [Meta for Developers](https://developers.facebook.com/) وأضف
   منتج "WhatsApp".
2. من لوحة التطبيق: **WhatsApp → API Setup**، انسخ:
   - **Temporary access token** (أو أنشئ System User token للإنتاج) → `WHATSAPP_TOKEN`.
   - **Phone number ID** → `WHATSAPP_PHONE_ID`.
3. أضفهما إلى `.env`، وعيّن `WHATSAPP_ENABLED="true"`.
4. من لوحة الإدارة (`/admin/settings`) فعّل القناة واختبر الإرسال لرقم محدد.
5. لاستقبال رسائل، يجب أن يوافق ولي الأمر (consent) من صفحة `/account`.
   لا يُرسل شيء بدون موافقة.

## النسخ الاحتياطي والاستعادة

### إنشاء نسخة احتياطية

- من لوحة الإدارة: **إعدادات المدرسة → نسخة احتياطية من قاعدة البيانات → تحميل
  النسخة الاحتياطية** (للمدير فقط).
- يُحمَّل ملف SQLite باسم `quran-school-backup-YYYY-MM-DD.db` (التاريخ بتوقيت UTC).

### استعادة نسخة احتياطية

1. **أوقف خادم التطبيق** (`Ctrl+C` أو أوقف خدمة الإنتاج) لضمان عدم استخدام
   قاعدة البيانات.
2. انسخ النسخة الاحتياطية إلى مجلد `prisma/` (أو أي مسار تحدده `DATABASE_URL`).
3. احتفظ بنسخة من قاعدة البيانات الحالية (اختياري لكن مُستحسن):
   ```bash
   # ويندوز (PowerShell)
   Rename-Item prisma/dev.db prisma/dev.db.before-restore-$(Get-Date -Format yyyy-MM-dd)
   ```
4. استبدل قاعدة البيانات:
   ```bash
   # ويندوز (PowerShell)
   Copy-Item prisma/quran-school-backup-2026-01-01.db prisma/dev.db
   ```
5. احذف أي ملفات مساعدة قديمة (إن وُجدت) لتجنّب تعارض:
   ```bash
   Remove-Item prisma/dev.db-journal, prisma/dev.db-wal, prisma/dev.db-shm -ErrorAction SilentlyContinue
   ```
6. تحقّق من حالة الترحيلات (بدون تعديل البيانات):
   ```bash
   npx prisma migrate status
   ```
   - إذا كانت النسخة الاحتياطية من إصدار أقدم، طبّق الترحيلات:
     ```bash
     npx prisma migrate deploy
     ```
   - لا تستخدم `npm run db:migrate` (الذي يُنشئ ترحيلات جديدة) على قاعدة
     الإنتاج.
7. ولّد Prisma Client (إذا لزم):
   ```bash
   npm run db:generate
   ```
8. **أعد تشغيل الخادم**:
   ```bash
   npm run start   # أو npm run dev في بيئة التطوير
   ```

> ملاحظة: استعادة نسخة احتياطية تُلغي أي تغييرات تمت بعد تاريخ النسخة.
> احتفظ بنسخ متعددة (يومية/أسبوعية) في موقع خارج مجلد المشروع.

## بنية المشروع

راجع [AGENTS.md](./AGENTS.md) لوصف تفصيلي للبنية وإرشادات التطوير،
و[CHANGELOG.md](./CHANGELOG.md) لسجل التغييرات.
