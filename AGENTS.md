# AGENTS.md

دليل مختصر للمطوّرين والوكلاء العاملين على مشروع **مدرسة القرآن الكريم**.

## نظرة عامة

موقع تعريفي لمدرسة قرآنية، مبني بواجهة عربية كاملة من اليمين إلى اليسار (RTL).
يشمل المشروع حاليًا الهيكل الأساسي، وقاعدة بيانات Prisma، ونظام مصادقة بجلسات
JWT محفوظة في كوكي `httpOnly`، مع صفحات عامة متجاوبة (جوال أولاً) ولوحات تحكم
مبدئية لكل دور.

## التقنيات

- **Next.js 16** (App Router) مع **TypeScript**
- **Tailwind CSS 4**
- **Prisma 6** مع قاعدة بيانات **SQLite**
- **jose** لتوقيع والتحقق من JWT، و**bcryptjs** لتجزئة كلمات المرور
- **Proxy** (المكافئ الجديد لـ Middleware في Next.js 16) لحماية المسارات
- خط **Cairo** عبر `next/font/google`

## بنية المشروع

```text
quran-school/
├─ prisma/
│  ├─ schema.prisma          # مخطط قاعدة البيانات (SQLite)
│  ├─ seed.ts                # بيانات تجريبية (مستخدمون، حلقات، حضور، تسميع...)
│  └─ migrations/            # ملفات الترحيل (migrations)
├─ public/                   # الملفات العامة
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # التخطيط الجذري: RTL، الخط، البيانات الوصفية، الهيدر والتذييل
│  │  ├─ page.tsx            # الصفحة الرئيسية (إحصائيات وإعلانات حيّة)
│  │  ├─ account/page.tsx     # حساب المستخدم (ملف شخصي + كلمة المرور)
│  │  ├─ programs/page.tsx   # البرامج (بطاقات)
│  │  ├─ contact/page.tsx    # معلومات التواصل ونموذج التواصل
│  │  ├─ login/page.tsx      # صفحة تسجيل الدخول العربية
│  │  ├─ admin/
│  │  │  ├─ layout.tsx       # تخطيط لوحة الإدارة (قائمة جانبية)
│  │  │  ├─ page.tsx         # إحصائيات سريعة
│  │  │  ├─ students/page.tsx # جدول الطلاب (بحث/فلترة)
│  │  │  ├─ students/new/page.tsx
│  │  │  ├─ students/[id]/edit/page.tsx
│  │  │  ├─ teachers/page.tsx # جدول المعلمين
│  │  │  ├─ teachers/new/page.tsx
│  │  │  ├─ teachers/[id]/edit/page.tsx
│  │  │  ├─ halaqas/page.tsx # قائمة الحلقات + جدول أسبوعي
│  │  │  ├─ halaqas/new/page.tsx
│  │  │  ├─ halaqas/[id]/page.tsx # تفاصيل + طلاب + اختبارات
│  │  │  ├─ halaqas/[id]/exams/new/page.tsx # إنشاء اختبار وإدخال درجات
│  │  │  ├─ halaqas/[id]/edit/page.tsx
│  │  │  ├─ attendance/page.tsx # تقرير الحضور الشهري + تصدير CSV
│  │  │  ├─ reports/page.tsx # التقارير الموحّدة (حضور/حفظ/رسوم/معلمون)
│  │  │  ├─ reports/export/route.ts # تصدير CSV لكل تقرير
│  │  │  ├─ reports/students/[studentId]/page.tsx # تقرير شخصي قابل للطباعة
│  │  │  ├─ announcements/ # إدارة الإعلانات (قائمة/إضافة/تعديل)
│  │  │  └─ messages/page.tsx # رسائل التواصل
│  │  │  ├─ users/page.tsx   # المستخدمون وإعادة تعيين كلمة المرور
│  │  │  ├─ fees/page.tsx    # الرسوم (خطط/فواتير/دفعات/متأخرات)
│  │  │  ├─ fees/plans/new/page.tsx
│  │  │  ├─ fees/plans/[id]/edit/page.tsx
│  │  │  ├─ fees/invoices/[id]/page.tsx
│  │  │  └─ fees/receipts/[id]/page.tsx
│  │  │  ├─ settings/page.tsx # إعدادات المدرسة (اسم/هاتف/عنوان/دوام/عن المدرسة)
│  │  │  ├─ settings/backup/route.ts # تحميل ملف SQLite (نسخة احتياطية)
│  │  │  ├─ audit-log/page.tsx # سجل التدقيق (بحث/فلترة/صفحات)
│  │  │  └─ certificates/page.tsx # إصدار الشهادات وعرضها
│  │  ├─ teacher/
│  │  │  ├─ layout.tsx       # تخطيط لوحة المعلم (زر خروج)
│  │  │  ├─ page.tsx         # قائمة حلقات المعلم
│  │  │  ├─ certificates/page.tsx # إصدار شهادات لطلاب حلقاته
│  │  │  └─ halaqas/[id]/
│  │  │     ├─ page.tsx      # تفاصيل الحلقة وطلابها واختباراتها
│  │  │     ├─ attendance/page.tsx # تسجيل الحضور اليومي
│  │  │     ├─ exams/new/page.tsx # إنشاء اختبار وإدخال درجات
│  │  │     └─ students/[studentId]/
│  │  │        ├─ recitation/page.tsx # تسجيل التسميع
│  │  │        └─ goal/page.tsx # خطة الحفظ والشارات التحفيزية
│  │  ├─ student/page.tsx    # لوحة الطالب
│  │  ├─ parent/page.tsx     # لوحة ولي الأمر
│  │  ├─ messages/page.tsx   # صندوق الوارد الداخلي (كل الأدوار)
│  │  ├─ messages/[id]/page.tsx # محادثة داخلية مع تحديث تلقائي
│  │  ├─ notifications/page.tsx # مركز الإشعارات
│  │  ├─ certificates/[id]/page.tsx # عرض/طباعة شهادة
│  │  ├─ verify/[serial]/page.tsx # التحقق العام من شهادة
│  │  ├─ not-found.tsx       # صفحة 404 عربية
│  │  ├─ globals.css         # Tailwind وإعدادات الألوان والخط
│  │  └─ icon.svg            # أيقونة الموقع
│  ├─ components/
│  │  ├─ school-settings-form.tsx # نموذج إعدادات المدرسة (Client)
│  │  ├─ site-header.tsx     # الترويسة (شريط تنقل متجاوب)
│  │  ├─ site-footer.tsx     # التذييل (يعرض APP_VERSION)
│  │  ├─ login-form.tsx      # نموذج تسجيل الدخول (Client Component)
│  │  ├─ role-dashboard.tsx  # قالب لوحات التحكم مع زر الخروج
│  │  ├─ program-card.tsx    # بطاقة برنامج
│  │  ├─ contact-form.tsx    # نموذج التواصل (Client Component)
│  │  ├─ admin-sidebar.tsx   # قائمة جانبية للإدارة (Client Component)
│  │  ├─ delete-button.tsx   # زر حذف مع تأكيد
│  │  ├─ student-form.tsx    # نموذج الطالب (إضافة/تعديل)
│  │  ├─ teacher-form.tsx    # نموذج المعلم (إضافة/تعديل)
│  │  ├─ halaqa-form.tsx     # نموذج الحلقة (إضافة/تعديل)
│  │  ├─ add-student-to-halaqa-form.tsx # إضافة طالب إلى حلقة
│  │  ├─ attendance-form.tsx # تسجيل الحضور اليومي
│  │  ├─ recitation-form.tsx # تسجيل التسميع
│  │  ├─ exam-form.tsx       # إنشاء اختبار وإدخال الدرجات
│  │  ├─ halaqa-exams.tsx    # عرض الاختبارات والمتوسط/الأعلى/الأقل
│  │  ├─ announcement-form.tsx # إضافة/تعديل الإعلانات
│  │  ├─ certificate-form.tsx # إصدار شهادة لطالب
│  │  ├─ auto-refresh.tsx   # تحديث تلقائي كل 15 ثانية (polling)
│  │  ├─ new-conversation-form.tsx # بدء محادثة داخلية
│  │  ├─ notification-bell.tsx # جرس الإشعارات مع العدّاد والقائمة المنسدلة
│  │  ├─ goal-form.tsx       # إضافة خطة حفظ لطالب
│  │  ├─ student-goals.tsx   # عرض أهداف الحفظ مع شريط التقدم والوتيرة
│  │  ├─ student-badges.tsx  # الشارات التحفيزية المحسوبة تلقائيًا
│  │  ├─ reports/report-charts.tsx # رسوم recharts لتقارير الإدارة
│  │  ├─ reports/print-section-button.tsx # طباعة قسم تقرير واحد فقط
│  │  ├─ progress-dashboard.tsx # لوحة تقدم الطالب/ولي الأمر
│  │  ├─ grade-chart.tsx     # رسم بياني لتقدم التقديرات (recharts)
│  │  └─ logout-button.tsx   # زر تسجيل الخروج
│  ├─ config/
│  │  └─ school.ts           # إعدادات المدرسة
│  ├─ data/
│  │  └─ surahs.ts           # قائمة 114 سورة (رقم، اسم، آيات، نوع نزول)
│  ├─ lib/
│  │  ├─ prisma.ts           # نسخة PrismaClient مفردة
│  │  ├─ password.ts         # تجزئة كلمات المرور والتحقق منها بـ bcrypt
│  │  ├─ session.ts          # أنواع الأدوار وتوقيع/التحقق من JWT (آمن للـ proxy)
│  │  ├─ auth.ts             # قراءة الجلسة وإدارة الكوكي وrequireRole
│  │  ├─ actions/auth.ts     # Server Actions لتسجيل الدخول والخروج
│  │  ├─ actions/contact.ts  # Server Action لحفظ رسائل التواصل
│  │  ├─ actions/admin.ts    # Server Actions لإدارة الطلاب والمعلمين والحلقات
│  │  ├─ actions/teacher.ts  # Server Actions للحضور والتسميع
│  │  ├─ actions/exams.ts    # Server Actions لإنشاء الاختبارات والدرجات
│  │  ├─ actions/announcements.ts # إدارة الإعلانات
│  │  ├─ actions/messages.ts # رسائل التواصل (مقروءة/حذف)
│  │  ├─ actions/internal-messages.ts # المحادثات الداخلية وإرسال الرسائل
│  │  ├─ actions/notifications.ts # فتح الإشعار وتعليم الكل كمقروء
│  │  ├─ actions/memorization.ts # إنشاء/إلغاء أهداف الحفظ
│  │  ├─ memorization.ts    # حساب التقدم والوتيرة والمتأخرين والشارات
│  │  ├─ reports.ts          # تجميع تقارير الحضور والحفظ والرسوم وأداء المعلمين
│  │  ├─ audit.ts            # logAudit() + تسميات/أصناف سجل التدقيق (server-only)
│  │  ├─ student-status.ts   # حالات الطالب وتصنيفاتها (مشتركة)
│  │  ├─ notify.ts          # الدالة المركزية notify()/notifyMany() وملخص الإشعارات
│  │  ├─ notification-types.ts # نوع الإشعار المشترك (آمن للعميل)
│  │  ├─ messaging.ts       # صلاحيات المراسلة وقائمة المستلمين وعدّاد غير المقروء
│  │  ├─ messaging-types.ts # أنواع مشتركة للرسائل (آمنة للعميل)
│  │  ├─ validations/internal-message.ts # مخطط Zod لنص الرسالة
│  │  ├─ validations/admin.ts # مخططات Zod
│  │  ├─ validations/teacher.ts # مخططات Zod للحضور والتسميع
│  │  ├─ validations/exam.ts # مخطط Zod للاختبارات
│  │  ├─ validations/memorization.ts # مخطط Zod لخطط الحفظ
│  │  ├─ validations/announcement.ts # مخطط Zod للإعلانات
│  │  ├─ csv.ts              # بناء CSV بترميز UTF-8 مع BOM
│  │  ├─ attendance-report.ts # تجميع تقرير الحضور الشهري
│  │  └─ version.ts          # APP_VERSION = "v0.0.1.3"
│  └─ proxy.ts               # حماية المسارات حسب الدور (Middleware)
├─ .env                      # DATABASE_URL (محلي، غير مُتتبَّع)
├─ .env.example              # نموذج متغيرات البيئة
├─ AGENTS.md
└─ CHANGELOG.md
```

