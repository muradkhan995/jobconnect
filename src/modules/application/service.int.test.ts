// Profiles, CVs and applying – real PostgreSQL + s3mock (FR-CAN-001/005/010…013, BR-APP-001…003).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getDb } = await import("@/lib/db");
const { uuidv7 } = await import("@/lib/uuidv7");
const candidates = await import("@/modules/candidate/service");
const applications = await import("./service");
const db = getDb();
const meta = { requestId: "int-test" };

const IT = "01a1cd0d-dc07-78b7-898d-42f24fd57db7";
const userIds: string[] = [];
const companyIds: string[] = [];
type U = {
  id: string;
  email: string;
  name: string;
  role: "CANDIDATE" | "EMPLOYER" | "ADMIN";
};

async function makeUser(role: U["role"]): Promise<U> {
  const id = uuidv7();
  const u = {
    id,
    email: `int-app-${role.toLowerCase()}-${id}@example.com`,
    name: `Test ${role}`,
    role,
  };
  await db.user.create({
    data: {
      ...u,
      emailVerified: true,
      privacyConsentAt: new Date(),
      privacyPolicyVersion: "t",
    },
  });
  userIds.push(id);
  return u;
}

async function makeCandidate() {
  const user = await makeUser("CANDIDATE");
  await candidates.saveMyProfile(user, {
    fullName: "Amira Test",
    headline: null,
    location: "Leeds",
    phone: null,
  });
  return user;
}

const pdf = (text = "hello") => ({
  name: "My CV.pdf",
  bytes: new TextEncoder().encode(`%PDF-1.7 ${text}`),
});

async function publishedJob(
  over: { deadline?: Date; status?: "PUBLISHED" | "PAUSED" } = {},
) {
  const owner = await makeUser("EMPLOYER");
  const companyId = uuidv7();
  await db.company.create({
    data: {
      id: companyId,
      ownerUserId: owner.id,
      name: "Apply Co",
      description: "Company for application tests.",
      industryId: IT,
      size: "SIZE_1_10",
      location: "Leeds",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
    },
  });
  companyIds.push(companyId);
  const job = await db.job.create({
    data: {
      id: uuidv7(),
      companyId,
      title: "Apply Test Job",
      description: "A job used by the application integration tests in Leeds.",
      requirements: "None really.",
      location: "Leeds",
      workMode: "ON_SITE",
      jobType: "FULL_TIME",
      experienceLevel: "MID",
      industryId: IT,
      salaryMin: 1,
      salaryMax: 2,
      deadline: over.deadline ?? new Date(Date.now() + 7 * 86_400_000),
      status: over.status ?? "PUBLISHED",
      publishedAt: new Date(),
    },
  });
  return job.id;
}

beforeAll(async () => {
  const res = await fetch("http://localhost:9090/jobconnect-cvs").catch(
    () => null,
  );
  if (!res)
    throw new Error("s3mock is not running – start it with `npm run db:up`");
});

