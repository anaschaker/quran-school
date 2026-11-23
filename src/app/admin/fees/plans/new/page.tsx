import type { Metadata } from "next";
import Link from "next/link";

import { FeePlanForm } from "@/components/fee-plan-form";
import { createFeePlan } from "@/lib/actions/fees";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "إضافة خطة رسوم",
};

export const instant = false;

export default async function NewFeePlanPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/fees"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← الرسوم
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-brand-950">إضافة خطة رسوم</h1>
        <p className="mt-1 text-sm text-brand-700">
          عرّف خطة رسوم (شهري/فصلي/سنوي) لاستخدامها في إنشاء الفواتير.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8">
        <FeePlanForm action={createFeePlan} submitLabel="حفظ الخطة" />
      </div>
    </div>
  );
}
