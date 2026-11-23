"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SETTING_KEYS } from "@/lib/school-settings";
import { schoolSettingsSchema } from "@/lib/validations/settings";
import { zodFieldErrors } from "@/lib/validations/admin";

export type SettingsActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: {
    name: string;
    phone: string;
    address: string;
    aboutIntro: string;
    currency: string;
    exchangeRate: string;
    hours: { days: string; time: string }[];
  };
  submissionId?: number;
};

function toValues(raw: {
  name: string;
  phone: string;
  address: string;
  aboutIntro: string;
  currency: string;
  exchangeRate: string;
  hours: { days: string; time: string }[];
}): SettingsActionState["values"] {
  return raw;
}

export async function updateSchoolSettings(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireRole("ADMIN");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const aboutIntro = String(formData.get("aboutIntro") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").trim();
  const exchangeRate = String(formData.get("exchangeRate") ?? "").trim();

  const daysList = formData.getAll("hoursDays").map((value) => String(value));
  const timesList = formData.getAll("hoursTime").map((value) => String(value));

  const rawHours = daysList.map((days, index) => ({
    days: days.trim(),
    time: String(timesList[index] ?? "").trim(),
  }));

  const filteredHours = rawHours.filter((entry) => entry.days || entry.time);

  const raw = {
    name,
    phone,
    address,
    aboutIntro,
    currency,
    exchangeRate,
    hours: filteredHours,
  };

  const parsed = schoolSettingsSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      fieldErrors: zodFieldErrors(parsed.error),
      values: toValues(raw),
      submissionId: Date.now(),
    };
  }

  const data = parsed.data;

  const entries: Array<[string, string]> = [
    [SETTING_KEYS.name, data.name],
    [SETTING_KEYS.phone, data.phone],
    [SETTING_KEYS.address, data.address],
    [SETTING_KEYS.aboutIntro, data.aboutIntro],
    [SETTING_KEYS.currency, data.currency],
    [SETTING_KEYS.exchangeRate, String(data.exchangeRate)],
    [SETTING_KEYS.hours, JSON.stringify(data.hours)],
  ];

  try {
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
  } catch (error) {
    console.error("تعذّر حفظ إعدادات المدرسة:", error);
    return {
      success: false,
      message: "تعذّر حفظ الإعدادات حاليًا. يرجى المحاولة مرة أخرى.",
      values: toValues(raw),
      submissionId: Date.now(),
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/programs");
  revalidatePath("/admin/settings");

  redirect("/admin/settings?flash=saved");
}
