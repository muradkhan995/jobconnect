// Public job search against real PostgreSQL (FR-CAN-006…008, BR-JOB-001, BR-CMP-003, BR-USR-002).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getDb } = await import("@/lib/db");
const { uuidv7 } = await import("@/lib/uuidv7");
const { parseSearchParams } = await import("./search-params");
const { searchJobs, getPublicJob, isJobVisible, toPublicJob } =
  await import("./search");
const db = getDb();

const IT = "01a1cd0d-dc07-78b7-898d-42f24fd57db7";
// A made-up word only this test run uses, so other local data never matches.
const TOKEN = `zq${Date.now().toString(36)}`;
const userIds: string[] = [];
const companyIds: string[] = [];

type JobOver = Partial<{
  title: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "PUBLISHED"
    | "PAUSED"
    | "REJECTED"
    | "CLOSED"
    | "REMOVED";
  statusReason: string | null;
  location: string | null;
  workMode: "ON_SITE" | "HYBRID" | "REMOTE";
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY" | "INTERNSHIP";
  deadline: Date;
  publishedAt: Date;
}>;

async function makeCompany(
  opts: {
    companyStatus?: "VERIFIED" | "SUSPENDED";
    ownerStatus?: "ACTIVE" | "SUSPENDED";
  } = {},
) {
  const userId = uuidv7();
  await db.user.create({
    data: {
      id: userId,
      email: `int-search-${userId}@example.com`,
      name: "Search Test",
      role: "EMPLOYER",
      emailVerified: true,
      status: opts.ownerStatus ?? "ACTIVE",
      statusReason: opts.ownerStatus === "SUSPENDED" ? "test" : null,
      privacyConsentAt: new Date(),
      privacyPolicyVersion: "test",
    },
  });
  const companyId = uuidv7();
  const status = opts.companyStatus ?? "VERIFIED";
  await db.company.create({
    data: {
      id: companyId,
      ownerUserId: userId,
      name: `Search Co ${companyId.slice(-4)}`,
      description: "Company for search integration tests.",
      industryId: IT,
      size: "SIZE_11_50",
      location: "Leeds",
      verificationStatus: status,
      verifiedAt: new Date(),
      statusReason: status === "SUSPENDED" ? "test" : null,
    },
  });
  userIds.push(userId);
  companyIds.push(companyId);
  return companyId;
}

let seq = 0;
async function makeJob(companyId: string, over: JobOver = {}) {
  const status = over.status ?? "PUBLISHED";
  const job = await db.job.create({
    data: {
      id: uuidv7(),
      companyId,
      title: over.title ?? `Engineer ${TOKEN}`,
      description: `A role for the ${TOKEN} search tests. Friendly team, good pay and training.`,
      requirements: "Communication skills.",
      location: over.location === undefined ? "Leeds" : over.location,
      workMode: over.workMode ?? "ON_SITE",
      jobType: over.jobType ?? "FULL_TIME",
      experienceLevel: "MID",
      industryId: IT,
      salaryMin: 30000,
      salaryMax: 40000,
      deadline: over.deadline ?? new Date(Date.now() + 30 * 86_400_000),
      status,
      statusReason:
        over.statusReason ??
        (status === "REJECTED" || status === "REMOVED" ? "test" : null),
      publishedAt:
        status === "PUBLISHED"
          ? (over.publishedAt ?? new Date(Date.now() - ++seq * 60_000))
          : over.publishedAt,
    },
  });
  return job.id;
}

const search = (query: string) =>
  searchJobs(parseSearchParams(new URLSearchParams(query)));
const ids = async (query: string) =>
  (await search(query)).items.map((j) => j.id);

let verified: string;

beforeAll(async () => {
  verified = await makeCompany();
});

