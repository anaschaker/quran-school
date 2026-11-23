import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { StudentBadges } from "@/components/student-badges";
import { StudentGoals } from "@/components/student-goals";
import { getSurah } from "@/data/surahs";
import { requireRole } from "@/lib/auth";
import { getStudentBadges, getStudentGoals } from "@/lib/memorization";
import { prisma } from "@/lib/prisma";
import { resolveReportRange } from "@/lib/reports";
import { getSchoolSettings } from "@/lib/school-settings";

export const metadata: Metadata = {
  title: "تقرير الطالب",
};

export const instant = false;

type StudentReportPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("ar-EG");
const decimalFormatter = new Intl.NumberFormat("ar-EG", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const recitationTypeLabels: Record<string, string> = {
  HIFZ: "حفظ",
  MURAJAA: "مراجعة",
  TILAWA: "تلاوة",
};

const attendanceStatusLabels: Record<string, string> = {
  PRESENT: "حاضر",
  ABSENT: "غائب",
  LATE: "متأخر",
  EXCUSED: "بعذر",
};

const attendanceStatusClasses: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-800",
  ABSENT: "bg-red-100 text-red-800",
  LATE: "bg-amber-100 text-amber-800",
  EXCUSED: "bg-sky-100 text-sky-800",
};

export default async function StudentReportPage({
  params,
  searchParams,
}: StudentReportPageProps) {
  await requireRole("ADMIN");
  const { studentId } = await params;
  const sp = await searchParams;
  const range = resolveReportRange(sp.from, sp.to);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      parent: { select: { name: true, phone: true } },
      enrollments: {
        include: { halaqa: { select: { name: true, teacher: { select: { name: true } } } } },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const [attendance, recitations, examResults, goals, badges, settings] =
    await Promise.all([
      prisma.attendance.findMany({
        where: {
          studentId,
          date: { gte: range.start, lt: range.end },
        },
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          status: true,
          halaqa: { select: { name: true } },
        },
      }),
      prisma.recitationRecord.findMany({
        where: {
          studentId,
          date: { gte: range.start, lt: range.end },
        },
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          type: true,
          surahNumber: true,
          fromAyah: true,
          toAyah: true,
          grade: true,
          notes: true,
          teacher: { select: { name: true } },
        },
      }),
      prisma.examResult.findMany({
        where: {
          studentId,
          exam: { date: { gte: range.start, lt: range.end } },
        },
        orderBy: { exam: { date: "desc" } },
        select: {
          id: true,
          score: true,
          notes: true,
          exam: {
            select: {
              title: true,
              date: true,
              halaqa: { select: { name: true } },
            },
          },
        },
      }),
      getStudentGoals(studentId),
      getStudentBadges(studentId),
      getSchoolSettings(),
    ]);

  const attendanceCounts = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
  };

  for (const record of attendance) {
    attendanceCounts[record.status] += 1;
  }

  const attendanceTotal = attendance.length;
  const attended = attendanceCounts.PRESENT + attendanceCounts.LATE;
  const attendancePercentage =
    attendanceTotal > 0 ? Math.round((attended / attendanceTotal) * 100) : 0;

  const averageGrade =
    recitations.length > 0
      ? decimalFormatter.format(
          recitations.reduce((sum, record) => sum + record.grade, 0) /
            recitations.length,
        )
      : "—";

  const averageExam =
    examResults.length > 0
      ? decimalFormatter.format(
          examResults.reduce((sum, result) => sum + result.score, 0) /
            examResults.length,
        )
      : "—";

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/reports?from=${range.from}&to=${range.to}`}
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← العودة إلى التقارير
        </Link>
        <PrintButton label="طباعة التقرير الشخصي" />
      </div>

      <article className="report-card rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_20px_60px_-30px_rgba(8,37,28,0.4)] sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-brand-900/10 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-wide text-gold-700">
                {settings.name}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-brand-950">
                التقرير الشخصي للطالب
              </h1>
              <p className="mt-1 text-lg font-bold text-brand-900">
                {student.user.name}
              </p>
            </div>

            <div className="text-xs leading-6 text-brand-600">
              <p>
                المرحلة: <span className="font-bold">{student.stage}</span>
              </p>
              <p>
                الحلقات:{" "}
                <span className="font-bold">
                  {student.enrollments
                    .map((enrollment) => enrollment.halaqa.name)
                    .join(" | ") || "—"}
                </span>
              </p>
              <p>
                ولي الأمر:{" "}
                <span className="font-bold">{student.parent?.name ?? "—"}</span>
              </p>
              <p>
                الفترة: <span className="font-bold">{range.label}</span>
              </p>
            </div>
          </div>
        </header>

        <section className="mt-5">
          <h2 className="text-base font-bold text-brand-950">ملخص عام</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-brand-50/70 p-3">
              <p className="text-xs font-semibold text-brand-500">نسبة الحضور</p>
              <p className="mt-1 text-xl font-bold text-brand-950">
                {attendancePercentage}%
              </p>
              <p className="text-[0.65rem] text-brand-600">
                {attended} من {attendanceTotal} سجل
              </p>
            </div>
            <div className="rounded-xl bg-brand-50/70 p-3">
              <p className="text-xs font-semibold text-brand-500">
                سجلات التسميع
              </p>
              <p className="mt-1 text-xl font-bold text-brand-950">
                {numberFormatter.format(recitations.length)}
              </p>
            </div>
            <div className="rounded-xl bg-brand-50/70 p-3">
              <p className="text-xs font-semibold text-brand-500">
                متوسط التقدير
              </p>
              <p className="mt-1 text-xl font-bold text-brand-950">
                {averageGrade}
                {recitations.length > 0 ? " / 10" : ""}
              </p>
            </div>
            <div className="rounded-xl bg-brand-50/70 p-3">
              <p className="text-xs font-semibold text-brand-500">
                متوسط الاختبارات
              </p>
              <p className="mt-1 text-xl font-bold text-brand-950">
                {averageExam}
                {examResults.length > 0 ? " / 100" : ""}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-bold text-brand-950">الحضور</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {Object.entries(attendanceCounts).map(([status, count]) => (
              <span
                key={status}
                className={`rounded-full px-3 py-1 font-bold ${attendanceStatusClasses[status]}`}
              >
                {attendanceStatusLabels[status]}: {count}
              </span>
            ))}
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-brand-900/10">
            <table className="min-w-full divide-y divide-brand-900/10 text-sm">
              <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                <tr>
                  <th className="px-4 py-2.5">التاريخ</th>
                  <th className="px-4 py-2.5">الحلقة</th>
                  <th className="px-4 py-2.5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/5">
                {attendance.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-5 text-center text-brand-600"
                    >
                      لا توجد سجلات حضور في الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-2 text-brand-700">
                        {dateFormatter.format(record.date)}
                      </td>
                      <td className="px-4 py-2 text-brand-700">
                        {record.halaqa.name}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${attendanceStatusClasses[record.status]}`}
                        >
                          {attendanceStatusLabels[record.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-bold text-brand-950">التسميع</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-brand-900/10">
            <table className="min-w-full divide-y divide-brand-900/10 text-sm">
              <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                <tr>
                  <th className="px-4 py-2.5">التاريخ</th>
                  <th className="px-4 py-2.5">النوع</th>
                  <th className="px-4 py-2.5">السورة والآيات</th>
                  <th className="px-4 py-2.5">التقدير</th>
                  <th className="px-4 py-2.5">المعلم</th>
                  <th className="px-4 py-2.5">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/5">
                {recitations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-5 text-center text-brand-600"
                    >
                      لا توجد سجلات تسميع في الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  recitations.map((record) => {
                    const surah = getSurah(record.surahNumber);

                    return (
                      <tr key={record.id}>
                        <td className="px-4 py-2 text-brand-700">
                          {dateFormatter.format(record.date)}
                        </td>
                        <td className="px-4 py-2 text-brand-700">
                          {recitationTypeLabels[record.type] ?? record.type}
                        </td>
                        <td className="px-4 py-2 text-brand-700">
                          {surah ? `${surah.name} ` : ""}
                          <span dir="ltr">
                            ({record.fromAyah}-{record.toAyah})
                          </span>
                        </td>
                        <td className="px-4 py-2 font-bold text-brand-950">
                          {record.grade}/10
                        </td>
                        <td className="px-4 py-2 text-brand-700">
                          {record.teacher.name}
                        </td>
                        <td className="px-4 py-2 text-brand-600">
                          {record.notes ?? "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-bold text-brand-950">الاختبارات</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-brand-900/10">
            <table className="min-w-full divide-y divide-brand-900/10 text-sm">
              <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                <tr>
                  <th className="px-4 py-2.5">التاريخ</th>
                  <th className="px-4 py-2.5">الاختبار</th>
                  <th className="px-4 py-2.5">الحلقة</th>
                  <th className="px-4 py-2.5">الدرجة</th>
                  <th className="px-4 py-2.5">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/5">
                {examResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-5 text-center text-brand-600"
                    >
                      لا توجد نتائج اختبارات في الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  examResults.map((result) => (
                    <tr key={result.id}>
                      <td className="px-4 py-2 text-brand-700">
                        {dateFormatter.format(result.exam.date)}
                      </td>
                      <td className="px-4 py-2 font-semibold text-brand-900">
                        {result.exam.title}
                      </td>
                      <td className="px-4 py-2 text-brand-700">
                        {result.exam.halaqa.name}
                      </td>
                      <td className="px-4 py-2 font-bold text-brand-950">
                        {result.score}/100
                      </td>
                      <td className="px-4 py-2 text-brand-600">
                        {result.notes ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-bold text-brand-950">خطة الحفظ</h2>
          <div className="mt-3">
            <StudentGoals
              goals={goals}
              emptyMessage="لا توجد خطة حفظ محددة لهذا الطالب."
            />
          </div>
        </section>

        <section className="mt-6">
          <StudentBadges badges={badges} />
        </section>

        <footer className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-brand-900/10 pt-4 text-xs text-brand-600">
          <div>
            <p className="font-bold text-brand-900">{settings.name}</p>
            <p>{settings.phone}</p>
          </div>
          <p>
            تاريخ إصدار التقرير: {dateFormatter.format(new Date())}
          </p>
        </footer>
      </article>
    </main>
  );
}
