"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { zodFieldErrors, type ActionResult } from "@/lib/validations/admin";

const excuseSchema = z.object({
  studentId: z.string().trim().min(1, "يرجى اختيار الطالب."),
  date: z.string().trim().min(1, "يرجى تحديد التاريخ."),
  reason: z.string().trim().min(5, "السبب يجب أن يحتوي على 5 أحرف على الأقل.").max(500),
});

export async function submitExcuse(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "PARENT") redirect("/login");

  const raw = {
    studentId: String(formData.get("studentId") ?? ""),
    date: String(formData.get("date") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  };

  const parsed = excuseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: raw,
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  // تحقق من ملكية الطالب.
  const student = await prisma.student.findFirst({
    where: { id: data.studentId, parentId: session.userId },
    select: { id: true },
  });

  if (!student) {
    return {
      success: false,
      message: "لا يمكنك إرسال عذر لطالب غير مرتبط بك.",
      submissionId: Date.now(),
    };
  }

  const date = new Date(`${data.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return {
      success: false,
      message: "تاريخ غير صحيح.",
      submissionId: Date.now(),
    };
  }

  try {
    await prisma.excuse.create({
      data: {
        studentId: data.studentId,
        date,
        reason: data.reason,
      },
    });
  } catch (error) {
    console.error("تعذّر حفظ العذر:", error);
    return {
      success: false,
      message: "تعذّر إرسال العذر. يرجى المحاولة مرة أخرى.",
      submissionId: Date.now(),
    };
  }

  revalidatePath("/parent");
  return {
    success: true,
    message: "تم إرسال العذر. بانتظار موافقة المعلم/المدير.",
    submissionId: Date.now(),
  };
}

export async function reviewExcuse(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();

  if (!id || (decision !== "APPROVED" && decision !== "REJECTED")) {
    redirect("/admin/excuses?flash=error");
  }

  const excuse = await prisma.excuse.findUnique({
    where: { id },
    include: { student: { include: { user: true } } },
  });

  if (!excuse || excuse.status !== "PENDING") {
    redirect("/admin/excuses?flash=error");
  }

  // إذا معلم، تحقق من ملكية الطالب (مسجل في حلقاته).
  if (session.role === "TEACHER") {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: excuse.studentId, halaqa: { teacherId: session.userId } },
    });
    if (!enrollment) {
      redirect("/admin/excuses?flash=error");
    }
  }

  try {
    await prisma.excuse.update({
      where: { id },
      data: {
        status: decision,
        reviewedBy: session.userId,
        reviewedAt: new Date(),
      },
    });

    if (decision === "APPROVED") {
      // تحويل الغياب إلى EXCUSED (إن وُجد سجل حضور).
      await prisma.attendance.updateMany({
        where: { studentId: excuse.studentId, date: excuse.date },
        data: { status: "EXCUSED" },
      });
    }
  } catch (error) {
    console.error("تعذّر مراجعة العذر:", error);
    redirect("/admin/excuses?flash=error");
  }

  revalidatePath("/admin/excuses");
  revalidatePath("/parent");
  redirect("/admin/excuses?flash=" + (decision === "APPROVED" ? "approved" : "rejected"));
}
