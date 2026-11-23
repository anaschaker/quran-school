"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { zodFieldErrors, type ActionResult } from "@/lib/validations/admin";

const eventSchema = z.object({
  title: z.string().trim().min(2, "العنوان قصير جدًا.").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  startDate: z.string().trim().min(1, "يرجى تحديد تاريخ البدء."),
  endDate: z.string().trim().min(1, "يرجى تحديد تاريخ الانتهاء."),
  type: z.enum(["HOLIDAY", "EXAM", "OCCASION", "COURSE"]),
  audience: z.enum(["ALL", "TEACHERS", "STUDENTS", "PARENTS"]),
});

export async function createEvent(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const raw = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    type: String(formData.get("type") ?? "OCCASION"),
    audience: String(formData.get("audience") ?? "ALL"),
  };

  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: raw,
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;
  const start = new Date(`${data.startDate}T00:00:00.000Z`);
  const end = new Date(`${data.endDate}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return {
      success: false,
      message: "تواريخ غير صحيحة.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        startDate: start,
        endDate: end,
        type: data.type,
        audience: data.audience,
      },
    });
  } catch (error) {
    console.error("تعذّر إنشاء الحدث:", error);
    return {
      success: false,
      message: "تعذّر حفظ الحدث.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  revalidatePath("/calendar");
  revalidatePath("/admin/events");
  redirect("/admin/events?flash=created");
}

export async function createEventAction(formData: FormData): Promise<void> {
  await createEvent({ success: false }, formData);
}

export async function deleteEvent(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/events?flash=error");
  try {
    await prisma.event.delete({ where: { id } });
  } catch (error) {
    console.error("تعذّر حذف الحدث:", error);
    redirect("/admin/events?flash=error");
  }
  revalidatePath("/calendar");
  revalidatePath("/admin/events");
  redirect("/admin/events?flash=deleted");
}
