import { getSession } from "@/lib/auth";
import { buildCsv, csvResponse } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return new Response("غير مصرح", { status: 403 });
  }

  const students = await prisma.student.findMany({
    include: {
      user: true,
      parent: true,
      enrollments: { include: { halaqa: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  const statusLabels: Record<string, string> = {
    ACTIVE: "نشط",
    GRADUATED: "متخرج",
    WITHDRAWN: "منسحب",
    ARCHIVED: "مؤرشف",
  };

  const rows = students.map((student) => [
    student.user.name,
    student.user.email,
    student.user.phone ?? "",
    student.stage,
    statusLabels[student.status] ?? student.status,
    student.birthDate ? student.birthDate.toISOString().slice(0, 10) : "",
    student.parent?.name ?? "",
    student.enrollments.map((enrollment) => enrollment.halaqa.name).join(" | "),
    student.notes ?? "",
  ]);

  const csv = buildCsv(
    [
      "الاسم",
      "البريد الإلكتروني",
      "الهاتف",
      "المرحلة",
      "الحالة",
      "تاريخ الميلاد",
      "ولي الأمر",
      "الحلقات",
      "ملاحظات",
    ],
    rows,
  );

  const date = new Date().toISOString().slice(0, 10);

  return csvResponse(csv, `students-${date}.csv`);
}
