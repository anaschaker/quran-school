import { logoutAction } from "@/lib/actions/auth";

type Highlight = {
  title: string;
  description: string;
};

type RoleDashboardProps = {
  name: string;
  roleLabel: string;
  title: string;
  description: string;
  highlights: Highlight[];
};

export function RoleDashboard({
  name,
  roleLabel,
  title,
  description,
  highlights,
}: RoleDashboardProps) {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="ornamental-glow absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gold-200">
              <span className="size-1.5 rounded-full bg-gold-400" />
              {roleLabel}
            </span>

            <h1 className="mt-5 text-3xl font-bold leading-snug sm:text-4xl">
              أهلًا، {name}
            </h1>

            <p className="mt-3 max-w-2xl leading-8 text-brand-100/85">
              {description}
            </p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-gold-400/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="size-4"
                aria-hidden="true"
              >
                <path
                  d="M12.5 6.5V4.8c0-.7-.6-1.3-1.3-1.3H5c-.7 0-1.3.6-1.3 1.3v10.4c0 .7.6 1.3 1.3 1.3h6.2c.7 0 1.3-.6 1.3-1.3v-1.7M9 10h7.5m0 0-2.5-2.5M16.5 10 14 12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              تسجيل الخروج
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-brand-950">{title}</h2>
            <p className="mt-1 text-sm text-brand-700">
              لوحة مبدئية — ستُضاف الأدوات التفصيلية في المراحل القادمة.
            </p>
          </div>
          <span className="rounded-full border border-gold-500/40 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-800">
            قيد التطوير
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-30px_rgba(8,37,28,0.4)]"
            >
              <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-900/10">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 5.5h12M4 10h12M4 14.5h7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <h3 className="text-base font-bold text-brand-950">
                {highlight.title}
              </h3>
              <p className="mt-1.5 text-sm leading-7 text-brand-700">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
