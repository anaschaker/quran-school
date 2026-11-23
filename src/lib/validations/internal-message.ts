import { z } from "zod";

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, "لا يمكن إرسال رسالة فارغة.")
  .max(1000, "لا يمكن أن تتجاوز الرسالة 1000 حرف.");

export const sendMessageSchema = z.object({
  conversationId: z.string().trim().min(1, "المحادثة غير محددة."),
  content: messageContentSchema,
});

export const startConversationSchema = z.object({
  recipientId: z.string().trim().min(1, "يرجى اختيار المستلم."),
  content: messageContentSchema,
});

export type SendMessageValues = z.infer<typeof sendMessageSchema>;
export type StartConversationValues = z.infer<typeof startConversationSchema>;
