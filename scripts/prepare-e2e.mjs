// يُهيّئ قاعدة بيانات الاختبار من الصفر (حذف + ترحيل + بيانات تجريبية).
// يُستدعى من tests/e2e/start-server.mjs قبل تشغيل خادم الاختبار.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const env = {
  ...process.env,
  DATABASE_URL: "file:./test.db",
  AUTH_SECRET:
    process.env.AUTH_SECRET ?? "test-secret-at-least-32-bytes-long!!",
  NODE_ENV: "test",
};

const dbPath = path.resolve(process.cwd(), "prisma", "test.db");

for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  try {
    fs.unlinkSync(dbPath + suffix);
  } catch {
    // الملف غير موجود — لا مشكلة.
  }
}

execSync("npx prisma migrate deploy", { stdio: "inherit", env, cwd: process.cwd() });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env, cwd: process.cwd() });
