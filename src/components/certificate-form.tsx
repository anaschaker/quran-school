"use client";

import { useActionState } from "react";

import type { ActionResult } from "@/lib/validations/admin";

type CertificateFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  students: { id: string; name: string }[];
  submitLabel: string;
};

const initialState: ActionResult = { success: false };

const types = [
  { value: "PART_COMPLETION", label: "ختم جزء" },
  { value: "FULL_QURAN", label: "ختم القرآن" },
  { value: "EXCELLENCE", label: "تفوق" },
  { value: "ATTENDANCE", label: "حضور" },
];

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}

export function CertificateForm({
  action,
  students,
  submitLabel,
}: CertificateFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form
      key={state.submissionId ?? "certificate-form"}
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
          htmlFor="certificate-student"
          className="block text-sm font-bold text-brand-900"
        >
          الطالب
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <select
          id="certificate-student"
          name="studentId"
          required
          defaultValue={values.studentId ?? ""}
          aria-invalid={Boolean(errors.studentId)}
          aria-describedby={
            errors.studentId ? "certificate-student-error" : undefined
          }
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
          <p
            id="certificate-student-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {errors.studentId}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="certificate-type"
          className="block text-sm font-bold text-brand-900"
        >
          نوع الشهادة
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <select
          id="certificate-type"
          name="type"
          required
          defaultValue={values.type ?? "PART_COMPLETION"}
          aria-invalid={Boolean(errors.type)}
          aria-describedby={errors.type ? "certificate-type-error" : undefined}
          className={inputClassName(errors.type)}
        >
          {types.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.type ? (
          <p
            id="certificate-type-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {errors.type}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="certificate-title"
          className="block text-sm font-bold text-brand-900"
        >
          عنوان الشهادة
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <input
          id="certificate-title"
          name="title"
          type="text"
          required
          maxLength={150}
          defaultValue={values.title ?? ""}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "certificate-title-error" : undefined}
          className={inputClassName(errors.title)}
          placeholder="شهادة ختم جزء عمّ"
        />
        {errors.title ? (
          <p
            id="certificate-title-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {errors.title}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ الإصدار..." : submitLabel}
      </button>
    </form>
  );
}
