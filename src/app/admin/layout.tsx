import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin-sidebar";
import { requireRole } from "@/lib/auth";
import { getUnreadCount } from "@/lib/messaging";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireRole("ADMIN");
  const unreadCount = await getUnreadCount(session.userId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <AdminSidebar unreadCount={unreadCount} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
