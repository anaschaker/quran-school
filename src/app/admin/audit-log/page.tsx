import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/lib/auth";
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_CLASSES,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITIES,
  AUDIT_ENTITY_LABELS,
  isAuditAction,
  isAuditEntity,
} from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "سجل التدقيق",
};

export const instant = false;

const PAGE_SIZE = 25;

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

type AuditLogPageProps = {
  searchParams: Promise<{
    q?: string;
    action?: string;
    entity?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  await requireRole("ADMIN");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const action = isAuditAction(params.action) ? params.action : undefined;
  const entity = isAuditEntity(params.entity) ? params.entity : undefined;
  const from = params.from?.trim() ?? "";
  const to = params.to?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const fromDate = parseDate(from);
  const toDate = parseDate(to);

  const where = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate
              ? { lt: new Date(toDate.getTime() + 24 * 60 * 60 * 1000) }
              : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { details: { contains: q } },
            { entityId: { contains: q } },
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
          ],
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  function buildHref(nextPage: number): string {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (action) sp.set("action", action);
    if (entity) sp.set("entity", entity);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (nextPage > 1) sp.set("page", String(nextPage));
    const query = sp.toString();
    return query ? `/admin/audit-log?${query}` : "/admin/audit-log";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-950">سجل التدقيق</h1>
        <p className="mt-1 text-sm text-brand-700">
          تتبع عمليات الدخول والإنشاء والتعديل والحذف والأرشفة/الاستعادة للبيانات
          (الطلاب، الحلقات، الرسوم، الشهادات). {total} سجل.
        </p>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-brand-900/10 bg-white p-4 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
      >
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="ابحث في التفاصيل أو المعرّف أو المستخدم"
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        />

        <select
          name="action"
          defaultValue={action ?? ""}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        >
          <option value="">جميع الإجراءات</option>
          {AUDIT_ACTIONS.map((item) => (
            <option key={item} value={item}>
              {AUDIT_ACTION_LABELS[item]}
            </option>
          ))}
        </select>

        <select
          name="entity"
          defaultValue={entity ?? ""}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        >
          <option value="">جميع الكيانات</option>
          {AUDIT_ENTITIES.map((item) => (
            <option key={item} value={item}>
              {AUDIT_ENTITY_LABELS[item]}
            </option>
          ))}
        </select>

        <input
          name="from"
          type="date"
          defaultValue={from}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        />

        <input
          name="to"
          type="date"
          defaultValue={to}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        />

        <button
          type="submit"
          className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          بحث
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">المستخدم</th>
              <th className="px-4 py-3">الإجراء</th>
              <th className="px-4 py-3">الكيان</th>
              <th className="px-4 py-3">المعرّف</th>
              <th className="px-4 py-3">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-600">
                  لا توجد سجلات مطابقة.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-brand-700">
                    {dateFormatter.format(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {log.user ? (
                      <div>
                        <p className="font-bold text-brand-950">{log.user.name}</p>
                        <p className="text-xs text-brand-600" dir="ltr">
                          {log.user.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-brand-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${AUDIT_ACTION_CLASSES[log.action as keyof typeof AUDIT_ACTION_CLASSES] ?? "bg-brand-100 text-brand-800"}`}
                    >
                      {AUDIT_ACTION_LABELS[log.action as keyof typeof AUDIT_ACTION_LABELS] ??
                        log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {AUDIT_ENTITY_LABELS[log.entity as keyof typeof AUDIT_ENTITY_LABELS] ??
                      log.entity}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-600">
                    {log.entityId ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-700">{log.details ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-brand-600">
            صفحة {currentPage} من {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={buildHref(currentPage - 1)}
                className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
              >
                السابق
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={buildHref(currentPage + 1)}
                className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
              >
                التالي
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
