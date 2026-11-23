"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { syncGoalStatuses } from "@/lib/memorization";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

import {
  attendanceStatusSchema,
  recitationFormSchema,
  zodFieldErrors,
} from "@/lib/validations/teacher";
import { ActionResult } from "@/lib/validations/admin";

export type { ActionResult };

export async function saveAttendance(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("TEACHER");

  const halaqaId = String(formData.get("halaqaId") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "").trim();

  if (!halaqaId || !dateStr) {
    return {
      success: false,
      message: "يرجى تحديد الحلقة والتاريخ.",
    };
  }

  const halaqa = await prisma.halaqa.findFirst({
    where: { id: halaqaId, teacherId: session.userId },
    select: { id: true, name: true },
  });

  if (!halaqa) {
    return {
      success: false,
      message: "الحلقة غير موجودة أو غير مسندة إليك.",
    };
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return {
      success: false,
      message: "يرجى إدخال تاريخ صحيح.",
    };
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { halaqaId },
    select: {
      studentId: true,
      student: {
        select: {
          userId: true,
          parentId: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (enrollments.length === 0) {
    return {
      success: false,
      message: "لا يوجد طلاب مسجلون في هذه الحلقة.",
    };
  }

  const statuses: { studentId: string; status: string }[] = [];

  for (const enrollment of enrollments) {
    const status = String(
      formData.get(`status_${enrollment.studentId}`) ?? "",
    ).trim();

    const parsed = attendanceStatusSchema.safeParse(status);

    if (!parsed.success) {
      return {
        success: false,
        message: "يرجى تحديد حالة جميع الطلاب.",
      };
    }

    statuses.push({ studentId: enrollment.studentId, status });
  }

  const existingAttendance = await prisma.attendance.findMany({
    where: {
      halaqaId,
      date,
      studentId: { in: enrollments.map((enrollment) => enrollment.studentId) },
    },
    select: { studentId: true, status: true },
  });

  const previousStatuses = new Map(
    existingAttendance.map((record) => [record.studentId, record.status]),
  );

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of statuses) {
        await tx.attendance.upsert({
          where: {
            studentId_halaqaId_date: {
              studentId: item.studentId,
              halaqaId,
              date,
            },
          },
          update: { status: item.status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" },
          create: {
            studentId: item.studentId,
            halaqaId,
            date,
            status: item.status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
          },
        });
      }
    });
  } catch (error) {
    console.error("تعذّر حفظ الحضور:", error);
    return {
      success: false,
      message: "تعذّر حفظ الحضور حاليًا. يرجى المحاولة مرة أخرى.",
    };
  }

  // إشعار ولي الأمر عند تسجيل غياب جديد (وليس عند إعادة حفظ غياب مسجّل).
  const absentIds = new Set(
    statuses
      .filter((item) => item.status === "ABSENT")
      .map((item) => item.studentId),
  );

  for (const enrollment of enrollments) {
    if (!absentIds.has(enrollment.studentId)) continue;
    if (previousStatuses.get(enrollment.studentId) === "ABSENT") continue;
    if (!enrollment.student.parentId) continue;

    await notify(enrollment.student.parentId, {
      title: "غياب الطالب",
      body: `تم تسجيل غياب ${enrollment.student.user.name} في حلقة «${halaqa.name}» بتاريخ ${dateStr}.`,
      href: "/parent",
      event: "absence",
    });
  }

  revalidatePath(`/teacher/halaqas/${halaqaId}/attendance`);
  revalidatePath(`/teacher/halaqas/${halaqaId}`);
  revalidatePath("/teacher");

  redirect(`/teacher/halaqas/${halaqaId}/attendance?date=${encodeURIComponent(dateStr)}&flash=saved`);
}

export async function saveRecitation(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("TEACHER");

  const halaqaId = String(formData.get("halaqaId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();

  if (!halaqaId || !studentId) {
    return {
      success: false,
      message: "بيانات التسميع غير مكتملة.",
    };
  }

  const halaqa = await prisma.halaqa.findFirst({
    where: { id: halaqaId, teacherId: session.userId },
    select: { id: true },
  });

  if (!halaqa) {
    return {
      success: false,
      message: "الحلقة غير موجودة أو غير مسندة إليك.",
    };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_halaqaId: { studentId, halaqaId } },
    select: { studentId: true },
  });

  if (!enrollment) {
    return {
      success: false,
      message: "الطالب غير مسجل في هذه الحلقة.",
    };
  }

  const raw = {
    type: String(formData.get("type") ?? ""),
    surahNumber: String(formData.get("surahNumber") ?? ""),
    fromAyah: String(formData.get("fromAyah") ?? ""),
    toAyah: String(formData.get("toAyah") ?? ""),
    grade: String(formData.get("grade") ?? ""),
    date: String(formData.get("date") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = recitationFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        type: raw.type,
        surahNumber: raw.surahNumber,
        fromAyah: raw.fromAyah,
        toAyah: raw.toAyah,
        grade: raw.grade,
        date: raw.date,
        notes: raw.notes,
      },
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  try {
    await prisma.recitationRecord.create({
      data: {
        studentId,
        teacherId: session.userId,
        date: new Date(`${data.date}T00:00:00.000Z`),
        type: data.type,
        surahNumber: data.surahNumber,
        fromAyah: data.fromAyah,
        toAyah: data.toAyah,
        grade: data.grade,
        notes: data.notes || null,
      },
    });
  } catch (error) {
    console.error("تعذّر حفظ التسميع:", error);
    return {
      success: false,
      message: "تعذّر حفظ التسميع حاليًا. يرجى المحاولة مرة أخرى.",
      values: {
        type: raw.type,
        surahNumber: raw.surahNumber,
        fromAyah: raw.fromAyah,
        toAyah: raw.toAyah,
        grade: raw.grade,
        date: raw.date,
        notes: raw.notes,
      },
      submissionId: Date.now(),
    };
  }

  revalidatePath(`/teacher/halaqas/${halaqaId}/students/${studentId}/recitation`);
  revalidatePath(`/teacher/halaqas/${halaqaId}/students/${studentId}/goal`);
  revalidatePath(`/teacher/halaqas/${halaqaId}`);
  revalidatePath("/teacher");

  await syncGoalStatuses(studentId);

  return {
    success: true,
    message: "تم حفظ التسميع بنجاح.",
    submissionId: Date.now(),
  };
}
