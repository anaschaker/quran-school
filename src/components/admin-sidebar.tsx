"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logoutAction } from "@/lib/actions/auth";

const adminNavigation = [
  { href: "/admin", label: "الرئيسية" },
  { href: "/admin/students", label: "إدارة الطلاب" },
  { href: "/admin/excuses", label: "أعذار الغياب" },
  { href: "/admin/registrations", label: "طلبات التسجيل" },
  { href: "/admin/teachers", label: "إدارة المعلمين" },
  { href: "/admin/halaqas", label: "الحلقات" },
  { href: "/admin/events", label: "الفعاليات" },
  { href: "/admin/attendance", label: "تقرير الحضور" },
  { href: "/admin/reports", label: "التقارير" },
  { href: "/admin/fees", label: "الرسوم" },
  { href: "/admin/announcements", label: "الإعلانات" },
  { href: "/messages", label: "الرسائل" },
  { href: "/admin/messages", label: "رسائل التواصل" },
  { href: "/admin/users", label: "المستخدمون" },
  { href: "/admin/certificates", label: "الشهادات" },
  { href: "/admin/settings", label: "إعدادات المدرسة" },
  { href: "/admin/audit-log", label: "سجل التدقيق" },
  { href: "/admin/launch-status", label: "حالة الإطلاق" },
  { href: "/admin/delivery-log", label: "سجل التسليم" },
];

type AdminSidebarProps = {
  unreadCount?: number;
};

export function AdminSidebar({ unreadCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="admin-mobile-navigation"
          className="flex w-full items-center justify-between rounded-2xl border border-brand-900/10 bg-white px-4 py-3 text-sm font-bold text-brand-900 shadow-sm"
        >
          <span>قائمة الإدارة</span>
          <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
            {isOpen ? (
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            ) : (
              <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            )}
          </svg>
        </button>

        {isOpen ? (
          <nav
            id="admin-mobile-navigation"
            aria-label="التنقل الإداري للجوال"
            className="mt-2 rounded-2xl border border-brand-900/10 bg-white p-2 shadow-sm"
          >
            {adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? "bg-brand-50 text-brand-900"
                    : "text-brand-700 hover:bg-brand-50 hover:text-brand-950"
                }`}
              >
                {item.label}
                {item.href === "/messages" && unreadCount > 0 ? (
                  <span className="ms-2 inline-block rounded-full bg-gold-500 px-2 py-0.5 text-[0.65rem] font-bold text-brand-950">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            ))}

            <form action={logoutAction} className="mt-2">
              <button
                type="submit"
                className="block w-full rounded-xl border border-red-200 px-4 py-2.5 text-start text-sm font-bold text-red-700 transition-colors hover:bg-red-50"
              >
                تسجيل الخروج
              </button>
            </form>
          </nav>
        ) : null}
      </div>

      <aside className="hidden lg:block">
        <nav
          aria-label="التنقل الإداري"
          className="sticky top-24 space-y-1 rounded-2xl border border-brand-900/10 bg-white p-3 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]"
        >
          <p className="px-3 py-2 text-xs font-bold tracking-wide text-brand-500">
            لوحة الإدارة
          </p>
          {adminNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? "bg-brand-900 text-white"
                  : "text-brand-700 hover:bg-brand-50 hover:text-brand-950"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  isActive(item.href) ? "bg-gold-400" : "bg-brand-300"
                }`}
              />
              {item.label}
              {item.href === "/messages" && unreadCount > 0 ? (
                <span className="ms-auto rounded-full bg-gold-500 px-2 py-0.5 text-[0.65rem] font-bold text-brand-950">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          ))}

          <form action={logoutAction} className="pt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-50"
            >
              <span className="size-1.5 rounded-full bg-red-300" />
              تسجيل الخروج
            </button>
          </form>
        </nav>
      </aside>
    </>
  );
}
