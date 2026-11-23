"use client";

import { useActionState } from "react";

import { submitRegistrationRequest } from "@/lib/actions/registration";
import type { ActionResult } from "@/lib/actions/admin";

const initialState: ActionResult = { success: false };

const inputClassName = (error?: string) =>
  error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-700 dark:bg-brand-900 dark:text-brand-50"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 dark:border-brand-200/20 dark:bg-brand-900 dark:text-brand-50";

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-brand-900 dark:text-brand-100">
        {label}
        {required ? (
          <span className="text-red-600" aria-hidden="true"> *</span>
        ) : (
          <span className="font-normal text-brand-500"> (اختياري)</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function RegistrationForm() {
  const [state, formAction, isPending] = useActionState(
    submitRegistrationRequest,
    initialState,
  );

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  if (state.success && state.message) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
      >
        <p className="text-lg font-bold">تم استلام طلبك</p>
        <p className="mt-2 text-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.message ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      {/* honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="studentName" label="اسم الطالب" error={errors.studentName} required>
          <input
            id="studentName"
            name="studentName"
            type="text"
            required
            maxLength={100}
            defaultValue={values.studentName ?? ""}
            className={inputClassName(errors.studentName)}
            placeholder="اسم الطالب"
          />
        </Field>

        <Field id="birthDate" label="تاريخ الميلاد" error={errors.birthDate}>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={values.birthDate ?? ""}
            className={inputClassName(errors.birthDate)}
          />
        </Field>

        <Field id="parentName" label="اسم ولي الأمر" error={errors.parentName} required>
          <input
            id="parentName"
            name="parentName"
            type="text"
            required
            maxLength={100}
            defaultValue={values.parentName ?? ""}
            className={inputClassName(errors.parentName)}
            placeholder="اسم ولي الأمر"
          />
        </Field>

        <Field id="phone" label="رقم الهاتف" error={errors.phone} required>
          <input
            id="phone"
            name="phone"
            type="tel"
            dir="ltr"
            required
            maxLength={30}
            defaultValue={values.phone ?? ""}
            className={`${inputClassName(errors.phone)} text-left`}
            placeholder="05xxxxxxxx"
          />
        </Field>

        <Field id="email" label="البريد الإلكتروني" error={errors.email} required>
          <input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            required
            maxLength={200}
            defaultValue={values.email ?? ""}
            className={`${inputClassName(errors.email)} text-left`}
            placeholder="parent@example.com"
          />
        </Field>

        <Field id="stage" label="المرحلة" error={errors.stage} required>
          <input
            id="stage"
            name="stage"
            type="text"
            required
            maxLength={100}
            defaultValue={values.stage ?? ""}
            className={inputClassName(errors.stage)}
            placeholder="المرحلة الابتدائية"
          />
        </Field>
      </div>

      <Field id="currentMemorization" label="ما يحفظه حاليًا" error={errors.currentMemorization}>
        <input
          id="currentMemorization"
          name="currentMemorization"
          type="text"
          maxLength={300}
          defaultValue={values.currentMemorization ?? ""}
          className={inputClassName(errors.currentMemorization)}
          placeholder="مثال: جزء عمّ، سورة البقرة..."
        />
      </Field>

      <Field id="notes" label="ملاحظات" error={errors.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={500}
          defaultValue={values.notes ?? ""}
          className={`${inputClassName(errors.notes)} resize-y`}
          placeholder="ملاحظات إضافية (اختياري)"
        />
      </Field>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الإرسال..." : "إرسال طلب التسجيل"}
        </button>
      </div>
    </form>
  );
}
