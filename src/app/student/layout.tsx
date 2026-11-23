import type { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("STUDENT");

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl justify-end px-4 py-4 sm:px-6 lg:px-8">
        <LogoutButton />
      </div>
      {children}
    </>
  );
}
