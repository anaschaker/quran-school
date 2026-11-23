"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME } from "@/lib/session";
import { issueCertificateSchema } from "@/lib/validations/certificates";
import { zodFieldErrors, type ActionResult } from "@/lib/validations/admin";

function generateSerial(): string {
  const year = new Date().getFullYear();
  const bytes = crypto.getRandomValues(new Uint8Array(3));
  const suffix = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  )
    .join("")
    .toUpperCase();
  return `CERT-${year}-${suffix}`;
}

async function ensureTeacherOwnsStudent(
  teacherId: string,
  studentId: string,
): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      halaqa: { teacherId },
    },
  });

  return Boolean(enrollment);
}

export async function issueCertificate(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN" && session.role !== "TEACHER") {
    redirect(ROLE_HOME[session.role]);
  }

  const raw = {
    studentId: String(formData.get("studentId") ?? ""),
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
  };

  const parsed = issueCertificateSchema.safeParse(raw);

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

  if (session.role === "TEACHER") {
    const owns = await ensureTeacherOwnsStudent(session.userId, data.studentId);

    if (!owns) {
      return {
        success: false,
        message: "لا يمكنك إصدار شهادة لطالب غير مسجّل في حلقاتك.",
        submissionId: Date.now(),
      };
    }
  }

  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
    include: { user: true },
  });

  if (!student) {
    return {
      success: false,
      message: "الطالب غير موجود.",
      submissionId: Date.now(),
    };
  }

  let serial = generateSerial();
  let attempts = 0;

  while (attempts < 5) {
    const existing = await prisma.certificate.findUnique({
      where: { serialNumber: serial },
    });

    if (!existing) break;

    serial = generateSerial();
    attempts += 1;
  }

  let certificateId: string;

  try {
    const certificate = await prisma.certificate.create({
      data: {
        studentId: data.studentId,
        type: data.type,
        title: data.title,
        serialNumber: serial,
        issuedBy: session.userId,
      },
      select: { id: true },
    });

    certificateId = certificate.id;
  } catch (error) {
    console.error("تعذّر إصدار الشهادة:", error);
    return {
      success: false,
      message: "تعذّر إصدار الشهادة حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  await logAudit({
    userId: session.userId,
    action: "CREATE",
    entity: "CERTIFICATE",
    entityId: certificateId,
    details: `إصدار شهادة «${data.title}» (${data.type}) للطالب «${student.user.name}».`,
  });

  await notify(student.userId, {
    title: "شهادة جديدة",
    body: `تم إصدار شهادة «${data.title}» لك.`,
    href: `/certificates/${certificateId}`,
      event: "certificate",
  });

  if (student.parentId) {
    await notify(student.parentId, {
      title: "شهادة جديدة لابنكم",
      body: `تم إصدار شهادة «${data.title}» لـ ${student.user.name}.`,
      href: `/certificates/${certificateId}`,
      event: "certificate",
    });
  }

  revalidatePath("/admin/certificates");
  revalidatePath("/teacher/certificates");
  revalidatePath("/student");
  revalidatePath("/parent");
  revalidatePath(`/verify/${serial}`);

  redirect(
    session.role === "ADMIN"
      ? "/admin/certificates?flash=issued"
      : "/teacher/certificates?flash=issued",
  );
}
