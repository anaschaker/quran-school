import { Role } from "@prisma/client";
import Link from "next/link";

import { ProgramCard } from "@/components/program-card";
import { school } from "@/config/school";
import { getSchoolSettings } from "@/lib/school-settings";
import { prisma } from "@/lib/prisma";

// الصفحة تعرض إحصائيات وإعلانات حيّة من قاعدة البيانات.
export const instant = false;

const numberFormatter = new Intl.NumberFormat("ar-EG");
const announcementDateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const audienceLabels: Record<string, string> = {
  ALL: "للجميع",
  TEACHERS: "للمعلمين",
  STUDENTS: "للطلاب",
  PARENTS: "لأولياء الأمور",
};

type HomeData = {
  studentCount: number;
  halaqaCount: number;
  teacherCount: number;
  announcements: {
    id: string;
    title: string;
    content: string;
    date: Date;
    audience: string;
  }[];
};

async function getHomeData(): Promise<HomeData> {
  try {
    const [studentCount, halaqaCount, teacherCount, announcements] =
      await Promise.all([
        prisma.student.count({ where: { status: { not: "ARCHIVED" } } }),
        prisma.halaqa.count(),
        prisma.user.count({ where: { role: Role.TEACHER } }),
        prisma.announcement.findMany({
          take: 3,
          orderBy: { date: "desc" },
          select: {
            id: true,
            title: true,
            content: true,
            date: true,
            audience: true,
          },
        }),
      ]);

    return { studentCount, halaqaCount, teacherCount, announcements };
  } catch (error) {
    console.error("تعذّر تحميل بيانات الصفحة الرئيسية:", error);
    return {
      studentCount: 0,
      halaqaCount: 0,
      teacherCount: 0,
      announcements: [],
    };
  }
}

export default async function Home() {
  const settings = await getSchoolSettings();
  const { studentCount, halaqaCount, teacherCount, announcements } =
    await getHomeData();

  const stats = [
    {
      label: "طالب مسجّل",
      value: studentCount,
      icon: <StudentsIcon />,
    },
    {
      label: "حلقة قرآنية",
      value: halaqaCount,
      icon: <HalaqaIcon />,
    },
    {
      label: "معلم متخصص",
      value: teacherCount,
      icon: <TeacherIcon />,
    },
  ];

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="ornamental-glow absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-200">
              <span className="size-1.5 rounded-full bg-gold-400" />
              {school.hero.eyebrow}
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.3] text-white sm:text-6xl">
              {settings.name}
            </h1>

            <p className="mt-6 text-2xl leading-relaxed text-gold-100 sm:text-3xl">
              {school.hero.verse}
            </p>
            <p className="mt-1 text-xs font-medium text-brand-300">
              {school.hero.verseReference}
            </p>

            <p className="mt-6 max-w-2xl text-base leading-8 text-brand-100/85 sm:text-lg">
              {school.hero.description}
            </p>

            <p className="mt-4 max-w-xl border-r-2 border-gold-500/60 pr-4 text-sm leading-7 text-brand-200">
              {school.hero.motivation}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-brand-950 transition-colors hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
              >
                استكشف البرامج
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
              >
                تواصل معنا
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-gold-400/40 bg-gold-500/10 px-6 py-3 text-sm font-bold text-gold-300 transition-colors hover:bg-gold-500/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
              >
                سجّل الآن
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-brand-900/10 bg-white p-3 text-center shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-5"
            >
              <span className="mx-auto flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-800 sm:size-11">
                {stat.icon}
              </span>
              <p className="mt-2 text-2xl font-bold text-brand-950 sm:text-3xl">
                {numberFormatter.format(stat.value)}
              </p>
              <p className="mt-0.5 text-[0.65rem] font-medium text-brand-600 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-14 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-wide text-gold-700">
              برامجنا
            </span>
            <h2 className="mt-1 text-2xl font-bold text-brand-950 sm:text-3xl">
              مسارات تعليمية متكاملة
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-brand-700">
              برامج مصممة لتناسب مختلف الأعمار والمستويات، من أول خطوة في
              التلاوة إلى إتمام الحفظ والمراجعة.
            </p>
          </div>
          <Link
            href="/programs"
            className="hidden shrink-0 text-sm font-bold text-brand-800 underline-offset-4 hover:underline sm:block"
          >
            عرض جميع البرامج
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {school.programs.map((program) => (
            <ProgramCard
              key={program.slug}
              program={program}
              href={`/programs#${program.slug}`}
            />
          ))}
        </div>

        <Link
          href="/programs"
          className="mt-5 inline-flex text-sm font-bold text-brand-800 underline-offset-4 hover:underline sm:hidden"
        >
          عرض جميع البرامج
        </Link>
      </section>

      <section className="border-y border-brand-900/10 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold tracking-wide text-gold-700">
                آخر المستجدات
              </span>
              <h2 className="mt-1 text-2xl font-bold text-brand-950 sm:text-3xl">
                الإعلانات الأخيرة
              </h2>
            </div>
            <span className="rounded-full border border-brand-900/10 bg-brand-50 px-3 py-1 text-[0.65rem] font-semibold text-brand-600">
              محدّثة من قاعدة البيانات
            </span>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-2xl border border-brand-900/10 bg-brand-50/40 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-brand-600">
                      <span className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-gold-700 ring-1 ring-gold-500/30">
                        {audienceLabels[announcement.audience] ?? "للجميع"}
                      </span>
                      <time dateTime={announcement.date.toISOString()}>
                        {announcementDateFormatter.format(announcement.date)}
                      </time>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-brand-950">
                      {announcement.title}
                    </h3>
                    <p className="mt-1 line-clamp-3 text-sm leading-7 text-brand-700">
                      {announcement.content}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
                  لا توجد إعلانات منشورة حاليًا. تابعنا قريبًا.
                </p>
              )}
            </div>

            <aside className="relative overflow-hidden rounded-2xl bg-brand-900 p-6 text-white">
              <div className="ornamental-glow absolute inset-0" aria-hidden="true" />
              <div className="relative">
                <h3 className="text-xl font-bold">هل لديك سؤال؟</h3>
                <p className="mt-2 text-sm leading-7 text-brand-100/85">
                  فريق المدرسة جاهز للإجابة عن استفساراتك حول البرامج والتسجيل
                  والمواعيد.
                </p>
                <Link
                  href="/contact"
                  className="mt-5 inline-flex rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-brand-950 transition-colors hover:bg-gold-400"
                >
                  أرسل رسالة
                </Link>
                <p
                  dir="ltr"
                  className="mt-5 text-sm font-semibold text-brand-200"
                >
                  {settings.phone}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function StudentsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 19c.4-3 2.7-5 5.5-5s5.1 2 5.5 5M15.5 5.5a2.5 2.5 0 0 1 0 5M17 14c2.1.4 3.6 2.2 4 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HalaqaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M12 6.2c-1.9-1.3-4.3-1.8-7-1.6v13.5c2.7-.2 5.1.3 7 1.6 1.9-1.3 4.3-1.8 7-1.6V4.6c-2.7-.2-5.1.3-7 1.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 6.2v13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TeacherIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <circle cx="12" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5.5 19.5c.4-3.4 3-5.7 6.5-5.7s6.1 2.3 6.5 5.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M4 4.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
