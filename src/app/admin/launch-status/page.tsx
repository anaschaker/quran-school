import fs from "node:fs";
import path from "node:path";

import { requireRole } from "@/lib/auth";
import { getSchoolSettings, defaultSchoolSettings } from "@/lib/school-settings";
import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";

export const metadata = {
  title: "حالة الإطلاق",
};

export const instant = false;

type CheckStatus = "ok" | "warning" | "manual";

type LaunchCheck = {
  label: string;
  status: CheckStatus;
  detail: string;
};

const BACKUP_CANDIDATES = [
  process.env.BACKUP_DIR,
  path.join(process.cwd(), "backups"),
  "/backups",
].filter(Boolean) as string[];

function latestBackup(): { file: string; mtime: Date } | null {
  // على منصات serverless (Netlify) لا يوجد نظام ملفات محلي — تجاهل.
  if (process.env.NETLIFY || process.env.TURSO_DATABASE_URL) {
    return null;
  }
  let latest: { file: string; mtime: Date } | null = null;

  for (const dir of BACKUP_CANDIDATES) {
    try {
      if (!dir || !fs.existsSync(dir)) continue;
      for (const name of fs.readdirSync(dir)) {
        if (!/^quran-school-backup-\d{4}-\d{2}-\d{2}\.db$/.test(name)) continue;
        const fullPath = path.join(dir, name);
        const stat = fs.statSync(fullPath);
        if (!latest || stat.mtime > latest.mtime) {
          latest = { file: fullPath, mtime: stat.mtime };
        }
      }
    } catch {
      // تجاهل أخطاء نظام الملفات.
    }
  }

  return latest;
}

export default async function LaunchStatusPage() {
  await requireRole("ADMIN");

  const [settings, demoUsersCount] = await Promise.all([
    getSchoolSettings(),
    prisma.user.count({ where: { email: { endsWith: "@quran-school.test" } } }),
  ]);

  const schoolConfigured =
    settings.phone.trim() !== defaultSchoolSettings.phone.trim() ||
    settings.address.trim() !== defaultSchoolSettings.address.trim();

  const emailEnabled = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM,
  );

  const backup = latestBackup();
  const backupAgeHours = backup
    // eslint-disable-next-line react-hooks/purity
    ? (Date.now() - backup.mtime.getTime()) / (1000 * 60 * 60)
    : null;
  const backupFresh = backupAgeHours !== null && backupAgeHours <= 48;

  const checks: LaunchCheck[] = [
    {
      label: "بيانات المدرسة (الهاتف/العنوان) في /admin/settings",
      status: schoolConfigured ? "ok" : "warning",
      detail: schoolConfigured
        ? "تم تعديلها عن القيم الافتراضية."
        : "لا تزال القيم الافتراضية. افتح /admin/settings وحدّثها.",
    },
    {
      label: "قناة البريد (SMTP)",
      status: emailEnabled ? "ok" : "warning",
      detail: emailEnabled
        ? "متغيرات SMTP مضبوطة."
        : "SMTP_HOST/USER/PASS/MAIL_FROM غير مضبوطة. اختبر الإرسال بعد ضبطها.",
    },
    {
      label: "حسابات تجريبية (seed)",
      status: demoUsersCount === 0 ? "ok" : "warning",
      detail:
        demoUsersCount === 0
          ? "لا توجد حسابات تجريبية."
          : `${demoUsersCount} حساب/ات تجريبية متبقية. شغّل scripts/reset-demo-data.ts.`,
    },
    {
      label: "آخر نسخة احتياطية (≤ 48 ساعة)",
      status: backupFresh ? "ok" : "warning",
      detail: backup
        ? `${backup.file} — ${Math.round(backupAgeHours ?? 0)} ساعة مضت.`
        : "لا توجد نسخة احتياطية. شغّل scripts/backup.sh.",
    },
    {
      label: "HTTPS مفعّل على الدومين",
      status: "manual",
      detail: "تأكد من شهادة Let's Encrypt وعمل https:// على المتصفح.",
    },
    {
      label: "اختبار الموقع على جوال حقيقي",
      status: "manual",
      detail: "افتح الصفحات (الرئيسية، التسجيل، الدخول) على جوال وتحقق من RTL.",
    },
    {
      label: "سياسة الخصوصية والشروط مراجَعة",
      status: "manual",
      detail: "راجع /privacy و /terms مع إدارة المدرسة.",
    },
    {
      label: "رقم تواصل الدعم (للأولياء)",
      status: "manual",
      detail: "أضف رقم الدعم في /admin/settings или في صفحة التواصل.",
    },
  ];

  const allOk = checks.every((check) => check.status === "ok");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a
          href="/admin"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← الإدارة
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-brand-950">حالة الإطلاق</h1>
        <p className="mt-1 text-sm text-brand-700">
          فحص تلقائي لجاهزية المنصة للإطلاق (البيانات، البريد، النسخ الاحتياطي).
        </p>
      </div>

      <div
        className={`rounded-2xl border p-4 text-sm font-bold ${
          allOk
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        {allOk
          ? "✅ جميع الفحوصات التلقائية ناجحة."
          : "⚠️ توجد فحوصات تحتاج انتباهًا قبل الإطلاق."}
      </div>

      <ul className="space-y-3">
        {checks.map((check) => (
          <li
            key={check.label}
            className="flex items-start gap-3 rounded-2xl border border-brand-900/10 bg-white p-4"
          >
            <span className="mt-0.5 text-lg" aria-hidden="true">
              {check.status === "ok"
                ? "✅"
                : check.status === "warning"
                  ? "⚠️"
                  : "📝"}
            </span>
            <div>
              <p className="font-bold text-brand-950">{check.label}</p>
              <p className="mt-0.5 text-xs leading-6 text-brand-600">
                {check.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-brand-500">
        إصدار التطبيق: {APP_VERSION} — {new Date().toLocaleString("ar")}
      </p>
    </div>
  );
}
