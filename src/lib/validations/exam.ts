import { z } from "zod";

export const MAX_EXAM_SCORE = 100;

export const examFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "عنوان الاختبار يجب أن يحتوي على حرفين على الأقل.")
    .max(150, "عنوان الاختبار طويل جدًا. الحد الأقصى 150 حرفًا."),
  date: z
    .string()
    .trim()
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "يرجى إدخال تاريخ صحيح للاختبار.",
    ),
});

export type ExamFormValues = z.infer<typeof examFormSchema>;
