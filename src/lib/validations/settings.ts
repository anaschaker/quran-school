import { z } from "zod";

export const schoolSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اسم المدرسة يجب أن يحتوي على حرفين على الأقل.")
    .max(100, "اسم المدرسة طويل جدًا. الحد الأقصى 100 حرف."),
  phone: z
    .string()
    .trim()
    .min(7, "رقم الهاتف قصير جدًا.")
    .max(30, "رقم الهاتف طويل جدًا.")
    .regex(/^[0-9+\-()\s]+$/, "يرجى إدخال رقم هاتف صحيح (أرقام ورموز فقط)."),
  address: z
    .string()
    .trim()
    .min(2, "العنوان يجب أن يحتوي على حرفين على الأقل.")
    .max(200, "العنوان طويل جدًا. الحد الأقصى 200 حرف."),
  aboutIntro: z
    .string()
    .trim()
    .min(20, "نص «عن المدرسة» يجب أن يحتوي على 20 حرفًا على الأقل.")
    .max(2000, "النص طويل جدًا. الحد الأقصى 2000 حرف."),
  currency: z
    .string()
    .trim()
    .min(1, "يرجى إدخال عملة المبلغ.")
    .max(10, "العملة طويلة جدًا."),
  exchangeRate: z
    .string()
    .trim()
    .min(1, "يرجى إدخال سعر الصرف.")
    .refine(
      (value) => {
        const rate = Number(value);
        return Number.isFinite(rate) && rate > 0 && rate <= 1_000_000_000;
      },
      "سعر الصرف يجب أن يكون رقمًا موجبًا (ليرة لكل دولار).",
    )
    .transform((value) => Number(value)),
  hours: z
    .array(
      z.object({
        days: z
          .string()
          .trim()
          .min(1, "يرجى إدخال أيام الدوام.")
          .max(60, "أيام الدوام طويلة جدًا."),
        time: z
          .string()
          .trim()
          .min(1, "يرجى إدخال أوقات الدوام.")
          .max(60, "أوقات الدوام طويلة جدًا."),
      }),
    )
    .min(1, "يرجى إضافة صف دوام واحد على الأقل.")
    .max(7, "الحد الأقصى 7 صفوف دوام."),
});

export type SchoolSettingsFormValues = z.infer<typeof schoolSettingsSchema>;
