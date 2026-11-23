"use client";

import { useActionState } from "react";

import { formatMoney } from "@/lib/school-settings-shared";
import type { ActionResult } from "@/lib/validations/admin";

type PaymentFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  invoiceId: string;
  currency: string;
  exchangeRate: number;
  remaining: number;
  submitLabel: string;
};

const initialState: ActionResult = { success: false };

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}

export function PaymentForm({
  action,
  invoiceId,
  currency,
  exchangeRate,
  remaining,
  submitLabel,
}: PaymentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      key={state.submissionId ?? "payment-form"}
      action={formAction}
      className="space-y-4"
      noValidate
    >
      <input type="hidden" name="invoiceId" value={invoiceId} />

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

      <p className="text-sm text-brand-700">
        المتبقي:{" "}
        <span className="font-bold">
          {formatMoney(remaining, { currency, exchangeRate })}
        </span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="payment-amount"
            className="block text-sm font-bold text-brand-900"
          >
            المبلغ (بالدولار الأمريكي)
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="payment-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={values.amount ?? ""}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? "payment-amount-error" : undefined}
            className={inputClassName(errors.amount)}
          />
          {errors.amount ? (
            <p
              id="payment-amount-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.amount}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="payment-date"
            className="block text-sm font-bold text-brand-900"
          >
            التاريخ
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="payment-date"
            name="date"
            type="date"
            required
            defaultValue={values.date ?? today}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "payment-date-error" : undefined}
            className={inputClassName(errors.date)}
          />
          {errors.date ? (
            <p
              id="payment-date-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.date}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="payment-method"
            className="block text-sm font-bold text-brand-900"
          >
            طريقة الدفع
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <select
            id="payment-method"
            name="method"
            required
            defaultValue={values.method ?? "CASH"}
            aria-invalid={Boolean(errors.method)}
            aria-describedby={errors.method ? "payment-method-error" : undefined}
            className={inputClassName(errors.method)}
          >
            <option value="CASH">نقدي</option>
            <option value="TRANSFER">تحويل</option>
          </select>
          {errors.method ? (
            <p
              id="payment-method-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.method}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="payment-note"
            className="block text-sm font-bold text-brand-900"
          >
            ملاحظة
          </label>
          <textarea
            id="payment-note"
            name="note"
            rows={3}
            maxLength={300}
            defaultValue={values.note ?? ""}
            className={inputClassName(errors.note)}
          />
          {errors.note ? (
            <p role="alert" className="text-xs font-medium text-red-700">
              {errors.note}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ التسجيل..." : submitLabel}
      </button>
    </form>
  );
}
