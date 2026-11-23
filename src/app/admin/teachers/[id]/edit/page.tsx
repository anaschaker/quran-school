import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { TeacherForm } from "@/components/teacher-form";
import { ResetPasswordButton } from "@/components/reset-password-button";
import { prisma } from "@/lib/prisma";
import { updateTeacher } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "تعديل معلم",
};

export const instant = false;

type EditTeacherPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTeacherPage({ params }: EditTeacherPageProps) {
  const { id } = await params;

  const teacher = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  if (!teacher || teacher.role !== "TEACHER") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/teachers"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← إدارة المعلمين
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-brand-950">تعديل معلم</h1>
        <p className="mt-1 text-sm text-brand-700">
          عدّل بيانات {teacher.name}. اترك كلمة المرور فارغة للإبقاء عليها.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8">
        <TeacherForm
          action={updateTeacher}
          requirePassword={false}
          submitLabel="حفظ التعديلات"
          initial={{
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone ?? "",
          }}
        />
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">
          أمان الحساب
        </h2>
        <p className="mt-1 text-sm text-brand-700">
          إعادة تعيين كلمة مرور {teacher.name}.
        </p>
        <div className="mt-4">
          <ResetPasswordButton
            userId={teacher.id}
            userName={teacher.name}
          />
        </div>
      </div>
    </div>
  );
}
