import type { Metadata } from "next";
import Link from "next/link";

import { InvoiceForm } from "@/components/invoice-form";
import { createInvoice, deleteFeePlan } from "@/lib/actions/fees";
import { requireRole } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/school-settings";
import {
  formatExchangeRate,
  formatMoney,
} from "@/lib/school-settings-shared";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "الرسوم",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  "plan-created": "تم إنشاء خطة الرسوم بنجاح.",
  "plan-updated": "تم تعديل خطة الرسوم بنجاح.",
  "plan-deleted": "تم حذف خطة الرسوم بنجاح.",
  "plan-in-use": "لا يمكن حذف الخطة لأنها مستخدمة في فواتير.",
  "invoices-created": "تم إنشاء الفواتير بنجاح.",
  waived: "تم إعفاء الفاتورة.",
  error: "تعذّر تنفيذ العملية. يرجى المحاولة مرة أخرى.",
};

const periodLabels: Record<string, string> = {
  MONTHLY: "شهري",
  TERM: "فصلي",
  YEARLY: "سنوي",
};

const statusLabels: Record<string, string> = {
  PENDING: "غير مدفوعة",
  PAID: "مدفوعة",
  PARTIAL: "مدفوعة جزئيًا",
  WAIVED: "معفاة",
};

export default async function AdminFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;

  const [settings, feePlans, students, halaqas, invoices] = await Promise.all([
    getSchoolSettings(),
    prisma.feePlan.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.student.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.halaqa.findMany({ orderBy: { name: "asc" } }),
    prisma.invoice.findMany({
      include: {
        student: { include: { user: true } },
        feePlan: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const money = (value: number) => formatMoney(value, settings);

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const overdue = invoices.filter(
    (invoice) =>
      invoice.status !== "PAID" &&
      invoice.status !== "WAIVED" &&
      invoice.dueDate.getTime() < now,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">الرسوم</h1>
          <p className="mt-1 text-sm text-brand-700">
            إدارة خطط الرسوم، إنشاء الفواتير، تسجيل الدفعات، وعرض المتأخرات.
          </p>
          <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-xs leading-6 text-brand-700">
            المبالغ بالدولار الأمريكي، وتُعرض القيمة بالليرة وفق سعر الصرف
            المعتمد: 1 $ = {formatExchangeRate(settings.exchangeRate)} ل.ل.
          </p>
        </div>
      </div>

      {flash ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {flash}
        </div>
      ) : null}

      {/* خطط الرسوم */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-950">خطط الرسوم</h2>
          <Link
            href="/admin/fees/plans/new"
            className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            إضافة خطة
          </Link>
        </div>

        {feePlans.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
            لا توجد خطط رسوم. ابدأ بإضافة خطة.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <table className="min-w-full divide-y divide-brand-900/10 text-sm">
              <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                <tr>
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">الدورية</th>
                  <th className="px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/5">
                {feePlans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-4 py-3 font-bold text-brand-950">
                      {plan.name}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {money(plan.amount)}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {periodLabels[plan.period] ?? plan.period}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/fees/plans/${plan.id}/edit`}
                          className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                        >
                          تعديل
                        </Link>
                        <form action={deleteFeePlan}>
                          <input
                            type="hidden"
                            name="feePlanId"
                            value={plan.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50"
                          >
                            حذف
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* إنشاء فاتورة */}
      <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">إنشاء فاتورة</h2>
        <p className="mt-1 text-sm text-brand-700">
          لطالب واحد أو لجميع طلاب حلقة دفعة واحدة.
        </p>
        <div className="mt-4">
          <InvoiceForm
            action={createInvoice}
            students={students.map((student) => ({
              id: student.id,
              name: student.user.name,
            }))}
            halaqas={halaqas.map((halaqa) => ({
              id: halaqa.id,
              name: halaqa.name,
            }))}
            feePlans={feePlans.map((plan) => ({
              id: plan.id,
              name: plan.name,
              amount: plan.amount,
            }))}
            submitLabel="إنشاء الفاتورة"
          />
        </div>
      </section>

      {/* المتأخرات */}
      {overdue.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-brand-950">
            فواتير متأخرة ({overdue.length})
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-red-200 bg-red-50/40">
            <table className="min-w-full divide-y divide-red-200/60 text-sm">
              <thead className="bg-red-50 text-start text-xs font-bold text-red-800">
                <tr>
                  <th className="px-4 py-3">الطالب</th>
                  <th className="px-4 py-3">الخطة</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">الاستحقاق</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-200/40">
                {overdue.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3 font-bold text-brand-950">
                      {invoice.student.user.name}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {invoice.feePlan.name}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {money(invoice.amount)}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {invoice.dueDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-brand-700">
                      {statusLabels[invoice.status] ?? invoice.status}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/fees/invoices/${invoice.id}`}
                        className="text-xs font-bold text-brand-800 underline-offset-4 hover:underline"
                      >
                        تفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* الفواتير */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-950">
          الفواتير (آخر 50)
        </h2>
        {invoices.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
            لا توجد فواتير.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <table className="min-w-full divide-y divide-brand-900/10 text-sm">
              <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
                <tr>
                  <th className="px-4 py-3">الطالب</th>
                  <th className="px-4 py-3">الخطة</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">الاستحقاق</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/5">
                {invoices.map((invoice) => {
                  const paid = invoice.payments.reduce(
                    (sum, payment) => sum + payment.amount,
                    0,
                  );
                  return (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3 font-bold text-brand-950">
                        {invoice.student.user.name}
                      </td>
                      <td className="px-4 py-3 text-brand-700">
                        {invoice.feePlan.name}
                      </td>
                      <td className="px-4 py-3 text-brand-700">
                        {money(paid)} / {money(invoice.amount)}
                      </td>
                      <td className="px-4 py-3 text-brand-700">
                        {invoice.dueDate.toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-brand-700">
                        {statusLabels[invoice.status] ?? invoice.status}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/fees/invoices/${invoice.id}`}
                          className="text-xs font-bold text-brand-800 underline-offset-4 hover:underline"
                        >
                          تفاصيل
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
