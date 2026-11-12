// Proves the database itself enforces the audit rules (FR-ADM-021, BR-AUD-001),
// so a bug in application code cannot rewrite history.
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getDb } = await import("@/lib/db");
const { recordAudit } = await import("./audit");
const db = getDb();

afterAll(async () => {
  await db.$disconnect();
});

async function newEntry(requestId: string) {
  await recordAudit(db, {
    action: "auth.login_failed",
    actor: null,
    requestId,
  });
  return db.auditLog.findFirstOrThrow({ where: { requestId } });
}

describe("audit_log database rules", () => {
  it("stores an entry", async () => {
    const row = await newEntry(`int-${crypto.randomUUID()}`);
    expect(row.action).toBe("auth.login_failed");
  });

  it("stamps occurred_at with the database clock, ignoring the caller", async () => {
    const requestId = `int-${crypto.randomUUID()}`;
    await db.auditLog.create({
      data: {
        action: "auth.login",
        requestId,
        occurredAt: new Date("2000-01-01T00:00:00Z"),
      },
    });
    const row = await db.auditLog.findFirstOrThrow({ where: { requestId } });
    expect(Date.now() - row.occurredAt.getTime()).toBeLessThan(60_000);
  });

  it("rejects UPDATE", async () => {
    const row = await newEntry(`int-${crypto.randomUUID()}`);
    await expect(
      db.auditLog.update({
        where: { id: row.id },
        data: { action: "auth.login" },
      }),
    ).rejects.toThrow(/append-only/);
  });

  it("rejects DELETE of an entry younger than 24 months", async () => {
    const row = await newEntry(`int-${crypto.randomUUID()}`);
    await expect(db.auditLog.delete({ where: { id: row.id } })).rejects.toThrow(
      /24 months/,
    );
  });

  it("rejects TRUNCATE", async () => {
    await expect(db.$executeRawUnsafe('TRUNCATE "audit_log"')).rejects.toThrow(
      /append-only/,
    );
  });

  it("rejects badly formatted actions", async () => {
    await expect(
      db.auditLog.create({ data: { action: "Login Failed" } }),
    ).rejects.toThrow(/audit_log_action_format/);
  });

  it("allows the retention job to delete entries older than 24 months", async () => {
    // A 25-month-old row can only exist by bypassing the time stamp trigger, so this test
    // disables it inside a transaction that is always rolled back.
    const requestId = `int-${crypto.randomUUID()}`;
    const deleted = await db
      .$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          'ALTER TABLE "audit_log" DISABLE TRIGGER "audit_log_stamp_time"',
        );
        await tx.$executeRaw`
          INSERT INTO "audit_log" ("action", "request_id", "occurred_at")
          VALUES ('auth.login', ${requestId}, now() - interval '25 months')`;
        const result = await tx.auditLog.deleteMany({ where: { requestId } });
        throw Object.assign(new Error("rollback"), { result });
      })
      .catch((e: { result?: { count: number } }) => e.result?.count);
    expect(deleted).toBe(1);
  });
});
