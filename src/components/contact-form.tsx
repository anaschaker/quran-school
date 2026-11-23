"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";

import {
  submitContactMessage,
  type ContactState,
} from "@/lib/actions/contact";

const initialState: ContactState = { status: "idle" };

const inputClassName =
  "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";

const errorInputClassName =
  "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactMessage,
    initialState,
  );

  const errors = state.fieldErrors;
  const values = state.values;

  return (
    <form
      key={state.submissionId ?? "contact-form"}
      action={formAction}
      className="space-y-5"
      noValidate
    >
      {state.message ? (
        <div
          role={state.status === "success" ? "status" : "alert"}
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="name"
          label="الاسم الكامل"
          error={errors?.name}
          required
        >
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            defaultValue={values?.name ?? ""}
            aria-invalid={Boolean(errors?.name)}
            aria-describedby={errors?.name ? "name-error" : undefined}
            className={errors?.name ? errorInputClassName : inputClassName}
            placeholder="اكتب اسمك الكامل"
          />
        </Field>

        <Field
          id="email"
          label="البريد الإلكتروني"
          error={errors?.email}
          required
        >
          <input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            required
            maxLength={200}
            autoComplete="email"
            defaultValue={values?.email ?? ""}
            aria-invalid={Boolean(errors?.email)}
            aria-describedby={errors?.email ? "email-error" : undefined}
            className={`${errors?.email ? errorInputClassName : inputClassName} text-left`}
            placeholder="name@example.com"
          />
        </Field>

        <Field id="phone" label="رقم الهاتف" error={errors?.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            dir="ltr"
            maxLength={30}
            autoComplete="tel"
            defaultValue={values?.phone ?? ""}
            aria-invalid={Boolean(errors?.phone)}
            aria-describedby={errors?.phone ? "phone-error" : undefined}
            className={`${errors?.phone ? errorInputClassName : inputClassName} text-left`}
            placeholder="05xxxxxxxx"
          />
        </Field>

        <Field id="subject" label="الموضوع" error={errors?.subject}>
          <input
            id="subject"
            name="subject"
            type="text"
            maxLength={150}
            defaultValue={values?.subject ?? ""}
            aria-invalid={Boolean(errors?.subject)}
            aria-describedby={errors?.subject ? "subject-error" : undefined}
            className={errors?.subject ? errorInputClassName : inputClassName}
            placeholder="استفسار عن البرامج"
          />
        </Field>
      </div>

      <Field id="message" label="الرسالة" error={errors?.message} required>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={10}
          maxLength={2000}
          defaultValue={values?.message ?? ""}
          aria-invalid={Boolean(errors?.message)}
          aria-describedby={errors?.message ? "message-error" : undefined}
          className={`${errors?.message ? errorInputClassName : inputClassName} resize-y`}
          placeholder="اكتب رسالتك هنا..."
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-brand-600">
          لن نشارك بياناتك مع أي جهة خارجية.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الإرسال..." : "إرسال الرسالة"}
        </button>
      </div>

      {/* حقل مكافحة الرسائل الآلية */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">الموقع</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
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
