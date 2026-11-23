import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { StudentForm } from "@/components/student-form";
import { ResetPasswordButton } from "@/components/reset-password-button";
import { prisma } from "@/lib/prisma";
import { updateStudent } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "تعديل طالب",
};

export const instant = false;

type EditStudentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { id } = await params;

  const [student, parents] = await Promise.all([
    prisma.student.findUnique({
      where: { id },
      include: { user: true, parent: true },
    }),
    prisma.user.findMany({
      where: { role: "PARENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/students"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← إدارة الطلاب
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-brand-950">تعديل طالب</h1>
        <p className="mt-1 text-sm text-brand-700">
          عدّل بيانات {student.user.name}. اترك كلمة المرور فارغة للإبقاء عليها.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8">
        <StudentForm
          action={updateStudent}
          parents={parents}
          requirePassword={false}
          submitLabel="حفظ التعديلات"
          initial={{
            id: student.id,
            name: student.user.name,
            email: student.user.email,
            phone: student.user.phone ?? "",
            birthDate: student.birthDate
              ? student.birthDate.toISOString().slice(0, 10)
              : "",
            stage: student.stage,
            parentId: student.parentId ?? "",
            status: student.status,
            notes: student.notes ?? "",
          }}
        />
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">
          أمان الحساب
        </h2>
        <p className="mt-1 text-sm text-brand-700">
          إعادة تعيين كلمة مرور {student.user.name}.
        </p>
        <div className="mt-4">
          <ResetPasswordButton
            userId={student.user.id}
            userName={student.user.name}
          />
        </div>
      </div>
    </div>
  );
}
