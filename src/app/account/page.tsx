import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountPasswordForm } from "@/components/account-password-form";
import { AccountProfileForm } from "@/components/account-profile-form";
import { changePassword, updateAccountProfile, updateHijriPreference, updateNotificationPreference, updateWhatsAppConsent } from "@/lib/actions/account";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/session";

export const metadata: Metadata = {
  title: "حسابي",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  profile: "تم تحديث الملف الشخصي بنجاح.",
  password: "تم تغيير كلمة المرور بنجاح.",
};

type AccountPageProps = {
  searchParams: Promise<{ flash?: string; force?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;
  const forced = params.force === "1" || session.mustChangePassword;

  const [user, emailPref] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        mustChangePassword: true,
        whatsappConsent: true,
        showHijri: true,
      },
    }),
    prisma.notificationPreference.findUnique({
      where: { userId_channel: { userId: session.userId, channel: "EMAIL" } },
      select: { enabled: true },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-950">حسابي</h1>
            <p className="mt-1 text-sm text-brand-700">
              {user.name} — {ROLE_LABEL[user.role]}
            </p>
            <p className="mt-0.5 text-xs text-brand-500" dir="ltr">
              {user.email}
            </p>
          </div>

          {forced ? (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
            >
              يجب تغيير كلمة المرور المؤقتة قبل متابعة استخدام النظام.
            </div>
          ) : null}

          {flash ? (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            >
              {flash}
            </div>
          ) : null}

          <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">
              الملف الشخصي
            </h2>
            <p className="mt-1 text-sm text-brand-700">
              عدّل الاسم ورقم الهاتف.
            </p>
            <div className="mt-4">
              <AccountProfileForm
                action={updateAccountProfile}
                initial={{ name: user.name, phone: user.phone ?? "" }}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">
              تغيير كلمة المرور
            </h2>
            <p className="mt-1 text-sm text-brand-700">
              أدخل كلمة المرور الحالية ثم كلمة مرور جديدة (8 أحرف على الأقل).
            </p>
            <div className="mt-4">
              <AccountPasswordForm action={changePassword} />
            </div>
          </section>

          <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">
              تفضيلات الإشعارات (البريد الإلكتروني)
            </h2>
            <p className="mt-1 text-sm text-brand-700">
              اختر ما تريد استقباله على بريدك الإلكتروني.
            </p>
            <form action={updateNotificationPreference} className="mt-4 flex items-center gap-3">
              <input type="hidden" name="channel" value="EMAIL" />
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={emailPref?.enabled ?? false}
                  className="size-4 rounded border-brand-900/20"
                />
                تفعيل إشعارات البريد الإلكتروني
              </label>
              <button
                type="submit"
                className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800"
              >
                حفظ
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">
              موافقة واتساب
            </h2>
            <p className="mt-1 text-sm text-brand-700">
              الموافقة على استقبال إشعارات غياب الطالب وتذكير الرسوم عبر واتساب.
            </p>
            <form action={updateWhatsAppConsent} className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                <input
                  type="checkbox"
                  name="consent"
                  defaultChecked={user.whatsappConsent}
                  className="size-4 rounded border-brand-900/20"
                />
                أوافق على استقبال رسائل واتساب
              </label>
              <button
                type="submit"
                className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800"
              >
                حفظ
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">
              عرض التقويم الهجري
            </h2>
            <p className="mt-1 text-sm text-brand-700">
              عرض التاريخ الهجري (أم القرى) بجانب الميلادي.
            </p>
            <form action={updateHijriPreference} className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={user.showHijri}
                  className="size-4 rounded border-brand-900/20"
                />
                تفعيل عرض الهجري
              </label>
              <button
                type="submit"
                className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800"
              >
                حفظ
              </button>
            </form>
          </section>

          <div className="text-sm">
            <Link
              href={
                session.role === "ADMIN"
                  ? "/admin"
                  : session.role === "TEACHER"
                    ? "/teacher"
                    : session.role === "STUDENT"
                      ? "/student"
                      : "/parent"
              }
              className="font-bold text-brand-800 underline-offset-4 hover:underline"
            >
              العودة إلى لوحة التحكم
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
