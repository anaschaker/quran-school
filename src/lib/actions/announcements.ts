"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { notifyMany } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  announcementFormSchema,
} from "@/lib/validations/announcement";
import {
  zodFieldErrors,
  type ActionResult,
} from "@/lib/validations/admin";

export type { ActionResult };

const announcementPaths = [
  "/",
  "/admin",
  "/admin/announcements",
  "/student",
  "/parent",
];

function revalidateAnnouncements() {
  for (const path of announcementPaths) {
    revalidatePath(path);
  }
}

function parseDate(value: string): Date {
  return value ? new Date(`${value}T00:00:00.000Z`) : new Date();
}

export async function createAnnouncement(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("ADMIN");

  const raw = {
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    audience: String(formData.get("audience") ?? ""),
    date: String(formData.get("date") ?? ""),
  };

  const parsed = announcementFormSchema.safeParse(raw);

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
    await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        audience: data.audience,
        date: parseDate(data.date ?? ""),
      },
    });
  } catch (error) {
    console.error("تعذّر إنشاء الإعلان:", error);
    return {
      success: false,
      message: "تعذّر حفظ الإعلان حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  const audienceRole =
    data.audience === "TEACHERS"
      ? "TEACHER"
      : data.audience === "STUDENTS"
        ? "STUDENT"
        : data.audience === "PARENTS"
          ? "PARENT"
          : null;

  const recipients = await prisma.user.findMany({
    where: {
      id: { not: session.userId },
      ...(audienceRole ? { role: audienceRole } : {}),
    },
    select: { id: true },
  });

  const preview =
    data.content.length > 160
      ? `${data.content.slice(0, 157)}…`
      : data.content;

  await notifyMany(
    recipients.map((recipient) => recipient.id),
    {
      title: `إعلان جديد: ${data.title}`,
      body: preview,
      href: "/",
      event: "announcement",
    },
  );

  revalidateAnnouncements();
  redirect("/admin/announcements?flash=created");
}

export async function updateAnnouncement(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const announcementId = String(formData.get("announcementId") ?? "").trim();

  if (!announcementId) {
    return {
      success: false,
      message: "الإعلان غير موجود.",
    };
  }

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      message: "الإعلان غير موجود.",
    };
  }

  const raw = {
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    audience: String(formData.get("audience") ?? ""),
    date: String(formData.get("date") ?? ""),
  };

  const parsed = announcementFormSchema.safeParse(raw);

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
    await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        title: data.title,
        content: data.content,
        audience: data.audience,
        date: parseDate(data.date ?? ""),
      },
    });
  } catch (error) {
    console.error("تعذّر تعديل الإعلان:", error);
    return {
      success: false,
      message: "تعذّر تعديل الإعلان حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  revalidateAnnouncements();
  redirect("/admin/announcements?flash=updated");
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const announcementId = String(formData.get("id") ?? "").trim();

  if (!announcementId) {
    redirect("/admin/announcements?flash=error");
  }

  try {
    await prisma.announcement.delete({ where: { id: announcementId } });
  } catch (error) {
    console.error("تعذّر حذف الإعلان:", error);
    redirect("/admin/announcements?flash=error");
  }

  revalidateAnnouncements();
  redirect("/admin/announcements?flash=deleted");
}
