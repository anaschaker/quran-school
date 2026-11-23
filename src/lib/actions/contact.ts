"use server";

import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

type ContactField = "name" | "email" | "phone" | "subject" | "message";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  submissionId?: number;
  fieldErrors?: Partial<Record<ContactField, string>>;
  values?: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-()\s]{7,30}$/;

export async function submitContactMessage(
  _previousState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const { headers } = await import("next/headers");
  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const rl = checkRateLimit(`contact:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return {
      status: "error",
      message: "تم تجاوز الحد الأقصى للرسائل. يرجى المحاولة لاحقًا.",
      submissionId: Date.now(),
    };
  }

  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };

  // حقل خفي لمكافحة الرسائل الآلية. إذا امتلأ نُظهر نجاحًا وهميًا دون حفظ.
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot) {
    return {
      status: "success",
      message: "تم استلام رسالتك، وسيتواصل معك فريق المدرسة قريبًا.",
      submissionId: Date.now(),
    };
  }

  const fieldErrors: Partial<Record<ContactField, string>> = {};

  if (values.name.length < 2) {
    fieldErrors.name = "يرجى إدخال الاسم الكامل (حرفان على الأقل).";
  } else if (values.name.length > 100) {
    fieldErrors.name = "الاسم طويل جدًا. الحد الأقصى 100 حرف.";
  }

  if (!values.email) {
    fieldErrors.email = "يرجى إدخال البريد الإلكتروني.";
  } else if (!EMAIL_PATTERN.test(values.email) || values.email.length > 200) {
    fieldErrors.email = "يرجى إدخال بريد إلكتروني صحيح.";
  }

  if (values.phone && !PHONE_PATTERN.test(values.phone)) {
    fieldErrors.phone = "يرجى إدخال رقم هاتف صحيح (أرقام ورموز فقط).";
  }

  if (values.subject.length > 150) {
    fieldErrors.subject = "الموضوع طويل جدًا. الحد الأقصى 150 حرفًا.";
  }

  if (values.message.length < 10) {
    fieldErrors.message = "يرجى كتابة رسالة من 10 أحرف على الأقل.";
  } else if (values.message.length > 2000) {
    fieldErrors.message = "الرسالة طويلة جدًا. الحد الأقصى 2000 حرف.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "يرجى تصحيح الحقول المحددة ثم إعادة الإرسال.",
      submissionId: Date.now(),
      fieldErrors,
      values,
    };
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        subject: values.subject || null,
        message: values.message,
      },
    });
  } catch (error) {
    console.error("تعذّر حفظ رسالة التواصل:", error);
    return {
      status: "error",
      message: "تعذّر إرسال الرسالة حاليًا. يرجى المحاولة مرة أخرى.",
      submissionId: Date.now(),
      values,
    };
  }

  return {
    status: "success",
    message:
      "تم إرسال رسالتك بنجاح. شكرًا لتواصلك معنا، وسيعود إليك فريق المدرسة قريبًا.",
    submissionId: Date.now(),
  };
}
