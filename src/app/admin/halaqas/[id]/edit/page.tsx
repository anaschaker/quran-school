import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { HalaqaForm } from "@/components/halaqa-form";
import { prisma } from "@/lib/prisma";
import { updateHalaqa } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "تعديل حلقة",
};

export const instant = false;

type EditHalaqaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditHalaqaPage({ params }: EditHalaqaPageProps) {
  const { id } = await params;

  const [halaqa, teachers] = await Promise.all([
    prisma.halaqa.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        teacherId: true,
        time: true,
        days: true,
        maxStudents: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!halaqa) {
    notFound();
  }

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
        <h1 className="text-2xl font-bold text-brand-950">تعديل حلقة</h1>
        <p className="mt-1 text-sm text-brand-700">
          عدّل بيانات {halaqa.name} وتعيين المعلم.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8">
        <HalaqaForm
          action={updateHalaqa}
          teachers={teachers}
          submitLabel="حفظ التعديلات"
          initial={{
            id: halaqa.id,
            name: halaqa.name,
            teacherId: halaqa.teacherId,
            time: halaqa.time,
            days: halaqa.days,
            maxStudents: halaqa.maxStudents,
          }}
        />
      </div>
    </div>
  );
}
