import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "سجل التسليم",
};

export const instant = false;

const PAGE_SIZE = 25;

export default async function DeliveryLogPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; status?: string; page?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const channel = params.channel?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const where = {
    ...(channel ? { channel } : {}),
    ...(status ? { status } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.deliveryLog.count({ where }),
    prisma.deliveryLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  function buildHref(nextPage: number): string {
    const sp = new URLSearchParams();
    if (channel) sp.set("channel", channel);
    if (status) sp.set("status", status);
    if (nextPage > 1) sp.set("page", String(nextPage));
    const query = sp.toString();
    return query ? `/admin/delivery-log?${query}` : "/admin/delivery-log";
  }

  const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">سجل التسليم</h1>
          <p className="mt-1 text-sm text-brand-700">
            محاولات إرسال الإشعارات عبر القنوات (البريد الإلكتروني). {total} سجل.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← لوحة الإدارة
        </Link>
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <select
          name="channel"
          defaultValue={channel}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        >
          <option value="">جميع القنوات</option>
          <option value="EMAIL">البريد الإلكتروني</option>
        </select>
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        >
          <option value="">جميع الحالات</option>
          <option value="SENT">تم الإرسال</option>
          <option value="FAILED">فشل</option>
          <option value="SKIPPED">تم التخطي</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          فلترة
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">المستخدم</th>
              <th className="px-4 py-3">القناة</th>
              <th className="px-4 py-3">الحدث</th>
              <th className="px-4 py-3">المستلم</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">الخطأ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-600">
                  لا توجد سجلات مطابقة.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-brand-700">
                    {dateFormatter.format(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {log.user ? log.user.name : "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-700">{log.channel}</td>
                  <td className="px-4 py-3 text-brand-700">{log.event}</td>
                  <td className="px-4 py-3 text-brand-700" dir="ltr">
                    {log.recipient ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        log.status === "SENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : log.status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-red-700">
                    {log.error ?? "—"}
                  </td>
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
