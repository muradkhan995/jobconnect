import type { CompanyStatus } from "@/generated/prisma/enums";

export type AdminCompanyAction = "verify" | "reject" | "suspend" | "reinstate";

/**
 * The company lifecycle (BR §2) as one table: action → allowed from-status, resulting
 * status, and whether a reason is required. Services and tests both use it.
 */
export const ADMIN_TRANSITIONS: Record<
  AdminCompanyAction,
  { from: CompanyStatus; to: CompanyStatus; needsReason: boolean }
> = {
  verify: { from: "PENDING", to: "VERIFIED", needsReason: false },
  reject: { from: "PENDING", to: "REJECTED", needsReason: true },
  suspend: { from: "VERIFIED", to: "SUSPENDED", needsReason: true },
  reinstate: { from: "SUSPENDED", to: "VERIFIED", needsReason: false },
};

export function isAdminCompanyAction(
  value: string,
): value is AdminCompanyAction {
  return Object.hasOwn(ADMIN_TRANSITIONS, value);
}

/** Status after the employer saves edits: a rejected company goes back for review. */
export function statusAfterEmployerEdit(current: CompanyStatus): CompanyStatus {
  return current === "REJECTED" ? "PENDING" : current;
}

/** Employers may edit unless the company is suspended (they must contact support). */
export function canEmployerEdit(status: CompanyStatus): boolean {
  return status !== "SUSPENDED";
}
