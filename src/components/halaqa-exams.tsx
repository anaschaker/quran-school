import Link from "next/link";

type ExamResultItem = {
  id: string;
  score: number;
  student: { user: { name: string } };
};

type ExamItem = {
  id: string;
  title: string;
  date: Date;
  results: ExamResultItem[];
};

type HalaqaExamsProps = {
  exams: ExamItem[];
  createHref?: string;
};

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("ar-EG", {
  maximumFractionDigits: 2,
});

function getStats(results: ExamResultItem[]) {
  if (results.length === 0) {
    return { average: null, highest: null, lowest: null };
  }

  const scores = results.map((result) => result.score);

  return {
    average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
  };
}

export function HalaqaExams({ exams, createHref }: HalaqaExamsProps) {
  return (
    <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-950">الاختبارات والنتائج</h2>
          <p className="mt-0.5 text-xs text-brand-600">
            المتوسط وأعلى وأقل درجة تُحسب من درجات الطلاب المُدخلة.
          </p>
        </div>
        {createHref ? (
          <Link
            href={createHref}
            className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            إنشاء اختبار
          </Link>
        ) : null}
      </div>

      {exams.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-brand-900/15 bg-brand-50/40 p-4 text-sm text-brand-600">
          لا توجد اختبارات مسجلة لهذه الحلقة بعد.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {exams.map((exam) => {
            const { average, highest, lowest } = getStats(exam.results);

            return (
              <article
                key={exam.id}
                className="rounded-xl border border-brand-900/10 bg-brand-50/30 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-brand-950">
                      {exam.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-brand-600">
                      {dateFormatter.format(exam.date)} · {exam.results.length}{" "}
                      نتيجة
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[0.65rem] font-bold">
                    <span className="rounded-full bg-white px-2.5 py-1 text-brand-800 ring-1 ring-brand-900/10">
                      المتوسط:{" "}
                      {average === null ? "—" : numberFormatter.format(average)}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-500/20">
                      الأعلى:{" "}
                      {highest === null ? "—" : numberFormatter.format(highest)}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-red-800 ring-1 ring-red-500/20">
                      الأقل:{" "}
                      {lowest === null ? "—" : numberFormatter.format(lowest)}
                    </span>
                  </div>
                </div>

                {exam.results.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exam.results.map((result) => (
                      <span
                        key={result.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-brand-700 ring-1 ring-brand-900/10"
                      >
                        {result.student.user.name}
                        <span className="font-bold text-gold-700">
                          {numberFormatter.format(result.score)}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
