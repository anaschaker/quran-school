import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AutoRefresh } from "@/components/auto-refresh";
import {
  markAllNotificationsRead,
  markNotificationRead,
  openNotification,
} from "@/lib/actions/notifications";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "الإشعارات",
};

export const instant = false;

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

type NotificationsPageProps = {
  searchParams: Promise<{ flash?: string }>;
};

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/account?force=1");
  }

  const params = await searchParams;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notification.count({
      where: { userId: session.userId, readAt: null },
    }),
  ]);

  return (
    <main className="flex-1">
      <AutoRefresh />

      <section className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-950 sm:text-3xl">
              الإشعارات
            </h1>
            <p className="mt-1 text-sm leading-7 text-brand-700">
              جميع التنبيهات المتعلقة بالإعلانات والحضور والاختبارات والشهادات
              والرسائل والرسوم.
            </p>
          </div>

          {unreadCount > 0 ? (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
              >
                تعليم الكل كمقروء ({unreadCount})
              </button>
            </form>
          ) : null}
        </div>

        {params.flash === "error" ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            تعذّر تحديث الإشعارات. يرجى المحاولة مرة أخرى.
          </div>
        ) : null}

        {notifications.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
            لا توجد إشعارات بعد. ستظهر هنا التنبيهات الجديدة تلقائيًا.
          </p>
        ) : (
          <ul className="mt-6 space-y-2">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`rounded-2xl border p-4 shadow-[0_15px_40px_-34px_rgba(8,37,28,0.45)] ${
                  notification.readAt
                    ? "border-brand-900/10 bg-white"
                    : "border-gold-500/40 bg-gold-50/30"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <form action={openNotification} className="min-w-0 flex-1">
                    <input
                      type="hidden"
                      name="id"
                      value={notification.id}
                    />
                    <button type="submit" className="block w-full text-start">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-brand-950">
                          {notification.title}
                        </span>
                        {notification.readAt ? null : (
                          <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[0.65rem] font-bold text-gold-800 ring-1 ring-gold-500/30">
                            غير مقروء
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block whitespace-pre-line text-sm leading-7 text-brand-700">
                        {notification.body}
                      </span>
                      <span className="mt-1.5 block text-xs text-brand-500">
                        {dateFormatter.format(notification.createdAt)}
                      </span>
                    </button>
                  </form>

                  {notification.readAt ? null : (
                    <form action={markNotificationRead}>
                      <input
                        type="hidden"
                        name="id"
                        value={notification.id}
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                      >
                        تعليم كمقروء
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-brand-600">
          عدد الإشعارات المعروضة: {notifications.length} — غير المقروءة:{" "}
          {unreadCount}
        </p>
      </section>
    </main>
  );
}
