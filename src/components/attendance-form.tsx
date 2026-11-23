"use client";

import { useActionState } from "react";

import { saveAttendance, type ActionResult } from "@/lib/actions/teacher";

type AttendanceStudent = {
  id: string;
  name: string;
  stage: string;
  status: string;
};

type AttendanceFormProps = {
  halaqaId: string;
  date: string;
  students: AttendanceStudent[];
};

const initialState: ActionResult = { success: false };

const attendanceStatuses = [
  { value: "PRESENT", label: "حاضر" },
  { value: "ABSENT", label: "غائب" },
  { value: "LATE", label: "متأخر" },
  { value: "EXCUSED", label: "بعذر" },
];

export function AttendanceForm({ halaqaId, date, students }: AttendanceFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveAttendance,
    initialState,
  );

  return (
    <form
      key={state.submissionId ?? "attendance-form"}
      action={formAction}
      className="space-y-5"
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <label
            htmlFor="attendance-date"
            className="block text-sm font-bold text-brand-900"
          >
            تاريخ الحضور
          </label>
          <input
            id="attendance-date"
            name="date"
            type="date"
            defaultValue={date}
            className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الحفظ..." : "حفظ الحضور"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
        <table className="min-w-full divide-y divide-brand-900/10 text-sm">
          <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
            <tr>
              <th className="px-4 py-3">الطالب</th>
              <th className="px-4 py-3">المرحلة</th>
              <th className="px-4 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/5">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-3 font-bold text-brand-950">
                  {student.name}
                </td>
                <td className="px-4 py-3 text-brand-700">{student.stage}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {attendanceStatuses.map((status) => (
                      <label key={status.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name={`status_${student.id}`}
                          value={status.value}
                          defaultChecked={student.status === status.value}
                          className="peer sr-only"
                        />
                        <span className="inline-flex rounded-full border border-brand-900/15 px-3 py-1 text-xs font-semibold text-brand-700 transition peer-checked:border-brand-900 peer-checked:bg-brand-900 peer-checked:text-white">
                          {status.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
