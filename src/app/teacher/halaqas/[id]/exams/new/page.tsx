import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ExamForm } from "@/components/exam-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "إنشاء اختبار",
};

export const instant = false;

type NewTeacherExamPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TeacherNewExamPage({
  params,
}: NewTeacherExamPageProps) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const halaqa = await prisma.halaqa.findFirst({
    where: { id, teacherId: session.userId },
    include: {
      enrollments: {
        include: { student: { include: { user: true } } },
        orderBy: { student: { user: { name: "asc" } } },
      },
    },
  });

  if (!halaqa) {
    notFound();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href={`/teacher/halaqas/${halaqa.id}`}
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← تفاصيل الحلقة
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-brand-950">
          إنشاء اختبار — {halaqa.name}
        </h1>
        <p className="mt-1 text-sm text-brand-700">
          أدخل عنوان الاختبار وتاريخه ودرجات الطلاب، ثم احفظ.
        </p>

        <div className="mt-6">
          <ExamForm
            halaqaId={halaqa.id}
            halaqaName={halaqa.name}
            students={halaqa.enrollments.map((enrollment) => ({
              id: enrollment.studentId,
              name: enrollment.student.user.name,
              stage: enrollment.student.stage,
            }))}
            defaultDate={today}
            backHref={`/teacher/halaqas/${halaqa.id}`}
          />
        </div>
      </section>
    </main>
  );
}
