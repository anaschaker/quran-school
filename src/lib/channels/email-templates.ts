import "server-only";

import type { NotifyPayload } from "@/lib/notify";

const baseStyle = `
  <div style="direction:rtl;text-align:right;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;background:#f7f5ef;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #dcece4;overflow:hidden;">
      <div style="background:#0f3d2e;color:#f9f0d2;padding:18px 22px;">
        <h1 style="margin:0;font-size:18px;">مدرسة القرآن الكريم</h1>
      </div>
      <div style="padding:22px;color:#08251c;line-height:1.8;">
        {CONTENT}
      </div>
      <div style="padding:14px 22px;border-top:1px solid #dcece4;color:#5a6b63;font-size:12px;">
        هذا البريد آلي، يرجى عدم الرد عليه.
      </div>
    </div>
  </div>
`;

function wrap(content: string): string {
  return baseStyle.replace("{CONTENT}", content);
}

export function renderEmailTemplate(
  event: string | undefined,
  payload: NotifyPayload,
): { subject: string; html: string } {
  const title = payload.title;
  const body = payload.body;
  const href = payload.href
    ? `<p style="margin-top:16px;"><a href="${payload.href}" style="display:inline-block;background:#0f3d2e;color:#f9f0d2;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">فتح</a></p>`
    : "";

  switch (event) {
    case "absence":
      return {
        subject: title,
        html: wrap(
          `<h2 style="margin:0 0 8px;font-size:16px;color:#b91c1c;">${title}</h2>` +
            `<p>${body}</p>${href}`,
        ),
      };
    case "invoice":
      return {
        subject: title,
        html: wrap(
          `<h2 style="margin:0 0 8px;font-size:16px;color:#0f3d2e;">${title}</h2>` +
            `<p>${body}</p>${href}`,
        ),
      };
    case "certificate":
      return {
        subject: title,
        html: wrap(
          `<h2 style="margin:0 0 8px;font-size:16px;color:#c9a227;">${title}</h2>` +
            `<p>${body}</p>${href}`,
        ),
      };
    case "announcement":
      return {
        subject: title,
        html: wrap(
          `<h2 style="margin:0 0 8px;font-size:16px;color:#0f3d2e;">${title}</h2>` +
            `<p>${body}</p>${href}`,
        ),
      };
    default:
      return {
        subject: title,
        html: wrap(
          `<h2 style="margin:0 0 8px;font-size:16px;color:#0f3d2e;">${title}</h2>` +
            `<p>${body}</p>${href}`,
        ),
      };
  }
}