## الأوامر

| الأمر | الوصف |
| --- | --- |
| `npm run dev` | تشغيل خادم التطوير على `http://localhost:3000` |
| `npm run build` | بناء المشروع للإنتاج |
| `npm run start` | تشغيل نسخة الإنتاج بعد البناء |
| `npm run lint` | تشغيل ESLint |
| `npm run db:generate` | توليد Prisma Client |
| `npm run db:push` | مزامنة مخطط Prisma مع قاعدة SQLite (بدون migration) |
| `npm run db:migrate` | إنشاء وتطبيق migration جديد |
| `npm run db:seed` | تشغيل البيانات التجريبية |
| `npm run db:studio` | فتح Prisma Studio |

## نماذج قاعدة البيانات

- `User`: المستخدمون بأدوار `ADMIN` و`TEACHER` و`STUDENT` و`PARENT`.
- `Student`: ملف الطالب المرتبط بـ `User`، مع `parentId` اختياري.
- `Halaqa` و`Enrollment`: الحلقات وتسجيل الطلاب فيها (علاقة متعدد لمتعدد عبر جدول وسيط).
- `Attendance`: حضور الطالب في الحلقة بحالات `PRESENT` و`ABSENT` و`LATE` و`EXCUSED`.
- `RecitationRecord`: سجلات التسميع بأنواع `HIFZ` و`MURAJAA` و`TILAWA`، وتُقبل الدرجة من 1 إلى 10 في طبقة التطبيق.
- `Exam` و`ExamResult`: الاختبارات ونتائج الطلاب.
- `Announcement`: الإعلانات مع جمهور مستهدف (`ALL` أو `TEACHERS` أو `STUDENTS` أو `PARENTS`).
- `ContactMessage`: رسائل نموذج التواصل (الاسم، البريد، الهاتف، الموضوع، الرسالة، حالة القراءة).
- `Setting`: إعدادات عامة على شكل مفتاح/قيمة.
- `FeePlan` و`Invoice` و`Payment`: خطط الرسوم وفواتير الطلاب والدفعات المسجّلة.
- `Certificate`: شهادات الطلاب مع نوعها ورقمها التسلسلي الفريد ومن أصدرها.
- `Conversation` و`Message`: المحادثات الداخلية ورسائلها مع `readAt` لتتبع القراءة.
- `Notification`: إشعارات المستخدم (العنوان، النص، الرابط، `readAt`، التاريخ).
- `MemorizationGoal`: خطة حفظ لطالب (نطاق السور والآيات، تاريخ البدء والهدف،
  الحالة `ACTIVE`/`COMPLETED`/`CANCELLED`).
