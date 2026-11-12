import "server-only";
import type { JobStatus, Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { sendEmailInBackground } from "@/lib/email";
import { env } from "@/lib/env";
import {
  DomainError,
  invalidTransition,
  notFound,
  stateChanged,
} from "@/lib/http/errors";
import { requestLogger } from "@/lib/logger";
import { uuidv7 } from "@/lib/uuidv7";
import { recordAudit } from "@/modules/audit/audit";
import { requireRole } from "@/modules/auth/policy";
import type { CurrentUser } from "@/modules/auth/session";
import { jobDecisionEmail } from "./emails";
import {
  ADMIN_TRANSITIONS,
  EMPLOYER_TRANSITIONS,
  canEdit,
  deadlineFromDate,
  isFuture,
  isMaterialChange,
  isWithinSubmitWindow,
  statusAfterEdit,
  type AdminJobAction,
  type EmployerJobAction,
} from "./rules";
import type { JobInput } from "./schemas";

type RequestMeta = { requestId: string };

export const jobSelect = {
  id: true,
  title: true,
  description: true,
  requirements: true,
  location: true,
  workMode: true,
  jobType: true,
  experienceLevel: true,
  industryId: true,
  industry: { select: { name: true } },
  salaryMin: true,
  salaryMax: true,
  salaryPeriod: true,
  currency: true,
  deadline: true,
  status: true,
  statusReason: true,
  submittedAt: true,
  publishedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  company: { select: { id: true, name: true, verificationStatus: true } },
} satisfies Prisma.JobSelect;

export type JobView = Prisma.JobGetPayload<{ select: typeof jobSelect }>;

const fieldError = (field: string, message: string) =>
  new DomainError(
    400,
    "VALIDATION_FAILED",
    "Please check the highlighted fields.",
    [{ field, message }],
  );

function toData(input: JobInput) {
  const { deadline, ...rest } = input;
  return { ...rest, deadline: deadlineFromDate(deadline) };
}

async function assertActiveIndustry(industryId: string) {
  const industry = await getDb().industry.findUnique({
    where: { id: industryId },
  });
  if (!industry?.isActive)
    throw fieldError("industryId", "Choose an industry from the list.");
}

/** The employer's company – every employer job action is scoped to it (FR-EMP-015 pattern). */
async function myCompany(user: CurrentUser) {
  requireRole(user, "EMPLOYER");
  const company = await getDb().company.findUnique({
    where: { ownerUserId: user.id },
  });
  if (!company) {
    throw new DomainError(
      409,
      "INVALID_TRANSITION",
      "Create your company profile first.",
    );
  }
  return company;
}

/** One of the employer's own jobs. Another company's job is "not found" (API design §1.2). */
async function myJob(user: CurrentUser, jobId: string) {
  const company = await myCompany(user);
  const job = await getDb().job.findFirst({
    where: { id: jobId, companyId: company.id },
  });
  if (!job) throw notFound("This job");
  return { company, job };
}

// ── Employer ──────────────────────────────────────────────────────────────────

/** FR-EMP-013: the employer's jobs, newest first, with how many applications each has. */
export async function listMyJobs(user: CurrentUser) {
  const company = await myCompany(user);
  return getDb().job.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      deadline: true,
      createdAt: true,
      publishedAt: true,
      _count: { select: { applications: true } }, // FR-EMP-013
    },
  });
}

export async function getMyJob(
  user: CurrentUser,
  jobId: string,
): Promise<JobView> {
  const { job } = await myJob(user, jobId);
  return getDb().job.findUniqueOrThrow({
    where: { id: job.id },
    select: jobSelect,
  });
}

/** FR-EMP-006/007: a new DRAFT; drafts are allowed before the company is verified (docs/04-design/01-ui-flows.md J3). */
export async function createJob(
  user: CurrentUser,
  input: JobInput,
): Promise<JobView> {
  const company = await myCompany(user);
  await assertActiveIndustry(input.industryId);
  const data = toData(input);
  if (!isFuture(data.deadline))
    throw fieldError("deadline", "The closing date must be in the future.");
  return getDb().job.create({
    data: { id: uuidv7(), companyId: company.id, ...data, status: "DRAFT" },
    select: jobSelect,
  });
}

/** FR-EMP-009, BR-JOB-004/005: edit; a material change to a live job needs approval again. */
export async function updateJob(
  user: CurrentUser,
  jobId: string,
  input: JobInput,
): Promise<JobView> {
  const { job } = await myJob(user, jobId);
  if (!canEdit(job.status))
    throw invalidTransition("Closed or removed jobs can't be edited.");
  await assertActiveIndustry(input.industryId);
  const data = toData(input);
  if (!isFuture(data.deadline))
    throw fieldError("deadline", "The closing date must be in the future.");
  if (
    job.status !== "DRAFT" &&
    job.status !== "REJECTED" &&
    !isWithinSubmitWindow(data.deadline)
  ) {
    throw fieldError(
      "deadline",
      "The closing date must be between 1 and 90 days from today.",
    );
  }
  const next = statusAfterEdit(job.status, isMaterialChange(job, data));
  const { count } = await getDb().job.updateMany({
    where: { id: job.id, status: job.status }, // guarded update (docs/05-design/01-data-model.md §4)
    data: {
      ...data,
      status: next,
      ...(next !== job.status ? { statusReason: null } : {}),
      ...(next === "PENDING_APPROVAL" && next !== job.status
        ? { submittedAt: new Date() }
        : {}),
    },
  });
  if (count === 0) throw stateChanged();
  return getDb().job.findUniqueOrThrow({
    where: { id: job.id },
    select: jobSelect,
  });
}

