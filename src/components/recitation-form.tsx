"use client";

import { useActionState, useState } from "react";

import { saveRecitation, type ActionResult } from "@/lib/actions/teacher";
import { getSurah, surahs } from "@/data/surahs";

type RecitationFormProps = {
  halaqaId: string;
  studentId: string;
  studentName: string;
  date: string;
};

const initialState: ActionResult = { success: false };

const recitationTypes = [
  { value: "HIFZ", label: "حفظ" },
  { value: "MURAJAA", label: "مراجعة" },
  { value: "TILAWA", label: "تلاوة" },
];

export function RecitationForm({
  halaqaId,
  studentId,
  studentName,
  date,
}: RecitationFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveRecitation,
    initialState,
  );

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  const [surahNumber, setSurahNumber] = useState(values.surahNumber ?? "");
  const selectedSurah = getSurah(Number(surahNumber));

  return (
    <form
      key={state.submissionId ?? "recitation-form"}
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
          سجّل تسميع الطالب (حفظ/مراجعة/تلاوة) مع السورة والآيات والتقدير.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="type" label="نوع التسميع" error={errors.type} required>
          <select
            id="type"
            name="type"
            required
            defaultValue={values.type ?? ""}
            aria-invalid={Boolean(errors.type)}
            aria-describedby={errors.type ? "type-error" : undefined}
            className={inputClassName(errors.type)}
          >
            <option value="">— اختر النوع —</option>
            {recitationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="surahNumber" label="السورة" error={errors.surahNumber} required>
          <select
            id="surahNumber"
            name="surahNumber"
            required
            value={surahNumber}
            onChange={(event) => setSurahNumber(event.target.value)}
            aria-invalid={Boolean(errors.surahNumber)}
            aria-describedby={errors.surahNumber ? "surahNumber-error" : undefined}
            className={inputClassName(errors.surahNumber)}
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
            max={selectedSurah?.ayahCount}
            defaultValue={values.fromAyah ?? ""}
            aria-invalid={Boolean(errors.fromAyah)}
            aria-describedby={errors.fromAyah ? "fromAyah-error" : undefined}
            className={inputClassName(errors.fromAyah)}
            placeholder="1"
          />
        </Field>

        <Field id="toAyah" label="إلى آية" error={errors.toAyah} required>
          <input
            id="toAyah"
            name="toAyah"
            type="number"
            required
            min={1}
            max={selectedSurah?.ayahCount}
            defaultValue={values.toAyah ?? ""}
            aria-invalid={Boolean(errors.toAyah)}
            aria-describedby={errors.toAyah ? "toAyah-error" : undefined}
            className={inputClassName(errors.toAyah)}
            placeholder="5"
          />
        </Field>

        <Field id="grade" label="التقدير (1-10)" error={errors.grade} required>
          <select
            id="grade"
            name="grade"
            required
            defaultValue={values.grade ?? ""}
            aria-invalid={Boolean(errors.grade)}
            aria-describedby={errors.grade ? "grade-error" : undefined}
            className={inputClassName(errors.grade)}
          >
            <option value="">— اختر التقدير —</option>
            {Array.from({ length: 10 }, (_, index) => index + 1).map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </Field>

        <Field id="date" label="التاريخ" error={errors.date} required>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={values.date ?? date}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "date-error" : undefined}
            className={inputClassName(errors.date)}
          />
        </Field>
      </div>

      {selectedSurah ? (
        <p className="rounded-xl bg-brand-50 px-4 py-2.5 text-xs font-medium text-brand-700">
          {selectedSurah.name}: {selectedSurah.ayahCount} آية —{" "}
          {selectedSurah.revelationType}
        </p>
      ) : null}

      <Field id="notes" label="ملاحظات" error={errors.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={1000}
          defaultValue={values.notes ?? ""}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          className={`${inputClassName(errors.notes)} resize-y`}
          placeholder="ملاحظات على التلاوة، المخارج، الأحكام..."
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-brand-600">
          التقدير من 1 (ضعيف) إلى 10 (ممتاز). التحقق من أرقام الآيات تلقائي.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الحفظ..." : "حفظ التسميع"}
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
