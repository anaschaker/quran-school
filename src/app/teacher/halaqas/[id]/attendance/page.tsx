import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { AttendanceForm } from "@/components/attendance-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "تسجيل الحضور",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  saved: "تم حفظ الحضور بنجاح.",
};

type AttendancePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; flash?: string }>;
};

export default async function AttendancePage({
  params,
  searchParams,
}: AttendancePageProps) {
  const session = await requireRole("TEACHER");
  const { id } = await params;
  const sp = await searchParams;

  const halaqa = await prisma.halaqa.findFirst({
    where: { id, teacherId: session.userId },
    select: { id: true, name: true, time: true, days: true },
  });

  if (!halaqa) {
    notFound();
  }

  const dateStr =
    sp.date && !Number.isNaN(Date.parse(sp.date))
      ? sp.date
      : new Date().toISOString().slice(0, 10);

  const date = new Date(`${dateStr}T00:00:00.000Z`);

  const [enrollments, attendance] = await Promise.all([
    prisma.enrollment.findMany({
      where: { halaqaId: id },
      include: { student: { include: { user: true } } },
      orderBy: { student: { user: { name: "asc" } } },
    }),
    prisma.attendance.findMany({
      where: { halaqaId: id, date },
      select: { studentId: true, status: true },
    }),
  ]);

  const statusByStudent = new Map(
    attendance.map((item) => [item.studentId, item.status]),
  );

  const students = enrollments.map((enrollment) => ({
    id: enrollment.studentId,
    name: enrollment.student.user.name,
    stage: enrollment.student.stage,
    status: statusByStudent.get(enrollment.studentId) ?? "PRESENT",
  }));

  const flash = sp.flash ? FLASH_MESSAGES[sp.flash] : undefined;

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex items-center gap-3">
          <Link
            href={`/teacher/halaqas/${halaqa.id}`}
            className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
          >
            ← تفاصيل الحلقة
          </Link>
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-brand-950">
            تسجيل الحضور — {halaqa.name}
          </h1>
          <p className="mt-1 text-sm text-brand-700">
            {halaqa.days} — <span dir="ltr">{halaqa.time}</span>
          </p>
        </div>

        {flash ? (
          <div
            role="status"
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            {flash}
          </div>
        ) : null}

        {students.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
            لا يوجد طلاب مسجلون في هذه الحلقة.
          </p>
        ) : (
          <div className="mt-6">
            <AttendanceForm
              halaqaId={halaqa.id}
              date={dateStr}
              students={students}
            />
          </div>
        )}
      </section>
    </main>
  );
}
