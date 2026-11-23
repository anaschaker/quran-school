import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AutoRefresh } from "@/components/auto-refresh";
import { sendMessage } from "@/lib/actions/internal-messages";
import { getSession } from "@/lib/auth";
import { MESSAGING_ROLE_LABEL } from "@/lib/messaging-types";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "محادثة",
};

export const instant = false;

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "تعذّر إرسال الرسالة: النص فارغ أو يتجاوز 1000 حرف.",
  send: "تعذّر إرسال الرسالة حاليًا. يرجى المحاولة مرة أخرى.",
};

type ConversationPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ConversationPage({
  params,
  searchParams,
}: ConversationPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/account?force=1");
  }

  const { id } = await params;
  const query = await searchParams;
  const errorMessage = query.error ? ERROR_MESSAGES[query.error] : undefined;

  const membership = await prisma.conversation.findFirst({
    where: {
      id,
      OR: [
        { participantAId: session.userId },
        { participantBId: session.userId },
      ],
    },
    select: { id: true },
  });

  if (!membership) {
    notFound();
  }

  // تعليم رسائل الطرف الآخر كمقروءة عند فتح المحادثة.
  await prisma.message.updateMany({
    where: {
      conversationId: membership.id,
      senderId: { not: session.userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id: membership.id },
    include: {
      participantA: { select: { id: true, name: true, role: true } },
      participantB: { select: { id: true, name: true, role: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  const other =
    conversation.participantA.id === session.userId
      ? conversation.participantB
      : conversation.participantA;

  return (
    <main className="flex-1">
      <AutoRefresh />

      <section className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/messages"
            className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
          >
            ← كل الرسائل
          </Link>

          <div className="flex items-center gap-2 text-sm">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-gold-200">
              {other.name.trim().charAt(0)}
            </span>
            <div>
              <p className="font-bold text-brand-950">{other.name}</p>
              <p className="text-xs text-brand-600">
                {MESSAGING_ROLE_LABEL[other.role]}
              </p>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-2xl border border-brand-900/10 bg-white shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)]">
          <div
            className="max-h-[28rem] space-y-4 overflow-y-auto p-5 sm:p-6"
            aria-live="polite"
          >
            {conversation.messages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-brand-900/15 bg-brand-50/40 px-4 py-3 text-sm text-brand-600">
                لا توجد رسائل في هذه المحادثة بعد.
              </p>
            ) : (
              conversation.messages.map((message) => {
                const isMine = message.senderId === session.userId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                        isMine
                          ? "bg-brand-900 text-white"
                          : "border border-brand-900/10 bg-brand-50/60 text-brand-950"
                      }`}
                    >
                      {!isMine ? (
                        <p className="mb-1 text-[0.65rem] font-bold text-brand-600">
                          {message.sender.name}
                        </p>
                      ) : null}

                      <p className="whitespace-pre-line">{message.content}</p>

                      <div
                        className={`mt-1.5 flex flex-wrap items-center gap-2 text-[0.65rem] ${
                          isMine ? "text-brand-200" : "text-brand-500"
                        }`}
                      >
                        <time dateTime={message.createdAt.toISOString()}>
                          {dateFormatter.format(message.createdAt)}
                        </time>
                        {isMine ? (
                          <span>
                            {message.readAt ? "تمت القراءة" : "أُرسلت"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            action={sendMessage}
            className="space-y-3 border-t border-brand-900/10 p-5 sm:p-6"
          >
            <input type="hidden" name="conversationId" value={conversation.id} />
            <label
              htmlFor="message-content"
              className="block text-sm font-bold text-brand-900"
            >
              رسالة جديدة
            </label>
            <textarea
              id="message-content"
              name="content"
              required
              maxLength={1000}
              rows={3}
              placeholder="اكتب رسالتك هنا (1000 حرف كحد أقصى)..."
              className="w-full rounded-xl border border-brand-900/15 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-brand-500">
                يتم تحديث المحادثة تلقائيًا كل 15 ثانية.
              </p>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800"
              >
                إرسال
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
