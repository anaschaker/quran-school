import type { Metadata } from "next";
import Link from "next/link";

import { CertificateForm } from "@/components/certificate-form";
import { issueCertificate } from "@/lib/actions/certificates";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "الشهادات",
};

export const instant = false;

const typeLabels: Record<string, string> = {
  PART_COMPLETION: "ختم جزء",
  FULL_QURAN: "ختم القرآن",
  EXCELLENCE: "تفوق",
  ATTENDANCE: "حضور",
};

const FLASH_MESSAGES: Record<string, string> = {
  issued: "تم إصدار الشهادة بنجاح.",
};

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;

  const [students, certificates] = await Promise.all([
    prisma.student.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.certificate.findMany({
      include: { student: { include: { user: true } }, issuer: true },
      orderBy: { issuedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">الشهادات</h1>
          <p className="mt-1 text-sm text-brand-700">
            إصدار شهادات للطلاب وعرض الشهادات المُصدرة.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← لوحة الإدارة
        </Link>
      </div>

      {flash ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {flash}
        </div>
      ) : null}

      <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">إصدار شهادة</h2>
        <div className="mt-4">
          <CertificateForm
            action={issueCertificate}
            students={students.map((student) => ({
              id: student.id,
              name: student.user.name,
            }))}
            submitLabel="إصدار الشهادة"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-950">
          الشهادات المُصدرة (آخر 50)
        </h2>
        {certificates.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
            لا توجد شهادات.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <table className="min-w-full divide-y divide-brand-900/10 text-sm">
              <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                <tr>
                  <th className="px-4 py-3">الطالب</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">العنوان</th>
                  <th className="px-4 py-3">الرقم التسلسلي</th>
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">عرض</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/5">
                {certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td className="px-4 py-3 font-bold text-brand-950">
                      {certificate.student.user.name}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {typeLabels[certificate.type] ?? certificate.type}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {certificate.title}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-700" dir="ltr">
                      {certificate.serialNumber}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {certificate.issuedAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/certificates/${certificate.id}`}
                        className="text-xs font-bold text-brand-800 underline-offset-4 hover:underline"
                      >
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
