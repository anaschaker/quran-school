import { getSession } from "@/lib/auth";
import { buildCsv, csvResponse, type CsvValue } from "@/lib/csv";
import {
  getAttendanceReportData,
  getFeesReportData,
  getMemorizationReportData,
  getTeacherPerformanceData,
  resolveReportRange,
} from "@/lib/reports";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return new Response("غير مصرح", { status: 403 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "attendance";
  const range = resolveReportRange(
    url.searchParams.get("from") ?? undefined,
    url.searchParams.get("to") ?? undefined,
  );
  const halaqaId = url.searchParams.get("halaqa")?.trim() || undefined;

  let headers: string[] = [];
  let rows: CsvValue[][] = [];
  let fileType = type;

  if (type === "memorization") {
    const report = await getMemorizationReportData({ range, halaqaId });

    headers = [
      "الحلقة",
      "عدد الطلاب",
      "طلاب نشطون",
      "سجلات الحفظ",
      "الآيات المحفوظة",
      "متوسط التقدير من 10",
      "أهداف نشطة",
    ];
    rows = report.map((row) => [
      row.halaqaName,
      row.students,
      row.activeStudents,
      row.records,
      row.ayahs,
      row.averageGrade,
      row.activeGoals,
    ]);
  } else if (type === "fees") {
    const report = await getFeesReportData({ range, halaqaId });

    headers = [
      "خطة الرسوم",
      "المستحق",
      "المحصّل",
      "المتبقي",
      "المتأخرات",
    ];
    rows = report.plans.map((row) => [
      row.planName,
      row.invoiced,
      row.collected,
      row.remaining,
      row.overdue,
    ]);

    rows.push([
      "الإجمالي",
      report.invoiced,
      report.collected,
      report.remaining,
      report.overdue,
    ]);
  } else if (type === "teachers") {
    const report = await getTeacherPerformanceData({ range, halaqaId });

    headers = [
      "المعلم",
      "الحلقات",
      "الطلاب",
      "الجلسات المسجلة",
      "سجلات التسميع",
      "متوسط التقدير من 10",
      "الاختبارات",
    ];
    rows = report.map((row) => [
      row.teacherName,
      row.halaqas,
      row.students,
      row.sessions,
      row.recitations,
      row.averageGrade,
      row.exams,
    ]);
  } else {
    fileType = "attendance";
    const report = await getAttendanceReportData({ range, halaqaId });

    headers = [
      "الطالب",
      "الحلقات",
      "حاضر",
      "غائب",
      "متأخر",
      "بعذر",
      "إجمالي السجلات",
      "نسبة الحضور %",
    ];
    rows = report.students.map((row) => [
      row.studentName,
      row.halaqas,
      row.present,
      row.absent,
      row.late,
      row.excused,
      row.records,
      row.percentage,
    ]);
  }

  const csv = buildCsv(headers, rows);
  const suffix = halaqaId ? `-${halaqaId}` : "";

  return csvResponse(
    csv,
    `report-${fileType}-${range.from}-to-${range.to}${suffix}.csv`,
  );
}
