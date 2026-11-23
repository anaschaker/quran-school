"use client";

import { useActionState } from "react";

import { submitExcuse } from "@/lib/actions/excuses";
import type { ActionResult } from "@/lib/actions/admin";

const initialState: ActionResult = { success: false };

export function ExcuseForm({ childOptions }: { childOptions: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(submitExcuse, initialState);

  if (state.success && state.message) {
    return (
      <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.message}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="excuse-student" className="block text-sm font-bold text-brand-900">
            الطالب
          </label>
          <select
            id="excuse-student"
            name="studentId"
            required
            className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
          >
            {childOptions.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.studentId ? (
            <p className="text-xs font-medium text-red-700">{state.fieldErrors.studentId}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="excuse-date" className="block text-sm font-bold text-brand-900">
            التاريخ
          </label>
          <input
            id="excuse-date"
            name="date"
            type="date"
            required
            className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
          />
          {state.fieldErrors?.date ? (
            <p className="text-xs font-medium text-red-700">{state.fieldErrors.date}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="excuse-reason" className="block text-sm font-bold text-brand-900">
          السبب
        </label>
        <textarea
          id="excuse-reason"
          name="reason"
          rows={3}
          required
          maxLength={500}
          className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
          placeholder="سبب الغياب"
        />
        {state.fieldErrors?.reason ? (
          <p className="text-xs font-medium text-red-700">{state.fieldErrors.reason}</p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ الإرسال..." : "إرسال عذر"}
      </button>
    </form>
  );
}
