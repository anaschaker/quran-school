import type { Metadata } from "next";
import Link from "next/link";

import {
  getAttendanceReport,
  resolveMonth,
} from "@/lib/attendance-report";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "تقرير الحضور الشهري",
};

export const instant = false;

type AttendanceReportPageProps = {
  searchParams: Promise<{ month?: string; halaqa?: string }>;
};

export default async function AttendanceReportPage({
  searchParams,
}: AttendanceReportPageProps) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const range = resolveMonth(params.month);
  const halaqas = await prisma.halaqa.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const halaqaId = halaqas.some((halaqa) => halaqa.id === params.halaqa)
    ? params.halaqa
    : undefined;

  const report = await getAttendanceReport({ range, halaqaId });

  const exportParams = new URLSearchParams({ month: range.key });

  if (halaqaId) {
    exportParams.set("halaqa", halaqaId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">
            تقرير الحضور الشهري
          </h1>
          <p className="mt-1 text-sm text-brand-700">
            ملخص حضور الطلاب لشهر {range.label}، مع إمكانية تصدير الكشف.
          </p>
        </div>
        <a
          href={`/admin/attendance/export?${exportParams.toString()}`}
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          تصدير الكشف
        </a>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-brand-900/10 bg-white p-4 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:grid-cols-[1fr_1fr_auto_auto]"
      >
        <div className="space-y-1">
          <label
            htmlFor="month"
            className="block text-xs font-bold text-brand-700"
          >
            الشهر
          </label>
          <input
            id="month"
            name="month"
            type="month"
            defaultValue={range.key}
            className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="halaqa"
            className="block text-xs font-bold text-brand-700"
          >
            الحلقة
          </label>
          <select
            id="halaqa"
            name="halaqa"
            defaultValue={halaqaId ?? ""}
            className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
          >
            <option value="">جميع الحلقات</option>
            {halaqas.map((halaqa) => (
              <option key={halaqa.id} value={halaqa.id}>
                {halaqa.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            عرض
          </button>
        </div>

        <div className="flex items-end">
          <Link
            href="/admin/attendance"
            className="w-full rounded-xl border border-brand-900/15 px-4 py-2.5 text-center text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            إعادة تعيين
          </Link>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
          <p className="text-xs font-semibold text-brand-500">عدد الطلاب</p>
          <p className="mt-2 text-3xl font-bold text-brand-950">
            {report.totals.students}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
          <p className="text-xs font-semibold text-brand-500">إجمالي السجلات</p>
          <p className="mt-2 text-3xl font-bold text-brand-950">
            {report.totals.records}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
          <p className="text-xs font-semibold text-brand-500">نسبة الحضور</p>
          <p className="mt-2 text-3xl font-bold text-brand-950">
            {report.totals.percentage}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-gold-500"
              style={{ width: `${report.totals.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">الطالب</th>
              <th className="px-4 py-3">المرحلة</th>
              <th className="px-4 py-3">الحلقات</th>
              <th className="px-4 py-3">حاضر</th>
              <th className="px-4 py-3">غائب</th>
              <th className="px-4 py-3">متأخر</th>
              <th className="px-4 py-3">بعذر</th>
              <th className="px-4 py-3">الإجمالي</th>
              <th className="px-4 py-3">نسبة الحضور</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {report.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-brand-600"
                >
                  لا يوجد طلاب مطابقون للفلتر المحدد.
                </td>
              </tr>
            ) : (
              report.rows.map((row) => (
                <tr key={row.studentId}>
                  <td className="px-4 py-3 font-bold text-brand-950">
                    {row.studentName}
                  </td>
                  <td className="px-4 py-3 text-brand-700">{row.stage}</td>
                  <td className="px-4 py-3 text-brand-700">
                    {row.halaqas || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      {row.present}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-800">
                      {row.absent}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                      {row.late}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800">
                      {row.excused}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-700">
                    {row.total}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-brand-100">
                        <div
                          className="h-full rounded-full bg-brand-700"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-brand-800">
                        {row.percentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-6 text-brand-600">
        تُحسب نسبة الحضور من إجمالي السجلات، ويُعدّ «حاضر» و«متأخر» حضورًا.
        يُصدَّر الكشف بترميز يدعم الحروف العربية في برامج الجداول الإلكترونية.
      </p>
    </div>
  );
}
