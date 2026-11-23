import type { Metadata } from "next";
import Link from "next/link";

import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "الرئيسية",
};

export const instant = false;

export default async function AdminDashboardPage() {
  const [
    studentCount,
    teacherCount,
    parentCount,
    halaqaCount,
    messageCount,
    unreadMessageCount,
    announcementCount,
    examCount,
  ] = await Promise.all([
    prisma.student.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.user.count({ where: { role: Role.TEACHER } }),
    prisma.user.count({ where: { role: Role.PARENT } }),
    prisma.halaqa.count(),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.announcement.count(),
    prisma.exam.count(),
  ]);

  const stats = [
    { label: "طالب", value: studentCount, href: "/admin/students" },
    { label: "معلم", value: teacherCount, href: "/admin/teachers" },
    { label: "ولي أمر", value: parentCount, href: "/admin/students" },
    { label: "حلقة", value: halaqaCount, href: "/admin/halaqas" },
    {
      label: `رسالة تواصل${unreadMessageCount > 0 ? ` (${unreadMessageCount} غير مقروءة)` : ""}`,
      value: messageCount,
      href: "/admin/messages",
    },
    { label: "إعلان", value: announcementCount, href: "/admin/announcements" },
    { label: "اختبار", value: examCount, href: "/admin/halaqas" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-950">لوحة المدير</h1>
        <p className="mt-1 text-sm text-brand-700">
          نظرة سريعة على بيانات المدرسة، مع اختصارات لإدارة الطلاب والمعلمين.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] transition-colors hover:border-gold-500/40"
          >
            <p className="text-3xl font-bold text-brand-950">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-brand-600">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/students"
          className="group rounded-2xl border border-brand-900/10 bg-white p-6 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] transition-colors hover:border-gold-500/40"
        >
          <h2 className="text-lg font-bold text-brand-950">إدارة الطلاب</h2>
          <p className="mt-2 text-sm leading-7 text-brand-700">
            جدول مع بحث وفلترة، إضافة وتعديل وحذف، وربط الطالب بولي أمر.
          </p>
          <span className="mt-4 inline-flex text-sm font-bold text-brand-800 underline-offset-4 group-hover:underline">
            الانتقال
          </span>
        </Link>

        <Link
          href="/admin/teachers"
          className="group rounded-2xl border border-brand-900/10 bg-white p-6 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] transition-colors hover:border-gold-500/40"
        >
          <h2 className="text-lg font-bold text-brand-950">إدارة المعلمين</h2>
          <p className="mt-2 text-sm leading-7 text-brand-700">
            إضافة معلمين وتعديل بياناتهم وحذفهم، مع التحقق من الارتباطات.
          </p>
          <span className="mt-4 inline-flex text-sm font-bold text-brand-800 underline-offset-4 group-hover:underline">
            الانتقال
          </span>
        </Link>
        <Link
          href="/admin/announcements"
          className="group rounded-2xl border border-brand-900/10 bg-white p-6 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] transition-colors hover:border-gold-500/40"
        >
          <h2 className="text-lg font-bold text-brand-950">إدارة الإعلانات</h2>
          <p className="mt-2 text-sm leading-7 text-brand-700">
            إضافة وتعديل وحذف الإعلانات مع اختيار الجمهور المستهدف.
          </p>
          <span className="mt-4 inline-flex text-sm font-bold text-brand-800 underline-offset-4 group-hover:underline">
            الانتقال
          </span>
        </Link>

        <Link
          href="/admin/attendance"
          className="group rounded-2xl border border-brand-900/10 bg-white p-6 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] transition-colors hover:border-gold-500/40"
        >
          <h2 className="text-lg font-bold text-brand-950">تقرير الحضور الشهري</h2>
          <p className="mt-2 text-sm leading-7 text-brand-700">
            ملخص حضور الطلاب شهريًا مع إمكانية تصدير الكشف بترميز يدعم العربية.
          </p>
          <span className="mt-4 inline-flex text-sm font-bold text-brand-800 underline-offset-4 group-hover:underline">
            الانتقال
          </span>
        </Link>

        <Link
          href="/admin/messages"
          className="group rounded-2xl border border-brand-900/10 bg-white p-6 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] transition-colors hover:border-gold-500/40"
        >
          <h2 className="text-lg font-bold text-brand-950">رسائل التواصل</h2>
          <p className="mt-2 text-sm leading-7 text-brand-700">
            عرض رسائل نموذج التواصل وتعليمها كمقروءة أو حذفها.
          </p>
          <span className="mt-4 inline-flex text-sm font-bold text-brand-800 underline-offset-4 group-hover:underline">
            الانتقال
          </span>
        </Link>
      </div>
    </div>
  );
}
