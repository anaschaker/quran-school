// نسخة احتياطية متسقة (VACUUM INTO) لقاعدة SQLite مع احتفاظ بآخر 14 نسخة.
// المتغيرات: BACKUP_DIR (افتراضي ./backups)، BACKUP_RETENTION (افتراضي 14).
import { createPrismaClient } from "../src/lib/prisma";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const backupDir = process.env.BACKUP_DIR
    ? path.resolve(process.env.BACKUP_DIR)
    : path.resolve(process.cwd(), "backups");

  const retention = Math.max(1, Number(process.env.BACKUP_RETENTION ?? "14") || 14);

  fs.mkdirSync(backupDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const destination = path.join(backupDir, `quran-school-backup-${date}.db`);

  if (fs.existsSync(destination)) {
    console.log(`ℹ️ توجد نسخة احتياطية لليوم (${destination})، لم يتم إنشاء نسخة جديدة.`);
    return;
  }

  const prisma = createPrismaClient();
  let ok = false;

  try {
    const escaped = destination.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`VACUUM INTO '${escaped}'`);
    ok = true;
  } catch (error) {
    console.error("❌ فشل إنشاء النسخة الاحتياطية:", error);
  } finally {
    await prisma.$disconnect();
  }

  if (!ok) process.exit(1);

  console.log(`✅ تم إنشاء النسخة الاحتياطية: ${destination}`);

  // احتفاظ بآخر N نسخة.
  const backups = fs
    .readdirSync(backupDir)
    .filter((name) => /^quran-school-backup-\d{4}-\d{2}-\d{2}\.db$/.test(name))
    .sort()
    .reverse();

  const toRemove = backups.slice(retention);
  for (const name of toRemove) {
    fs.rmSync(path.join(backupDir, name), { force: true });
  }
  if (toRemove.length > 0) {
    console.log(
      `🗑️ تم حذف ${toRemove.length} نسخة قديمة (احتفاظ بآخر ${retention}).`,
    );
  }
}

main()
  .catch((error) => {
    console.error("❌ فشل إنشاء النسخة الاحتياطية:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // no-op
  });

