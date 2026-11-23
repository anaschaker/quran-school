import { z } from "zod";

export const announcementAudienceSchema = z.enum(
  ["ALL", "TEACHERS", "STUDENTS", "PARENTS"],
  { message: "يرجى اختيار الجمهور المستهدف." },
);

export const announcementFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "عنوان الإعلان يجب أن يحتوي على حرفين على الأقل.")
    .max(150, "عنوان الإعلان طويل جدًا. الحد الأقصى 150 حرفًا."),
  content: z
    .string()
    .trim()
    .min(10, "نص الإعلان يجب أن يحتوي على 10 أحرف على الأقل.")
    .max(3000, "نص الإعلان طويل جدًا. الحد الأقصى 3000 حرف."),
  audience: announcementAudienceSchema,
  date: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => (value ?? "") === "" || !Number.isNaN(Date.parse(value ?? "")),
      "يرجى إدخال تاريخ صحيح.",
    ),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;
