"use client";

import { useActionState } from "react";

import {
  type ActionResult,
} from "@/lib/actions/admin";
import type { StudentFormValues } from "@/lib/validations/admin";
import {
  STUDENT_STATUSES,
  STUDENT_STATUS_LABELS,
} from "@/lib/student-status";

type ParentOption = {
  id: string;
  name: string;
  email: string;
};

type StudentFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  parents: ParentOption[];
  initial?: Partial<StudentFormValues> & { id?: string };
  requirePassword?: boolean;
  submitLabel: string;
};

const initialState: ActionResult = { success: false };

export function StudentForm({
  action,
  parents,
  initial,
  requirePassword = true,
  submitLabel,
}: StudentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form
      key={state.submissionId ?? initial?.id ?? "student-form"}
      action={formAction}
      className="space-y-6"
      noValidate
    >
      {initial?.id ? (
        <input type="hidden" name="studentId" value={initial.id} />
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
            placeholder="اسم الطالب"
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
            autoComplete="email"
            defaultValue={values.email ?? initial?.email ?? ""}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${inputClassName(errors.email)} text-left`}
            placeholder="student@example.com"
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

        <Field id="birthDate" label="تاريخ الميلاد" error={errors.birthDate}>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={values.birthDate ?? initial?.birthDate ?? ""}
            aria-invalid={Boolean(errors.birthDate)}
            aria-describedby={errors.birthDate ? "birthDate-error" : undefined}
            className={inputClassName(errors.birthDate)}
          />
        </Field>

        <Field id="stage" label="المرحلة" error={errors.stage} required>
          <input
            id="stage"
            name="stage"
            type="text"
            required
            maxLength={100}
            defaultValue={values.stage ?? initial?.stage ?? ""}
            aria-invalid={Boolean(errors.stage)}
            aria-describedby={errors.stage ? "stage-error" : undefined}
            className={inputClassName(errors.stage)}
            placeholder="المرحلة الابتدائية"
          />
        </Field>

        <Field id="parentId" label="ولي الأمر" error={errors.parentId}>
          <select
            id="parentId"
            name="parentId"
            defaultValue={values.parentId ?? initial?.parentId ?? ""}
            aria-invalid={Boolean(errors.parentId)}
            aria-describedby={errors.parentId ? "parentId-error" : undefined}
            className={inputClassName(errors.parentId)}
          >
            <option value="">— بدون ولي أمر —</option>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name} ({parent.email})
              </option>
            ))}
          </select>
        </Field>

        <Field id="status" label="حالة الطالب" error={errors.status} required>
          <select
            id="status"
            name="status"
            defaultValue={
              values.status ?? initial?.status ?? "ACTIVE"
            }
            aria-invalid={Boolean(errors.status)}
            aria-describedby={errors.status ? "status-error" : undefined}
            className={inputClassName(errors.status)}
          >
            {STUDENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STUDENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="notes" label="ملاحظات" error={errors.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={500}
          defaultValue={values.notes ?? initial?.notes ?? ""}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          className={`${inputClassName(errors.notes)} resize-y`}
          placeholder="ملاحظات تربوية أو تعليمية (اختياري)"
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-brand-600">
          {requirePassword
            ? "كلمة المرور مطلوبة لإنشاء حساب الطالب."
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
