import type { Metadata } from "next";
import Link from "next/link";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteResource } from "@/lib/actions/resources";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "المواد التعليمية",
};

export const instant = false;

const TYPE_LABELS: Record<string, string> = {
  PDF: "PDF",
  AUDIO: "صوت",
  LINK: "رابط",
  TEXT: "نص",
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const type = params.type?.trim() ?? "";

  // تحديد الحلقات المسموح بها.
  let halaqaIds: string[] | null = null; // null = all

  if (session.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (student) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        select: { halaqaId: true },
      });
      halaqaIds = enrollments.map((e) => e.halaqaId);
    } else {
      halaqaIds = [];
    }
  } else if (session.role === "PARENT") {
    const children = await prisma.student.findMany({
      where: { parentId: session.userId },
      select: { id: true },
    });
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: { in: children.map((c) => c.id) } },
      select: { halaqaId: true },
    });
    halaqaIds = Array.from(new Set(enrollments.map((e) => e.halaqaId)));
  } else if (session.role === "TEACHER") {
    const halaqas = await prisma.halaqa.findMany({
      where: { teacherId: session.userId },
      select: { id: true },
    });
    halaqaIds = halaqas.map((h) => h.id);
  }

  const where: Record<string, unknown> = {
    ...(type ? { type } : {}),
    ...(q ? { title: { contains: q } } : {}),
  };

  if (halaqaIds !== null) {
    const orList: Record<string, unknown>[] = [
      { halaqaId: { in: halaqaIds } },
      { halaqaId: null },
    ];
    if (session.role === "TEACHER") {
      orList.push({ uploadedBy: session.userId });
    }
    (where as { OR?: unknown }).OR = orList;
  }

  // المعلم/المدير: additionally own uploads always included (already via OR for teacher).
  if (session.role === "TEACHER") {
    // ensure uploadedBy included
  }

  const resources = await prisma.resource.findMany({
    where,
    include: {
      halaqa: { select: { name: true } },
      uploader: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">المواد التعليمية</h1>
          <p className="mt-1 text-sm text-brand-700">مواد يرفعها المعلمون (PDF، صوت، روابط، نصوص).</p>
        </div>
        {(session.role === "TEACHER" || session.role === "ADMIN") ? (
          <Link
            href="/resources/new"
            className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            رفع مادة
          </Link>
        ) : null}
      </div>

      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="ابحث بالعنوان"
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        />
        <select
          name="type"
          defaultValue={type}
          className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
        >
          <option value="">جميع الأنواع</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          بحث
        </button>
      </form>

      <div className="space-y-3">
        {resources.length === 0 ? (
          <p className="text-sm text-brand-600">لا توجد مواد مطابقة.</p>
        ) : (
          resources.map((res) => (
            <div
              key={res.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-900/10 bg-white p-4 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-brand-950">{res.title}</p>
                {res.description ? (
                  <p className="text-xs text-brand-600">{res.description}</p>
                ) : null}
                <p className="text-xs text-brand-500">
                  {TYPE_LABELS[res.type]} — {res.halaqa?.name ?? "عام"} — {res.uploader.name}
                </p>
              </div>
              <div className="flex gap-2">
                {res.type === "LINK" && res.url ? (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                  >
                    فتح الرابط
                  </a>
                ) : res.type === "TEXT" ? (
                  <span className="text-xs text-brand-700">{res.content}</span>
                ) : (
                  <a
                    href={`/resources/${res.id}/download`}
                    className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                  >
                    تحميل
                  </a>
                )}
                {(session.role === "ADMIN" || res.uploadedBy === session.userId) ? (
                  <form action={deleteResource}>
                    <input type="hidden" name="id" value={res.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50"
                    >
                      حذف
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
