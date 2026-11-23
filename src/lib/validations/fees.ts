import { z } from "zod";

export const feePeriodSchema = z.enum(["MONTHLY", "TERM", "YEARLY"], {
  message: "يرجى اختيار الدورية.",
});

export const invoiceStatusSchema = z.enum(
  ["PENDING", "PAID", "PARTIAL", "WAIVED"],
  { message: "يرجى اختيار الحالة." },
);

export const paymentMethodSchema = z.enum(["CASH", "TRANSFER"], {
  message: "يرجى اختيار طريقة الدفع.",
});

export const feePlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اسم الخطة يجب أن يحتوي على حرفين على الأقل.")
    .max(100, "اسم الخطة طويل جدًا."),
  amount: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: "يرجى إدخال مبلغ صحيح (أكبر من صفر).",
    }),
  period: feePeriodSchema,
});

export const createInvoiceSchema = z.object({
  studentId: z.string().trim().optional().or(z.literal("")),
  halaqaId: z.string().trim().optional().or(z.literal("")),
  feePlanId: z.string().trim().min(1, "يرجى اختيار خطة الرسوم."),
  amount: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: "يرجى إدخال مبلغ صحيح (أكبر من صفر).",
    }),
  dueDate: z
    .string()
    .trim()
    .min(1, "يرجى إدخال تاريخ الاستحقاق.")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "يرجى إدخال تاريخ صحيح.",
    }),
});

export const paymentSchema = z.object({
  invoiceId: z.string().trim().min(1, "الفاتورة غير موجودة."),
  amount: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: "يرجى إدخال مبلغ صحيح (أكبر من صفر).",
    }),
  date: z
    .string()
    .trim()
    .min(1, "يرجى إدخال تاريخ الدفع.")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "يرجى إدخال تاريخ صحيح.",
    }),
  method: paymentMethodSchema,
  note: z.string().trim().max(300, "الملاحظة طويلة جدًا.").optional().or(z.literal("")),
});

export type FeePlanValues = z.infer<typeof feePlanSchema>;
export type CreateInvoiceValues = z.infer<typeof createInvoiceSchema>;
export type PaymentValues = z.infer<typeof paymentSchema>;
