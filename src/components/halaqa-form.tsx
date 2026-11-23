"use client";

import { useActionState } from "react";

import {
  type ActionResult,
} from "@/lib/actions/admin";
import type { HalaqaFormValues } from "@/lib/validations/admin";

type TeacherOption = {
  id: string;
  name: string;
  email: string;
};

type HalaqaFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  teachers: TeacherOption[];
  initial?: Partial<HalaqaFormValues> & { id?: string };
  submitLabel: string;
};

const initialState: ActionResult = { success: false };

export function HalaqaForm({
  action,
  teachers,
  initial,
  submitLabel,
}: HalaqaFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form
      key={state.submissionId ?? initial?.id ?? "halaqa-form"}
      action={formAction}
      className="space-y-6"
      noValidate
    >
      {initial?.id ? (
        <input type="hidden" name="halaqaId" value={initial.id} />
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
        <Field id="name" label="اسم الحلقة" error={errors.name} required>
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
            placeholder="حلقة النور"
          />
        </Field>

        <Field
          id="teacherId"
          label="المعلم"
          error={errors.teacherId}
          required
        >
          <select
            id="teacherId"
            name="teacherId"
            required
            defaultValue={values.teacherId ?? initial?.teacherId ?? ""}
            aria-invalid={Boolean(errors.teacherId)}
            aria-describedby={errors.teacherId ? "teacherId-error" : undefined}
            className={inputClassName(errors.teacherId)}
          >
            <option value="">— اختر المعلم —</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.email})
              </option>
            ))}
          </select>
        </Field>

        <Field id="time" label="الوقت" error={errors.time} required>
          <input
            id="time"
            name="time"
            type="text"
            required
            maxLength={100}
            defaultValue={values.time ?? initial?.time ?? ""}
            aria-invalid={Boolean(errors.time)}
            aria-describedby={errors.time ? "time-error" : undefined}
            className={inputClassName(errors.time)}
            placeholder="16:00 - 17:30"
          />
        </Field>

        <Field
          id="maxStudents"
          label="الحد الأقصى للطلاب"
          error={errors.maxStudents}
          required
        >
          <input
            id="maxStudents"
            name="maxStudents"
            type="number"
            required
            min={1}
            max={200}
            defaultValue={values.maxStudents ?? initial?.maxStudents ?? 15}
            aria-invalid={Boolean(errors.maxStudents)}
            aria-describedby={errors.maxStudents ? "maxStudents-error" : undefined}
            className={inputClassName(errors.maxStudents)}
          />
        </Field>
      </div>

      <Field id="days" label="الأيام" error={errors.days} required>
        <input
          id="days"
          name="days"
          type="text"
          required
          maxLength={200}
          defaultValue={values.days ?? initial?.days ?? ""}
          aria-invalid={Boolean(errors.days)}
          aria-describedby={errors.days ? "days-error" : undefined}
          className={inputClassName(errors.days)}
          placeholder="السبت، الاثنين، الأربعاء"
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-brand-600">
          أدخل الأيام مفصولة بفاصلة (،) والوقت كما يُعرض للطلاب.
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
