"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      {state.error ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="identifier"
          className="block text-sm font-bold text-brand-900"
        >
          البريد الإلكتروني أو رقم الهاتف
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          dir="ltr"
          autoComplete="username"
          required
          maxLength={320}
          placeholder="name@example.com أو 05xxxxxxxx"
          className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-start text-brand-950 shadow-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-bold text-brand-900"
        >
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          maxLength={128}
          placeholder="••••••••"
          className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-start text-brand-950 shadow-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}
