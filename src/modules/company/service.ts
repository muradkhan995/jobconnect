import "server-only";
import type { CompanyStatus, Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { requestLogger } from "@/lib/logger";
import {
  DomainError,
  invalidTransition,
  notFound,
  stateChanged,
} from "@/lib/http/errors";
import { uuidv7 } from "@/lib/uuidv7";
import { recordAudit } from "@/modules/audit/audit";
import { requireRole } from "@/modules/auth/policy";
import type { CurrentUser } from "@/modules/auth/session";
import { companyDecisionEmail } from "./emails";
import {
  ADMIN_TRANSITIONS,
  canEmployerEdit,
  statusAfterEmployerEdit,
  type AdminCompanyAction,
} from "./rules";
import type { CompanyInput } from "./schemas";

type RequestMeta = { requestId: string };

const companySelect = {
  id: true,
  name: true,
  description: true,
  industryId: true,
  industry: { select: { name: true } },
  size: true,
  website: true,
  location: true,
  verificationStatus: true,
  statusReason: true,
  submittedAt: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect;

export type CompanyView = Prisma.CompanyGetPayload<{
  select: typeof companySelect;
}>;

async function assertActiveIndustry(industryId: string) {
  const industry = await getDb().industry.findUnique({
    where: { id: industryId },
  });
  if (!industry?.isActive) {
    throw new DomainError(
      400,
      "VALIDATION_FAILED",
      "Please check the highlighted fields.",
      [{ field: "industryId", message: "Choose an industry from the list." }],
    );
  }
}

// ── Industries ────────────────────────────────────────────────────────────────

export function listActiveIndustries() {
  return getDb().industry.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// ── Employer ──────────────────────────────────────────────────────────────────

/** The employer's own company, or null (FR-EMP-001). */
export async function getMyCompany(
  user: CurrentUser,
): Promise<CompanyView | null> {
  requireRole(user, "EMPLOYER");
  return getDb().company.findUnique({
    where: { ownerUserId: user.id },
    select: companySelect,
  });
}

/** Creates the employer's company in PENDING (FR-EMP-001, FR-EMP-004). */
export async function createMyCompany(
  user: CurrentUser,
  input: CompanyInput,
): Promise<CompanyView> {
  requireRole(user, "EMPLOYER");
  await assertActiveIndustry(input.industryId);
  try {
    return await getDb().company.create({
      data: {
        id: uuidv7(),
        ownerUserId: user.id,
        ...input,
        verificationStatus: "PENDING",
      },
      select: companySelect,
    });
  } catch (err) {
    // UNIQUE(owner_user_id): one company per employer, even if two requests race.
    if ((err as { code?: string }).code === "P2002") {
      throw new DomainError(
        409,
        "COMPANY_EXISTS",
        "You already have a company profile.",
      );
    }
    throw err;
  }
}

/** Updates the employer's company (FR-EMP-003). Editing a rejected company resubmits it (BR §2). */
export async function updateMyCompany(
  user: CurrentUser,
  input: CompanyInput,
): Promise<CompanyView> {
  requireRole(user, "EMPLOYER");
  const current = await getDb().company.findUnique({
    where: { ownerUserId: user.id },
  });
  if (!current) throw notFound("Your company profile");
  if (!canEmployerEdit(current.verificationStatus)) {
    throw invalidTransition(
      "A suspended company can't be edited. Contact support.",
    );
  }
  await assertActiveIndustry(input.industryId);
  const next = statusAfterEmployerEdit(current.verificationStatus);
  const resubmitted = next !== current.verificationStatus;
  const { count } = await getDb().company.updateMany({
    // Guarded update: only if nobody (e.g. an admin) changed the status meanwhile.
    where: { id: current.id, verificationStatus: current.verificationStatus },
    data: {
      ...input,
      verificationStatus: next,
      ...(resubmitted ? { statusReason: null, submittedAt: new Date() } : {}),
    },
  });
  if (count === 0) throw stateChanged();
  return getDb().company.findUniqueOrThrow({
    where: { id: current.id },
    select: companySelect,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function listCompaniesForAdmin(
  admin: CurrentUser,
  status: CompanyStatus,
) {
  requireRole(admin, "ADMIN");
  return getDb().company.findMany({
    where: { verificationStatus: status },
    // The verification queue is oldest first (FR-ADM-007).
    orderBy: { submittedAt: "asc" },
    take: 100,
    select: {
      id: true,
      name: true,
      location: true,
      submittedAt: true,
      verificationStatus: true,
      industry: { select: { name: true } },
    },
  });
}

export async function countCompaniesByStatus(admin: CurrentUser) {
  requireRole(admin, "ADMIN");
  const rows = await getDb().company.groupBy({
    by: ["verificationStatus"],
    _count: true,
  });
  const counts: Record<CompanyStatus, number> = {
    PENDING: 0,
    VERIFIED: 0,
    REJECTED: 0,
    SUSPENDED: 0,
  };
  for (const r of rows) counts[r.verificationStatus] = r._count;
  return counts;
}

export async function getCompanyForAdmin(admin: CurrentUser, id: string) {
  requireRole(admin, "ADMIN");
  const company = await getDb().company.findUnique({
    where: { id },
    select: {
      ...companySelect,
      owner: { select: { name: true, email: true } },
    },
  });
  if (!company) throw notFound("This company");
  return company;
}

const OUTCOME = {
  verify: "verified",
  reject: "rejected",
  suspend: "suspended",
  reinstate: "reinstated",
} as const;

/**
 * Admin decision on a company (FR-ADM-008, BR §2). The status change and its audit entry
 * commit together; the employer is emailed afterwards (FR-ADM-008 "the employer is notified").
 */
export async function decideCompany(
  admin: CurrentUser,
  id: string,
  action: AdminCompanyAction,
  reason: string | null,
  meta: RequestMeta,
): Promise<CompanyView> {
  requireRole(admin, "ADMIN");
  const rule = ADMIN_TRANSITIONS[action];
  if (rule.needsReason && !reason) {
    throw new DomainError(400, "VALIDATION_FAILED", "A reason is required.", [
      { field: "reason", message: "Tell the employer why." },
    ]);
  }
  const db = getDb();
  const company = await db.company.findUnique({
    where: { id },
    include: { owner: { select: { name: true, email: true } } },
  });
  if (!company) throw notFound("This company");
  if (company.verificationStatus !== rule.from) {
    throw invalidTransition(
      `Only ${rule.from.toLowerCase()} companies can be ${OUTCOME[action]}.`,
    );
  }

  await db.$transaction(async (tx) => {
    const { count } = await tx.company.updateMany({
      where: { id, verificationStatus: rule.from }, // guarded update
      data: {
        verificationStatus: rule.to,
        statusReason: rule.needsReason ? reason : null,
        ...(action === "verify"
          ? { verifiedAt: new Date(), verifiedBy: admin.id }
          : {}),
      },
    });
    if (count === 0) throw stateChanged();
    await recordAudit(tx, {
      action: `company.${OUTCOME[action]}`,
      actor: { userId: admin.id, role: "ADMIN" },
      target: { type: "company", id },
      requestId: meta.requestId,
      metadata: {
        from: rule.from,
        to: rule.to,
        reason: rule.needsReason ? reason : null,
      },
    });
  });

  if (company.owner) {
    // Best effort: the decision is already committed, so a mail outage must not undo or
    // fail it. Retries arrive with the background worker (docs/08 §5.3).
    await sendEmail(
      companyDecisionEmail({
        to: company.owner.email,
        name: company.owner.name,
        companyName: company.name,
        outcome: OUTCOME[action],
        reason: rule.needsReason ? reason : null,
        url: `${env().BETTER_AUTH_URL}/employer`,
      }),
    ).catch((err: unknown) =>
      requestLogger(meta.requestId).error(
        { err },
        "company decision email failed",
      ),
    );
  }

  return db.company.findUniqueOrThrow({ where: { id }, select: companySelect });
}
