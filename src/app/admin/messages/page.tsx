import type { Metadata } from "next";
import Link from "next/link";

import { DeleteButton } from "@/components/delete-button";
import {
  deleteMessage,
  markAllMessagesRead,
  setMessageRead,
} from "@/lib/actions/messages";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "رسائل التواصل",
};

export const instant = false;

const FLASH_MESSAGES: Record<string, string> = {
  read: "تم تعليم الرسالة كمقروءة.",
  unread: "تم تعليم الرسالة كغير مقروءة.",
  "all-read": "تم تعليم جميع الرسائل كمقروءة.",
  deleted: "تم حذف الرسالة بنجاح.",
  error: "تعذّر تنفيذ العملية. يرجى المحاولة مرة أخرى.",
};

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

type MessagesPageProps = {
  searchParams: Promise<{ status?: string; flash?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const status =
    params.status === "unread" || params.status === "read"
      ? params.status
      : undefined;
  const flash = params.flash ? FLASH_MESSAGES[params.flash] : undefined;

  const where =
    status === "unread"
      ? { isRead: false }
      : status === "read"
        ? { isRead: true }
        : undefined;

  const [messages, totalCount, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  const filters = [
    { label: "الكل", value: undefined, count: totalCount },
    { label: "غير مقروءة", value: "unread", count: unreadCount },
    {
      label: "مقروءة",
      value: "read",
      count: totalCount - unreadCount,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">رسائل التواصل</h1>
          <p className="mt-1 text-sm text-brand-700">
            الرسائل الواردة من نموذج «تواصل معنا»، مع تعليمها كمقروءة.
          </p>
        </div>

        {unreadCount > 0 ? (
          <form action={markAllMessagesRead}>
            {status ? (
              <input type="hidden" name="status" value={status} />
            ) : null}
            <button
              type="submit"
              className="rounded-xl border border-brand-900/15 bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              تعليم الكل كمقروء
            </button>
          </form>
        ) : null}
      </div>

      {flash ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {flash}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = filter.value === status;
          const href = filter.value
            ? `/admin/messages?status=${filter.value}`
            : "/admin/messages";

          return (
            <Link
              key={filter.label}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                isActive
                  ? "bg-brand-900 text-white"
                  : "border border-brand-900/15 bg-white text-brand-700 hover:bg-brand-50"
              }`}
            >
              {filter.label} ({filter.count})
            </Link>
          );
        })}
      </div>

      {messages.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
          لا توجد رسائل مطابقة للفلتر المحدد.
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-2xl border p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] ${
                message.isRead
                  ? "border-brand-900/10 bg-white"
                  : "border-gold-500/40 bg-gold-50/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-brand-950">
                      {message.name}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ring-1 ${
                        message.isRead
                          ? "bg-brand-50 text-brand-700 ring-brand-900/10"
                          : "bg-gold-100 text-gold-800 ring-gold-500/30"
                      }`}
                    >
                      {message.isRead ? "مقروءة" : "غير مقروءة"}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-600">
                    <span dir="ltr">{message.email}</span>
                    {message.phone ? <span dir="ltr">{message.phone}</span> : null}
                    <time dateTime={message.createdAt.toISOString()}>
                      {dateFormatter.format(message.createdAt)}
                    </time>
                  </div>

                  {message.subject ? (
                    <p className="mt-2 text-sm font-bold text-brand-900">
                      الموضوع: {message.subject}
                    </p>
                  ) : null}
                  <p className="mt-1 whitespace-pre-line text-sm leading-7 text-brand-700">
                    {message.message}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <form action={setMessageRead}>
                    <input type="hidden" name="id" value={message.id} />
                    <input
                      type="hidden"
                      name="read"
                      value={message.isRead ? "false" : "true"}
                    />
                    {status ? (
                      <input type="hidden" name="status" value={status} />
                    ) : null}
                    <button
                      type="submit"
                      className="rounded-lg border border-brand-900/15 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-50"
                    >
                      {message.isRead
                        ? "تعليم كغير مقروءة"
                        : "تعليم كمقروءة"}
                    </button>
                  </form>

                  <DeleteButton
                    action={deleteMessage}
                    id={message.id}
                    label="حذف"
                    confirmMessage={`هل أنت متأكد من حذف رسالة ${message.name}؟`}
                    hiddenFields={status ? { status } : undefined}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-brand-600">
        عدد الرسائل المعروضة: {messages.length} — غير المقروءة: {unreadCount}
      </p>
    </div>
  );
}
