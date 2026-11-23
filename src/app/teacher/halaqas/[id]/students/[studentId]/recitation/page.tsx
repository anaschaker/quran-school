import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { RecitationForm } from "@/components/recitation-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { surahByNumber } from "@/data/surahs";

export const metadata: Metadata = {
  title: "تسجيل التسميع",
};

export const instant = false;

const recitationTypeLabels: Record<string, string> = {
  HIFZ: "حفظ",
  MURAJAA: "مراجعة",
  TILAWA: "تلاوة",
};

type RecitationPageProps = {
  params: Promise<{ id: string; studentId: string }>;
};

export default async function RecitationPage({ params }: RecitationPageProps) {
  const session = await requireRole("TEACHER");
  const { id, studentId } = await params;

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

  const recentRecords = await prisma.recitationRecord.findMany({
    where: { studentId, teacherId: session.userId },
    orderBy: { date: "desc" },
    take: 5,
    select: {
      id: true,
      date: true,
      type: true,
      surahNumber: true,
      fromAyah: true,
      toAyah: true,
      grade: true,
      notes: true,
    },
  });

  const today = new Date().toISOString().slice(0, 10);

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

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-brand-950">
            تسجيل التسميع — {enrollment.student.user.name}
          </h1>
          <p className="mt-1 text-sm text-brand-700">
            {halaqa.name} · سجّل حفظًا أو مراجعة أو تلاوة مع السورة والآيات
            والتقدير.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8">
          <RecitationForm
            halaqaId={halaqa.id}
            studentId={studentId}
            studentName={enrollment.student.user.name}
            date={today}
          />
        </div>

        {recentRecords.length > 0 ? (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <div className="border-b border-brand-900/10 px-5 py-4">
              <h2 className="text-lg font-bold text-brand-950">
                آخر التسميعات
              </h2>
            </div>
            <table className="min-w-full divide-y divide-brand-900/10 text-sm">
              <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                <tr>
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">السورة</th>
                  <th className="px-4 py-3">الآيات</th>
                  <th className="px-4 py-3">التقدير</th>
                  <th className="px-4 py-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/5">
                {recentRecords.map((record) => {
                  const surah = surahByNumber.get(record.surahNumber);

                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-3 text-brand-700">
                        {new Intl.DateTimeFormat("ar-EG", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(record.date)}
                      </td>
                      <td className="px-4 py-3 text-brand-700">
                        {recitationTypeLabels[record.type] ?? record.type}
                      </td>
                      <td className="px-4 py-3 text-brand-700">
                        {surah
                          ? `${surah.number}. ${surah.name}`
                          : record.surahNumber}
                      </td>
                      <td className="px-4 py-3 text-brand-700" dir="ltr">
                        {record.fromAyah} - {record.toAyah}
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-950">
                        {record.grade}/10
                      </td>
                      <td className="px-4 py-3 text-brand-700">
                        {record.notes ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
