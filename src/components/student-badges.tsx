import type { StudentBadge } from "@/lib/memorization";

type StudentBadgesProps = {
  badges: StudentBadge[];
};

export function StudentBadges({ badges }: StudentBadgesProps) {
  const earnedCount = badges.filter((badge) => badge.earned).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-brand-950">شارات التحفيز</h2>
          <p className="mt-0.5 text-xs text-brand-600">
            تُمنح تلقائيًا من حضورك وحفظك، ولا تعتمد على المقارنة بين الطلاب.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-[0.65rem] font-semibold text-brand-600">
          {earnedCount} من {badges.length}
        </span>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className={`flex items-start gap-3 rounded-2xl border p-4 ${
              badge.earned
                ? "border-gold-500/40 bg-gold-50/40"
                : "border-brand-900/10 bg-brand-50/30 opacity-70"
            }`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg ${
                badge.earned
                  ? "bg-gold-100 ring-1 ring-gold-500/30"
                  : "bg-brand-100 grayscale"
              }`}
              aria-hidden="true"
            >
              {badge.earned ? badge.emoji : "🔒"}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-brand-950">
                {badge.title}
                {badge.earned ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-800">
                    مُنحت
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs leading-6 text-brand-600">
                {badge.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
