import type { Metadata } from "next";
import Link from "next/link";

import { ExcuseForm } from "@/components/excuse-form";
import { ProgressDashboard } from "@/components/progress-dashboard";
import { requireRole } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/school-settings";
import {
  formatExchangeRate,
  formatMoney,
} from "@/lib/school-settings-shared";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "لوحة ولي الأمر",
};

export const instant = false;

type ParentDashboardPageProps = {
  searchParams: Promise<{ child?: string }>;
};

export default async function ParentDashboardPage({
  searchParams,
}: ParentDashboardPageProps) {
  const session = await requireRole("PARENT");
  const params = await searchParams;

  const parent = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      children: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const children = parent?.children ?? [];

  if (children.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
          <div className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
            لا يوجد أبناء مرتبطون بحسابك. تواصل مع إدارة المدرسة.
          </div>
        </div>
      </main>
    );
  }

  const selected =
    children.find((child) => child.id === params.child) ?? children[0];

  const [settings, invoices, certificates] = await Promise.all([
    getSchoolSettings(),
    prisma.invoice.findMany({
      where: { studentId: { in: children.map((child) => child.id) } },
      include: { feePlan: true, payments: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.certificate.findMany({
      where: { studentId: selected.id },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  const money = (value: number) => formatMoney(value, settings);
  const statusLabels: Record<string, string> = {
    PENDING: "غير مدفوعة",
    PAID: "مدفوعة",
    PARTIAL: "مدفوعة جزئيًا",
    WAIVED: "معفاة",
  };
  const typeLabels: Record<string, string> = {
    PART_COMPLETION: "ختم جزء",
    FULL_QURAN: "ختم القرآن",
    EXCELLENCE: "تفوق",
    ATTENDANCE: "حضور",
  };

  return (
    <main className="flex-1">
      <ProgressDashboard
        studentId={selected.id}
        viewerRole="PARENT"
        childOptions={children.map((child) => ({
          id: child.id,
          name: child.user.name,
        }))}
        selectedChildId={selected.id}
      />

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
          <h2 className="text-lg font-bold text-brand-950">حالة الرسوم</h2>
          <p className="mt-1 text-sm text-brand-700">
            عرض فقط. للاستفسار تواصل مع إدارة المدرسة.
          </p>
          <p className="mt-2 text-xs leading-6 text-brand-600">
            المبالغ بالدولار الأمريكي، والقيمة بالليرة محسوبة حسب سعر الصرف
            الحالي: 1 $ = {formatExchangeRate(settings.exchangeRate)} ل.ل.
          </p>

          {invoices.length === 0 ? (
            <p className="mt-4 text-sm text-brand-600">لا توجد فواتير.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-900/10 text-sm">
                <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                  <tr>
                    <th className="px-4 py-3">الطالب</th>
                    <th className="px-4 py-3">الخطة</th>
                    <th className="px-4 py-3">المبلغ</th>
                    <th className="px-4 py-3">المدفوع</th>
                    <th className="px-4 py-3">الاستحقاق</th>
                    <th className="px-4 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-900/5">
                  {invoices.map((invoice) => {
                    const paid = invoice.payments.reduce(
                      (sum, payment) => sum + payment.amount,
                      0,
                    );
                    const child = children.find(
                      (item) => item.id === invoice.studentId,
                    );
                    return (
                      <tr key={invoice.id}>
                        <td className="px-4 py-3 font-bold text-brand-950">
                          {child?.user.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-brand-700">
                          {invoice.feePlan.name}
                        </td>
                        <td className="px-4 py-3 text-brand-700">
                          {money(invoice.amount)}
                        </td>
                        <td className="px-4 py-3 text-brand-700">
                          {money(paid)}
                        </td>
                        <td className="px-4 py-3 text-brand-700">
                          {invoice.dueDate.toISOString().slice(0, 10)}
                        </td>
                        <td className="px-4 py-3 text-brand-700">
                          {statusLabels[invoice.status] ?? invoice.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-4 sm:px-8">
        <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
          <h2 className="text-lg font-bold text-brand-950">إرسال عذر غياب</h2>
          <p className="mt-1 text-sm text-brand-700">
            اختر الطالب والتاريخ وأرسل سبب الغياب. بانتظار موافقة المعلم/المدير.
          </p>
          <div className="mt-4">
            <ExcuseForm
              childOptions={children.map((child) => ({
                id: child.id,
                name: child.user.name,
              }))}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-8 sm:px-8">
        <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
          <h2 className="text-lg font-bold text-brand-950">شهادات الابن</h2>
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
