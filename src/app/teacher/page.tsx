import type { Metadata } from "next";
import Link from "next/link";

import { getSurah } from "@/data/surahs";
import { requireRole } from "@/lib/auth";
import { getLateStudentsForTeacher } from "@/lib/memorization";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "لوحة المعلم",
};

export const instant = false;

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function goalRangeLabel(
  fromSurah: number,
  fromAyah: number,
  toSurah: number,
  toAyah: number,
): string {
  const from = getSurah(fromSurah);
  const to = getSurah(toSurah);

  if (fromSurah === toSurah) {
    return `${from?.name ?? fromSurah} (${fromAyah}-${toAyah})`;
  }

  return `${from?.name ?? fromSurah} (${fromAyah}) → ${to?.name ?? toSurah} (${toAyah})`;
}

export default async function TeacherDashboardPage() {
  const session = await requireRole("TEACHER");

  const halaqas = await prisma.halaqa.findMany({
    where: { teacherId: session.userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      time: true,
      days: true,
      maxStudents: true,
      _count: { select: { enrollments: true } },
    },
  });

  const studentCount = halaqas.reduce(
    (total, halaqa) => total + halaqa._count.enrollments,
    0,
  );

  const lateStudents = await getLateStudentsForTeacher(session.userId);

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div>
          <h1 className="text-2xl font-bold text-brand-950 sm:text-3xl">
            أهلًا، {session.name}
          </h1>
          <p className="mt-1 text-sm text-brand-700">
            لوحة المعلم — حلقاتك وطلابك.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <p className="text-3xl font-bold text-brand-950">{halaqas.length}</p>
            <p className="mt-1 text-sm font-medium text-brand-600">حلقة</p>
          </div>
          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <p className="text-3xl font-bold text-brand-950">{studentCount}</p>
            <p className="mt-1 text-sm font-medium text-brand-600">طالب</p>
          </div>
          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <p className="text-3xl font-bold text-brand-950">
              {halaqas.reduce((total, halaqa) => total + halaqa.maxStudents, 0)}
            </p>
            <p className="mt-1 text-sm font-medium text-brand-600">الحد الأقصى</p>
          </div>
          <div
            className={`rounded-2xl border p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] ${
              lateStudents.length > 0
                ? "border-red-200 bg-red-50/60"
                : "border-brand-900/10 bg-white"
            }`}
          >
            <p
              className={`text-3xl font-bold ${
                lateStudents.length > 0 ? "text-red-800" : "text-brand-950"
              }`}
            >
              {lateStudents.length}
            </p>
            <p className="mt-1 text-sm font-medium text-brand-600">
              متأخر عن هدفه
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/teacher/certificates"
            className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            إصدار شهادة
          </Link>
        </div>

        {halaqas.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
            لم تُسنَد إليك أي حلقة بعد. تواصل مع إدارة المدرسة.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {halaqas.map((halaqa) => (
              <article
                key={halaqa.id}
                className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]"
              >
                <h2 className="text-lg font-bold text-brand-950">
                  {halaqa.name}
                </h2>
                <p className="mt-2 text-sm text-brand-700">
                  {halaqa.days} — <span dir="ltr">{halaqa.time}</span>
                </p>
                <p className="mt-1 text-xs text-brand-600">
                  {halaqa._count.enrollments} / {halaqa.maxStudents} طالب
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/teacher/halaqas/${halaqa.id}`}
                    className="rounded-xl border border-brand-900/15 px-3.5 py-2 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                  >
                    طلاب الحلقة
                  </Link>
                  <Link
                    href={`/teacher/halaqas/${halaqa.id}/attendance`}
                    className="rounded-xl bg-brand-900 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-800"
                  >
                    تسجيل الحضور
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-brand-950">
                طلاب متأخرون عن أهدافهم
              </h2>
              <p className="mt-0.5 text-xs text-brand-600">
                يُحدَّث تلقائيًا من سجلات الحفظ الفعلية مقابل النسبة المتوقعة.
              </p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200">
              {lateStudents.length} طالب
            </span>
          </div>

          {lateStudents.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-5 text-sm text-brand-600">
              لا يوجد طلاب متأخرون عن أهدافهم حاليًا.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lateStudents.map((item) => (
                <li
                  key={`${item.studentId}-${item.goalId}`}
                  className="rounded-2xl border border-red-200 bg-red-50/40 p-4 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-950">
                        {item.studentName}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-600">
                        {item.halaqaName} ·{" "}
                        {goalRangeLabel(
                          item.fromSurah,
                          item.fromAyah,
                          item.toSurah,
                          item.toAyah,
                        )}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-[0.7rem] font-bold text-red-800">
                      متأخر
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-brand-700">
                    <span className="font-semibold">
                      المنجز: {item.progressPercent}%
                    </span>
                    <span>المتوقع: {item.expectedPercent}%</span>
                    <span>الموعد: {dateFormatter.format(new Date(item.targetDate))}</span>
                    <span
                      className={
                        item.daysRemaining < 0
                          ? "font-bold text-red-700"
                          : "font-semibold text-brand-700"
                      }
                    >
                      {item.daysRemaining < 0
                        ? `تجاوز الموعد بـ ${Math.abs(item.daysRemaining)} يوم`
                        : item.daysRemaining === 0
                          ? "الموعد اليوم"
                          : `متبقٍ ${item.daysRemaining} يوم`}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/teacher/halaqas/${item.halaqaId}/students/${item.studentId}/goal`}
                      className="rounded-lg border border-brand-900/15 bg-white px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                    >
                      عرض خطة الحفظ
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
