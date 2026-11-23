import { z } from "zod";

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => (value ?? "") === "" || /^[0-9+\-()\s]{7,30}$/.test(value ?? ""),
    "يرجى إدخال رقم هاتف صحيح (أرقام ورموز فقط).",
  );

export const accountProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يحتوي على حرفين على الأقل.")
    .max(100, "الاسم طويل جدًا. الحد الأقصى 100 حرف."),
  phone: optionalPhone,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "يرجى إدخال كلمة المرور الحالية."),
    newPassword: z
      .string()
      .min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.")
      .max(128, "كلمة المرور طويلة جدًا."),
    confirmPassword: z
      .string()
      .min(1, "يرجى تأكيد كلمة المرور الجديدة."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "تأكيد كلمة المرور غير مطابق.",
  });

export type AccountProfileValues = z.infer<typeof accountProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
