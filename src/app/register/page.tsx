import type { Metadata } from "next";

import { RegistrationForm } from "@/components/registration-form";
import { getSchoolSettings } from "@/lib/school-settings";

export const metadata: Metadata = {
  title: "التسجيل",
};

export const instant = false;

export default async function RegisterPage() {
  const settings = await getSchoolSettings();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-brand-50">
          طلب تسجيل طالب جديد
        </h1>
        <p className="mt-1 text-sm text-brand-700 dark:text-brand-200">
          املأ النموذج أدناه. سنتواصل معك بعد مراجعة الطلب.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8 dark:border-brand-200/20 dark:bg-brand-900">
        <RegistrationForm />
      </div>

      <p className="mt-4 text-xs text-brand-600 dark:text-brand-300">
        {settings.name} — {settings.phone}
      </p>
    </main>
  );
}
