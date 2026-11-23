import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { PrintButton } from "@/components/print-button";
import { requireRole } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/school-settings";
import {
  formatExchangeRate,
  formatMoney,
} from "@/lib/school-settings-shared";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "إيصال دفعة",
};

export const instant = false;

const methodLabels: Record<string, string> = {
  CASH: "نقدي",
  TRANSFER: "تحويل",
};

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  await requireRole("ADMIN");
  const { id } = await params;

  const [payment, settings] = await Promise.all([
    prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            student: { include: { user: true } },
            feePlan: true,
          },
        },
        receiver: true,
      },
    }),
    getSchoolSettings(),
  ]);

  if (!payment) {
    notFound();
  }

  const invoice = payment.invoice;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 print:py-4">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/fees/invoices/${invoice.id}`}
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← العودة
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-2xl border border-brand-900/10 bg-white p-8 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] print:border-0 print:shadow-none">
        <header className="border-b border-brand-900/10 pb-4 text-center">
          <h1 className="text-2xl font-bold text-brand-950">
            {settings.name}
          </h1>
          <p className="mt-1 text-sm text-brand-700">إيصال دفع</p>
        </header>

        <section className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-brand-600">رقم الإيصال</span>
            <span className="font-mono font-semibold text-brand-950">
              {payment.id}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-brand-600">التاريخ</span>
            <span className="font-semibold text-brand-950">
              {payment.date.toISOString().slice(0, 10)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-brand-600">الطالب</span>
            <span className="font-semibold text-brand-950">
              {invoice.student.user.name}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-brand-600">خطة الرسوم</span>
            <span className="font-semibold text-brand-950">
              {invoice.feePlan.name}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-brand-600">طريقة الدفع</span>
            <span className="font-semibold text-brand-950">
              {methodLabels[payment.method] ?? payment.method}
            </span>
          </div>
          {payment.note ? (
            <div className="flex justify-between gap-4">
              <span className="text-brand-600">ملاحظة</span>
              <span className="font-semibold text-brand-950">
                {payment.note}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <span className="text-brand-600">المستلم</span>
            <span className="font-semibold text-brand-950">
              {payment.receiver?.name ?? "—"}
            </span>
          </div>
        </section>

        <div className="mt-6 border-t border-brand-900/10 pt-4">
          <div className="flex items-center justify-between text-lg font-bold text-brand-950">
            <span>المبلغ</span>
            <span className="text-end">
              {formatMoney(payment.amount, settings)}
            </span>
          </div>
          <p className="mt-2 text-xs text-brand-600">
            القيمة بالليرة محسوبة حسب سعر الصرف الحالي: 1 $ ={" "}
            {formatExchangeRate(settings.exchangeRate)} ل.ل.
          </p>
        </div>

        <footer className="mt-8 border-t border-brand-900/10 pt-4 text-center text-xs text-brand-600">
          شكرًا لتسديده. هذا الإيصال صادر إلكترونيًا.
        </footer>
      </article>
    </main>
  );
}
