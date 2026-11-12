// Auth rules against real PostgreSQL + Mailpit (npm run db:up). FR-AUTH-001..008.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env["HIBP_ENABLED"] = "false"; // no network calls from tests

const { getAuth } = await import("./auth");
const { getDb } = await import("./db");
const { CURRENT_PRIVACY_POLICY_VERSION } =
  await import("@/modules/auth/signup-rules");
const auth = getAuth();
const db = getDb();

const PASSWORD = "Purple-Lantern-Harbour-42";
const created: string[] = [];

function uniqueEmail(tag: string) {
  const email = `int-${tag}-${crypto.randomUUID()}@example.com`;
  created.push(email);
  return email;
}

async function signUp(email: string, role = "CANDIDATE") {
  return auth.api.signUpEmail({
    body: {
      name: "Test User",
      email,
      password: PASSWORD,
      role,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    },
  });
}

beforeAll(async () => {
  const res = await fetch("http://localhost:8025/api/v1/info").catch(
    () => null,
  );
  if (!res?.ok)
    throw new Error("Mailpit is not running – start it with `npm run db:up`");
});

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { in: created } } });
  await db.$disconnect();
});

describe("sign-up", () => {
  it("creates an unverified user with role, consent time and an Argon2id hash", async () => {
    const email = uniqueEmail("signup");
    await signUp(email, "EMPLOYER");
    const user = await db.user.findUniqueOrThrow({
      where: { email },
      include: { accounts: true },
    });
    expect(user).toMatchObject({
      role: "EMPLOYER",
      status: "ACTIVE",
      emailVerified: false,
    });
    expect(user.privacyPolicyVersion).toBe(CURRENT_PRIVACY_POLICY_VERSION);
    expect(Date.now() - user.privacyConsentAt.getTime()).toBeLessThan(60_000);
    expect(user.accounts[0]?.password).toMatch(/^\$argon2id\$/);
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/); // UUIDv7
  });

  it("writes an auth.signup audit entry", async () => {
    const email = uniqueEmail("audit");
    await signUp(email);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    const entry = await db.auditLog.findFirst({
      where: { action: "auth.signup", targetId: user.id },
    });
    expect(entry?.actorRole).toBe("CANDIDATE");
  });

  it("refuses ADMIN as a sign-up role (FR-AUTH-002)", async () => {
    const email = uniqueEmail("admin");
    await expect(signUp(email, "ADMIN")).rejects.toThrow(
      /candidate or an employer/,
    );
    expect(await db.user.findUnique({ where: { email } })).toBeNull();
  });

  it("refuses a sign-up without the current privacy policy (NFR-PRV-002)", async () => {
    const email = uniqueEmail("policy");
    await expect(
      auth.api.signUpEmail({
        body: {
          name: "X",
          email,
          password: PASSWORD,
          role: "CANDIDATE",
          privacyPolicyVersion: "old",
        },
      }),
    ).rejects.toThrow(/privacy policy/);
  });

  it("refuses passwords shorter than 12 characters (FR-AUTH-003)", async () => {
    await expect(
      auth.api.signUpEmail({
        body: {
          name: "X",
          email: uniqueEmail("short"),
          password: "short-pass",
          role: "CANDIDATE",
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
      }),
    ).rejects.toThrow(/too short/i);
  });

  it("never creates a second account for the same email, whatever the case (FR-AUTH-004)", async () => {
    const email = uniqueEmail("dup");
    await signUp(email);
    await signUp(email.toUpperCase()).catch(() => undefined);
    expect(await db.user.count({ where: { email } })).toBe(1);
  });
});

describe("sign-in", () => {
  it("refuses login before the email is verified (FR-AUTH-006)", async () => {
    const email = uniqueEmail("unverified");
    await signUp(email);
    await expect(
      auth.api.signInEmail({ body: { email, password: PASSWORD } }),
    ).rejects.toThrow(/not verified/i);
  });

  it("refuses login for a suspended account (FR-ADM-006)", async () => {
    const email = uniqueEmail("suspended");
    await signUp(email);
    await db.user.update({
      where: { email },
      data: {
        emailVerified: true,
        status: "SUSPENDED",
        statusReason: "Fraud review",
      },
    });
    await expect(
      auth.api.signInEmail({ body: { email, password: PASSWORD } }),
    ).rejects.toThrow(/can't sign in/);
    expect(await db.session.count({ where: { user: { email } } })).toBe(0);
  });

  it("logs in a verified, active user", async () => {
    const email = uniqueEmail("ok");
    await signUp(email);
    await db.user.update({ where: { email }, data: { emailVerified: true } });
    const res = await auth.api.signInEmail({
      body: { email, password: PASSWORD },
    });
    expect(res.user.email).toBe(email);
    expect(await db.session.count({ where: { user: { email } } })).toBe(1);
  });
});

describe("database rule", () => {
  it("rejects a suspension without a reason (FR-ADM-006)", async () => {
    const email = uniqueEmail("noreason");
    await signUp(email);
    await expect(
      db.user.update({ where: { email }, data: { status: "SUSPENDED" } }),
    ).rejects.toThrow(/user_suspension_reason/);
  });
});