- `StudentStatus`: enum `ACTIVE`/`GRADUATED`/`WITHDRAWN`/`ARCHIVED` (soft delete
  بدلاً من الحذف النهائي). حقل `Student.status` (افتراضي `ACTIVE`).
- `AuditLog`: سجل التدقيق (`userId`, `action`, `entity`, `entityId`, `details`,
  `createdAt`)، يُسجَّل فيه الدخول والإنشاء/التعديل/الحذف/الأرشفة/الاستعادة.
- حقول أمان الحساب في `User`: `mustChangePassword` و`failedLoginAttempts` و`lockedUntil`.

## البيانات التجريبية

يُنشئ `npm run db:seed`:

- مديرًا واحدًا، و3 معلمين، و3 أولياء أمور، و10 طلاب بأسماء عربية.
- 3 حلقات وتسجيل الطلاب فيها.
- 30 سجل حضور، و10 سجلات تسميع، و3 اختبارات مع نتائجها، و3 إعلانات.

كلمة المرور التجريبية لجميع الحسابات: `Quran@1234`.
بريد المدير: `admin@quran-school.test`، وبريد المعلمين: `teacher1@quran-school.test` … `teacher3@quran-school.test`.

## المصادقة وحماية المسارات

- تسجيل الدخول من `/login` باستخدام البريد الإلكتروني أو رقم الهاتف وكلمة المرور.
- تُقارن كلمة المرور بتجزئة bcrypt، ثم تُنشأ جلسة JWT موقّعة بـ `AUTH_SECRET`
  وتُحفظ في كوكي `quran_session` بخيارات: `httpOnly` و`SameSite=Lax`
  و`Secure` في الإنتاج، ومدة صلاحية 7 أيام.
