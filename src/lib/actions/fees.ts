"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getSchoolSettings } from "@/lib/school-settings";
import { formatMoney } from "@/lib/school-settings-shared";
import {
  createInvoiceSchema,
  feePlanSchema,
  paymentSchema,
} from "@/lib/validations/fees";
import { zodFieldErrors, type ActionResult } from "@/lib/validations/admin";

const feePaths = ["/admin", "/admin/fees", "/parent", "/student"];

const arabicDateFormatter = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "long",
  timeZone: "UTC",
});

function revalidateFees() {
  for (const path of feePaths) {
    revalidatePath(path);
  }
}

export async function createFeePlan(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const raw = {
    name: String(formData.get("name") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    period: String(formData.get("period") ?? ""),
  };

  const parsed = feePlanSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: raw,
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  let createdPlan: { id: string } | null = null;

  try {
    createdPlan = await prisma.feePlan.create({
      data: {
        name: data.name,
        amount: Number(data.amount),
        period: data.period,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("تعذّر إنشاء خطة الرسوم:", error);
    return {
      success: false,
      message: "تعذّر حفظ خطة الرسوم حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  const session = await getSession();

  await logAudit({
    userId: session?.userId ?? null,
    action: "CREATE",
    entity: "FEE_PLAN",
    entityId: createdPlan?.id ?? null,
    details: `إنشاء خطة رسوم «${data.name}».`,
  });

  revalidateFees();
  redirect("/admin/fees?flash=plan-created");
}

export async function updateFeePlan(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const id = String(formData.get("feePlanId") ?? "").trim();

  if (!id) {
    return { success: false, message: "خطة الرسوم غير موجودة." };
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    period: String(formData.get("period") ?? ""),
  };

  const parsed = feePlanSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: raw,
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  try {
    await prisma.feePlan.update({
      where: { id },
      data: {
        name: data.name,
        amount: Number(data.amount),
        period: data.period,
      },
    });
  } catch (error) {
    console.error("تعذّر تعديل خطة الرسوم:", error);
    return {
      success: false,
      message: "تعذّر تعديل خطة الرسوم حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  const session = await getSession();

  await logAudit({
    userId: session?.userId ?? null,
    action: "UPDATE",
    entity: "FEE_PLAN",
    entityId: id,
    details: `تعديل خطة الرسوم «${data.name}».`,
  });

  revalidateFees();
  redirect("/admin/fees?flash=plan-updated");
}

export async function deleteFeePlan(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");

  const id = String(formData.get("feePlanId") ?? "").trim();

  if (!id) return;

  const plan = await prisma.feePlan.findUnique({
    where: { id },
    select: { name: true },
  });

  const inUse = await prisma.invoice.count({ where: { feePlanId: id } });

  if (inUse > 0) {
    redirect("/admin/fees?flash=plan-in-use");
  }

  try {
    await prisma.feePlan.delete({ where: { id } });
  } catch (error) {
    console.error("تعذّر حذف خطة الرسوم:", error);
    redirect("/admin/fees?flash=error");
  }

  await logAudit({
    userId: session.userId,
    action: "DELETE",
    entity: "FEE_PLAN",
    entityId: id,
    details: `حذف خطة الرسوم «${plan?.name ?? id}».`,
  });

  revalidateFees();
  redirect("/admin/fees?flash=plan-deleted");
}

export async function createInvoice(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("ADMIN");

  const raw = {
    studentId: String(formData.get("studentId") ?? ""),
    halaqaId: String(formData.get("halaqaId") ?? ""),
    feePlanId: String(formData.get("feePlanId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
  };

  const parsed = createInvoiceSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: raw,
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  if (!data.studentId && !data.halaqaId) {
    return {
      success: false,
      message: "يرجى اختيار طالب أو حلقة.",
      fieldErrors: { studentId: "يرجى اختيار طالب أو حلقة." },
      values: raw,
      submissionId: Date.now(),
    };
  }

  const feePlan = await prisma.feePlan.findUnique({
    where: { id: data.feePlanId },
  });

  if (!feePlan) {
    return {
      success: false,
      message: "خطة الرسوم غير موجودة.",
      submissionId: Date.now(),
    };
  }

  const amount = Number(data.amount);
  const dueDate = new Date(`${data.dueDate}T00:00:00.000Z`);

  let studentIds: string[] = [];

  if (data.studentId) {
    studentIds = [data.studentId];
  } else if (data.halaqaId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { halaqaId: data.halaqaId },
      select: { studentId: true },
    });
    studentIds = enrollments.map((enrollment) => enrollment.studentId);
  }

  if (studentIds.length === 0) {
    return {
      success: false,
      message: "لا يوجد طلاب في الحلقة المحددة.",
      submissionId: Date.now(),
    };
  }

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, status: { not: "ARCHIVED" } },
    select: {
      id: true,
      userId: true,
      parentId: true,
      user: { select: { name: true } },
    },
  });

  const allowedIds = new Set(students.map((student) => student.id));
  studentIds = studentIds.filter((id) => allowedIds.has(id));

  if (studentIds.length === 0) {
    return {
      success: false,
      message: "لا يوجد طلاب نشطون في الاختيار المحدد.",
      submissionId: Date.now(),
    };
  }

  const studentsById = new Map(
    students.map((student) => [student.id, student]),
  );

  let createdInvoices: { id: string; studentId: string }[] = [];

  try {
    createdInvoices = await prisma.$transaction(
      studentIds.map((studentId) =>
        prisma.invoice.create({
          data: {
            studentId,
            feePlanId: data.feePlanId,
            amount,
            dueDate,
            status: "PENDING",
          },
          select: { id: true, studentId: true },
        }),
      ),
    );
  } catch (error) {
    console.error("تعذّر إنشاء الفواتير:", error);
    return {
      success: false,
      message: "تعذّر إنشاء الفواتير حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  const settings = await getSchoolSettings();
  const formattedDueDate = arabicDateFormatter.format(dueDate);

  for (const invoice of createdInvoices) {
    const student = studentsById.get(invoice.studentId);

    if (!student) continue;

    if (student.parentId) {
      await notify(student.parentId, {
        title: "فاتورة مستحقة لابنكم",
        body: `فاتورة «${feePlan.name}» لـ ${student.user.name} بمبلغ ${formatMoney(amount, settings)} مستحقة بتاريخ ${formattedDueDate}.`,
        href: "/parent",
        event: "invoice",
      });
    } else {
      await notify(student.userId, {
        title: "فاتورة مستحقة",
        body: `فاتورة «${feePlan.name}» بمبلغ ${formatMoney(amount, settings)} مستحقة بتاريخ ${formattedDueDate}.`,
        href: "/student",
          event: "invoice",
      });
    }
  }

  await logAudit({
    userId: session.userId,
    action: "CREATE",
    entity: "INVOICE",
    entityId: createdInvoices[0]?.id ?? null,
    details: `إنشاء ${createdInvoices.length} فاتورة لخطة «${feePlan.name}» (مبلغ ${amount.toFixed(2)}، استحقاق ${formattedDueDate}).`,
  });

  revalidateFees();
  redirect("/admin/fees?flash=invoices-created");
}

export async function recordPayment(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const raw = {
    invoiceId: String(formData.get("invoiceId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    date: String(formData.get("date") ?? ""),
    method: String(formData.get("method") ?? ""),
    note: String(formData.get("note") ?? ""),
  };

  const parsed = paymentSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: raw,
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { payments: true },
  });

  if (!invoice) {
    return {
      success: false,
      message: "الفاتورة غير موجودة.",
      submissionId: Date.now(),
    };
  }

  const alreadyPaid = invoice.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const remaining = invoice.amount - alreadyPaid;

  if (Number(data.amount) > remaining + 0.001) {
    return {
      success: false,
      message: `المبلغ يتجاوز المتبقي (${remaining.toFixed(2)}).`,
      fieldErrors: { amount: "المبلغ يتجاوز المتبقي." },
      values: raw,
      submissionId: Date.now(),
    };
  }

  const session = await getSession();

  try {
    await prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: Number(data.amount),
        date: new Date(`${data.date}T00:00:00.000Z`),
        method: data.method,
        note: data.note || null,
        receivedBy: session?.userId ?? null,
      },
    });

    const newPaid = alreadyPaid + Number(data.amount);

    let newStatus: "PENDING" | "PAID" | "PARTIAL" = "PENDING";

    if (newPaid >= invoice.amount - 0.001) {
      newStatus = "PAID";
    } else if (newPaid > 0) {
      newStatus = "PARTIAL";
    }

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: { status: newStatus },
    });
  } catch (error) {
    console.error("تعذّر تسجيل الدفعة:", error);
    return {
      success: false,
      message: "تعذّر تسجيل الدفعة حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  await logAudit({
    userId: session?.userId ?? null,
    action: "CREATE",
    entity: "PAYMENT",
    entityId: data.invoiceId,
    details: `تسجيل دفعة ${Number(data.amount).toFixed(2)} (${data.method}) على الفاتورة ${data.invoiceId}.`,
  });

  revalidateFees();
  redirect(`/admin/fees/invoices/${data.invoiceId}?flash=payment-recorded`);
}

export async function waiveInvoice(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");

  const id = String(formData.get("invoiceId") ?? "").trim();

  if (!id) return;

  try {
    await prisma.invoice.update({
      where: { id },
      data: { status: "WAIVED" },
    });
  } catch (error) {
    console.error("تعذّر إعفاء الفاتورة:", error);
    redirect("/admin/fees?flash=error");
  }

  await logAudit({
    userId: session.userId,
    action: "UPDATE",
    entity: "INVOICE",
    entityId: id,
    details: `إعفاء الفاتورة ${id}.`,
  });

  revalidateFees();
  redirect("/admin/fees?flash=waived");
}
