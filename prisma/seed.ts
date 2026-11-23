import { hash } from "bcryptjs";

import {
  AttendanceStatus,
  AnnouncementAudience,
  CertificateType,
  EventType,
  FeePeriod,
  GoalStatus,
  InvoiceStatus,
  PaymentMethod,
  RecitationType,
  ResourceType,
  Role,
} from "@prisma/client";
import { createPrismaClient } from "../src/lib/prisma";

const prisma = createPrismaClient();

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? "Quran@1234";
const BCRYPT_ROUNDS = 12;

const at = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);

const admin = {
  id: "user-admin",
  name: "عبد الرحمن الحربي",
  phone: "0500000001",
  email: "admin@quran-school.test",
};

const teachers = [
  {
    id: "user-teacher-1",
    name: "خالد العتيبي",
    phone: "0500000002",
    email: "teacher1@quran-school.test",
  },
  {
    id: "user-teacher-2",
    name: "سعد القحطاني",
    phone: "0500000003",
    email: "teacher2@quran-school.test",
  },
  {
    id: "user-teacher-3",
    name: "يوسف الشمري",
    phone: "0500000004",
    email: "teacher3@quran-school.test",
  },
];

const parents = [
  {
    id: "user-parent-1",
    name: "محمد الحربي",
    phone: "0500000011",
    email: "parent1@quran-school.test",
  },
  {
    id: "user-parent-2",
    name: "أحمد الزهراني",
    phone: "0500000012",
    email: "parent2@quran-school.test",
  },
  {
    id: "user-parent-3",
    name: "سالم الدوسري",
    phone: "0500000013",
    email: "parent3@quran-school.test",
  },
];

const students = [
  {
    name: "محمد الحربي",
    birthDate: "2015-03-12",
    stage: "المرحلة الابتدائية",
    parentId: "user-parent-1",
    notes: "متميز في الحفظ.",
  },
  {
    name: "عبدالله الزهراني",
    birthDate: "2014-07-08",
    stage: "المرحلة الابتدائية",
    parentId: "user-parent-1",
    notes: null,
  },
  {
    name: "عمر الدوسري",
    birthDate: "2013-01-25",
    stage: "المرحلة المتوسطة",
    parentId: "user-parent-2",
    notes: "يحتاج متابعة في أحكام التجويد.",
  },
  {
    name: "يوسف الغامدي",
    birthDate: "2012-11-02",
    stage: "المرحلة المتوسطة",
    parentId: "user-parent-2",
    notes: null,
  },
  {
    name: "إبراهيم المالكي",
    birthDate: "2011-05-19",
    stage: "المرحلة المتوسطة",
    parentId: "user-parent-3",
    notes: null,
  },
  {
    name: "أنس الشهري",
    birthDate: "2010-09-30",
    stage: "المرحلة الثانوية",
    parentId: null,
    notes: "حافظ لخمسة أجزاء.",
  },
  {
    name: "سلمان العنزي",
    birthDate: "2013-06-14",
    stage: "المرحلة المتوسطة",
    parentId: null,
    notes: null,
  },
  {
    name: "زياد المطيري",
    birthDate: "2012-02-21",
    stage: "المرحلة المتوسطة",
    parentId: null,
    notes: null,
  },
  {
    name: "هارون السبيعي",
    birthDate: "2009-12-05",
    stage: "المرحلة الثانوية",
    parentId: null,
    notes: "يشارك في مسابقة القرآن السنوية.",
  },
  {
    name: "بلال الحارثي",
    birthDate: "2011-08-17",
    stage: "المرحلة المتوسطة",
    parentId: null,
    notes: null,
  },
];

