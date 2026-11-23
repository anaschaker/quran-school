"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { zodFieldErrors, type ActionResult } from "@/lib/validations/admin";
import { saveUploadedFile } from "@/lib/resources";

const resourceSchema = z.object({
  title: z.string().trim().min(2, "العنوان قصير جدًا.").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  type: z.enum(["PDF", "AUDIO", "LINK", "TEXT"]),
  url: z.string().trim().optional().or(z.literal("")),
  content: z.string().trim().optional().or(z.literal("")),
  halaqaId: z.string().trim().optional().or(z.literal("")),
});

export async function uploadResource(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("TEACHER");
  // المدير أيضًا يمكنه الرفع؛ نتحقق من الدور.
  if (session.role !== "TEACHER" && session.role !== "ADMIN") {
    redirect("/login");
  }

  const raw = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    type: String(formData.get("type") ?? "PDF"),
    url: String(formData.get("url") ?? ""),
    content: String(formData.get("content") ?? ""),
    halaqaId: String(formData.get("halaqaId") ?? ""),
  };

  const parsed = resourceSchema.safeParse(raw);
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

  // التحقق من ملكية الحلقة (للمعلم).
  if (data.halaqaId) {
    if (session.role === "TEACHER") {
      const halaqa = await prisma.halaqa.findFirst({
        where: { id: data.halaqaId, teacherId: session.userId },
        select: { id: true },
      });
      if (!halaqa) {
        return {
          success: false,
          message: "الحلقة غير مسندة إليك.",
          values: raw,
          submissionId: Date.now(),
        };
      }
    }
  }

  const file = formData.get("file");
  const isFile = file instanceof File && file.size > 0;

  let filePath: string | null = null;
  let mimeType: string | null = null;
  let size: number | null = null;

  if (data.type === "PDF" || data.type === "AUDIO") {
    if (!isFile) {
      return {
        success: false,
        message: "يرجى اختيار ملف.",
        values: raw,
        submissionId: Date.now(),
      };
    }
    try {
      const saved = await saveUploadedFile(file as File);
      filePath = saved.filePath;
      mimeType = saved.mimeType;
      size = saved.size;
    } catch (error) {
      const msg =
        error instanceof Error && error.message === "too-large"
          ? "حجم الملف يتجاوز 10MB."
          : error instanceof Error && error.message === "invalid-type"
            ? "نوع الملف غير مسموح (pdf, mp3, jpg, png)."
            : "تعذّر حفظ الملف.";
      return {
        success: false,
        message: msg,
        values: raw,
        submissionId: Date.now(),
      };
    }
  } else if (data.type === "LINK") {
    if (!data.url) {
      return {
        success: false,
        message: "يرجى إدخال الرابط.",
        values: raw,
        submissionId: Date.now(),
      };
    }
  } else if (data.type === "TEXT") {
    if (!data.content) {
      return {
        success: false,
        message: "يرجى إدخال النص.",
        values: raw,
        submissionId: Date.now(),
      };
    }
  }

  try {
    await prisma.resource.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type,
        url: data.type === "LINK" ? data.url : null,
        content: data.type === "TEXT" ? data.content : null,
        filePath,
        mimeType,
        size,
        halaqaId: data.halaqaId || null,
        uploadedBy: session.userId,
      },
    });
  } catch (error) {
    console.error("تعذّر حفظ المادة:", error);
    return {
      success: false,
      message: "تعذّر حفظ المادة.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  revalidatePath("/resources");
  if (data.halaqaId) revalidatePath(`/admin/halaqas/${data.halaqaId}`);
  redirect("/resources?flash=created");
}

export async function uploadResourceAction(formData: FormData): Promise<void> {
  await uploadResource({ success: false }, formData);
}

export async function deleteResource(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/resources?flash=error");

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) redirect("/resources?flash=error");

  // المعلم يحذف مواده فقط.
  if (session.role === "TEACHER" && resource.uploadedBy !== session.userId) {
    redirect("/resources?flash=error");
  }

  try {
    if (resource.filePath) {
      const { deleteResourceFile } = await import("@/lib/resources");
      await deleteResourceFile(resource.filePath);
    }
    await prisma.resource.delete({ where: { id } });
  } catch (error) {
    console.error("تعذّر حذف المادة:", error);
    redirect("/resources?flash=error");
  }

  revalidatePath("/resources");
  redirect("/resources?flash=deleted");
}
