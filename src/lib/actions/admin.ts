"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { STUDENT_STATUS_LABELS } from "@/lib/student-status";
import { Role } from "@prisma/client";

import {
  halaqaFormSchema,
  studentFormSchema,
  teacherFormSchema,
  zodFieldErrors,
  type ActionResult,
} from "@/lib/validations/admin";

export type { ActionResult } from "@/lib/validations/admin";

function getUniqueField(error: unknown): "email" | "phone" | null {
  const prismaError = error as {
    code?: string;
    meta?: { target?: string | string[] };
  };

  if (prismaError?.code !== "P2002") return null;

  const target = Array.isArray(prismaError.meta?.target)
    ? prismaError.meta?.target
    : [prismaError.meta?.target];

  if (target.includes("email")) return "email";
  if (target.includes("phone")) return "phone";

  return null;
}

function uniqueMessage(field: "email" | "phone"): string {
  return field === "email"
    ? "البريد الإلكتروني مستخدم بالفعل."
    : "رقم الهاتف مستخدم بالفعل.";
}

function uniqueFieldError(field: "email" | "phone"): string {
  return field === "email"
    ? "هذا البريد الإلكتروني مستخدم بالفعل."
    : "رقم الهاتف هذا مستخدم بالفعل.";
}

// ─────────────────────────────────────────────
// الطلاب
// ─────────────────────────────────────────────

export async function createStudent(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("ADMIN");

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    stage: String(formData.get("stage") ?? ""),
    parentId: String(formData.get("parentId") ?? ""),
    status: String(formData.get("status") ?? "ACTIVE"),
    notes: String(formData.get("notes") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = studentFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        birthDate: raw.birthDate,
        stage: raw.stage,
        parentId: raw.parentId,
        notes: raw.notes,
      },
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  if (data.parentId) {
    const parent = await prisma.user.findUnique({
      where: { id: data.parentId },
      select: { role: true },
    });

    if (!parent || parent.role !== "PARENT") {
      return {
        success: false,
        message: "ولي الأمر المحدد غير موجود.",
        fieldErrors: { parentId: "ولي الأمر المحدد غير موجود." },
        values: {
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
          birthDate: raw.birthDate,
          stage: raw.stage,
          parentId: raw.parentId,
          notes: raw.notes,
        },
        submissionId: Date.now(),
      };
    }
  }

  if (!data.password) {
    return {
      success: false,
      message: "يرجى إدخال كلمة المرور.",
      fieldErrors: { password: "كلمة المرور مطلوبة لإنشاء حساب الطالب." },
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        birthDate: raw.birthDate,
        stage: raw.stage,
        parentId: raw.parentId,
        notes: raw.notes,
      },
      submissionId: Date.now(),
    };
  }

  let createdStudent: { id: string; name: string } | null = null;

  try {
    createdStudent = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          passwordHash: await hashPassword(data.password as string),
          role: Role.STUDENT,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          stage: data.stage,
          parentId: data.parentId || null,
          status: data.status,
          notes: data.notes || null,
        },
        select: { id: true },
      });

      return { id: student.id, name: user.name };
    });
  } catch (error) {
    const field = getUniqueField(error);

    if (field) {
      return {
        success: false,
        message: uniqueMessage(field),
        fieldErrors: { [field]: uniqueFieldError(field) },
        values: {
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
          birthDate: raw.birthDate,
          stage: raw.stage,
          parentId: raw.parentId,
          notes: raw.notes,
        },
        submissionId: Date.now(),
      };
    }

    console.error("تعذّر إنشاء الطالب:", error);
    return {
      success: false,
      message: "تعذّر إنشاء الطالب حاليًا. يرجى المحاولة مرة أخرى.",
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        birthDate: raw.birthDate,
        stage: raw.stage,
        parentId: raw.parentId,
        notes: raw.notes,
      },
      submissionId: Date.now(),
    };
  }

  if (createdStudent) {
    await logAudit({
      userId: session.userId,
      action: "CREATE",
      entity: "STUDENT",
      entityId: createdStudent.id,
      details: `إنشاء الطالب «${createdStudent.name}» — الحالة: ${STUDENT_STATUS_LABELS[data.status]}.`,
    });
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/students?flash=created");
}

