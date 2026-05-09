import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
      // `server-only` throws outside Next.js's bundler — stub it for vitest.
      "server-only": resolve(rootDir, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
