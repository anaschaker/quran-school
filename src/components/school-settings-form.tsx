"use client";

import { useActionState, useState } from "react";

import type { SchoolSettings } from "@/lib/school-settings-shared";
import type { SettingsActionState } from "@/lib/actions/settings";

type SchoolSettingsFormProps = {
  action: (
    state: SettingsActionState,
    formData: FormData,
  ) => Promise<SettingsActionState>;
  initial: SchoolSettings;
};

const initialState: SettingsActionState = { success: false };

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}

export function SchoolSettingsForm({
  action,
  initial,
}: SchoolSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const values = state.values;
  const errors = state.fieldErrors ?? {};

  const [hours, setHours] = useState<{ days: string; time: string }[]>(
    values?.hours ?? initial.hours,
  );

  const hoursError =
    errors.hours ??
    Object.entries(errors).find(([key]) => key.startsWith("hours"))?.[1];

  return (
    <form
      key={state.submissionId ?? "school-settings-form"}
      action={formAction}
      className="space-y-6"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="settings-name"
            className="block text-sm font-bold text-brand-900"
          >
            اسم المدرسة
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="settings-name"
            name="name"
            type="text"
            required
            maxLength={100}
            defaultValue={values?.name ?? initial.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "settings-name-error" : undefined}
            className={inputClassName(errors.name)}
          />
          {errors.name ? (
            <p id="settings-name-error" role="alert" className="text-xs font-medium text-red-700">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="settings-phone"
            className="block text-sm font-bold text-brand-900"
          >
            الهاتف
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="settings-phone"
            name="phone"
            type="text"
            required
            maxLength={30}
            defaultValue={values?.phone ?? initial.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "settings-phone-error" : undefined}
            className={inputClassName(errors.phone)}
          />
          {errors.phone ? (
            <p id="settings-phone-error" role="alert" className="text-xs font-medium text-red-700">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="settings-address"
            className="block text-sm font-bold text-brand-900"
          >
            العنوان
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="settings-address"
            name="address"
            type="text"
            required
            maxLength={200}
            defaultValue={values?.address ?? initial.address}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? "settings-address-error" : undefined}
            className={inputClassName(errors.address)}
          />
          {errors.address ? (
            <p id="settings-address-error" role="alert" className="text-xs font-medium text-red-700">
              {errors.address}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label
            htmlFor="settings-currency"
            className="block text-sm font-bold text-brand-900"
          >
            عملة المبلغ
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="settings-currency"
            name="currency"
            type="text"
            required
            maxLength={10}
            defaultValue={values?.currency ?? initial.currency}
            aria-invalid={Boolean(errors.currency)}
            aria-describedby={
              errors.currency ? "settings-currency-error" : undefined
            }
            className={inputClassName(errors.currency)}
          />
          {errors.currency ? (
            <p
              id="settings-currency-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.currency}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="settings-exchange-rate"
            className="block text-sm font-bold text-brand-900"
          >
            سعر الصرف (ليرة لكل دولار)
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="settings-exchange-rate"
            name="exchangeRate"
            type="number"
            step="1"
            min="1"
            required
            inputMode="decimal"
            dir="ltr"
            defaultValue={values?.exchangeRate ?? String(initial.exchangeRate)}
            aria-invalid={Boolean(errors.exchangeRate)}
            aria-describedby={
              errors.exchangeRate
                ? "settings-exchange-rate-error"
                : "settings-exchange-rate-hint"
            }
            className={inputClassName(errors.exchangeRate)}
          />
          {errors.exchangeRate ? (
            <p
              id="settings-exchange-rate-error"
              role="alert"
              className="text-xs font-medium text-red-700"
            >
              {errors.exchangeRate}
            </p>
          ) : (
            <p
              id="settings-exchange-rate-hint"
              className="text-xs leading-6 text-brand-600"
            >
              تُحفظ المبالغ بالدولار، وتُعرض قيمتها بالليرة وفق هذا السعر.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-brand-900">ساعات الدوام</h2>
          <button
            type="button"
            onClick={() => setHours((prev) => [...prev, { days: "", time: "" }])}
            className="rounded-full border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
          >
            إضافة صف
          </button>
        </div>

        {hoursError ? (
          <p role="alert" className="text-xs font-medium text-red-700">
            {hoursError}
          </p>
        ) : null}

        <div className="space-y-2">
          {hours.map((entry, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                name="hoursDays"
                type="text"
                placeholder="أيام الدوام (مثال: الأحد - الخميس)"
                maxLength={60}
                value={entry.days}
                onChange={(event) =>
                  setHours((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, days: event.target.value } : item,
                    ),
                  )
                }
                className={inputClassName()}
              />
              <input
                name="hoursTime"
                type="text"
                placeholder="أوقات الدوام (مثال: 8:00 صباحًا - 5:00 مساءً)"
                maxLength={60}
                value={entry.time}
                onChange={(event) =>
                  setHours((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, time: event.target.value } : item,
                    ),
                  )
                }
                className={inputClassName()}
              />
              <button
                type="button"
                onClick={() =>
                  setHours((prev) => {
                    if (prev.length <= 1) return prev;
                    return prev.filter((_, i) => i !== index);
                  })
                }
                disabled={hours.length <= 1}
                className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="settings-about"
          className="block text-sm font-bold text-brand-900"
        >
          نص «عن المدرسة» (مقدمة)
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <textarea
          id="settings-about"
          name="aboutIntro"
          required
          rows={6}
          maxLength={2000}
          defaultValue={values?.aboutIntro ?? initial.aboutIntro}
          aria-invalid={Boolean(errors.aboutIntro)}
          aria-describedby={
            errors.aboutIntro ? "settings-about-error" : undefined
          }
          className={inputClassName(errors.aboutIntro)}
        />
        {errors.aboutIntro ? (
          <p id="settings-about-error" role="alert" className="text-xs font-medium text-red-700">
            {errors.aboutIntro}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-brand-600">
          تُحفظ القيم في قاعدة البيانات، وتُستخدم كقيم افتراضية عند غياب إعداد
          في جدول الإعدادات.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </form>
  );
}
