import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { school } from "@/config/school";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/session";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: `تسجيل الدخول إلى بوابة ${school.name}.`,
};

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect(ROLE_HOME[session.role]);
  }

  return (
    <main className="flex-1">
      <section className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand-950 p-8 text-white shadow-[0_25px_70px_-35px_rgba(8,37,28,0.6)] sm:p-10">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="ornamental-glow absolute inset-0" aria-hidden="true" />

          <div className="relative flex h-full flex-col">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold-400/30 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gold-200">
              <span className="size-1.5 rounded-full bg-gold-400" />
              بوابة المدرسة
            </span>

            <h1 className="mt-6 text-3xl font-bold leading-snug sm:text-4xl">
              مرحبًا بك في {school.name}
            </h1>

            <p className="mt-4 max-w-md leading-8 text-brand-100/85">
              سجّل الدخول للوصول إلى لوحة التحكم الخاصة بدورك: المدير، المعلم،
              الطالب، أو ولي الأمر.
            </p>

            <p className="mt-auto rounded-2xl border border-gold-400/25 bg-white/[0.04] px-5 py-4 text-xl leading-relaxed text-gold-100">
              ﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾
            </p>

            <div className="mt-8 flex flex-wrap gap-2 text-xs text-brand-200">
              {["إدارة المدرسة", "الحلقات والتسميع", "متابعة الطلاب", "تواصل أولياء الأمور"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-900/10 bg-white p-6 shadow-[0_20px_60px_-35px_rgba(8,37,28,0.35)] sm:p-10">
          <h2 className="text-2xl font-bold text-brand-950">تسجيل الدخول</h2>
          <p className="mt-2 text-sm leading-7 text-brand-700">
            أدخل بيانات حسابك للوصول إلى لوحة التحكم. يُقبل البريد الإلكتروني
            أو رقم الهاتف.
          </p>

          <LoginForm />

          <p className="mt-6 border-t border-brand-900/10 pt-5 text-center text-xs leading-6 text-brand-600">
            بعد تسجيل الدخول سيتم توجيهك تلقائيًا إلى لوحة التحكم المناسبة لدورك.
          </p>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-brand-700 underline-offset-4 hover:text-brand-950 hover:underline"
            >
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