- `src/proxy.ts` يحمي المسارات التالية ويحوّل غير المسجّلين إلى `/login`:

  | المسار | الدور المسموح |
  | --- | --- |
  | `/admin` | `ADMIN` |
  | `/teacher` | `TEACHER` |
  | `/student` | `STUDENT` |
  | `/parent` | `PARENT` |
  | `/messages` | أي مستخدم مسجّل |
  | `/notifications` | أي مستخدم مسجّل |
  | `/account` | أي مستخدم مسجّل |

- بعد الدخول يُوجَّه المستخدم تلقائيًا إلى لوحة دوره. إذا حاول فتح لوحة دور آخر
  يُعاد توجيهه إلى لوحته، والمستخدم المسجّل الذي يفتح `/login` يُعاد إلى لوحته.
- الصفحات المحمية تستدعي `requireRole()` كتحقق إضافي في طبقة الخادم.
- تسجيل الخروج متاح من كل لوحة، ويمسح الكوكي ثم يعيد التوجيه إلى `/login`.
- تُستخدم رسائل خطأ عربية عامة عند فشل الدخول دون كشف ما إذا كان الحساب موجودًا.
- ملفات الصفحات المحمية تحتوي `export const instant = false` لأنها تُعرض عند الطلب
  (تعتمد على الكوكي) ولا يمكن توليدها مسبقًا.

