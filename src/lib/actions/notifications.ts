"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function revalidateNotifications() {
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

/**
 * تعليم إشعار واحد كمقروء ثم الانتقال إلى رابطه.
 */
export async function openNotification(formData: FormData): Promise<void> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/notifications");
  }

  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, href: true, readAt: true },
  });

  if (!notification) {
    redirect("/notifications");
  }

  if (!notification.readAt) {
    try {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { readAt: new Date() },
      });
    } catch (error) {
      console.error("تعذّر تعليم الإشعار كمقروء:", error);
    }
  }

  revalidateNotifications();
  redirect(notification.href || "/notifications");
}

/**
 * تعليم إشعار واحد كمقروء دون مغادرة الصفحة.
 */
export async function markNotificationRead(formData: FormData): Promise<void> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/notifications");
  }

  try {
    await prisma.notification.updateMany({
      where: { id, userId: session.userId, readAt: null },
      data: { readAt: new Date() },
    });
  } catch (error) {
    console.error("تعذّر تعليم الإشعار كمقروء:", error);
  }

  revalidateNotifications();
  redirect("/notifications");
}

/**
 * تعليم كل إشعارات المستخدم الحالي كمقروءة.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  try {
    await prisma.notification.updateMany({
      where: { userId: session.userId, readAt: null },
      data: { readAt: new Date() },
    });
  } catch (error) {
    console.error("تعذّر تعليم الإشعارات كمقروءة:", error);
    redirect("/notifications?flash=error");
  }

  revalidateNotifications();
}