const halaqas = [
  {
    id: "halaqa-1",
    name: "حلقة النور",
    teacherId: "user-teacher-1",
    time: "16:00 - 17:30",
    days: "السبت، الاثنين، الأربعاء",
    maxStudents: 15,
  },
  {
    id: "halaqa-2",
    name: "حلقة الفرقان",
    teacherId: "user-teacher-2",
    time: "17:30 - 19:00",
    days: "الأحد، الثلاثاء، الخميس",
    maxStudents: 12,
  },
  {
    id: "halaqa-3",
    name: "حلقة البيان",
    teacherId: "user-teacher-3",
    time: "بعد صلاة العصر",
    days: "الجمعة، السبت",
    maxStudents: 10,
  },
];

const halaqaForStudent = (index: number) => {
  if (index < 4) return "halaqa-1";
  if (index < 7) return "halaqa-2";
  return "halaqa-3";
};

const teacherForHalaqa: Record<string, string> = {
  "halaqa-1": "user-teacher-1",
  "halaqa-2": "user-teacher-2",
  "halaqa-3": "user-teacher-3",
};

const attendanceDates = ["2026-11-01", "2026-11-02", "2026-11-03"].map(at);

const attendanceCycle: AttendanceStatus[] = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.EXCUSED,
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.PRESENT,
];

