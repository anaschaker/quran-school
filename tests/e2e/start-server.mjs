// يجهّز قاعدة بيانات الاختبار ثم يشغّل خادم الإنتاج على المنفذ 3001.
// Playwright يشغّل خادم الويب قبل globalSetup، لذا يجب أن تكون القاعدة جاهزة هنا.
import { spawn } from "node:child_process";

await import("../../scripts/prepare-e2e.mjs");

const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--port", "3001"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: "3001",
      DATABASE_URL: "file:./test.db",
      AUTH_SECRET:
        process.env.AUTH_SECRET ?? "test-secret-at-least-32-bytes-long!!",
      NODE_ENV: "production",
    },
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 0));
