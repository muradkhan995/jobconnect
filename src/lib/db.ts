import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

function createClient(): PrismaClient {
  // Sessions run in UTC via the database default set in the init migration (docs/05-design/01-data-model.md §1).
  // Not set per connection: poolers such as PgBouncer can reject startup options.
  const adapter = new PrismaPg({ connectionString: env().DATABASE_URL });
  return new PrismaClient({ adapter });
}

// One client (and one connection pool) per process. Kept on globalThis so dev hot
// reload doesn't open a new pool each time the module re-runs.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * The shared Prisma client, created on first use – not at import time, because
 * `next build` loads route modules without database credentials.
 */
export function getDb(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}
