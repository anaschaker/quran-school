import type { Metadata } from "next";
import Link from "next/link";

import { DeleteButton } from "@/components/delete-button";
import { prisma } from "@/lib/prisma";
import { deleteTeacher } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "إدارة المعلمين",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  created: "تمت إضافة المعلم بنجاح.",
  updated: "تم تعديل بيانات المعلم بنجاح.",
  deleted: "تم حذف المعلم بنجاح.",
  error: "تعذّر تنفيذ العملية. يرجى المحاولة مرة أخرى.",
  "teacher-has-dependencies":
    "لا يمكن حذف المعلم لأنه مرتبط بحلقات أو سجلات تسميع.",
};

type TeachersPageProps = {
  searchParams: Promise<{ q?: string; flash?: string }>;
};

export default async function TeachersPage({ searchParams }: TeachersPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;

  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: {
        select: {
          halaqas: true,
          recitations: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">إدارة المعلمين</h1>
          <p className="mt-1 text-sm text-brand-700">
            إضافة معلمين وتعديل بياناتهم وحذفهم، مع التحقق من الارتباطات.
          </p>
        </div>
        <Link
          href="/admin/teachers/new"
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          إضافة معلم
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
          placeholder="ابحث بالاسم أو البريد أو الهاتف"
          className="flex-1 rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          بحث
        </button>
        <Link
          href="/admin/teachers"
          className="rounded-xl border border-brand-900/15 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          إعادة تعيين
        </Link>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">المعلم</th>
              <th className="px-4 py-3">البريد / الهاتف</th>
              <th className="px-4 py-3">الحلقات</th>
              <th className="px-4 py-3">التسميع</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-600">
                  لا يوجد معلمون مطابقون للبحث.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="align-top">
                  <td className="px-4 py-3 font-bold text-brand-950">
                    {teacher.name}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    <p dir="ltr" className="text-xs">
                      {teacher.email}
                    </p>
                    {teacher.phone ? (
                      <p dir="ltr" className="text-xs">
                        {teacher.phone}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {teacher._count.halaqas}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {teacher._count.recitations}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/teachers/${teacher.id}/edit`}
                        className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                      >
                        تعديل
                      </Link>
                      <DeleteButton
                        action={deleteTeacher}
                        id={teacher.id}
                        label="حذف"
                        confirmMessage={`هل أنت متأكد من حذف المعلم ${teacher.name}؟`}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-brand-600">عدد النتائج: {teachers.length}</p>
    </div>
  );
}
