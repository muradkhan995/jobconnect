import type { Prisma, PrismaClient, UserRole } from "@/generated/prisma/client";
import { isSensitiveKey } from "@/lib/privacy";

/**
 * Every auditable event (FR-ADM-019). Extend this list as features land;
 * the database also checks the dotted lower-case format.
 */
export type AuditAction =
  | "auth.signup"
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.password_reset_requested"
  | "auth.password_reset"
  | "auth.password_changed"
  | "user.suspended"
  | "user.reactivated"
  | "user.deletion_requested"
  | "user.erased"
  | "company.verified"
  | "company.rejected"
  | "company.suspended"
  | "company.reinstated"
  | "job.approved"
  | "job.rejected"
  | "job.removed"
  | "industry.created"
  | "industry.updated";

export type AuditTargetType =
  "user" | "company" | "job" | "application" | "industry";

export type AuditEntry = {
  action: AuditAction;
  actor: { userId: string; role: UserRole } | null; // null = system job
  target?: { type: AuditTargetType; id: string };
  ipAddress?: string | null;
  requestId?: string | null;
  /** Reasons, old/new statuses. Never personal data – enforced below. */
  metadata?: Record<string, string | number | boolean | null>;
};

/** Anything that can write audit rows: the client, or a transaction client. */
export type AuditWriter =
  Pick<PrismaClient, "auditLog"> | Pick<Prisma.TransactionClient, "auditLog">;

export class AuditMetadataError extends Error {}

/** Rejects metadata keys that look like personal data (NFR-PRV-004). */
export function assertNoPersonalData(metadata: Record<string, unknown>): void {
  const bad = Object.keys(metadata).filter(isSensitiveKey);
  if (bad.length > 0) {
    throw new AuditMetadataError(
      `Audit metadata must not contain: ${bad.join(", ")}`,
    );
  }
}

/**
 * Records one audit entry. Pass the transaction client of the action being audited so
 * both commit or fail together (docs/06-architecture/01-system-architecture.md §5.1 step 5).
 */
export async function recordAudit(
  writer: AuditWriter,
  entry: AuditEntry,
): Promise<void> {
  const metadata = entry.metadata ?? {};
  assertNoPersonalData(metadata);
  await writer.auditLog.create({
    data: {
      action: entry.action,
      actorUserId: entry.actor?.userId ?? null,
      actorRole: entry.actor?.role ?? null,
      targetType: entry.target?.type ?? null,
      targetId: entry.target?.id ?? null,
      ipAddress: entry.ipAddress ?? null,
      requestId: entry.requestId ?? null,
      metadata,
    },
  });
}