/** FR-EMP-008/010/011: submit, pause, resume, close. */
export async function employerJobAction(
  user: CurrentUser,
  jobId: string,
  action: EmployerJobAction,
): Promise<JobView> {
  const { company, job } = await myJob(user, jobId);
  const rule = EMPLOYER_TRANSITIONS[action];
  if (!rule.from.includes(job.status)) {
    throw invalidTransition(
      `This job can't be ${action === "submit" ? "submitted" : `${action}d`} right now.`,
    );
  }
  if (
    (action === "submit" || action === "resume") &&
    company.verificationStatus !== "VERIFIED"
  ) {
    // BR-CMP-001: only verified companies get jobs in front of candidates.
    throw new DomainError(
      422,
      "COMPANY_NOT_VERIFIED",
      "Available once your company is verified.",
    );
  }
  if (action === "submit" && !isWithinSubmitWindow(job.deadline)) {
    throw new DomainError(
      422,
      "DEADLINE_OUT_OF_RANGE",
      "The closing date must be between 1 and 90 days from today. Edit the job first.",
    );
  }
  if (action === "resume" && !isFuture(job.deadline)) {
    throw new DomainError(
      422,
      "DEADLINE_PASSED",
      "The closing date has passed. Extend it first.",
    );
  }
  const now = new Date();
  const { count } = await getDb().job.updateMany({
    where: { id: job.id, status: job.status },
    data: {
      status: rule.to,
      ...(action === "submit" ? { submittedAt: now, statusReason: null } : {}),
      ...(action === "close" ? { closedAt: now } : {}),
    },
  });
  if (count === 0) throw stateChanged();
  return getDb().job.findUniqueOrThrow({
    where: { id: job.id },
    select: jobSelect,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function listJobsForAdmin(admin: CurrentUser, status: JobStatus) {
  requireRole(admin, "ADMIN");
  return getDb().job.findMany({
    where: { status },
    // FR-ADM-009: the approval queue is oldest first.
    orderBy:
      status === "PENDING_APPROVAL"
        ? { submittedAt: "asc" }
        : { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
      company: { select: { name: true } },
    },
  });
}

export async function countJobsByStatus(admin: CurrentUser) {
  requireRole(admin, "ADMIN");
  const rows = await getDb().job.groupBy({ by: ["status"], _count: true });
  const counts = Object.fromEntries(
    (
      [
        "DRAFT",
        "PENDING_APPROVAL",
        "PUBLISHED",
        "PAUSED",
        "REJECTED",
        "CLOSED",
        "REMOVED",
      ] as const
    ).map((s) => [s, 0]),
  ) as Record<JobStatus, number>;
  for (const r of rows) counts[r.status] = r._count;
  return counts;
}

export async function getJobForAdmin(
  admin: CurrentUser,
  jobId: string,
): Promise<JobView> {
  requireRole(admin, "ADMIN");
  const job = await getDb().job.findUnique({
    where: { id: jobId },
    select: jobSelect,
  });
  if (!job) throw notFound("This job");
  return job;
}

const OUTCOME = {
  approve: "approved",
  reject: "rejected",
  remove: "removed",
} as const;

/** FR-ADM-010/011: approve, reject or remove; audited in the same transaction; employer emailed. */
export async function decideJob(
  admin: CurrentUser,
  jobId: string,
  action: AdminJobAction,
  reason: string | null,
  meta: RequestMeta,
): Promise<JobView> {
  requireRole(admin, "ADMIN");
  const rule = ADMIN_TRANSITIONS[action];
  if (rule.needsReason && !reason)
    throw fieldError("reason", "Tell the employer why.");
  const started = Date.now();
  const db = getDb();
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: {
      company: { include: { owner: { select: { name: true, email: true } } } },
    },
  });
  if (!job) throw notFound("This job");
  if (!rule.from.includes(job.status)) {
    throw invalidTransition(
      `This job can't be ${OUTCOME[action]} in its current state.`,
    );
  }
  if (action === "approve" && job.company.verificationStatus !== "VERIFIED") {
    throw new DomainError(
      422,
      "COMPANY_NOT_VERIFIED",
      "The company isn't verified (any more).",
    );
  }

  await db.$transaction(async (tx) => {
    const { count } = await tx.job.updateMany({
      where: { id: jobId, status: job.status },
      data: {
        status: rule.to,
        statusReason: rule.needsReason ? reason : null,
        ...(action === "approve"
          ? { publishedAt: job.publishedAt ?? new Date() }
          : {}),
        ...(action === "remove" ? { closedAt: new Date() } : {}),
      },
    });
    if (count === 0) throw stateChanged();
    await recordAudit(tx, {
      action: `job.${OUTCOME[action]}`,
      actor: { userId: admin.id, role: "ADMIN" },
      target: { type: "job", id: jobId },
      requestId: meta.requestId,
      metadata: {
        from: job.status,
        to: rule.to,
        reason: rule.needsReason ? reason : null,
      },
    });
  });

  const log = requestLogger(meta.requestId);
  log.info(
    { jobId, action, ms: Date.now() - started },
    "job decision committed",
  );
  const owner = job.company.owner;
  if (owner) {
    sendEmailInBackground(
      jobDecisionEmail({
        to: owner.email,
        name: owner.name,
        jobTitle: job.title,
        outcome: OUTCOME[action],
        reason: rule.needsReason ? reason : null,
        url: `${env().BETTER_AUTH_URL}/employer/jobs/${jobId}`,
      }),
      log,
      "job decision",
    );
  }

  return db.job.findUniqueOrThrow({ where: { id: jobId }, select: jobSelect });
}
