import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // Unit tests only. Integration tests (*.int.test.ts) need a database:
    // see vitest.integration.config.ts.
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.int.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/app/**",
        "src/generated/**",
        "src/lib/db.ts",
        "src/lib/env.ts",
      ],
    },
  },
});