## الصفحات العامة

- `/` الصفحة الرئيسية: هيرو، إحصائيات حيّة (طلاب/حلقات/معلمين)، برامج، وآخر الإعلانات من قاعدة البيانات.
- `/about` عن المدرسة (نص تعريفي مؤقت قابل للتعديل).
- `/programs` البرامج (حفظ، تجويد، مراجعة، تلاوة) كبطاقات.
- `/contact` معلومات التواصل ونموذج يحفظ الرسائل في `ContactMessage`.
- `/login` تسجيل الدخول (موجود).

## إدارة المدرسة (لوحة /admin)

- لوحة `/admin` بإحصائيات سريعة (طلاب، معلمين، أولياء أمور، حلقات، رسائل، إعلانات).
- `/admin/students`: جدول مع بحث وفلترة (مرحلة/حلقة)، إضافة وتعديل وحذف، وربط الطالب بولي أمر.
- `/admin/teachers`: جدول مع بحث، إضافة وتعديل وحذف، مع منع حذف معلم مرتبط بحلقات أو سجلات تسميع.
- `/admin/halaqas`: قائمة الحلقات (بحث)، إضافة وتعديل وحذف، وصفحة تفاصيل (طلاب، إضافة/إزالة، منع تجاوز الحد الأقصى)، وجدول أسبوعي.
- التحقق من المدخلات باستخدام **Zod** ورسائل عربية، مع تأكيد قبل الحذف.
- Server Actions في `src/lib/actions/admin.ts`، مع `revalidatePath` وflash messages.
- `/admin/halaqas/[id]/exams/new`: إنشاء اختبار للحلقة وإدخال درجات الطلاب (0-100)، مع عرض المتوسط وأعلى وأقل درجة في صفحة الحلقة.
- `/admin/announcements`: إدارة الإعلانات (إضافة/تعديل/حذف) مع جمهور: `ALL` أو `TEACHERS` أو `STUDENTS` أو `PARENTS`.
- `/admin/messages`: عرض رسائل `/contact` مع فلترة (الكل/غير مقروءة/مقروءة)، تعليم رسالة/الكل كمقروء، تعليم كغير مقروء، وحذف.
- `/admin/attendance`: تقرير حضور شهري (اختيار الشهر والحلقة) بملخص لكل طالب ونسبة حضور.
- تصدير CSV: `/admin/students/export` و`/admin/attendance/export` بترميز UTF-8 مع BOM (يدعم العربية في Excel).

## الحذف (Soft Delete) والتدقيق والنسخ الاحتياطي

- **حالة الطالب**: `ACTIVE | GRADUATED | WITHDRAWN | ARCHIVED` بدلاً من الحذف
  النهائي. `deleteStudent` أُزيل واستُبدل بـ `archiveStudent` (يُعيّن
  `status = ARCHIVED`) و`restoreStudent` (يعيده إلى `ACTIVE`).
