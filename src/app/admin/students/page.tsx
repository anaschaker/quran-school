import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { StudentStatus } from "@prisma/client";
import { archiveStudent, restoreStudent } from "@/lib/actions/admin";
import { STUDENT_STATUS_LABELS, STUDENT_STATUS_CLASSES } from "@/lib/student-status";

export const metadata: Metadata = {
  title: "إدارة الطلاب",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  created: "تمت إضافة الطالب بنجاح.",
  updated: "تم تعديل بيانات الطالب بنجاح.",
  archived: "تم أرشفة الطالب بنجاح.",
  restored: "تم استعادة الطالب بنجاح.",
  error: "تعذّر تنفيذ العملية. يرجى المحاولة مرة أخرى.",
};

const PAGE_SIZE = 20;

type StudentsPageProps = {
  searchParams: Promise<{
    q?: string;
    stage?: string;
    halaqa?: string;
    status?: string;
    page?: string;
    flash?: string;
  }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const stage = params.stage?.trim() ?? "";
  const halaqaId = params.halaqa?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;

  const where = {
    ...(stage ? { stage } : {}),
    ...(halaqaId ? { enrollments: { some: { halaqaId } } } : {}),
    ...(status ? { status: status as StudentStatus } : {}),
    ...(q
      ? {
          OR: [
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
            { user: { phone: { contains: q } } },
            { stage: { contains: q } },
          ],
        }
      : {}),
  };

  const [students, total, stages, halaqas] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: true,
        parent: true,
        enrollments: { include: { halaqa: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.student.count({ where }),
    prisma.student.findMany({
      select: { stage: true },
      distinct: ["stage"],
      orderBy: { stage: "asc" },
    }),
    prisma.halaqa.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">إدارة الطلاب</h1>
          <p className="mt-1 text-sm text-brand-700">
            بحث وفلترة، إضافة وتعديل وحذف، وربط كل طالب بولي أمر.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/students/export"
            className="inline-flex items-center justify-center rounded-xl border border-brand-900/15 bg-white px-5 py-2.5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
          >
            تصدير الكشف
          </a>
          <Link
            href="/admin/students/new"
            className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            إضافة طالب
          </Link>
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

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-brand-900/10 bg-white p-4 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <label className="sr-only" htmlFor="q">
          بحث
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="ابحث بالاسم أو البريد أو الهاتف أو المرحلة"
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        />

        <select
          name="stage"
          defaultValue={stage}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        >
          <option value="">جميع المراحل</option>
          {stages.map((item) => (
            <option key={item.stage} value={item.stage}>
              {item.stage}
            </option>
          ))}
        </select>

        <select
          name="halaqa"
          defaultValue={halaqaId}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        >
          <option value="">جميع الحلقات</option>
          {halaqas.map((halaqa) => (
            <option key={halaqa.id} value={halaqa.id}>
              {halaqa.name}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        >
          <option value="">جميع الحالات</option>
          {Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            بحث
          </button>
          <Link
            href="/admin/students"
            className="rounded-xl border border-brand-900/15 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            إعادة تعيين
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">الطالب</th>
              <th className="px-4 py-3">المرحلة</th>
              <th className="px-4 py-3">ولي الأمر</th>
              <th className="px-4 py-3">الحلقات</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-600">
                  لا يوجد طلاب مطابقون للبحث.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-bold text-brand-950">{student.user.name}</p>
                    <p className="text-xs text-brand-600" dir="ltr">
                      {student.user.email}
                    </p>
                    {student.user.phone ? (
                      <p className="text-xs text-brand-600" dir="ltr">
                        {student.user.phone}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-brand-700">{student.stage}</td>
                  <td className="px-4 py-3 text-brand-700">
                    {student.parent ? student.parent.name : "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {student.enrollments.length > 0
                      ? student.enrollments
                          .map((enrollment) => enrollment.halaqa.name)
                          .join("، ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                     <span
                       className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STUDENT_STATUS_CLASSES[student.status as keyof typeof STUDENT_STATUS_CLASSES]}`}
                     >
                       {STUDENT_STATUS_LABELS[student.status as keyof typeof STUDENT_STATUS_LABELS]}
                     </span>
                   </td>
<td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/students/${student.id}/edit`}
                        className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                      >
                        تعديل
                      </Link>                      {student.status === "ARCHIVED" ? (
                        <form action={restoreStudent}>
                          <input type="hidden" name="id" value={student.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50"
                          >
                            استعادة
                          </button>
                        </form>
                      ) : (
                        <form action={archiveStudent}>
                          <input type="hidden" name="id" value={student.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-700 transition-colors hover:bg-neutral-50"
                          >
                            أرشفة
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-brand-600">
          عدد النتائج: {total} (صفحة {currentPage} من {totalPages})
        </p>
        {totalPages > 1 ? (
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/admin/students?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(stage ? { stage } : {}),
                  ...(halaqaId ? { halaqa: halaqaId } : {}),
                  ...(status ? { status } : {}),
                  page: String(currentPage - 1),
                }).toString()}`}
                className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
              >
                السابق
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={`/admin/students?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(stage ? { stage } : {}),
                  ...(halaqaId ? { halaqa: halaqaId } : {}),
                  ...(status ? { status } : {}),
                  page: String(currentPage + 1),
                }).toString()}`}
                className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
              >
                التالي
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
