import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AutoRefresh } from "@/components/auto-refresh";
import { NewConversationForm } from "@/components/new-conversation-form";
import { startConversation } from "@/lib/actions/internal-messages";
import { getSession } from "@/lib/auth";
import { getMessagingContacts } from "@/lib/messaging";
import { MESSAGING_ROLE_LABEL } from "@/lib/messaging-types";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "الرسائل",
};

export const instant = false;

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "تعذّر إرسال الرسالة: النص فارغ أو يتجاوز 1000 حرف.",
  forbidden: "لا تملك صلاحية الوصول إلى تلك المحادثة.",
  send: "تعذّر إرسال الرسالة حاليًا. يرجى المحاولة مرة أخرى.",
};

type InboxPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function MessagesInboxPage({
  searchParams,
}: InboxPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/account?force=1");
  }

  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : undefined;

  const contacts = await getMessagingContacts(session.userId, session.role);

  const [conversations, unreadGroups] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        OR: [
          { participantAId: session.userId },
          { participantBId: session.userId },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        participantA: { select: { id: true, name: true, role: true } },
        participantB: { select: { id: true, name: true, role: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
      },
    }),
    prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        senderId: { not: session.userId },
        readAt: null,
        conversation: {
          OR: [
            { participantAId: session.userId },
            { participantBId: session.userId },
          ],
        },
      },
      _count: { _all: true },
    }),
  ]);

  const unreadMap = new Map(
    unreadGroups.map((group) => [group.conversationId, group._count._all]),
  );

  return (
    <main className="flex-1">
      <AutoRefresh />

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-950 sm:text-3xl">
              الرسائل
            </h1>
            <p className="mt-1 text-sm leading-7 text-brand-700">
              محادثاتك الداخلية مع إدارة المدرسة والمعلمين وأولياء الأمور.
            </p>
          </div>
          <Link
            href="/account"
            className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
          >
            حسابي →
          </Link>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-brand-950">
                المحادثات
              </h2>
              <span className="text-xs font-medium text-brand-600">
                {conversations.length} محادثة
              </span>
            </div>

            {conversations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-brand-900/15 bg-brand-50/40 p-6 text-sm text-brand-600">
                لا توجد محادثات بعد. ابدأ محادثة جديدة من النموذج المجاور.
              </p>
            ) : (
              <ul className="space-y-2">
                {conversations.map((conversation) => {
                  const other =
                    conversation.participantA.id === session.userId
                      ? conversation.participantB
                      : conversation.participantA;
                  const lastMessage = conversation.messages[0];
                  const unreadCount = unreadMap.get(conversation.id) ?? 0;
                  const isMine = lastMessage?.senderId === session.userId;

                  return (
                    <li key={conversation.id}>
                      <Link
                        href={`/messages/${conversation.id}`}
                        className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                          unreadCount > 0
                            ? "border-gold-500/40 bg-gold-50/30 hover:bg-gold-50/60"
                            : "border-brand-900/10 bg-white hover:border-gold-500/40"
                        }`}
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-gold-200">
                          {other.name.trim().charAt(0)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-brand-950">
                              {other.name}
                              <span className="ms-2 text-xs font-medium text-brand-500">
                                {MESSAGING_ROLE_LABEL[other.role]}
                              </span>
                            </p>
                            {lastMessage ? (
                              <time
                                dateTime={lastMessage.createdAt.toISOString()}
                                className="shrink-0 text-[0.65rem] text-brand-500"
                              >
                                {dateFormatter.format(lastMessage.createdAt)}
                              </time>
                            ) : null}
                          </div>

                          <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="line-clamp-1 text-sm text-brand-600">
                              {lastMessage
                                ? `${isMine ? "أنت: " : ""}${lastMessage.content}`
                                : "لا توجد رسائل."}
                            </p>
                            {unreadCount > 0 ? (
                              <span className="shrink-0 rounded-full bg-brand-900 px-2 py-0.5 text-[0.65rem] font-bold text-white">
                                {unreadCount} غير مقروءة
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <aside className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(8,37,28,0.5)] sm:p-6">
            <h2 className="text-lg font-bold text-brand-950">محادثة جديدة</h2>
            <p className="mt-1 text-xs leading-6 text-brand-600">
              تظهر القائمة حسب صلاحياتك: المدير يراسل الجميع، والمعلم يراسل طلاب
              حلقاته وأولياء أمورهم، وولي الأمر يراسل معلمي أبنائه والإدارة.
            </p>

            <div className="mt-4">
              <NewConversationForm
                action={startConversation}
                contacts={contacts}
              />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
