import type { Metadata } from "next";
import Link from "next/link";

import { DeleteButton } from "@/components/delete-button";
import { prisma } from "@/lib/prisma";
import { deleteHalaqa } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "إدارة الحلقات",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  created: "تمت إضافة الحلقة بنجاح.",
  updated: "تم تعديل بيانات الحلقة بنجاح.",
  deleted: "تم حذف الحلقة بنجاح.",
  error: "تعذّر تنفيذ العملية. يرجى المحاولة مرة أخرى.",
  "student-added": "تم إضافة الطالب إلى الحلقة.",
  "student-removed": "تم إزالة الطالب من الحلقة.",
};

type HalaqasPageProps = {
  searchParams: Promise<{ q?: string; flash?: string }>;
};

export default async function HalaqasPage({ searchParams }: HalaqasPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;

  const halaqas = await prisma.halaqa.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { teacher: { name: { contains: q } } },
            { days: { contains: q } },
            { time: { contains: q } },
          ],
        }
      : undefined,
    include: {
      teacher: { select: { name: true, email: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ time: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">إدارة الحلقات</h1>
          <p className="mt-1 text-sm text-brand-700">
            إنشاء وتعديل وحذف الحلقات، تعيين المعلمين، وإدارة طلاب كل حلقة.
          </p>
        </div>
        <Link
          href="/admin/halaqas/new"
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          إضافة حلقة
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

      <form
        method="get"
        className="flex flex-col gap-3 rounded-2xl border border-brand-900/10 bg-white p-4 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:flex-row"
      >
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="ابحث باسم الحلقة أو المعلم أو الأيام أو الوقت"
          className="flex-1 rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          بحث
        </button>
        <Link
          href="/admin/halaqas"
          className="rounded-xl border border-brand-900/15 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          إعادة تعيين
        </Link>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">الحلقة</th>
              <th className="px-4 py-3">المعلم</th>
              <th className="px-4 py-3">الأيام</th>
              <th className="px-4 py-3">الوقت</th>
              <th className="px-4 py-3">الطلاب</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {halaqas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-600">
                  لا توجد حلقات مطابقة للبحث.
                </td>
              </tr>
            ) : (
              halaqas.map((halaqa) => (
                <tr key={halaqa.id} className="align-top">
                  <td className="px-4 py-3 font-bold text-brand-950">
                    {halaqa.name}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {halaqa.teacher.name}
                  </td>
                  <td className="px-4 py-3 text-brand-700">{halaqa.days}</td>
                  <td className="px-4 py-3 text-brand-700" dir="ltr">
                    {halaqa.time}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {halaqa._count.enrollments} / {halaqa.maxStudents}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/halaqas/${halaqa.id}`}
                        className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                      >
                        التفاصيل
                      </Link>
                      <Link
                        href={`/admin/halaqas/${halaqa.id}/edit`}
                        className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                      >
                        تعديل
                      </Link>
                      <DeleteButton
                        action={deleteHalaqa}
                        id={halaqa.id}
                        label="حذف"
                        confirmMessage={`هل أنت متأكد من حذف الحلقة ${halaqa.name}؟`}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">الجدول الأسبوعي</h2>
        <p className="mt-1 text-sm text-brand-700">
          الحلقات مرتبة حسب الوقت، مع أيامها وعدد طلابها.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-900/10 text-sm">
            <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
              <tr>
                <th className="px-4 py-3">الوقت</th>
                <th className="px-4 py-3">الحلقة</th>
                <th className="px-4 py-3">المعلم</th>
                <th className="px-4 py-3">الأيام</th>
                <th className="px-4 py-3">الاشغال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/5">
              {halaqas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-600">
                    لا توجد حلقات.
                  </td>
                </tr>
              ) : (
                halaqas.map((halaqa) => (
                  <tr key={halaqa.id}>
                    <td className="px-4 py-3 font-medium text-brand-950" dir="ltr">
                      {halaqa.time}
                    </td>
                    <td className="px-4 py-3 text-brand-700">{halaqa.name}</td>
                    <td className="px-4 py-3 text-brand-700">
                      {halaqa.teacher.name}
                    </td>
                    <td className="px-4 py-3 text-brand-700">{halaqa.days}</td>
                    <td className="px-4 py-3 text-brand-700">
                      {halaqa._count.enrollments}/{halaqa.maxStudents}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-brand-600">عدد النتائج: {halaqas.length}</p>
    </div>
  );
}
