import "server-only";

import { prisma } from "@/lib/prisma";
import type { MessagingContact } from "@/lib/messaging-types";
import type { AppRole } from "@/lib/session";

export type { MessagingContact } from "@/lib/messaging-types";

const contactSelect = {
  id: true,
  name: true,
  role: true,
} as const;

function sortByName(a: MessagingContact, b: MessagingContact) {
  return a.name.localeCompare(b.name, "ar");
}

function uniqueUsers(users: MessagingContact[], currentUserId: string) {
  const map = new Map<string, MessagingContact>();

  for (const user of users) {
    if (user.id !== currentUserId) {
      map.set(user.id, user);
    }
  }

  return Array.from(map.values()).sort(sortByName);
}

/**
 * قائمة المستخدمين الذين يُسمح للمستخدم الحالي بمراسلتهم، وفق الدور.
 */
export async function getMessagingContacts(
  userId: string,
  role: AppRole,
): Promise<MessagingContact[]> {
  if (role === "ADMIN") {
    const users = await prisma.user.findMany({
      where: { id: { not: userId } },
      select: contactSelect,
      orderBy: { name: "asc" },
    });

    return users as MessagingContact[];
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", id: { not: userId } },
    select: contactSelect,
  });

  const contacts: MessagingContact[] = [...(admins as MessagingContact[])];

  if (role === "TEACHER") {
    const halaqas = await prisma.halaqa.findMany({
      where: { teacherId: userId },
      select: {
        enrollments: {
          select: {
            student: {
              select: { userId: true, parentId: true },
            },
          },
        },
      },
    });

    const studentUserIds = new Set<string>();
    const parentIds = new Set<string>();

    for (const halaqa of halaqas) {
      for (const enrollment of halaqa.enrollments) {
        studentUserIds.add(enrollment.student.userId);

        if (enrollment.student.parentId) {
          parentIds.add(enrollment.student.parentId);
        }
      }
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: { in: Array.from(studentUserIds) } },
          { id: { in: Array.from(parentIds) } },
        ],
      },
      select: contactSelect,
    });

    contacts.push(...(users as MessagingContact[]));
  } else if (role === "PARENT") {
    const children = await prisma.student.findMany({
      where: { parentId: userId },
      select: {
        enrollments: {
          select: {
            halaqa: {
              select: { teacherId: true },
            },
          },
        },
      },
    });

    const teacherIds = new Set<string>();

    for (const child of children) {
      for (const enrollment of child.enrollments) {
        teacherIds.add(enrollment.halaqa.teacherId);
      }
    }

    const teachers = await prisma.user.findMany({
      where: { id: { in: Array.from(teacherIds) } },
      select: contactSelect,
    });

    contacts.push(...(teachers as MessagingContact[]));
  } else if (role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        parentId: true,
        enrollments: {
          select: {
            halaqa: {
              select: { teacherId: true },
            },
          },
        },
      },
    });

    const teacherIds = new Set<string>();

    if (student) {
      for (const enrollment of student.enrollments) {
        teacherIds.add(enrollment.halaqa.teacherId);
      }

      if (student.parentId) {
        const parent = await prisma.user.findUnique({
          where: { id: student.parentId },
          select: contactSelect,
        });

        if (parent) {
          contacts.push(parent as MessagingContact);
        }
      }
    }

    const teachers = await prisma.user.findMany({
      where: { id: { in: Array.from(teacherIds) } },
      select: contactSelect,
    });

    contacts.push(...(teachers as MessagingContact[]));
  }

  return uniqueUsers(contacts, userId);
}

/**
 * تحقق على الخادم من أن المرسل مسموح له بمراسلة المستلم.
 */
export async function canMessage(
  senderId: string,
  senderRole: AppRole,
  recipientId: string,
): Promise<boolean> {
  if (!recipientId || senderId === recipientId) {
    return false;
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, role: true },
  });

  if (!recipient) {
    return false;
  }

  // المدير يراسل الجميع، والجميع يستطيع مراسلة المدير.
  if (senderRole === "ADMIN" || recipient.role === "ADMIN") {
    return true;
  }

  if (senderRole === "TEACHER") {
    if (recipient.role === "STUDENT") {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          student: { userId: recipientId },
          halaqa: { teacherId: senderId },
        },
        select: { id: true },
      });

      return Boolean(enrollment);
    }

    if (recipient.role === "PARENT") {
      const student = await prisma.student.findFirst({
        where: {
          parentId: recipientId,
          enrollments: { some: { halaqa: { teacherId: senderId } } },
        },
        select: { id: true },
      });

      return Boolean(student);
    }

    return false;
  }

  if (senderRole === "STUDENT") {
    if (recipient.role === "TEACHER") {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          student: { userId: senderId },
          halaqa: { teacherId: recipientId },
        },
        select: { id: true },
      });

      return Boolean(enrollment);
    }

    if (recipient.role === "PARENT") {
      const student = await prisma.student.findFirst({
        where: { userId: senderId, parentId: recipientId },
        select: { id: true },
      });

      return Boolean(student);
    }

    return false;
  }

  if (senderRole === "PARENT") {
    if (recipient.role === "TEACHER") {
      const student = await prisma.student.findFirst({
        where: {
          parentId: senderId,
          enrollments: { some: { halaqa: { teacherId: recipientId } } },
        },
        select: { id: true },
      });

      return Boolean(student);
    }

    return false;
  }

  return false;
}

/**
 * ترتيب ثابت لطرفي المحادثة لمنع إنشاء محادثتين لنفس الزوج.
 */
export function normalizeParticipants(
  firstId: string,
  secondId: string,
): { participantAId: string; participantBId: string } {
  return firstId < secondId
    ? { participantAId: firstId, participantBId: secondId }
    : { participantAId: secondId, participantBId: firstId };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      senderId: { not: userId },
      readAt: null,
      conversation: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
    },
  });
}
