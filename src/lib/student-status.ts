export const STUDENT_STATUSES = [
  "ACTIVE",
  "GRADUATED",
  "WITHDRAWN",
  "ARCHIVED",
] as const;

export type StudentStatusValue = (typeof STUDENT_STATUSES)[number];

export const STUDENT_STATUS_LABELS: Record<StudentStatusValue, string> = {
  ACTIVE: "نشط",
  GRADUATED: "متخرج",
  WITHDRAWN: "منسحب",
  ARCHIVED: "مؤرشف",
};

export const STUDENT_STATUS_CLASSES: Record<StudentStatusValue, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  GRADUATED: "bg-gold-100 text-gold-800",
  WITHDRAWN: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-neutral-200 text-neutral-700",
};

export function isStudentStatus(value: unknown): value is StudentStatusValue {
  return (
    typeof value === "string" &&
    (STUDENT_STATUSES as readonly string[]).includes(value)
  );
}
