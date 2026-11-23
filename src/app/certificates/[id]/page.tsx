import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { PrintButton } from "@/components/print-button";
import { getSession } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/school-settings";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "شهادة",
};

export const instant = false;

const typeLabels: Record<string, string> = {
  PART_COMPLETION: "ختم جزء",
  FULL_QURAN: "ختم القرآن",
  EXCELLENCE: "تفوق",
  ATTENDANCE: "حضور",
};

type CertificatePageProps = {
  params: Promise<{ id: string }>;
};

export default async function CertificateViewPage({
  params,
}: CertificatePageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const [certificate, settings] = await Promise.all([
    prisma.certificate.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, parent: true } },
        issuer: true,
      },
    }),
    getSchoolSettings(),
  ]);

  if (!certificate) {
    notFound();
  }

  let allowed = false;

  if (session.role === "ADMIN") {
    allowed = true;
  } else if (session.role === "TEACHER") {
    const owns = await prisma.enrollment.findFirst({
      where: {
        studentId: certificate.studentId,
        halaqa: { teacherId: session.userId },
      },
    });
    allowed = Boolean(owns);
  } else if (session.role === "STUDENT") {
    allowed = certificate.student.user.id === session.userId;
  } else if (session.role === "PARENT") {
    allowed = certificate.student.parent?.id === session.userId;
  }

  if (!allowed) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 print:py-4">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={
            session.role === "ADMIN"
              ? "/admin/certificates"
              : session.role === "TEACHER"
                ? "/teacher/certificates"
                : session.role === "STUDENT"
                  ? "/student"
                  : "/parent"
          }
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← عودة
        </Link>
        <PrintButton />
      </div>

      <article className="relative overflow-hidden rounded-2xl border-4 border-gold-500/60 bg-white p-10 text-center shadow-[0_20px_60px_-30px_rgba(8,37,28,0.4)] print:rounded-none print:border-2 print:shadow-none">
        <div className="pointer-events-none absolute inset-3 rounded-xl border border-gold-500/30" />

        <p className="text-xs font-bold tracking-wide text-gold-700">
          {settings.name}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-brand-950">
          شهادة {typeLabels[certificate.type] ?? certificate.type}
        </h1>

        <p className="mt-6 text-sm text-brand-700">تُمنح إلى</p>
        <p className="mt-2 text-2xl font-bold text-brand-950">
          {certificate.student.user.name}
        </p>

        <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-brand-700">
          {certificate.title}
        </p>

        <div className="mt-8 grid gap-3 text-sm text-brand-700 sm:grid-cols-2">
          <div className="rounded-xl bg-brand-50/60 p-3">
            <p className="text-xs font-bold text-brand-600">التاريخ</p>
            <p className="mt-1 font-semibold text-brand-950">
              {certificate.issuedAt.toISOString().slice(0, 10)}
            </p>
          </div>
          <div className="rounded-xl bg-brand-50/60 p-3">
            <p className="text-xs font-bold text-brand-600">الرقم التسلسلي</p>
            <p className="mt-1 font-mono font-semibold text-brand-950" dir="ltr">
              {certificate.serialNumber}
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-4 text-sm text-brand-700">
          <div className="text-start">
            <p className="font-bold text-brand-950">
              {certificate.issuer?.name ?? "إدارة المدرسة"}
            </p>
            <p className="text-xs text-brand-600">المُصدر</p>
          </div>
          <div className="text-end">
            <p className="font-bold text-brand-950">{settings.name}</p>
            <p className="text-xs text-brand-600">المدرسة</p>
          </div>
        </div>

        <p className="mt-6 text-xs text-brand-500">
          للتحقق من صحة الشهادة: /verify/{certificate.serialNumber}
        </p>
      </article>
    </main>
  );
}