- جدول `/admin/students` يعرض شارة الحالة، وفلتر «الحالة»، وأزرار
  «أرشفة»/«استعادة». لوحات الإحصاءات والقوائم (الحلقات/الرسوم/الشهادات)
  تستبعد `ARCHIVED` من الاختيارات (مع بقاء السجلات التاريخية).
- **سجل التدقيق**: `AuditLog` + `src/lib/audit.ts` (`logAudit()`). يُسجَّل:
  الدخول، وإنشاء/تعديل/حذف/أرشفة/استعادة للطلاب والحلقات، وخطط/فواتير/
  دفعات الرسوم، وإصدار الشهادات. صفحة `/admin/audit-log` (مدير فقط) مع بحث
  (`q`) وفلترة (إجراء/كيان/تاريخ) وتقسيم صفحات (25/صفحة).
- **نسخة احتياطية**: `/admin/settings/backup` (GET) يحمّل ملف SQLite
  `quran-school-backup-YYYY-MM-DD.db` (مدير فقط). طريقة الاستعادة موثّقة في
  `README.md`.
- `APP_VERSION` = `v0.0.1.3`.

## الاختبارات

- متاحة للمدير وللمعلم من صفحة تفاصيل الحلقة → «إنشاء اختبار».
- الحقول: عنوان الاختبار، التاريخ، درجة كل طالب (اختيارية؛ تُترك فارغة عند الغياب).
- التحقق من ملكية المعلم للحلقة (`teacherId`) ومن أن الطالب مسجل في الحلقة.
- Server Action: `createExam` في `src/lib/actions/exams.ts`.
- الإحصاءات (المتوسط/الأعلى/الأقل) تُحسب في `src/components/halaqa-exams.tsx`.

## التقارير (/admin/reports)

- صفحة موحّدة `/admin/reports` لكل التقارير، مع فلترة بـ `from` و`to` (شاملين)
  و`halaqa` اختيارية.
- `src/lib/reports.ts` يجمع البيانات:
  - الحضور: نسب لكل حلقة وطالب، والأكثر غيابًا (نسبة = حاضر + متأخر).
  - الحفظ: سجلات `HIFZ` خلال الفترة، الآيات الفريدة بعد دمج النطاقات، متوسط
    التقدير، وعدد الأهداف النشطة لكل حلقة.
  - الرسوم: المحصّل من الدفعات خلال الفترة، والمستحق/المتبقي/المتأخرات للفواتير
    المستحقة خلال الفترة، مع تفصيل لكل خطة.
  - المعلمون: الجلسات المسجلة = تواريخ حضور فريدة لكل حلقة، سجلات التسميع،
    متوسط التقديرات، والاختبارات.
- رسوم بيانية بـ **recharts** عبر مكوّنات العميل في
  `src/components/reports/report-charts.tsx`.
- تصدير CSV من `/admin/reports/export?type=attendance|memorization|fees|teachers`
  بترميز UTF-8 مع BOM عبر `buildCsv()`.
- طباعة قسم واحد فقط عبر `PrintSectionButton` الذي يخفي بقية الأقسام أثناء
  الطباعة، مع أنماط `@media print` في `globals.css` لإخفاء الهيدر/الفوتر/القائمة.
- تقرير شخصي لكل طالب على `/admin/reports/students/[studentId]` (حضور + تسميع +
  اختبارات + خطة الحفظ + الشارات) قابل للطباعة، ويُفتح من جدول تقرير الحضور.

## لوحة المعلم (/teacher)

- `/teacher`: قائمة حلقات المعلم فقط (حسب `teacherId`).
- `/teacher/halaqas/[id]`: تفاصيل الحلقة وقائمة طلابها.
- `/teacher/halaqas/[id]/attendance`: تسجيل الحضور اليومي (حاضر/غائب/متأخر/بعذر) دفعة واحدة.
- `/teacher/halaqas/[id]/students/[studentId]/recitation`: تسجيل التسميع (نوع، سورة، من/إلى آية مع التحقق من عدد آيات السورة، تقدير 1-10، ملاحظات).
- `/teacher/halaqas/[id]/students/[studentId]/goal`: إضافة خطة حفظ للطالب (نطاق سورة/آية وتواريخ) وعرض تقدمه وشاراته وإلغاء الهدف.
- `/teacher`: عدّاد وقائمة «طلاب متأخرون عن أهدافهم» مع رابط خطة كل طالب.
- `/teacher/halaqas/[id]/exams/new`: إنشاء اختبار للحلقة وإدخال درجات طلابها.
- المعلم يرى حلقاته وطلابه فقط (تحقق من `teacherId`).
- `src/data/surahs.ts`: 114 سورة (رقم، اسم، عدد آيات، مكية/مدنية) دون نص القرآن.

