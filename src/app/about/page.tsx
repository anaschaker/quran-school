import type { Metadata } from "next";
import Link from "next/link";

import { school } from "@/config/school";
import { getSchoolSettings } from "@/lib/school-settings";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSchoolSettings();
  return {
    title: "عن المدرسة",
    description: `تعرّف على ${settings.name} ورسالتها ورؤيتها وقيمها.`,
  };
}

export default async function AboutPage() {
  const settings = await getSchoolSettings();
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="ornamental-glow absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gold-200">
            <span className="size-1.5 rounded-full bg-gold-400" />
            عن المدرسة
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-snug sm:text-5xl">
            رسالةٌ تتجدّد مع كل آية
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-brand-100/85 sm:text-lg">
            {settings.aboutIntro}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex items-start gap-3 rounded-2xl border border-gold-500/30 bg-gold-50/70 p-4 sm:p-5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
            <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
              <path
                d="M10 3.2v8.1M10 14.8v.2"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <p className="text-sm leading-7 text-gold-900">
            {school.about.temporaryNote}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-brand-900/10 bg-white p-6 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-900/10">
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path
                  d="M3.5 12s3-4.5 8.5-4.5 8.5 4.5 8.5 4.5-3 4.5-8.5 4.5S3.5 12 3.5 12Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <h2 className="mt-4 text-xl font-bold text-brand-950">رؤيتنا</h2>
            <p className="mt-2 leading-8 text-brand-700">{school.about.vision}</p>
          </article>

          <article className="rounded-2xl border border-brand-900/10 bg-white p-6 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gold-50 text-gold-700 ring-1 ring-gold-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path
                  d="M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="m8.5 12 2.3 2.3 4.7-4.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h2 className="mt-4 text-xl font-bold text-brand-950">رسالتنا</h2>
            <p className="mt-2 leading-8 text-brand-700">{school.about.mission}</p>
          </article>
        </div>

        <div className="mt-8 rounded-2xl border border-brand-900/10 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-brand-950">قيمنا</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {school.about.values.map((value) => (
              <span
                key={value}
                className="rounded-full border border-brand-900/10 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-800"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand-900 p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold">تعرّف على برامجنا</h2>
            <p className="mt-1 text-sm text-brand-100/85">
              اكتشف المسارات التعليمية المناسبة لك أو لأبنائك.
            </p>
          </div>
          <Link
            href="/programs"
            className="inline-flex shrink-0 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-brand-950 transition-colors hover:bg-gold-400"
          >
            عرض البرامج
          </Link>
        </div>
      </section>
    </main>
  );
}
