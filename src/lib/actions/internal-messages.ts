"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import {
  canMessage,
  normalizeParticipants,
} from "@/lib/messaging";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { zodFieldErrors, type ActionResult } from "@/lib/validations/admin";
import {
  sendMessageSchema,
  startConversationSchema,
} from "@/lib/validations/internal-message";

function revalidateConversation(conversationId?: string) {
  revalidatePath("/messages");

  if (conversationId) {
    revalidatePath(`/messages/${conversationId}`);
  }

  revalidatePath("/", "layout");
}

function messagePreview(content: string): string {
  return content.length > 140 ? `${content.slice(0, 137)}…` : content;
}

export async function startConversation(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/account?force=1");
  }

  const raw = {
    recipientId: String(formData.get("recipientId") ?? ""),
    content: String(formData.get("content") ?? ""),
  };

  const parsed = startConversationSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: raw,
      submissionId: Date.now(),
    };
  }

  const { recipientId, content } = parsed.data;

  const allowed = await canMessage(session.userId, session.role, recipientId);

  if (!allowed) {
    return {
      success: false,
      message: "لا تملك صلاحية مراسلة هذا المستخدم.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  const participants = normalizeParticipants(session.userId, recipientId);

  let conversationId: string;

  try {
    const conversation = await prisma.conversation.upsert({
      where: {
        participantAId_participantBId: participants,
      },
      create: {
        ...participants,
        updatedAt: new Date(),
      },
      update: {},
      select: { id: true },
    });

    conversationId = conversation.id;

    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: session.userId,
          content,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
  } catch (error) {
    console.error("تعذّر بدء المحادثة:", error);
    return {
      success: false,
      message: "تعذّر إرسال الرسالة حاليًا. يرجى المحاولة مرة أخرى.",
      values: raw,
      submissionId: Date.now(),
    };
  }

  await notify(recipientId, {
    title: `رسالة جديدة من ${session.name}`,
    body: messagePreview(content),
    href: `/messages/${conversationId}`,
  });

  revalidateConversation(conversationId);

  redirect(`/messages/${conversationId}`);
}

export async function sendMessage(formData: FormData): Promise<void> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/account?force=1");
  }

  const conversationId = String(formData.get("conversationId") ?? "").trim();

  const parsed = sendMessageSchema.safeParse({
    conversationId,
    content: String(formData.get("content") ?? ""),
  });

  if (!parsed.success) {
    redirect(
      conversationId
        ? `/messages/${conversationId}?error=invalid`
        : "/messages?error=invalid",
    );
  }

  const participant = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { participantAId: session.userId },
        { participantBId: session.userId },
      ],
    },
    select: { participantAId: true, participantBId: true },
  });

  if (!participant) {
    redirect("/messages?error=forbidden");
  }

  const recipientId =
    participant.participantAId === session.userId
      ? participant.participantBId
      : participant.participantAId;

  try {
    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: session.userId,
          content: parsed.data.content,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
  } catch (error) {
    console.error("تعذّر إرسال الرسالة:", error);
    redirect(`/messages/${conversationId}?error=send`);
  }

  await notify(recipientId, {
    title: `رسالة جديدة من ${session.name}`,
    body: messagePreview(parsed.data.content),
    href: `/messages/${conversationId}`,
  });

  revalidateConversation(conversationId);

  redirect(`/messages/${conversationId}`);
}
