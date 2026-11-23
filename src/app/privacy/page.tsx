import type { Metadata } from "next";

import { getSchoolSettings } from "@/lib/school-settings";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
};

export default async function PrivacyPage() {
  const settings = await getSchoolSettings();
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="text-2xl font-bold text-brand-950">سياسة الخصوصية</h1>
      <p className="mt-1 text-sm text-brand-700">{settings.name}</p>

      <div className="mt-6 space-y-4 text-sm leading-7 text-brand-800">
        <p>
          نحترم خصوصية المستخدمين، وخصوصًا بيانات الأطفال. تُستخدم البيانات
          (الاسم، تاريخ الميلاد، المرحلة، معلومات ولي الأمر) فقط لتقديم
          خدمات المدرسة (الحضور، التسميع، الرسوم، الإشعارات).
        </p>
        <p>
          تُحفظ البيانات في قاعدة بيانات آمنة (SQLite) على خادم المدرسة، ولا
          تُشارك مع أطراف ثالثة. يمكن لولي الأمر طلب الاطلاع/التصحيح/الحذف
          عبر التواصل مع الإدارة.
        </p>
        <p>
          <strong>ملاحظة:</strong> هذا النص مبدئي ويحتاج مراجعة المدرسة
          والجهة القانونية قبل الإطلاق.
        </p>
      </div>
    </main>
  );
}
