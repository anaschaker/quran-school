"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSession, setSessionCookie } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/session";
import { accountProfileSchema, changePasswordSchema } from "@/lib/validations/account";
import { zodFieldErrors } from "@/lib/validations/admin";

export type AccountActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  submissionId?: number;
};

const profilePaths = ["/account", "/"];

function revalidateAccount() {
  for (const path of profilePaths) {
    revalidatePath(path);
  }
}

export async function updateAccountProfile(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };

  const parsed = accountProfileSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: raw,
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  try {
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: data.name,
        phone: data.phone || null,
      },
      select: { id: true, name: true, role: true, mustChangePassword: true },
    });

    const token = await createSessionToken({
      userId: updated.id,
      name: updated.name,
      role: updated.role,
      mustChangePassword: updated.mustChangePassword,
    });

    await setSessionCookie(token);
  } catch (error) {
    console.error("تعذّر تحديث الملف الشخصي:", error);
    return {
      success: false,
      message: "تعذّر حفظ التعديلات حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  revalidateAccount();
  redirect("/account?flash=profile");
}

export async function changePassword(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const raw = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = changePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
      submissionId: Date.now(),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, role: true, passwordHash: true },
  });

  if (!user) {
    redirect("/login");
  }

  const currentMatches = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash,
  );

  if (!currentMatches) {
    return {
      success: false,
      message: "كلمة المرور الحالية غير صحيحة.",
      fieldErrors: { currentPassword: "كلمة المرور الحالية غير صحيحة." },
      submissionId: Date.now(),
    };
  }

  try {
    const newHash = await hashPassword(parsed.data.newPassword);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: { id: true, name: true, role: true, mustChangePassword: true },
    });

    const token = await createSessionToken({
      userId: updated.id,
      name: updated.name,
      role: updated.role,
      mustChangePassword: updated.mustChangePassword,
    });

    await setSessionCookie(token);
  } catch (error) {
    console.error("تعذّر تغيير كلمة المرور:", error);
    return {
      success: false,
      message: "تعذّر تغيير كلمة المرور حاليًا. يرجى المحاولة مرة أخرى.",
      submissionId: Date.now(),
    };
  }

  revalidateAccount();
  redirect("/account?flash=password");
}

export async function updateNotificationPreference(
  formData: FormData,
): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const channel = String(formData.get("channel") ?? "EMAIL").trim();
  const enabled = formData.get("enabled") === "on";

  await prisma.notificationPreference.upsert({
    where: { userId_channel: { userId: session.userId, channel } },
    update: { enabled },
    create: { userId: session.userId, channel, enabled },
  });

  revalidatePath("/account");
}

export async function updateHijriPreference(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const enabled = formData.get("enabled") === "on";

  await prisma.user.update({
    where: { id: session.userId },
    data: { showHijri: enabled },
  });

  revalidatePath("/account");
}

export async function updateWhatsAppConsent(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const consent = formData.get("consent") === "on";

  await prisma.user.update({
    where: { id: session.userId },
    data: { whatsappConsent: consent },
  });

  revalidatePath("/account");
}
