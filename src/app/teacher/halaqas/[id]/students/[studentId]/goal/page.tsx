import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GoalForm } from "@/components/goal-form";
import { StudentBadges } from "@/components/student-badges";
import { StudentGoals } from "@/components/student-goals";
import { requireRole } from "@/lib/auth";
import { getStudentBadges, getStudentGoals } from "@/lib/memorization";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "خطة الحفظ",
};

export const instant = false;

type StudentGoalPageProps = {
  params: Promise<{ id: string; studentId: string }>;
  searchParams: Promise<{ flash?: string }>;
};

const FLASH_MESSAGES: Record<string, string> = {
  created: "تم حفظ خطة الحفظ وإشعار الطالب وولي الأمر.",
  cancelled: "تم إلغاء خطة الحفظ.",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function StudentGoalPage({
  params,
  searchParams,
}: StudentGoalPageProps) {
  const session = await requireRole("TEACHER");
  const { id, studentId } = await params;
  const sp = await searchParams;
  const flash = sp.flash ? FLASH_MESSAGES[sp.flash] : undefined;

  const halaqa = await prisma.halaqa.findFirst({
    where: { id, teacherId: session.userId },
    select: { id: true, name: true },
  });

  if (!halaqa) {
    notFound();
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_halaqaId: { studentId, halaqaId: id } },
    include: { student: { include: { user: true } } },
  });

  if (!enrollment) {
    notFound();
  }

  const [goals, badges] = await Promise.all([
    getStudentGoals(studentId),
    getStudentBadges(studentId),
  ]);

  const today = new Date();
  const defaultStartDate = today.toISOString().slice(0, 10);
  const defaultTargetDate = new Date(today.getTime() + 30 * DAY_MS)
    .toISOString()
    .slice(0, 10);

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

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand-950">
              خطة الحفظ — {enrollment.student.user.name}
            </h1>
            <p className="mt-1 text-sm text-brand-700">
              {halaqa.name} · المرحلة: {enrollment.student.stage}
            </p>
          </div>

          <Link
            href={`/teacher/halaqas/${halaqa.id}/students/${studentId}/recitation`}
            className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
          >
            تسجيل التسميع
          </Link>
        </div>

        {flash ? (
          <div
            role="status"
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            {flash}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">
              إضافة هدف حفظ جديد
            </h2>
            <p className="mt-0.5 text-xs text-brand-600">
              حدّد النطاق وتاريخ الهدف، ويمكن إضافة أكثر من هدف على مراحل.
            </p>

            <div className="mt-5">
              <GoalForm
                halaqaId={halaqa.id}
                studentId={studentId}
                studentName={enrollment.student.user.name}
                defaultStartDate={defaultStartDate}
                defaultTargetDate={defaultTargetDate}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-brand-950">
                أهداف الطالب الحالية
              </h2>
              <p className="mt-0.5 text-xs text-brand-600">
                تُحسب النسبة من سجلات الحفظ (HIFZ) فقط.
              </p>

              <div className="mt-4">
                <StudentGoals
                  goals={goals}
                  halaqaId={halaqa.id}
                  showCancel
                  emptyMessage="لم تُحدد خطة حفظ لهذا الطالب بعد."
                />
              </div>
            </div>

            <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
              <StudentBadges badges={badges} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
