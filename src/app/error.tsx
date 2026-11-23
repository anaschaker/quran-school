"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("حدث خطأ في الصفحة:", error);
  }, [error]);

  return (
    <main className="flex-1">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-28">
        <span className="rounded-full border border-gold-500/40 bg-gold-50 px-4 py-1.5 text-xs font-semibold text-gold-800">
          خطأ ٥٠٠
        </span>

        <h1 className="mt-6 text-4xl font-bold text-brand-950 sm:text-5xl">
          حدث خطأ غير متوقع
        </h1>

        <p className="mt-4 max-w-xl leading-8 text-brand-700">
          تعذّر إتمام العملية في الوقت الحالي. يمكنك إعادة المحاولة، وإذا استمرت
          المشكلة فتواصل مع إدارة المدرسة.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-brand-900/15 bg-white px-6 py-3 text-sm font-bold text-brand-900 transition-colors hover:border-gold-500/50"
          >
            العودة إلى الرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
