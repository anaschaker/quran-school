import type { Metadata } from "next";
import Link from "next/link";

import { getSchoolSettings } from "@/lib/school-settings";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "التحقق من شهادة",
};

export const instant = false;

const typeLabels: Record<string, string> = {
  PART_COMPLETION: "ختم جزء",
  FULL_QURAN: "ختم القرآن",
  EXCELLENCE: "تفوق",
  ATTENDANCE: "حضور",
};

type VerifyPageProps = {
  params: Promise<{ serial: string }>;
};

export default async function VerifyCertificatePage({
  params,
}: VerifyPageProps) {
  const { serial } = await params;

  const [certificate, settings] = await Promise.all([
    prisma.certificate.findUnique({
      where: { serialNumber: serial },
      include: {
        student: { include: { user: true } },
        issuer: true,
      },
    }),
    getSchoolSettings(),
  ]);

  if (!certificate) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-20 text-center sm:px-8">
          <span className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700">
            غير صالحة
          </span>
          <h1 className="mt-6 text-3xl font-bold text-brand-950">
            الشهادة غير موجودة
          </h1>
          <p className="mt-4 text-sm leading-7 text-brand-700">
            لم يتم العثور على شهادة بالرقم التسلسلي المُدخل. تأكد من صحة الرقم أو
            تواصل مع {settings.name}.
          </p>
          <p className="mt-2 font-mono text-xs text-brand-500" dir="ltr">
            {serial}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            العودة إلى الرئيسية
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-20 text-center sm:px-8">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
          شهادة صالحة
        </span>
        <h1 className="mt-6 text-3xl font-bold text-brand-950">
          {certificate.title}
        </h1>
        <p className="mt-2 text-sm text-brand-700">
          {typeLabels[certificate.type] ?? certificate.type}
        </p>

        <div className="mt-8 w-full rounded-2xl border border-brand-900/10 bg-white p-6 text-start shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-brand-600">الطالب</span>
              <span className="font-bold text-brand-950">
                {certificate.student.user.name}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-brand-600">المدرسة</span>
              <span className="font-bold text-brand-950">{settings.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-brand-600">التاريخ</span>
              <span className="font-bold text-brand-950">
                {certificate.issuedAt.toISOString().slice(0, 10)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-brand-600">المُصدر</span>
              <span className="font-bold text-brand-950">
                {certificate.issuer?.name ?? "إدارة المدرسة"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-brand-600">الرقم التسلسلي</span>
              <span className="font-mono font-bold text-brand-950" dir="ltr">
                {certificate.serialNumber}
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          العودة إلى الرئيسية
        </Link>
      </section>
    </main>
  );
}
