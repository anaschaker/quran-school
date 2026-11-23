"use client";

import { useActionState } from "react";

import {
  createExam,
  type ActionResult,
} from "@/lib/actions/exams";

type ExamStudent = {
  id: string;
  name: string;
  stage: string;
};

type ExamFormProps = {
  halaqaId: string;
  halaqaName: string;
  students: ExamStudent[];
  defaultDate: string;
  backHref: string;
};

const initialState: ActionResult = { success: false };

export function ExamForm({
  halaqaId,
  halaqaName,
  students,
  defaultDate,
  backHref,
}: ExamFormProps) {
  const [state, formAction, isPending] = useActionState(
    createExam,
    initialState,
  );

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form
      key={state.submissionId ?? "exam-form"}
      action={formAction}
      className="space-y-6"
      noValidate
    >
      <input type="hidden" name="halaqaId" value={halaqaId} />

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

      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="exam-title"
              className="block text-sm font-bold text-brand-900"
            >
              عنوان الاختبار
              <span className="text-red-600" aria-hidden="true">
                {" "}
                *
              </span>
            </label>
            <input
              id="exam-title"
              name="title"
              type="text"
              required
              maxLength={150}
              defaultValue={values.title ?? ""}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "exam-title-error" : undefined}
              className={inputClassName(errors.title)}
              placeholder={`اختبار ${halaqaName}`}
            />
            {errors.title ? (
              <p
                id="exam-title-error"
                role="alert"
                className="text-xs font-medium text-red-700"
              >
                {errors.title}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="exam-date"
              className="block text-sm font-bold text-brand-900"
            >
              تاريخ الاختبار
              <span className="text-red-600" aria-hidden="true">
                {" "}
                *
              </span>
            </label>
            <input
              id="exam-date"
              name="date"
              type="date"
              required
              defaultValue={values.date ?? defaultDate}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "exam-date-error" : undefined}
              className={inputClassName(errors.date)}
            />
            {errors.date ? (
              <p
                id="exam-date-error"
                role="alert"
                className="text-xs font-medium text-red-700"
              >
                {errors.date}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">الطالب</th>
              <th className="px-4 py-3">المرحلة</th>
              <th className="px-4 py-3">الدرجة (0 - 100)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-brand-600"
                >
                  لا يوجد طلاب مسجلون في هذه الحلقة.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3 font-bold text-brand-950">
                    {student.name}
                  </td>
                  <td className="px-4 py-3 text-brand-700">{student.stage}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      name={`score_${student.id}`}
                      min={0}
                      max={100}
                      step="0.5"
                      inputMode="decimal"
                      aria-label={`درجة ${student.name}`}
                      placeholder="اتركها فارغة إذا لم يحضر"
                      className="w-40 rounded-xl border border-brand-900/15 bg-white px-3 py-2 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-brand-600">
          يمكنك ترك درجة الطالب فارغة إذا لم يؤدِّ الاختبار. تُحسب المتوسطات من
          الدرجات المُدخلة فقط.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={backHref}
            className="inline-flex items-center justify-center rounded-xl border border-brand-900/15 px-5 py-3 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
          >
            إلغاء
          </a>
          <button
            type="submit"
            disabled={isPending || students.length === 0}
            className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : "حفظ الاختبار والدرجات"}
          </button>
        </div>
      </div>
    </form>
  );
}

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}
