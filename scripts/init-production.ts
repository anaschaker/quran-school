// إنشاء قاعدة بيانات الإنتاج وحساب المدير الأول — بدون أي بيانات تجريبية.
//
// الاستخدام:
//   npx tsx scripts/init-production.ts
// أو بتمرير القيم كمتغيرات بيئة:
//   ADMIN_NAME="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." npx tsx scripts/init-production.ts
//
// الأمان: لا يعمل هذا السكربت إذا كان هناك مدير موجود مسبقًا بنفس البريد.
import { execSync } from "node:child_process";
import { Role } from "@prisma/client";
import { createPrismaClient } from "../src/lib/prisma";
import { hash } from "bcryptjs";
import readline from "node:readline/promises";

const prisma = createPrismaClient();

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongEnough(password: string): boolean {
  return (
    password.length >= 10 &&
    /[A-Za-z\u0600-\u06FF]/.test(password) &&
    /\d/.test(password)
  );
}

function promptHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return rl.question(question).finally(() => rl.close());
  }

  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    let value = "";

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
    };

    const onData = (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      for (const char of text) {
        if (char === "\r" || char === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  console.log("=== تهيئة قاعدة بيانات الإنتاج ===");

  // 1) تطبيق الترحيلات (لا يُنشئ أي بيانات تجريبية).
  console.log("→ تطبيق ترحيلات قاعدة البيانات...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });

  // 2) جمع بيانات المدير الأول.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let name = process.env.ADMIN_NAME?.trim() ?? "";
  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  let phone = process.env.ADMIN_PHONE?.trim() ?? "";
  let password = process.env.ADMIN_PASSWORD ?? "";

  if (!name) {
    if (process.stdin.isTTY) name = (await rl.question("اسم المدير: ")).trim();
  }
  if (!email) {
    if (process.stdin.isTTY) email = (await rl.question("بريد المدير: ")).trim().toLowerCase();
  }
  if (!phone && process.stdin.isTTY) {
    phone = (await rl.question("هاتف المدير (اختياري): ")).trim();
  }
  if (!password && process.stdin.isTTY) {
    password = await promptHidden("كلمة مرور المدير (تُكتب مخفية): ");
  }

  rl.close();

  if (!name || !email || !password) {
    fail(
      "في الوضع غير التفاعلي، يرجى تمرير ADMIN_NAME و ADMIN_EMAIL و ADMIN_PASSWORD كمتغيرات بيئة.",
    );
  }
  if (!isValidEmail(email)) fail("صيغة البريد الإلكتروني غير صحيحة.");
  if (!isStrongEnough(password)) {
    fail("كلمة المرور ضعيفة: يجب أن تكون 10 أحرف على الأقل وتحتوي حرفًا ورقمًا.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    fail(`يوجد مستخدم بهذا البريد مسبقًا (${email}). لم يتم تغيير أي شيء.`);
  }

  // 3) إنشاء المدير فقط.
  const passwordHash = await hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      role: Role.ADMIN,
      passwordHash,
      mustChangePassword: false,
    },
    select: { id: true, name: true, email: true },
  });

  console.log("\n✅ تم إنشاء حساب المدير الأول:");
  console.log(`   الاسم: ${admin.name}`);
  console.log(`   البريد: ${admin.email}`);
  console.log(
    "\nالخطوة التالية: سجّل الدخول من /login ثم افتح /admin/settings لضبط بيانات المدرسة.",
  );
  console.log("لا تنسَ حذف متغيرات ADMIN_PASSWORD من ملف البيئة بعد الانتهاء.\n");
}

main()
  .catch((error) => {
    console.error("\n❌ فشل تهيئة الإنتاج:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
