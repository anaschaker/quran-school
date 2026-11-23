import Link from "next/link";

import { GradeChart, type GradePoint } from "@/components/grade-chart";
import { StudentBadges } from "@/components/student-badges";
import { StudentGoals } from "@/components/student-goals";
import { getSurah } from "@/data/surahs";
import { getStudentBadges, getStudentGoals } from "@/lib/memorization";
import { prisma } from "@/lib/prisma";

type ChildOption = {
  id: string;
  name: string;
};

type ProgressDashboardProps = {
  studentId: string;
  viewerRole: "STUDENT" | "PARENT";
  childOptions?: ChildOption[];
  selectedChildId?: string;
};

const TOTAL_QURAN_AYAHS = 6236;

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

const announcementAudienceLabels: Record<string, string> = {
  ALL: "للجميع",
  TEACHERS: "للمعلمين",
  STUDENTS: "للطلاب",
  PARENTS: "لأولياء الأمور",
};

const weekdayLabels = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

export async function ProgressDashboard({
  studentId,
  viewerRole,
  childOptions = [],
  selectedChildId,
}: ProgressDashboardProps) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      parent: true,
      enrollments: { include: { halaqa: true } },
    },
  });

  if (!student) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
          لا توجد بيانات للطالب المحدد.
        </div>
      </div>
    );
  }

  const [
    hifzRecords,
    recitations,
    allAttendance,
    exams,
    announcements,
    goals,
    badges,
  ] = await Promise.all([
    prisma.recitationRecord.findMany({
      where: { studentId, type: "HIFZ" },
      select: { fromAyah: true, toAyah: true },
    }),
    prisma.recitationRecord.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: 10,
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
    prisma.attendance.findMany({
      where: { studentId },
      select: { date: true, status: true },
    }),
    prisma.examResult.findMany({
      where: { studentId },
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
    prisma.announcement.findMany({
      where: {
        audience: {
          in: viewerRole === "PARENT" ? ["ALL", "PARENTS"] : ["ALL", "STUDENTS"],
        },
      },
      orderBy: { date: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        content: true,
        date: true,
        audience: true,
      },
    }),
    getStudentGoals(studentId),
    getStudentBadges(studentId),
  ]);

  const memorizedAyahs = hifzRecords.reduce(
    (sum, record) => sum + (record.toAyah - record.fromAyah + 1),
    0,
  );
  const progressPercentage = Math.min(
    100,
    Math.round((memorizedAyahs / TOTAL_QURAN_AYAHS) * 100),
  );

  const totalAttendance = allAttendance.length;
  const attendedCount = allAttendance.filter(
    (item) => item.status === "PRESENT" || item.status === "LATE",
  ).length;
  const attendancePercentage =
    totalAttendance > 0
      ? Math.round((attendedCount / totalAttendance) * 100)
      : 0;

  const statusCounts = {
    PRESENT: allAttendance.filter((item) => item.status === "PRESENT").length,
    ABSENT: allAttendance.filter((item) => item.status === "ABSENT").length,
    LATE: allAttendance.filter((item) => item.status === "LATE").length,
    EXCUSED: allAttendance.filter((item) => item.status === "EXCUSED").length,
  };

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = firstDay.getUTCDay();
  const monthName = new Intl.DateTimeFormat("ar-EG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(firstDay);

  const monthStatuses = new Map<number, string>();
  const priority: Record<string, number> = {
    ABSENT: 4,
    LATE: 3,
    EXCUSED: 2,
    PRESENT: 1,
  };

  for (const item of allAttendance) {
    if (
      item.date.getUTCFullYear() === year &&
      item.date.getUTCMonth() === month
    ) {
      const day = item.date.getUTCDate();
      const current = monthStatuses.get(day);
      if (!current || priority[item.status] > priority[current]) {
        monthStatuses.set(day, item.status);
      }
    }
  }

  const calendarCells = Array.from(
    { length: startWeekday + lastDay },
    (_, index) => {
      const day = index - startWeekday + 1;
      if (day < 1 || day > lastDay) return null;
      return { day, status: monthStatuses.get(day) ?? null };
    },
  );

  const chartData: GradePoint[] = [...recitations]
    .reverse()
    .map((record) => ({
      date: new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(record.date),
      grade: record.grade,
      type: recitationTypeLabels[record.type] ?? record.type,
    }));

  const recitationDateFormatter = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const examDateFormatter = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const announcementDateFormatter = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="ornamental-glow absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gold-200">
            <span className="size-1.5 rounded-full bg-gold-400" />
            {viewerRole === "PARENT" ? "لوحة ولي الأمر" : "لوحة الطالب"}
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-snug sm:text-4xl">
            {viewerRole === "PARENT"
              ? `متابعة: ${student.user.name}`
              : `أهلًا، ${student.user.name}`}
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-8 text-brand-100/85">
            {viewerRole === "PARENT"
              ? "اطّلع على حضور ابنك/ابنتك وتسميعه ونتائج اختباراته، مع آخر الإعلانات."
              : "تابع تقدمك في حفظ كتاب الله، وراجع حضورك وتسميعك ونتائجك."}
          </p>

          {student.enrollments.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {student.enrollments.map((enrollment) => (
                <span
                  key={enrollment.id}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-100"
                >
                  {enrollment.halaqa.name}
                </span>
              ))}
            </div>
          ) : null}

          {childOptions.length > 1 ? (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold text-brand-200">
                اختر الابن/الابنة:
              </p>
              <div className="flex flex-wrap gap-2">
                {childOptions.map((child) => {
                  const isActive = child.id === selectedChildId;

                  return (
                    <Link
                      key={child.id}
                      href={`/parent?child=${child.id}`}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-gold-500 text-brand-950"
                          : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <p className="text-xs font-semibold text-brand-500">
              آيات محفوظة (تقريبي)
            </p>
            <p className="mt-2 text-3xl font-bold text-brand-950">
              {new Intl.NumberFormat("ar-EG").format(memorizedAyahs)}
            </p>
            <p className="mt-1 text-xs text-brand-600">
              من أصل {new Intl.NumberFormat("ar-EG").format(TOTAL_QURAN_AYAHS)} آية
            </p>
          </div>

          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <p className="text-xs font-semibold text-brand-500">نسبة الحفظ</p>
            <p className="mt-2 text-3xl font-bold text-brand-950">
              {progressPercentage}%
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-gold-500 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <p className="text-xs font-semibold text-brand-500">نسبة الحضور</p>
            <p className="mt-2 text-3xl font-bold text-brand-950">
              {attendancePercentage}%
            </p>
            <p className="mt-1 text-xs text-brand-600">
              حاضر {attendedCount} من {totalAttendance} سجل
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-10 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-brand-950">خطة الحفظ</h2>
                <p className="mt-0.5 text-xs text-brand-600">
                  الهدف المحدد من المعلم، ونسبة الإنجاز والوتيرة والوقت المتبقي.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <StudentGoals
                goals={goals}
                emptyMessage="لم يحدد المعلم خطة حفظ بعد. ستظهر هنا فور إضافتها."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <StudentBadges badges={badges} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-10 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-brand-950">
                  تقدم التقديرات
                </h2>
                <p className="mt-0.5 text-xs text-brand-600">
                  رسم بياني لتقديرات التسميع عبر الزمن.
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-[0.65rem] font-semibold text-brand-600">
                {chartData.length} سجل
              </span>
            </div>
            <div className="mt-4">
              <GradeChart data={chartData} />
            </div>
          </div>

          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">
              تقويم الحضور — {monthName}
            </h2>
            <p className="mt-0.5 text-xs text-brand-600">
              أخضر: حاضر، أصفر: متأخر، أحمر: غائب، أزرق: بعذر.
            </p>

            <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[0.65rem] font-bold text-brand-600">
              {weekdayLabels.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, index) => {
                if (!cell) {
                  return <div key={`blank-${index}`} className="aspect-square" />;
                }

                const statusClass = cell.status
                  ? attendanceStatusClasses[cell.status]
                  : "bg-brand-50 text-brand-400";

                return (
                  <div
                    key={cell.day}
                    className={`flex aspect-square items-center justify-center rounded-lg text-xs font-bold ${statusClass}`}
                    title={
                      cell.status
                        ? `${cell.day} — ${attendanceStatusLabels[cell.status]}`
                        : `${cell.day} — لا يوجد سجل`
                    }
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[0.65rem] text-brand-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-200" />
                حاضر ({statusCounts.PRESENT})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-200" />
                متأخر ({statusCounts.LATE})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-red-200" />
                غائب ({statusCounts.ABSENT})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-sky-200" />
                بعذر ({statusCounts.EXCUSED})
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-10 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">آخر التسميعات</h2>
            <p className="mt-0.5 text-xs text-brand-600">
              آخر 10 سجلات تسميع.
            </p>

            {recitations.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-brand-900/15 bg-brand-50/40 p-4 text-sm text-brand-600">
                لا توجد سجلات تسميع بعد.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {recitations.map((record) => {
                  const surah = getSurah(record.surahNumber);

                  return (
                    <article
                      key={record.id}
                      className="rounded-xl border border-brand-900/10 bg-brand-50/40 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-brand-950">
                            {recitationTypeLabels[record.type] ?? record.type} —{" "}
                            {surah
                              ? `${surah.number}. ${surah.name}`
                              : `سورة ${record.surahNumber}`}
                          </p>
                          <p className="mt-0.5 text-xs text-brand-600">
                            آيات {record.fromAyah}–{record.toAyah} · معلم:{" "}
                            {record.teacher.name}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gold-700 ring-1 ring-gold-500/30">
                          {record.grade}/10
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-brand-500">
                        {recitationDateFormatter.format(record.date)}
                      </p>
                      {record.notes ? (
                        <p className="mt-1 text-xs leading-6 text-brand-700">
                          {record.notes}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">نتائج الاختبارات</h2>
            <p className="mt-0.5 text-xs text-brand-600">
              نتائج الاختبارات التي شارك فيها.
            </p>

            {exams.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-brand-900/15 bg-brand-50/40 p-4 text-sm text-brand-600">
                لا توجد نتائج اختبارات بعد.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {exams.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-brand-900/10 bg-brand-50/40 p-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-brand-950">
                        {result.exam.title}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-600">
                        {result.exam.halaqa.name} ·{" "}
                        {examDateFormatter.format(result.exam.date)}
                      </p>
                      {result.notes ? (
                        <p className="mt-1 text-xs text-brand-700">{result.notes}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold text-gold-700 ring-1 ring-gold-500/30">
                      {result.score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-950">الإعلانات</h2>
            <p className="mt-0.5 text-xs text-brand-600">
              الإعلانات الموجهة لك.
            </p>
          </div>
        </div>

        {announcements.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
            لا توجد إعلانات حاليًا.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-brand-600">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-gold-700 ring-1 ring-gold-500/30">
                    {announcementAudienceLabels[announcement.audience] ?? "للجميع"}
                  </span>
                  <time dateTime={announcement.date.toISOString()}>
                    {announcementDateFormatter.format(announcement.date)}
                  </time>
                </div>
                <h3 className="mt-2 text-base font-bold text-brand-950">
                  {announcement.title}
                </h3>
                <p className="mt-1 line-clamp-3 text-sm leading-7 text-brand-700">
                  {announcement.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
