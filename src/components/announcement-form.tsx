"use client";

import { useActionState } from "react";

import type { ActionResult } from "@/lib/actions/announcements";
import type { AnnouncementFormValues } from "@/lib/validations/announcement";

type AnnouncementFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial?: Partial<AnnouncementFormValues> & { id?: string };
  submitLabel: string;
};

const initialState: ActionResult = { success: false };

const audienceOptions = [
  { value: "ALL", label: "الكل" },
  { value: "TEACHERS", label: "المعلمون" },
  { value: "STUDENTS", label: "الطلاب" },
  { value: "PARENTS", label: "أولياء الأمور" },
];

export function AnnouncementForm({
  action,
  initial,
  submitLabel,
}: AnnouncementFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form
      key={state.submissionId ?? initial?.id ?? "announcement-form"}
      action={formAction}
      className="space-y-6"
      noValidate
    >
      {initial?.id ? (
        <input type="hidden" name="announcementId" value={initial.id} />
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
        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="announcement-title"
            className="block text-sm font-bold text-brand-900"
          >
            العنوان
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="announcement-title"
            name="title"
            type="text"
            required
            maxLength={150}
            defaultValue={values.title ?? initial?.title ?? ""}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={
              errors.title ? "announcement-title-error" : undefined
            }
            className={inputClassName(errors.title)}
            placeholder="إعلان بدء التسجيل للفصل القادم"
          />
          {errors.title ? (
            <p
              id="announcement-title-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.title}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="announcement-audience"
            className="block text-sm font-bold text-brand-900"
          >
            الجمهور المستهدف
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <select
            id="announcement-audience"
            name="audience"
            required
            defaultValue={values.audience ?? initial?.audience ?? "ALL"}
            aria-invalid={Boolean(errors.audience)}
            aria-describedby={
              errors.audience ? "announcement-audience-error" : undefined
            }
            className={inputClassName(errors.audience)}
          >
            {audienceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.audience ? (
            <p
              id="announcement-audience-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.audience}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="announcement-date"
            className="block text-sm font-bold text-brand-900"
          >
            تاريخ النشر
            <span className="font-normal text-brand-500"> (اختياري)</span>
          </label>
          <input
            id="announcement-date"
            name="date"
            type="date"
            defaultValue={values.date ?? initial?.date ?? ""}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={
              errors.date ? "announcement-date-error" : undefined
            }
            className={inputClassName(errors.date)}
          />
          {errors.date ? (
            <p
              id="announcement-date-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.date}
            </p>
          ) : null}
          <p className="text-xs text-brand-500">
            إذا تُرك فارغًا فسيُستخدم تاريخ اليوم.
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="announcement-content"
            className="block text-sm font-bold text-brand-900"
          >
            نص الإعلان
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <textarea
            id="announcement-content"
            name="content"
            required
            rows={7}
            maxLength={3000}
            defaultValue={values.content ?? initial?.content ?? ""}
            aria-invalid={Boolean(errors.content)}
            aria-describedby={
              errors.content ? "announcement-content-error" : undefined
            }
            className={inputClassName(errors.content)}
            placeholder="اكتب تفاصيل الإعلان هنا..."
          />
          {errors.content ? (
            <p
              id="announcement-content-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.content}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-brand-600">
          يظهر الإعلان في الصفحة الرئيسية وفي لوحات الجمهور المحدد.
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

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}
