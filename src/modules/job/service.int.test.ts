// Job service against real PostgreSQL + Mailpit (FR-EMP-006…011, FR-ADM-009…011, BR §3).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getDb } = await import("@/lib/db");
const { uuidv7 } = await import("@/lib/uuidv7");
const companies = await import("@/modules/company/service");
const jobs = await import("./service");
const db = getDb();

const IT = "01a1cd0d-dc07-78b7-898d-42f24fd57db7";
const meta = { requestId: "int-test" };
const users: string[] = [];
type U = {
  id: string;
  email: string;
  name: string;
  role: "CANDIDATE" | "EMPLOYER" | "ADMIN";
};

async function makeUser(role: U["role"]): Promise<U> {
  const id = uuidv7();
  const user = {
    id,
    email: `int-job-${role.toLowerCase()}-${id}@example.com`,
    name: `Test ${role}`,
    role,
  };
  await db.user.create({
    data: {
      ...user,
      emailVerified: true,
      privacyConsentAt: new Date(),
      privacyPolicyVersion: "test",
    },
  });
  users.push(id);
  return user;
}

const inDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const jobInput = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    title: "Software Engineer",
    description:
      "Build logistics software used by hundreds of independent shops in the UK.",
    requirements: "Three years of TypeScript in production.",
    workMode: "HYBRID",
    location: "Leeds",
    jobType: "FULL_TIME",
    experienceLevel: "MID",
    industryId: IT,
    salaryMin: 40000,
    salaryMax: 50000,
    salaryPeriod: "YEAR",
    deadline: inDays(30),
    ...over,
  }) as Parameters<typeof jobs.createJob>[1];

let admin: U;

async function employerWithCompany(verified = true) {
  const employer = await makeUser("EMPLOYER");
  const company = await companies.createMyCompany(employer, {
    name: "Jobs Integration Ltd",
    description: "A company created for job integration tests, based in Leeds.",
    industryId: IT,
    size: "SIZE_11_50",
    location: "Leeds",
    website: null,
  });
  if (verified)
    await companies.decideCompany(admin, company.id, "verify", null, meta);
  return { employer, company };
}

async function publishedJob() {
  const { employer, company } = await employerWithCompany();
  const job = await jobs.createJob(employer, jobInput());
  await jobs.employerJobAction(employer, job.id, "submit");
  await jobs.decideJob(admin, job.id, "approve", null, meta);
  return { employer, company, job };
}

beforeAll(async () => {
  admin = await makeUser("ADMIN");
});

