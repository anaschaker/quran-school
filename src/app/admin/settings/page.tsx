import type { Metadata } from "next";
import Link from "next/link";

import { SchoolSettingsForm } from "@/components/school-settings-form";
import { toggleWhatsAppChannel, testWhatsAppSend } from "@/lib/actions/channels";
import { updateSchoolSettings } from "@/lib/actions/settings";
import { requireRole } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/school-settings";
import { getWhatsAppEnabled } from "@/lib/channel-settings";

export const metadata: Metadata = {
  title: "إعدادات المدرسة",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  saved: "تم حفظ إعدادات المدرسة بنجاح.",
  "whatsapp-saved": "تم تحديث إعدادات واتساب.",
  "whatsapp-test-ok": "تم إرسال رسالة الاختبار بنجاح.",
  "whatsapp-test-failed": "فشل إرسال رسالة الاختبار. تحقق من الإعدادات.",
  "whatsapp-test-missing": "يرجى إدخال رقم الهاتف.",
};

type SettingsPageProps = {
  searchParams: Promise<{ flash?: string }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  await requireRole("ADMIN");

  const params = await searchParams;
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;
  const settings = await getSchoolSettings();
  const whatsappEnabled = await getWhatsAppEnabled();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">
            إعدادات المدرسة
          </h1>
          <p className="mt-1 text-sm text-brand-700">
            تعديل بيانات المدرسة (الاسم، الهاتف، العنوان، العملة وسعر الصرف،
            ساعات الدوام، ونص «عن المدرسة»). تُحفظ القيم في قاعدة البيانات، وتبقى
            `src/config/school.ts` قيماً افتراضية.
          </p>
        </div>
        <Link
          href="/about"
          className="inline-flex items-center justify-center rounded-xl border border-brand-900/15 bg-white px-5 py-2.5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
        >
          عرض صفحة «عن المدرسة»
        </Link>
      </div>

      {flash ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {flash}
        </div>
      ) : null}

      <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <SchoolSettingsForm action={updateSchoolSettings} initial={settings} />
      </section>

      <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">قناة واتساب</h2>
        <p className="mt-1 text-sm text-brand-700">
          تفعيل/تعطيل القناة (معطّلة افتراضياً). يتطلب WHATSAPP_TOKEN و
          WHATSAPP_PHONE_ID في .env.
        </p>
        <form action={toggleWhatsAppChannel} className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-brand-900">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={whatsappEnabled}
              className="size-4 rounded border-brand-900/20"
            />
            تفعيل قناة واتساب
          </label>
          <button
            type="submit"
            className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            حفظ
          </button>
        </form>

        <form action={testWhatsAppSend} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="wa-test-to"
              className="block text-xs font-bold text-brand-700"
            >
              اختبار إرسال لرقم
            </label>
            <input
              id="wa-test-to"
              name="to"
              type="tel"
              dir="ltr"
              placeholder="9665xxxxxxxx"
              className="mt-1 w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
          >
            إرسال اختبار
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-950">
              نسخة احتياطية من قاعدة البيانات
            </h2>
            <p className="mt-1 text-sm leading-6 text-brand-700">
              تحميل ملف SQLite (`.db`) يحتوي على جميع بيانات المدرسة (الطلاب،
              الحلقات، الحضور، التسميع، الرسوم، الشهادات، الإعدادات). يُنصح
              بإيقاف الخادم قبل استعادة النسخة لضمان الاتساق.
            </p>
          </div>
          <a
            href="/admin/settings/backup"
            className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            تحميل النسخة الاحتياطية
          </a>
        </div>
      </section>
    </div>
  );
}
