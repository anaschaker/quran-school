import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `الحد الأقصى ${max} حرفًا.`)
    .optional()
    .or(z.literal(""));

export const registrationRequestSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, "اسم الطالب يجب أن يحتوي على حرفين على الأقل.")
    .max(100, "اسم الطالب طويل جدًا."),
  birthDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => (value ?? "") === "" || !Number.isNaN(Date.parse(value ?? "")),
      "يرجى إدخال تاريخ ميلاد صحيح.",
    ),
  parentName: z
    .string()
    .trim()
    .min(2, "اسم ولي الأمر يجب أن يحتوي على حرفين على الأقل.")
    .max(100, "اسم ولي الأمر طويل جدًا."),
  phone: z
    .string()
    .trim()
    .min(7, "يرجى إدخال رقم هاتف صحيح.")
    .max(30, "رقم الهاتف طويل جدًا.")
    .refine(
      (value) => /^[0-9+\-()\s]{7,30}$/.test(value),
      "يرجى إدخال رقم هاتف صحيح (أرقام ورموز فقط).",
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("يرجى إدخال بريد إلكتروني صحيح.")
    .max(200, "البريد الإلكتروني طويل جدًا."),
  stage: z
    .string()
    .trim()
    .min(2, "يرجى تحديد المرحلة.")
    .max(100, "المرحلة طويلة جدًا."),
  currentMemorization: optionalText(300),
  notes: optionalText(500),
  // حقل honeypot: يجب أن يبقى فارغًا.
  website: z.string().trim().optional().or(z.literal("")),
});

export type RegistrationRequestValues = z.infer<typeof registrationRequestSchema>;
