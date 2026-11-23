import type { Metadata } from "next";
import Link from "next/link";

import { AnnouncementForm } from "@/components/announcement-form";
import { createAnnouncement } from "@/lib/actions/announcements";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "إضافة إعلان",
};

export const instant = false;

export default async function NewAnnouncementPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/announcements"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← إدارة الإعلانات
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-brand-950">إضافة إعلان</h1>
        <p className="mt-1 text-sm text-brand-700">
          اكتب الإعلان وحدد الجمهور الذي سيظهر له.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <AnnouncementForm
          action={createAnnouncement}
          submitLabel="نشر الإعلان"
        />
      </div>
    </div>
  );
}
