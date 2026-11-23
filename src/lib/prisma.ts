import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function makePrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const log =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  if (tursoUrl && tursoUrl.startsWith("libsql://")) {
    // Netlify/Turso path: libSQL over HTTP (no native TCP needed).
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: tursoToken });
    return new PrismaClient({ adapter, log: log as never });
  }

  return new PrismaClient({ log: log as never });
}

export function createPrismaClient(): PrismaClient {
  return makePrismaClient();
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
