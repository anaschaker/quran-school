import { prisma } from "@/lib/prisma";

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export type MonthRange = {
  year: number;
  month: number;
  start: Date;
  end: Date;
  key: string;
  label: string;
};

export function resolveMonth(value?: string): MonthRange {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;

  const match = MONTH_PATTERN.exec(value ?? "");

  if (match) {
    const parsedYear = Number(match[1]);
    const parsedMonth = Number(match[2]);

    if (parsedMonth >= 1 && parsedMonth <= 12) {
      year = parsedYear;
      month = parsedMonth;
    }
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return {
    year,
    month,
    start,
    end,
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("ar-EG", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(start),
  };
}

export type AttendanceReportRow = {
  studentId: string;
  studentName: string;
  stage: string;
  halaqas: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  attended: number;
  percentage: number;
};

export type AttendanceReport = {
  rows: AttendanceReportRow[];
  totals: {
    students: number;
    records: number;
    attended: number;
    percentage: number;
  };
};

export async function getAttendanceReport({
  range,
  halaqaId,
}: {
  range: MonthRange;
  halaqaId?: string;
}): Promise<AttendanceReport> {
  const [students, attendance, holidays] = await Promise.all([
    prisma.student.findMany({
      where: halaqaId
        ? { enrollments: { some: { halaqaId } } }
        : undefined,
      select: {
        id: true,
        stage: true,
        user: { select: { name: true } },
        enrollments: {
          where: halaqaId ? { halaqaId } : undefined,
          select: { halaqa: { select: { name: true } } },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.attendance.findMany({
      where: {
        date: { gte: range.start, lt: range.end },
        ...(halaqaId ? { halaqaId } : {}),
      },
      select: { studentId: true, status: true, date: true, halaqaId: true },
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

  const counts = new Map<
    string,
    { present: number; absent: number; late: number; excused: number }
  >();

  for (const item of filteredAttendance) {
    const current = counts.get(item.studentId) ?? {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    if (item.status === "PRESENT") current.present += 1;
    else if (item.status === "ABSENT") current.absent += 1;
    else if (item.status === "LATE") current.late += 1;
    else if (item.status === "EXCUSED") current.excused += 1;

    counts.set(item.studentId, current);
  }

  const rows: AttendanceReportRow[] = students.map((student) => {
    const record = counts.get(student.id) ?? {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };
    const total =
      record.present + record.absent + record.late + record.excused;
    const attended = record.present + record.late;

    return {
      studentId: student.id,
      studentName: student.user.name,
      stage: student.stage,
      halaqas: student.enrollments
        .map((enrollment) => enrollment.halaqa.name)
        .join(" | "),
      ...record,
      total,
      attended,
      percentage: total > 0 ? Math.round((attended / total) * 100) : 0,
    };
  });

  const records = rows.reduce((sum, row) => sum + row.total, 0);
  const attended = rows.reduce((sum, row) => sum + row.attended, 0);

  return {
    rows,
    totals: {
      students: rows.length,
      records,
      attended,
      percentage: records > 0 ? Math.round((attended / records) * 100) : 0,
    },
  };
}
