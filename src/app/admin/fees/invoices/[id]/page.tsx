import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { PaymentForm } from "@/components/payment-form";
import { recordPayment, waiveInvoice } from "@/lib/actions/fees";
import { requireRole } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/school-settings";
import { formatMoney } from "@/lib/school-settings-shared";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "تفاصيل الفاتورة",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  "payment-recorded": "تم تسجيل الدفعة بنجاح.",
  waived: "تم إعفاء الفاتورة.",
  error: "تعذّر تنفيذ العملية. يرجى المحاولة مرة أخرى.",
};

const statusLabels: Record<string, string> = {
  PENDING: "غير مدفوعة",
  PAID: "مدفوعة",
  PARTIAL: "مدفوعة جزئيًا",
  WAIVED: "معفاة",
};

const methodLabels: Record<string, string> = {
  CASH: "نقدي",
  TRANSFER: "تحويل",
};

type InvoicePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string }>;
};

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: InvoicePageProps) {
  await requireRole("ADMIN");
  const { id } = await params;
  const sp = await searchParams;
  const flash = sp.flash ? FLASH_MESSAGES[sp.flash] : undefined;

  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        feePlan: true,
        payments: {
          include: { receiver: true },
          orderBy: { date: "desc" },
        },
      },
    }),
    getSchoolSettings(),
  ]);

  if (!invoice) {
    notFound();
  }

  const money = (value: number) => formatMoney(value, settings);
  const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, invoice.amount - paid);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/fees"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← الرسوم
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

      <div>
        <h1 className="text-2xl font-bold text-brand-950">تفاصيل الفاتورة</h1>
        <p className="mt-1 text-sm text-brand-700">
          {invoice.student.user.name} — {invoice.feePlan.name}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-900/10 bg-white p-4">
          <p className="text-xs font-bold text-brand-600">المبلغ</p>
          <p className="mt-1 text-lg font-bold text-brand-950">
            {money(invoice.amount)}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-900/10 bg-white p-4">
          <p className="text-xs font-bold text-brand-600">المدفوع</p>
          <p className="mt-1 text-lg font-bold text-brand-950">
            {money(paid)}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-900/10 bg-white p-4">
          <p className="text-xs font-bold text-brand-600">المتبقي</p>
          <p className="mt-1 text-lg font-bold text-brand-950">
            {money(remaining)}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-900/10 bg-white p-4">
          <p className="text-xs font-bold text-brand-600">الحالة</p>
          <p className="mt-1 text-lg font-bold text-brand-950">
            {statusLabels[invoice.status] ?? invoice.status}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">تسجيل دفعة</h2>
        <p className="mt-1 text-sm text-brand-700">
          استحقاق: {invoice.dueDate.toISOString().slice(0, 10)}
        </p>
        {remaining > 0.001 && invoice.status !== "WAIVED" ? (
          <div className="mt-4">
            <PaymentForm
              action={recordPayment}
              invoiceId={invoice.id}
              currency={settings.currency}
              exchangeRate={settings.exchangeRate}
              remaining={remaining}
              submitLabel="تسجيل الدفعة"
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-brand-600">
            لا يوجد مبلغ متبقٍ (أو الفاتورة معفاة).
          </p>
        )}
      </section>

      {invoice.status !== "WAIVED" && remaining > 0.001 ? (
        <form action={waiveInvoice}>
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <button
            type="submit"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100"
          >
            إعفاء الفاتورة
          </button>
        </form>
      ) : null}

      <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">الدفعات</h2>
        {invoice.payments.length === 0 ? (
          <p className="mt-3 text-sm text-brand-600">لا توجد دفعات مسجلة.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-900/10 text-sm">
              <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                <tr>
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">الطريقة</th>
                  <th className="px-4 py-3">الملاحظة</th>
                  <th className="px-4 py-3">المستلم</th>
                  <th className="px-4 py-3">إيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/5">
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-brand-700">
                      {payment.date.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-950">
                      {money(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {methodLabels[payment.method] ?? payment.method}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {payment.note ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {payment.receiver?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/fees/receipts/${payment.id}`}
                        target="_blank"
                        className="text-xs font-bold text-brand-800 underline-offset-4 hover:underline"
                      >
                        طباعة
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
