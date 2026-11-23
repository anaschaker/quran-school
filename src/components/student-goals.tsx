import { getSurah } from "@/data/surahs";
import { cancelGoal } from "@/lib/actions/memorization";
import type { MemorizationGoalView } from "@/lib/memorization";

type StudentGoalsProps = {
  goals: MemorizationGoalView[];
  emptyMessage?: string;
  halaqaId?: string;
  showCancel?: boolean;
};

const paceClasses: Record<string, string> = {
  AHEAD: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  ON_TRACK: "bg-sky-100 text-sky-800 ring-sky-600/20",
  BEHIND: "bg-red-100 text-red-800 ring-red-600/20",
  COMPLETED: "bg-gold-100 text-gold-800 ring-gold-500/30",
};

const progressClasses: Record<string, string> = {
  AHEAD: "bg-emerald-500",
  ON_TRACK: "bg-sky-500",
  BEHIND: "bg-red-500",
  COMPLETED: "bg-gold-500",
};

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("ar-EG");

function rangeLabel(goal: MemorizationGoalView): string {
  const from = getSurah(goal.fromSurah);
  const to = getSurah(goal.toSurah);

  if (goal.fromSurah === goal.toSurah) {
    return `سورة ${from?.name ?? goal.fromSurah} — الآية ${goal.fromAyah} إلى ${goal.toAyah}`;
  }

  return `من ${from?.name ?? goal.fromSurah} (${goal.fromAyah}) إلى ${to?.name ?? goal.toSurah} (${goal.toAyah})`;
}

function remainingLabel(goal: MemorizationGoalView): string {
  if (goal.progressPercent >= 100) {
    return "تم إنجاز الهدف";
  }

  if (goal.daysRemaining < 0) {
    return `تجاوز الموعد بـ ${numberFormatter.format(Math.abs(goal.daysRemaining))} يوم`;
  }

  if (goal.daysRemaining === 0) {
    return "الموعد النهائي اليوم";
  }

  return `متبقٍ ${numberFormatter.format(goal.daysRemaining)} يوم`;
}

export function StudentGoals({
  goals,
  emptyMessage = "لا توجد خطة حفظ محددة بعد.",
  halaqaId,
  showCancel = false,
}: StudentGoalsProps) {
  if (goals.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-5 text-sm text-brand-600">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <article
          key={goal.id}
          className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-brand-950">
                {rangeLabel(goal)}
              </h3>
              <p className="mt-1 text-xs text-brand-600">
                من {dateFormatter.format(new Date(goal.startDate))} إلى{" "}
                {dateFormatter.format(new Date(goal.targetDate))}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-[0.7rem] font-bold ring-1 ${
                paceClasses[goal.pace] ?? paceClasses.ON_TRACK
              }`}
            >
              {goal.paceLabel}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-brand-700">
              <span>
                {numberFormatter.format(goal.completedAyahs)} من{" "}
                {numberFormatter.format(goal.totalAyahs)} آية
              </span>
              <span>{goal.progressPercent}%</span>
            </div>

            <div
              className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-brand-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={goal.progressPercent}
              aria-label="نسبة إنجاز خطة الحفظ"
            >
              <div
                className={`h-full rounded-full transition-all ${
                  progressClasses[goal.pace] ?? progressClasses.ON_TRACK
                }`}
                style={{ width: `${goal.progressPercent}%` }}
              />
              {goal.progressPercent < 100 ? (
                <span
                  className="absolute top-0 h-full w-0.5 bg-brand-900/40"
                  style={{ insetInlineStart: `${goal.expectedPercent}%` }}
                  title={`النسبة المتوقعة حتى الآن: ${goal.expectedPercent}%`}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-brand-600">
              المتوقع حتى الآن: {goal.expectedPercent}%
            </span>
            <span
              className={
                goal.isOverdue
                  ? "font-bold text-red-700"
                  : "font-semibold text-brand-700"
              }
            >
              {remainingLabel(goal)}
            </span>
          </div>

          {showCancel && halaqaId ? (
            <div className="mt-4 flex justify-end">
              <form action={cancelGoal}>
                <input type="hidden" name="goalId" value={goal.id} />
                <input type="hidden" name="halaqaId" value={halaqaId} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50"
                >
                  إلغاء الهدف
                </button>
              </form>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
