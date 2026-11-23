import type { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("TEACHER");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex justify-end">
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
