"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  markAllNotificationsRead,
  openNotification,
} from "@/lib/actions/notifications";
import type { NotificationItem } from "@/lib/notification-types";

type NotificationBellProps = {
  notifications: NotificationItem[];
  unreadCount: number;
};

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationBell({
  notifications,
  unreadCount,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const label =
    unreadCount > 0
      ? `الإشعارات (${unreadCount} غير مقروء)`
      : "الإشعارات";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="notification-menu"
        aria-label={label}
        className="relative inline-flex size-10 items-center justify-center rounded-full border border-brand-900/15 text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="size-5"
          aria-hidden="true"
        >
          <path
            d="M10 3.2a4.3 4.3 0 0 0-4.3 4.3v2.4L4.4 13h11.2l-1.3-3.1V7.5A4.3 4.3 0 0 0 10 3.2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M8.2 15.2a1.9 1.9 0 0 0 3.6 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {unreadCount > 0 ? (
          <span className="absolute -top-1 -start-1 flex min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[0.65rem] font-bold text-brand-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          id="notification-menu"
          className="absolute end-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-brand-900/10 bg-white shadow-[0_20px_50px_-24px_rgba(8,37,28,0.5)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-brand-900/10 px-4 py-3">
            <p className="text-sm font-bold text-brand-950">الإشعارات</p>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsRead}>
                <button
                  type="submit"
                  className="text-xs font-bold text-brand-700 underline-offset-4 hover:underline"
                >
                  تعليم الكل كمقروء
                </button>
              </form>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-brand-600">
              لا توجد إشعارات.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-brand-900/5 overflow-y-auto">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={
                    notification.readAt ? "bg-white" : "bg-gold-50/40"
                  }
                >
                  <form
                    action={openNotification}
                    onClick={() => setIsOpen(false)}
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={notification.id}
                    />
                    <button
                      type="submit"
                      className="block w-full px-4 py-3 text-start transition-colors hover:bg-brand-50/60"
                    >
                      <span className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                            notification.readAt
                              ? "bg-brand-200"
                              : "bg-gold-500"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-brand-950">
                            {notification.title}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-6 text-brand-600">
                            {notification.body}
                          </span>
                          <span className="mt-1 block text-[0.65rem] text-brand-500">
                            {dateFormatter.format(
                              new Date(notification.createdAt),
                            )}
                          </span>
                        </span>
                      </span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block border-t border-brand-900/10 bg-brand-50/40 px-4 py-2.5 text-center text-xs font-bold text-brand-800 hover:bg-brand-50"
          >
            عرض كل الإشعارات
          </Link>
        </div>
      ) : null}
    </div>
  );
}
