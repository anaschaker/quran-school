import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { AddStudentToHalaqaForm } from "@/components/add-student-to-halaqa-form";
import { DeleteButton } from "@/components/delete-button";
import { HalaqaExams } from "@/components/halaqa-exams";
import { prisma } from "@/lib/prisma";
import { removeStudentFromHalaqa } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "تفاصيل الحلقة",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  "student-added": "تم إضافة الطالب إلى الحلقة.",
  "student-removed": "تم إزالة الطالب من الحلقة.",
  "exam-created": "تم إنشاء الاختبار وحفظ الدرجات بنجاح.",
  error: "تعذّر تنفيذ العملية. يرجى المحاولة مرة أخرى.",
};

type HalaqaDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string }>;
};

export default async function HalaqaDetailPage({
  params,
  searchParams,
}: HalaqaDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const flash = sp.flash ? FLASH_MESSAGES[sp.flash] : undefined;

  const halaqa = await prisma.halaqa.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, name: true, email: true, phone: true } },
      enrollments: {
        include: {
          student: {
            include: {
              user: true,
              parent: true,
            },
          },
        },
        orderBy: { enrolledAt: "asc" },
      },
      exams: {
        include: {
          results: {
            include: { student: { include: { user: true } } },
            orderBy: { score: "desc" },
          },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!halaqa) {
    notFound();
  }

  const enrolledStudentIds = halaqa.enrollments.map(
    (enrollment) => enrollment.studentId,
  );

  const availableStudents = await prisma.student.findMany({
    where:
      enrolledStudentIds.length > 0
        ? { id: { notIn: enrolledStudentIds }, status: { not: "ARCHIVED" } }
        : { status: { not: "ARCHIVED" } },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const isFull = halaqa.enrollments.length >= halaqa.maxStudents;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/halaqas"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← إدارة الحلقات
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">{halaqa.name}</h1>
          <p className="mt-1 text-sm text-brand-700">
            تفاصيل الحلقة وطلابها وإدارتهم.
          </p>
        </div>
        <Link
          href={`/admin/halaqas/${halaqa.id}/edit`}
          className="inline-flex items-center justify-center rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
        >
          تعديل الحلقة
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="المعلم" value={halaqa.teacher.name} />
        <InfoCard label="الوقت" value={halaqa.time} dir="ltr" />
        <InfoCard label="الأيام" value={halaqa.days} />
        <InfoCard
          label="الاشغال"
          value={`${halaqa.enrollments.length} / ${halaqa.maxStudents}`}
        />
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">معلومات المعلم</h2>
        <dl className="mt-3 grid gap-3 text-sm text-brand-700 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold text-brand-500">الاسم</dt>
            <dd className="mt-0.5 font-medium text-brand-900">
              {halaqa.teacher.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-brand-500">البريد</dt>
            <dd className="mt-0.5 font-medium text-brand-900" dir="ltr">
              {halaqa.teacher.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-brand-500">الهاتف</dt>
            <dd className="mt-0.5 font-medium text-brand-900" dir="ltr">
              {halaqa.teacher.phone ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <HalaqaExams
        exams={halaqa.exams}
        createHref={`/admin/halaqas/${halaqa.id}/exams/new`}
      />

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">إضافة طالب</h2>
        <p className="mt-1 text-sm text-brand-700">
          {isFull
            ? "تم بلوغ الحد الأقصى. أزل طالبًا أو زد الحد الأقصى لاستقبال المزيد."
            : "اختر طالبًا لإضافته إلى الحلقة. منع تجاوز الحد الأقصى تلقائي."}
        </p>

        <div className="mt-4">
          <AddStudentToHalaqaForm
            halaqaId={halaqa.id}
            students={availableStudents.map((student) => ({
              id: student.id,
              name: student.user.name,
              email: student.user.email,
            }))}
            isFull={isFull}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">الطالب</th>
              <th className="px-4 py-3">المرحلة</th>
              <th className="px-4 py-3">ولي الأمر</th>
              <th className="px-4 py-3">تاريخ التسجيل</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {halaqa.enrollments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-600">
                  لا يوجد طلاب مسجلون في هذه الحلقة.
                </td>
              </tr>
            ) : (
              halaqa.enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-bold text-brand-950">
                      {enrollment.student.user.name}
                    </p>
                    <p className="text-xs text-brand-600" dir="ltr">
                      {enrollment.student.user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {enrollment.student.stage}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {enrollment.student.parent
                      ? enrollment.student.parent.name
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {new Intl.DateTimeFormat("ar-EG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(enrollment.enrolledAt)}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton
                      action={removeStudentFromHalaqa}
                      id={enrollment.studentId}
                      label="إزالة"
                      confirmMessage={`هل أنت متأكد من إزالة ${enrollment.student.user.name} من الحلقة؟`}
                      hiddenFields={{ halaqaId: halaqa.id }}
                    />
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

function InfoCard({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="rounded-2xl border border-brand-900/10 bg-white p-4 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
      <p className="text-xs font-semibold text-brand-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-brand-950" dir={dir}>
        {value}
      </p>
    </div>
  );
}
