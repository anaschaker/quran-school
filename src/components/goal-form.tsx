"use client";

import { useActionState, useState } from "react";

import { getSurah, surahs } from "@/data/surahs";
import {
  createGoal,
  type ActionResult,
} from "@/lib/actions/memorization";

type GoalFormProps = {
  halaqaId: string;
  studentId: string;
  studentName: string;
  defaultStartDate: string;
  defaultTargetDate: string;
};

const initialState: ActionResult = { success: false };

export function GoalForm({
  halaqaId,
  studentId,
  studentName,
  defaultStartDate,
  defaultTargetDate,
}: GoalFormProps) {
  const [state, formAction, isPending] = useActionState(
    createGoal,
    initialState,
  );

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  const [fromSurahNumber, setFromSurahNumber] = useState(
    values.fromSurah ?? "",
  );
  const [toSurahNumber, setToSurahNumber] = useState(values.toSurah ?? "");

  const fromSurah = getSurah(Number(fromSurahNumber));
  const toSurah = getSurah(Number(toSurahNumber));

  return (
    <form
      key={state.submissionId ?? "goal-form"}
      action={formAction}
      className="space-y-6"
      noValidate
    >
      <input type="hidden" name="halaqaId" value={halaqaId} />
      <input type="hidden" name="studentId" value={studentId} />

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

      <div className="rounded-2xl border border-brand-900/10 bg-brand-50/50 p-4">
        <p className="text-sm font-bold text-brand-950">{studentName}</p>
        <p className="mt-0.5 text-xs text-brand-600">
          حدّد نطاق الحفظ وتاريخ الهدف. تُحسب النسبة تلقائيًا من سجلات الحفظ
          (HIFZ) فقط.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="fromSurah" label="من سورة" error={errors.fromSurah} required>
          <select
            id="fromSurah"
            name="fromSurah"
            required
            value={fromSurahNumber}
            onChange={(event) => setFromSurahNumber(event.target.value)}
            aria-invalid={Boolean(errors.fromSurah)}
            aria-describedby={
              errors.fromSurah ? "fromSurah-error" : undefined
            }
            className={inputClassName(errors.fromSurah)}
          >
            <option value="">— اختر السورة —</option>
            {surahs.map((surah) => (
              <option key={surah.number} value={surah.number}>
                {surah.number}. {surah.name} ({surah.ayahCount} آية)
              </option>
            ))}
          </select>
        </Field>

        <Field id="fromAyah" label="من آية" error={errors.fromAyah} required>
          <input
            id="fromAyah"
            name="fromAyah"
            type="number"
            required
            min={1}
            max={fromSurah?.ayahCount}
            defaultValue={values.fromAyah ?? ""}
            aria-invalid={Boolean(errors.fromAyah)}
            aria-describedby={errors.fromAyah ? "fromAyah-error" : undefined}
            className={inputClassName(errors.fromAyah)}
            placeholder="1"
          />
        </Field>

        <Field id="toSurah" label="إلى سورة" error={errors.toSurah} required>
          <select
            id="toSurah"
            name="toSurah"
            required
            value={toSurahNumber}
            onChange={(event) => setToSurahNumber(event.target.value)}
            aria-invalid={Boolean(errors.toSurah)}
            aria-describedby={errors.toSurah ? "toSurah-error" : undefined}
            className={inputClassName(errors.toSurah)}
          >
            <option value="">— اختر السورة —</option>
            {surahs.map((surah) => (
              <option key={surah.number} value={surah.number}>
                {surah.number}. {surah.name} ({surah.ayahCount} آية)
              </option>
            ))}
          </select>
        </Field>

        <Field id="toAyah" label="إلى آية" error={errors.toAyah} required>
          <input
            id="toAyah"
            name="toAyah"
            type="number"
            required
            min={1}
            max={toSurah?.ayahCount}
            defaultValue={values.toAyah ?? ""}
            aria-invalid={Boolean(errors.toAyah)}
            aria-describedby={errors.toAyah ? "toAyah-error" : undefined}
            className={inputClassName(errors.toAyah)}
            placeholder="5"
          />
        </Field>

        <Field
          id="startDate"
          label="تاريخ البدء"
          error={errors.startDate}
          required
        >
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={values.startDate ?? defaultStartDate}
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={
              errors.startDate ? "startDate-error" : undefined
            }
            className={inputClassName(errors.startDate)}
          />
        </Field>

        <Field
          id="targetDate"
          label="تاريخ الهدف"
          error={errors.targetDate}
          required
        >
          <input
            id="targetDate"
            name="targetDate"
            type="date"
            required
            defaultValue={values.targetDate ?? defaultTargetDate}
            aria-invalid={Boolean(errors.targetDate)}
            aria-describedby={
              errors.targetDate ? "targetDate-error" : undefined
            }
            className={inputClassName(errors.targetDate)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-brand-600">
          يمكن للمعلم إلغاء الهدف لاحقًا، ولا تُحتسب إلا سجلات الحفظ دون
          المراجعة أو التلاوة.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الحفظ..." : "حفظ خطة الحفظ"}
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
        ) : null}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-red-700"
        >
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
