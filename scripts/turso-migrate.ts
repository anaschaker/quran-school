// تطبيق ترحيلات Prisma على قاعدة Turso (libSQL) من مجلد prisma/migrations.
// الاستخدام (مع ضبط TURSO_DATABASE_URL و TURSO_AUTH_TOKEN):
//   npx tsx scripts/turso-migrate.ts
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("TURSO_DATABASE_URL غير مضبوط.");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  await client.execute(
    `CREATE TABLE IF NOT EXISTS _applied_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`,
  );

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.error("لم يُعثر على مجلد migrations.");
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const name of dirs) {
    const sqlPath = path.join(migrationsDir, name, "migration.sql");
    if (!fs.existsSync(sqlPath)) continue;

    const exists = await client.execute({
      sql: "SELECT 1 FROM _applied_migrations WHERE name = ?",
      args: [name],
    });
    if (exists.rows.length > 0) {
      console.log(`⏭ تخطّي (مطبّق): ${name}`);
      continue;
    }

    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log(`▶ تطبيق: ${name}`);
    try {
      await client.executeMultiple(sql);
    } catch (error) {
      console.error(`✖ فشل: ${name}`, error);
      process.exit(1);
    }
    await client.execute({
      sql: "INSERT INTO _applied_migrations (name, applied_at) VALUES (?, ?)",
      args: [name, new Date().toISOString()],
    });
  }

  console.log("✅ اكتملت ترحيلات Turso.");
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
