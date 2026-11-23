"use client";

import { useActionState } from "react";

import type { AccountActionState } from "@/lib/actions/account";

type AccountProfileFormProps = {
  action: (
    state: AccountActionState,
    formData: FormData,
  ) => Promise<AccountActionState>;
  initial: { name: string; phone: string };
};

const initialState: AccountActionState = { success: false };

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}

export function AccountProfileForm({
  action,
  initial,
}: AccountProfileFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values ?? {};

  return (
    <form
      key={state.submissionId ?? "account-profile-form"}
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
          htmlFor="account-name"
          className="block text-sm font-bold text-brand-900"
        >
          الاسم
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <input
          id="account-name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={values.name ?? initial.name}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={
            state.fieldErrors?.name ? "account-name-error" : undefined
          }
          className={inputClassName(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name ? (
          <p
            id="account-name-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="account-phone"
          className="block text-sm font-bold text-brand-900"
        >
          الهاتف
        </label>
        <input
          id="account-phone"
          name="phone"
          type="text"
          maxLength={30}
          defaultValue={values.phone ?? initial.phone}
          aria-invalid={Boolean(state.fieldErrors?.phone)}
          aria-describedby={
            state.fieldErrors?.phone ? "account-phone-error" : undefined
          }
          className={inputClassName(state.fieldErrors?.phone)}
        />
        {state.fieldErrors?.phone ? (
          <p
            id="account-phone-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {state.fieldErrors.phone}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ الحفظ..." : "حفظ الملف الشخصي"}
      </button>
    </form>
  );
}
