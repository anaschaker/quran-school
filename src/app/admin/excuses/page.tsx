import type { Metadata } from "next";

import { ExcuseStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewExcuse } from "@/lib/actions/excuses";

export const metadata: Metadata = {
  title: "أعذار الغياب",
};

export const instant = false;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "موافق",
  REJECTED: "مرفوض",
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

const FLASH_MESSAGES: Record<string, string> = {
  approved: "تمت الموافقة على العذر وتحويل الغياب إلى بعذر.",
  rejected: "تم رفض العذر.",
  error: "تعذّر تنفيذ العملية.",
};

export default async function AdminExcusesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; flash?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const status = params.status?.trim() ?? "";
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;

  const where = status ? { status: status as ExcuseStatus } : {};
  const excuses = await prisma.excuse.findMany({
    where,
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-950">أعذار الغياب</h1>
        <p className="mt-1 text-sm text-brand-700">مراجعة أعذار أولياء الأمور.</p>
      </div>

      {flash ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {flash}
        </div>
      ) : null}

      <form method="get" className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        >
          <option value="">جميع الحالات</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800">
          فلترة
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">الطالب</th>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">السبب</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {excuses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-600">
                  لا توجد أعذار مطابقة.
                </td>
              </tr>
            ) : (
              excuses.map((excuse) => (
                <tr key={excuse.id} className="align-top">
                  <td className="px-4 py-3 font-bold text-brand-950">
                    {excuse.student.user.name}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {excuse.date.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-brand-700">{excuse.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[excuse.status]}`}>
                      {STATUS_LABELS[excuse.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {excuse.status === "PENDING" ? (
                      <div className="flex flex-wrap gap-2">
                        <form action={reviewExcuse}>
                          <input type="hidden" name="id" value={excuse.id} />
                          <input type="hidden" name="decision" value="APPROVED" />
                          <button type="submit" className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50">
                            موافقة
                          </button>
                        </form>
                        <form action={reviewExcuse}>
                          <input type="hidden" name="id" value={excuse.id} />
                          <input type="hidden" name="decision" value="REJECTED" />
                          <button type="submit" className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50">
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
