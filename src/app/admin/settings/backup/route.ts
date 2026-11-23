import { getSession } from "@/lib/auth";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return new Response("غير مصرح", { status: 403 });
  }

  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (!url.startsWith("file:")) {
    return new Response("نسخة احتياطية غير متاحة لهذا النوع من قواعد البيانات.", {
      status: 400,
    });
  }

  let filePath = url.slice("file:".length).trim();
  filePath = filePath.split("?")[0];

  if (!path.isAbsolute(filePath)) {
    // Prisma يحل المسار النسبي نسبةً إلى مجلد prisma/.
    filePath = path.join(process.cwd(), "prisma", filePath);
  }

  let data: Buffer;

  try {
    data = await readFile(/* turbopackIgnore: true */ filePath);
  } catch (error) {
    console.error("تعذّر قراءة قاعدة البيانات للنسخة الاحتياطية:", error);
    return new Response("تعذّر إنشاء النسخة الاحتياطية.", { status: 500 });
  }

  const date = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="quran-school-backup-${date}.db"`,
      "Content-Length": String(data.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
