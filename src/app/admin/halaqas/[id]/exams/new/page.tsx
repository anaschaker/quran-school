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

type NewExamPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminNewExamPage({ params }: NewExamPageProps) {
  await requireRole("ADMIN");
  const { id } = await params;

  const halaqa = await prisma.halaqa.findUnique({
    where: { id },
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
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/halaqas/${halaqa.id}`}
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
      </div>

      <ExamForm
        halaqaId={halaqa.id}
        halaqaName={halaqa.name}
        students={halaqa.enrollments.map((enrollment) => ({
          id: enrollment.studentId,
          name: enrollment.student.user.name,
          stage: enrollment.student.stage,
        }))}
        defaultDate={today}
        backHref={`/admin/halaqas/${halaqa.id}`}
      />
    </div>
  );
}
