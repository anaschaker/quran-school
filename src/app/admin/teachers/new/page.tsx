import type { Metadata } from "next";
import Link from "next/link";

import { TeacherForm } from "@/components/teacher-form";
import { createTeacher } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "إضافة معلم",
};

export const instant = false;

export default async function NewTeacherPage() {
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
        <h1 className="text-2xl font-bold text-brand-950">إضافة معلم</h1>
        <p className="mt-1 text-sm text-brand-700">
          أدخل بيانات المعلم. الحقول المعلّمة بـ * مطلوبة.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8">
        <TeacherForm
          action={createTeacher}
          requirePassword
          submitLabel="إضافة معلم"
        />
      </div>
    </div>
  );
}
