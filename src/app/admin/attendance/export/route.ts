import { getSession } from "@/lib/auth";
import {
  getAttendanceReport,
  resolveMonth,
} from "@/lib/attendance-report";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return new Response("غير مصرح", { status: 403 });
  }

  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? undefined;
  const halaqaId = url.searchParams.get("halaqa")?.trim() || undefined;

  const range = resolveMonth(month);
  const report = await getAttendanceReport({ range, halaqaId });

  const rows = report.rows.map((row) => [
    row.studentName,
    row.stage,
    row.halaqas,
    row.present,
    row.absent,
    row.late,
    row.excused,
    row.total,
    row.percentage,
  ]);

  const csv = buildCsv(
    [
      "الطالب",
      "المرحلة",
      "الحلقات",
      "حاضر",
      "غائب",
      "متأخر",
      "بعذر",
      "إجمالي السجلات",
      "نسبة الحضور %",
    ],
    rows,
  );

  const suffix = halaqaId ? `-${halaqaId}` : "";

  return csvResponse(csv, `attendance-${range.key}${suffix}.csv`);
}
