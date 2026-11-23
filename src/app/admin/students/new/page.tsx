import type { Metadata } from "next";
import Link from "next/link";

import { StudentForm } from "@/components/student-form";
import { prisma } from "@/lib/prisma";
import { createStudent } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "إضافة طالب",
};

export const instant = false;

export default async function NewStudentPage() {
  const parents = await prisma.user.findMany({
    where: { role: "PARENT" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

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
        <h1 className="text-2xl font-bold text-brand-950">إضافة طالب</h1>
        <p className="mt-1 text-sm text-brand-700">
          أدخل بيانات الطالب وربطه بولي أمر (اختياري). الحقول المعلّمة بـ * مطلوبة.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8">
        <StudentForm
          action={createStudent}
          parents={parents}
          requirePassword
          submitLabel="إضافة طالب"
        />
      </div>
    </div>
  );
}
