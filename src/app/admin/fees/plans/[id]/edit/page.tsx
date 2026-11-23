import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { FeePlanForm } from "@/components/fee-plan-form";
import { updateFeePlan } from "@/lib/actions/fees";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "تعديل خطة رسوم",
};

export const instant = false;

type EditFeePlanPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditFeePlanPage({
  params,
}: EditFeePlanPageProps) {
  await requireRole("ADMIN");
  const { id } = await params;

  const plan = await prisma.feePlan.findUnique({ where: { id } });

  if (!plan) {
    notFound();
  }

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
        <h1 className="text-2xl font-bold text-brand-950">تعديل خطة رسوم</h1>
        <p className="mt-1 text-sm text-brand-700">
          عدّل بيانات {plan.name}.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-8">
        <FeePlanForm
          action={updateFeePlan}
          submitLabel="حفظ التعديلات"
          initial={{
            id: plan.id,
            name: plan.name,
            amount: String(plan.amount),
            period: plan.period,
          }}
        />
      </div>
    </div>
  );
}
