import type { Metadata } from "next";
import Link from "next/link";

import { PrintSectionButton } from "@/components/reports/print-section-button";
import {
  ReportBarChart,
  ReportPieChart,
} from "@/components/reports/report-charts";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAttendanceReportData,
  getFeesReportData,
  getMemorizationReportData,
  getTeacherPerformanceData,
  resolveReportRange,
} from "@/lib/reports";
import { getSchoolSettings } from "@/lib/school-settings";
import { formatExchangeRate } from "@/lib/school-settings-shared";

export const metadata: Metadata = {
  title: "التقارير",
};

export const instant = false;

type ReportsPageProps = {
  searchParams: Promise<{ from?: string; to?: string; halaqa?: string }>;
};

const numberFormatter = new Intl.NumberFormat("ar-EG");
const decimalFormatter = new Intl.NumberFormat("ar-EG", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const moneyFormatter = new Intl.NumberFormat("ar-EG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default async function AdminReportsPage({
  searchParams,
}: ReportsPageProps) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const range = resolveReportRange(params.from, params.to);

  const halaqas = await prisma.halaqa.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const halaqaId = halaqas.some((halaqa) => halaqa.id === params.halaqa)
    ? params.halaqa
    : undefined;

  const [attendance, memorization, fees, teachers, settings] =
    await Promise.all([
      getAttendanceReportData({ range, halaqaId }),
      getMemorizationReportData({ range, halaqaId }),
      getFeesReportData({ range, halaqaId }),
      getTeacherPerformanceData({ range, halaqaId }),
      getSchoolSettings(),
    ]);

  const baseParams = new URLSearchParams({
    from: range.from,
    to: range.to,
  });

  if (halaqaId) {
    baseParams.set("halaqa", halaqaId);
  }

  function exportHref(type: string): string {
    return `/admin/reports/export?type=${type}&${baseParams.toString()}`;
  }

  function personalHref(studentId: string): string {
    return `/admin/reports/students/${studentId}?${baseParams.toString()}`;
  }

  function money(value: number): string {
    return `${moneyFormatter.format(value)} ${settings.currency}`;
  }

  const selectedHalaqa = halaqas.find((halaqa) => halaqa.id === halaqaId);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-brand-950">التقارير</h1>
        <p className="mt-1 text-sm text-brand-700">
          تقارير الحضور والحفظ والرسوم وأداء المعلمين، قابلة للفلترة بالتاريخ
          والحلقة، مع تصدير CSV وطباعة.
        </p>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-brand-900/10 bg-white p-4 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] print:hidden"
      >
        <div className="space-y-1">
          <label htmlFor="from" className="block text-xs font-bold text-brand-700">
            من تاريخ
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={range.from}
            className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="to" className="block text-xs font-bold text-brand-700">
            إلى تاريخ
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={range.to}
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
            href="/admin/reports"
            className="w-full rounded-xl border border-brand-900/15 px-4 py-2.5 text-center text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            إعادة تعيين
          </Link>
        </div>
      </form>

      <div className="rounded-2xl border border-gold-500/30 bg-gold-50/40 px-4 py-3 text-sm text-brand-800 print:hidden">
        الفترة: <span className="font-bold">{range.label}</span>
        {selectedHalaqa ? (
          <>
            {" "}
            — الحلقة: <span className="font-bold">{selectedHalaqa.name}</span>
          </>
        ) : (
          " — جميع الحلقات"
        )}
        . يمكن فتح تقرير شخصي لكل طالب من زر «تقرير شخصي» في تقرير الحضور.
      </div>

      <nav className="flex flex-wrap gap-2 print:hidden" aria-label="أقسام التقارير">
        {[
          { href: "#attendance", label: "الحضور" },
          { href: "#memorization", label: "الحفظ" },
          { href: "#fees", label: "الرسوم" },
          { href: "#teachers", label: "أداء المعلمين" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-full border border-brand-900/15 bg-white px-4 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* ───────────── تقرير الحضور ───────────── */}
      <section
        id="attendance"
        data-report-section
        className="report-card scroll-mt-24 rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6"
      >
        <div className="hidden print:mb-4 print:block">
          <p className="text-xs font-bold text-gold-700">{settings.name}</p>
          <h2 className="mt-1 text-xl font-bold text-brand-950">تقرير الحضور</h2>
          <p className="text-xs text-brand-600">
            {range.label}
            {selectedHalaqa ? ` — ${selectedHalaqa.name}` : " — جميع الحلقات"}
          </p>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-brand-950">تقرير الحضور</h2>
            <p className="mt-0.5 text-xs text-brand-600">
              نسب الحضور لكل حلقة وكل طالب، والطلاب الأكثر غيابًا.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={exportHref("attendance")}
              className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              تصدير CSV
            </a>
            <PrintSectionButton targetId="attendance" label="طباعة التقرير" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-brand-50/70 p-4">
            <p className="text-xs font-semibold text-brand-500">الطلاب</p>
            <p className="mt-1 text-2xl font-bold text-brand-950">
              {numberFormatter.format(attendance.totals.students)}
            </p>
          </div>
          <div className="rounded-xl bg-brand-50/70 p-4">
            <p className="text-xs font-semibold text-brand-500">السجلات</p>
            <p className="mt-1 text-2xl font-bold text-brand-950">
              {numberFormatter.format(attendance.totals.records)}
            </p>
          </div>
          <div className="rounded-xl bg-brand-50/70 p-4">
            <p className="text-xs font-semibold text-brand-500">
              نسبة الحضور الإجمالية
            </p>
            <p className="mt-1 text-2xl font-bold text-brand-950">
              {attendance.totals.percentage}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-gold-500"
                style={{ width: `${attendance.totals.percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-brand-900/10 p-4">
            <h3 className="text-sm font-bold text-brand-950">
              نسبة الحضور لكل حلقة
            </h3>
            <div className="mt-3">
              <ReportBarChart
                data={attendance.halaqas.map((row) => ({
                  label: row.halaqaName,
                  value: row.percentage,
                }))}
                unit="%"
                valueName="نسبة الحضور"
                height={260}
              />
            </div>
          </div>

          <div className="rounded-xl border border-brand-900/10 p-4">
            <h3 className="text-sm font-bold text-brand-950">
              الطلاب الأكثر غيابًا
            </h3>
            <div className="mt-3">
              <ReportBarChart
                data={attendance.mostAbsent.map((row) => ({
                  label: row.studentName,
                  value: row.absent,
                }))}
                color="#b91c1c"
                unit=" غياب"
                valueName="مرات الغياب"
                height={260}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-brand-900/10">
          <table className="min-w-full divide-y divide-brand-900/10 text-sm">
            <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
              <tr>
                <th className="px-4 py-3">الحلقة</th>
                <th className="px-4 py-3">الطلاب</th>
                <th className="px-4 py-3">السجلات</th>
                <th className="px-4 py-3">الحضور</th>
                <th className="px-4 py-3">النسبة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/5">
              {attendance.halaqas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-600">
                    لا توجد حلقات مطابقة.
                  </td>
                </tr>
              ) : (
                attendance.halaqas.map((row) => (
                  <tr key={row.halaqaId}>
                    <td className="px-4 py-2.5 font-bold text-brand-950">
                      {row.halaqaName}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">{row.students}</td>
                    <td className="px-4 py-2.5 text-brand-700">{row.records}</td>
                    <td className="px-4 py-2.5 text-brand-700">{row.attended}</td>
                    <td className="px-4 py-2.5 font-bold text-brand-800">
                      {row.percentage}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-brand-900/10">
          <table className="min-w-full divide-y divide-brand-900/10 text-sm">
            <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
              <tr>
                <th className="px-4 py-3">الطالب</th>
                <th className="px-4 py-3">الحلقات</th>
                <th className="px-4 py-3">حاضر</th>
                <th className="px-4 py-3">غائب</th>
                <th className="px-4 py-3">متأخر</th>
                <th className="px-4 py-3">بعذر</th>
                <th className="px-4 py-3">النسبة</th>
                <th className="px-4 py-3 print:hidden">تقرير شخصي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/5">
              {attendance.students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-brand-600">
                    لا يوجد طلاب مطابقون للفلتر المحدد.
                  </td>
                </tr>
              ) : (
                attendance.students.map((row) => (
                  <tr key={row.studentId}>
                    <td className="px-4 py-2.5 font-bold text-brand-950">
                      {row.studentName}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">
                      {row.halaqas || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-emerald-800">{row.present}</td>
                    <td className="px-4 py-2.5 text-red-800">{row.absent}</td>
                    <td className="px-4 py-2.5 text-amber-800">{row.late}</td>
                    <td className="px-4 py-2.5 text-sky-800">{row.excused}</td>
                    <td className="px-4 py-2.5 font-bold text-brand-800">
                      {row.records > 0 ? `${row.percentage}%` : "—"}
                    </td>
                    <td className="px-4 py-2.5 print:hidden">
                      <Link
                        href={personalHref(row.studentId)}
                        className="rounded-lg border border-brand-900/15 px-3 py-1 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                      >
                        تقرير شخصي
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────────── تقرير الحفظ ───────────── */}
      <section
        id="memorization"
        data-report-section
        className="report-card scroll-mt-24 rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6"
      >
        <div className="hidden print:mb-4 print:block">
          <p className="text-xs font-bold text-gold-700">{settings.name}</p>
          <h2 className="mt-1 text-xl font-bold text-brand-950">
            تقرير التقدم في الحفظ
          </h2>
          <p className="text-xs text-brand-600">
            {range.label}
            {selectedHalaqa ? ` — ${selectedHalaqa.name}` : " — جميع الحلقات"}
          </p>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-brand-950">
              تقرير التقدم في الحفظ
            </h2>
            <p className="mt-0.5 text-xs text-brand-600">
              سجلات الحفظ (HIFZ) والآيات الفريدة ومتوسط التقديرات لكل حلقة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={exportHref("memorization")}
              className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              تصدير CSV
            </a>
            <PrintSectionButton targetId="memorization" label="طباعة التقرير" />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-brand-900/10 p-4">
          <h3 className="text-sm font-bold text-brand-950">
            الآيات المحفوظة خلال الفترة لكل حلقة
          </h3>
          <div className="mt-3">
            <ReportBarChart
              data={memorization.map((row) => ({
                label: row.halaqaName,
                value: row.ayahs,
              }))}
              color="#2e6b54"
              unit=" آية"
              valueName="الآيات المحفوظة"
              height={280}
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-brand-900/10">
          <table className="min-w-full divide-y divide-brand-900/10 text-sm">
            <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
              <tr>
                <th className="px-4 py-3">الحلقة</th>
                <th className="px-4 py-3">الطلاب</th>
                <th className="px-4 py-3">طلاب نشطون</th>
                <th className="px-4 py-3">سجلات الحفظ</th>
                <th className="px-4 py-3">آيات محفوظة</th>
                <th className="px-4 py-3">متوسط التقدير</th>
                <th className="px-4 py-3">أهداف نشطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/5">
              {memorization.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-brand-600">
                    لا توجد حلقات مطابقة.
                  </td>
                </tr>
              ) : (
                memorization.map((row) => (
                  <tr key={row.halaqaId}>
                    <td className="px-4 py-2.5 font-bold text-brand-950">
                      {row.halaqaName}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">{row.students}</td>
                    <td className="px-4 py-2.5 text-brand-700">
                      {row.activeStudents}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">{row.records}</td>
                    <td className="px-4 py-2.5 font-semibold text-brand-800">
                      {numberFormatter.format(row.ayahs)}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">
                      {row.records > 0
                        ? `${decimalFormatter.format(row.averageGrade)} / 10`
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">
                      {numberFormatter.format(row.activeGoals)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────────── تقرير الرسوم ───────────── */}
      <section
        id="fees"
        data-report-section
        className="report-card scroll-mt-24 rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6"
      >
        <div className="hidden print:mb-4 print:block">
          <p className="text-xs font-bold text-gold-700">{settings.name}</p>
          <h2 className="mt-1 text-xl font-bold text-brand-950">تقرير الرسوم</h2>
          <p className="text-xs text-brand-600">
            {range.label}
            {selectedHalaqa ? ` — ${selectedHalaqa.name}` : " — جميع الحلقات"}
          </p>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-brand-950">تقرير الرسوم</h2>
            <p className="mt-0.5 text-xs text-brand-600">
              المحصّل خلال الفترة، والمتبقي على الفواتير المستحقة، والمتأخرات.
            </p>
            <p className="mt-1 text-xs text-brand-500">
              المبالغ بالدولار الأمريكي — سعر الصرف المعتمد: 1 $ ={" "}
              {formatExchangeRate(settings.exchangeRate)} ل.ل.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={exportHref("fees")}
              className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              تصدير CSV
            </a>
            <PrintSectionButton targetId="fees" label="طباعة التقرير" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-700">المحصّل</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">
              {money(fees.collected)}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {numberFormatter.format(fees.paymentsCount)} دفعة
            </p>
          </div>
          <div className="rounded-xl bg-sky-50 p-4">
            <p className="text-xs font-semibold text-sky-700">المتبقي</p>
            <p className="mt-1 text-2xl font-bold text-sky-900">
              {money(fees.remaining)}
            </p>
            <p className="mt-1 text-xs text-sky-700">
              {numberFormatter.format(fees.invoicesCount)} فاتورة مستحقة
            </p>
          </div>
          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-700">المتأخرات</p>
            <p className="mt-1 text-2xl font-bold text-red-900">
              {money(fees.overdue)}
            </p>
            <p className="mt-1 text-xs text-red-700">
              فواتير تجاوزت تاريخ الاستحقاق
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-xl border border-brand-900/10 p-4">
            <h3 className="text-sm font-bold text-brand-950">
              توزيع التحصيل والمتبقي والمتأخرات
            </h3>
            <div className="mt-3">
              <ReportPieChart
                data={[
                  { label: "المحصّل", value: Math.round(fees.collected) },
                  { label: "المتبقي", value: Math.round(fees.remaining) },
                  { label: "المتأخرات", value: Math.round(fees.overdue) },
                ]}
                unit={` ${settings.currency}`}
                height={280}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-brand-900/10">
            <table className="min-w-full divide-y divide-brand-900/10 text-sm">
              <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                <tr>
                  <th className="px-4 py-3">الخطة</th>
                  <th className="px-4 py-3">المستحق</th>
                  <th className="px-4 py-3">المحصّل</th>
                  <th className="px-4 py-3">المتبقي</th>
                  <th className="px-4 py-3">المتأخرات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/5">
                {fees.plans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-brand-600">
                      لا توجد بيانات رسوم في الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  fees.plans.map((row) => (
                    <tr key={row.planId}>
                      <td className="px-4 py-2.5 font-bold text-brand-950">
                        {row.planName}
                      </td>
                      <td className="px-4 py-2.5 text-brand-700">
                        {money(row.invoiced)}
                      </td>
                      <td className="px-4 py-2.5 text-emerald-800">
                        {money(row.collected)}
                      </td>
                      <td className="px-4 py-2.5 text-sky-800">
                        {money(row.remaining)}
                      </td>
                      <td className="px-4 py-2.5 text-red-800">
                        {money(row.overdue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───────────── تقرير أداء المعلمين ───────────── */}
      <section
        id="teachers"
        data-report-section
        className="report-card scroll-mt-24 rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6"
      >
        <div className="hidden print:mb-4 print:block">
          <p className="text-xs font-bold text-gold-700">{settings.name}</p>
          <h2 className="mt-1 text-xl font-bold text-brand-950">
            تقرير أداء المعلمين
          </h2>
          <p className="text-xs text-brand-600">
            {range.label}
            {selectedHalaqa ? ` — ${selectedHalaqa.name}` : " — جميع الحلقات"}
          </p>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-brand-950">
              تقرير أداء المعلمين
            </h2>
            <p className="mt-0.5 text-xs text-brand-600">
              عدد الجلسات المسجلة ومتوسط تقديرات التسميع لكل معلم.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={exportHref("teachers")}
              className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              تصدير CSV
            </a>
            <PrintSectionButton targetId="teachers" label="طباعة التقرير" />
          </div>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-brand-900/10 p-4">
            <h3 className="text-sm font-bold text-brand-950">
              الجلسات المسجلة لكل معلم
            </h3>
            <div className="mt-3">
              <ReportBarChart
                data={teachers.map((row) => ({
                  label: row.teacherName,
                  value: row.sessions,
                }))}
                unit=" جلسة"
                valueName="الجلسات"
                height={280}
              />
            </div>
          </div>

          <div className="rounded-xl border border-brand-900/10 p-4">
            <h3 className="text-sm font-bold text-brand-950">
              متوسط التقديرات لكل معلم
            </h3>
            <div className="mt-3">
              <ReportBarChart
                data={teachers.map((row) => ({
                  label: row.teacherName,
                  value: row.averageGrade,
                }))}
                color="#c9a227"
                unit=" / 10"
                valueName="متوسط التقدير"
                height={280}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-brand-900/10">
          <table className="min-w-full divide-y divide-brand-900/10 text-sm">
            <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
              <tr>
                <th className="px-4 py-3">المعلم</th>
                <th className="px-4 py-3">الحلقات</th>
                <th className="px-4 py-3">الطلاب</th>
                <th className="px-4 py-3">الجلسات</th>
                <th className="px-4 py-3">سجلات التسميع</th>
                <th className="px-4 py-3">متوسط التقدير</th>
                <th className="px-4 py-3">الاختبارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/5">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-brand-600">
                    لا توجد بيانات معلمين مطابقة.
                  </td>
                </tr>
              ) : (
                teachers.map((row) => (
                  <tr key={row.teacherId}>
                    <td className="px-4 py-2.5 font-bold text-brand-950">
                      {row.teacherName}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">{row.halaqas}</td>
                    <td className="px-4 py-2.5 text-brand-700">{row.students}</td>
                    <td className="px-4 py-2.5 font-semibold text-brand-800">
                      {numberFormatter.format(row.sessions)}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">
                      {numberFormatter.format(row.recitations)}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">
                      {row.recitations > 0
                        ? `${decimalFormatter.format(row.averageGrade)} / 10`
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-brand-700">
                      {numberFormatter.format(row.exams)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs leading-6 text-brand-600 print:hidden">
        «الجلسات المسجلة» هي عدد تواريخ الحضور الفريدة لكل حلقة خلال الفترة.
        تُحسب الآيات المحفوظة من سجلات HIFZ مع دمج النطاقات المتداخلة. تُصدَّر
        الملفات بترميز UTF-8 مع BOM لدعم العربية في Excel.
      </p>
    </div>
  );
}