export async function updateStudent(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("ADMIN");

  const studentId = String(formData.get("studentId") ?? "").trim();

  if (!studentId) {
    return {
      success: false,
      message: "الطالب غير موجود.",
    };
  }

  const existing = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!existing) {
    return {
      success: false,
      message: "الطالب غير موجود.",
    };
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    stage: String(formData.get("stage") ?? ""),
    parentId: String(formData.get("parentId") ?? ""),
    status: String(formData.get("status") ?? existing.status),
    notes: String(formData.get("notes") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = studentFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        birthDate: raw.birthDate,
        stage: raw.stage,
        parentId: raw.parentId,
        status: raw.status,
        notes: raw.notes,
      },
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  if (data.parentId) {
    const parent = await prisma.user.findUnique({
      where: { id: data.parentId },
      select: { role: true },
    });

    if (!parent || parent.role !== "PARENT") {
      return {
        success: false,
        message: "ولي الأمر المحدد غير موجود.",
        fieldErrors: { parentId: "ولي الأمر المحدد غير موجود." },
        values: {
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
          birthDate: raw.birthDate,
          stage: raw.stage,
          parentId: raw.parentId,
          status: raw.status,
          notes: raw.notes,
        },
        submissionId: Date.now(),
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          ...(data.password ? { passwordHash: await hashPassword(data.password as string) } : {}),
        },
      });

      await tx.student.update({
        where: { id: studentId },
        data: {
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          stage: data.stage,
          parentId: data.parentId || null,
          status: data.status,
          notes: data.notes || null,
        },
      });
    });
  } catch (error) {
    const field = getUniqueField(error);

    if (field) {
      return {
        success: false,
        message: uniqueMessage(field),
        fieldErrors: { [field]: uniqueFieldError(field) },
        values: {
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
          birthDate: raw.birthDate,
          stage: raw.stage,
          parentId: raw.parentId,
          notes: raw.notes,
        },
        submissionId: Date.now(),
      };
    }

    console.error("تعذّر تعديل الطالب:", error);
    return {
      success: false,
      message: "تعذّر تعديل الطالب حاليًا. يرجى المحاولة مرة أخرى.",
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        birthDate: raw.birthDate,
        stage: raw.stage,
        parentId: raw.parentId,
        notes: raw.notes,
      },
      submissionId: Date.now(),
    };
  }

  await logAudit({
    userId: session.userId,
    action: "UPDATE",
    entity: "STUDENT",
    entityId: studentId,
    details: `تعديل بيانات الطالب «${data.name}» — الحالة: ${STUDENT_STATUS_LABELS[data.status]}.`,
  });

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}/edit`);
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/students?flash=updated");
}

export async function archiveStudent(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");

  const studentId = String(formData.get("id") ?? "").trim();

  if (!studentId) {
    redirect("/admin/students?flash=error");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { name: true } } },
  });

  if (!student) {
    redirect("/admin/students?flash=error");
  }

  if (student.status === "ARCHIVED") {
    redirect("/admin/students?flash=archived");
  }

  try {
    await prisma.student.update({
      where: { id: studentId },
      data: { status: "ARCHIVED" },
    });
  } catch (error) {
    console.error("تعذّر أرشفة الطالب:", error);
    redirect("/admin/students?flash=error");
  }

  await logAudit({
    userId: session.userId,
    action: "ARCHIVE",
    entity: "STUDENT",
    entityId: studentId,
    details: `أرشفة الطالب «${student.user.name}».`,
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/students?flash=archived");
}

export async function restoreStudent(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");

  const studentId = String(formData.get("id") ?? "").trim();

  if (!studentId) {
    redirect("/admin/students?flash=error");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { name: true } } },
  });

  if (!student) {
    redirect("/admin/students?flash=error");
  }

  try {
    await prisma.student.update({
      where: { id: studentId },
      data: { status: "ACTIVE" },
    });
  } catch (error) {
    console.error("تعذّر استعادة الطالب:", error);
    redirect("/admin/students?flash=error");
  }

  await logAudit({
    userId: session.userId,
    action: "RESTORE",
    entity: "STUDENT",
    entityId: studentId,
    details: `استعادة الطالب «${student.user.name}» إلى الحالة النشطة.`,
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/students?flash=restored");
}

// ─────────────────────────────────────────────
// المعلمون
// ─────────────────────────────────────────────

export async function createTeacher(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = teacherFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
      },
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  if (!data.password) {
    return {
      success: false,
      message: "يرجى إدخال كلمة المرور.",
      fieldErrors: { password: "كلمة المرور مطلوبة لإنشاء حساب المعلم." },
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
      },
      submissionId: Date.now(),
    };
  }

  try {
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash: await hashPassword(data.password as string),
        role: Role.TEACHER,
      },
    });
  } catch (error) {
    const field = getUniqueField(error);

    if (field) {
      return {
        success: false,
        message: uniqueMessage(field),
        fieldErrors: { [field]: uniqueFieldError(field) },
        values: {
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
        },
        submissionId: Date.now(),
      };
    }

    console.error("تعذّر إنشاء المعلم:", error);
    return {
      success: false,
      message: "تعذّر إنشاء المعلم حاليًا. يرجى المحاولة مرة أخرى.",
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
      },
      submissionId: Date.now(),
    };
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
  redirect("/admin/teachers?flash=created");
}

export async function updateTeacher(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const teacherId = String(formData.get("teacherId") ?? "").trim();

  if (!teacherId) {
    return {
      success: false,
      message: "المعلم غير موجود.",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { id: true, role: true },
  });

  if (!existing || existing.role !== "TEACHER") {
    return {
      success: false,
      message: "المعلم غير موجود.",
    };
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = teacherFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
      },
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  try {
    await prisma.user.update({
      where: { id: teacherId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        ...(data.password ? { passwordHash: await hashPassword(data.password as string) } : {}),
      },
    });
  } catch (error) {
    const field = getUniqueField(error);

    if (field) {
      return {
        success: false,
        message: uniqueMessage(field),
        fieldErrors: { [field]: uniqueFieldError(field) },
        values: {
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
        },
        submissionId: Date.now(),
      };
    }

    console.error("تعذّر تعديل المعلم:", error);
    return {
      success: false,
      message: "تعذّر تعديل المعلم حاليًا. يرجى المحاولة مرة أخرى.",
      values: {
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
      },
      submissionId: Date.now(),
    };
  }

  revalidatePath("/admin/teachers");
  revalidatePath(`/admin/teachers/${teacherId}/edit`);
  revalidatePath("/admin");
  redirect("/admin/teachers?flash=updated");
}

export async function deleteTeacher(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const teacherId = String(formData.get("id") ?? "").trim();

  if (!teacherId) {
    redirect("/admin/teachers?flash=error");
  }

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      role: true,
      _count: {
        select: {
          halaqas: true,
          recitations: true,
        },
      },
    },
  });

  if (!teacher || teacher.role !== "TEACHER") {
    redirect("/admin/teachers?flash=error");
  }

  if (teacher._count.halaqas > 0 || teacher._count.recitations > 0) {
    redirect("/admin/teachers?flash=teacher-has-dependencies");
  }

  try {
    await prisma.user.delete({ where: { id: teacherId } });
  } catch (error) {
    console.error("تعذّر حذف المعلم:", error);
    redirect("/admin/teachers?flash=error");
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
  redirect("/admin/teachers?flash=deleted");
}
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// الحلقات
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createHalaqa(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("ADMIN");

  const raw = {
    name: String(formData.get("name") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
    time: String(formData.get("time") ?? ""),
    days: String(formData.get("days") ?? ""),
    maxStudents: String(formData.get("maxStudents") ?? ""),
  };

  const parsed = halaqaFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        name: raw.name,
        teacherId: raw.teacherId,
        time: raw.time,
        days: raw.days,
        maxStudents: raw.maxStudents,
      },
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  const teacher = await prisma.user.findUnique({
    where: { id: data.teacherId },
    select: { role: true },
  });

  if (!teacher || teacher.role !== "TEACHER") {
    return {
      success: false,
      message: "المعلم المحدد غير موجود.",
      fieldErrors: { teacherId: "المعلم المحدد غير موجود." },
      values: {
        name: raw.name,
        teacherId: raw.teacherId,
        time: raw.time,
        days: raw.days,
        maxStudents: raw.maxStudents,
      },
      submissionId: Date.now(),
    };
  }

  let createdHalaqa: { id: string } | null = null;

  try {
    createdHalaqa = await prisma.halaqa.create({
      data: {
        name: data.name,
        teacherId: data.teacherId,
        time: data.time,
        days: data.days,
        maxStudents: data.maxStudents,
      },
      select: { id: true },
    });
  } catch (error) {
    const prismaError = error as {
      code?: string;
      meta?: { target?: string | string[] };
    };

    if (prismaError?.code === "P2002") {
      return {
        success: false,
        message: "اسم الحلقة مستخدم بالفعل.",
        fieldErrors: { name: "اسم الحلقة هذا مستخدم بالفعل." },
        values: {
          name: raw.name,
          teacherId: raw.teacherId,
          time: raw.time,
          days: raw.days,
          maxStudents: raw.maxStudents,
        },
        submissionId: Date.now(),
      };
    }

    console.error("تعذّر إنشاء الحلقة:", error);
    return {
      success: false,
      message: "تعذّر إنشاء الحلقة حاليًا. يرجى المحاولة مرة أخرى.",
      values: {
        name: raw.name,
        teacherId: raw.teacherId,
        time: raw.time,
        days: raw.days,
        maxStudents: raw.maxStudents,
      },
      submissionId: Date.now(),
    };
  }

  if (createdHalaqa) {
    await logAudit({
      userId: session.userId,
      action: "CREATE",
      entity: "HALAQA",
      entityId: createdHalaqa.id,
      details: `إنشاء الحلقة «${data.name}».`,
    });
  }

  revalidatePath("/admin/halaqas");
  revalidatePath("/admin");
  redirect("/admin/halaqas?flash=created");
}

export async function updateHalaqa(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("ADMIN");

  const halaqaId = String(formData.get("halaqaId") ?? "").trim();

  if (!halaqaId) {
    return {
      success: false,
      message: "الحلقة غير موجودة.",
    };
  }

  const existing = await prisma.halaqa.findUnique({
    where: { id: halaqaId },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      message: "الحلقة غير موجودة.",
    };
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
    time: String(formData.get("time") ?? ""),
    days: String(formData.get("days") ?? ""),
    maxStudents: String(formData.get("maxStudents") ?? ""),
  };

  const parsed = halaqaFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        name: raw.name,
        teacherId: raw.teacherId,
        time: raw.time,
        days: raw.days,
        maxStudents: raw.maxStudents,
      },
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  const teacher = await prisma.user.findUnique({
    where: { id: data.teacherId },
    select: { role: true },
  });

  if (!teacher || teacher.role !== "TEACHER") {
    return {
      success: false,
      message: "المعلم المحدد غير موجود.",
      fieldErrors: { teacherId: "المعلم المحدد غير موجود." },
      values: {
        name: raw.name,
        teacherId: raw.teacherId,
        time: raw.time,
        days: raw.days,
        maxStudents: raw.maxStudents,
      },
      submissionId: Date.now(),
    };
  }

  try {
    await prisma.halaqa.update({
      where: { id: halaqaId },
      data: {
        name: data.name,
        teacherId: data.teacherId,
        time: data.time,
        days: data.days,
        maxStudents: data.maxStudents,
      },
    });
  } catch (error) {
    const prismaError = error as {
      code?: string;
      meta?: { target?: string | string[] };
    };

    if (prismaError?.code === "P2002") {
      return {
        success: false,
        message: "اسم الحلقة مستخدم بالفعل.",
        fieldErrors: { name: "اسم الحلقة هذا مستخدم بالفعل." },
        values: {
          name: raw.name,
          teacherId: raw.teacherId,
          time: raw.time,
          days: raw.days,
          maxStudents: raw.maxStudents,
        },
        submissionId: Date.now(),
      };
    }

    console.error("تعذّر تعديل الحلقة:", error);
    return {
      success: false,
      message: "تعذّر تعديل الحلقة حاليًا. يرجى المحاولة مرة أخرى.",
      values: {
        name: raw.name,
        teacherId: raw.teacherId,
        time: raw.time,
        days: raw.days,
        maxStudents: raw.maxStudents,
      },
      submissionId: Date.now(),
    };
  }

  await logAudit({
    userId: session.userId,
    action: "UPDATE",
    entity: "HALAQA",
    entityId: halaqaId,
    details: `تعديل الحلقة «${data.name}».`,
  });

  revalidatePath("/admin/halaqas");
  revalidatePath(`/admin/halaqas/${halaqaId}`);
  revalidatePath(`/admin/halaqas/${halaqaId}/edit`);
  revalidatePath("/admin");
  redirect("/admin/halaqas?flash=updated");
}

export async function deleteHalaqa(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");

  const halaqaId = String(formData.get("id") ?? "").trim();

  if (!halaqaId) {
    redirect("/admin/halaqas?flash=error");
  }

  const halaqa = await prisma.halaqa.findUnique({
    where: { id: halaqaId },
    select: { id: true, name: true },
  });

  if (!halaqa) {
    redirect("/admin/halaqas?flash=error");
  }

  try {
    await prisma.halaqa.delete({ where: { id: halaqaId } });
  } catch (error) {
    console.error("تعذّر حذف الحلقة:", error);
    redirect("/admin/halaqas?flash=error");
  }

  await logAudit({
    userId: session.userId,
    action: "DELETE",
    entity: "HALAQA",
    entityId: halaqaId,
    details: `حذف الحلقة «${halaqa.name}».`,
  });

  revalidatePath("/admin/halaqas");
  revalidatePath("/admin");
  redirect("/admin/halaqas?flash=deleted");
}

export async function addStudentToHalaqa(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const halaqaId = String(formData.get("halaqaId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();

  if (!halaqaId || !studentId) {
    return {
      success: false,
      message: "يرجى اختيار طالب.",
    };
  }

  const [halaqa, student, enrollmentCount] = await Promise.all([
    prisma.halaqa.findUnique({
      where: { id: halaqaId },
      select: { id: true, maxStudents: true, name: true },
    }),
    prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, user: { select: { name: true } } },
    }),
    prisma.enrollment.count({ where: { halaqaId } }),
  ]);

  if (!halaqa) {
    return {
      success: false,
      message: "الحلقة غير موجودة.",
    };
  }

  if (!student) {
    return {
      success: false,
      message: "الطالب غير موجود.",
    };
  }

  if (enrollmentCount >= halaqa.maxStudents) {
    return {
      success: false,
      message: `تم بلوغ الحد الأقصى للطلاب (${halaqa.maxStudents}) في هذه الحلقة.`,
    };
  }

  try {
    await prisma.enrollment.create({
      data: { studentId, halaqaId },
    });
  } catch (error) {
    const prismaError = error as { code?: string };

    if (prismaError?.code === "P2002") {
      return {
        success: false,
        message: "الطالب مسجّل في هذه الحلقة بالفعل.",
      };
    }

    console.error("تعذّر إضافة الطالب إلى الحلقة:", error);
    return {
      success: false,
      message: "تعذّر إضافة الطالب حاليًا. يرجى المحاولة مرة أخرى.",
    };
  }

  revalidatePath(`/admin/halaqas/${halaqaId}`);
  revalidatePath("/admin/halaqas");
  revalidatePath("/admin");
  redirect(`/admin/halaqas/${halaqaId}?flash=student-added`);
}

export async function removeStudentFromHalaqa(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const halaqaId = String(formData.get("halaqaId") ?? "").trim();
  const studentId = String(formData.get("id") ?? "").trim();

  if (!halaqaId || !studentId) {
    redirect(`/admin/halaqas/${halaqaId || ""}?flash=error`);
  }

  try {
    await prisma.enrollment.delete({
      where: { studentId_halaqaId: { studentId, halaqaId } },
    });
  } catch (error) {
    console.error("تعذّر إزالة الطالب من الحلقة:", error);
    redirect(`/admin/halaqas/${halaqaId}?flash=error`);
  }

  revalidatePath(`/admin/halaqas/${halaqaId}`);
  revalidatePath("/admin/halaqas");
  revalidatePath("/admin");
  redirect(`/admin/halaqas/${halaqaId}?flash=student-removed`);
}
