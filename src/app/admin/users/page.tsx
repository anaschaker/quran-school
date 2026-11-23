import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordButton } from "@/components/reset-password-button";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/session";

export const metadata: Metadata = {
  title: "المستخدمون",
};

export const instant = false;

const roleOrder: Record<string, number> = {
  ADMIN: 0,
  TEACHER: 1,
  STUDENT: 2,
  PARENT: 3,
};

export default async function AdminUsersPage() {
  await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      mustChangePassword: true,
      lockedUntil: true,
    },
  });

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const sorted = [...users].sort((a, b) => {
    const roleDiff = (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9);
    if (roleDiff !== 0) return roleDiff;
    return a.name.localeCompare(b.name, "ar");
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">المستخدمون</h1>
          <p className="mt-1 text-sm text-brand-700">
            عرض المستخدمين وإعادة تعيين كلمة المرور (تُعرض كلمة المرور المؤقتة
            مرة واحدة).
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          ← لوحة الإدارة
        </Link>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
          لا يوجد مستخدمون.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
          <table className="min-w-full divide-y divide-brand-900/10 text-sm">
            <thead className="bg-brand-50/70 text-start text-xs font-bold text-brand-700">
              <tr>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">البريد</th>
                <th className="px-4 py-3">الدور</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إعادة تعيين</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/5">
              {sorted.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-bold text-brand-950">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-brand-700" dir="ltr">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {ROLE_LABEL[user.role as keyof typeof ROLE_LABEL] ?? user.role}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-600">
                    {user.mustChangePassword ? "يجب تغيير كلمة المرور" : "—"}
                    {user.lockedUntil && user.lockedUntil.getTime() > now
                      ? " (مقفل)"
                      : ""}
                  </td>
                  <td className="px-4 py-3">
                    <ResetPasswordButton
                      userId={user.id}
                      userName={user.name}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-brand-600">
        عدد المستخدمين: {sorted.length}
      </p>
    </div>
  );
}
