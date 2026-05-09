import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

declare global {
  var __atlasPrisma: PrismaClient | undefined;
}

function buildClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  // Prisma 7 expects a raw filename (or `:memory:`) for the better-sqlite3 adapter.
  const filename = url.startsWith("file:") ? url.slice(5) : url;
  const adapter = new PrismaBetterSqlite3({ url: filename });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalThis.__atlasPrisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__atlasPrisma = prisma;
}
