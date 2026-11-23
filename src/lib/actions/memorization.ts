"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSurah } from "@/data/surahs";
import { requireRole } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  zodFieldErrors,
  type ActionResult,
} from "@/lib/validations/admin";
import { memorizationGoalSchema } from "@/lib/validations/memorization";

export type { ActionResult };

function formatGoalRange(
  fromSurah: number,
  fromAyah: number,
  toSurah: number,
  toAyah: number,
): string {
  const from = getSurah(fromSurah);
  const to = getSurah(toSurah);

  if (fromSurah === toSurah) {
    return `سورة ${from?.name ?? fromSurah} (الآية ${fromAyah} إلى ${toAyah})`;
  }

  return `من سورة ${from?.name ?? fromSurah} (الآية ${fromAyah}) إلى سورة ${to?.name ?? toSurah} (الآية ${toAyah})`;
}

async function teacherOwnsStudent(
  teacherId: string,
  studentId: string,
): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, halaqa: { teacherId } },
    select: { id: true },
  });

  return Boolean(enrollment);
}

export async function createGoal(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("TEACHER");

  const studentId = String(formData.get("studentId") ?? "").trim();

  if (!studentId) {
    return {
      success: false,
      message: "الطالب غير محدد.",
    };
  }

  const owns = await teacherOwnsStudent(session.userId, studentId);

  if (!owns) {
    return {
      success: false,
      message: "لا يمكنك إضافة هدف لطالب غير مسجّل في حلقاتك.",
    };
  }

  const raw = {
    fromSurah: String(formData.get("fromSurah") ?? ""),
    fromAyah: String(formData.get("fromAyah") ?? ""),
    toSurah: String(formData.get("toSurah") ?? ""),
    toAyah: String(formData.get("toAyah") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    targetDate: String(formData.get("targetDate") ?? ""),
  };

  const parsed = memorizationGoalSchema.safeParse(raw);

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

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      userId: true,
      parentId: true,
      user: { select: { name: true } },
    },
  });

  if (!student) {
    return {
      success: false,
      message: "الطالب غير موجود.",
      submissionId: Date.now(),
    };
  }

  try {
    await prisma.memorizationGoal.create({
      data: {
        studentId,
        fromSurah: data.fromSurah,
        fromAyah: data.fromAyah,
        toSurah: data.toSurah,
        toAyah: data.toAyah,
        startDate: new Date(`${data.startDate}T00:00:00.000Z`),
        targetDate: new Date(`${data.targetDate}T00:00:00.000Z`),
        status: "ACTIVE",
      },
    });
  } catch (error) {
    console.error("تعذّر إنشاء هدف الحفظ:", error);
    return {
      success: false,
      message: "تعذّر حفظ خطة الحفظ حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  const rangeLabel = formatGoalRange(
    data.fromSurah,
    data.fromAyah,
    data.toSurah,
    data.toAyah,
  );

  await notify(student.userId, {
    title: "خطة حفظ جديدة",
    body: `تم تحديد هدف حفظ جديد لك: ${rangeLabel}.`,
    href: "/student",
  });

  if (student.parentId) {
    await notify(student.parentId, {
      title: "خطة حفظ جديدة لابنكم",
      body: `تم تحديد هدف حفظ جديد لـ ${student.user.name}: ${rangeLabel}.`,
      href: "/parent",
    });
  }

  revalidatePath(`/teacher/halaqas/${String(formData.get("halaqaId") ?? "")}`);
  revalidatePath("/teacher");
  revalidatePath("/student");
  revalidatePath("/parent");

  redirect(
    `/teacher/halaqas/${String(formData.get("halaqaId") ?? "")}/students/${studentId}/goal?flash=created`,
  );
}

export async function cancelGoal(formData: FormData): Promise<void> {
  const session = await requireRole("TEACHER");

  const goalId = String(formData.get("goalId") ?? "").trim();
  const halaqaId = String(formData.get("halaqaId") ?? "").trim();

  if (!goalId) {
    redirect("/teacher");
  }

  const goal = await prisma.memorizationGoal.findUnique({
    where: { id: goalId },
    select: { id: true, studentId: true },
  });

  if (!goal) {
    redirect(`/teacher/halaqas/${halaqaId}`);
  }

  const owns = await teacherOwnsStudent(session.userId, goal.studentId);

  if (!owns) {
    redirect(`/teacher/halaqas/${halaqaId}`);
  }

  try {
    await prisma.memorizationGoal.update({
      where: { id: goalId },
      data: { status: "CANCELLED" },
    });
  } catch (error) {
    console.error("تعذّر إلغاء هدف الحفظ:", error);
  }

  revalidatePath(`/teacher/halaqas/${halaqaId}`);
  revalidatePath("/teacher");
  revalidatePath("/student");
  revalidatePath("/parent");

  redirect(
    `/teacher/halaqas/${halaqaId}/students/${goal.studentId}/goal?flash=cancelled`,
  );
}
