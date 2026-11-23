import type { Metadata } from "next";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadResourceAction } from "@/lib/actions/resources";

export const metadata: Metadata = {
  title: "رفع مادة",
};

export const instant = false;

export default async function NewResourcePage() {
  await requireRole("TEACHER");
  const halaqas = await prisma.halaqa.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
      <h1 className="text-2xl font-bold text-brand-950">رفع مادة تعليمية</h1>
      <p className="mt-1 text-sm text-brand-700">
        الحد الأقصى 10MB. الأنواع المسموحة: PDF، MP3، JPG، PNG. أو رابط/نص.
      </p>

      <form action={uploadResourceAction} className="mt-6 space-y-4" encType="multipart/form-data">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-bold text-brand-900">العنوان</label>
          <input id="title" name="title" required maxLength={100} className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25" />
        </div>
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-bold text-brand-900">الوصف (اختياري)</label>
          <textarea id="description" name="description" rows={2} maxLength={500} className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="type" className="block text-sm font-bold text-brand-900">النوع</label>
            <select id="type" name="type" className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25">
              <option value="PDF">PDF</option>
              <option value="AUDIO">صوت (MP3)</option>
              <option value="LINK">رابط</option>
              <option value="TEXT">نص</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="halaqaId" className="block text-sm font-bold text-brand-900">الحلقة (اختياري)</label>
            <select id="halaqaId" name="halaqaId" className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25">
              <option value="">عام</option>
              {halaqas.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="file" className="block text-sm font-bold text-brand-900">ملف (PDF/MP3/JPG/PNG)</label>
          <input id="file" name="file" type="file" className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25" />
        </div>
        <div className="space-y-2">
          <label htmlFor="url" className="block text-sm font-bold text-brand-900">رابط (للنوع رابط)</label>
          <input id="url" name="url" type="url" dir="ltr" className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25" />
        </div>
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-bold text-brand-900">نص (للنوع نص)</label>
          <textarea id="content" name="content" rows={4} className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25" />
        </div>
        <button type="submit" className="rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800">
          رفع
        </button>
      </form>
    </main>
  );
}
