"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "./logo";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { navigation } from "@/config/school";
import type { NotificationItem } from "@/lib/notification-types";

type SiteHeaderProps = {
  schoolName: string;
  tagline: string;
  isAuthenticated?: boolean;
  unreadCount?: number;
  notifications?: NotificationItem[];
  notificationUnreadCount?: number;
};

export function SiteHeader({
  schoolName,
  tagline,
  isAuthenticated = false,
  unreadCount = 0,
  notifications = [],
  notificationUnreadCount = 0,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-900/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="group flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-900 text-gold-300 shadow-sm ring-1 ring-brand-950/10 transition-transform group-hover:-translate-y-0.5">
            <Logo className="size-6" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-brand-950 sm:text-lg">
              {schoolName}
            </span>
            <span className="text-[0.7rem] font-medium tracking-wide text-brand-600 sm:text-xs">
              {tagline}
            </span>
          </span>
        </Link>

        <nav
          aria-label="التنقل الرئيسي"
          className="hidden items-center gap-1 md:flex"
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-900"
                    : "text-brand-700 hover:bg-brand-50 hover:text-brand-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <NotificationBell
              notifications={notifications}
              unreadCount={notificationUnreadCount}
            />
          ) : null}

          {isAuthenticated ? (
            <Link
              href="/messages"
              className="hidden items-center gap-2 rounded-full border border-brand-900/15 px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 md:inline-flex"
            >
              الرسائل
              {unreadCount > 0 ? (
                <span className="rounded-full bg-gold-500 px-1.5 text-[0.65rem] font-bold text-brand-950">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          ) : null}

          {!isAuthenticated ? (
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 md:inline-flex"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="size-4"
                aria-hidden="true"
              >
                <path
                  d="M10 10a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 10 10Zm-5.5 6.2c.5-2.4 2.7-4 5.5-4s5 1.6 5.5 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              تسجيل الدخول
            </Link>
          ) : null}
          <Link
            href="/account"
            className="hidden items-center gap-2 rounded-full border border-brand-900/15 px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 md:inline-flex"
          >
            حسابي
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-brand-900/15 text-brand-900 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 md:hidden"
          >
            {isOpen ? (
              <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
                <path
                  d="m5 5 10 10M15 5 5 15"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
                <path
                  d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          id="mobile-navigation"
          className="border-t border-brand-900/10 bg-white px-5 pb-5 pt-3 md:hidden"
        >
          <nav aria-label="التنقل الرئيسي للجوال" className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-900"
                      : "text-brand-700 hover:bg-brand-50 hover:text-brand-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <Link
                href="/messages"
                onClick={() => setIsOpen(false)}
                className="mt-2 flex items-center justify-between rounded-xl border border-brand-900/15 px-4 py-2.5 text-sm font-bold text-brand-800"
              >
                <span>الرسائل</span>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[0.65rem] font-bold text-brand-950">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white"
              >
                تسجيل الدخول
              </Link>
            )}
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-900/15 px-4 py-2.5 text-sm font-bold text-brand-800"
            >
              حسابي
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
