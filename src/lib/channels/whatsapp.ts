import "server-only";

import { getWhatsAppEnabled } from "@/lib/channel-settings";

export type WhatsAppMessage = {
  to: string;
  body: string;
};

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export async function sendWhatsApp(
  message: WhatsAppMessage,
): Promise<{ sent: boolean; error?: string }> {
  // معطّل افتراضياً.
  const enabled = await getWhatsAppEnabled();
  if (!enabled) {
    return { sent: false, error: "قناة واتساب معطّلة." };
  }

  if (!isWhatsAppConfigured()) {
    return { sent: false, error: "بيانات اعتماد واتساب غير مُهيّأة." };
  }

  // في وضع التطوير: اطبع في الـ console.
  if (process.env.NODE_ENV !== "production") {
    console.log("📱 [DEV WHATSAPP]", { to: message.to, body: message.body });
    return { sent: true };
  }

  const phoneId = process.env.WHATSAPP_PHONE_ID!;
  const token = process.env.WHATSAPP_TOKEN!;
  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: message.to.replace(/[^\d]/g, ""),
    type: "text",
    text: { body: message.body },
  };

  let lastError: string | undefined;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { sent: true };
      }

      const text = await response.text();
      lastError = `HTTP ${response.status}: ${text}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    // انتظر قليلاً قبل إعادة المحاولة (باستثناء آخر محاولة).
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return { sent: false, error: lastError };
}
