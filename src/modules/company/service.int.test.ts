// Company service against real PostgreSQL + Mailpit (FR-EMP-001/003/004, FR-ADM-007/008, BR §2).
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getDb } = await import("@/lib/db");
const { uuidv7 } = await import("@/lib/uuidv7");
const svc = await import("./service");
const db = getDb();

const IT = "01a1cd0d-dc07-78b7-898d-42f24fd57db7"; // "Information Technology" (seeded)
const created: string[] = [];

async function makeUser(role: "CANDIDATE" | "EMPLOYER" | "ADMIN") {
  const id = uuidv7();
  const email = `int-co-${role.toLowerCase()}-${id}@example.com`;
  await db.user.create({
    data: {
      id,
      email,
      name: `Test ${role}`,
      role,
      emailVerified: true,
      privacyConsentAt: new Date(),
      privacyPolicyVersion: "test",
    },
  });
  created.push(id);
  return { id, email, name: `Test ${role}`, role };
}

const input = {
  name: "Integration Ltd",
  description:
    "We build integration tests for a living, across the whole of the UK.",
  industryId: IT,
  size: "SIZE_11_50" as const,
  location: "Leeds",
  website: null,
};
const meta = { requestId: "int-test" };

afterAll(async () => {
  await db.company.deleteMany({ where: { ownerUserId: { in: created } } });
  await db.user.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
});

describe("employer", () => {
  it("creates exactly one company, in PENDING", async () => {
    const employer = await makeUser("EMPLOYER");
    const company = await svc.createMyCompany(employer, input);
    expect(company.verificationStatus).toBe("PENDING");
    await expect(svc.createMyCompany(employer, input)).rejects.toMatchObject({
      status: 409,
      code: "COMPANY_EXISTS",
    });
  });

  it("only ever sees its own company", async () => {
    const a = await makeUser("EMPLOYER");
    const b = await makeUser("EMPLOYER");
    await svc.createMyCompany(a, { ...input, name: "Company A" });
    expect(await svc.getMyCompany(b)).toBeNull();
    expect((await svc.getMyCompany(a))?.name).toBe("Company A");
  });

  it("refuses non-employers", async () => {
    const candidate = await makeUser("CANDIDATE");
    await expect(svc.createMyCompany(candidate, input)).rejects.toMatchObject({
      status: 403,
    });
    await expect(svc.getMyCompany(candidate)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("refuses an inactive or unknown industry", async () => {
    const employer = await makeUser("EMPLOYER");
    await expect(
      svc.createMyCompany(employer, { ...input, industryId: uuidv7() }),
    ).rejects.toMatchObject({
      status: 400,
      fieldErrors: [{ field: "industryId" }],
    });
  });
});

describe("admin decisions", () => {
  it("rejects with a reason, the employer resubmits by editing, then it is verified", async () => {
    const employer = await makeUser("EMPLOYER");
    const admin = await makeUser("ADMIN");
    const { id } = await svc.createMyCompany(employer, input);

    const rejected = await svc.decideCompany(
      admin,
      id,
      "reject",
      "Website missing.",
      meta,
    );
    expect(rejected).toMatchObject({
      verificationStatus: "REJECTED",
      statusReason: "Website missing.",
    });

    const resubmitted = await svc.updateMyCompany(employer, {
      ...input,
      website: "https://x.example",
    });
    expect(resubmitted).toMatchObject({
      verificationStatus: "PENDING",
      statusReason: null,
    });

    const verified = await svc.decideCompany(admin, id, "verify", null, meta);
    expect(verified.verificationStatus).toBe("VERIFIED");
    expect(verified.verifiedAt).toBeInstanceOf(Date);
  });

  it("writes the audit entry with the decision (FR-ADM-019)", async () => {
    const employer = await makeUser("EMPLOYER");
    const admin = await makeUser("ADMIN");
    const { id } = await svc.createMyCompany(employer, input);
    await svc.decideCompany(admin, id, "reject", "Not a real company.", meta);
    const entry = await db.auditLog.findFirst({
      where: { targetId: id, action: "company.rejected" },
    });
    expect(entry).toMatchObject({ actorUserId: admin.id, actorRole: "ADMIN" });
    expect(entry?.metadata).toMatchObject({ from: "PENDING", to: "REJECTED" });
  });

  it("refuses transitions the lifecycle doesn't allow", async () => {
    const employer = await makeUser("EMPLOYER");
    const admin = await makeUser("ADMIN");
    const { id } = await svc.createMyCompany(employer, input);
    await expect(
      svc.decideCompany(admin, id, "suspend", "Because.", meta),
    ).rejects.toMatchObject({
      status: 409,
      code: "INVALID_TRANSITION",
    });
    await expect(
      svc.decideCompany(admin, id, "reinstate", null, meta),
    ).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });

  it("requires a reason to reject or suspend (BR-CMP-002)", async () => {
    const employer = await makeUser("EMPLOYER");
    const admin = await makeUser("ADMIN");
    const { id } = await svc.createMyCompany(employer, input);
    await expect(
      svc.decideCompany(admin, id, "reject", null, meta),
    ).rejects.toMatchObject({
      status: 400,
    });
  });

  it("lets only one of two simultaneous decisions win (guarded update, docs/05-design/01-data-model.md §4)", async () => {
    const employer = await makeUser("EMPLOYER");
    const admin = await makeUser("ADMIN");
    const { id } = await svc.createMyCompany(employer, input);
    const results = await Promise.allSettled([
      svc.decideCompany(admin, id, "verify", null, meta),
      svc.decideCompany(admin, id, "reject", "Too slow!", meta),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const audits = await db.auditLog.count({ where: { targetId: id } });
    expect(audits).toBe(1); // the losing decision left no audit entry behind
  });

  it("blocks employers from editing while suspended", async () => {
    const employer = await makeUser("EMPLOYER");
    const admin = await makeUser("ADMIN");
    const { id } = await svc.createMyCompany(employer, input);
    await svc.decideCompany(admin, id, "verify", null, meta);
    await svc.decideCompany(admin, id, "suspend", "Reported as a scam.", meta);
    await expect(svc.updateMyCompany(employer, input)).rejects.toMatchObject({
      status: 409,
    });
  });

  it("is admin-only", async () => {
    const employer = await makeUser("EMPLOYER");
    const { id } = await svc.createMyCompany(employer, input);
    await expect(
      svc.decideCompany(employer, id, "verify", null, meta),
    ).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      svc.listCompaniesForAdmin(employer, "PENDING"),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it("lists the queue oldest first (FR-ADM-007)", async () => {
    const admin = await makeUser("ADMIN");
    const queue = await svc.listCompaniesForAdmin(admin, "PENDING");
    const times = queue.map((c) => c.submittedAt.getTime());
    expect(times).toEqual([...times].sort((x, y) => x - y));
  });
});

describe("database rules", () => {
  it("rejects a REJECTED company without a reason", async () => {
    const employer = await makeUser("EMPLOYER");
    const { id } = await svc.createMyCompany(employer, input);
    await expect(
      db.company.update({
        where: { id },
        data: { verificationStatus: "REJECTED" },
      }),
    ).rejects.toThrow(/company_status_reason/);
  });

  it("rejects a non-https website", async () => {
    const employer = await makeUser("EMPLOYER");
    const { id } = await svc.createMyCompany(employer, input);
    await expect(
      db.company.update({
        where: { id },
        data: { website: "http://insecure.example" },
      }),
    ).rejects.toThrow(/company_website_https/);
  });
});
