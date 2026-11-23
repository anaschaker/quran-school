"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  examFormSchema,
  MAX_EXAM_SCORE,
  type ExamFormValues,
} from "@/lib/validations/exam";
import {
  zodFieldErrors,
  type ActionResult,
} from "@/lib/validations/admin";

export type { ActionResult };

type ScoreEntry = {
  studentId: string;
  score: number;
};

export async function createExam(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();

  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return {
      success: false,
      message: "غير مصرح لك بإنشاء الاختبارات.",
    };
  }

  const halaqaId = String(formData.get("halaqaId") ?? "").trim();

  if (!halaqaId) {
    return {
      success: false,
      message: "الحلقة غير موجودة.",
    };
  }

  const halaqa = await prisma.halaqa.findUnique({
    where: { id: halaqaId },
    select: { id: true, teacherId: true },
  });

  if (!halaqa) {
    return {
      success: false,
      message: "الحلقة غير موجودة.",
    };
  }

  if (session.role === "TEACHER" && halaqa.teacherId !== session.userId) {
    return {
      success: false,
      message: "هذه الحلقة غير مسندة إليك.",
    };
  }

  const raw = {
    title: String(formData.get("title") ?? ""),
    date: String(formData.get("date") ?? ""),
  };

  const parsed = examFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: {
        title: raw.title,
        date: raw.date,
      } satisfies Partial<ExamFormValues>,
      submissionId: Date.now(),
    };
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { halaqaId },
    select: {
      studentId: true,
      student: {
        select: {
          userId: true,
          parentId: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { student: { user: { name: "asc" } } },
  });

  if (enrollments.length === 0) {
    return {
      success: false,
      message: "لا يوجد طلاب مسجلون في هذه الحلقة لإدخال درجاتهم.",
    };
  }

  const scores: ScoreEntry[] = [];

  for (const enrollment of enrollments) {
    const rawScore = String(
      formData.get(`score_${enrollment.studentId}`) ?? "",
    ).trim();

    if (rawScore === "") continue;

    const score = Number(rawScore);

    if (!Number.isFinite(score) || score < 0 || score > MAX_EXAM_SCORE) {
      return {
        success: false,
        message: `درجة ${enrollment.student.user.name} يجب أن تكون رقمًا بين 0 و${MAX_EXAM_SCORE}.`,
        values: {
          title: raw.title,
          date: raw.date,
        },
        submissionId: Date.now(),
      };
    }

    scores.push({ studentId: enrollment.studentId, score });
  }

  if (scores.length === 0) {
    return {
      success: false,
      message: "يرجى إدخال درجة طالب واحد على الأقل.",
      values: {
        title: raw.title,
        date: raw.date,
      },
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        date: new Date(`${data.date}T00:00:00.000Z`),
        halaqaId,
        results: {
          create: scores.map((item) => ({
            studentId: item.studentId,
            score: item.score,
          })),
        },
      },
    });
  } catch (error) {
    console.error("تعذّر إنشاء الاختبار:", error);
    return {
      success: false,
      message: "تعذّر حفظ الاختبار حاليًا. يرجى المحاولة مرة أخرى.",
      values: {
        title: raw.title,
        date: raw.date,
      },
      submissionId: Date.now(),
    };
  }

  for (const item of scores) {
    const enrollment = enrollments.find(
      (entry) => entry.studentId === item.studentId,
    );

    if (!enrollment) continue;

    const studentName = enrollment.student.user.name;

    await notify(enrollment.student.userId, {
      title: "نتيجة اختبار جديدة",
      body: `حصلت على ${item.score} من ${MAX_EXAM_SCORE} في اختبار «${data.title}».`,
      href: "/student",
    });

    if (enrollment.student.parentId) {
      await notify(enrollment.student.parentId, {
        title: "نتيجة اختبار جديدة",
        body: `حصل ${studentName} على ${item.score} من ${MAX_EXAM_SCORE} في اختبار «${data.title}».`,
        href: "/parent",
      });
    }
  }

  revalidatePath(`/admin/halaqas/${halaqaId}`);
  revalidatePath(`/teacher/halaqas/${halaqaId}`);
  revalidatePath("/admin");
  revalidatePath("/teacher");

  const base = session.role === "ADMIN" ? "/admin" : "/teacher";

  redirect(`${base}/halaqas/${halaqaId}?flash=exam-created`);
}
