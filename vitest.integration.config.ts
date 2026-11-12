import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["src/**/*.int.test.ts"],
    // Tests share one database: run files one at a time.
    fileParallelism: false,
    // Real database + SMTP: the first call in a file warms up pools and connections.
    testTimeout: 15_000,
  },
});
