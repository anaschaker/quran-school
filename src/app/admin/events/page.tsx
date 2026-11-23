import type { Metadata } from "next";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEventAction, deleteEvent } from "@/lib/actions/events";
import { DeleteButton } from "@/components/delete-button";

export const metadata: Metadata = {
  title: "الفعاليات",
};

export const instant = false;

const TYPE_LABELS: Record<string, string> = {
  HOLIDAY: "إجازة",
  EXAM: "اختبار",
  OCCASION: "مناسبة",
  COURSE: "دورة",
};

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "الجميع",
  TEACHERS: "المعلمون",
  STUDENTS: "الطلاب",
  PARENTS: "أولياء الأمور",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const flash = params.flash;

  const events = await prisma.event.findMany({
    orderBy: { startDate: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-950">الفعاليات والتواريخ</h1>
        <p className="mt-1 text-sm text-brand-700">إدارة الإجازات والاختبارات والمناسبات والدورات.</p>
      </div>

      {flash ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {flash === "created" ? "تم إنشاء الحدث." : flash === "deleted" ? "تم حذف الحدث." : flash}
        </div>
      ) : null}

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">إضافة حدث</h2>
        <form action={createEventAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="title" placeholder="العنوان" required className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25" />
          <select name="type" className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25">
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input name="startDate" type="date" required className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25" />
          <input name="endDate" type="date" required className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25" />
          <select name="audience" className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25">
            {Object.entries(AUDIENCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <textarea name="description" placeholder="الوصف (اختياري)" rows={2} className="sm:col-span-2 rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25" />
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800">
              إضافة
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">العنوان</th>
              <th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">الجمهور</th>
              <th className="px-4 py-3">البدء</th>
              <th className="px-4 py-3">الانتهاء</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-600">
                  لا توجد فعاليات.
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id}>
                  <td className="px-4 py-3 font-bold text-brand-950">{ev.title}</td>
                  <td className="px-4 py-3 text-brand-700">{TYPE_LABELS[ev.type]}</td>
                  <td className="px-4 py-3 text-brand-700">{AUDIENCE_LABELS[ev.audience]}</td>
                  <td className="px-4 py-3 text-brand-700">{ev.startDate.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3 text-brand-700">{ev.endDate.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <DeleteButton action={deleteEvent} id={ev.id} label="حذف" confirmMessage={`حذف ${ev.title}؟`} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