afterAll(async () => {
  const owned = await db.company.findMany({
    where: { ownerUserId: { in: users } },
    select: { id: true },
  });
  await db.job.deleteMany({
    where: { companyId: { in: owned.map((c) => c.id) } },
  });
  await db.company.deleteMany({
    where: { id: { in: owned.map((c) => c.id) } },
  });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("drafts and submitting", () => {
  it("lets an unverified company write drafts but not submit them (BR-CMP-001)", async () => {
    const { employer } = await employerWithCompany(false);
    const job = await jobs.createJob(employer, jobInput());
    expect(job.status).toBe("DRAFT");
    await expect(
      jobs.employerJobAction(employer, job.id, "submit"),
    ).rejects.toMatchObject({
      status: 422,
      code: "COMPANY_NOT_VERIFIED",
    });
  });

  it("refuses a past closing date (FR-EMP-007)", async () => {
    const { employer } = await employerWithCompany();
    await expect(
      jobs.createJob(employer, jobInput({ deadline: inDays(-1) })),
    ).rejects.toMatchObject({
      status: 400,
      fieldErrors: [{ field: "deadline" }],
    });
  });

  it("only submits with a deadline 1–90 days away (BR-JOB-002)", async () => {
    const { employer } = await employerWithCompany();
    const job = await jobs.createJob(
      employer,
      jobInput({ deadline: inDays(120) }),
    );
    await expect(
      jobs.employerJobAction(employer, job.id, "submit"),
    ).rejects.toMatchObject({
      code: "DEADLINE_OUT_OF_RANGE",
    });
  });

  it("goes DRAFT → PENDING_APPROVAL → PUBLISHED with an audit entry (FR-EMP-008, FR-ADM-010)", async () => {
    const { job } = await publishedJob();
    const stored = await db.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(stored.status).toBe("PUBLISHED");
    expect(stored.publishedAt).toBeInstanceOf(Date);
    const audit = await db.auditLog.findFirst({
      where: { targetId: job.id, action: "job.approved" },
    });
    expect(audit?.actorUserId).toBe(admin.id);
  });
});

describe("ownership (API design §1.2)", () => {
  it("hides one employer's jobs from another (404, not 403)", async () => {
    const { employer } = await employerWithCompany();
    const { employer: other } = await employerWithCompany();
    const job = await jobs.createJob(employer, jobInput());
    await expect(jobs.getMyJob(other, job.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      jobs.updateJob(other, job.id, jobInput()),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      jobs.employerJobAction(other, job.id, "submit"),
    ).rejects.toMatchObject({ status: 404 });
    expect((await jobs.listMyJobs(other)).map((j) => j.id)).not.toContain(
      job.id,
    );
  });

  it("keeps candidates and employers out of admin actions", async () => {
    const { employer, job } = await publishedJob();
    const candidate = await makeUser("CANDIDATE");
    await expect(
      jobs.decideJob(employer, job.id, "remove", "x".repeat(20), meta),
    ).rejects.toMatchObject({
      status: 403,
    });
    await expect(jobs.createJob(candidate, jobInput())).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe("editing (BR-JOB-004/005)", () => {
  it("sends a live job back for approval on a material change", async () => {
    const { employer, job } = await publishedJob();
    const edited = await jobs.updateJob(
      employer,
      job.id,
      jobInput({ title: "Senior Software Engineer" }),
    );
    expect(edited.status).toBe("PENDING_APPROVAL");
  });

  it("keeps a live job live when only the deadline is extended", async () => {
    const { employer, job } = await publishedJob();
    const edited = await jobs.updateJob(
      employer,
      job.id,
      jobInput({ deadline: inDays(60) }),
    );
    expect(edited.status).toBe("PUBLISHED");
  });

  it("turns a rejected job back into a draft", async () => {
    const { employer } = await employerWithCompany();
    const job = await jobs.createJob(employer, jobInput());
    await jobs.employerJobAction(employer, job.id, "submit");
    await jobs.decideJob(
      admin,
      job.id,
      "reject",
      "Salary looks unrealistic.",
      meta,
    );
    const edited = await jobs.updateJob(employer, job.id, jobInput());
    expect(edited).toMatchObject({ status: "DRAFT", statusReason: null });
  });
});

describe("pause, resume, close, remove", () => {
  it("pauses and resumes (FR-EMP-010)", async () => {
    const { employer, job } = await publishedJob();
    expect(
      (await jobs.employerJobAction(employer, job.id, "pause")).status,
    ).toBe("PAUSED");
    expect(
      (await jobs.employerJobAction(employer, job.id, "resume")).status,
    ).toBe("PUBLISHED");
  });

  it("closes for good (FR-EMP-011, BR-JOB-007)", async () => {
    const { employer, job } = await publishedJob();
    const closed = await jobs.employerJobAction(employer, job.id, "close");
    expect(closed.status).toBe("CLOSED");
    expect(closed.closedAt).toBeInstanceOf(Date);
    await expect(
      jobs.updateJob(employer, job.id, jobInput()),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      jobs.employerJobAction(employer, job.id, "resume"),
    ).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });

  it("lets an admin remove a live job with a reason (FR-ADM-011)", async () => {
    const { job } = await publishedJob();
    await expect(
      jobs.decideJob(admin, job.id, "remove", null, meta),
    ).rejects.toMatchObject({
      status: 400,
    });
    const removed = await jobs.decideJob(
      admin,
      job.id,
      "remove",
      "Asks candidates for a fee.",
      meta,
    );
    expect(removed).toMatchObject({
      status: "REMOVED",
      statusReason: "Asks candidates for a fee.",
    });
  });

  it("won't approve a job whose company was suspended meanwhile", async () => {
    const { employer, company } = await employerWithCompany();
    const job = await jobs.createJob(employer, jobInput());
    await jobs.employerJobAction(employer, job.id, "submit");
    await companies.decideCompany(
      admin,
      company.id,
      "suspend",
      "Reported as a scam.",
      meta,
    );
    await expect(
      jobs.decideJob(admin, job.id, "approve", null, meta),
    ).rejects.toMatchObject({
      code: "COMPANY_NOT_VERIFIED",
    });
  });

  it("lets only one of two simultaneous admin decisions win", async () => {
    const { employer } = await employerWithCompany();
    const job = await jobs.createJob(employer, jobInput());
    await jobs.employerJobAction(employer, job.id, "submit");
    const results = await Promise.allSettled([
      jobs.decideJob(admin, job.id, "approve", null, meta),
      jobs.decideJob(admin, job.id, "reject", "Too vague about pay.", meta),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.auditLog.count({ where: { targetId: job.id } })).toBe(1);
  });
});

describe("admin queue", () => {
  it("lists pending jobs oldest first (FR-ADM-009)", async () => {
    const queue = await jobs.listJobsForAdmin(admin, "PENDING_APPROVAL");
    const times = queue.map((j) => j.submittedAt?.getTime() ?? 0);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe("database rules", () => {
  it("rejects max salary below min, and a missing location for on-site jobs", async () => {
    const { employer } = await employerWithCompany();
    const job = await jobs.createJob(employer, jobInput());
    await expect(
      db.job.update({ where: { id: job.id }, data: { salaryMax: 1 } }),
    ).rejects.toThrow(/job_salary_range/);
    await expect(
      db.job.update({ where: { id: job.id }, data: { location: null } }),
    ).rejects.toThrow(/job_location_unless_remote/);
  });

  it("rejects a REMOVED job without a reason", async () => {
    const { job } = await publishedJob();
    await expect(
      db.job.update({ where: { id: job.id }, data: { status: "REMOVED" } }),
    ).rejects.toThrow(/job_status_reason/);
  });
});
