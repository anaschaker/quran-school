import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { HalaqaExams } from "@/components/halaqa-exams";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "تفاصيل الحلقة",
};

export const instant = false;

type TeacherHalaqaPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string }>;
};

const FLASH_MESSAGES: Record<string, string> = {
  "exam-created": "تم إنشاء الاختبار وحفظ الدرجات بنجاح.",
};

export default async function TeacherHalaqaPage({
  params,
  searchParams,
}: TeacherHalaqaPageProps) {
  const session = await requireRole("TEACHER");
  const { id } = await params;
  const sp = await searchParams;
  const flash = sp.flash ? FLASH_MESSAGES[sp.flash] : undefined;

  const halaqa = await prisma.halaqa.findFirst({
    where: { id, teacherId: session.userId },
    include: {
      _count: { select: { enrollments: true } },
      enrollments: {
        include: {
          student: { include: { user: true } },
        },
        orderBy: { student: { user: { name: "asc" } } },
      },
      exams: {
        include: {
          results: {
            include: { student: { include: { user: true } } },
            orderBy: { score: "desc" },
          },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!halaqa) {
    notFound();
  }

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher"
            className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
          >
            ← لوحة المعلم
          </Link>
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-brand-950">{halaqa.name}</h1>
          <p className="mt-1 text-sm text-brand-700">
            {halaqa.days} — <span dir="ltr">{halaqa.time}</span> ·{" "}
            {halaqa._count.enrollments} / {halaqa.maxStudents} طالب
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

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/teacher/halaqas/${halaqa.id}/attendance`}
            className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            تسجيل الحضور
          </Link>
        </div>

        <div className="mt-8">
          <HalaqaExams
            exams={halaqa.exams}
            createHref={`/teacher/halaqas/${halaqa.id}/exams/new`}
          />
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
          <table className="min-w-full divide-y divide-brand-900/10 text-sm">
            <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
              <tr>
                <th className="px-4 py-3">الطالب</th>
                <th className="px-4 py-3">المرحلة</th>
                <th className="px-4 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/5">
              {halaqa.enrollments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-brand-600">
                    لا يوجد طلاب مسجلون في هذه الحلقة.
                  </td>
                </tr>
              ) : (
                halaqa.enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-brand-950">
                        {enrollment.student.user.name}
                      </p>
                      <p className="text-xs text-brand-600" dir="ltr">
                        {enrollment.student.user.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {enrollment.student.stage}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/teacher/halaqas/${halaqa.id}/students/${enrollment.studentId}/recitation`}
                          className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                        >
                          تسجيل التسميع
                        </Link>
                        <Link
                          href={`/teacher/halaqas/${halaqa.id}/students/${enrollment.studentId}/goal`}
                          className="rounded-lg border border-gold-500/40 bg-gold-50/40 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-gold-50"
                        >
                          خطة الحفظ
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
