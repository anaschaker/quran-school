import { z } from "zod";

import { getSurah } from "@/data/surahs";

export const attendanceStatusSchema = z.enum([
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
]);

export const recitationFormSchema = z.object({
  type: z.enum(["HIFZ", "MURAJAA", "TILAWA"], {
    message: "يرجى اختيار نوع التسميع.",
  }),
  surahNumber: z.coerce
    .number({ message: "يرجى اختيار السورة." })
    .int()
    .min(1)
    .max(114),
  fromAyah: z.coerce
    .number({ message: "يرجى إدخال رقم آية صحيح." })
    .int()
    .min(1),
  toAyah: z.coerce
    .number({ message: "يرجى إدخال رقم آية صحيح." })
    .int()
    .min(1),
  grade: z.coerce
    .number({ message: "يرجى إدخال التقدير." })
    .int()
    .min(1, "التقدير من 1 إلى 10.")
    .max(10, "التقدير من 1 إلى 10."),
  date: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "يرجى إدخال تاريخ صحيح."),
  notes: z
    .string()
    .trim()
    .max(1000, "الملاحظات طويلة جدًا.")
    .optional()
    .or(z.literal("")),
}).superRefine((data, ctx) => {
  const surah = getSurah(data.surahNumber);

  if (!surah) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["surahNumber"],
      message: "السورة المحددة غير موجودة.",
    });
    return;
  }

  if (data.fromAyah > surah.ayahCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fromAyah"],
      message: `رقم آية البداية لا يمكن أن يتجاوز ${surah.ayahCount} (عدد آيات السورة).`,
    });
  }

  if (data.toAyah > surah.ayahCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["toAyah"],
      message: `رقم آية النهاية لا يمكن أن يتجاوز ${surah.ayahCount} (عدد آيات السورة).`,
    });
  }

  if (data.fromAyah > data.toAyah) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["toAyah"],
      message: "آية النهاية يجب أن تكون أكبر أو تساوي آية البداية.",
    });
  }
});

export type RecitationFormValues = z.infer<typeof recitationFormSchema>;

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const result: Record<string, string> = {};

  for (const [key, messages] of Object.entries(flattened)) {
    if (messages && messages.length > 0) {
      result[key] = messages[0];
    }
  }

  return result;
}
