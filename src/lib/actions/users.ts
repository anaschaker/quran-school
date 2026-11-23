"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type ResetPasswordState = {
  success: boolean;
  message?: string;
  tempPassword?: string;
  submissionId?: number;
};

function generateTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function resetUserPassword(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  await requireRole("ADMIN");

  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    return {
      success: false,
      message: "المستخدم غير موجود.",
      submissionId: Date.now(),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) {
    return {
      success: false,
      message: "المستخدم غير موجود.",
      submissionId: Date.now(),
    };
  }

  const tempPassword = generateTempPassword();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(tempPassword),
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  } catch (error) {
    console.error("تعذّر إعادة تعيين كلمة المرور:", error);
    return {
      success: false,
      message: "تعذّر إعادة تعيين كلمة المرور حاليًا. يرجى المحاولة مرة أخرى.",
      submissionId: Date.now(),
    };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/students");
  revalidatePath("/admin/teachers");

  return {
    success: true,
    message: `تمت إعادة تعيين كلمة المرور للمستخدم «${user.name}».`,
    tempPassword,
    submissionId: Date.now(),
  };
}
