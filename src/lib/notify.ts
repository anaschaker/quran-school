import "server-only";

import type { NotificationItem } from "@/lib/notification-types";
import { sendEmail } from "@/lib/channels/email";
import { renderEmailTemplate } from "@/lib/channels/email-templates";
import { sendWhatsApp } from "@/lib/channels/whatsapp";
import { prisma } from "@/lib/prisma";

export type NotifyPayload = {
  title: string;
  body: string;
  href?: string | null;
  event?: string;
};

type DeliveryRequest = {
  userIds: string[];
  payload: NotifyPayload;
};

/**
 * تنفيذ الإشعار عبر القنوات المتاحة.
 * أي قناة مستقبلية (واتساب، بريد إلكتروني، SMS) تُضاف هنا فقط،
 * دون الحاجة إلى تغيير بقية الكود الذي يستدعي notify().
 */
async function deliver({ userIds, payload }: DeliveryRequest): Promise<void> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueUserIds.length === 0) {
    return;
  }

  // 1) إشعار داخل التطبيق (السلوك الأصلي).
  try {
    await prisma.notification.createMany({
      data: uniqueUserIds.map((userId) => ({
        userId,
        title: payload.title,
        body: payload.body,
        href: payload.href ?? null,
      })),
    });
  } catch (error) {
    console.error("تعذّر إنشاء الإشعار:", error);
  }

  // 2) قنوات خارجية (البريد الإلكتروني) — Channel interface موحّدة.
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, email: true, phone: true, whatsappConsent: true },
    });

    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: { in: uniqueUserIds }, channel: "EMAIL" },
      select: { userId: true, enabled: true },
    });

    const prefMap = new Map(prefs.map((p) => [p.userId, p.enabled]));

    for (const user of users) {
      const enabled = prefMap.get(user.id) ?? false;
      if (!enabled) {
        await prisma.deliveryLog.create({
          data: {
            userId: user.id,
            channel: "EMAIL",
            event: payload.event ?? "generic",
            recipient: user.email,
            status: "SKIPPED",
            error: "المستخدم لم يفعّل البريد.",
          },
        });
        continue;
      }

      const { subject, html } = renderEmailTemplate(payload.event, payload);

      const result = await sendEmail({ to: user.email, subject, html });

      await prisma.deliveryLog.create({
        data: {
          userId: user.id,
          channel: "EMAIL",
          event: payload.event ?? "generic",
          recipient: user.email,
          status: result.sent ? "SENT" : "FAILED",
          error: result.error ?? null,
        },
      });
    }

    // 3) قناة واتساب (الأحداث المهمة فقط).
    const importantEvents = new Set(["absence", "invoice"]);
    if (importantEvents.has(payload.event ?? "")) {
      for (const user of users) {
        if (!user.whatsappConsent || !user.phone) {
          await prisma.deliveryLog.create({
            data: {
              userId: user.id,
              channel: "WHATSAPP",
              event: payload.event ?? "generic",
              recipient: user.phone,
              status: "SKIPPED",
              error: !user.whatsappConsent
                ? "لا توجد موافقة على واتساب."
                : "لا يوجد رقم هاتف.",
            },
          });
          continue;
        }

        const result = await sendWhatsApp({
          to: user.phone,
          body: `${payload.title}\n${payload.body}`,
        });

        await prisma.deliveryLog.create({
          data: {
            userId: user.id,
            channel: "WHATSAPP",
            event: payload.event ?? "generic",
            recipient: user.phone,
            status: result.sent ? "SENT" : "FAILED",
            error: result.error ?? null,
          },
        });
      }
    }
  } catch (error) {
    console.error("تعذّر تسليم الإشعارات:", error);
  }
}

/**
 * الدالة المركزية لإرسال إشعار لمستخدم واحد.
 */
export async function notify(
  userId: string,
  payload: NotifyPayload,
): Promise<void> {
  await deliver({ userIds: [userId], payload });
}

/**
 * إرسال الإشعار نفسه لعدة مستخدمين دفعة واحدة.
 */
export async function notifyMany(
  userIds: string[],
  payload: NotifyPayload,
): Promise<void> {
  await deliver({ userIds, payload });
}

function toNotificationItem(notification: {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationItem {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
  };
}

/**
 * أحدث الإشعارات + عدّاد غير المقروء لاستخدامه في جرس الشريط العلوي.
 */
export async function getNotificationSummary(
  userId: string,
  take = 8,
): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    notifications: notifications.map(toNotificationItem),
    unreadCount,
  };
}
