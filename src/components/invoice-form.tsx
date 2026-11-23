"use client";

import { useActionState } from "react";

import type { ActionResult } from "@/lib/validations/admin";

type InvoiceFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  students: { id: string; name: string }[];
  halaqas: { id: string; name: string }[];
  feePlans: { id: string; name: string; amount: number }[];
  submitLabel: string;
};

const initialState: ActionResult = { success: false };

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}

export function InvoiceForm({
  action,
  students,
  halaqas,
  feePlans,
  submitLabel,
}: InvoiceFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form
      key={state.submissionId ?? "invoice-form"}
      action={formAction}
      className="space-y-4"
      noValidate
    >
      {state.message ? (
        <div
          role={state.success ? "status" : "alert"}
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            state.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="invoice-student"
            className="block text-sm font-bold text-brand-900"
          >
            طالب (اختياري)
          </label>
          <select
            id="invoice-student"
            name="studentId"
            defaultValue={values.studentId ?? ""}
            className={inputClassName(errors.studentId)}
          >
            <option value="">— اختر طالبًا —</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
          {errors.studentId ? (
            <p role="alert" className="text-xs font-medium text-red-700">
              {errors.studentId}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="invoice-halaqa"
            className="block text-sm font-bold text-brand-900"
          >
            حلقة (لإنشاء فواتير لجميع طلابها)
          </label>
          <select
            id="invoice-halaqa"
            name="halaqaId"
            defaultValue={values.halaqaId ?? ""}
            className={inputClassName(errors.halaqaId)}
          >
            <option value="">— اختر حلقة —</option>
            {halaqas.map((halaqa) => (
              <option key={halaqa.id} value={halaqa.id}>
                {halaqa.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="invoice-plan"
            className="block text-sm font-bold text-brand-900"
          >
            خطة الرسوم
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <select
            id="invoice-plan"
            name="feePlanId"
            required
            defaultValue={values.feePlanId ?? ""}
            aria-invalid={Boolean(errors.feePlanId)}
            aria-describedby={errors.feePlanId ? "invoice-plan-error" : undefined}
            className={inputClassName(errors.feePlanId)}
          >
            <option value="">— اختر خطة —</option>
            {feePlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.amount})
              </option>
            ))}
          </select>
          {errors.feePlanId ? (
            <p
              id="invoice-plan-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.feePlanId}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="invoice-amount"
            className="block text-sm font-bold text-brand-900"
          >
            المبلغ (بالدولار الأمريكي)
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="invoice-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={values.amount ?? ""}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? "invoice-amount-error" : undefined}
            className={inputClassName(errors.amount)}
          />
          {errors.amount ? (
            <p
              id="invoice-amount-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.amount}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="invoice-due-date"
            className="block text-sm font-bold text-brand-900"
          >
            تاريخ الاستحقاق
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="invoice-due-date"
            name="dueDate"
            type="date"
            required
            defaultValue={values.dueDate ?? ""}
            aria-invalid={Boolean(errors.dueDate)}
            aria-describedby={errors.dueDate ? "invoice-due-date-error" : undefined}
            className={inputClassName(errors.dueDate)}
          />
          {errors.dueDate ? (
            <p
              id="invoice-due-date-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.dueDate}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ الإنشاء..." : submitLabel}
      </button>
    </form>
  );
}
