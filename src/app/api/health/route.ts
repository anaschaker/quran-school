import { connection } from "next/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";

/**
 * نقطة فحص الصحة (/api/health):
 * تُستخدم من Docker/Nginx ومراقبة الخدمة للتأكد من أن التطبيق وقاعدة البيانات يعملان.
 * لا تعيد أي بيانات حساسة (لا اتصال قاعدة البيانات ولا أسرار البيئة).
 */
export async function GET() {
  // إجبار التوليد عند الطلب (cacheComponents).
  await connection();

  const startedAt = Date.now();
  let databaseOk = false;
  let latencyMs: number | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
    latencyMs = Date.now() - startedAt;
  } catch (error) {
    console.error("فشل فحص صحة قاعدة البيانات:", error);
  }

  const body = {
    status: databaseOk ? "ok" : "degraded",
    version: APP_VERSION,
    environment: process.env.NODE_ENV ?? "unknown",
    uptimeSeconds: Math.round(process.uptime()),
    checks: {
      application: { status: "ok" },
      database: {
        status: databaseOk ? "ok" : "down",
        latencyMs,
      },
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: databaseOk ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