afterAll(async () => {
  await db.application.deleteMany({
    where: { job: { companyId: { in: companyIds } } },
  });
  await db.job.deleteMany({ where: { companyId: { in: companyIds } } });
  await db.company.deleteMany({ where: { id: { in: companyIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("profile and CVs (FR-CAN-001/005)", () => {
  it("needs a profile before uploading", async () => {
    const user = await makeUser("CANDIDATE");
    await expect(candidates.uploadCv(user, pdf(), meta)).rejects.toMatchObject({
      code: "PROFILE_REQUIRED",
    });
  });

  it("stores a PDF with a clean name and gives a download link only to its owner", async () => {
    const me = await makeCandidate();
    const other = await makeCandidate();
    const cv = await candidates.uploadCv(
      me,
      { name: "../../My CV.PDF", bytes: pdf().bytes },
      meta,
    );
    expect(cv).toMatchObject({
      originalFilename: "My CV.pdf",
      mimeType: "application/pdf",
    });
    const { url } = await candidates.myCvDownloadUrl(me, cv.id);
    expect(await (await fetch(url)).text()).toContain("%PDF-");
    await expect(
      candidates.myCvDownloadUrl(other, cv.id),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      candidates.deleteMyCv(other, cv.id, meta),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("refuses a file that isn't really a PDF or Word document", async () => {
    const me = await makeCandidate();
    const fake = {
      name: "cv.pdf",
      bytes: new TextEncoder().encode("<script>alert(1)</script>"),
    };
    await expect(candidates.uploadCv(me, fake, meta)).rejects.toMatchObject({
      status: 415,
    });
  });

  it("keeps at most 5 CVs, even when uploads arrive at the same time", async () => {
    const me = await makeCandidate();
    const results = await Promise.allSettled(
      Array.from({ length: 7 }, (_, i) =>
        candidates.uploadCv(me, pdf(String(i)), meta),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(2);
    expect(await db.cv.count({ where: { candidateId: me.id } })).toBe(5);
  });
});

describe("applying (FR-CAN-010/011/012, BR-APP-001…003)", () => {
  it("applies once, with a CV snapshot and an APPLIED history entry", async () => {
    const me = await makeCandidate();
    const cv = await candidates.uploadCv(me, pdf("original"), meta);
    const jobId = await publishedJob();
    const app = await applications.applyForJob(
      me,
      { jobId, cvId: cv.id, coverLetter: "Hello" },
      meta,
    );
    expect(app.status).toBe("APPLIED");
    const stored = await db.application.findUniqueOrThrow({
      where: { id: app.id },
      include: { history: true },
    });
    expect(stored.cvStorageKey).not.toBe(
      (await db.cv.findUniqueOrThrow({ where: { id: cv.id } })).storageKey,
    );
    expect(stored.history.map((h) => h.toStatus)).toEqual(["APPLIED"]);
  });

  it("refuses a second application to the same job – also after deleting the CV (BR-APP-002)", async () => {
    const me = await makeCandidate();
    const cv = await candidates.uploadCv(me, pdf(), meta);
    const jobId = await publishedJob();
    await applications.applyForJob(
      me,
      { jobId, cvId: cv.id, coverLetter: null },
      meta,
    );
    const cv2 = await candidates.uploadCv(me, pdf("v2"), meta);
    await expect(
      applications.applyForJob(
        me,
        { jobId, cvId: cv2.id, coverLetter: null },
        meta,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: "ALREADY_APPLIED",
    });
  });

  it("lets only one of two simultaneous applications through", async () => {
    const me = await makeCandidate();
    const cv = await candidates.uploadCv(me, pdf(), meta);
    const jobId = await publishedJob();
    const results = await Promise.allSettled([
      applications.applyForJob(
        me,
        { jobId, cvId: cv.id, coverLetter: null },
        meta,
      ),
      applications.applyForJob(
        me,
        { jobId, cvId: cv.id, coverLetter: null },
        meta,
      ),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.application.count({ where: { jobId } })).toBe(1);
  });

  it("keeps the submitted CV when the candidate later deletes theirs (BR-APP-003)", async () => {
    const me = await makeCandidate();
    const cv = await candidates.uploadCv(me, pdf("snapshot me"), meta);
    const jobId = await publishedJob();
    const app = await applications.applyForJob(
      me,
      { jobId, cvId: cv.id, coverLetter: null },
      meta,
    );
    await candidates.deleteMyCv(me, cv.id, meta);
    const stored = await db.application.findUniqueOrThrow({
      where: { id: app.id },
    });
    const res = await fetch(
      `http://localhost:9090/jobconnect-cvs/${stored.cvStorageKey}`,
    );
    expect(await res.text()).toContain("snapshot me");
  });

  it("refuses jobs past their deadline (422) and hidden jobs (404)", async () => {
    const me = await makeCandidate();
    const cv = await candidates.uploadCv(me, pdf(), meta);
    const expired = await publishedJob({
      deadline: new Date(Date.now() - 60_000),
    });
    await expect(
      applications.applyForJob(
        me,
        { jobId: expired, cvId: cv.id, coverLetter: null },
        meta,
      ),
    ).rejects.toMatchObject({
      status: 422,
      code: "DEADLINE_PASSED",
    });
    const paused = await publishedJob({ status: "PAUSED" });
    await expect(
      applications.applyForJob(
        me,
        { jobId: paused, cvId: cv.id, coverLetter: null },
        meta,
      ),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it("refuses someone else's CV", async () => {
    const me = await makeCandidate();
    const other = await makeCandidate();
    const theirs = await candidates.uploadCv(other, pdf(), meta);
    const jobId = await publishedJob();
    await expect(
      applications.applyForJob(
        me,
        { jobId, cvId: theirs.id, coverLetter: null },
        meta,
      ),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it("is for candidates only", async () => {
    const employer = await makeUser("EMPLOYER");
    const jobId = await publishedJob();
    await expect(
      applications.applyForJob(
        employer,
        { jobId, cvId: uuidv7(), coverLetter: null },
        meta,
      ),
    ).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe("privacy between candidates (MVP acceptance criterion)", () => {
  it("never shows a candidate another candidate's applications", async () => {
    const me = await makeCandidate();
    const other = await makeCandidate();
    const cv = await candidates.uploadCv(other, pdf(), meta);
    const jobId = await publishedJob();
    const theirs = await applications.applyForJob(
      other,
      { jobId, cvId: cv.id, coverLetter: "Private" },
      meta,
    );
    expect(await applications.listMyApplications(me)).toEqual([]);
    await expect(
      applications.getMyApplication(me, theirs.id),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      (await applications.listMyApplications(other)).map((a) => a.id),
    ).toEqual([theirs.id]);
  });
});

describe("database rules", () => {
  it("rejects an unsupported file type or an oversized CV row", async () => {
    const me = await makeCandidate();
    const base = {
      candidateId: me.id,
      originalFilename: "x",
      scanStatus: "SKIPPED" as const,
    };
    await expect(
      db.cv.create({
        data: {
          ...base,
          id: uuidv7(),
          storageKey: uuidv7(),
          mimeType: "text/html",
          sizeBytes: 10,
        },
      }),
    ).rejects.toThrow(/cv_mime_type/);
    await expect(
      db.cv.create({
        data: {
          ...base,
          id: uuidv7(),
          storageKey: uuidv7(),
          mimeType: "application/pdf",
          sizeBytes: 6_000_000,
        },
      }),
    ).rejects.toThrow(/cv_size_bytes/);
  });
});