const surahNumbers = [1, 2, 18, 36, 67, 78, 87, 93, 103, 112];

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "❌ تمت حماية seed: لا يمكن تشغيل البيانات التجريبية في بيئة الإنتاج (NODE_ENV=production).",
    );
    process.exit(1);
  }
  const passwordHash = await hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  await prisma.user.upsert({
    where: { id: admin.id },
    update: {
      name: admin.name,
      phone: admin.phone,
      email: admin.email,
      role: Role.ADMIN,
      passwordHash,
    },
    create: { ...admin, role: Role.ADMIN, passwordHash },
  });

  for (const teacher of teachers) {
    await prisma.user.upsert({
      where: { id: teacher.id },
      update: {
        name: teacher.name,
        phone: teacher.phone,
        email: teacher.email,
        role: Role.TEACHER,
        passwordHash,
      },
      create: { ...teacher, role: Role.TEACHER, passwordHash },
    });
  }

  for (const parent of parents) {
    await prisma.user.upsert({
      where: { id: parent.id },
      update: {
        name: parent.name,
        phone: parent.phone,
        email: parent.email,
        role: Role.PARENT,
        passwordHash,
      },
      create: { ...parent, role: Role.PARENT, passwordHash },
    });
  }

  for (const [index, student] of students.entries()) {
    const number = index + 1;
    const userId = `user-student-${number}`;
    const email = `student${number}@quran-school.test`;
    const phone = `05000001${String(number).padStart(2, "0")}`;

    await prisma.user.upsert({
      where: { id: userId },
      update: {
        name: student.name,
        phone,
        email,
        role: Role.STUDENT,
        passwordHash,
      },
      create: {
        id: userId,
        name: student.name,
        phone,
        email,
        role: Role.STUDENT,
        passwordHash,
      },
    });

    await prisma.student.upsert({
      where: { id: `student-${number}` },
      update: {
        userId,
        birthDate: at(student.birthDate),
        stage: student.stage,
        parentId: student.parentId,
        notes: student.notes,
      },
      create: {
        id: `student-${number}`,
        userId,
        birthDate: at(student.birthDate),
        stage: student.stage,
        parentId: student.parentId,
        notes: student.notes,
      },
    });
  }

  for (const halaqa of halaqas) {
    await prisma.halaqa.upsert({
      where: { id: halaqa.id },
      update: {
        name: halaqa.name,
        teacherId: halaqa.teacherId,
        time: halaqa.time,
        days: halaqa.days,
        maxStudents: halaqa.maxStudents,
      },
      create: halaqa,
    });
  }

  for (let index = 0; index < students.length; index += 1) {
    const studentId = `student-${index + 1}`;
    const halaqaId = halaqaForStudent(index);

    await prisma.enrollment.upsert({
      where: { studentId_halaqaId: { studentId, halaqaId } },
      update: {},
      create: { studentId, halaqaId },
    });
  }

  for (let index = 0; index < students.length; index += 1) {
    const studentId = `student-${index + 1}`;
    const halaqaId = halaqaForStudent(index);

    for (const [dayIndex, date] of attendanceDates.entries()) {
      const status =
        attendanceCycle[(index + dayIndex) % attendanceCycle.length];

      await prisma.attendance.upsert({
        where: {
          studentId_halaqaId_date: { studentId, halaqaId, date },
        },
        update: { status },
        create: {
          id: `attendance-${index + 1}-${dayIndex + 1}`,
          studentId,
          halaqaId,
          date,
          status,
        },
      });
    }
  }

  const recitationTypes = [
    RecitationType.HIFZ,
    RecitationType.MURAJAA,
    RecitationType.TILAWA,
  ];

  for (let index = 0; index < students.length; index += 1) {
    const studentId = `student-${index + 1}`;
    const halaqaId = halaqaForStudent(index);
    const teacherId = teacherForHalaqa[halaqaId];
    const type = recitationTypes[index % recitationTypes.length];
    const toAyah = [5, 10, 15, 20][index % 4];

    await prisma.recitationRecord.upsert({
      where: { id: `recitation-${index + 1}` },
      update: {
        studentId,
        teacherId,
        date: at("2026-11-03"),
        type,
        surahNumber: surahNumbers[index],
        fromAyah: 1,
        toAyah,
        grade: 7 + ((index + 1) % 4),
        notes: index % 3 === 0 ? "تسميع متقن مع ملاحظات بسيطة على المخارج." : null,
      },
      create: {
        id: `recitation-${index + 1}`,
        studentId,
        teacherId,
        date: at("2026-11-03"),
        type,
        surahNumber: surahNumbers[index],
        fromAyah: 1,
        toAyah,
        grade: 7 + ((index + 1) % 4),
        notes: index % 3 === 0 ? "تسميع متقن مع ملاحظات بسيطة على المخارج." : null,
      },
    });
  }

  const exams = [
    {
      id: "exam-1",
      title: "اختبار حفظ جزء عمّ",
      date: at("2026-11-08"),
      halaqaId: "halaqa-1",
    },
    {
      id: "exam-2",
      title: "اختبار أحكام التجويد",
      date: at("2026-11-09"),
      halaqaId: "halaqa-2",
    },
    {
      id: "exam-3",
      title: "اختبار سورة البقرة",
      date: at("2026-11-10"),
      halaqaId: "halaqa-3",
    },
  ];

  for (const exam of exams) {
    await prisma.exam.upsert({
      where: { id: exam.id },
      update: { title: exam.title, date: exam.date, halaqaId: exam.halaqaId },
      create: exam,
    });
  }

  for (let index = 0; index < students.length; index += 1) {
    const halaqaId = halaqaForStudent(index);
    const exam = exams.find((item) => item.halaqaId === halaqaId);

    if (!exam) continue;

    await prisma.examResult.upsert({
      where: {
        examId_studentId: {
          examId: exam.id,
          studentId: `student-${index + 1}`,
        },
      },
      update: { score: 80 + ((index * 4) % 21) },
      create: {
        id: `exam-result-${index + 1}`,
        examId: exam.id,
        studentId: `student-${index + 1}`,
        score: 80 + ((index * 4) % 21),
        notes: index % 4 === 0 ? "أداء ممتاز." : null,
      },
    });
  }

  const announcements = [
    {
      id: "announcement-1",
      title: "بدء التسجيل للفصل الدراسي الجديد",
      content:
        "يسر إدارة مدرسة القرآن الكريم الإعلان عن فتح باب التسجيل للفصل الدراسي الجديد لجميع المراحل. يُرجى من أولياء الأمور مراجعة الإدارة لاستكمال الإجراءات.",
      date: at("2026-11-01"),
      audience: AnnouncementAudience.ALL,
    },
    {
      id: "announcement-2",
      title: "موعد اختبارات حفظ جزء عمّ",
      content:
        "تبدأ اختبارات حفظ جزء عمّ يوم الأحد القادم. نرجو من الطلاب مراجعة المحفوظ مع معلمي الحلقات والاستعداد الجيد.",
      date: at("2026-11-03"),
      audience: AnnouncementAudience.STUDENTS,
    },
    {
      id: "announcement-3",
      title: "اجتماع أولياء الأمور",
      content:
        "يعقد اجتماع أولياء الأمور يوم السبت الساعة الخامسة مساءً في مقر المدرسة لمناقشة خطة الفصل الدراسي ومستوى الطلاب.",
      date: at("2026-11-04"),
      audience: AnnouncementAudience.PARENTS,
    },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.upsert({
      where: { id: announcement.id },
      update: {
        title: announcement.title,
        content: announcement.content,
        date: announcement.date,
        audience: announcement.audience,
      },
      create: announcement,
    });
  }

  // ─── رسوم تجريبية ───
  await prisma.feePlan.upsert({
    where: { id: "feeplan-1" },
    update: { name: "رسوم شهرية", amount: 200, period: FeePeriod.MONTHLY },
    create: { id: "feeplan-1", name: "رسوم شهرية", amount: 200, period: FeePeriod.MONTHLY },
  });

  await prisma.invoice.upsert({
    where: { id: "invoice-1" },
    update: {
      studentId: "student-1",
      feePlanId: "feeplan-1",
      amount: 200,
      dueDate: at("2026-12-01"),
      status: InvoiceStatus.PARTIAL,
    },
    create: {
      id: "invoice-1",
      studentId: "student-1",
      feePlanId: "feeplan-1",
      amount: 200,
      dueDate: at("2026-12-01"),
      status: InvoiceStatus.PARTIAL,
    },
  });

  await prisma.payment.upsert({
    where: { id: "payment-1" },
    update: {
      invoiceId: "invoice-1",
      amount: 100,
      date: at("2026-11-05"),
      method: PaymentMethod.CASH,
      receivedBy: "user-admin",
    },
    create: {
      id: "payment-1",
      invoiceId: "invoice-1",
      amount: 100,
      date: at("2026-11-05"),
      method: PaymentMethod.CASH,
      receivedBy: "user-admin",
    },
  });

  // ─── شهادة تجريبية ───
  await prisma.certificate.upsert({
    where: { id: "certificate-1" },
    update: {
      studentId: "student-1",
      type: CertificateType.PART_COMPLETION,
      title: "شهادة إتمام جزء عمّ",
      serialNumber: "CERT-2026-DEMO1",
      issuedBy: "user-admin",
      issuedAt: at("2026-11-06"),
    },
    create: {
      id: "certificate-1",
      studentId: "student-1",
      type: CertificateType.PART_COMPLETION,
      title: "شهادة إتمام جزء عمّ",
      serialNumber: "CERT-2026-DEMO1",
      issuedBy: "user-admin",
      issuedAt: at("2026-11-06"),
    },
  });

  // ─── رسالة داخلية تجريبية ───
  await prisma.conversation.upsert({
    where: { participantAId_participantBId: { participantAId: "user-admin", participantBId: "user-teacher-1" } },
    update: {},
    create: {
      id: "conversation-1",
      participantAId: "user-admin",
      participantBId: "user-teacher-1",
    },
  });

  await prisma.message.upsert({
    where: { id: "message-1" },
    update: {
      conversationId: "conversation-1",
      senderId: "user-admin",
      content: "مرحبًا، نرجو متابعة مستوى الطلاب في حلقة النور.",
      createdAt: at("2026-11-06"),
    },
    create: {
      id: "message-1",
      conversationId: "conversation-1",
      senderId: "user-admin",
      content: "مرحبًا، نرجو متابعة مستوى الطلاب في حلقة النور.",
      createdAt: at("2026-11-06"),
    },
  });

  // ─── خطة حفظ تجريبية ───
  await prisma.memorizationGoal.upsert({
    where: { id: "goal-1" },
    update: {
      studentId: "student-1",
      fromSurah: 1,
      fromAyah: 1,
      toSurah: 2,
      toAyah: 5,
      startDate: at("2026-11-01"),
      targetDate: at("2026-12-01"),
      status: GoalStatus.ACTIVE,
    },
    create: {
      id: "goal-1",
      studentId: "student-1",
      fromSurah: 1,
      fromAyah: 1,
      toSurah: 2,
      toAyah: 5,
      startDate: at("2026-11-01"),
      targetDate: at("2026-12-01"),
      status: GoalStatus.ACTIVE,
    },
  });

  // ─── فعالية تجريبية ───
  await prisma.event.upsert({
    where: { id: "event-1" },
    update: {
      title: "إجازة منتصف الفصل",
      description: "إجازة منتصف الفصل الدراسي.",
      startDate: at("2026-11-15"),
      endDate: at("2026-11-19"),
      type: EventType.HOLIDAY,
      audience: "ALL",
    },
    create: {
      id: "event-1",
      title: "إجازة منتصف الفصل",
      description: "إجازة منتصف الفصل الدراسي.",
      startDate: at("2026-11-15"),
      endDate: at("2026-11-19"),
      type: EventType.HOLIDAY,
      audience: "ALL",
    },
  });

  // ─── طلب تسجيل تجريبي ───
  await prisma.registrationRequest.upsert({
    where: { id: "registration-1" },
    update: {
      studentName: "سارة الحربي",
      parentName: "نورة الحربي",
      phone: "0500000201",
      email: "parent.demo@quran-school.test",
      stage: "المرحلة الابتدائية",
      status: "PENDING",
    },
    create: {
      id: "registration-1",
      studentName: "سارة الحربي",
      parentName: "نورة الحربي",
      phone: "0500000201",
      email: "parent.demo@quran-school.test",
      stage: "المرحلة الابتدائية",
      status: "PENDING",
    },
  });

  // ─── مادة تعليمية تجريبية (رابط) ───
  await prisma.resource.upsert({
    where: { id: "resource-1" },
    update: {
      title: "رابط مفيد للتجويد",
      description: "مرجع تجويد.",
      type: ResourceType.LINK,
      url: "https://example.com/tajweed",
      uploadedBy: "user-teacher-1",
    },
    create: {
      id: "resource-1",
      title: "رابط مفيد للتجويد",
      description: "مرجع تجويد.",
      type: ResourceType.LINK,
      url: "https://example.com/tajweed",
      uploadedBy: "user-teacher-1",
    },
  });

  const [
    usersCount,
    studentsCount,
    halaqasCount,
    enrollmentsCount,
    attendanceCount,
    recitationsCount,
    examsCount,
    examResultsCount,
    announcementsCount,
    feePlansCount,
    invoicesCount,
    paymentsCount,
    certificatesCount,
    conversationsCount,
    messagesCount,
    goalsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.halaqa.count(),
    prisma.enrollment.count(),
    prisma.attendance.count(),
    prisma.recitationRecord.count(),
    prisma.exam.count(),
    prisma.examResult.count(),
    prisma.announcement.count(),
    prisma.feePlan.count(),
    prisma.invoice.count(),
    prisma.payment.count(),
    prisma.certificate.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.memorizationGoal.count(),
  ]);

  console.log("✅ تم إدخال البيانات التجريبية بنجاح.");
  console.log({
    users: usersCount,
    students: studentsCount,
    halaqas: halaqasCount,
    enrollments: enrollmentsCount,
    attendance: attendanceCount,
    recitations: recitationsCount,
    exams: examsCount,
    examResults: examResultsCount,
    announcements: announcementsCount,
    feePlans: feePlansCount,
    invoices: invoicesCount,
    payments: paymentsCount,
    certificates: certificatesCount,
    conversations: conversationsCount,
    messages: messagesCount,
    goals: goalsCount,
  });
  console.log(`🔐 كلمة المرور التجريبية لجميع الحسابات: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("❌ فشل تنفيذ seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
