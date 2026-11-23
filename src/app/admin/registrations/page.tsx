import type { Metadata } from "next";
import Link from "next/link";

import { RegistrationStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveRegistrationRequest, rejectRegistrationRequest } from "@/lib/actions/registration";

export const metadata: Metadata = {
  title: "طلبات التسجيل",
};

export const instant = false;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

const FLASH_MESSAGES: Record<string, string> = {
  approved: "تم قبول الطلب وإنشاء الحسابات.",
  rejected: "تم رفض الطلب.",
  error: "تعذّر تنفيذ العملية. يرجى المحاولة مرة أخرى.",
};

type Props = {
  searchParams: Promise<{ status?: string; flash?: string; tempPassword?: string }>;
};

export default async function AdminRegistrationsPage({ searchParams }: Props) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const status = params.status?.trim() ?? "";
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;
  const tempPassword = params.tempPassword;

  const where = status ? { status: status as RegistrationStatus } : {};

  const requests = await prisma.registrationRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950 dark:text-brand-50">
            طلبات التسجيل
          </h1>
          <p className="mt-1 text-sm text-brand-700 dark:text-brand-200">
            مراجعة طلبات التسجيل وإنشاء حسابات للطالب وولي الأمر.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← لوحة الإدارة
        </Link>
      </div>

      {flash ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {flash}
          {tempPassword ? (
            <p className="mt-2 font-mono text-xs" dir="ltr">
              كلمة المرور المؤقتة: {tempPassword}
            </p>
          ) : null}
        </div>
      ) : null}

      <form method="get" className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 dark:border-brand-200/20 dark:bg-brand-900 dark:text-brand-50"
        >
          <option value="">جميع الحالات</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          فلترة
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] dark:border-brand-200/20 dark:bg-brand-900">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700 dark:bg-brand-800 dark:text-brand-200">
            <tr>
              <th className="px-4 py-3">الطالب</th>
              <th className="px-4 py-3">ولي الأمر</th>
              <th className="px-4 py-3">الهاتف</th>
              <th className="px-4 py-3">البريد</th>
              <th className="px-4 py-3">المرحلة</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-brand-600 dark:text-brand-300">
                  لا توجد طلبات مطابقة.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-bold text-brand-950 dark:text-brand-50">{req.studentName}</p>
                    {req.currentMemorization ? (
                      <p className="text-xs text-brand-600 dark:text-brand-300">
                        يحفظ: {req.currentMemorization}
                      </p>
                    ) : null}
                    {req.notes ? (
                      <p className="text-xs text-brand-600 dark:text-brand-300">{req.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-brand-700 dark:text-brand-200">{req.parentName}</td>
                  <td className="px-4 py-3 text-brand-700 dark:text-brand-200" dir="ltr">
                    {req.phone}
                  </td>
                  <td className="px-4 py-3 text-brand-700 dark:text-brand-200" dir="ltr">
                    {req.email}
                  </td>
                  <td className="px-4 py-3 text-brand-700 dark:text-brand-200">{req.stage}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[req.status]}`}
                    >
                      {STATUS_LABELS[req.status]}
                    </span>
                    {req.adminNote ? (
                      <p className="mt-1 text-xs text-brand-600 dark:text-brand-300">
                        {req.adminNote}
                      </p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-700 dark:text-brand-200">
                    {new Intl.DateTimeFormat("ar-EG", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "UTC",
                    }).format(req.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {req.status === "PENDING" ? (
                      <div className="flex flex-col gap-2">
                        <form action={approveRegistrationRequest}>
                          <input type="hidden" name="id" value={req.id} />
                          <input
                            type="text"
                            name="adminNote"
                            placeholder="ملاحظة (اختياري)"
                            className="mb-2 w-full rounded-lg border border-brand-900/15 px-2 py-1 text-xs dark:border-brand-200/20 dark:bg-brand-800 dark:text-brand-50"
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300"
                          >
                            قبول
                          </button>
                        </form>
                        <form action={rejectRegistrationRequest}>
                          <input type="hidden" name="id" value={req.id} />
                          <input
                            type="text"
                            name="adminNote"
                            placeholder="سبب الرفض"
                            className="mb-2 w-full rounded-lg border border-brand-900/15 px-2 py-1 text-xs dark:border-brand-200/20 dark:bg-brand-800 dark:text-brand-50"
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-300"
                          >
                            رفض
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-brand-500">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
