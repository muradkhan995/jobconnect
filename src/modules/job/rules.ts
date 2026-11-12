import type { JobStatus } from "@/generated/prisma/enums";

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Deadline (BR-JOB-002, FR-EMP-007) ─────────────────────────────────────────

/** A closing date (YYYY-MM-DD) means "open until the end of that day" – stored as 23:59:59.999 UTC. */
export function deadlineFromDate(date: string): Date {
  return new Date(`${date}T23:59:59.999Z`);
}

export function dateFromDeadline(deadline: Date): string {
  return deadline.toISOString().slice(0, 10);
}

/** FR-EMP-007: the deadline is in the future. */
export function isFuture(deadline: Date, now: Date = new Date()): boolean {
  return deadline.getTime() > now.getTime();
}

/** BR-JOB-002: on submit, the deadline is at least 1 and at most 90 days away. */
export function isWithinSubmitWindow(
  deadline: Date,
  now: Date = new Date(),
): boolean {
  const ahead = deadline.getTime() - now.getTime();
  return ahead >= DAY_MS && ahead <= 90 * DAY_MS;
}

// ── Lifecycle (BR §3) ─────────────────────────────────────────────────────────

export type EmployerJobAction = "submit" | "pause" | "resume" | "close";
export type AdminJobAction = "approve" | "reject" | "remove";

type Rule = { from: readonly JobStatus[]; to: JobStatus; needsReason: boolean };

export const EMPLOYER_TRANSITIONS: Record<EmployerJobAction, Rule> = {
  submit: { from: ["DRAFT"], to: "PENDING_APPROVAL", needsReason: false },
  pause: { from: ["PUBLISHED"], to: "PAUSED", needsReason: false },
  resume: { from: ["PAUSED"], to: "PUBLISHED", needsReason: false },
  close: { from: ["PUBLISHED", "PAUSED"], to: "CLOSED", needsReason: false },
};

export const ADMIN_TRANSITIONS: Record<AdminJobAction, Rule> = {
  approve: { from: ["PENDING_APPROVAL"], to: "PUBLISHED", needsReason: false },
  reject: { from: ["PENDING_APPROVAL"], to: "REJECTED", needsReason: true },
  // FR-ADM-011: an admin can take down any job that is live or about to be.
  remove: {
    from: ["PENDING_APPROVAL", "PUBLISHED", "PAUSED"],
    to: "REMOVED",
    needsReason: true,
  },
};

export function isEmployerJobAction(v: string): v is EmployerJobAction {
  return Object.hasOwn(EMPLOYER_TRANSITIONS, v);
}

export function isAdminJobAction(v: string): v is AdminJobAction {
  return Object.hasOwn(ADMIN_TRANSITIONS, v);
}

/** BR-JOB-007: CLOSED and REMOVED are final. */
export function isFinal(status: JobStatus): boolean {
  return status === "CLOSED" || status === "REMOVED";
}

export function canEdit(status: JobStatus): boolean {
  return !isFinal(status);
}

/** Fields whose change on a live job needs a new approval (BR-JOB-004). */
export const MATERIAL_FIELDS = [
  "title",
  "description",
  "requirements",
  "salaryMin",
  "salaryMax",
  "salaryPeriod",
] as const;

export function isMaterialChange(
  before: Record<(typeof MATERIAL_FIELDS)[number], unknown>,
  after: Record<(typeof MATERIAL_FIELDS)[number], unknown>,
): boolean {
  return MATERIAL_FIELDS.some((f) => before[f] !== after[f]);
}

/**
 * Status after the employer saves an edit:
 * - REJECTED → DRAFT (fix, then submit again; BR §3 diagram)
 * - PUBLISHED / PAUSED with a material change → PENDING_APPROVAL, hidden until re-approved (BR-JOB-004)
 * - otherwise unchanged (incl. deadline extensions, BR-JOB-005)
 */
export function statusAfterEdit(
  status: JobStatus,
  material: boolean,
): JobStatus {
  if (status === "REJECTED") return "DRAFT";
  if ((status === "PUBLISHED" || status === "PAUSED") && material)
    return "PENDING_APPROVAL";
  return status;
}
