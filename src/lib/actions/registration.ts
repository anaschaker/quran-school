"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { notifyMany } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registrationRequestSchema } from "@/lib/validations/registration";
import { zodFieldErrors, type ActionResult } from "@/lib/validations/admin";
import { Role } from "@prisma/client";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // ساعة
const RATE_LIMIT_MAX = 5;

export async function submitRegistrationRequest(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { headers } = await import("next/headers");
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");
  const ip =
    (forwarded ? forwarded.split(",")[0].trim() : "") ||
    realIp?.trim() ||
    "unknown";

  const raw = {
    studentName: String(formData.get("studentName") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    parentName: String(formData.get("parentName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    stage: String(formData.get("stage") ?? ""),
    currentMemorization: String(formData.get("currentMemorization") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    website: String(formData.get("website") ?? ""),
  };

  // honeypot: إذا تم تعبئته، ن pretent success.
  if (raw.website.trim() !== "") {
    return {
      success: true,
      message: "تم استلام طلبك بنجاح. سنتواصل معك قريبًا.",
      submissionId: Date.now(),
    };
  }

  const parsed = registrationRequestSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        studentName: raw.studentName,
        birthDate: raw.birthDate,
        parentName: raw.parentName,
        phone: raw.phone,
        email: raw.email,
        stage: raw.stage,
        currentMemorization: raw.currentMemorization,
        notes: raw.notes,
      },
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  // Rate limit by IP (last hour).
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentCount = await prisma.registrationRequest.count({
    where: { ipAddress: ip, createdAt: { gte: since } },
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    return {
      success: false,
      message:
        "لقد تجاوزت الحد الأقصى للطلبات (5 طلبات في الساعة). يرجى المحاولة لاحقًا.",
      submissionId: Date.now(),
    };
  }

  try {
    await prisma.registrationRequest.create({
      data: {
        studentName: data.studentName,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        parentName: data.parentName,
        phone: data.phone,
        email: data.email,
        stage: data.stage,
        currentMemorization: data.currentMemorization || null,
        notes: data.notes || null,
        ipAddress: ip,
      },
    });
  } catch (error) {
    console.error("تعذّر حفظ طلب التسجيل:", error);
    return {
      success: false,
      message: "تعذّر إرسال الطلب حاليًا. يرجى المحاولة مرة أخرى.",
      values: {
        studentName: raw.studentName,
        birthDate: raw.birthDate,
        parentName: raw.parentName,
        phone: raw.phone,
        email: raw.email,
        stage: raw.stage,
        currentMemorization: raw.currentMemorization,
        notes: raw.notes,
      },
      submissionId: Date.now(),
    };
  }

  // إشعار المدراء.
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { id: true },
  });

  await notifyMany(
    admins.map((admin) => admin.id),
    {
      title: "طلب تسجيل جديد",
      body: `طلب تسجيل جديد من ${data.parentName} لـ ${data.studentName} (${data.stage}).`,
      href: "/admin/registrations",
    },
  );

  return {
    success: true,
    message: "تم استلام طلبك بنجاح. سنتواصل معك قريبًا.",
    submissionId: Date.now(),
  };
}

export async function approveRegistrationRequest(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  if (!id) redirect("/admin/registrations?flash=error");

  const request = await prisma.registrationRequest.findUnique({
    where: { id },
  });

  if (!request || request.status !== "PENDING") {
    redirect("/admin/registrations?flash=error");
  }

  // كلمة مرور مؤقتة
  const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
  const passwordHash = await hashPassword(tempPassword);

  try {
    await prisma.$transaction(async (tx) => {
      // ولي أمر: أعد استخدام حساب موجود إن وُجد.
      let parentId = request.email
        ? (
            await tx.user.findUnique({
              where: { email: request.email },
              select: { id: true, role: true },
            })
          )?.id
        : null;

      const existing = parentId
        ? await tx.user.findUnique({ where: { id: parentId }, select: { role: true } })
        : null;

      if (existing && existing.role !== "PARENT") {
        throw new Error("email-in-use");
      }

      if (!parentId) {
        const parent = await tx.user.create({
          data: {
            name: request.parentName,
            email: request.email,
            phone: request.phone,
            passwordHash,
            role: Role.PARENT,
            mustChangePassword: true,
          },
          select: { id: true },
        });
        parentId = parent.id;
      }

      const studentUser = await tx.user.create({
        data: {
          name: request.studentName,
          email: `student-${request.id}@quran-school.test`,
          passwordHash,
          role: Role.STUDENT,
          mustChangePassword: true,
        },
        select: { id: true },
      });

      await tx.student.create({
        data: {
          userId: studentUser.id,
          birthDate: request.birthDate,
          stage: request.stage,
          parentId,
          notes: request.notes,
        },
      });

      await tx.registrationRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          adminNote: adminNote || null,
          reviewedBy: session.userId,
          reviewedAt: new Date(),
        },
      });
    });
  } catch (error) {
    console.error("تعذّر قبول طلب التسجيل:", error);
    redirect("/admin/registrations?flash=error");
  }

  await logAudit({
    userId: session.userId,
    action: "UPDATE",
    entity: "STUDENT",
    entityId: id,
    details: `قبول طلب تسجيل: ${request.studentName} (ولي الأمر: ${request.parentName}).`,
  });

  revalidatePath("/admin/registrations");
  redirect(`/admin/registrations?flash=approved&tempPassword=${encodeURIComponent(tempPassword)}`);
}

export async function rejectRegistrationRequest(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  if (!id) redirect("/admin/registrations?flash=error");

  const request = await prisma.registrationRequest.findUnique({ where: { id } });

  if (!request || request.status !== "PENDING") {
    redirect("/admin/registrations?flash=error");
  }

  try {
    await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        adminNote: adminNote || "تم الرفض.",
        reviewedBy: session.userId,
        reviewedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("تعذّر رفض طلب التسجيل:", error);
    redirect("/admin/registrations?flash=error");
  }

  await logAudit({
    userId: session.userId,
    action: "UPDATE",
    entity: "STUDENT",
    entityId: id,
    details: `رفض طلب تسجيل: ${request.studentName}.`,
  });

  revalidatePath("/admin/registrations");
  redirect("/admin/registrations?flash=rejected");
}
