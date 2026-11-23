import type { Metadata } from "next";
import Link from "next/link";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSchoolSettings } from "@/lib/school-settings";

export const metadata: Metadata = {
  title: "التقويم",
};

export const instant = false;

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

const EVENT_TYPE_LABELS: Record<string, string> = {
  HOLIDAY: "إجازة",
  EXAM: "اختبار",
  OCCASION: "مناسبة",
  COURSE: "دورة",
};

const EVENT_TYPE_CLASSES: Record<string, string> = {
  HOLIDAY: "bg-emerald-100 text-emerald-800",
  EXAM: "bg-amber-100 text-amber-800",
  OCCASION: "bg-sky-100 text-sky-800",
  COURSE: "bg-gold-100 text-gold-800",
};

const AUDIENCE_FOR_ROLE: Record<string, string[]> = {
  ADMIN: ["ALL", "TEACHERS", "STUDENTS", "PARENTS"],
  TEACHER: ["ALL", "TEACHERS"],
  STUDENT: ["ALL", "STUDENTS"],
  PARENT: ["ALL", "PARENTS"],
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const settings = await getSchoolSettings();
  const showHijri = session
    ? (await prisma.user.findUnique({
        where: { id: session.userId },
        select: { showHijri: true },
      }))?.showHijri ?? false
    : false;

  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;

  const match = MONTH_PATTERN.exec(params.month ?? "");
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]);
    if (m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const prevMonth = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;

  const allowedAudiences = session ? AUDIENCE_FOR_ROLE[session.role] ?? ["ALL"] : ["ALL"];

  const [events, exams] = await Promise.all([
    prisma.event.findMany({
      where: {
        startDate: { lt: end },
        endDate: { gte: start },
        audience: { in: allowedAudiences },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.exam.findMany({
      where: { date: { gte: start, lt: end } },
      include: { halaqa: { select: { name: true } } },
      orderBy: { date: "asc" },
    }),
  ]);

  // Map date -> items
  const itemsByDate = new Map<string, { title: string; type: string }[]>();

  function add(date: Date, title: string, type: string) {
    const key = date.toISOString().slice(0, 10);
    const list = itemsByDate.get(key) ?? [];
    list.push({ title, type });
    itemsByDate.set(key, list);
  }

  for (const ev of events) {
    // add for each day in range
    const cur = new Date(ev.startDate);
    const last = new Date(ev.endDate);
    while (cur.getTime() <= last.getTime()) {
      add(cur, ev.title, ev.type);
      cur.setUTCDate(cur.getUTCDate() + 1);
      if (cur.getTime() > end.getTime()) break;
    }
  }

  for (const exam of exams) {
    add(exam.date, `${exam.title} — ${exam.halaqa.name}`, "EXAM");
  }

  const gregorianFormatter = new Intl.DateTimeFormat("ar-EG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const hijriFormatter = new Intl.DateTimeFormat("ar-SA", {
    calendar: "islamic-umalqura",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  // Build calendar grid
  const firstDayOfWeek = start.getUTCDay(); // 0 = Sunday
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayNames = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">التقويم</h1>
          <p className="mt-1 text-sm text-brand-700">
            {settings.name} — {gregorianFormatter.format(start)}
            {showHijri ? ` (${hijriFormatter.format(start)})` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/calendar?month=${prevMonth}`}
            className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
          >
            ← السابق
          </Link>
          <Link
            href={`/calendar?month=${nextMonth}`}
            className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
          >
            التالي →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <div className="grid grid-cols-7 text-center text-xs font-bold text-brand-700">
          {dayNames.map((name) => (
            <div key={name} className="border-b border-brand-900/10 bg-brand-50/70 px-2 py-2">
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="min-h-[90px] border-b border-e border-brand-900/5 bg-brand-50/20" />;
            }
            const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const items = itemsByDate.get(dateKey) ?? [];
            return (
              <div key={idx} className="min-h-[90px] border-b border-e border-brand-900/5 p-1.5">
                <div className="text-xs font-bold text-brand-900">{day}</div>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      className={`truncate rounded px-1.5 py-0.5 text-[0.65rem] font-semibold ${EVENT_TYPE_CLASSES[item.type] ?? "bg-brand-100 text-brand-800"}`}
                      title={item.title}
                    >
                      {item.title}
                    </div>
                  ))}
                  {items.length > 3 ? (
                    <div className="text-[0.6rem] text-brand-600">+{items.length - 3}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
          <span key={type} className={`rounded-full px-3 py-1 font-bold ${EVENT_TYPE_CLASSES[type]}`}>
            {label}
          </span>
        ))}
      </div>
    </main>
  );
}
