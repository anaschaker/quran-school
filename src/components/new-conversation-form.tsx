"use client";

import { useActionState } from "react";

import {
  MESSAGING_ROLE_LABEL,
  type MessagingContact,
} from "@/lib/messaging-types";
import type { ActionResult } from "@/lib/validations/admin";

type NewConversationFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  contacts: MessagingContact[];
};

const initialState: ActionResult = { success: false };

function inputClassName(error?: string) {
  return error
    ? "w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";
}

export function NewConversationForm({
  action,
  contacts,
}: NewConversationFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  if (contacts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-brand-900/15 bg-brand-50/40 px-4 py-3 text-sm text-brand-600">
        لا يوجد مستخدمون متاحون لمراسلتهم حاليًا.
      </p>
    );
  }

  return (
    <form
      key={state.submissionId ?? "new-conversation"}
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
          htmlFor="conversation-recipient"
          className="block text-sm font-bold text-brand-900"
        >
          المستلم
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <select
          id="conversation-recipient"
          name="recipientId"
          required
          defaultValue={values.recipientId ?? ""}
          aria-invalid={Boolean(errors.recipientId)}
          aria-describedby={
            errors.recipientId ? "conversation-recipient-error" : undefined
          }
          className={inputClassName(errors.recipientId)}
        >
          <option value="">— اختر مستلمًا —</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name} — {MESSAGING_ROLE_LABEL[contact.role]}
            </option>
          ))}
        </select>
        {errors.recipientId ? (
          <p
            id="conversation-recipient-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {errors.recipientId}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="conversation-content"
          className="block text-sm font-bold text-brand-900"
        >
          نص الرسالة
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <textarea
          id="conversation-content"
          name="content"
          required
          rows={4}
          maxLength={1000}
          defaultValue={values.content ?? ""}
          aria-invalid={Boolean(errors.content)}
          aria-describedby={
            errors.content ? "conversation-content-error" : undefined
          }
          className={inputClassName(errors.content)}
          placeholder="اكتب رسالتك هنا (1000 حرف كحد أقصى)..."
        />
        {errors.content ? (
          <p
            id="conversation-content-error"
            role="alert"
            className="text-xs font-medium text-red-700"
          >
            {errors.content}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ الإرسال..." : "إرسال الرسالة"}
      </button>
    </form>
  );
}
