"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function messagesHref(params: { status?: string; flash: string }) {
  const search = new URLSearchParams();

  if (params.status === "unread" || params.status === "read") {
    search.set("status", params.status);
  }

  search.set("flash", params.flash);

  return `/admin/messages?${search.toString()}`;
}

function revalidateMessages() {
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function setMessageRead(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const messageId = String(formData.get("id") ?? "").trim();
  const read = String(formData.get("read") ?? "") === "true";
  const status = String(formData.get("status") ?? "").trim();

  if (!messageId) {
    redirect(messagesHref({ status, flash: "error" }));
  }

  try {
    await prisma.contactMessage.update({
      where: { id: messageId },
      data: { isRead: read },
    });
  } catch (error) {
    console.error("تعذّر تحديث حالة الرسالة:", error);
    redirect(messagesHref({ status, flash: "error" }));
  }

  revalidateMessages();
  redirect(messagesHref({ status, flash: read ? "read" : "unread" }));
}

export async function markAllMessagesRead(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const status = String(formData.get("status") ?? "").trim();

  try {
    await prisma.contactMessage.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  } catch (error) {
    console.error("تعذّر تعليم الرسائل كمقروءة:", error);
    redirect(messagesHref({ status, flash: "error" }));
  }

  revalidateMessages();
  redirect(messagesHref({ status, flash: "all-read" }));
}

export async function deleteMessage(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const messageId = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!messageId) {
    redirect(messagesHref({ status, flash: "error" }));
  }

  try {
    await prisma.contactMessage.delete({ where: { id: messageId } });
  } catch (error) {
    console.error("تعذّر حذف الرسالة:", error);
    redirect(messagesHref({ status, flash: "error" }));
  }

  revalidateMessages();
  redirect(messagesHref({ status, flash: "deleted" }));
}
