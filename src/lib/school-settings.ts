import "server-only";

import { cache } from "react";

import { school } from "@/config/school";
import { prisma } from "@/lib/prisma";

import type { SchoolHourEntry, SchoolSettings } from "@/lib/school-settings-shared";
export type { SchoolHourEntry, SchoolSettings } from "@/lib/school-settings-shared";

export const SETTING_KEYS = {
  name: "school.name",
  phone: "school.phone",
  address: "school.address",
  hours: "school.hours",
  aboutIntro: "school.about.intro",
  currency: "school.currency",
  exchangeRate: "school.exchangeRate",
} as const;

export const defaultSchoolSettings: SchoolSettings = {
  name: school.name,
  phone: school.phone,
  address: school.address,
  hours: school.hours.map((entry) => ({
    days: entry.days,
    time: entry.time,
  })),
  aboutIntro: school.about.intro,
  currency: school.currency,
  exchangeRate: school.exchangeRate,
};

function parseHours(raw: string | undefined): SchoolHourEntry[] | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return null;

    const entries = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;

        const candidate = item as { days?: unknown; time?: unknown };

        if (
          typeof candidate.days !== "string" ||
          typeof candidate.time !== "string"
        ) {
          return null;
        }

        const days = candidate.days.trim();
        const time = candidate.time.trim();

        if (!days || !time) return null;

        return { days, time };
      })
      .filter((entry): entry is SchoolHourEntry => entry !== null);

    return entries.length > 0 ? entries : null;
  } catch {
    return null;
  }
}

async function loadSchoolSettings(): Promise<SchoolSettings> {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: Object.values(SETTING_KEYS) } },
      select: { key: true, value: true },
    });

    const map = new Map(rows.map((row) => [row.key, row.value]));
    const exchangeRate = Number(map.get(SETTING_KEYS.exchangeRate));

    return {
      name: map.get(SETTING_KEYS.name)?.trim() || defaultSchoolSettings.name,
      phone: map.get(SETTING_KEYS.phone)?.trim() || defaultSchoolSettings.phone,
      address:
        map.get(SETTING_KEYS.address)?.trim() || defaultSchoolSettings.address,
      hours:
        parseHours(map.get(SETTING_KEYS.hours)) ??
        defaultSchoolSettings.hours,
      aboutIntro:
        map.get(SETTING_KEYS.aboutIntro)?.trim() ||
        defaultSchoolSettings.aboutIntro,
      currency:
        map.get(SETTING_KEYS.currency)?.trim() || defaultSchoolSettings.currency,
      exchangeRate:
        Number.isFinite(exchangeRate) && exchangeRate > 0
          ? exchangeRate
          : defaultSchoolSettings.exchangeRate,
    };
  } catch (error) {
    console.error("تعذّر تحميل إعدادات المدرسة:", error);
    return defaultSchoolSettings;
  }
}

export const getSchoolSettings = cache(loadSchoolSettings);

export function phoneHref(phone: string): string {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "#";
}
