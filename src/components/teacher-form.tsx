"use client";

import { useActionState } from "react";

import {
  type ActionResult,
} from "@/lib/actions/admin";
import type { TeacherFormValues } from "@/lib/validations/admin";

type TeacherFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial?: Partial<TeacherFormValues> & { id?: string };
  requirePassword?: boolean;
  submitLabel: string;
};

const initialState: ActionResult = { success: false };

export function TeacherForm({
  action,
  initial,
  requirePassword = true,
  submitLabel,
}: TeacherFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form
      key={state.submissionId ?? initial?.id ?? "teacher-form"}
      action={formAction}
      className="space-y-6"
      noValidate
    >
      {initial?.id ? (
        <input type="hidden" name="teacherId" value={initial.id} />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="الاسم الكامل" error={errors.name} required>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={100}
            defaultValue={values.name ?? initial?.name ?? ""}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={inputClassName(errors.name)}
            placeholder="اسم المعلم"
          />
        </Field>

        <Field
          id="email"
          label="البريد الإلكتروني"
          error={errors.email}
          required
        >
          <input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            required
            maxLength={200}
            autoComplete="email"
            defaultValue={values.email ?? initial?.email ?? ""}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${inputClassName(errors.email)} text-left`}
            placeholder="teacher@example.com"
          />
        </Field>

        <Field id="phone" label="رقم الهاتف" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            dir="ltr"
            maxLength={30}
            autoComplete="tel"
            defaultValue={values.phone ?? initial?.phone ?? ""}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={`${inputClassName(errors.phone)} text-left`}
            placeholder="05xxxxxxxx"
          />
        </Field>

        <Field
          id="password"
          label="كلمة المرور"
          error={errors.password}
          required={requirePassword}
        >
          <input
            id="password"
            name="password"
            type="password"
            required={requirePassword}
            minLength={requirePassword ? 8 : undefined}
            maxLength={128}
            autoComplete={requirePassword ? "new-password" : "current-password"}
            defaultValue=""
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={inputClassName(errors.password)}
            placeholder={
              requirePassword
                ? "8 أحرف على الأقل"
                : "اتركها فارغة للإبقاء على كلمة المرور الحالية"
            }
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-brand-600">
          {requirePassword
            ? "كلمة المرور مطلوبة لإنشاء حساب المعلم."
            : "لن تتغير كلمة المرور إلا إذا أدخلت قيمة جديدة."}
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الحفظ..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({ id, label, error, required, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-brand-900">
        {label}
        {required ? (
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="font-normal text-brand-500"> (اختياري)</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}
