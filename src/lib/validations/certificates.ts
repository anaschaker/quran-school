import { z } from "zod";

export const certificateTypeSchema = z.enum(
  ["PART_COMPLETION", "FULL_QURAN", "EXCELLENCE", "ATTENDANCE"],
  { message: "يرجى اختيار نوع الشهادة." },
);

export const issueCertificateSchema = z.object({
  studentId: z.string().trim().min(1, "يرجى اختيار الطالب."),
  type: certificateTypeSchema,
  title: z
    .string()
    .trim()
    .min(2, "عنوان الشهادة يجب أن يحتوي على حرفين على الأقل.")
    .max(150, "عنوان الشهادة طويل جدًا."),
});

export type IssueCertificateValues = z.infer<typeof issueCertificateSchema>;
