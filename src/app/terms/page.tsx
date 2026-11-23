import type { Metadata } from "next";

import { getSchoolSettings } from "@/lib/school-settings";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
};

export default async function TermsPage() {
  const settings = await getSchoolSettings();
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="text-2xl font-bold text-brand-950">شروط الاستخدام</h1>
      <p className="mt-1 text-sm text-brand-700">{settings.name}</p>

      <div className="mt-6 space-y-4 text-sm leading-7 text-brand-800">
        <p>
          باستخدامك لهذا النظام، فإنك توافق على استخدامه بمسؤولية ولأغراض
          مرتبطة بالأنشطة التعليمية للمدرسة فقط.
        </p>
        <p>
          يُمنع مشاركة بيانات الدخول أو استخدام النظام لإرسال محتوى غير
          مناسب. تحتفظ المدرسة بحق تعليق الحسابات المخالفة.
        </p>
        <p>
          <strong>ملاحظة:</strong> هذا النص مبدئي ويحتاج مراجعة المدرسة
          والجهة القانونية قبل الإطلاق.
        </p>
      </div>
    </main>
  );
}
