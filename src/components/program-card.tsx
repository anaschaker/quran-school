import Link from "next/link";

import type { SchoolProgram } from "@/config/school";

type ProgramCardProps = {
  program: SchoolProgram;
  detailed?: boolean;
  href?: string;
};

export function ProgramCard({ program, detailed = false, href }: ProgramCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.55)] transition-colors hover:border-gold-500/40">
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-900/10 transition-colors group-hover:bg-gold-50 group-hover:text-gold-700">
        <ProgramIcon icon={program.icon} />
      </span>

      <h3 className="mt-4 text-lg font-bold text-brand-950">{program.title}</h3>
      <p className="mt-2 text-sm leading-7 text-brand-700">{program.summary}</p>

      {detailed ? (
        <p className="mt-3 text-sm leading-7 text-brand-600">{program.description}</p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[0.65rem] font-semibold text-brand-700">
          {program.level}
        </span>

        {href ? (
          <Link
            href={href}
            className="text-xs font-bold text-brand-800 underline-offset-4 hover:underline"
          >
            عرض البرنامج
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function ProgramIcon({ icon }: { icon: string }) {
  const className = "size-5";

  if (icon === "tajweed") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path
          d="M4 12h2m12 0h2M7.5 8.5v7M12 5.5v13M16.5 8.5v7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "review") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path
          d="M19 8a7 7 0 0 0-12.4-1.2M5 16a7 7 0 0 0 12.4 1.2M19 4.5V8h-3.5M5 19.5V16h3.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "recitation") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M6 11.5a6 6 0 0 0 12 0M12 17.5V21M9 21h6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 6.2c-1.9-1.3-4.3-1.8-7-1.6v13.5c2.7-.2 5.1.3 7 1.6 1.9-1.3 4.3-1.8 7-1.6V4.6c-2.7-.2-5.1.3-7 1.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 6.2v13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
