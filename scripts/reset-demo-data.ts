// حذف البيانات التجريبية المعروفة فقط (seed) مع طلب تأكيد صريح.
// لا يمسّ أي حساب أو بيانات حقيقية أُنشئت من واجهة المدرسة.
//
// الاستخدام:
//   npx tsx scripts/reset-demo-data.ts
// أو للتشغيل الآلي:
//   CONFIRM_RESET_DEMO=YES npx tsx scripts/reset-demo-data.ts
import { PrismaClient } from "@prisma/client";
import readline from "node:readline/promises";

const prisma = new PrismaClient();

const DEMO_USER_IDS = [
  "user-admin",
  "user-teacher-1",
  "user-teacher-2",
  "user-teacher-3",
  "user-parent-1",
  "user-parent-2",
  "user-parent-3",
  ...Array.from({ length: 10 }, (_, index) => `user-student-${index + 1}`),
];

const DEMO_STUDENT_IDS = Array.from(
  { length: 10 },
  (_, index) => `student-${index + 1}`,
);

const DEMO_HALAQA_IDS = ["halaqa-1", "halaqa-2", "halaqa-3"];
const DEMO_EXAM_IDS = ["exam-1", "exam-2", "exam-3"];
const DEMO_ANNOUNCEMENT_IDS = [
  "announcement-1",
  "announcement-2",
  "announcement-3",
];

async function confirm(): Promise<boolean> {
  if (process.env.CONFIRM_RESET_DEMO === "YES") return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(
    "سيتم حذف جميع الحسابات والبيانات التجريبية (بريد @quran-school.test).\nاكتب RESET للتأكيد: ",
  );
  rl.close();
  return answer.trim() === "RESET";
}

async function main() {
  const counts = await Promise.all([
    prisma.user.count({ where: { id: { in: DEMO_USER_IDS } } }),
    prisma.student.count({ where: { id: { in: DEMO_STUDENT_IDS } } }),
    prisma.halaqa.count({ where: { id: { in: DEMO_HALAQA_IDS } } }),
  ]);

  console.log("البيانات التجريبية الموجودة:", {
    users: counts[0],
    students: counts[1],
    halaqas: counts[2],
  });

  if (counts.every((value) => value === 0)) {
    console.log("لا توجد بيانات تجريبية معروفة. لا شيء لحذفه.");
    return;
  }

  if (!(await confirm())) {
    console.log("أُلغيت العملية. لم يتم حذف أي شيء.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    // الرسائل والمحادثات
    const conversations = await tx.conversation.findMany({
      where: {
        OR: [
          { participantAId: { in: DEMO_USER_IDS } },
          { participantBId: { in: DEMO_USER_IDS } },
        ],
      },
      select: { id: true },
    });
    const conversationIds = conversations.map((row) => row.id);
    await tx.message.deleteMany({
      where: {
        OR: [
          { conversationId: { in: conversationIds } },
          { senderId: { in: DEMO_USER_IDS } },
        ],
      },
    });
    await tx.conversation.deleteMany({ where: { id: { in: conversationIds } } });

    // الإشعارات وسجلات التسليم والتفضيلات
    await tx.deliveryLog.deleteMany({
      where: { userId: { in: DEMO_USER_IDS } },
    });
    await tx.notificationPreference.deleteMany({
      where: { userId: { in: DEMO_USER_IDS } },
    });
    await tx.notification.deleteMany({
      where: { userId: { in: DEMO_USER_IDS } },
    });

    // الرسوم
    const invoices = await tx.invoice.findMany({
      where: { studentId: { in: DEMO_STUDENT_IDS } },
      select: { id: true },
    });
    const invoiceIds = invoices.map((row) => row.id);
    await tx.payment.deleteMany({
      where: {
        OR: [
          { invoiceId: { in: invoiceIds } },
          { receivedBy: { in: DEMO_USER_IDS } },
        ],
      },
    });
    await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
    await tx.feePlan.deleteMany({ where: { id: "feeplan-1" } });

    // الشهادات
    await tx.certificate.deleteMany({
      where: {
        OR: [
          { studentId: { in: DEMO_STUDENT_IDS } },
          { issuedBy: { in: DEMO_USER_IDS } },
        ],
      },
    });

    // الاختبارات
    await tx.examResult.deleteMany({
      where: {
        OR: [
          { examId: { in: DEMO_EXAM_IDS } },
          { studentId: { in: DEMO_STUDENT_IDS } },
        ],
      },
    });
    await tx.exam.deleteMany({ where: { id: { in: DEMO_EXAM_IDS } } });

    // الحضور والتسميع والأعذار وأهداف الحفظ
    await tx.attendance.deleteMany({
      where: {
        OR: [
          { studentId: { in: DEMO_STUDENT_IDS } },
          { halaqaId: { in: DEMO_HALAQA_IDS } },
        ],
      },
    });
    await tx.excuse.deleteMany({
      where: { studentId: { in: DEMO_STUDENT_IDS } },
    });
    await tx.recitationRecord.deleteMany({
      where: {
        OR: [
          { studentId: { in: DEMO_STUDENT_IDS } },
          { teacherId: { in: DEMO_USER_IDS } },
        ],
      },
    });
    await tx.memorizationGoal.deleteMany({
      where: { studentId: { in: DEMO_STUDENT_IDS } },
    });

    // التسجيلات في الحلقات ثم الحلقات
    await tx.enrollment.deleteMany({
      where: {
        OR: [
          { studentId: { in: DEMO_STUDENT_IDS } },
          { halaqaId: { in: DEMO_HALAQA_IDS } },
        ],
      },
    });
    await tx.halaqa.deleteMany({ where: { id: { in: DEMO_HALAQA_IDS } } });

    // الإعلانات والفعاليات والمصادر وطلبات التسجيل التجريبية
    await tx.announcement.deleteMany({
      where: { id: { in: DEMO_ANNOUNCEMENT_IDS } },
    });
    await tx.event.deleteMany({ where: { id: "event-1" } });
    await tx.resource.deleteMany({ where: { id: "resource-1" } });
    await tx.registrationRequest.deleteMany({
      where: {
        OR: [
          { id: "registration-1" },
          { email: "parent.demo@quran-school.test" },
        ],
      },
    });

    // الطلاب ثم الحسابات التجريبية
    await tx.student.deleteMany({ where: { id: { in: DEMO_STUDENT_IDS } } });
    await tx.auditLog.deleteMany({ where: { userId: { in: DEMO_USER_IDS } } });
    await tx.user.deleteMany({ where: { id: { in: DEMO_USER_IDS } } });
  });

  const remaining = await prisma.user.count({
    where: { email: { endsWith: "@quran-school.test" } },
  });

  console.log(
    `✅ تم حذف البيانات التجريبية. الحسابات التجريبية المتبقية: ${remaining}`,
  );
  if (remaining > 0) {
    console.warn(
      "⚠️ بقيت حسابات بهذا النطاق أُنشئت يدويًا. راجعها من /admin/users.",
    );
  }
}

main()
  .catch((error) => {
    console.error("❌ فشل حذف البيانات التجريبية:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
