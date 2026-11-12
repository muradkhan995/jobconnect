/**
 * Creates (or resets) the demo users in prisma/demo-users.ts – local only, never production.
 *
 *   npm run db:seed
 *
 * Admins cannot sign up through the website (FR-AUTH-002); a script like this one is the
 * only way to create them (FR-ADM-001).
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { uuidv7 } from "../src/lib/uuidv7";
import { hashPassword } from "../src/modules/auth/password";
import { CURRENT_PRIVACY_POLICY_VERSION } from "../src/modules/auth/signup-rules";
import { DEMO_PASSWORD, DEMO_USERS } from "./demo-users";

config({ path: [".env.local", ".env"], quiet: true });

function assertLocalDatabase(url: string | undefined): string {
  if (!url) throw new Error("DATABASE_URL is not set");
  const host = new URL(url).hostname;
  if (
    process.env.NODE_ENV === "production" ||
    !["localhost", "127.0.0.1", "::1"].includes(host)
  ) {
    throw new Error(
      `Refusing to seed demo users into a non-local database (${host}).`,
    );
  }
  return url;
}

async function main() {
  const url = assertLocalDatabase(process.env["DATABASE_URL"]);
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  try {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    for (const demo of DEMO_USERS) {
      const user = await db.user.upsert({
        where: { email: demo.email },
        create: {
          id: uuidv7(),
          email: demo.email,
          name: demo.name,
          role: demo.role,
          emailVerified: true,
          status: "ACTIVE",
          privacyConsentAt: new Date(),
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
        update: {
          name: demo.name,
          role: demo.role,
          emailVerified: true,
          status: "ACTIVE",
          statusReason: null,
        },
      });
      // Better Auth keeps email + password logins as a "credential" account.
      await db.account.deleteMany({
        where: { userId: user.id, providerId: "credential" },
      });
      await db.account.create({
        data: {
          id: uuidv7(),
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: passwordHash,
        },
      });
      console.log(`✓ ${demo.role.padEnd(9)} ${demo.email}`);
    }
    console.log(
      "Demo users ready. Password: see DEMO_PASSWORD in prisma/demo-users.ts",
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
