import type { Metadata } from "next";
import Link from "next/link";

import { school } from "@/config/school";

export const metadata: Metadata = {
  title: { absolute: school.name },
  description: "الصفحة المطلوبة غير موجودة.",
};

export default function NotFound() {
  return (
    <main className="flex-1">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-28">
        <span className="rounded-full border border-gold-500/40 bg-gold-50 px-4 py-1.5 text-xs font-semibold text-gold-800">
          خطأ ٤٠٤
        </span>

        <h1 className="mt-6 text-5xl font-bold text-brand-950 sm:text-6xl">
          الصفحة غير موجودة
        </h1>

        <p className="mt-4 max-w-xl leading-8 text-brand-700">
          عذرًا، الصفحة التي تبحث عنها غير متاحة أو ربما نُقلت إلى مكان آخر.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500"
        >
          العودة إلى الصفحة الرئيسية
          <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
            <path
              d="M15 10H5m4-4-4 4 4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </section>
    </main>
  );
}
