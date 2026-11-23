import "server-only";

import { prisma } from "@/lib/prisma";

export const AUDIT_ACTIONS = [
  "LOGIN",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ARCHIVE",
  "RESTORE",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITIES = [
  "USER",
  "STUDENT",
  "HALAQA",
  "FEE_PLAN",
  "INVOICE",
  "PAYMENT",
  "CERTIFICATE",
  "SETTINGS",
] as const;

export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: "تسجيل دخول",
  CREATE: "إنشاء",
  UPDATE: "تعديل",
  DELETE: "حذف",
  ARCHIVE: "أرشفة",
  RESTORE: "استعادة",
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntity, string> = {
  USER: "مستخدم",
  STUDENT: "طالب",
  HALAQA: "حلقة",
  FEE_PLAN: "خطة رسوم",
  INVOICE: "فاتورة",
  PAYMENT: "دفعة",
  CERTIFICATE: "شهادة",
  SETTINGS: "إعدادات",
};

export const AUDIT_ACTION_CLASSES: Record<AuditAction, string> = {
  LOGIN: "bg-sky-100 text-sky-800",
  CREATE: "bg-emerald-100 text-emerald-800",
  UPDATE: "bg-gold-100 text-gold-800",
  DELETE: "bg-red-100 text-red-800",
  ARCHIVE: "bg-neutral-200 text-neutral-700",
  RESTORE: "bg-brand-100 text-brand-800",
};

export function isAuditAction(value: unknown): value is AuditAction {
  return (
    typeof value === "string" &&
    (AUDIT_ACTIONS as readonly string[]).includes(value)
  );
}

export function isAuditEntity(value: unknown): value is AuditEntity {
  return (
    typeof value === "string" &&
    (AUDIT_ENTITIES as readonly string[]).includes(value)
  );
}

export type AuditEntry = {
  userId?: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  details?: string | null;
};

/**
 * يسجّل حدثًا في سجل التدقيق. لا يُفشل العملية الأصلية عند تعذّر التسجيل.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId || null,
        details: entry.details || null,
      },
    });
  } catch (error) {
    console.error("تعذّر تسجيل الحدث في سجل التدقيق:", error);
  }
}
