import { describe, expect, it, vi } from "vitest";
import { AuditMetadataError, assertNoPersonalData, recordAudit } from "./audit";

describe("assertNoPersonalData", () => {
  it("accepts reasons and statuses", () => {
    expect(() =>
      assertNoPersonalData({ reason: "Scam advert", from: "PUBLISHED" }),
    ).not.toThrow();
  });

  it.each(["email", "Email", "fullName", "phone", "password", "ipAddress"])(
    "rejects the key %s",
    (key) => {
      expect(() => assertNoPersonalData({ [key]: "x" })).toThrow(
        AuditMetadataError,
      );
    },
  );
});

describe("recordAudit", () => {
  it("maps the entry onto the audit_log columns", async () => {
    const create = vi.fn().mockResolvedValue({});
    await recordAudit({ auditLog: { create } } as never, {
      action: "company.verified",
      actor: { userId: "00000000-0000-7000-8000-000000000001", role: "ADMIN" },
      target: { type: "company", id: "00000000-0000-7000-8000-000000000002" },
      ipAddress: "203.0.113.7",
      requestId: "req-1",
      metadata: { reason: null },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        action: "company.verified",
        actorUserId: "00000000-0000-7000-8000-000000000001",
        actorRole: "ADMIN",
        targetType: "company",
        targetId: "00000000-0000-7000-8000-000000000002",
        ipAddress: "203.0.113.7",
        requestId: "req-1",
        metadata: { reason: null },
      },
    });
  });

  it("records system events with no actor", async () => {
    const create = vi.fn().mockResolvedValue({});
    await recordAudit({ auditLog: { create } } as never, {
      action: "user.erased",
      actor: null,
    });
    expect(create.mock.calls[0]?.[0].data).toMatchObject({
      actorUserId: null,
      actorRole: null,
    });
  });

  it("refuses personal data before touching the database", async () => {
    const create = vi.fn();
    await expect(
      recordAudit({ auditLog: { create } } as never, {
        action: "auth.signup",
        actor: null,
        metadata: { email: "amira@example.com" },
      }),
    ).rejects.toThrow(AuditMetadataError);
    expect(create).not.toHaveBeenCalled();
  });
});
