import Link from "next/link";

import { navigation, school } from "@/config/school";
import { APP_VERSION } from "@/lib/version";

import type { SchoolSettings } from "@/lib/school-settings-shared";

import { Logo } from "./logo";

type SiteFooterProps = {
  settings: SchoolSettings;
};

export function SiteFooter({ settings }: SiteFooterProps) {
  const phoneHref = `tel:${settings.phone.replace(/[^\\d+]/g, "")}`;

  return (
    <footer className="mt-auto border-t border-brand-900/10 bg-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-900 text-gold-300">
                <Logo className="size-5" />
              </span>
              <div>
                <p className="text-base font-bold text-brand-950">{settings.name}</p>
                <p className="text-xs text-brand-600">{school.tagline}</p>
              </div>
            </div>
            <p className="max-w-xs text-sm leading-7 text-brand-700">
              {school.description}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-brand-950">روابط سريعة</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-brand-700 underline-offset-4 transition-colors hover:text-brand-950 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="text-brand-700 underline-offset-4 transition-colors hover:text-brand-950 hover:underline"
                >
                  تسجيل الدخول
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-brand-950">تواصل معنا</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-brand-700">
              <li>
                <a
                  href={phoneHref}
                  dir="ltr"
                  className="inline-flex items-center gap-2 underline-offset-4 hover:text-brand-950 hover:underline"
                >
                  <PhoneIcon />
                  {settings.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${school.email}`}
                  className="inline-flex items-center gap-2 underline-offset-4 hover:text-brand-950 hover:underline"
                >
                  <MailIcon />
                  {school.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <LocationIcon />
                <span>{settings.address}</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-brand-950">ساعات الدوام</h2>
            <ul className="mt-3 space-y-2 text-sm text-brand-700">
              {settings.hours.map((entry) => (
                <li
                  key={entry.days}
                  className="flex items-center justify-between gap-3 border-b border-brand-900/5 pb-2 last:border-0"
                >
                  <span>{entry.days}</span>
                  <span className="text-xs font-medium text-brand-600">
                    {entry.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-brand-900/10 pt-5 text-xs text-brand-600 sm:flex-row">
          <p className="text-center sm:text-start">
            © {settings.name}. جميع الحقوق محفوظة.
          </p>
          <p className="flex items-center gap-2">
            <span>الإصدار</span>
            <span
              dir="ltr"
              className="rounded-full border border-brand-900/10 bg-brand-50 px-2.5 py-0.5 font-mono text-[0.7rem] font-semibold text-brand-800"
            >
              {APP_VERSION}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4 shrink-0" aria-hidden="true">
      <path
        d="M6.2 3.5 4.4 4.6c-.6.4-.9 1.1-.7 1.8.8 4.6 4.5 8.3 9.1 9.1.7.1 1.4-.2 1.8-.8l1-1.7c.3-.5.1-1.1-.4-1.4l-2.3-1.1c-.4-.2-.9-.1-1.2.3l-.8 1a10.8 10.8 0 0 1-4.2-4.2l1-.8c.4-.3.5-.8.3-1.2L6.9 3.9c-.2-.4-.5-.5-.7-.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4 shrink-0" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 6 6 4.5L16 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 size-4 shrink-0" aria-hidden="true">
      <path
        d="M10 17s5-4.4 5-8a5 5 0 1 0-10 0c0 3.6 5 8 5 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="9" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
