"use client";

import { useActionState } from "react";

import type { AccountActionState } from "@/lib/actions/account";

type AccountPasswordFormProps = {
  action: (
    state: AccountActionState,
    formData: FormData,
  ) => Promise<AccountActionState>;
};

const initialState: AccountActionState = { success: false };

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}

export function AccountPasswordForm({ action }: AccountPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      key={state.submissionId ?? "account-password-form"}
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

      <div className="space-y-2">
        <label
          htmlFor="current-password"
          className="block text-sm font-bold text-brand-900"
        >
          كلمة المرور الحالية
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
          aria-describedby={
            state.fieldErrors?.currentPassword
              ? "current-password-error"
              : undefined
          }
          className={inputClassName(state.fieldErrors?.currentPassword)}
        />
        {state.fieldErrors?.currentPassword ? (
          <p
            id="current-password-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {state.fieldErrors.currentPassword}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="new-password"
          className="block text-sm font-bold text-brand-900"
        >
          كلمة المرور الجديدة
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.newPassword)}
          aria-describedby={
            state.fieldErrors?.newPassword ? "new-password-error" : undefined
          }
          className={inputClassName(state.fieldErrors?.newPassword)}
        />
        {state.fieldErrors?.newPassword ? (
          <p
            id="new-password-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {state.fieldErrors.newPassword}
          </p>
        ) : null}
        <p className="text-xs text-brand-500">
          8 أحرف على الأقل.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirm-password"
          className="block text-sm font-bold text-brand-900"
        >
          تأكيد كلمة المرور الجديدة
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          aria-describedby={
            state.fieldErrors?.confirmPassword
              ? "confirm-password-error"
              : undefined
          }
          className={inputClassName(state.fieldErrors?.confirmPassword)}
        />
        {state.fieldErrors?.confirmPassword ? (
          <p
            id="confirm-password-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {state.fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
      </button>
    </form>
  );
}
