import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnnouncementForm } from "@/components/announcement-form";
import { updateAnnouncement } from "@/lib/actions/announcements";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "تعديل إعلان",
};

export const instant = false;

type EditAnnouncementPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAnnouncementPage({
  params,
}: EditAnnouncementPageProps) {
  await requireRole("ADMIN");
  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/announcements"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← إدارة الإعلانات
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-brand-950">تعديل الإعلان</h1>
        <p className="mt-1 text-sm text-brand-700">
          حدّث بيانات الإعلان أو غيّر الجمهور المستهدف.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <AnnouncementForm
          action={updateAnnouncement}
          initial={{
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            audience: announcement.audience,
            date: announcement.date.toISOString().slice(0, 10),
          }}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </div>
  );
}
