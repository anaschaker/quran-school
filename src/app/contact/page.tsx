import type { Metadata } from "next";

import { ContactForm } from "@/components/contact-form";
import { school } from "@/config/school";
import { getSchoolSettings, phoneHref } from "@/lib/school-settings";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSchoolSettings();
  return {
    title: "تواصل معنا",
    description: `معلومات التواصل مع ${settings.name} ونموذج لإرسال الرسائل والاستفسارات.`,
  };
}

export default async function ContactPage() {
  const settings = await getSchoolSettings();

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="ornamental-glow absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gold-200">
            <span className="size-1.5 rounded-full bg-gold-400" />
            تواصل معنا
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-snug sm:text-5xl">
            نسعد بتواصلك
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-brand-100/85 sm:text-lg">
            {school.contact.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr] lg:items-start">
          <div className="space-y-4">
            <article className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
              <h2 className="text-lg font-bold text-brand-950">
                معلومات التواصل
              </h2>

              <ul className="mt-4 space-y-4 text-sm text-brand-700">
                <li className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                    <PhoneIcon />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-brand-500">الهاتف</p>
                    <a
                      href={phoneHref(settings.phone)}
                      dir="ltr"
                      className="mt-0.5 inline-block font-semibold text-brand-900 underline-offset-4 hover:underline"
                    >
                      {settings.phone}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                    <MailIcon />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-brand-500">
                      البريد الإلكتروني
                    </p>
                    <a
                      href={`mailto:${school.email}`}
                      className="mt-0.5 inline-block font-semibold text-brand-900 underline-offset-4 hover:underline"
                    >
                      {school.email}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                    <LocationIcon />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-brand-500">العنوان</p>
                    <p className="mt-0.5 font-semibold text-brand-900">
                      {settings.address}
                    </p>
                  </div>
                </li>
              </ul>
            </article>

            <article className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
              <h2 className="flex items-center gap-2 text-lg font-bold text-brand-950">
                <ClockIcon />
                ساعات الدوام
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-brand-700">
                {settings.hours.map((entry) => (
                  <li
                    key={entry.days}
                    className="flex items-center justify-between gap-3 border-b border-brand-900/5 pb-2.5 last:border-0 last:pb-0"
                  >
                    <span>{entry.days}</span>
                    <span className="text-xs font-semibold text-brand-600">
                      {entry.time}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl bg-brand-50 px-3.5 py-3 text-xs leading-6 text-brand-700">
                {school.contact.responseNote}
              </p>
            </article>
          </div>

          <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(8,37,28,0.4)] sm:p-8">
            <h2 className="text-xl font-bold text-brand-950 sm:text-2xl">
              أرسل رسالة
            </h2>
            <p className="mt-2 text-sm leading-7 text-brand-700">
              املأ الحقول التالية وسنعود إليك في أقرب وقت. الحقول المعلّمة بـ
              <span className="text-red-600"> * </span>
              مطلوبة.
            </p>

            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
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
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 6 6 4.5L16 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <path
        d="M10 17s5-4.4 5-8a5 5 0 1 0-10 0c0 3.6 5 8 5 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="9" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4 text-gold-600" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6.5V10l2.5 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
