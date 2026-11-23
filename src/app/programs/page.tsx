import type { Metadata } from "next";
import Link from "next/link";

import { ProgramCard } from "@/components/program-card";
import { school } from "@/config/school";
import { getSchoolSettings } from "@/lib/school-settings";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSchoolSettings();
  return {
    title: "البرامج",
    description: `استكشف البرامج التعليمية في ${settings.name}: الحفظ والتجويد والمراجعة والتلاوة.`,
  };
}

export default function ProgramsPage() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="ornamental-glow absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gold-200">
            <span className="size-1.5 rounded-full bg-gold-400" />
            البرامج التعليمية
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-snug sm:text-5xl">
            مسارات تناسب كل مستوى
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-brand-100/85 sm:text-lg">
            أربعة برامج أساسية تجمع بين الحفظ والتجويد والمراجعة والتلاوة، مع
            متابعة مستمرة من معلمي الحلقات.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {school.programs.map((program) => (
            <div key={program.slug} id={program.slug} className="scroll-mt-24">
              <ProgramCard program={program} detailed />
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-brand-900/10 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-brand-950">كيف تبدأ؟</h2>
          <ol className="mt-4 grid gap-4 text-sm leading-7 text-brand-700 sm:grid-cols-3">
            <li>
              <span className="mb-2 flex size-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">
                1
              </span>
              تواصل مع الإدارة للاستفسار عن البرامج والمواعيد المتاحة.
            </li>
            <li>
              <span className="mb-2 flex size-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">
                2
              </span>
              نحدّد المستوى المناسب بعد لقاء تعريفي بسيط مع المعلم.
            </li>
            <li>
              <span className="mb-2 flex size-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">
                3
              </span>
              يبدأ الطالب رحلته في الحلقة مع متابعة دورية للأسرة.
            </li>
          </ol>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand-900 p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold">جاهز للانضمام؟</h2>
            <p className="mt-1 text-sm text-brand-100/85">
              أرسل استفسارك وسيتواصل معك فريق المدرسة.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-brand-950 transition-colors hover:bg-gold-400"
          >
            تواصل معنا
          </Link>
        </div>
      </section>
    </main>
  );
}
