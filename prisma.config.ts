import path from "node:path";
import { defineConfig } from "prisma/config";

const dbPath = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  // For Prisma 7's CLI; the runtime client uses the adapter constructed in src/lib/db.ts.
  datasource: {
    url: dbPath,
  } as never,
});
