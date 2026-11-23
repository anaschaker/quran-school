"use client";

import { useActionState } from "react";

import { addStudentToHalaqa, type ActionResult } from "@/lib/actions/admin";

type StudentOption = {
  id: string;
  name: string;
  email: string;
};

type AddStudentToHalaqaFormProps = {
  halaqaId: string;
  students: StudentOption[];
  isFull: boolean;
};

const initialState: ActionResult = { success: false };

export function AddStudentToHalaqaForm({
  halaqaId,
  students,
  isFull,
}: AddStudentToHalaqaFormProps) {
  const [state, formAction, isPending] = useActionState(
    addStudentToHalaqa,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label
            htmlFor="studentId"
            className="block text-sm font-bold text-brand-900"
          >
            إضافة طالب
          </label>
          <select
            id="studentId"
            name="studentId"
            required
            disabled={isFull || students.length === 0}
            className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            defaultValue=""
          >
            <option value="">— اختر طالبًا —</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending || isFull || students.length === 0}
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الإضافة..." : "إضافة"}
        </button>
      </div>

      {isFull ? (
        <p className="text-xs font-medium text-red-700">
          تم بلوغ الحد الأقصى للطلاب في هذه الحلقة.
        </p>
      ) : null}

      {!isFull && students.length === 0 ? (
        <p className="text-xs text-brand-600">
          جميع الطلاب مسجلون في هذه الحلقة.
        </p>
      ) : null}
    </form>
  );
}
