import "server-only";

import { countUniqueAyahs, toAbsoluteAyah } from "@/lib/memorization";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ReportRange = {
  start: Date;
  end: Date;
  from: string;
  to: string;
  label: string;
};

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function parseDate(value?: string): Date | null {
  if (!value || !DATE_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * يعيد نطاق التقرير (شاملًا تاريخي البداية والنهاية).
 * الافتراضي: من أول الشهر الحالي حتى اليوم.
 */
export function resolveReportRange(
  fromValue?: string,
  toValue?: string,
): ReportRange {
  const now = new Date();
  const defaultFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const defaultTo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  let from = parseDate(fromValue) ?? defaultFrom;
  let to = parseDate(toValue) ?? defaultTo;

  if (from.getTime() > to.getTime()) {
    [from, to] = [to, from];
  }

  return {
    start: from,
    end: new Date(to.getTime() + DAY_MS),
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    label: `${dateFormatter.format(from)} — ${dateFormatter.format(to)}`,
  };
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

// ─────────────────────────────────────────────
// تقرير الحضور
// ─────────────────────────────────────────────

export type HalaqaAttendanceRow = {
  halaqaId: string;
  halaqaName: string;
  students: number;
  records: number;
  attended: number;
  percentage: number;
};

export type StudentAttendanceRow = {
  studentId: string;
  studentName: string;
  halaqas: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  records: number;
  attended: number;
  percentage: number;
};

export type AttendanceReportData = {
  halaqas: HalaqaAttendanceRow[];
  students: StudentAttendanceRow[];
  mostAbsent: StudentAttendanceRow[];
  totals: {
    students: number;
    records: number;
    attended: number;
    percentage: number;
  };
};

export async function getAttendanceReportData({
  range,
  halaqaId,
}: {
  range: ReportRange;
  halaqaId?: string;
}): Promise<AttendanceReportData> {
  const [halaqas, attendance, students, holidays] = await Promise.all([
    prisma.halaqa.findMany({
      where: halaqaId ? { id: halaqaId } : undefined,
      select: {
        id: true,
        name: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({
      where: {
        date: { gte: range.start, lt: range.end },
        ...(halaqaId ? { halaqaId } : {}),
      },
      select: { studentId: true, halaqaId: true, status: true, date: true },
    }),
    prisma.student.findMany({
      where: halaqaId
        ? { enrollments: { some: { halaqaId } } }
        : undefined,
      select: {
        id: true,
        user: { select: { name: true } },
        enrollments: {
          where: halaqaId ? { halaqaId } : undefined,
          select: { halaqa: { select: { name: true } } },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.event.findMany({
      where: {
        type: "HOLIDAY",
        startDate: { lt: range.end },
        endDate: { gte: range.start },
      },
      select: { startDate: true, endDate: true },
    }),
  ]);

  const holidayDates = new Set<string>();
  for (const h of holidays) {
    const cur = new Date(h.startDate);
    const last = new Date(h.endDate);
    while (cur.getTime() <= last.getTime()) {
      holidayDates.add(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
      if (cur.getTime() >= range.end.getTime()) break;
    }
  }

  const filteredAttendance = attendance.filter(
    (record) => !holidayDates.has(record.date.toISOString().slice(0, 10)),
  );

  const halaqaCounts = new Map<
    string,
    { records: number; attended: number }
  >();

  for (const record of filteredAttendance) {
    const current = halaqaCounts.get(record.halaqaId) ?? {
      records: 0,
      attended: 0,
    };

    current.records += 1;

    if (record.status === "PRESENT" || record.status === "LATE") {
      current.attended += 1;
    }

    halaqaCounts.set(record.halaqaId, current);
  }

  const halaqaRows: HalaqaAttendanceRow[] = halaqas.map((halaqa) => {
    const counts = halaqaCounts.get(halaqa.id) ?? { records: 0, attended: 0 };

    return {
      halaqaId: halaqa.id,
      halaqaName: halaqa.name,
      students: halaqa._count.enrollments,
      records: counts.records,
      attended: counts.attended,
      percentage:
        counts.records > 0
          ? Math.round((counts.attended / counts.records) * 100)
          : 0,
    };
  });

  const studentCounts = new Map<
    string,
    { present: number; absent: number; late: number; excused: number }
  >();

  for (const record of filteredAttendance) {
    const current = studentCounts.get(record.studentId) ?? {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    if (record.status === "PRESENT") current.present += 1;
    else if (record.status === "ABSENT") current.absent += 1;
    else if (record.status === "LATE") current.late += 1;
    else if (record.status === "EXCUSED") current.excused += 1;

    studentCounts.set(record.studentId, current);
  }

  const studentRows: StudentAttendanceRow[] = students.map((student) => {
    const counts = studentCounts.get(student.id) ?? {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };
    const records =
      counts.present + counts.absent + counts.late + counts.excused;
    const attended = counts.present + counts.late;

    return {
      studentId: student.id,
      studentName: student.user.name,
      halaqas: student.enrollments
        .map((enrollment) => enrollment.halaqa.name)
        .join(" | "),
      ...counts,
      records,
      attended,
      percentage: records > 0 ? Math.round((attended / records) * 100) : 0,
    };
  });

  const records = studentRows.reduce((sum, row) => sum + row.records, 0);
  const attended = studentRows.reduce((sum, row) => sum + row.attended, 0);

  return {
    halaqas: halaqaRows,
    students: studentRows,
    mostAbsent: [...studentRows]
      .filter((row) => row.absent > 0)
      .sort((a, b) => b.absent - a.absent || b.records - a.records)
      .slice(0, 5),
    totals: {
      students: studentRows.length,
      records,
      attended,
      percentage: records > 0 ? Math.round((attended / records) * 100) : 0,
    },
  };
}

// ─────────────────────────────────────────────
// تقرير التقدم في الحفظ
// ─────────────────────────────────────────────

export type HalaqaMemorizationRow = {
  halaqaId: string;
  halaqaName: string;
  students: number;
  activeStudents: number;
  records: number;
  ayahs: number;
  averageGrade: number;
  activeGoals: number;
};

export async function getMemorizationReportData({
  range,
  halaqaId,
}: {
  range: ReportRange;
  halaqaId?: string;
}): Promise<HalaqaMemorizationRow[]> {
  const halaqas = await prisma.halaqa.findMany({
    where: halaqaId ? { id: halaqaId } : undefined,
    select: {
      id: true,
      name: true,
      enrollments: { select: { studentId: true } },
    },
    orderBy: { name: "asc" },
  });

  const studentIds = Array.from(
    new Set(
      halaqas.flatMap((halaqa) =>
        halaqa.enrollments.map((enrollment) => enrollment.studentId),
      ),
    ),
  );

  if (studentIds.length === 0) {
    return halaqas.map((halaqa) => ({
      halaqaId: halaqa.id,
      halaqaName: halaqa.name,
      students: halaqa.enrollments.length,
      activeStudents: 0,
      records: 0,
      ayahs: 0,
      averageGrade: 0,
      activeGoals: 0,
    }));
  }

  const [hifzRecords, goals] = await Promise.all([
    prisma.recitationRecord.findMany({
      where: {
        type: "HIFZ",
        studentId: { in: studentIds },
        date: { gte: range.start, lt: range.end },
      },
      select: {
        studentId: true,
        surahNumber: true,
        fromAyah: true,
        toAyah: true,
        grade: true,
      },
    }),
    prisma.memorizationGoal.findMany({
      where: { studentId: { in: studentIds }, status: "ACTIVE" },
      select: { studentId: true },
    }),
  ]);

  return halaqas.map((halaqa) => {
    const ids = new Set(
      halaqa.enrollments.map((enrollment) => enrollment.studentId),
    );
    const records = hifzRecords.filter((record) => ids.has(record.studentId));
    const byStudent = new Map<
      string,
      { start: number; end: number }[]
    >();

    for (const record of records) {
      const start = toAbsoluteAyah(record.surahNumber, record.fromAyah);
      const end = toAbsoluteAyah(record.surahNumber, record.toAyah);
      const list = byStudent.get(record.studentId) ?? [];
      list.push({
        start: Math.min(start, end),
        end: Math.max(start, end),
      });
      byStudent.set(record.studentId, list);
    }

    let ayahs = 0;

    for (const ranges of byStudent.values()) {
      ayahs += countUniqueAyahs(ranges);
    }

    const averageGrade =
      records.length > 0
        ? roundOne(
            records.reduce((sum, record) => sum + record.grade, 0) /
              records.length,
          )
        : 0;

    return {
      halaqaId: halaqa.id,
      halaqaName: halaqa.name,
      students: halaqa.enrollments.length,
      activeStudents: byStudent.size,
      records: records.length,
      ayahs,
      averageGrade,
      activeGoals: goals.filter((goal) => ids.has(goal.studentId)).length,
    };
  });
}

// ─────────────────────────────────────────────
// تقرير الرسوم
// ─────────────────────────────────────────────

export type FeePlanReportRow = {
  planId: string;
  planName: string;
  invoiced: number;
  collected: number;
  remaining: number;
  overdue: number;
};

export type FeesReportData = {
  collected: number;
  invoiced: number;
  remaining: number;
  overdue: number;
  paymentsCount: number;
  invoicesCount: number;
  plans: FeePlanReportRow[];
};

export async function getFeesReportData({
  range,
  halaqaId,
}: {
  range: ReportRange;
  halaqaId?: string;
}): Promise<FeesReportData> {
  let studentIds: string[] | undefined;

  if (halaqaId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { halaqaId },
      select: { studentId: true },
    });
    studentIds = enrollments.map((enrollment) => enrollment.studentId);
  }

  const studentFilter = studentIds ? { studentId: { in: studentIds } } : {};

  const [payments, invoices] = await Promise.all([
    prisma.payment.findMany({
      where: {
        date: { gte: range.start, lt: range.end },
        invoice: studentFilter,
      },
      select: {
        amount: true,
        invoice: {
          select: {
            feePlanId: true,
            feePlan: { select: { name: true } },
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        dueDate: { gte: range.start, lt: range.end },
        ...studentFilter,
      },
      select: {
        amount: true,
        status: true,
        dueDate: true,
        feePlanId: true,
        feePlan: { select: { name: true } },
        payments: { select: { amount: true } },
      },
    }),
  ]);

  const plans = new Map<string, FeePlanReportRow>();
  const now = new Date();

  function ensurePlan(planId: string, planName: string): FeePlanReportRow {
    const existing = plans.get(planId);

    if (existing) {
      return existing;
    }

    const row: FeePlanReportRow = {
      planId,
      planName,
      invoiced: 0,
      collected: 0,
      remaining: 0,
      overdue: 0,
    };

    plans.set(planId, row);

    return row;
  }

  let collected = 0;

  for (const payment of payments) {
    collected += payment.amount;
    const row = ensurePlan(payment.invoice.feePlanId, payment.invoice.feePlan.name);
    row.collected += payment.amount;
  }

  let invoiced = 0;
  let remaining = 0;
  let overdue = 0;

  for (const invoice of invoices) {
    const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const due = Math.max(invoice.amount - paid, 0);
    const isOverdue =
      invoice.status !== "PAID" &&
      invoice.status !== "WAIVED" &&
      invoice.dueDate.getTime() < now.getTime();
    const row = ensurePlan(invoice.feePlanId, invoice.feePlan.name);

    invoiced += invoice.amount;
    remaining += due;
    row.invoiced += invoice.amount;
    row.remaining += due;

    if (isOverdue) {
      overdue += due;
      row.overdue += due;
    }
  }

  return {
    collected,
    invoiced,
    remaining,
    overdue,
    paymentsCount: payments.length,
    invoicesCount: invoices.length,
    plans: Array.from(plans.values()).sort((a, b) =>
      a.planName.localeCompare(b.planName, "ar"),
    ),
  };
}

// ─────────────────────────────────────────────
// تقرير أداء المعلمين
// ─────────────────────────────────────────────

export type TeacherPerformanceRow = {
  teacherId: string;
  teacherName: string;
  halaqas: number;
  students: number;
  sessions: number;
  recitations: number;
  averageGrade: number;
  exams: number;
};

export async function getTeacherPerformanceData({
  range,
  halaqaId,
}: {
  range: ReportRange;
  halaqaId?: string;
}): Promise<TeacherPerformanceRow[]> {
  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      ...(halaqaId ? { halaqas: { some: { id: halaqaId } } } : {}),
    },
    select: {
      id: true,
      name: true,
      halaqas: {
        where: halaqaId ? { id: halaqaId } : undefined,
        select: { id: true, _count: { select: { enrollments: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const teacherIds = teachers.map((teacher) => teacher.id);

  if (teacherIds.length === 0) {
    return [];
  }

  const [attendance, recitations, exams] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: { gte: range.start, lt: range.end },
        halaqa: {
          teacherId: { in: teacherIds },
          ...(halaqaId ? { id: halaqaId } : {}),
        },
      },
      select: {
        halaqaId: true,
        date: true,
        halaqa: { select: { teacherId: true } },
      },
    }),
    prisma.recitationRecord.findMany({
      where: {
        date: { gte: range.start, lt: range.end },
        teacherId: { in: teacherIds },
        ...(halaqaId
          ? { student: { enrollments: { some: { halaqaId } } } }
          : {}),
      },
      select: { teacherId: true, grade: true },
    }),
    prisma.exam.findMany({
      where: {
        date: { gte: range.start, lt: range.end },
        halaqa: {
          teacherId: { in: teacherIds },
          ...(halaqaId ? { id: halaqaId } : {}),
        },
      },
      select: { halaqa: { select: { teacherId: true } } },
    }),
  ]);

  const sessions = new Map<string, Set<string>>();
  const grades = new Map<string, number[]>();
  const examCounts = new Map<string, number>();

  for (const record of attendance) {
    const set = sessions.get(record.halaqa.teacherId) ?? new Set<string>();
    set.add(`${record.halaqaId}|${record.date.toISOString().slice(0, 10)}`);
    sessions.set(record.halaqa.teacherId, set);
  }

  for (const record of recitations) {
    const list = grades.get(record.teacherId) ?? [];
    list.push(record.grade);
    grades.set(record.teacherId, list);
  }

  for (const exam of exams) {
    const teacherId = exam.halaqa.teacherId;
    examCounts.set(teacherId, (examCounts.get(teacherId) ?? 0) + 1);
  }

  return teachers.map((teacher) => {
    const teacherGrades = grades.get(teacher.id) ?? [];

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      halaqas: teacher.halaqas.length,
      students: teacher.halaqas.reduce(
        (sum, halaqa) => sum + halaqa._count.enrollments,
        0,
      ),
      sessions: sessions.get(teacher.id)?.size ?? 0,
      recitations: teacherGrades.length,
      averageGrade:
        teacherGrades.length > 0
          ? roundOne(
              teacherGrades.reduce((sum, grade) => sum + grade, 0) /
                teacherGrades.length,
            )
          : 0,
      exams: examCounts.get(teacher.id) ?? 0,
    };
  });
}
