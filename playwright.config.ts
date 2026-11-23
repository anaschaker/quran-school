import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  webServer: {
    // يجهّز قاعدة الاختبار قبل إقلاع الخادم (Playwright يقلع الخادم قبل globalSetup).
    command: "node tests/e2e/start-server.mjs",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      PORT: "3001",
      DATABASE_URL: "file:./test.db",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "test-secret-at-least-32-bytes-long!!",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
