import type { Metadata } from "next";
import Link from "next/link";

import { DeleteButton } from "@/components/delete-button";
import { deleteAnnouncement } from "@/lib/actions/announcements";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "إدارة الإعلانات",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  created: "تم نشر الإعلان بنجاح.",
  updated: "تم تعديل الإعلان بنجاح.",
  deleted: "تم حذف الإعلان بنجاح.",
  error: "تعذّر تنفيذ العملية. يرجى المحاولة مرة أخرى.",
};

const audienceLabels: Record<string, string> = {
  ALL: "الكل",
  TEACHERS: "المعلمون",
  STUDENTS: "الطلاب",
  PARENTS: "أولياء الأمور",
};

const audienceClasses: Record<string, string> = {
  ALL: "bg-brand-50 text-brand-800 ring-brand-900/10",
  TEACHERS: "bg-sky-50 text-sky-800 ring-sky-500/20",
  STUDENTS: "bg-emerald-50 text-emerald-800 ring-emerald-500/20",
  PARENTS: "bg-amber-50 text-amber-800 ring-amber-500/20",
};

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type AnnouncementsPageProps = {
  searchParams: Promise<{ flash?: string }>;
};

export default async function AnnouncementsPage({
  searchParams,
}: AnnouncementsPageProps) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;

  const announcements = await prisma.announcement.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">إدارة الإعلانات</h1>
          <p className="mt-1 text-sm text-brand-700">
            إضافة وتعديل وحذف الإعلانات، مع تحديد الجمهور المستهدف لكل إعلان.
          </p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
        >
          إضافة إعلان
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

      {announcements.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
          لا توجد إعلانات بعد. ابدأ بإضافة أول إعلان.
        </p>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ring-1 ${
                        audienceClasses[announcement.audience] ??
                        audienceClasses.ALL
                      }`}
                    >
                      {audienceLabels[announcement.audience] ?? "الكل"}
                    </span>
                    <time
                      dateTime={announcement.date.toISOString()}
                      className="text-xs text-brand-600"
                    >
                      {dateFormatter.format(announcement.date)}
                    </time>
                  </div>
                  <h2 className="mt-2 text-base font-bold text-brand-950">
                    {announcement.title}
                  </h2>
                  <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm leading-7 text-brand-700">
                    {announcement.content}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/admin/announcements/${announcement.id}/edit`}
                    className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                  >
                    تعديل
                  </Link>
                  <DeleteButton
                    action={deleteAnnouncement}
                    id={announcement.id}
                    label="حذف"
                    confirmMessage={`هل أنت متأكد من حذف الإعلان «${announcement.title}»؟`}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-brand-600">
        عدد الإعلانات: {announcements.length}
      </p>
    </div>
  );
}
