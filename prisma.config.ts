import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// The Prisma CLI does not read Next.js env files, so load them here.
// .env.local wins over .env; real environment variables win over both.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Optional so `prisma generate` works in CI without a database.
  datasource: { url: process.env["DATABASE_URL"] },
});