afterAll(async () => {
  await db.job.deleteMany({ where: { companyId: { in: companyIds } } });
  await db.company.deleteMany({ where: { id: { in: companyIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("visibility – one rule for search, details and the proxy (BR-JOB-001)", () => {
  it("shows a published job of a verified company with an active owner", async () => {
    const id = await makeJob(verified);
    expect(await ids(`q=${TOKEN}`)).toContain(id);
    expect(await isJobVisible(id)).toBe(true);
    expect((await getPublicJob(id)).id).toBe(id);
  });

  it.each([
    "DRAFT",
    "PENDING_APPROVAL",
    "PAUSED",
    "REJECTED",
    "CLOSED",
    "REMOVED",
  ] as const)("hides %s jobs everywhere", async (status) => {
    const id = await makeJob(verified, { status });
    expect(await ids(`q=${TOKEN}`)).not.toContain(id);
    expect(await isJobVisible(id)).toBe(false);
    await expect(getPublicJob(id)).rejects.toMatchObject({ status: 404 });
  });

  it("hides published jobs past their deadline", async () => {
    const id = await makeJob(verified, {
      deadline: new Date(Date.now() - 60_000),
    });
    expect(await isJobVisible(id)).toBe(false);
  });

  it("hides jobs of a suspended company (BR-CMP-003)", async () => {
    const suspended = await makeCompany({ companyStatus: "SUSPENDED" });
    const id = await makeJob(suspended);
    expect(await ids(`q=${TOKEN}`)).not.toContain(id);
    expect(await isJobVisible(id)).toBe(false);
  });

  it("hides jobs whose employer account is suspended (BR-USR-002)", async () => {
    const company = await makeCompany({ ownerStatus: "SUSPENDED" });
    const id = await makeJob(company);
    expect(await isJobVisible(id)).toBe(false);
  });

  it("treats unknown ids as not visible", async () => {
    expect(await isJobVisible(uuidv7())).toBe(false);
  });
});

describe("keyword and filters (FR-CAN-006/007)", () => {
  it("matches word forms (stemming) in title and description", async () => {
    const id = await makeJob(verified, { title: `Nursing assistant ${TOKEN}` });
    expect(await ids(`q=nurse ${TOKEN}`)).toContain(id); // "nurse" matches "Nursing"
  });

  it("filters by location (case-insensitive, part of a name)", async () => {
    const leeds = await makeJob(verified, { location: "Leeds City Centre" });
    const york = await makeJob(verified, { location: "York" });
    const found = await ids(`q=${TOKEN}&location=leeds`);
    expect(found).toContain(leeds);
    expect(found).not.toContain(york);
  });

  it("treats % and _ in the location as plain characters", async () => {
    const id = await makeJob(verified, { location: "Leeds" });
    expect(await ids(`q=${TOKEN}&location=%25`)).not.toContain(id); // "%" must not match everything
  });

  it("filters by several work modes and job types", async () => {
    const remote = await makeJob(verified, {
      workMode: "REMOTE",
      location: null,
      jobType: "CONTRACT",
    });
    const onsite = await makeJob(verified, {
      workMode: "ON_SITE",
      jobType: "CONTRACT",
    });
    const hybridFull = await makeJob(verified, {
      workMode: "HYBRID",
      jobType: "FULL_TIME",
    });
    const found = await ids(
      `q=${TOKEN}&workMode=REMOTE&workMode=HYBRID&jobType=CONTRACT`,
    );
    expect(found).toContain(remote);
    expect(found).not.toContain(onsite);
    expect(found).not.toContain(hybridFull);
  });

  it("treats keyword input as words, never as SQL", async () => {
    await expect(
      search(`q=${encodeURIComponent("'); DROP TABLE job; --")}`),
    ).resolves.toBeDefined();
    expect(await db.job.count()).toBeGreaterThan(0);
  });
});

describe("pagination (API design §3)", () => {
  it("walks every result once, newest first, with a correct total", async () => {
    const company = await makeCompany();
    const pageToken = `${TOKEN}p`;
    const created: string[] = [];
    // Published one second apart: the last one created is the newest.
    const base = Date.now() - 3_600_000;
    for (let i = 0; i < 7; i++) {
      created.push(
        await makeJob(company, {
          title: `Porter ${pageToken}`,
          publishedAt: new Date(base + i * 1000),
        }),
      );
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    let total = 0;
    do {
      const res = await search(
        `q=${pageToken}&limit=3${cursor ? `&cursor=${cursor}` : ""}`,
      );
      total = res.total;
      seen.push(...res.items.map((j) => j.id));
      cursor = res.nextCursor;
    } while (cursor);

    expect(total).toBe(7);
    expect(new Set(seen).size).toBe(7);
    expect(seen).toEqual([...created].reverse()); // newest published first
  });
});

describe("public shape", () => {
  it("exposes only the allow-listed fields", async () => {
    const id = await makeJob(verified);
    const pub = toPublicJob(await getPublicJob(id));
    expect(pub).not.toHaveProperty("statusReason");
    expect(pub).not.toHaveProperty("status");
    expect(pub).not.toHaveProperty("submittedAt");
    expect(pub.company).toEqual(expect.objectContaining({ verified: true }));
  });
});
