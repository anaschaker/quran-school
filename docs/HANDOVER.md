# حزمة التسليم (HANDOVER.md)

## 1. وصف النظام

**مدرسة القرآن الكريم** — منصة ويب عربية (RTL) لإدارة مدرسة قرآنية:
- صفحات عامة (الرئيسية، عن، برامج، تواصل، تسجيل).
- لوحات: مدير، معلم، طالب، ولي أمر.
- الحضور، التسميع، الاختبارات، الشهادات، الرسوم، التقارير، الإشعارات، الرسائل внутренية، التقويم، الأعذار، الموارد.

## 2. الأدوار والصلاحيات

| الدور | المسارات | الصلاحيات |
| --- | --- | --- |
| ADMIN | /admin/* | كل شيء |
| TEACHER | /teacher/* | حلقاته/طلابه، حضور، تسميع، اختبارات، شهادات |
| STUDENT | /student | بياناته فقط |
| PARENT | /parent | أبناؤه فقط |
| أي مسجّل | /messages, /notifications, /account | himself |

## 3. بنية المشروع (مختصر)

- `src/app/` — صفحات ومسارات (App Router).
- `src/components/` — مكوّنات UI.
- `src/lib/` — منطق، server actions، تحقق Zod.
- `src/config/school.ts` — إعدادات المدرسة (افتراضية).
- `prisma/` — مخطط، ترحيلات، seed.
- `scripts/` — صيانة (backup, restore, init, reset).
- `docs/` — أدلة المستخدم والنشر.

## 4. متغيرات البيئة

راجع `.env.production.example`. الأهم:
- `DATABASE_URL` — مسار SQLite.
- `AUTH_SECRET` — سر JWT (≥32 بايت).
- `NEXT_PUBLIC_SITE_URL` — رابط الموقع.
- `SMTP_*` + `MAIL_FROM` — البريد (اختياري).
- `WHATSAPP_ENABLED/TOKEN/PHONE_ID` — واتساب (اختياري).
- `ADMIN_*` — للمدير الأول (init-production).

## 5. أوامر الصيانة اليومية

```bash
docker compose logs -f app --tail=100   # السجلات
docker compose restart app               # إعادة تشغيل
docker compose up -d --build            # تحديث
docker compose exec app sh scripts/backup.sh  # نسخة احتياطية
docker compose run --rm app npx tsx scripts/init-production.ts  # مدير أول (مرة)
docker compose run --rm app npx tsx scripts/reset-demo-data.ts   # حذف demo
```

## 6. مشاكل شائعة

- **P2021 (جدول غير موجود)**: `docker compose run --rm app npx prisma migrate deploy`.
- **AUTH_SECRET ضعيف**: ولّد بـ `sh scripts/generate-secret.sh`.
- **البريد لا يُرسل**: تحقق SMTP_*، وفعّل تفضيلات الإشعارات.
- **النسخة الاحتياطية فارغة**: استخدم `VACUUM` (السكربت يفعل).
- **403 على النسخة الاحتياطية**: سجّل كمدير.

## 7. الانتقال من SQLite إلى PostgreSQL

1. غيّر `provider = "postgresql"` في `prisma/schema.prisma`.
2. `DATABASE_URL="postgresql://..."`.
3. `npx prisma migrate deploy`.
4. صدّر بيانات SQLite (`sqlite3 dev.db .dump`) وأدخلها في PostgreSQL.
5. حدّث `src/app/admin/settings/backup/route.ts` (استخدم pg_dump).
6. أعد البناء والنشر.

## 8. معلومات الدعم

- الإصدار: v0.0.1.3.
- phone المدرسة: +9613457481.
- البريد: quraanschool11@gmail.com.
- days الدوام: السبت 10:00-11:00.
- العملة: $ (1$ = 90,000 ل.ل).
