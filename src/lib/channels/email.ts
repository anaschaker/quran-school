import "server-only";

import nodemailer from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM,
  );
}

export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean; error?: string }> {
  // في وضع التطوير: اطبع البريد في الـ console بدل إرساله.
  if (process.env.NODE_ENV !== "production") {
    console.log("📧 [DEV EMAIL]", {
      to: message.to,
      subject: message.subject,
      html: message.html,
    });
    return { sent: true };
  }

  if (!isEmailConfigured()) {
    return { sent: false, error: "SMTP غير مُهيّأ." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
    });

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
