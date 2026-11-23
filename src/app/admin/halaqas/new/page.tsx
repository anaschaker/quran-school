import type { Metadata } from "next";
import Link from "next/link";

import { HalaqaForm } from "@/components/halaqa-form";
import { prisma } from "@/lib/prisma";
import { createHalaqa } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "إضافة حلقة",
};

export const instant = false;

export default async function NewHalaqaPage() {
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/halaqas"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← إدارة الحلقات
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-brand-950">إضافة حلقة</h1>
        <p className="mt-1 text-sm text-brand-700">
          أدخل بيانات الحلقة وعيّن معلمًا لها. الحقول المعلّمة بـ * مطلوبة.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8">
        <HalaqaForm
          action={createHalaqa}
          teachers={teachers}
          submitLabel="إضافة حلقة"
        />
      </div>
    </div>
  );
}