## لوحات الطلاب وأولياء الأمور (/student, /parent)

- `/student`: ملخص التقدم (آيات محفوظة تقريبية، نسبة الحفظ، نسبة الحضور)، خطة الحفظ وشريط تقدمها، الشارات التحفيزية، رسم بياني (recharts) لتقدم التقديرات، تقويم حضور شهري ملوّن، آخر 10 تسميعات، نتائج الاختبارات، الإعلانات الموجهة.
- `/parent`: same for a selected child; ولي الأمر يرى أبناءه فقط (selector when multiple).
- المكون `ProgressDashboard` (server component) + `GradeChart` (client component using recharts).
- `TOTAL_QURAN_AYAHS = 6236` for progress percentage.

## الرسائل الداخلية (/messages)

- صندوق وارد موحّد لكل الأدوار: قائمة المحادثات، آخر رسالة، وعدد غير المقروء،
  ونموذج بدء محادثة جديدة.
- `/messages/[id]`: عرض المحادثة وإرسال رسالة، مع تعليم رسائل الطرف الآخر كمقروءة
  عند الفتح وعرض حالة القراءة.
- الصلاحيات على الخادم في `src/lib/messaging.ts`: المدير يراسل الجميع، والمعلم
  يراسل طلاب حلقاته وأولياء أمورهم والإدارة، وولي الأمر يراسل معلمي أبنائه
  والإدارة، والطالب يراسل معلميه ووليّ أمره والإدارة. تُعاد جميع عمليات الإرسال
  إلى `canMessage()` قبل الحفظ.
- تحديث تلقائي كل 15 ثانية (polling) عبر `AutoRefresh` الذي يستدعي `router.refresh()`
  دون WebSocket.
- رسالة فارغة أو أطول من 1000 حرف مرفوضة في الواجهة والخادم (`Zod`).
- عدّاد غير المقروء يظهر في قائمة الإدارة الجانبية وفي ترويسة الموقع.
- تمييز بين رسائل التواصل العامة (`/admin/messages` + `ContactMessage`) والرسائل
  الداخلية بين المستخدمين (`Conversation` + `Message`).

## مركز الإشعارات (/notifications)

- نموذج `Notification` مرتبط بالمستخدم، ويحفظ العنوان والنص والرابط و`readAt`
  وتاريخ الإنشاء.
- جرس في ترويسة الموقع (`NotificationBell`) يعرض عدّاد غير المقروء وقائمة منسدلة
  بأحدث 8 إشعارات، مع رابط لصفحة `/notifications` الكاملة.
- صفحة `/notifications` لكل الأدوار المسجّلة، مع زر «تعليم الكل كمقروء»
  وتعليم الإشعار كمقروء عند فتحه أو الضغط على زر مستقل.
- الدالة المركزية `notify(userId, payload)` و`notifyMany()` في `src/lib/notify.ts`؛
  تُستدعى من جميع الأحداث، وأي قناة مستقبلية (واتساب/بريد) تُضاف داخل `deliver()`
  فقط دون تعديل بقية الكود.
- الإشعارات التلقائية:
  - إعلان جديد حسب الجمهور (`ALL`/`TEACHERS`/`STUDENTS`/`PARENTS`).
  - غياب طالب جديد → ولي الأمر.
  - نتيجة اختبار جديدة → الطالب وولي الأمر.
  - شهادة جديدة → الطالب وولي الأمر.
  - رسالة داخلية جديدة → المستلم.
  - فاتورة مستحقة عند إنشائها → ولي الأمر (أو الطالب عند عدم وجود ولي أمر).
- يُبتلع خطأ إنشاء الإشعار بعد تسجيله في الخادم حتى لا يُفشل العملية الأصلية.

## خطط الحفظ والشارات

