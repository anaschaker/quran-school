import { z } from "zod";

import { getSurah } from "@/data/surahs";

export const memorizationGoalSchema = z
  .object({
    fromSurah: z.coerce
      .number({ message: "يرجى اختيار سورة البداية." })
      .int()
      .min(1, "سورة البداية غير صحيحة.")
      .max(114, "سورة البداية غير صحيحة."),
    fromAyah: z.coerce
      .number({ message: "يرجى إدخال رقم آية البداية." })
      .int()
      .min(1, "رقم آية البداية غير صحيح."),
    toSurah: z.coerce
      .number({ message: "يرجى اختيار سورة النهاية." })
      .int()
      .min(1, "سورة النهاية غير صحيحة.")
      .max(114, "سورة النهاية غير صحيحة."),
    toAyah: z.coerce
      .number({ message: "يرجى إدخال رقم آية النهاية." })
      .int()
      .min(1, "رقم آية النهاية غير صحيح."),
    startDate: z
      .string()
      .trim()
      .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "يرجى إدخال تاريخ بدء صحيح.",
      ),
    targetDate: z
      .string()
      .trim()
      .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "يرجى إدخال تاريخ هدف صحيح.",
      ),
  })
  .superRefine((data, ctx) => {
    const fromSurah = getSurah(data.fromSurah);
    const toSurah = getSurah(data.toSurah);

    if (!fromSurah) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fromSurah"],
        message: "سورة البداية غير موجودة.",
      });
      return;
    }

    if (!toSurah) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toSurah"],
        message: "سورة النهاية غير موجودة.",
      });
      return;
    }

    if (data.fromAyah > fromSurah.ayahCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fromAyah"],
        message: `رقم آية البداية لا يمكن أن يتجاوز ${fromSurah.ayahCount} (عدد آيات السورة).`,
      });
    }

    if (data.toAyah > toSurah.ayahCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toAyah"],
        message: `رقم آية النهاية لا يمكن أن يتجاوز ${toSurah.ayahCount} (عدد آيات السورة).`,
      });
    }

    const startsAfterEnds =
      data.toSurah < data.fromSurah ||
      (data.toSurah === data.fromSurah && data.toAyah < data.fromAyah);

    if (startsAfterEnds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toSurah"],
        message: "نهاية الهدف يجب أن تكون بعد بدايته في ترتيب المصحف.",
      });
    }

    const start = new Date(`${data.startDate}T00:00:00.000Z`);
    const target = new Date(`${data.targetDate}T00:00:00.000Z`);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(target.getTime())) {
      if (target.getTime() < start.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetDate"],
          message: "تاريخ الهدف يجب أن يكون بعد تاريخ البدء أو مساويًا له.",
        });
      }
    }
  });

export type MemorizationGoalValues = z.infer<typeof memorizationGoalSchema>;
