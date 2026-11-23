import { surahs } from "@/data/surahs";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * بداية كل سورة بترتيب مطلق على مستوى المصحف (1..6236).
 * مثال: الفاتحة تبدأ من 1، البقرة من 8.
 */
const SURAH_START_INDEX = (() => {
  const starts = new Array<number>(115).fill(0);
  let cursor = 1;

  for (const surah of surahs) {
    starts[surah.number] = cursor;
    cursor += surah.ayahCount;
  }

  return starts;
})();

export const TOTAL_QURAN_AYAHS = 6236;

export type GoalPace = "AHEAD" | "ON_TRACK" | "BEHIND" | "COMPLETED";

export type MemorizationGoalView = {
  id: string;
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  startDate: string;
  targetDate: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  totalAyahs: number;
  completedAyahs: number;
  progressPercent: number;
  expectedPercent: number;
  pace: GoalPace;
  paceLabel: string;
  daysRemaining: number;
  isOverdue: boolean;
};

export type StudentBadge = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  earned: boolean;
};

export type LateStudentGoal = {
  studentId: string;
  studentName: string;
  halaqaId: string;
  halaqaName: string;
  goalId: string;
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  targetDate: string;
  progressPercent: number;
  expectedPercent: number;
  daysRemaining: number;
};

const paceLabels: Record<GoalPace, string> = {
  AHEAD: "متقدم",
  ON_TRACK: "على المسار",
  BEHIND: "متأخر",
  COMPLETED: "مكتمل",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * تحويل (سورة، آية) إلى رقم مطلق على مستوى المصحف.
 */
export function toAbsoluteAyah(surahNumber: number, ayah: number): number {
  const start = SURAH_START_INDEX[surahNumber];

  if (!start) {
    return 0;
  }

  return start + ayah - 1;
}

/**
 * تحويل رقم مطلق إلى (سورة، آية). يُستخدم للعرض فقط.
 */
export function fromAbsoluteAyah(absolute: number): {
  surahNumber: number;
  ayah: number;
} {
  const safe = clamp(Math.trunc(absolute), 1, TOTAL_QURAN_AYAHS);

  for (let number = 114; number >= 1; number -= 1) {
    const start = SURAH_START_INDEX[number];

    if (safe >= start) {
      return { surahNumber: number, ayah: safe - start + 1 };
    }
  }

  return { surahNumber: 1, ayah: safe };
}

type AbsoluteRange = { start: number; end: number };

/**
 * دمج النطاقات المتداخلة/المتقاربة لعدّ الآيات الفريدة دون تكرار.
 */
export function mergeRanges(ranges: AbsoluteRange[]): AbsoluteRange[] {
  const sorted = ranges
    .filter((range) => range.start > 0 && range.end >= range.start)
    .sort((a, b) => a.start - b.start);

  const merged: AbsoluteRange[] = [];

  for (const range of sorted) {
    const last = merged[merged.length - 1];

    if (last && range.start <= last.end + 1) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}

/**
 * عدد الآيات الفريدة داخل [start, end] وفق قائمة نطاقات محفوظة.
 */
export function countCoveredAyahs(
  ranges: AbsoluteRange[],
  start: number,
  end: number,
): number {
  let total = 0;

  for (const range of mergeRanges(ranges)) {
    if (range.end < start || range.start > end) {
      continue;
    }

    total += Math.min(range.end, end) - Math.max(range.start, start) + 1;
  }

  return total;
}

/**
 * عدد الآيات الفريدة في مجموعة نطاقات.
 */
export function countUniqueAyahs(ranges: AbsoluteRange[]): number {
  return mergeRanges(ranges).reduce(
    (total, range) => total + (range.end - range.start + 1),
    0,
  );
}

function hifzRange(record: {
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
}): AbsoluteRange {
  const start = toAbsoluteAyah(record.surahNumber, record.fromAyah);
  const end = toAbsoluteAyah(record.surahNumber, record.toAyah);

  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function computePace(
  progressPercent: number,
  expectedPercent: number,
): GoalPace {
  if (progressPercent >= 100) {
    return "COMPLETED";
  }

  const diff = progressPercent - expectedPercent;

  if (diff >= 10) {
    return "AHEAD";
  }

  if (diff <= -10) {
    return "BEHIND";
  }

  return "ON_TRACK";
}

function computeExpectedPercent(
  startDate: Date,
  targetDate: Date,
  now: Date,
): number {
  const start = startDate.getTime();
  const target = targetDate.getTime();

  if (target <= start) {
    return now.getTime() >= target ? 100 : 0;
  }

  if (now.getTime() <= start) {
    return 0;
  }

  if (now.getTime() >= target) {
    return 100;
  }

  const elapsed = now.getTime() - start;
  const duration = target - start;

  return Math.round((elapsed / duration) * 100);
}

function computeDaysRemaining(targetDate: Date, now: Date): number {
  return Math.ceil((targetDate.getTime() - now.getTime()) / DAY_MS);
}

type GoalRecord = {
  id: string;
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  startDate: Date;
  targetDate: Date;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
};

function buildGoalView(
  goal: GoalRecord,
  hifzRanges: AbsoluteRange[],
  now: Date,
): MemorizationGoalView {
  const start = toAbsoluteAyah(goal.fromSurah, goal.fromAyah);
  const end = toAbsoluteAyah(goal.toSurah, goal.toAyah);
  const rangeStart = Math.min(start, end);
  const rangeEnd = Math.max(start, end);
  const totalAyahs = rangeEnd - rangeStart + 1;
  const completedAyahs = countCoveredAyahs(hifzRanges, rangeStart, rangeEnd);
  const progressPercent = clamp(
    Math.round((completedAyahs / totalAyahs) * 100),
    0,
    100,
  );
  const expectedPercent = computeExpectedPercent(
    goal.startDate,
    goal.targetDate,
    now,
  );
  const pace = computePace(progressPercent, expectedPercent);
  const daysRemaining = computeDaysRemaining(goal.targetDate, now);

  return {
    id: goal.id,
    fromSurah: goal.fromSurah,
    fromAyah: goal.fromAyah,
    toSurah: goal.toSurah,
    toAyah: goal.toAyah,
    startDate: goal.startDate.toISOString(),
    targetDate: goal.targetDate.toISOString(),
    status: goal.status,
    totalAyahs,
    completedAyahs,
    progressPercent,
    expectedPercent,
    pace,
    paceLabel: paceLabels[pace],
    daysRemaining,
    isOverdue: daysRemaining < 0 && progressPercent < 100,
  };
}

/**
 * أهداف الحفظ لطالب واحد مع حساب التقدم والوتيرة تلقائيًا من سجلات HIFZ.
 */
export async function getStudentGoals(
  studentId: string,
  now: Date = new Date(),
): Promise<MemorizationGoalView[]> {
  const [goals, hifzRecords] = await Promise.all([
    prisma.memorizationGoal.findMany({
      where: { studentId, status: { not: "CANCELLED" } },
      orderBy: [{ status: "asc" }, { targetDate: "asc" }],
    }),
    prisma.recitationRecord.findMany({
      where: { studentId, type: "HIFZ" },
      select: { surahNumber: true, fromAyah: true, toAyah: true },
    }),
  ]);

  const hifzRanges = hifzRecords.map(hifzRange);

  return goals.map((goal) => buildGoalView(goal, hifzRanges, now));
}

/**
 * الطلاب المتأخرون عن أهدافهم في حلقات معلم معيّن.
 * يُعاد لكل طالب هدفه الأكثر تأخرًا فقط.
 */
export async function getLateStudentsForTeacher(
  teacherId: string,
  now: Date = new Date(),
): Promise<LateStudentGoal[]> {
  const halaqas = await prisma.halaqa.findMany({
    where: { teacherId },
    select: {
      id: true,
      name: true,
      enrollments: {
        select: {
          student: {
            select: {
              id: true,
              user: { select: { name: true } },
              goals: {
                where: { status: "ACTIVE" },
                select: {
                  id: true,
                  fromSurah: true,
                  fromAyah: true,
                  toSurah: true,
                  toAyah: true,
                  startDate: true,
                  targetDate: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const studentIds = new Set<string>();
  const studentNames = new Map<string, string>();
  const goalsByStudent = new Map<
    string,
    { goal: GoalRecord; halaqaId: string; halaqaName: string }[]
  >();

  for (const halaqa of halaqas) {
    for (const enrollment of halaqa.enrollments) {
      const student = enrollment.student;
      studentIds.add(student.id);
      studentNames.set(student.id, student.user.name);

      for (const goal of student.goals) {
        const entries = goalsByStudent.get(student.id) ?? [];
        entries.push({
          goal,
          halaqaId: halaqa.id,
          halaqaName: halaqa.name,
        });
        goalsByStudent.set(student.id, entries);
      }
    }
  }

  if (studentIds.size === 0) {
    return [];
  }

  const hifzRecords = await prisma.recitationRecord.findMany({
    where: { studentId: { in: Array.from(studentIds) }, type: "HIFZ" },
    select: {
      studentId: true,
      surahNumber: true,
      fromAyah: true,
      toAyah: true,
    },
  });

  const rangesByStudent = new Map<string, AbsoluteRange[]>();

  for (const record of hifzRecords) {
    const ranges = rangesByStudent.get(record.studentId) ?? [];
    ranges.push(hifzRange(record));
    rangesByStudent.set(record.studentId, ranges);
  }

  const late: LateStudentGoal[] = [];

  for (const [studentId, entries] of goalsByStudent) {
    const ranges = rangesByStudent.get(studentId) ?? [];
    let worst: {
      view: MemorizationGoalView;
      halaqaId: string;
      halaqaName: string;
    } | null = null;

    for (const entry of entries) {
      const view = buildGoalView(entry.goal, ranges, now);

      if (view.pace !== "BEHIND") {
        continue;
      }

      if (
        !worst ||
        view.progressPercent - view.expectedPercent <
          worst.view.progressPercent - worst.view.expectedPercent
      ) {
        worst = {
          view,
          halaqaId: entry.halaqaId,
          halaqaName: entry.halaqaName,
        };
      }
    }

    if (!worst) {
      continue;
    }

    late.push({
      studentId,
      studentName: studentNames.get(studentId) ?? "طالب",
      halaqaId: worst.halaqaId,
      halaqaName: worst.halaqaName,
      goalId: worst.view.id,
      fromSurah: worst.view.fromSurah,
      fromAyah: worst.view.fromAyah,
      toSurah: worst.view.toSurah,
      toAyah: worst.view.toAyah,
      targetDate: worst.view.targetDate,
      progressPercent: worst.view.progressPercent,
      expectedPercent: worst.view.expectedPercent,
      daysRemaining: worst.view.daysRemaining,
    });
  }

  return late.sort((a, b) => a.progressPercent - b.progressPercent);
}

/**
 * تحديث حالة الأهداف المكتملة في قاعدة البيانات.
 * تُستدعى بعد حفظ تسميع جديد، ولا تؤثر على بقية العمليات عند فشلها.
 */
export async function syncGoalStatuses(studentId: string): Promise<void> {
  try {
    const goals = await prisma.memorizationGoal.findMany({
      where: { studentId, status: "ACTIVE" },
      select: {
        id: true,
        fromSurah: true,
        fromAyah: true,
        toSurah: true,
        toAyah: true,
        startDate: true,
        targetDate: true,
        status: true,
      },
    });

    if (goals.length === 0) {
      return;
    }

    const hifzRecords = await prisma.recitationRecord.findMany({
      where: { studentId, type: "HIFZ" },
      select: { surahNumber: true, fromAyah: true, toAyah: true },
    });

    const hifzRanges = hifzRecords.map(hifzRange);
    const completedIds: string[] = [];

    for (const goal of goals) {
      const start = toAbsoluteAyah(goal.fromSurah, goal.fromAyah);
      const end = toAbsoluteAyah(goal.toSurah, goal.toAyah);
      const rangeStart = Math.min(start, end);
      const rangeEnd = Math.max(start, end);
      const total = rangeEnd - rangeStart + 1;
      const covered = countCoveredAyahs(hifzRanges, rangeStart, rangeEnd);

      if (covered >= total) {
        completedIds.push(goal.id);
      }
    }

    if (completedIds.length > 0) {
      await prisma.memorizationGoal.updateMany({
        where: { id: { in: completedIds } },
        data: { status: "COMPLETED" },
      });
    }
  } catch (error) {
    console.error("تعذّر تحديث حالة أهداف الحفظ:", error);
  }
}

/**
 * شارات تحفيزية تُحسب تلقائيًا من بيانات الطالب الفعلية.
 * لا تعتمد على ترتيب أو مقارنة بين الطلاب.
 */
export async function getStudentBadges(studentId: string): Promise<StudentBadge[]> {
  const [hifzRecords, attendance, certificates] = await Promise.all([
    prisma.recitationRecord.findMany({
      where: { studentId, type: "HIFZ" },
      select: {
        date: true,
        surahNumber: true,
        fromAyah: true,
        toAyah: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.attendance.findMany({
      where: { studentId },
      select: { date: true, status: true },
      orderBy: { date: "asc" },
    }),
    prisma.certificate.findMany({
      where: { studentId },
      select: { type: true },
    }),
  ]);

  const memorizedAyahs = countUniqueAyahs(hifzRecords.map(hifzRange));

  const uniqueAttendance = new Map<string, string>();

  for (const record of attendance) {
    const key = record.date.toISOString().slice(0, 10);

    if (uniqueAttendance.get(key) === "PRESENT") {
      continue;
    }

    uniqueAttendance.set(key, record.status);
  }

  let consecutivePresent = 0;
  let hasFullWeek = false;

  for (const status of uniqueAttendance.values()) {
    if (status === "PRESENT") {
      consecutivePresent += 1;
      if (consecutivePresent >= 5) {
        hasFullWeek = true;
        break;
      }
    } else {
      consecutivePresent = 0;
    }
  }

  const certificateTypes = new Set(certificates.map((item) => item.type));

  const hasPartCertificate = certificateTypes.has("PART_COMPLETION");
  const hasFullCertificate = certificateTypes.has("FULL_QURAN");

  return [
    {
      id: "first-hifz",
      title: "أول خطوة",
      description: "تسجيل أول تسميع حفظ.",
      emoji: "🌱",
      earned: hifzRecords.length > 0,
    },
    {
      id: "attendance-week",
      title: "أسبوع كامل",
      description: "حضور 5 حصص متتالية دون غياب.",
      emoji: "📅",
      earned: hasFullWeek,
    },
    {
      id: "juz-complete",
      title: "إتمام جزء",
      description: "حفظ ما يعادل جزءًا كاملًا (208 آية) أو الحصول على شهادة إتمام جزء.",
      emoji: "📖",
      earned: memorizedAyahs >= 208 || hasPartCertificate,
    },
    {
      id: "quran-complete",
      title: "ختم القرآن الكريم",
      description: "إتمام حفظ القرآن كاملًا أو الحصول على شهادة ختم القرآن.",
      emoji: "🏅",
      earned: memorizedAyahs >= TOTAL_QURAN_AYAHS || hasFullCertificate,
    },
  ];
}