- نموذج `MemorizationGoal` لكل طالب، يحدده المعلم من
  `/teacher/halaqas/[id]/students/[studentId]/goal` (رابط «خطة الحفظ» في جدول
  طلاب الحلقة). يمكن للمعلم إلغاء الهدف، وتُسجَّل الحالة في قاعدة البيانات.
- تُحوَّل (السورة، الآية) إلى ترتيب مطلق على مستوى المصحف عبر
  `src/data/surahs.ts`، ثم تُدمج نطاقات `RecitationRecord` من نوع `HIFZ` فقط
  لحساب الآيات الفريدة المنجزة داخل نطاق الهدف.
- النسبة المتوقعة تُحسب من المدة المنقضية بين تاريخ البدء وتاريخ الهدف.
  الوتيرة: **متقدم** عند تجاوز المتوقع بـ10 نقاط أو أكثر، **متأخر** عند
  التأخر بـ10 نقاط أو أكثر، **على المسار** بين ذلك، و**مكتمل** عند 100%.
- تُعرض الخطة مع شريط التقدم والنسبة المتوقعة والأيام المتبقية في
  `ProgressDashboard` داخل `/student` و`/parent`.
- لوحة المعلم `/teacher` تعرض عدّادًا وقائمة بالطلاب المتأخرين عن أهدافهم
  (الأكثر تأخرًا لكل طالب) مع رابط مباشر لخطته.
- بعد حفظ تسميع جديد يُستدعى `syncGoalStatuses()` لتحويل الأهداف المكتملة إلى
  `COMPLETED` دون تعطيل عملية الحفظ عند الفشل.
- الشارات تُحسب تلقائيًا في `getStudentBadges()` من بيانات الطالب الفعلية:
  أول تسميع حفظ، 5 حصص حضور متتالية، 208 آية محفوظة فريدة أو شهادة إتمام جزء،
  ختم القرآن أو شهادة ختم القرآن. لا توجد تصنيفات أو مقارنات تنافسية بين الطلاب.
- عند إضافة هدف جديد يُشعر الطالب وولي الأمر عبر `notify()`.

## إعداد البيئة

1. `npm install`
2. انسخ `.env.example` إلى `.env` (موجود افتراضيًا للمشروع المحلي).
3. ولّد مفتاحًا لـ `AUTH_SECRET` وضعه في `.env`:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
4. `npm run db:generate` لتوليد Prisma Client.
5. `npm run db:migrate` لإنشاء قاعدة البيانات وتطبيق الـ migrations.
6. `npm run db:seed` لإدخال البيانات التجريبية.
7. `npm run dev`.

رابط SQLite الافتراضي: `file:./dev.db` (ينشأ داخل مجلد `prisma/`).

## إرشادات التطوير

- حافظ على `lang="ar"` و`dir="rtl"` في `src/app/layout.tsx`.
- عنوان الموقع في جميع الصفحات: **«مدرسة القرآن الكريم»**. استخدم قالب العنوان
  المعرّف في `layout.tsx` لأي صفحة جديدة (`title` محلي دون تكرار اسم المدرسة).
- ألوان الهوية معرّفة في `globals.css` ضمن `@theme`: `brand` (أخضر داكن) و`gold` (ذهبي).
- استخدم مكوّنات خادم (Server Components) افتراضيًا، وأضف `"use client"` فقط عند الحاجة.
- أبقِ منطق الوصول إلى قاعدة البيانات في `src/lib/prisma.ts` ولا تنشئ نسخًا متعددة من العميل.
- لا تستورد `src/lib/auth.ts` أو `src/lib/prisma.ts` داخل `src/proxy.ts`؛ الـ proxy يستورد
  فقط من `src/lib/session.ts` (توقيع JWT والتحقق منه) ليبقى خفيفًا وآمنًا.
- أي صفحة محمية جديدة يجب أن تستخدم `requireRole()` وأن تضيف `export const instant = false`.
- لا تكشف `AUTH_SECRET` أو `passwordHash` في أي استجابة أو سجل، ولا تسجّل كلمات المرور.

## الإصدارات

- إصدار التطبيق الظاهر في الواجهة: `APP_VERSION` في `src/lib/version.ts` (**v0.0.1.3**).
- إصدار `package.json`: **0.0.1**.
- سجّل كل تغيير في `CHANGELOG.md`، وارفع رقم `APP_VERSION` عند إضافة تغييرات مرئية.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
