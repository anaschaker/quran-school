"use client";

import { useActionState } from "react";

import type { ActionResult } from "@/lib/validations/admin";

type FeePlanFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial?: {
    id?: string;
    name?: string;
    amount?: string;
    period?: string;
  };
  submitLabel: string;
};

const initialState: ActionResult = { success: false };

const periods = [
  { value: "MONTHLY", label: "شهري" },
  { value: "TERM", label: "فصلي" },
  { value: "YEARLY", label: "سنوي" },
];

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}

export function FeePlanForm({
  action,
  initial,
  submitLabel,
}: FeePlanFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form
      key={state.submissionId ?? initial?.id ?? "fee-plan-form"}
      action={formAction}
      className="space-y-4"
      noValidate
    >
      {initial?.id ? (
        <input type="hidden" name="feePlanId" value={initial.id} />
      ) : null}

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

      <div className="space-y-2">
        <label
          htmlFor="fee-plan-name"
          className="block text-sm font-bold text-brand-900"
        >
          اسم الخطة
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <input
          id="fee-plan-name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={values.name ?? initial?.name ?? ""}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "fee-plan-name-error" : undefined}
          className={inputClassName(errors.name)}
        />
        {errors.name ? (
          <p
            id="fee-plan-name-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="fee-plan-amount"
            className="block text-sm font-bold text-brand-900"
          >
            المبلغ (بالدولار الأمريكي)
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="fee-plan-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={values.amount ?? initial?.amount ?? ""}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? "fee-plan-amount-error" : undefined}
            className={inputClassName(errors.amount)}
          />
          {errors.amount ? (
            <p
              id="fee-plan-amount-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.amount}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="fee-plan-period"
            className="block text-sm font-bold text-brand-900"
          >
            الدورية
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <select
            id="fee-plan-period"
            name="period"
            required
            defaultValue={values.period ?? initial?.period ?? "MONTHLY"}
            aria-invalid={Boolean(errors.period)}
            aria-describedby={errors.period ? "fee-plan-period-error" : undefined}
            className={inputClassName(errors.period)}
          >
            {periods.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.period ? (
            <p
              id="fee-plan-period-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.period}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ الحفظ..." : submitLabel}
      </button>
    </form>
  );
}
