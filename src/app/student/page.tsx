import type { Metadata } from "next";
import Link from "next/link";

import { ProgressDashboard } from "@/components/progress-dashboard";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "لوحة الطالب",
};

export const instant = false;

export default async function StudentDashboardPage() {
  const session = await requireRole("STUDENT");

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!student) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
          <div className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
            لا يوجد ملف طالب مرتبط بحسابك. تواصل مع إدارة المدرسة.
          </div>
        </div>
      </main>
    );
  }

  const certificates = await prisma.certificate.findMany({
    where: { studentId: student.id },
    orderBy: { issuedAt: "desc" },
  });

  const typeLabels: Record<string, string> = {
    PART_COMPLETION: "ختم جزء",
    FULL_QURAN: "ختم القرآن",
    EXCELLENCE: "تفوق",
    ATTENDANCE: "حضور",
  };

  return (
    <main className="flex-1">
      <ProgressDashboard studentId={student.id} viewerRole="STUDENT" />

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
          <h2 className="text-lg font-bold text-brand-950">شهاداتي</h2>
          {certificates.length === 0 ? (
            <p className="mt-3 text-sm text-brand-600">لا توجد شهادات.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {certificates.map((certificate) => (
                <li
                  key={certificate.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-brand-900/10 bg-brand-50/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-brand-950">
                      {certificate.title}
                    </p>
                    <p className="text-xs text-brand-600">
                      {typeLabels[certificate.type] ?? certificate.type} —{" "}
                      {certificate.issuedAt.toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <Link
                    href={`/certificates/${certificate.id}`}
                    className="text-xs font-bold text-brand-800 underline-offset-4 hover:underline"
                  >
                    عرض
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
