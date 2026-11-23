import type { AppRole } from "@/lib/session";

export type MessagingContact = {
  id: string;
  name: string;
  role: AppRole;
};

export const MESSAGING_ROLE_LABEL: Record<AppRole, string> = {
  ADMIN: "مدير المدرسة",
  TEACHER: "معلم",
  STUDENT: "طالب",
  PARENT: "ولي أمر",
};
