"use client";

import { useActionState } from "react";

import { resetUserPassword } from "@/lib/actions/users";
import type { ResetPasswordState } from "@/lib/actions/users";

const initialState: ResetPasswordState = { success: false };

export function ResetPasswordButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    resetUserPassword,
    initialState,
  );

  return (
    <div className="space-y-2">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`إعادة تعيين كلمة المرور للمستخدم «${userName}»؟`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ..." : "إعادة تعيين كلمة المرور"}
        </button>
      </form>

      {state.tempPassword ? (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          كلمة المرور المؤقتة (تُعرض مرة واحدة):
          <span dir="ltr" className="ms-1 font-mono font-bold">
            {state.tempPassword}
          </span>
        </div>
      ) : null}

      {state.message && !state.tempPassword ? (
        <p className="text-xs text-brand-600">{state.message}</p>
      ) : null}
    </div>
  );
}
