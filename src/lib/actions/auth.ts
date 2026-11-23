"use server";

import { redirect } from "next/navigation";

import { clearSessionCookie, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  isAppRole,
  ROLE_HOME,
} from "@/lib/session";

export type LoginState = {
  error: string | null;
};

// يُستخدم لمقارنة كلمة مرور وهمية عندما لا يوجد المستخدم، لتقليل فرق زمن الاستجابة.
const DUMMY_PASSWORD_HASH =
  "$2b$12$RQOQXdZ8EsIg3.kwBrkDTuJeb3ovkCqTcX4IYpGxl4xDaTUOI0amW";

const INVALID_CREDENTIALS =
  "البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة.";

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const { headers } = await import("next/headers");
  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const rl = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return {
      error: "تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة لاحقًا.",
    };
  }

  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور." };
  }

  if (identifier.length > 320 || password.length > 128) {
    return { error: INVALID_CREDENTIALS };
  }

  let token: string | null = null;
  let destination: string | null = null;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { phone: identifier }],
      },
      select: {
        id: true,
        name: true,
        role: true,
        passwordHash: true,
        mustChangePassword: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const remainingMinutes = Math.max(
        1,
        Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000),
      );
      return {
        error: `تم قفل الحساب بسبب محاولات دخول فاشلة. يرجى المحاولة بعد ${remainingMinutes} دقيقة.`,
      };
    }

    // نقارن دائمًا مع bcrypt حتى لو لم يوجد المستخدم.
    const passwordMatches = await verifyPassword(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (user && passwordMatches && isAppRole(user.role)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });

      token = await createSessionToken({
        userId: user.id,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      });
      destination = user.mustChangePassword
        ? "/account?force=1"
        : ROLE_HOME[user.role];

      void logAudit({
        userId: user.id,
        action: "LOGIN",
        entity: "USER",
        entityId: user.id,
        details: `تسجيل دخول (${user.role}).`,
      });
    } else if (user) {
      const attempts = user.failedLoginAttempts + 1;
      const lockAccount = attempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: lockAccount
            ? new Date(Date.now() + 10 * 60 * 1000)
            : user.lockedUntil,
        },
      });
    }
  } catch (error) {
    console.error("خطأ أثناء تسجيل الدخول:", error);
    return {
      error: "تعذّر إكمال تسجيل الدخول حاليًا. يرجى المحاولة مرة أخرى.",
    };
  }

  if (!token || !destination) {
    return { error: INVALID_CREDENTIALS };
  }

  await setSessionCookie(token);
  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
