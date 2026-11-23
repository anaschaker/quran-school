import "server-only";

import { prisma } from "@/lib/prisma";

const KEY = "whatsapp.enabled";

export async function getWhatsAppEnabled(): Promise<boolean> {
  const envEnabled = process.env.WHATSAPP_ENABLED === "true";
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  const dbValue = row?.value === "true";
  // DB overrides env if present.
  if (row) return dbValue;
  return envEnabled;
}

export async function setWhatsAppEnabled(enabled: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: enabled ? "true" : "false" },
    create: { key: KEY, value: enabled ? "true" : "false" },
  });
}
