"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { setWhatsAppEnabled } from "@/lib/channel-settings";
import { sendWhatsApp } from "@/lib/channels/whatsapp";

export async function toggleWhatsAppChannel(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const enabled = formData.get("enabled") === "on";
  await setWhatsAppEnabled(enabled);
  revalidatePath("/admin/settings");
  redirect("/admin/settings?flash=whatsapp-saved");
}

export async function testWhatsAppSend(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const to = String(formData.get("to") ?? "").trim();
  if (!to) {
    redirect("/admin/settings?flash=whatsapp-test-missing");
  }
  const result = await sendWhatsApp({ to, body: "رسالة اختبار من مدرسة القرآن الكريم." });
  const flash = result.sent ? "whatsapp-test-ok" : "whatsapp-test-failed";
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?flash=${flash}`);
}
