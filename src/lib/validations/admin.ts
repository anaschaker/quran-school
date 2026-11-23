import { z } from "zod";

import { STUDENT_STATUSES } from "@/lib/student-status";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `الحد الأقصى ${max} حرفًا.`)
    .optional()
    .or(z.literal(""));

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => (value ?? "") === "" || /^[0-9+\-()\s]{7,30}$/.test(value ?? ""),
    "يرجى إدخال رقم هاتف صحيح (أرقام ورموز فقط).",
  );

export const studentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يحتوي على حرفين على الأقل.")
    .max(100, "الاسم طويل جدًا. الحد الأقصى 100 حرف."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("يرجى إدخال بريد إلكتروني صحيح.")
    .max(200, "البريد الإلكتروني طويل جدًا."),
  phone: optionalPhone,
  birthDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => (value ?? "") === "" || !Number.isNaN(Date.parse(value ?? "")),
      "يرجى إدخال تاريخ ميلاد صحيح.",
    ),
  stage: z
    .string()
    .trim()
    .min(2, "يرجى تحديد المرحلة (حرفان على الأقل).")
    .max(100, "المرحلة طويلة جدًا."),
  parentId: z.string().trim().optional().or(z.literal("")),
  status: z.enum(STUDENT_STATUSES).default("ACTIVE"),
  notes: optionalText(500),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
    .max(128, "كلمة المرور طويلة جدًا.")
    .optional()
    .or(z.literal("")),
});

export const teacherFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يحتوي على حرفين على الأقل.")
    .max(100, "الاسم طويل جدًا. الحد الأقصى 100 حرف."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("يرجى إدخال بريد إلكتروني صحيح.")
    .max(200, "البريد الإلكتروني طويل جدًا."),
  phone: optionalPhone,
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
    .max(128, "كلمة المرور طويلة جدًا.")
    .optional()
    .or(z.literal("")),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type TeacherFormValues = z.infer<typeof teacherFormSchema>;
export const halaqaFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اسم الحلقة يجب أن يحتوي على حرفين على الأقل.")
    .max(100, "اسم الحلقة طويل جدًا. الحد الأقصى 100 حرف."),
  teacherId: z.string().trim().min(1, "يرجى اختيار المعلم."),
  time: z
    .string()
    .trim()
    .min(2, "يرجى إدخال وقت الحلقة.")
    .max(100, "الوقت طويل جدًا."),
  days: z
    .string()
    .trim()
    .min(2, "يرجى إدخال أيام الحلقة.")
    .max(200, "الأيام طويلة جدًا."),
  maxStudents: z.coerce
    .number({ message: "يرجى إدخال رقم صحيح." })
    .int("عدد الطلاب يجب أن يكون عددًا صحيحًا.")
    .min(1, "الحد الأدنى طالب واحد.")
    .max(200, "الحد الأقصى 200 طالب."),
});

export type HalaqaFormValues = z.infer<typeof halaqaFormSchema>;

export type ActionResult = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  submissionId?: number;
};

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const result: Record<string, string> = {};

  for (const [key, messages] of Object.entries(flattened)) {
    if (messages && messages.length > 0) {
      result[key] = messages[0];
    }
  }

  return result;
}
